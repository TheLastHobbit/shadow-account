package v1

import "github.com/gogf/gf/v2/frame/g"

type ResetPasswordReq struct {
	g.Meta    `path:"/user/reset-password" method:"post" tags:"UserService" summary:"reset-password 重置密码"`
	Passport  string `v:"required" dc:"账户,required"`
	Password  string `v:"required" dc:"密码,required"`
	Password2 string `v:"required|same:Password" dc:"确认密码,required|确认密码与密码不一致"`
}
type ResetPasswordRes struct {
	OK bool `dc:"若重置密码成功，返回true"`
}
