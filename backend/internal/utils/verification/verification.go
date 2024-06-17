package verification

import (
	"math/rand"
	"strings"
	"time"
)

type Verification struct {
	codeMap map[string]string
}

func NewVerification() *Verification {

	return &Verification{
		codeMap: make(map[string]string),
	}
}

func (v *Verification) HasCode(email string) (string, bool) {
	code, ok := v.codeMap[email]
	return code, ok
}

// NewVerificationCode 添加新的验证码
func (v *Verification) NewVerificationCode(email string, code string) (string, error) {
	v.codeMap[email] = code
	go v.expireVerification(email)
	return code, nil
}

// CheckVerification 查找验证码是否存在
func (v *Verification) CheckVerification(email, code string) bool {
	storageCode, ok := v.codeMap[email]
	if !ok {
		return false
	}
	return storageCode == code
}

// 验证码时效5分钟
func (v *Verification) expireVerification(email string) {
	time.Sleep(5 * time.Minute)
	delete(v.codeMap, email)
	// fmt.Println("验证码已过期")
}

func GenValidateCode(width int) string {
	/*
		numeric := [10]byte{'0', '1', '2', '3', '4', '5', '6', '7', '8', '9'}
		r := len(numeric)
		rand.Seed(time.Now().UnixNano())

		var sb strings.Builder
		for i := 0; i < width; i++ {
			sb.WriteByte(numeric[rand.Intn(r)])
		}

		return sb.String()

	*/
	numeric := [10]byte{'0', '1', '2', '3', '4', '5', '6', '7', '8', '9'}
	r := len(numeric)

	s := rand.NewSource(time.Now().UnixNano())
	randGen := rand.New(s)

	var sb strings.Builder
	for i := 0; i < width; i++ {
		sb.WriteByte(numeric[randGen.Intn(r)])
	}

	return sb.String()
}

func (v *Verification) IsEmpty() bool {
	return len(v.codeMap) == 0
}

func (v *Verification) DeleteVerificationCode(email string) {
	delete(v.codeMap, email)
}
