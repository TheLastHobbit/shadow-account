package email

import (
	"context"
	"fmt"
	"github.com/gogf/gf-demo-user/v2/internal/model"
	"github.com/gogf/gf-demo-user/v2/internal/service"
	"net/smtp"
)

type (
	sEmail struct{}
)

func init() {
	service.RegisterEmail(New())
}

func New() service.IEmail {
	return &sEmail{}
}

func (s sEmail) SendEmail(ctx context.Context, in model.EmailSendInput) (err error) {
	// SMTP服务器地址和端口号
	smtpHost := "smtp.gmail.com"
	smtpPort := "587"
	// 设置邮件内容
	message := []byte("To: " + in.To + "\r\n" +
		"Subject: " + in.Subject + "\r\n" +
		"\r\n" +
		in.Body + "\r\n")

	// 连接到SMTP服务器
	auth := smtp.PlainAuth("", in.From, in.Password, smtpHost)

	// 发送邮件
	err = smtp.SendMail(smtpHost+":"+smtpPort, auth, in.From, []string{in.To}, message)
	if err != nil {
		fmt.Println("Error sending email:", err)
		return err
	}

	fmt.Println("Email sent successfully.")
	return nil
}

func (s sEmail) GetEmail(ctx context.Context) []byte {
	//TODO implement me
	panic("implement me")
}
