package model

type EmailSendInput struct {
	Subject  string
	Body     string
	To       string
	From     string
	Password string
}
