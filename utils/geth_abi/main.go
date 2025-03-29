package main

import (
	"bytes"
	"context"
	"crypto/ecdsa"
	"fmt"
	"math/big"
	"os"

	"github.com/ethereum/go-ethereum/accounts/abi"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/core/types"
	"github.com/ethereum/go-ethereum/crypto"
	"github.com/ethereum/go-ethereum/ethclient"
)

const (
	privateKey      = "619dd2168b65485c16227228d9c81ffdf397614561373a0338f8a7c3447eb299" // 私钥
	contractAddress = "0x5E234a6F237C98Ced332E71c7bC1fC3870203184"                       // 合约地址
)

func callAddMethod(client *ethclient.Client, privateKey, contract string) (string, error) {

	// 从私钥推导出公钥
	privateKeyECDSA, err := crypto.HexToECDSA(privateKey)
	if err != nil {
		fmt.Println("crypto.HexToECDSA error ,", err)
		return "", err
	}
	publicKey := privateKeyECDSA.Public()
	publicKeyECDSA, ok := publicKey.(*ecdsa.PublicKey)
	if !ok {
		fmt.Println("publicKeyECDSA error ,", err)
		return "", err
	}
	// 从公钥推导出钱包地址
	fromAddress := crypto.PubkeyToAddress(*publicKeyECDSA)
	fmt.Println("钱包地址：", fromAddress.Hex())

	// 读取ABI文件
	abiData, err := os.ReadFile("./abi.json")
	if err != nil {
		fmt.Println("os.ReadFile error ,", err)
		return "", err
	}
	// 将ABI数据转换为合约ABI对象
	contractAbi, err := abi.JSON(bytes.NewReader(abiData))
	if err != nil {
		fmt.Println("abi.JSON error ,", err)
		return "", err
	}

	// 使用ABI打包调用数据
	data, err := contractAbi.Pack("add")
	if err != nil {
		fmt.Println("contractAbi.Pack error ,", err)
		return "", err
	}

	// 获取账户的nonce值
	nonce, err := client.NonceAt(context.Background(), fromAddress, nil)
	if err != nil {
		return "", err
	}
	fmt.Println("当前nonce:", nonce)

	// 获取建议的小费上限
	gasTipCap, _ := client.SuggestGasTipCap(context.Background())
	gas := uint64(100000)                 // 设定Gas限额
	gasFeeCap := big.NewInt(108694000460) // 最大Gas费用

	contractAddress := common.HexToAddress(contract)
	// 创建交易
	tx := types.NewTx(&types.DynamicFeeTx{
		Nonce:     nonce,
		GasTipCap: gasTipCap,
		GasFeeCap: gasFeeCap,
		Gas:       gas,
		To:        &contractAddress,
		Value:     big.NewInt(0), // 交易发送的ETH数量，这里为0
		Data:      data,          // 交易的数据字段
	})
	// 获取当前区块链的ChainID
	chainID, err := client.ChainID(context.Background())
	if err != nil {
		fmt.Println("获取ChainID失败:", err)
		return "", err
	}

	fmt.Println("当前区块链的ChainID:", chainID)
	// 创建签名者
	signer := types.NewLondonSigner(chainID)
	// 对交易进行签名
	signTx, err := types.SignTx(tx, signer, privateKeyECDSA)
	if err != nil {
		return "", err
	}
	// 发送交易
	err = client.SendTransaction(context.Background(), signTx)
	if err != nil {
		return "", err
	}
	// 返回交易哈希
	return signTx.Hash().Hex(), err
}

func main() {
	// 连接以太坊客户端
	client, err := ethclient.Dial("https://eth-sepolia.g.alchemy.com/v2/9gYeQg557MDqSzmJ26T4QeAkPA8Xwght")
	if err != nil {
		fmt.Println("ethclient.Dial error : ", err)
		os.Exit(0)
	}
	// 调用合约的add方法
	tx, err := callAddMethod(client, privateKey, contractAddress)
	if err != nil {
		fmt.Println("callAddMethod error : ", err)
		os.Exit(0)
	}

	// 打印交易哈希
	fmt.Println("callAddMethod tx : ", tx)
}
