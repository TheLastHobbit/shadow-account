package user

import (
	"context"
	v1 "github.com/gogf/gf-demo-user/v2/api/user/v1"
	"github.com/gogf/gf-demo-user/v2/internal/dao"
	"github.com/gogf/gf-demo-user/v2/internal/service"
	"github.com/gogf/gf-demo-user/v2/internal/utils/hash"
	"github.com/gogf/gf/v2/errors/gerror"
	"github.com/gogf/gf/v2/frame/g"
)

func (c *ControllerV1) ResetRegister(ctx context.Context, req *v1.ResetRegisterReq) (res *v1.ResetRegisterRes, err error) {
	ok := Verification.CheckVerification(req.Passport, req.Code)
	if ok {
		if service.User().IsSignedIn(ctx) {
			service.User().SignOut(ctx)
		}
		passport := req.Passport
		md := dao.User.Ctx(ctx)
		md.Where("passport", passport).Update(g.Map{
			"password": hash.GenerateSHA1Hash(req.Password),
		})
	} else {
		err = gerror.New("验证码错误")
		return
	}
	res = &v1.ResetRegisterRes{
		OK: true,
	}
	return
}
