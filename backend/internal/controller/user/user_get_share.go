package user

import (
	"context"
	v1 "github.com/gogf/gf-demo-user/v2/api/user/v1"
	"github.com/gogf/gf-demo-user/v2/internal/dao"
	"github.com/gogf/gf-demo-user/v2/internal/service"
	"github.com/gogf/gf/v2/errors/gerror"
)

func (c *ControllerV1) GetShare(ctx context.Context, req *v1.GetShareReq) (res *v1.GetShareRes, err error) {
	// TODO 将后端存储的分片返回给前端
	// 获取当前用户
	passport := service.Session().GetUser(ctx).Passport
	// 获取当前用户的分享
	md := dao.Shares.Ctx(ctx)
	data, err := md.Where("passport", passport).All()
	if len(data) == 0 {
		err = gerror.New("have no share")
		return
	}
	// r := g.RequestFromCtx(ctx)
	// r.Response.WriteJson(data)
	res = &v1.GetShareRes{
		Share: data[0]["share"].String(),
	}

	return
}
