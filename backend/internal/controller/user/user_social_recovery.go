package user

import (
	"context"
	v1 "github.com/gogf/gf-demo-user/v2/api/user/v1"
	"github.com/gogf/gf-demo-user/v2/internal/service"
	"github.com/gogf/gf/v2/frame/g"
	"os"
)

func (c *ControllerV1) SocialRecovery(cxt context.Context, req *v1.SocialRecoveryReq) (res *v1.SocialRecoveryRes, err error) {
	service.Email().GetEmail(cxt)
	content, err := os.ReadFile("text/email.txt")
	r := g.RequestFromCtx(cxt)
	r.Response.Write(content)
	return

}
