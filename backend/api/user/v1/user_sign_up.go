package v1

import "github.com/gogf/gf/v2/frame/g"

type SignUpReq struct {
	g.Meta    `path:"/user/sign-up" method:"post" tags:"UserService" summary:"sign-up 用户注册"`
	Passport  string `v:"required" dc:"账户,required"`
	Password  string `v:"required" dc:"密码,required"`
	Password2 string `v:"required|same:Password" dc:"确认密码,required"`
	Nickname  string `dc:"昵称，可选"`
}
type SignUpRes struct {
	OK bool `dc:"若注册成功，返回true"`
}
