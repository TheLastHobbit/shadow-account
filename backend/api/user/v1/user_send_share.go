package v1

import "github.com/gogf/gf/v2/frame/g"

type SendShareReq struct {
	g.Meta `path:"/user/send-share" method:"post" tags:"UserService" summary:"send-share 已注册账户存储密钥分片"`
	Share  string `v:"required" dc:"密钥分片,required"`
	Index  int    `v:"required|min:0" dc:"分片索引，required"`
}

type SendShareRes struct {
	OK bool `dc:"若存储成功，返回true"`
}
