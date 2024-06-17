package v1

import "github.com/gogf/gf/v2/frame/g"

type RegisterReq struct {
	g.Meta   `path:"/user/register" method:"post" tags:"UserService" summary:"register 验证验证码是否正确并注册用户"`
	Passport string `v:"required|length:0,320"`
	Password string `v:"required|length:6,16"`
	Code     string `v:"required|length:6,6"`
	Nickname string
}

type RegisterRes struct {
}
