package user

import (
	"context"
	v1 "github.com/gogf/gf-demo-user/v2/api/user/v1"
	"github.com/gogf/gf-demo-user/v2/internal/dao"
	"github.com/gogf/gf-demo-user/v2/internal/model/do"
	"github.com/gogf/gf-demo-user/v2/internal/service"
)

func (c *ControllerV1) SendShare(cxt context.Context, req *v1.SendShareReq) (res *v1.SendShareRes, err error) {
	// TODO 将前端传来的分享存储到后端
	passport := service.Session().GetUser(cxt).Passport
	md := dao.Shares.Ctx(cxt)
	_, err = md.Data(do.Shares{
		Passport: passport,
		Share:    req.Share,
		Index:    req.Index,
	}).Insert()
	if err != nil {
		return
	}
	res = &v1.SendShareRes{
		OK: true,
	}
	return

}
