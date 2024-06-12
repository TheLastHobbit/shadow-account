package user

import (
	"context"
	v1 "github.com/gogf/gf-demo-user/v2/api/user/v1"
	"github.com/gogf/gf-demo-user/v2/internal/dao"
	"github.com/gogf/gf-demo-user/v2/internal/model"
	"github.com/gogf/gf-demo-user/v2/internal/service"
	"github.com/gogf/gf/v2/frame/g"
)

func (c *ControllerV1) SendKey(cxt context.Context, req *v1.SendKeyReq) (res *v1.SendKeyRes, err error) {

	keyBytes := []byte(req.Key)
	shares, _ := service.SSS().Encrypt(cxt, model.EncryptInput{
		Secret: keyBytes,
		N:      2,
		Num:    3,
	})
	sharesStr := []string{
		string(shares[0]),
		string(shares[1]),
	}
	md := dao.Shares.Ctx(cxt)
	data := g.Map{
		"Passport": shares[0],
		"Share":    string(shares[1]),
	}
	// TODO 转十六进制存储传输
	_, err = md.Insert(data)

	res = &v1.SendKeyRes{
		Shares: sharesStr,
	}

	return
}
