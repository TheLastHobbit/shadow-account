package v1

import "github.com/gogf/gf/v2/frame/g"

type DeleteShareReq struct {
	g.Meta `path:"/user/delete-share" method:"post" tags:"UserService" summary:"delete-share 删除密钥分片"`
	Index  int `v:"required|min:0" dc:"分片索引，从0开始，required"`
}

type DeleteShareRes struct {
	OK bool
}
