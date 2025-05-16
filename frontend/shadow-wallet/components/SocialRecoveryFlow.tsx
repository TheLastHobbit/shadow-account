"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Mail, Send, Check, AlertTriangle, ArrowRight, RefreshCw } from "lucide-react";
import { useSocialRecovery } from "@/hooks/useSocialRecovery";

interface SocialRecoveryFlowProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SocialRecoveryFlow({ open, onOpenChange }: SocialRecoveryFlowProps) {
  // 恢复流程状态
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [newOwner, setNewOwner] = useState("");
  const [recoveryEmail, setRecoveryEmail] = useState<{
    from: string;
    to: string;
    subject: string;
    body: string;
  } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(180); // 3分钟倒计时

  const { generateRecoveryEmail, completeRecovery } = useSocialRecovery(email);

  // 处理邮箱验证并生成邮件详情
  const handleVerifyEmail = async () => {
    if (!email) {
      setError("请输入您的邮箱地址");
      return;
    }
    if (!email.endsWith("@qq.com")) {
      setError("请使用QQ邮箱地址");
      return;
    }
    try {
      setIsProcessing(true);
      setError(null);

      // 生成邮件详情
      const { recoveryEmail, newOwner } = await generateRecoveryEmail();
      setRecoveryEmail(recoveryEmail);
      setNewOwner(newOwner);

      setStep(2);
      setSuccess("邮箱验证成功，请继续下一步");
    } catch (err) {
      setError(`邮箱验证失败: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // 处理发送邮件确认
  const handleConfirmEmailSent = async () => {
    if (!recoveryEmail) {
      setError("邮件详情未加载，请重试");
      return;
    }
    try {
      setIsProcessing(true);
      setError(null);

      // 完成恢复流程

      const { newOwner: confirmedOwner } = await completeRecovery(recoveryEmail, newOwner);
      console.log("confirmedOwner")
      setNewOwner(confirmedOwner);

      setStep(3);
      setSuccess("已确认邮件发送，系统正在验证中");
      startCountdown();
    } catch (err) {
      setError(`确认失败: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // 完成恢复
  const handleCompleteRecovery = async () => {
    try {
      setIsProcessing(true);
      setError(null);
      setStep(4);
      setSuccess("钱包恢复成功！您现在可以使用新地址管理钱包");
    } catch (err) {
      setError(`恢复失败: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // 倒计时功能
  const startCountdown = () => {
    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setStep(4);
          setSuccess("验证成功，恢复完成");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  };

  // 格式化倒计时时间
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  // 重置组件状态
  const resetState = () => {
    setStep(1);
    setEmail("");
    setNewOwner("");
    setRecoveryEmail(null);
    setIsProcessing(false);
    setError(null);
    setSuccess(null);
    setTimeRemaining(180);
  };

  // 当对话框关闭时重置状态
  useEffect(() => {
    if (!open) {
      const timer = setTimeout(() => {
        resetState();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [open]);

  // 清除通知
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError(null);
        setSuccess(null);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [error, success]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md md:max-w-lg bg-gray-900 border-cyan-600 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-cyan-300 text-xl">社交恢复</DialogTitle>
          <DialogDescription className="text-cyan-400">
            通过邮件验证恢复您的钱包访问权限
          </DialogDescription>
        </DialogHeader>

        {/* 进度指示器 */}
        <div className="relative mb-6 mt-2">
          <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-700 -translate-y-1/2"></div>
          <div
            className="absolute top-1/2 left-0 h-1 bg-cyan-600 -translate-y-1/2 transition-all duration-500"
            style={{ width: `${(step - 1) * 33}%` }}
          ></div>
          <div className="relative flex justify-between">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`flex items-center justify-center w-8 h-8 rounded-full z-10 
                  ${s < step ? "bg-cyan-600 text-white" : s === step ? "bg-cyan-800 text-white" : "bg-gray-700 text-gray-400"}`}
              >
                {s < step ? <Check className="h-4 w-4" /> : <span>{s}</span>}
              </div>
            ))}
          </div>
        </div>

        {/* 通知 */}
        {error && (
          <Alert variant="destructive" className="bg-red-900/50 border-red-700 text-red-200 mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>错误</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="bg-cyan-900/50 border-cyan-700 text-cyan-200 mb-4">
            <Check className="h-4 w-4" />
            <AlertTitle>成功</AlertTitle>
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {/* 步骤内容 */}
        <div className="py-2">
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-cyan-300 font-medium">步骤 1: 验证您的邮箱</h3>
              <p className="text-cyan-400 text-sm">
                请输入您之前用于登录的邮箱地址，我们将验证您是否是该钱包的合法所有者。
              </p>

              <div className="space-y-2">
                <Label htmlFor="recovery-email" className="text-cyan-300">
                  邮箱地址
                </Label>
                <div className="relative">
                  <Input
                    id="recovery-email"
                    type="email"
                    placeholder="your-email@qq.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-gray-800 border-cyan-700 text-cyan-100 pl-9"
                  />
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-cyan-500" />
                </div>
                <p className="text-xs text-cyan-500">必须使用您注册时的QQ邮箱</p>
              </div>

              <Button
                onClick={handleVerifyEmail}
                disabled={isProcessing || !email}
                className="w-full bg-cyan-700 hover:bg-cyan-600 text-white border border-cyan-500"
              >
                {isProcessing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <ArrowRight className="mr-2 h-4 w-4" />
                )}
                验证邮箱
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-cyan-300 font-medium">步骤 2: 发送恢复邮件</h3>
              <p className="text-cyan-400 text-sm">
                请将恢复邮件发送到指定邮箱，系统将自动解析邮件头进行验证。
              </p>

              <Card className="bg-gray-800 border-cyan-700">
                <CardHeader className="pb-2">
                  <CardTitle className="text-cyan-300 text-base">邮件详情</CardTitle>
                </CardHeader>
                <CardContent>
                  {recoveryEmail ? (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-cyan-400 text-sm">发送至:</span>
                        <code className="bg-gray-900 px-2 py-1 rounded text-cyan-300 text-sm">
                          {recoveryEmail.to}
                        </code>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-cyan-400 text-sm">邮件主题:</span>
                        <code className="bg-gray-900 px-2 py-1 rounded text-cyan-300 text-sm">
                          {recoveryEmail.subject}
                        </code>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-cyan-400 text-sm">正文:</span>
                        <code className="bg-gray-900 px-2 py-1 rounded text-cyan-300 text-sm break-all">
                          {recoveryEmail.body}
                        </code>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-center items-center py-4">
                      <Loader2 className="h-6 w-6 text-cyan-500 animate-spin" />
                      <span className="ml-2 text-cyan-300">加载邮件详情...</span>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="border-t border-cyan-800/50 pt-3">
                  <p className="text-xs text-cyan-500 w-full">
                    请确保邮件正文与系统提供的内容一致，勿修改
                  </p>
                </CardFooter>
              </Card>

              <Alert className="bg-yellow-900/30 border-yellow-800 text-yellow-300">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>重要提示</AlertTitle>
                <AlertDescription className="text-yellow-400 text-sm">
                  请确保从您注册的QQ邮箱发送此邮件，系统将验证发件人地址
                </AlertDescription>
              </Alert>

              <Button
                onClick={handleConfirmEmailSent}
                disabled={isProcessing || !recoveryEmail}
                className="w-full bg-cyan-700 hover:bg-cyan-600 text-white border border-cyan-500"
              >
                {isProcessing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                我已发送恢复邮件
              </Button>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h3 className="text-cyan-300 font-medium">步骤 3: 系统验证中</h3>
              <p className="text-cyan-400 text-sm">
                系统正在解析邮件头并在链上验证您的身份，请稍候...
              </p>

              <div className="bg-gray-800 border border-cyan-700 rounded-md p-4">
                <div className="flex flex-col items-center justify-center py-4">
                  <div className="relative">
                    <RefreshCw className="h-12 w-12 text-cyan-500 animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs font-mono text-cyan-300">{formatTime(timeRemaining)}</span>
                    </div>
                  </div>
                  <p className="mt-4 text-cyan-300 font-medium">验证进行中</p>
                  <p className="text-sm text-cyan-400 mt-1">预计剩余时间: {formatTime(timeRemaining)}</p>
                </div>

                <div className="mt-4 space-y-2">
                  <div className="flex items-center">
                    <Check className="h-4 w-4 text-green-500 mr-2" />
                    <span className="text-sm text-cyan-300">邮件接收检查</span>
                  </div>
                  <div className="flex items-center">
                    <Check className="h-4 w-4 text-green-500 mr-2" />
                    <span className="text-sm text-cyan-300">邮件头解析</span>
                  </div>
                  <div className="flex items-center">
                    {timeRemaining > 120 ? (
                      <Loader2 className="h-4 w-4 text-yellow-500 animate-spin mr-2" />
                    ) : (
                      <Check className="h-4 w-4 text-green-500 mr-2" />
                    )}
                    <span className="text-sm text-cyan-300">DKIM 签名验证</span>
                  </div>
                  <div className="flex items-center">
                    {timeRemaining > 60 ? (
                      <Loader2 className="h-4 w-4 text-yellow-500 animate-spin mr-2" />
                    ) : (
                      <Check className="h-4 w-4 text-green-500 mr-2" />
                    )}
                    <span className="text-sm text-cyan-300">链上身份验证</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center pt-2">
                <Button
                  variant="outline"
                  disabled={isProcessing}
                  className="border-cyan-700 text-cyan-300 hover:bg-cyan-900/50"
                  onClick={() => setStep(2)}
                >
                  返回上一步
                </Button>

                <Button
                  onClick={handleCompleteRecovery}
                  disabled={timeRemaining > 10}
                  className="bg-cyan-700 hover:bg-cyan-600 text-white border border-cyan-500"
                >
                  {timeRemaining > 10 ? "请等待验证完成" : "继续"}
                </Button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <div className="bg-green-900/30 border border-green-700 rounded-md p-6 text-center">
                <Check className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-green-300 font-medium text-lg mb-2">恢复成功！</h3>
                <p className="text-green-400 text-sm">
                  您的钱包已成功恢复，新所有者地址为：<br />
                  <code className="bg-gray-900 px-2 py-1 rounded text-green-300 text-sm">{newOwner}</code>
                </p>
              </div>

              <Button
                onClick={() => {
                  onOpenChange(false);
                  resetState();
                }}
                className="w-full bg-cyan-700 hover:bg-cyan-600 text-white border border-cyan-500"
              >
                完成
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}