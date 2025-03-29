// =================================================================================
// Code generated and maintained by GoFrame CLI tool. DO NOT EDIT.
// =================================================================================

package do

import (
	"github.com/gogf/gf/v2/frame/g"
	"github.com/gogf/gf/v2/os/gtime"
)

// Shares is the golang structure of table shares for DAO operations like Where/Data.
type Shares struct {
	g.Meta   `orm:"table:shares, do:true"`
	Id       interface{} // Share ID
	Index    interface{} // Share Index
	Passport interface{} // User Passport
	Share    interface{} // Share Content
	CreateAt *gtime.Time // Created Time
	UpdateAt *gtime.Time // Updated Time
}
