package v1

import (
	"github.com/gogf/gf/v2/frame/g"

	"github.com/gogf/gf-demo-user/v2/internal/model/entity"
)

type ProfileReq struct {
	g.Meta `path:"/user/profile" method:"get" tags:"UserService" summary:"profile 获取当前用户信息"`
}
type ProfileRes struct {
	*entity.User
}
