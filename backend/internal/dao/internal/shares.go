// ==========================================================================
// Code generated and maintained by GoFrame CLI tool. DO NOT EDIT.
// ==========================================================================

package internal

import (
	"context"

	"github.com/gogf/gf/v2/database/gdb"
	"github.com/gogf/gf/v2/frame/g"
)

// SharesDao is the data access object for table shares.
type SharesDao struct {
	table   string        // table is the underlying table name of the DAO.
	group   string        // group is the database configuration group name of current DAO.
	columns SharesColumns // columns contains all the column names of Table for convenient usage.
}

// SharesColumns defines and stores column names for table shares.
type SharesColumns struct {
	Id       string // Share ID
	Index    string // Share Index
	Passport string // User Passport
	Share    string // Share Content
	CreateAt string // Created Time
	UpdateAt string // Updated Time
}

// sharesColumns holds the columns for table shares.
var sharesColumns = SharesColumns{
	Id:       "id",
	Index:    "index",
	Passport: "passport",
	Share:    "share",
	CreateAt: "create_at",
	UpdateAt: "update_at",
}

// NewSharesDao creates and returns a new DAO object for table data access.
func NewSharesDao() *SharesDao {
	return &SharesDao{
		group:   "default",
		table:   "shares",
		columns: sharesColumns,
	}
}

// DB retrieves and returns the underlying raw database management object of current DAO.
func (dao *SharesDao) DB() gdb.DB {
	return g.DB(dao.group)
}

// Table returns the table name of current dao.
func (dao *SharesDao) Table() string {
	return dao.table
}

// Columns returns all column names of current dao.
func (dao *SharesDao) Columns() SharesColumns {
	return dao.columns
}

// Group returns the configuration group name of database of current dao.
func (dao *SharesDao) Group() string {
	return dao.group
}

// Ctx creates and returns the Model for current DAO, It automatically sets the context for current operation.
func (dao *SharesDao) Ctx(ctx context.Context) *gdb.Model {
	return dao.DB().Model(dao.table).Safe().Ctx(ctx)
}

// Transaction wraps the transaction logic using function f.
// It rollbacks the transaction and returns the error from function f if it returns non-nil error.
// It commits the transaction and returns nil if function f returns nil.
//
// Note that, you should not Commit or Rollback the transaction in function f
// as it is automatically handled by this function.
func (dao *SharesDao) Transaction(ctx context.Context, f func(ctx context.Context, tx gdb.TX) error) (err error) {
	return dao.Ctx(ctx).Transaction(ctx, f)
}
