package model

type EncryptInput struct {
	Secret []byte
	N      int
	Num    int
}

type DecryptInput struct {
	Shares [][]byte
	N      int
}
