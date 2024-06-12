// =================================================================================
// Code generated and maintained by GoFrame CLI tool. DO NOT EDIT.
// =================================================================================

package entity

import (
	"github.com/gogf/gf/v2/os/gtime"
)

// User is the golang structure for table user.
type User struct {
	Id       uint        `json:"id"       orm:"id"        description:"User ID"`
	Passport string      `json:"passport" orm:"passport"  description:"User Passport"`
	password string      `json:"password" orm:"password"  description:"User Password"`
	Nickname string      `json:"nickname" orm:"nickname"  description:"User Nickname"`
	CreateAt *gtime.Time `json:"createAt" orm:"create_at" description:"Created Time"`
	UpdateAt *gtime.Time `json:"updateAt" orm:"update_at" description:"Updated Time"`
}
