package user

import (
	"context"
	v1 "github.com/gogf/gf-demo-user/v2/api/user/v1"
	"github.com/gogf/gf-demo-user/v2/internal/dao"
	"github.com/gogf/gf-demo-user/v2/internal/model"
	"github.com/gogf/gf-demo-user/v2/internal/service"
	"github.com/gogf/gf-demo-user/v2/internal/utils/hash"
	"github.com/gogf/gf/v2/errors/gerror"
)

func (c *ControllerV1) Register(ctx context.Context, req *v1.RegisterReq) (res *v1.RegisterRes, err error) {
	// TODO 验证成功后，查找是否存在账户，存在则删除，注册新的账户
	ok := Verification.CheckVerification(req.Passport, req.Code)
	if ok {
		// 查找账户是否存在
		md := dao.User.Ctx(ctx)
		data, _ := md.Where("passport", req.Passport).All()
		if len(data) != 0 {
			ok := service.User().IsSignedIn(ctx)
			if ok {
				err = service.User().SignOut(ctx)
			}
			md.Delete("passport", req.Passport)
		}

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
