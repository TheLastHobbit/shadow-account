"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Loader2, Mail, User, Lock, KeyRound, Shield, CheckCircle, ExternalLink, ArrowRight } from "lucide-react"; // ArrowRight for the new button
import { useWalletService } from "@/lib/wallet-service";

interface RegisterFormProps {
  onRegisterSuccess?: () => void;
}

export function RegisterForm({ onRegisterSuccess }: RegisterFormProps) {
  const [passport, setPassport] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [nickname, setNickname] = useState("");
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [errorDetails, setErrorDetails] = useState("");
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [registrationTxHash, setRegistrationTxHash] = useState<string | null>(null);

  // 新增状态：标记是否等待用户在看到txHash后点击“完成”按钮
  const [isAwaitingCompletion, setIsAwaitingCompletion] = useState(false);

  const walletService = useWalletService();

  const resetActionStates = () => {
    setMessage("");
    setErrorDetails("");
    setRegistrationTxHash(null);
    setIsAwaitingCompletion(false); // 确保在新的操作开始时重置此状态
  };

  const handleSendCode = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    resetActionStates(); // 开始新操作前重置消息和哈希

    if (!passport || !password || !password2 || !nickname) {
      setMessage("请填写所有必填项后再发送验证码");
      return;
    }
    if (!passport.endsWith("@qq.com")) {
      setMessage("请使用QQ邮箱地址");
      return;
    }
    if (password !== password2) {
      setMessage("两次输入的密码不匹配");
      return;
    }
    // 密码长度校验
    if (password.length < 6) {
        setMessage("密码长度至少为6位。");
        return;
    }


    setIsSendingCode(true);
    try {
      // 注意：此API端点 http://127.0.0.1:8000/user/sign-up 的具体功能需要你确认。
      // 它应该是用来发送验证码或进行预注册的。
      const response = await fetch("http://127.0.0.1:8000/user/sign-up", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          Passport: passport,
          Password: password,
          Password2: password2,
          Nickname: nickname,
        }),
      });

      const responseData = await response.json();
      if (!response.ok) {
        throw new Error(responseData.message || "发送验证码请求失败");
      }
      
      console.log("发送验证码的后端响应:", responseData);
      // 假设 responseData.message 包含了有用的反馈信息
      setMessage(responseData.message || "验证信息已提交，如果流程包含邮件发送，请查收验证码。");

    } catch (error: any) {
      console.error("发送验证码时出错:", error);
      setMessage(`发送验证码失败: ${error.message}`);
      setErrorDetails(`错误详情 (handleSendCode): ${error.stack || error.toString()}`);
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleRegister = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    resetActionStates(); // 开始注册前重置消息和哈希

    if (!passport || !password || !password2 || !nickname || !code) {
      setMessage("请填写所有字段，包括验证码。");
      return;
    }
    if (!passport.endsWith("@qq.com")) {
      setMessage("请使用QQ邮箱地址。");
      return;
    }
    if (password !== password2) {
      setMessage("两次输入的密码不匹配。");
      return;
    }
    if (password.length < 6) {
        setMessage("密码长度至少为6位。");
        return;
    }
    // 可以添加验证码格式的校验（如果需要）


    setIsRegistering(true);
    try {
      // 调用 registerUser, 它应返回 { walletAddress, txHash }
      const result = await walletService.registerUser(passport, password, nickname, code);

      setMessage(`账户创建 UserOp 已发送！AA钱包地址: ${result.walletAddress || "获取中..."}`);
      if (result.txHash) {
        setRegistrationTxHash(result.txHash);
      }
      
      setIsAwaitingCompletion(true); // 设置此状态以显示“完成”按钮，并禁用输入

      // 移除之前的自动调用 onRegisterSuccess
      // if (onRegisterSuccess) {
      //   setTimeout(() => {
      //     onRegisterSuccess();
      //   }, 1500);
      // }
    } catch (error: any) {
      console.error("注册错误:", error);
      setMessage(`注册失败: ${error.message}`);
      setErrorDetails(`错误详情 (handleRegister): ${error.stack || error.toString()}`);
      setIsAwaitingCompletion(false); // 注册失败，不进入等待完成状态
    } finally {
      setIsRegistering(false); // API调用结束
    }
  };

  // 当用户点击“完成注册并继续”按钮时调用
  const handleCompleteAndProceed = () => {
    if (onRegisterSuccess) {
      onRegisterSuccess(); // 调用外部传入的成功回调，例如跳转
    }
    // 可以在这里重置表单，或者由 onRegisterSuccess 导航离开时组件自动重置
    // resetActionStates(); // 如果不立即跳转，可以在此重置
  };


  return (
    <Card className="w-full border-0 bg-transparent shadow-none">
      <CardContent className="space-y-5 p-0">
        {/* 邮箱输入 */}
        <div className="space-y-2">
          <Label htmlFor="emailRegForm" className="text-cyan-400 flex items-center">
            <Mail className="h-4 w-4 mr-2" /> 邮箱 (QQ)
          </Label>
          <div className="relative">
            <Input
              id="emailRegForm" // 更改id以避免与登录表单冲突
              type="email"
              placeholder="your-email@qq.com"
              value={passport}
              onChange={(e) => setPassport(e.target.value)}
              required
              disabled={isRegistering || isAwaitingCompletion || isSendingCode}
              className="bg-gray-800 border-cyan-700 text-cyan-100 focus:border-cyan-500 focus:ring-cyan-500 pl-4 h-12"
            />
            <div className="absolute right-3 top-3 text-xs text-cyan-600">QQ MAIL ONLY</div>
          </div>
        </div>

        {/* 用户名输入 */}
        <div className="space-y-2">
          <Label htmlFor="nicknameRegForm" className="text-cyan-400 flex items-center">
            <User className="h-4 w-4 mr-2" /> 用户名
          </Label>
          <Input
            id="nicknameRegForm"
            type="text"
            placeholder="你的昵称"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            required
            disabled={isRegistering || isAwaitingCompletion || isSendingCode}
            className="bg-gray-800 border-cyan-700 text-cyan-100 focus:border-cyan-500 focus:ring-cyan-500 h-12"
          />
        </div>

        {/* 密码输入 */}
        <div className="space-y-2">
          <Label htmlFor="passwordRegForm" className="text-cyan-400 flex items-center">
            <Lock className="h-4 w-4 mr-2" /> 密码
          </Label>
          <Input
            id="passwordRegForm"
            type="password"
            placeholder="•••••••• (至少6位)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isRegistering || isAwaitingCompletion || isSendingCode}
            className="bg-gray-800 border-cyan-700 text-cyan-100 focus:border-cyan-500 focus:ring-cyan-500 h-12"
          />
        </div>

        {/* 确认密码输入 */}
        <div className="space-y-2">
          <Label htmlFor="password2RegForm" className="text-cyan-400 flex items-center">
            <KeyRound className="h-4 w-4 mr-2" /> 确认密码
          </Label>
          <Input
            id="password2RegForm"
            type="password"
            placeholder="••••••••"
            value={password2}
            onChange={(e) => setPassword2(e.target.value)}
            required
            disabled={isRegistering || isAwaitingCompletion || isSendingCode}
            className="bg-gray-800 border-cyan-700 text-cyan-100 focus:border-cyan-500 focus:ring-cyan-500 h-12"
          />
        </div>
        
        {/* 验证码输入与发送 */}
        <div className="space-y-2">
          <Label htmlFor="codeRegForm" className="text-cyan-400 flex items-center">
            <Shield className="h-4 w-4 mr-2" /> 验证码 (如果需要)
          </Label>
          <div className="flex space-x-2">
            <Input
              id="codeRegForm"
              type="text"
              placeholder="输入验证码"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              disabled={isRegistering || isAwaitingCompletion || isSendingCode}
              className="bg-gray-800 border-cyan-700 text-cyan-100 focus:border-cyan-500 focus:ring-cyan-500 h-12"
            />
            <Button
              onClick={handleSendCode}
              disabled={isSendingCode || !passport || !password || !password2 || !nickname || isRegistering || isAwaitingCompletion}
              className="whitespace-nowrap bg-cyan-800 hover:bg-cyan-700 text-white border border-cyan-600 min-w-[120px] h-12"
              type="button"
            >
              {isSendingCode ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />发送中</>
              ) : (
                "发送验证码"
              )}
            </Button>
          </div>
        </div>

        {/* 消息和错误提示 */}
        {message && (
          <div
            className={`p-3 rounded-md text-sm ${
              message.includes("UserOp 已发送") || message.includes("成功")
                ? "bg-green-900/50 text-green-400 border border-green-700"
                : message.includes("已提交") // "验证信息已提交..."
                ? "bg-blue-900/50 text-blue-400 border border-blue-700"
                : "bg-red-900/50 text-red-400 border border-red-700" // 其他（通常是错误）
            }`}
          >
            {(message.includes("UserOp 已发送") || message.includes("成功")) && <CheckCircle className="inline h-4 w-4 mr-1 mb-0.5" />}
            {message}
            {errorDetails && (
              <div className="mt-2 text-xs font-mono overflow-auto max-h-32 whitespace-pre-wrap border-t border-gray-700 pt-2">{errorDetails}</div>
            )}
          </div>
        )}

        {/* 显示交易哈希 */}
        {registrationTxHash && (
          <div className="p-3 mt-2 rounded-md text-sm bg-indigo-900/50 text-indigo-300 border border-indigo-700">
            <div className="flex items-center font-semibold">
              <CheckCircle className="h-4 w-4 mr-2 text-green-400" />
              用户操作(UserOp)已发送！
            </div>
            <p className="mt-1 text-xs">交易哈希:</p>
            <a
              href={`https://sepolia.etherscan.io/tx/${registrationTxHash}`} // 假设是 Sepolia 网络
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-indigo-400 hover:text-indigo-200 break-all flex items-center"
            >
              {registrationTxHash} <ExternalLink className="h-3 w-3 ml-1" />
            </a>
            <p className="text-xs mt-1">你可以通过区块浏览器查看交易状态。请等待链上确认。</p>
          </div>
        )}

        {/* 根据 isAwaitingCompletion 状态显示不同的主操作按钮 */}
        {!isAwaitingCompletion ? (
          <Button
            className="w-full h-12 bg-cyan-700 hover:bg-cyan-600 text-white border border-cyan-500 mt-6 relative overflow-hidden group"
            onClick={handleRegister}
            disabled={isRegistering || isSendingCode || !passport || !password || !password2 || !nickname || !code } // 验证码也是必须的
            type="submit" 
          >
            <span className="absolute inset-0 w-full h-full transition-all duration-300 ease-out transform translate-x-0 -skew-x-12 bg-cyan-900 group-hover:translate-x-full group-hover:skew-x-12"></span>
            <span className="absolute inset-0 w-full h-full transition-all duration-300 ease-out transform skew-x-12 bg-cyan-800 group-hover:translate-x-full group-hover:-skew-x-12"></span>
            <span className="relative flex items-center justify-center">
              {isRegistering ? (
                <><Loader2 className="mr-2 h-5 w-5 animate-spin" />正在初始化账户...</>
              ) : (
                "创建账户"
              )}
            </span>
          </Button>
        ) : (
          <Button
            className="w-full h-12 bg-green-700 hover:bg-green-600 text-white border border-green-500 mt-6 relative overflow-hidden group"
            onClick={handleCompleteAndProceed} // 修改为 handleCompleteAndProceed
            disabled={isRegistering} // 此时 isRegistering 应该是 false
          >
            <span className="absolute inset-0 w-full h-full transition-all duration-300 ease-out transform translate-x-0 -skew-x-12 bg-green-900 group-hover:translate-x-full group-hover:skew-x-12"></span>
            <span className="absolute inset-0 w-full h-full transition-all duration-300 ease-out transform skew-x-12 bg-green-800 group-hover:translate-x-full group-hover:-skew-x-12"></span>
            <span className="relative flex items-center justify-center">
              <CheckCircle className="mr-2 h-5 w-5" /> 完成并继续 <ArrowRight className="ml-2 h-4 w-4" />
            </span>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}