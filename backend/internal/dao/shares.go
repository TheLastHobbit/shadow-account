// =================================================================================
// This is auto-generated by GoFrame CLI tool only once. Fill this file as you wish.
// =================================================================================

package dao

import (
	"github.com/gogf/gf-demo-user/v2/internal/dao/internal"
)

// internalSharesDao is internal type for wrapping internal DAO implements.
type internalSharesDao = *internal.SharesDao

// sharesDao is the data access object for table shares.
// You can define custom methods on it to extend its functionality as you wish.
type sharesDao struct {
	internalSharesDao
}

var (
	// Shares is globally public accessible object for table shares operations.
	Shares = sharesDao{
		internal.NewSharesDao(),
	}
)

// Fill with you ideas below.
