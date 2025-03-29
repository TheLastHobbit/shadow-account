package v1

import "github.com/gogf/gf/v2/frame/g"

type ResetRegisterReq struct {
	g.Meta   `path:"/user/reset-register" method:"post" tags:"UserService" summary:"reset-register 重置密钥的注册路由"`
	Passport string `v:"required" dc:"账户,required"`
	Password string `v:"required" dc:"密码,required"`
	Code     string `v:"required" dc:"验证码,required"`
	Nickname string `dc:"昵称，可选"`
}

type ResetRegisterRes struct {
	OK bool `dc:"若注册成功，返回true"`
}
