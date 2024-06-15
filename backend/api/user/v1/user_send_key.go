package v1

import "github.com/gogf/gf/v2/frame/g"

type SendKeyReq struct {
	g.Meta   `path:"/user/send-key" method:"post" tags:"UserService" summary:"send-key 发送密钥"`
	Passport string `v:"required|length:0,320"`
	Key      string `v:"required|length:32,32"`
}
type SendKeyRes struct {
	Shares []string
}
