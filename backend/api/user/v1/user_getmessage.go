package v1

import "github.com/gogf/gf/v2/frame/g"

type GetMessageReq struct {
	g.Meta `path:"/user/get-message" method:"get" tags:"UserService" summary:"get-message 用户发送邮件后，后端获取最新邮件"`
}

type GetMessageRes struct {
	OK bool `dc:"若获取成功，返回true"`
}
