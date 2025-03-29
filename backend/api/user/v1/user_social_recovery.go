package v1

import "github.com/gogf/gf/v2/frame/g"

type SocialRecoveryReq struct {
	g.Meta `path:"/user/social-recovery" method:"post" tags:"UserService" summary:"social-recovery 社交恢复"`
}

type SocialRecoveryRes struct {
	OK bool `dc:"若恢复成功，返回true"`
}
