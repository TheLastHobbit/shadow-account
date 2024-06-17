package user

import (
	"context"
	"fmt"
	"github.com/gogf/gf-demo-user/v2/api/user/v1"
	"github.com/gogf/gf-demo-user/v2/internal/dao"
	"github.com/gogf/gf-demo-user/v2/internal/utils/email"
	"github.com/gogf/gf-demo-user/v2/internal/utils/verification"
	"github.com/gogf/gf/v2/errors/gerror"
)

func (c *ControllerV1) ResetPassword(ctx context.Context, req *v1.ResetPasswordReq) (res *v1.ResetPasswordRes, err error) {
	// 查找修改账户是否存在
	md := dao.User.Ctx(ctx)
	data, _ := md.Where("passport", req.Passport).All()
	if len(data) == 0 {
		err = gerror.New("账户不存在")
		return
	}
	// 存在则发送验证码
	code, ok := Verification.HasCode(req.Passport)
	if !ok {
		// 生成随机验证码
		code = verification.GenValidateCode(6)
		Verification.NewVerificationCode(req.Passport, code)
	}
	fmt.Println("验证码：", code)
	fmt.Println(req.Passport)
	email.SendMail("重置密码验证码", "您的验证码是：\n"+code, req.Passport)
	// 不存在则返回错误
	return

}
