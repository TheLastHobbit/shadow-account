const express = require("express");
const router = express.Router();
const Imap = require("imap");
const { simpleParser } = require("mailparser");

// IMAP 配置（163 邮箱）
const imapConfig = {
  user: "18328555534@163.com",
  password: "SS5BQUeEp2GBXUyp",
  host: "imap.163.com",
  port: 993,
  tls: true,
  tlsOptions: { rejectUnauthorized: false },
};

// 提取邮箱地址（忽略昵称）
const extractEmailAddress = (fromHeader) => {
  if (!fromHeader) return "";
  const text = typeof fromHeader === "object" ? fromHeader.text : fromHeader;
  const match = text.match(/<([^>]+)>/) || text.match(/([^\s<]+@[^\s>]+)/);
  return match ? match[1] : text;
};

// 读取邮件并解析
const fetchLatestEmail = (userEmail, subject) => {
  return new Promise((resolve, reject) => {
    const imap = new Imap(imapConfig);

    imap.once("ready", () => {
      imap.id(
        {
          name: "myclient",
          version: "1.0.0",
          vendor: "mycompany",
          "support-email": "support@mycompany.com",
        },
        (err, response) => {
          if (err) {
            console.error("IMAP ID 命令失败:", err);
            return reject(err);
          }
          console.log("IMAP ID 命令成功:", response);

          imap.openBox("INBOX", false, (err, box) => {
            if (err) return reject(err);
            console.log("收件箱打开，邮件总数:", box.messages.total);

            // 调试：列出所有邮件头
            imap.search(["ALL"], (err, allResults) => {
              if (err) console.error("搜索所有邮件错误:", err);
              if (allResults && allResults.length > 0) {
                const fetch = imap.fetch(allResults, { bodies: "HEADER.FIELDS (FROM SUBJECT)" });
                fetch.on("message", (msg) => {
                  msg.on("body", (stream) => {
                    simpleParser(stream, (err, parsed) => {
                      if (err) console.error("解析邮件头错误:", err);
                      console.log("邮件头:", {
                        from: parsed.headers.get("from"),
                        extractedEmail: extractEmailAddress(parsed.headers.get("from")),
                        subject: parsed.headers.get("subject"),
                      });
                    });
                  });
                });
                fetch.once("end", () => console.log("完成邮件头解析"));
              }

              // 直接使用最新邮件
              const results = allResults || [];
              if (!results || results.length === 0) {
                return reject(new Error("收件箱为空，未找到任何邮件"));
              }

              const latestEmailId = results[results.length - 1];
              console.log("最新邮件 ID:", latestEmailId);
              const fetch = imap.fetch(latestEmailId, { bodies: "" });

              fetch.on("message", (msg) => {
                msg.on("body", (stream) => {
                  simpleParser(stream, (err, parsed) => {
                    if (err) return reject(err);
                    console.log("完整邮件解析:", {
                      headers: parsed.headers,
                      text: parsed.text,
                      html: parsed.textAsHtml,
                    });

                    const headers = parsed.headers;
                    const fromEmail = extractEmailAddress(headers.get("from"));
                    const mailSubject = headers.get("subject") || "";

                    // 验证发件人和主题
                    if (fromEmail !== userEmail || mailSubject !== subject) {
                      return reject(
                        new Error(
                          `邮件不匹配: 期望 ${userEmail} 和 ${subject}, 实际 ${fromEmail} 和 ${mailSubject}`
                        )
                      );
                    }

                    let toSign = headers.get("dkim-signature");
                    console.log("原始 DKIM-Signature:", toSign);
                    if (toSign && typeof toSign === "object") {
                      const dkimFields = Object.entries(toSign.params)
                        .map(([key, value]) => `${key}=${value}`)
                        .join("; ");
                      toSign = `v=${toSign.value}; ${dkimFields}`;
                    } else if (!toSign) {
                      toSign = headers.get("raw")?.match(/DKIM-Signature:.*/)?.[0] || "";
                    }
                    if (!toSign) {
                      return reject(new Error("未找到 DKIM-Signature 头"));
                    }
                    toSign = `DKIM-Signature: ${toSign}`;
                    console.log("toSign:", toSign);

                    let body = parsed.text || parsed.textAsHtml || "";
                    let base64Encoded = false;
                    body = body.trim();
                    console.log("Body:", body);
                    console.log("Base64 Encoded:", base64Encoded);

                    const dkimFields = toSign.split(";");
                    let sign = "";
                    for (const field of dkimFields) {
                      if (field.trim().startsWith("b=")) {
                        sign = field.split("b=")[1].trim();
                        break;
                      }
                    }
                    if (!sign) {
                      console.log("DKIM 字段:", dkimFields);
                      return reject(new Error("未找到 DKIM 签名 (b= 字段)"));
                    }
                    console.log("Sign:", sign);

                    resolve({ toSign, body, sign, base64Encoded });
                  });
                });
              });

              fetch.once("error", (err) => reject(err));
              fetch.once("end", () => imap.end());
            });
          });
        }
      );
    });

    imap.once("error", (err) => {
      console.error("IMAP 错误:", err);
      reject(err);
    });
    imap.once("end", () => console.log("IMAP 连接关闭"));
    imap.connect();
  });
};

// API 端点：解析恢复邮件
router.post("/parse-recovery-email", async (req, res) => {
  try {
    console.log("收到请求 body:", req.body);
    const { userEmail, subject } = req.body;
    console.log("userEmail:", userEmail);
    console.log("subject:", subject);
    if (!userEmail || !subject) {
      return res.status(400).json({ error: "缺少 userEmail 或 subject 参数" });
    }

    const result = await fetchLatestEmail(userEmail, subject);
    res.json(result);
  } catch (error) {
    console.error("邮件解析错误:", error.message);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;