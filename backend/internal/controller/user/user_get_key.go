package user

import (
	"context"
	v1 "github.com/gogf/gf-demo-user/v2/api/user/v1"
	"github.com/gogf/gf-demo-user/v2/internal/dao"
	"github.com/gogf/gf-demo-user/v2/internal/model"
	"github.com/gogf/gf-demo-user/v2/internal/service"
)

func (c *ControllerV1) GetKey(ctx context.Context, req *v1.GetKeyReq) (res *v1.GetKeyRes, err error) {
	// TODO 收集分片，还原秘密
	shareByte := []byte(req.Passport)
	md := dao.Shares.Ctx(ctx)
	data, err := md.Where("passport", req.Passport).All()
	shareBack := data[0]["share"].String()
	shares := [][]byte{
		shareByte,
		[]byte(shareBack),
	}
	key, _ := service.SSS().Decrypt(ctx, model.DecryptInput{
		Shares: shares,
		N:      2,
	})

	res = &v1.GetKeyRes{
		Key: string(key),
	}

	return
}
