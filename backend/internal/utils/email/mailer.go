package email

import (
	"fmt"
	"net/smtp"
)

// TODO 怎么把这两个常量隐藏起来
const (
	// 发件人邮箱地址Gmail
	from = ""
	// 发件人邮箱密码（注意：这里是应用密码，而不是你的Gmail账号密码）
	password = ""
)

// SendMail 发送邮件 subject:邮件主题 body:邮件内容 to:收件人邮箱地址
func SendMail(subject, body, to string) error {
	// SMTP服务器地址和端口号
	smtpHost := "smtp.gmail.com"
	smtpPort := "587"
	// 设置邮件内容
	message := []byte("To: " + to + "\r\n" +
		"Subject: " + subject + "\r\n" +
		"\r\n" +
		body + "\r\n")

	// 连接到SMTP服务器
	auth := smtp.PlainAuth("", from, password, smtpHost)

	// 发送邮件
	err := smtp.SendMail(smtpHost+":"+smtpPort, auth, from, []string{to}, message)
	if err != nil {
		fmt.Println("Error sending email:", err)
		return err
	}

	fmt.Println("Email sent successfully.")
	return nil
}
