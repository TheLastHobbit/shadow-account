package user

import (
	"context"
	v1 "github.com/gogf/gf-demo-user/v2/api/user/v1"
	"github.com/gogf/gf-demo-user/v2/internal/dao"
	"github.com/gogf/gf-demo-user/v2/internal/service"
)

func (c *ControllerV1) DeleteShare(ctx context.Context, req *v1.DeleteShareReq) (res *v1.DeleteShareRes, err error) {
	md := dao.Shares.Ctx(ctx)
	passport := service.Session().GetUser(ctx).Passport
	_, err = md.Where("passport", passport).Where("index", req.Index).Delete()
	if err != nil {
		return
	}
	res = &v1.DeleteShareRes{
		OK: true,
	}
	return

}
