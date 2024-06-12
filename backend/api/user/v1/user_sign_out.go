package v1

import "github.com/gogf/gf/v2/frame/g"

type SignOutReq struct {
	g.Meta `path:"/user/sign-out" method:"post" tags:"UserService" summary:"sign-out 登出当前账号"`
}
type SignOutRes struct{}
