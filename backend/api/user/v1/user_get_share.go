package v1

import "github.com/gogf/gf/v2/frame/g"

type GetShareReq struct {
	g.Meta   `path:"/user/get_share" method:"post" tags:"UserService" summary:"get-share 获取秘密分片"`
	Passport string `v:"required"`
}
type GetShareRes struct {
	Share string `v:"length:32"`
}
