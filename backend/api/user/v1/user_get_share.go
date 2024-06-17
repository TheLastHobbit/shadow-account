package v1

import "github.com/gogf/gf/v2/frame/g"

type GetShareReq struct {
	g.Meta `path:"/user/get-share" method:"get" tags:"UserService" summary:"get-share 获取秘钥分片"`
	// Passport string `v:"required"`
}
type GetShareRes struct {
	Share string `v:"length:32"`
}
