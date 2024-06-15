package user

import (
	"context"
	v1 "github.com/gogf/gf-demo-user/v2/api/user/v1"
)

func (c *ControllerV1) SendShare(cxt context.Context, req *v1.SendShareReq) (res *v1.SendShareRes, err error) {
	res = &v1.SendShareRes{
		OK: true,
	}
	return

}
