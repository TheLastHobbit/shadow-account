package service

import (
	"context"
	"github.com/gogf/gf-demo-user/v2/internal/model"
)

type IEmail interface {
	SendEmail(ctx context.Context, input model.EmailSendInput) (err error)
	GetEmail(ctx context.Context) []byte
}

var localEmail IEmail

func Email() IEmail {
	if localEmail == nil {
		panic("implement not found for interface IEmail, forgot register?")
	}
	return localEmail
}

func RegisterEmail(i IEmail) {
	localEmail = i
}
