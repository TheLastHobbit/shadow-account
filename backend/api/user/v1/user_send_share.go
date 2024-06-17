package v1

import "github.com/gogf/gf/v2/frame/g"

type SendShareReq struct {
	g.Meta `path:"/user/send-share" method:"post" tags:"UserService" summary:"send-share 已注册账户存储密钥分片"`
}

type SendShareRes struct {
	OK bool
}
