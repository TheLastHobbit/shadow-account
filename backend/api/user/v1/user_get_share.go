package v1

import "github.com/gogf/gf/v2/frame/g"

type GetShareReq struct {
	g.Meta `path:"/user/get-share" method:"post" tags:"UserService" summary:"get-share 获取秘钥分片"`
	Index  int `v:"required|min:0" dc:"分片索引，required"`
}
type GetShareRes struct {
	Share string
}
