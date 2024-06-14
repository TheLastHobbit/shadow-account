package hash

import (
	"crypto/sha1"
	"fmt"
)

func GenerateSHA1Hash(input string) string {
	hasher := sha1.New()
	hasher.Write([]byte(input))
	hash := hasher.Sum(nil)
	return fmt.Sprintf("%x", hash)
}
