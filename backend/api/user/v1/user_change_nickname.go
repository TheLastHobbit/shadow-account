package v1

import "github.com/gogf/gf/v2/frame/g"

type ChangeNicknameReq struct {
	g.Meta   `path:"/user/change-nick-name" method:"post" tags:"UserService" summary:"change-nick-name 修改昵称"`
	Nickname string `v:"required" dc:"昵称,required" "`
}
type ChangeNicknameRes struct {
	OK bool
}
