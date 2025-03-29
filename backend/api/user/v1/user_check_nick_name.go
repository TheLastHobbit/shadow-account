package v1

import "github.com/gogf/gf/v2/frame/g"

type CheckNickNameReq struct {
	g.Meta   `path:"/user/check-nick-name" method:"post" tags:"UserService" summary:"check-nick-name 昵称是否可用"`
	Nickname string `v:"required" dc:"昵称,required"`
}
type CheckNickNameRes struct{}
