package user

import (
	"context"
	v1 "github.com/gogf/gf-demo-user/v2/api/user/v1"
	"github.com/gogf/gf-demo-user/v2/internal/consts"
	"github.com/gogf/gf-demo-user/v2/internal/model"
	"github.com/gogf/gf-demo-user/v2/internal/service"
)

func (c *ControllerV1) SocialRecovery(cxt context.Context, req *v1.SocialRecoveryReq) (res *v1.SocialRecoveryRes, err error) {
	// 发送引导邮件
	err = service.Email().SendEmail(cxt, model.EmailSendInput{
		To:       service.Session().GetUser(cxt).Passport,
		Subject:  "社交恢复",
		Body:     "请向此邮箱发送您的新地址，我们将帮您恢复账号。",
		From:     consts.From,
		Password: consts.Password,
	})
	if err != nil {
		return
	}
	res = &v1.SocialRecoveryRes{
		OK: true,
	}
	return

}
