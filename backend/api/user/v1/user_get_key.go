package v1

import "github.com/gogf/gf/v2/frame/g"

type GetKeyReq struct {
	g.Meta   `path:"/user/get_key" method:"post" tags:"UserService" summary:"Get ETH key"`
	Passport string `v:"required|length:0,320"`
	Share    string
}

type GetKeyRes struct {
	Key string
}
