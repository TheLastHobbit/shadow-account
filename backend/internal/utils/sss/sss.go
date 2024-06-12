package utils

import (
	"math"
	"math/big"
	"math/rand"
)

const prime = 257

func InitArray(a, b int) [][]byte {
	result := make([][]byte, 0)
	for i := 0; i < a; i++ {
		nums := make([]byte, b+1)
		result = append(result, nums)
	}
	return result
}

// GetPolynomial 生成一个多项式，多项式的次数为n-1，多项式的系数为随机数
func GetPolynomial(n int, secretMsg byte) func(x uint8) uint8 {
	coefficients := make([]uint8, n-1) // 多项式系数
	for i := 0; i < n-1; i++ {
		for true {
			temp := uint8(rand.Intn(math.MaxInt8))
			if temp != 0 {
				coefficients[i] = temp
				break
			}
		}
	}
	return func(x uint8) uint8 {
		// fmt.Println(coefficients)
		//var count float64 = 0
		var count = new(big.Int).Set(big.NewInt(0))
		for i := 0; i < len(coefficients); i++ {
			bigCoefficient := new(big.Int).Set(big.NewInt(int64(coefficients[i])))
			exponent := new(big.Int).Set(big.NewInt(int64(n - 1 - i)))
			bigX := new(big.Int).Set(big.NewInt(int64(x)))
			bigPrime := new(big.Int).Set(big.NewInt(int64(prime)))
			bigX.Exp(bigX, exponent, bigPrime)
			bigX.Mul(bigX, bigCoefficient)
			bigX.Mod(bigX, bigPrime)
			count.Add(count, bigX)
			count.Mod(count, bigPrime)
		}
		count.Add(count, big.NewInt(int64(secretMsg)))
		count.Mod(count, big.NewInt(int64(prime)))
		return uint8(count.Int64())
	}
}

/*
 *这一部分是解密算法需要的工具类
 */

// Lagrange 拉格朗日插值法，计算出f(0)的值，即原始信息
func Lagrange(x int64, xs, ys []int64) *big.Rat {
	l := big.NewRat(0, 1)
	for i := 0; i < len(xs); i++ {
		term := big.NewRat(ys[i], 1)
		for j := 0; j < len(xs); j++ {
			if i != j {
				num := big.NewRat(x-xs[j], 1)
				den := big.NewRat(xs[i]-xs[j], 1)
				frac := new(big.Rat).Quo(num, den)
				term.Mul(term, frac)
			}
		}
		l.Add(l, term)
	}
	return l
}

func InitInt64Array(a, b int) [][]int64 {
	result := make([][]int64, 0)
	for i := 0; i < a; i++ {
		nums := make([]int64, b)
		result = append(result, nums)
	}
	return result
}
