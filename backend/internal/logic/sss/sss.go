package sss

import (
	"context"
	"github.com/gogf/gf-demo-user/v2/internal/consts"
	"github.com/gogf/gf-demo-user/v2/internal/model"
	"github.com/gogf/gf-demo-user/v2/internal/service"
	utils "github.com/gogf/gf-demo-user/v2/internal/utils/sss"
	"github.com/gogf/gf/v2/errors/gerror"
	"math/big"
)

type (
	sSSS struct{}
)

func init() {
	service.RegisterSSS(New())
}

func New() service.ISSS {
	return &sSSS{}
}

func (s sSSS) Encrypt(ctx context.Context, in model.EncryptInput) (shares [][]byte, err error) {

	// 输入数据合法性判断
	if len(in.Secret) == 0 || in.N <= 0 {
		err = gerror.New("illegal input data")
		return
	}
	// 生成的密钥数量要大于最小密钥数量
	if in.Num < in.N {
		err = gerror.New("num has to be greater than n")
		return
	}
	result := utils.InitArray(in.Num, len(in.Secret))
	for j := 0; j < len(in.Secret); j++ {
		f := utils.GetPolynomial(in.N, in.Secret[j])
		for i := 0; i < in.Num; i++ {
			if j == 0 {
				result[i][0] = byte(i + 1)
			}
			result[i][j+1] = f(uint8(i + 1))
		}
	}

	temp, _ := s.Decrypt(ctx, model.DecryptInput{
		Shares: result,
		N:      in.N,
	})
	for i := 0; i < len(in.Secret); i++ {
		if temp[i] != in.Secret[i] {
			return s.Encrypt(ctx, in)
			break
		}
	}

	return result, nil
}

func (s sSSS) Decrypt(ctx context.Context, in model.DecryptInput) (result []byte, err error) {
	// 输入数据合法性判定
	if len(in.Shares) == 0 {
		err = gerror.New("illegal input data")
		return
	}
	x := make([]int64, in.N)
	for i := 0; i < in.N; i++ {
		x[i] = int64(i + 1)
	}
	yss := utils.InitInt64Array(len(in.Shares[0])-1, in.N)
	// 截取解密需要用的前n个密钥
	for i := 0; i < in.N; i++ {
		for j := 1; j < len(in.Shares[i]); j++ {
			yss[j-1][i] = int64(in.Shares[i][j])
		}
	}
	// 解密
	result = make([]byte, 0)
	for _, ys := range yss {
		secret := utils.Lagrange(0, x, ys)
		// 就是这一步导致了溢出
		// temp := secret.Nmu().Int64()
		temp, _ := new(big.Float).SetString(secret.FloatString(0))
		secretBigInt := new(big.Int)
		temp.Int(secretBigInt)
		secretBigInt.Mod(secretBigInt, big.NewInt(int64(consts.Prime)))
		tempSecret := int(secretBigInt.Int64())
		if tempSecret < 0 {
			tempSecret += consts.Prime
		}

		//fmt.Println(temp)
		result = append(result, byte(tempSecret))
	}
	return result, nil

}

