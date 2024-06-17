package user

import (
	"context"
	"fmt"
	"github.com/gogf/gf-demo-user/v2/api/user/v1"
	"github.com/gogf/gf-demo-user/v2/internal/dao"
	"github.com/gogf/gf-demo-user/v2/internal/utils/verification"
	"github.com/gogf/gf/v2/errors/gerror"
)

func (c *ControllerV1) SignUp(ctx context.Context, req *v1.SignUpReq) (res *v1.SignUpRes, err error) {
	// 查询是否存在账户
	md := dao.User.Ctx(ctx)
	data, err := md.Where("passport", req.Passport).All()
	if len(data) != 0 {
		err = gerror.New("账户已存在")
		return
	}
	// 查询是否有验证码未过期
	code, ok := Verification.HasCode(req.Passport)
	if !ok {
		// 生成随机验证码
		code = verification.GenValidateCode(6)
		Verification.NewVerificationCode(req.Passport, code)
	}
	fmt.Println("验证码：", code)
	fmt.Println(req.Passport)
	//发送验证邮件
	//err = email.SendMail("邮箱验证码", "您的验证码为：\n"+code, req.Passport)
	return
}
