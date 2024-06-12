package v1

import "github.com/gogf/gf/v2/frame/g"

type ResetPasswordReq struct {
	g.Meta    `path:"/user/reset-password" method:"post" tags:"UserService" summary:"reset-password 重置密码"`
	Passport  string `v:"required|length:0,320"`
	Password  string `v:"required|length:6,16"`
	Password2 string `v:"required|length:6,16|same:Password"`
}
type ResetPasswordRes struct {
	OK bool
}
