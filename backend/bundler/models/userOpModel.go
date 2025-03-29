package models

import (
	"encoding/json"
	"fmt"
	"math/big"

	"github.com/ethereum/go-ethereum/common"
)

type PackedUserOperation struct {
	Sender             common.Address `json:"sender"`
	Nonce              *big.Int       `json:"nonce"`
	InitCode           string         `json:"initCode"`
	CallData           string         `json:"callData"`
	AccountGasLimits   string         `json:"accountGasLimits"`
	PreVerificationGas *big.Int       `json:"preVerificationGas"`
	GasFees            string         `json:"gasFees"`
	PaymasterAndData   string         `json:"paymasterAndData"`
	Signature          string         `json:"signature"`
}

type UserOpRequest struct {
	UserOp PackedUserOperation `json:"userOp"`
	To     string              `json:"to"`
	Value  string              `json:"value"`
	UseShadowAccount bool   `json:"useShadowAccount"`
}

func (p *PackedUserOperation) UnmarshalJSON(data []byte) error {
	type Alias PackedUserOperation
	aux := struct {
		Sender             string      `json:"sender"`
		Nonce              interface{} `json:"nonce"`              // 支持字符串或数字
		InitCode           string      `json:"initCode"`
		CallData           string      `json:"callData"`
		AccountGasLimits   string      `json:"accountGasLimits"`
		PreVerificationGas interface{} `json:"preVerificationGas"` // 支持字符串或数字
		GasFees            string      `json:"gasFees"`
		PaymasterAndData   string      `json:"paymasterAndData"`
		Signature          string      `json:"signature"`
	}{
		Sender:           p.Sender.Hex(),
		InitCode:         p.InitCode,
		CallData:         p.CallData,
		AccountGasLimits: p.AccountGasLimits,
		GasFees:          p.GasFees,
		PaymasterAndData: p.PaymasterAndData,
		Signature:        p.Signature,
	}

	if err := json.Unmarshal(data, &aux); err != nil {
		return err
	}

	// 设置 Sender
	p.Sender = common.HexToAddress(aux.Sender)

	// 解析 Nonce
	p.Nonce = new(big.Int)
	switch v := aux.Nonce.(type) {
	case string:
		if v != "" {
			if _, ok := p.Nonce.SetString(v, 10); !ok {
				return fmt.Errorf("invalid nonce value: %s", v)
			}
		}
	case float64:
		p.Nonce.SetInt64(int64(v))
	default:
		return fmt.Errorf("nonce must be a string or number, got %T", v)
	}

	// 设置其他字符串字段
	p.InitCode = aux.InitCode
	p.CallData = aux.CallData
	p.AccountGasLimits = aux.AccountGasLimits
	p.GasFees = aux.GasFees
	p.PaymasterAndData = aux.PaymasterAndData
	p.Signature = aux.Signature

	// 解析 PreVerificationGas
	p.PreVerificationGas = new(big.Int)
	switch v := aux.PreVerificationGas.(type) {
	case string:
		if v != "" {
			if _, ok := p.PreVerificationGas.SetString(v, 10); !ok {
				return fmt.Errorf("invalid preVerificationGas value: %s", v)
			}
		}
	case float64:
		p.PreVerificationGas.SetInt64(int64(v))
	default:
		return fmt.Errorf("preVerificationGas must be a string or number, got %T", v)
	}

	return nil
}