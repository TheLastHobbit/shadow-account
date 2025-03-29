package user

import (
	"context"
	v1 "github.com/gogf/gf-demo-user/v2/api/user/v1"
	"github.com/gogf/gf-demo-user/v2/internal/dao"
	"github.com/gogf/gf-demo-user/v2/internal/service"
	"github.com/gogf/gf/v2/errors/gerror"
	"github.com/gogf/gf/v2/frame/g"
)

func (c *ControllerV1) ChangeNickname(ctx context.Context, req *v1.ChangeNicknameReq) (res *v1.ChangeNicknameRes, err error) {
	available, err := service.User().IsNicknameAvailable(ctx, req.Nickname)
	if err != nil {
		return nil, err
	}
	if !available {
		return nil, gerror.Newf(`Nickname "%s" is already token by others`, req.Nickname)
	}
	md := dao.User.Ctx(ctx)
	passport := service.Session().GetUser(ctx).Passport
	_, err = md.Where("passport", passport).Update(g.Map{
		"nickname": req.Nickname,
	})
	if err != nil {
		return
	}
	res = &v1.ChangeNicknameRes{
		OK: true,
	}
	return
}
