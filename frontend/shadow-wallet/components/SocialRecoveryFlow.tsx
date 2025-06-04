"use client";

import { useState, useEffect, useCallback } from "react"; // useCallback for helper
import { ethers } from "ethers"; // For contract interaction
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
// import { Card, CardContent } from "@/components/ui/card"; // Removed unused Card parts
import { Loader2, Mail, Send, Check, AlertTriangle, ArrowRight, RefreshCw, Lock, ExternalLink,CheckCircle } from "lucide-react";
import { useSocialRecovery } from "@/hooks/useSocialRecovery";
import { updateUserEOAShares } from "../lib/wallet-service"; // 确保路径正确
import WALLET_ABI from "../contracts/wallet.json"; // AA钱包的ABI
import { useWallet } from "../contexts/WalletContext"; // 假设从这里获取provider
import { 
  Card, 
  CardContent, 
  CardDescription, // 添加 CardDescription
  CardFooter,    // 添加 CardFooter (如果你在步骤2的UI中使用了它)
  CardHeader,    // 添加 CardHeader
  CardTitle      // 添加 CardTitle
} from "@/components/ui/card";

// 假设后端API基础URL
const API_BASE_URL = "http://localhost:3001"; // 修改为你的后端API地址

interface SocialRecoveryFlowProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SocialRecoveryFlow({ open, onOpenChange }: SocialRecoveryFlowProps) {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [newOwner, setNewOwner] = useState(""); // AA wallet 的新 EOA owner 地址
  const [newPrivateKeyForEOA, setNewPrivateKeyForEOA] = useState("");
  const [aaWalletAddress, setAaWalletAddress] = useState("");

  const [recoveryEmailDetails, setRecoveryEmailDetails] = useState<{
    from: string;
    to: string;
    subject: string;
    body: string;
  } | null>(null);

  const [onChainRecoveryTxHash, setOnChainRecoveryTxHash] = useState<string | null>(null); // 存储链上恢复操作的txHash
  const [isVerifyingOnChain, setIsVerifyingOnChain] = useState(false); // 标记是否正在验证链上状态

  const [newPasswordInput, setNewPasswordInput] = useState("");
  const [confirmNewPasswordInput, setConfirmNewPasswordInput] = useState("");

  const [isProcessing, setIsProcessing] = useState(false); // 通用处理状态
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const { generateRecoveryEmail, completeRecovery } = useSocialRecovery(email); // email会作为依赖传递
  const { provider } = useWallet(); // 从 WalletContext 获取 provider

  const resetActionStates = useCallback(() => {
    setError(null);
    setSuccess(null);
    setIsProcessing(false);
    setIsVerifyingOnChain(false);
    setOnChainRecoveryTxHash(null);
  }, []);


  const handleVerifyEmail = async () => {
    if (!email) { setError("请输入您的邮箱地址"); return; }
    if (!email.endsWith("@qq.com")) { setError("请使用QQ邮箱地址"); return; }
    
    setIsProcessing(true);
    resetActionStates();
    try {
      const { recoveryEmail: recEmail, newOwner: generatedOwner, privateKey: pkForNewOwner, walletAddress: currentAAWallet } = await generateRecoveryEmail();
      setRecoveryEmailDetails(recEmail);
      setNewOwner(generatedOwner);
      setNewPrivateKeyForEOA(pkForNewOwner);
      setAaWalletAddress(currentAAWallet);
      setStep(2);
      setSuccess("邮箱验证成功，请准备发送恢复邮件。");
    } catch (err: any) {
      setError(`邮箱验证失败: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmEmailSent = async () => {
    if (!recoveryEmailDetails || !newOwner) { setError("恢复信息不完整，请重试。"); return; }
    
    setIsProcessing(true);
    resetActionStates();
    try {
      // completeRecovery 现在应返回包含 txHash 的对象
      // 例如: { receipt: { txHash: string }, newOwner: string }
      const recoveryResult = await completeRecovery(recoveryEmailDetails, newOwner);
      
      if (!recoveryResult?.receipt?.txHash) {
        throw new Error("未能从恢复操作中获取交易哈希。");
      }
      setOnChainRecoveryTxHash(recoveryResult.receipt.txHash);
      setStep(3); // 进入链上验证阶段
      setSuccess(`恢复交易已发送 (哈希: ${recoveryResult.receipt.txHash.substring(0,10)}...)，正在等待链上确认所有权变更...`);
    } catch (err: any) {
      setError(`确认邮件发送或链上恢复操作提交失败: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // useEffect 用于处理步骤3的链上验证逻辑
  useEffect(() => {
    if (step === 3 && onChainRecoveryTxHash && provider && aaWalletAddress && newOwner && !isVerifyingOnChain) {
      const verifyOwnerChange = async () => {
        setIsVerifyingOnChain(true);
        setError(null);
        setSuccess(`正在验证交易 ${onChainRecoveryTxHash.substring(0,10)}... 的链上状态。`);
        try {
          console.log(`等待交易 ${onChainRecoveryTxHash} 被打包...`);
          const txReceipt = await provider.waitForTransaction(onChainRecoveryTxHash, 1, 180000); // 等待1个确认，超时180秒

          if (!txReceipt || txReceipt.status === 0) {
            throw new Error(`恢复交易 ${onChainRecoveryTxHash} 失败或被回滚。`);
          }
          console.log("恢复交易已确认:", txReceipt);

          setSuccess("恢复交易已确认。正在验证AA钱包新的所有者...");

          const aaWalletContract = new ethers.Contract(aaWalletAddress, WALLET_ABI, provider);
          const currentOwnerOnChain = await aaWalletContract.owner();
          console.log("链上当前Owner:", currentOwnerOnChain, "期望的NewOwner:", newOwner);

          if (currentOwnerOnChain.toLowerCase() === newOwner.toLowerCase()) {
            setSuccess("链上所有权变更已成功验证！");
            // 链上验证成功，现在进行密钥分片更新并进入密码重设步骤
            await handleSharesUpdateAndProceedToPasswordReset();
          } else {
            throw new Error(`链上所有权验证失败。期望的owner是 ${newOwner}，但实际是 ${currentOwnerOnChain}。`);
          }
        } catch (err: any) {
          console.error("链上验证过程中出错:", err);
          setError(`链上验证失败: ${err.message}。请检查交易状态或稍后重试。`);
          // 考虑是否允许用户重试此步骤或返回上一步
        } finally {
          setIsVerifyingOnChain(false);
        }
      };
      verifyOwnerChange();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, onChainRecoveryTxHash, provider, aaWalletAddress, newOwner]); // isVerifyingOnChain 不作为依赖以防止重复触发


  const handleSharesUpdateAndProceedToPasswordReset = async () => {
    if (!newPrivateKeyForEOA || !email || !aaWalletAddress) {
      setError("恢复所需信息不完整，无法更新密钥分片。");
      // 可能需要将用户导向某个错误处理流程或重试
      setStep(3); // 或者保持在当前步骤，让用户看到错误
      return;
    }
    setIsProcessing(true); // 使用通用isProcessing
    // setError(null); // resetActionStates 中已包含
    // setSuccess(null);
    try {
      console.log("准备更新EOA密钥分片:", { privateKeyLength: newPrivateKeyForEOA.length, email, aaWalletAddress });
      // newPrivateKeyForEOA 来自 ethers.Wallet.createRandom().privateKey，是带0x的hex
      // updateUserEOAShares 内部的 Buffer.from(hex, 'hex') 可以处理带0x或不带0x的
      const shareUpdateResult = await updateUserEOAShares(newPrivateKeyForEOA, email, aaWalletAddress);

      if (!shareUpdateResult.success && shareUpdateResult.error) {
        console.warn("部分或全部分片更新可能失败:", shareUpdateResult);
        setError(`密钥分片更新未完全成功。错误: ${shareUpdateResult.error}。您仍可尝试重设密码，但后续登录可能存在问题。`);
      } else if (!shareUpdateResult.success) {
        console.warn("部分或全部分片更新可能失败，但没有明确错误信息:", shareUpdateResult);
        setSuccess("密钥分片更新已尝试。请继续重设您的登录密码。");
      } else {
        setSuccess("新的EOA密钥分片已更新。请重设您的登录密码。");
      }
      setStep(4); // 进入设置新密码步骤
    } catch (err: any) {
      console.error("更新EOA密钥分片时出错:", err);
      setError(`更新密钥分片失败: ${err.message}。`);
       // 保持在当前步骤或提供重试选项
      setStep(3); // 例如，让用户可以重新触发验证（如果适用）或看到错误
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSetNewPassword = async () => {
    if (!newPasswordInput || !confirmNewPasswordInput) { setError("新密码和确认密码均不能为空。"); return; }
    if (newPasswordInput !== confirmNewPasswordInput) { setError("两次输入的密码不一致。"); return; }
    if (newPasswordInput.length < 6) { setError("新密码长度至少为6位。"); return; }

    setIsProcessing(true);
    resetActionStates(); // 清除旧消息
    try {
      const response = await fetch(`${API_BASE_URL}/wallet/update-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, newPassword: newPasswordInput }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `密码更新失败`);
      }
      setStep(5);
      setSuccess("密码已成功重设！钱包恢复流程完成。您现在可以使用新密码登录。");
    } catch (err: any) {
      setError(`设置新密码失败: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const resetApplicationState = useCallback(() => { // 重置组件内部状态
    setStep(1);
    setEmail("");
    setNewOwner("");
    setNewPrivateKeyForEOA("");
    setAaWalletAddress("");
    setRecoveryEmailDetails(null);
    setOnChainRecoveryTxHash(null);
    setNewPasswordInput("");
    setConfirmNewPasswordInput("");
    resetActionStates();
  }, [resetActionStates]);


  useEffect(() => { // 对话框关闭时重置状态
    if (!open) {
      const timer = setTimeout(() => {
        resetApplicationState();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [open, resetApplicationState]);

  useEffect(() => { // 自动清除通知
    if (error || success) {
      const timer = setTimeout(() => {
        setError(null);
        setSuccess(null);
      }, 7000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);
  
  const progressIndicatorSteps = 5;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md md:max-w-lg bg-gray-900 border-cyan-600 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-cyan-300 text-xl">社交恢复</DialogTitle>
          <DialogDescription className="text-cyan-400">
            通过邮件验证恢复您的钱包访问权限并重设密码
          </DialogDescription>
        </DialogHeader>

        {/* 进度指示器 (与之前相同，步骤数为5) */}
        <div className="relative mb-6 mt-2">
          <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-700 -translate-y-1/2"></div>
          <div
            className="absolute top-1/2 left-0 h-1 bg-cyan-600 -translate-y-1/2 transition-all duration-500"
            style={{ width: `${(step - 1) * (100 / (progressIndicatorSteps -1))}%` }}
          ></div>
          <div className="relative flex justify-between">
            {[...Array(progressIndicatorSteps).keys()].map((s_idx) => {
              const s_num = s_idx + 1;
              return (
                <div
                  key={s_num}
                  className={`flex items-center justify-center w-8 h-8 rounded-full z-10 
                    ${s_num < step ? "bg-cyan-600 text-white" : s_num === step ? "bg-cyan-800 text-white" : "bg-gray-700 text-gray-400"}`}
                >
                  {s_num < step ? <Check className="h-4 w-4" /> : <span>{s_num}</span>}
                </div>
              );
            })}
          </div>
        </div>

        {/* 通知区域 */}
        {error && (
          <Alert variant="destructive" className="bg-red-900/50 border-red-700 text-red-200 mb-4">
            <AlertTriangle className="h-4 w-4" /> <AlertTitle>错误</AlertTitle> <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {success && (
          <Alert className="bg-cyan-900/50 border-cyan-700 text-cyan-200 mb-4">
            <Check className="h-4 w-4" /> <AlertTitle>成功</AlertTitle> <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        <div className="py-2">
          {step === 1 && ( /* 步骤 1: 验证邮箱 UI */
            <div className="space-y-4">
              <h3 className="text-cyan-300 font-medium">步骤 1: 验证您的邮箱</h3>
              <div className="space-y-2">
                <Label htmlFor="recovery-email-flow" className="text-cyan-300">邮箱地址</Label>
                <div className="relative">
                  <Input id="recovery-email-flow" type="email" placeholder="your-email@qq.com" value={email} onChange={(e) => setEmail(e.target.value)} className="bg-gray-800 border-cyan-700 text-cyan-100 pl-9 h-12"/>
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-cyan-500" />
                </div>
                <p className="text-xs text-cyan-500">必须是您注册时使用的QQ邮箱。</p>
              </div>
              <Button onClick={handleVerifyEmail} disabled={isProcessing || !email} className="w-full bg-cyan-700 hover:bg-cyan-600 text-white h-12">
                {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowRight className="mr-2 h-4 w-4" />} 验证邮箱
              </Button>
            </div>
          )}

          {step === 2 && ( /* 步骤 2: 发送恢复邮件 UI */
             <div className="space-y-4">
              <h3 className="text-cyan-300 font-medium">步骤 2: 发送恢复邮件</h3>
              <p className="text-cyan-400 text-sm">请将以下邮件详情通过您的注册邮箱发送到指定地址。</p>
              <Card className="bg-gray-800 border-cyan-700">
                <CardHeader className="pb-2"><CardTitle className="text-cyan-300 text-base">邮件详情</CardTitle></CardHeader>
                <CardContent>
                  {recoveryEmailDetails ? (
                    <div className="space-y-3 text-xs sm:text-sm">
                      <div><span className="text-cyan-400">发送至:</span> <code className="bg-gray-900 px-2 py-1 rounded text-cyan-300">{recoveryEmailDetails.to}</code></div>
                      <div><span className="text-cyan-400">邮件主题:</span> <code className="bg-gray-900 px-2 py-1 rounded text-cyan-300">{recoveryEmailDetails.subject}</code></div>
                      <div><span className="text-cyan-400">正文:</span> <code className="bg-gray-900 px-2 py-1 rounded text-cyan-300 break-all">{recoveryEmailDetails.body}</code></div>
                    </div>
                  ) : <p className="text-cyan-300">正在加载邮件详情...</p>}
                </CardContent>
              </Card>
              <Button onClick={handleConfirmEmailSent} disabled={isProcessing || !recoveryEmailDetails} className="w-full bg-cyan-700 hover:bg-cyan-600 text-white h-12">
                {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />} 我已发送恢复邮件
              </Button>
            </div>
          )}

          {step === 3 && ( /* 步骤 3: 系统链上验证 UI */
            <div className="space-y-4 text-center">
              <h3 className="text-cyan-300 font-medium">步骤 3: 等待链上确认</h3>
              {onChainRecoveryTxHash && (
                <div className="p-3 rounded-md text-sm bg-gray-800 border border-gray-700">
                  <p className="text-cyan-400">恢复交易已发送，正在等待链上确认所有权变更。</p>
                  <p className="text-xs text-gray-500 mt-1">交易哈希:</p>
                  <a
                    href={`https://sepolia.etherscan.io/tx/${onChainRecoveryTxHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-cyan-500 hover:text-cyan-300 break-all flex items-center justify-center"
                  >
                    {onChainRecoveryTxHash} <ExternalLink className="h-3 w-3 ml-1" />
                  </a>
                </div>
              )}
              {isVerifyingOnChain && (
                <div className="flex flex-col items-center justify-center py-4">
                  <Loader2 className="h-12 w-12 text-cyan-500 animate-spin" />
                  <p className="mt-4 text-cyan-300 font-medium">正在验证链上状态...</p>
                </div>
              )}
              {!isVerifyingOnChain && !onChainRecoveryTxHash && ( // 如果还没有txHash （例如 completeRecovery 失败）
                 <p className="text-red-400">提交恢复交易时遇到问题，请重试或返回上一步。</p>
              )}
            </div>
          )}
          
          {step === 4 && ( /* 步骤 4: 重设密码 UI */
            <div className="space-y-4">
              <h3 className="text-cyan-300 font-medium">步骤 4: 重设您的登录密码</h3>
              <p className="text-cyan-400 text-sm">账户所有权已在链上恢复。现在请为您的账户设置一个新的登录密码。</p>
              <div className="space-y-2">
                <Label htmlFor="new-password-recovery" className="text-cyan-300 flex items-center"><Lock className="h-4 w-4 mr-2" /> 新密码</Label>
                <Input id="new-password-recovery" type="password" placeholder="输入新密码 (至少6位)" value={newPasswordInput} onChange={(e) => setNewPasswordInput(e.target.value)} className="bg-gray-800 border-cyan-700 text-cyan-100 h-12"/>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-new-password-recovery" className="text-cyan-300 flex items-center"><Lock className="h-4 w-4 mr-2" /> 确认新密码</Label>
                <Input id="confirm-new-password-recovery" type="password" placeholder="再次输入新密码" value={confirmNewPasswordInput} onChange={(e) => setConfirmNewPasswordInput(e.target.value)} className="bg-gray-800 border-cyan-700 text-cyan-100 h-12"/>
              </div>
              <Button onClick={handleSetNewPassword} disabled={isProcessing || !newPasswordInput || !confirmNewPasswordInput} className="w-full bg-cyan-700 hover:bg-cyan-600 text-white h-12">
                {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />} 设置新密码并完成
              </Button>
            </div>
          )}

          {step === 5 && ( /* 步骤 5: 最终成功 UI */
            <div className="space-y-4 text-center">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-3" />
              <h3 className="text-green-300 font-medium text-lg">恢复全部完成！</h3>
              <p className="text-green-400 text-sm">
                您的钱包所有权已恢复至新地址，并且新的登录密码已设置成功。
              </p>
              <div className="bg-gray-800 p-3 rounded-md border border-gray-700">
                <p className="text-xs text-gray-400">新的钱包控制地址 (EOA Owner):</p>
                <code className="text-sm text-green-300 break-all">{newOwner}</code>
              </div>
              <p className="text-green-400 text-sm mt-2">您现在可以使用邮箱和新设置的密码登录系统。</p>
              <Button onClick={() => { onOpenChange(false); }} className="w-full bg-cyan-700 hover:bg-cyan-600 text-white h-12 mt-4">
                完成
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}