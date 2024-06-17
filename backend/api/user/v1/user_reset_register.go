package v1

import "github.com/gogf/gf/v2/frame/g"

type ResetRegisterReq struct {
	g.Meta   `path:"/user/reset-register" method:"post" tags:"UserService" summary:"reset-register 重置密钥的注册路由"`
	Passport string `v:"required|length:0,320"`
	Password string `v:"required|length:6,16"`
	Code     string `v:"required|length:6,6"`
	Nickname string
}

type ResetRegisterRes struct {
	OK bool
}
