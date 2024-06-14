// =================================================================================
// Code generated and maintained by GoFrame CLI tool. DO NOT EDIT.
// =================================================================================

package entity

import (
	"github.com/gogf/gf/v2/os/gtime"
)

// Shares is the golang structure for table shares.
type Shares struct {
	Id       uint        `json:"id"       orm:"id"        description:"Share ID"`
	Passport string      `json:"passport" orm:"passport"  description:"User Passport"`
	Share    string      `json:"share"    orm:"share"     description:"Share Content"`
	CreateAt *gtime.Time `json:"createAt" orm:"create_at" description:"Created Time"`
	UpdateAt *gtime.Time `json:"updateAt" orm:"update_at" description:"Updated Time"`
}
