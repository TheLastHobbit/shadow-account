package sss

import (
	"math"
	"math/big"
	"math/rand"
	"time"
)

const prime = 257

// Encrypt
// 输入任意长度[]byte秘密，n个秘密共享者持有的密钥可以恢复秘密，返回num个秘密共享者的密钥
func Encrypt(secret []byte, n, num int) [][]byte {
	// 输入数据合法性判断
	if len(secret) == 0 || n <= 0 {
		panic("illegal input data")

	}
	// 生成的密钥数量要大于最小密钥数量
	if num < n {
		panic("num has to be greater than n")
	}
	// 初始化返回的密钥数组 [num][len(secret) + 1]byte
	result := initArray(num, len(secret))
	// 加密数据
	// indexs := getRandIndex(num)
	for j := 0; j < len(secret); j++ {
		// 生成多项式f(x)
		f := getPolynomial(n, secret[j])
		for i := 0; i < num; i++ {
			// 数组首位元素存放计算密钥的x
			if j == 0 {
				result[i][0] = byte(i + 1)
			}
			// 计算出num份密钥分片
			// TODO 计算f(x)用生成随计数x，采用乱序排序一个256的数组选取前n个数作为x
			// result[i][j+1] = f(uint8(indexs[i]))
			result[i][j+1] = f(uint8(i + 1))
		}
	}
	// 由于素数取257，若取模后的值等于256会导致uint8溢出，这将导致密钥出错，从而导致解密失败
	// 可以确定的是这是由某些的随机数系数导致的
	// 因此，简单粗暴的方法就是用递归的方式，在返回shares之前，先解密检验一次，保证解密一定是能够成功的

	temp := Decrypt(result, n)
	for i := 0; i < len(secret); i++ {
		if temp[i] != secret[i] {
			return Encrypt(secret, n, num)
			break
		}
	}

	return result

}

// Decrypt
// 输入密钥数组shares [][]byte, 以及最小解密密钥数n int，返回解密后的信息 []byte
func Decrypt(shares [][]byte, n int) []byte {
	// 输入数据合法性判定
	if len(shares) == 0 {
		panic("illegal input data")
	}
	x := make([]int64, n)
	for i := 0; i < n; i++ {
		x[i] = int64(i + 1)
	}
	yss := initInt64Array(len(shares[0])-1, n)
	// 截取解密需要用的前n个密钥
	for i := 0; i < n; i++ {
		for j := 1; j < len(shares[i]); j++ {
			yss[j-1][i] = int64(shares[i][j])
		}
	}
	// 解密
	result := make([]byte, 0)
	for _, ys := range yss {
		secret := Lagrange(0, x, ys)
		// 就是这一步导致了溢出
		// temp := secret.Nmu().Int64()
		temp, _ := new(big.Float).SetString(secret.FloatString(0))
		secretBigInt := new(big.Int)
		temp.Int(secretBigInt)
		secretBigInt.Mod(secretBigInt, big.NewInt(int64(prime)))
		tempSecret := int(secretBigInt.Int64())
		if tempSecret < 0 {
			tempSecret += prime
		}

		//fmt.Println(temp)
		result = append(result, byte(tempSecret))
	}
	return result

}

func initArray(a, b int) [][]byte {
	result := make([][]byte, 0)
	for i := 0; i < a; i++ {
		nums := make([]byte, b+1)
		result = append(result, nums)
	}
	return result
}

// getPolynomial 生成一个多项式，多项式的次数为n-1，多项式的系数为随机数
func getPolynomial(n int, secretMsg byte) func(x uint8) uint8 {
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

// 获取num个随机index用以加密shares
// 此方法将导致性能大幅下降

func getRandIndex(num int) []int {
	numArr := make([]int, 0)
	for i := 0; i < 256; i++ {
		numArr = append(numArr, i+1)
	}
	r := rand.New(rand.NewSource(time.Now().UnixNano()))
	r.Shuffle(len(numArr), func(i, j int) {
		numArr[i], numArr[j] = numArr[j], numArr[i]
	})
	return numArr[:num]

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

func initInt64Array(a, b int) [][]int64 {
	result := make([][]int64, 0)
	for i := 0; i < a; i++ {
		nums := make([]int64, b)
		result = append(result, nums)
	}
	return result
}
