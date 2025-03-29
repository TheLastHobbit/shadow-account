package v1

import "github.com/gogf/gf/v2/frame/g"

type CheckPassportReq struct {
	g.Meta   `path:"/user/check-passport" method:"post" tags:"UserService" summary:"check-passport 账户是否可用"`
	Passport string `v:"required" dc:"账户,required"`
}
type CheckPassportRes struct{}
