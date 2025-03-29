package v1

import "github.com/gogf/gf/v2/frame/g"

type RegisterReq struct {
	g.Meta   `path:"/user/register" method:"post" tags:"UserService" summary:"register 验证验证码是否正确并注册用户"`
	Passport string `v:"required" dc:"账户,required"`
	Password string `v:"required" dc:"密码,required"`
	Code     string `v:"required" dc:"验证码,required"`
	Nickname string `dc:"昵称，可选"`
}

type RegisterRes struct {
	OK bool `dc:"若注册成功，返回true"`
}
