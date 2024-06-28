package user

import (
	"context"
	v1 "github.com/gogf/gf-demo-user/v2/api/user/v1"
	"github.com/gogf/gf-demo-user/v2/internal/model"
	"github.com/gogf/gf-demo-user/v2/internal/service"
	"github.com/gogf/gf-demo-user/v2/internal/utils/hash"
	"github.com/gogf/gf/v2/errors/gerror"
)

func (c *ControllerV1) Register(ctx context.Context, req *v1.RegisterReq) (res *v1.RegisterRes, err error) {
	ok := Verification.CheckVerification(req.Passport, req.Code)
	if ok {
		err = service.User().Create(ctx, model.UserCreateInput{
			Passport: req.Passport,
			Password: hash.GenerateSHA1Hash(req.Password),
			Nickname: req.Nickname,
		})
	} else {
		err = gerror.New("验证码错误")
		return
	}
	res = &v1.RegisterRes{
		OK: true,
	}
	return
}
