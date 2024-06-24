package v1

import "github.com/gogf/gf/v2/frame/g"

type SignInReq struct {
	g.Meta   `path:"/user/sign-in" method:"post" tags:"UserService" summary:"sign-in 已注册账户登录"`
	Passport string `v:"required" dc:"账户,required"`
	Password string `v:"required" dc:"密码,required"`
}
type SignInRes struct{}
