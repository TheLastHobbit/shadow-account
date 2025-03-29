package email

import (
	"context"
	"fmt"
	"github.com/emersion/go-imap"
	id "github.com/emersion/go-imap-id"
	"github.com/emersion/go-imap/client"
	"github.com/emersion/go-message/charset"
	"github.com/emersion/go-message/mail"
	"github.com/gogf/gf-demo-user/v2/internal/model"
	"github.com/gogf/gf-demo-user/v2/internal/service"
	"github.com/gogf/gf/v2/errors/gerror"
	"io"
	"log"
	"net/smtp"
	"os"
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
	// 设置认证信息。
	auth := smtp.PlainAuth("", "18328555534@163.com", "YXaDp64twtQFqmMw", "smtp.163.com")

	// 设置发送的邮件内容。
	message := []byte("To: " + in.To + "\r\n" +
		"Subject: " + in.Subject + "\r\n" +
		"\r\n" +
		in.Body + "\r\n")

	// 发送邮件。
	err = smtp.SendMail("smtp.163.com:25", auth, "18328555534@163.com", []string{in.To}, message)
	if err != nil {
		fmt.Println("Error sending email:", err)
		return
	}
	fmt.Println("Email sent successfully.")
	return nil
}

func (s sEmail) GetEmail(ctx context.Context) (err error) {
	log.Println("连接服务器中...")
	c, err := client.DialTLS("imap.163.com:993", nil)
	idClient := id.NewClient(c)
	idClient.ID(
		id.ID{
			id.FieldName:    "IMAPClient",
			id.FieldVersion: "3.1.0",
		},
	)
	if err != nil {
		return err
	}
	if err != nil {
		return
	}
	log.Println("连接成功")
	defer c.Logout()

	// 登录
	err = c.Login("18328555534@163.com", "YXaDp64twtQFqmMw")
	if err != nil {
		return
	}

	log.Println("登陆成功")

	// 选择收件箱
	mbox, err := c.Select("INBOX", false)
	if err != nil {
		return
	}

	// 获得最新的一封邮件
	seqset := new(imap.SeqSet)
	seqset.AddNum(mbox.Messages)

	messages := make(chan *imap.Message, 1)
	section := imap.BodySectionName{}
	items := []imap.FetchItem{section.FetchItem()}
	done := make(chan error, 1)
	go func() {
		done <- c.Fetch(seqset, items, messages)
	}()
	log.Println("正在获取最新邮件")
	imap.CharsetReader = charset.Reader
	// 打开文件用于写入
	file, err := os.OpenFile("text/email.txt", os.O_WRONLY|os.O_CREATE, 0666)
	if err != nil {
		return
	}
	defer file.Close()
	for msg := range messages {
		r := msg.GetBody(&section)
		if r == nil {
			err = gerror.New("服务器未返回邮件正文")
			return
		}

		// 将邮件的原始内容复制到文件
		if _, err = io.Copy(file, r); err != nil {
			return
		}

		mr, err := mail.CreateReader(r)
		if err != nil {
			log.Fatal(err)
		}

		// 处理邮件正文
		for {
			p, err := mr.NextPart()
			if err == io.EOF {
				break
			} else if err != nil {
				log.Fatal("NextPart:err ", err)
			}

			switch h := p.Header.(type) {
			case *mail.InlineHeader:
			case *mail.AttachmentHeader:
				// 正文内附件
				filename, _ := h.Filename()
				log.Printf("attachment: %v\n", filename)
			}
		}
	}
	log.Println("获取邮件成功")

	return nil
}
