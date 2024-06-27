package user

import (
	"context"
	"fmt"
	v1 "github.com/gogf/gf-demo-user/v2/api/user/v1"
	"github.com/gogf/gf-demo-user/v2/internal/service"
	"os"
	"time"
)

func (c *ControllerV1) GetMessage(cxt context.Context, req *v1.GetMessageReq) (res *v1.GetMessageRes, err error) {
	// 等待邮件发送成功
	time.Sleep(10 * time.Second)
	// 获取邮件
	service.Email().GetEmail(cxt)
	content, err := os.ReadFile("text/email.txt")
	// r := g.RequestFromCtx(cxt)
	// r.Response.Write(content)
	fmt.Println(string(content))
	return

}
