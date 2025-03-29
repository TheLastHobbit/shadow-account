package service

import (
	"context"
	"github.com/gogf/gf-demo-user/v2/internal/model"
)

type ISSS interface {
	Encrypt(ctx context.Context, input model.EncryptInput) (shares [][]byte, err error)
	Decrypt(ctx context.Context, input model.DecryptInput) (result []byte, err error)
}

var localSSS ISSS

func SSS() ISSS {
	if localSSS == nil {
		panic("implement not found for interface ISSS, forgot register?")
	}
	return localSSS
}

func RegisterSSS(i ISSS) {
	localSSS = i
}
