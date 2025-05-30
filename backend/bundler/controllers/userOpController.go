package controllers

import (
	"context"
	"crypto/ecdsa"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"math/big"
	"net/http"
	"os"
	"strings"

	"bundler/models"

	"github.com/ethereum/go-ethereum/accounts/abi"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/core/types"
	"github.com/ethereum/go-ethereum/crypto"
	"github.com/ethereum/go-ethereum/ethclient"
	"github.com/gin-gonic/gin"
)

const (
	entryPointAddress = "0x1A5C9969F47Ef041c3A359ae4ae9fd9E70eA5653"
)

type UserOpController struct {
	Client *ethclient.Client
}

func NewUserOpController() (*UserOpController, error) {
	rpcURL := os.Getenv("RPC_URL")
	if rpcURL == "" {
		return nil, errors.New("RPC_URL not set in environment")
	}

	client, err := ethclient.Dial(rpcURL)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to Ethereum client: %w", err)
	}

	return &UserOpController{Client: client}, nil
}

func (ctrl *UserOpController) StoreUserOp(c *gin.Context) {
	var request models.UserOpRequest

	// 获取并打印原始请求体
	rawData, err := c.GetRawData()
	if err != nil {
		log.Println("Failed to read request body:", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "failed to read request body"})
		return
	}
	fmt.Println("Received JSON:", string(rawData))

	// 绑定 JSON
	if err := json.Unmarshal(rawData, &request); err != nil {
		log.Println("Failed to parse JSON:", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("invalid request body: %v", err)})
		return
	}

	userOp := request.UserOp

	// 验证 Nonce
	if userOp.Nonce == nil {
		log.Println("Nonce is required or failed to parse")
		c.JSON(http.StatusBadRequest, gin.H{"error": "nonce is required or failed to parse"})
		return
	}
	fmt.Println("Parsed Nonce:", userOp.Nonce.String())

	// 验证 PreVerificationGas
	if userOp.PreVerificationGas == nil {
		log.Println("PreVerificationGas is required or failed to parse")
		c.JSON(http.StatusBadRequest, gin.H{"error": "preVerificationGas is required or failed to parse"})
		return
	}
	fmt.Println("Parsed PreVerificationGas:", userOp.PreVerificationGas.String())

	// 验证并解码字段
	initCode, err := hexStringToBytes(userOp.InitCode)
	if err != nil {
		log.Println("Invalid initCode:", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("invalid initCode: %v", err)})
		return
	}

	callData, err := hexStringToBytes(userOp.CallData)
	if err != nil {
		log.Println("Invalid callData:", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("invalid callData: %v", err)})
		return
	}

	accountGasLimits, err := hexStringToBytes(userOp.AccountGasLimits)
	if err != nil {
		log.Println("Invalid accountGasLimits:", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("invalid accountGasLimits: %v", err)})
		return
	}

	gasFees, err := hexStringToBytes(userOp.GasFees)
	if err != nil {
		log.Println("Invalid gasFees:", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("invalid gasFees: %v", err)})
		return
	}

	paymasterAndData, err := hexStringToBytes(userOp.PaymasterAndData)
	if err != nil {
		log.Println("Invalid paymasterAndData:", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("invalid paymasterAndData: %v", err)})
		return
	}

	signature, err := hexStringToBytes(userOp.Signature)
	if err != nil {
		log.Println("Invalid signature:", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("invalid signature: %v", err)})
		return
	}

	// 处理并发送 UserOp
	txHash, err := ctrl.processAndSendUserOp(userOp, initCode, callData, accountGasLimits, gasFees, paymasterAndData, signature)
	if err != nil {
		log.Println("Failed to process and send UserOp:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "UserOp received and sent", "transactionHash": txHash})
}

func hexStringToBytes(hexStr string) ([]byte, error) {
	if strings.HasPrefix(hexStr, "0x") || strings.HasPrefix(hexStr, "0X") {
		hexStr = hexStr[2:]
	}
	if len(hexStr)%2 != 0 {
		return nil, errors.New("invalid hex string length")
	}
	bytes, err := hex.DecodeString(hexStr)
	if err != nil {
		return nil, err
	}
	return bytes, nil
}

func (ctrl *UserOpController) processAndSendUserOp(userOp models.PackedUserOperation, initCode, callData, accountGasLimits, gasFees, paymasterAndData, signature []byte) (string, error) {
	privateKey := os.Getenv("PRIVATE_KEY")
	abiPath := os.Getenv("EntryPoint_ABI")
	fmt.Println("PRIVATE_KEY:", privateKey[:6]+"...")
	fmt.Println("EntryPoint_ABI path:", abiPath)
	if privateKey == "" || abiPath == "" {
		return "", errors.New("PRIVATE_KEY or EntryPoint_ABI not set in environment")
	}

	privateKeyECDSA, err := crypto.HexToECDSA(privateKey)
	if err != nil {
		return "", fmt.Errorf("error converting private key: %v", err)
	}
	fmt.Println("Private key parsed successfully")

	publicKey := privateKeyECDSA.Public()
	publicKeyECDSA, ok := publicKey.(*ecdsa.PublicKey)
	if !ok {
		return "", errors.New("error asserting type of public key")
	}

	fromAddress := crypto.PubkeyToAddress(*publicKeyECDSA)
	fmt.Println("From address:", fromAddress.Hex())

	abiData, err := os.ReadFile(abiPath)
	if err != nil {
		fmt.Println("Failed to read ABI file:", err)
		return "", fmt.Errorf("error reading ABI file: %v", err)
	}
	fmt.Println("ABI file read successfully")

	var contractAbi abi.ABI
	if err := json.Unmarshal(abiData, &contractAbi); err != nil {
		return "", fmt.Errorf("error parsing ABI: %v", err)
	}
	fmt.Println("ABI parsed successfully")

	ops := []struct {
		Sender             common.Address
		Nonce              *big.Int
		InitCode           []byte
		CallData           []byte
		AccountGasLimits   [32]byte
		PreVerificationGas *big.Int
		GasFees            [32]byte
		PaymasterAndData   []byte
		Signature          []byte
	}{
		{
			Sender:             userOp.Sender,
			Nonce:              userOp.Nonce,
			InitCode:           initCode,
			CallData:           callData,
			AccountGasLimits:   toFixedSizeByteArray(accountGasLimits),
			PreVerificationGas: userOp.PreVerificationGas,
			GasFees:            toFixedSizeByteArray(gasFees),
			PaymasterAndData:   paymasterAndData,
			Signature:          signature,
		},
	}

	beneficiary := fromAddress
	data, err := contractAbi.Pack("handleOps", ops, beneficiary)
	if err != nil {
		return "", fmt.Errorf("error packing data: %v", err)
	}
	fmt.Println("Data packed successfully")

	nonce, err := ctrl.Client.PendingNonceAt(context.Background(), fromAddress)
	if err != nil {
		return "", fmt.Errorf("error getting nonce: %v", err)
	}
	fmt.Println("Nonce retrieved:", nonce)

	gasPrice, err := ctrl.Client.SuggestGasPrice(context.Background())
	if err != nil {
		return "", fmt.Errorf("error getting gas price: %v", err)
	}
	fmt.Println("Gas price retrieved:", gasPrice.String())

	chainID, err := ctrl.Client.NetworkID(context.Background())
	if err != nil {
		return "", fmt.Errorf("error getting network ID: %v", err)
	}
	fmt.Println("Chain ID retrieved:", chainID.String())

	// 验证 Paymaster 余额
	paymasterAddress := common.HexToAddress("0x5B348AFbaC7ac1696D0ec658ccFA6a05C576e364")
	balance, err := ctrl.Client.BalanceAt(context.Background(), paymasterAddress, nil)
	if err != nil {
		log.Println("Failed to retrieve Paymaster balance:", err)
		return "", fmt.Errorf("failed to retrieve Paymaster balance: %v", err)
	}
	// 假设每个 UserOp 需要 10,000,000 Gas，计算预付款
	requiredPrefund := big.NewInt(20000000).Mul(big.NewInt(20000000), gasPrice)
	if balance.Cmp(requiredPrefund) < 0 {
		log.Println("Paymaster balance insufficient:", balance, "required:", requiredPrefund)
		return "", fmt.Errorf("Paymaster balance insufficient: current=%s, required=%s", balance.String(), requiredPrefund.String())
	}
	fmt.Println("Paymaster balance sufficient:", balance.String())

	// 构造交易
	value := big.NewInt(0)
	gasLimit := uint64(20000000) // 增加 Gas 限制
	toAddress := common.HexToAddress(entryPointAddress)
	tx := types.NewTransaction(nonce, toAddress, value, gasLimit, gasPrice, data)

	signedTx, err := types.SignTx(tx, types.NewEIP155Signer(chainID), privateKeyECDSA)
	if err != nil {
		log.Println("Failed to sign transaction:", err)
		return "", fmt.Errorf("error signing transaction: %v", err)
	}
	fmt.Println("Transaction signed successfully")

	// 发送交易
	err = ctrl.Client.SendTransaction(context.Background(), signedTx)
	if err != nil {
		log.Println("Failed to send transaction:", err)
		return "", fmt.Errorf("failed to send transaction: %v", err)
	}

	fmt.Printf("Transaction sent with hash: %s\n", signedTx.Hash().Hex())
	return signedTx.Hash().Hex(), nil
}

func toFixedSizeByteArray(data []byte) [32]byte {
	var array [32]byte
	copy(array[:], data)
	return array
}
