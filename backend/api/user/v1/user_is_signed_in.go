package v1

import "github.com/gogf/gf/v2/frame/g"

type IsSignedInReq struct {
	g.Meta `path:"/user/is-signed-in" method:"post" tags:"UserService" summary:"is-signed-in 是否已经登录"`
}
type IsSignedInRes struct {
	OK bool `dc:"若登录成功，返回true"`
}
