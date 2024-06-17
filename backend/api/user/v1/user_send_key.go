package v1

import "github.com/gogf/gf/v2/frame/g"

type SendKeyReq struct {
	g.Meta   `path:"/user/send_key" method:"post" tags:"UserService" summary:"发送密钥 send-key"`
	Passport string `v:"required|length:0,320"`
	Key      string `v:"required|length:32,32"`
}
type SendKeyRes struct {
	Shares []string
}
