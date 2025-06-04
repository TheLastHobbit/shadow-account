"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Loader2, Shield, Wallet, Send, AlertTriangle, Check, RefreshCw, ScrollText, ArrowRight, Users } from "lucide-react";
import { ethers } from "ethers";
import { H2 } from '../../lib/crypto';
const { ec: EC } = require('elliptic');
const secp256k1 = new EC('secp256k1');
import { useWallet } from '../../contexts/WalletContext';

// Wallet type definitions
interface Wallet {
  id: string;
  address: string;
  type: "standard" | "shadow";
  createdAt: number;
}

interface Transaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  timestamp: number;
  status: "pending" | "success" | "failed";
  error?: string;
}

interface DebugLog {
  timestamp: number;
  message: string;
}

interface ShadowAccountModuleProps {
  rootAddress: string;
  walletService: any;
  onSendTransaction?: (txData: any) => Promise<string>;
}

export function ShadowAccountModule({ rootAddress, walletService, onSendTransaction }: ShadowAccountModuleProps) {
  const { userEmail, provider, setShadowWalletAddress } = useWallet();
  
  // Shadow mode state
  const [isShadowMode, setIsShadowMode] = useState(false);
  const [showRootAccountPrompt, setShowRootAccountPrompt] = useState(false);

  // Wallet state
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);
  const [availableWallets, setAvailableWallets] = useState<{ address: string; ringMembers: string[] }[]>([]);
  const [balance, setBalance] = useState("0.0");
  const [address, setAddress] = useState("");
  const [shadowAddress, setShadowAddress] = useState("");
  const [isLoadingWallet, setIsLoadingWallet] = useState(true);

  // Transaction state
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [isTransacting, setIsTransacting] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // Ring members state
  const [ringMembers, setRingMembers] = useState<string[]>([]);
  const [isLoadingRingMembers, setIsLoadingRingMembers] = useState(false);

  // Private key state
  const [rootPrivateKey, setRootPrivateKey] = useState<string | null>(null);
  const [showPrivateKeyPrompt, setShowPrivateKeyPrompt] = useState(false);
  const [showInputPrivateKeyPrompt, setShowInputPrivateKeyPrompt] = useState(false);
  const [inputPrivateKey, setInputPrivateKey] = useState("");
  const [showTransactionPrivateKeyPrompt, setShowTransactionPrivateKeyPrompt] = useState(false);
  const [transactionPrivateKey, setTransactionPrivateKey] = useState("");

  // Process step state
  const [currentStep, setCurrentStep] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [subStepProgress, setSubStepProgress] = useState<{ [key: number]: number }>({ 0: 0, 1: 0 });

  // Error and success message state
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Debug log state
  const [debugLogs, setDebugLogs] = useState<DebugLog[]>([]);

  // Process steps with sub-steps
  const steps = [
    { name: "创建根账户", subSteps: ["初始化根钱包", "保存根账户"] },
    { name: "创建影子账户", subSteps: ["生成环签名", "部署影子账户"] },
    { name: "开始交易", subSteps: [] },
  ];

  // Add debug log
  const addDebugLog = (message: string, data: any = {}) => {
    setDebugLogs((prev) => [{ timestamp: Date.now(), message: `${message} ${JSON.stringify(data)}` }, ...prev.slice(0, 9)]);
    console.log(`[DEBUG] ${message}`, data);
  };

  // Fetch wallet info (including balance)
  useEffect(() => {
    const fetchWalletInfo = async () => {
      try {
        setIsLoadingWallet(true);
        const walletInfo = await walletService.getWalletInfo();
        setAddress(walletInfo.address || "");
        setShadowAddress(walletInfo.shadowAddress || "");
        // 使用 getETHBalance 获取余额
        const walletAddr = isShadowMode ? walletInfo.shadowAddress : walletInfo.address;
        if (walletAddr && ethers.utils.isAddress(walletAddr)) {
          const newBalance = await walletService.getETHBalance(walletAddr, provider);
          setBalance(newBalance || "0.0");
        } else {
          setBalance("0.0");
        }
      } catch (error) {
        console.error("Error fetching wallet info:", error);
        alert(`Failed to load wallet info: ${error.message}`);
      } finally {
        setIsLoadingWallet(false);
      }
    };

    if (walletService) {
      fetchWalletInfo();
    }
  }, [walletService, isShadowMode, provider]);

  // Fetch ring members
  useEffect(() => {
    const fetchRingMembers = async () => {
      if (!isShadowMode || !shadowAddress) {
        console.log("Shadow mode disabled or shadowAddress not available:", {
          isShadowMode,
          shadowAddress,
        });
        return;
      }

      try {
        setIsLoadingRingMembers(true);
        console.log("Fetching ring members for shadowAddress:", shadowAddress);
        const members = await walletService.getRingMembers(shadowAddress);
        console.log("Fetched ring members:", members);
        setRingMembers(members || []);
      } catch (error) {
        console.error("Error fetching ring members:", error);
        alert(`Failed to load ring members: ${error.message}`);
      } finally {
        setIsLoadingRingMembers(false);
      }
    };

    if (walletService) {
      fetchRingMembers();
    }
  }, [walletService, isShadowMode, shadowAddress]);

  // Toggle shadow mode
  const toggleShadowMode = async () => {
    try {
      setIsProcessing(true);
      setError(null);
      addDebugLog("切换影子模式开始");

      if (!isShadowMode) {
        if (!userEmail) {
          setError("用户邮箱未设置");
          addDebugLog("切换影子模式失败: 无邮箱");
          return;
        }
        const response = await fetch("http://localhost:3001/wallet/get-shadow-wallets-by-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: userEmail }),
        });
        if (!response.ok) {
          setError("获取影子钱包失败");
          addDebugLog("获取影子钱包失败", { status: response.status });
          return;
        }
        const { wallets } = await response.json();
        setAvailableWallets(wallets || []);
        setIsShadowMode(true);
        setSuccess("影子模式已激活");
        if (!wallets || wallets.length === 0) {
          setShowRootAccountPrompt(true);
          setCurrentStep(0);
        } else {
          setCurrentStep(2);
        }
        addDebugLog("影子模式激活", { wallets });
      } else {
        setIsShadowMode(false);
        setSuccess("影子模式已停用");
        setCurrentStep(0);
        setWallets([]);
        setAvailableWallets([]);
        setSelectedWallet(null);
        setShowRootAccountPrompt(false);
        setSubStepProgress({ 0: 0, 1: 0 });
        addDebugLog("影子模式停用");
      }
    } catch (err) {
      setError(`切换影子模式失败: ${err.message}`);
      addDebugLog(`切换影子模式失败: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Create root wallet
  const createRootWallet = async () => {
    try {
      setIsProcessing(true);
      setError(null);
      addDebugLog("创建根账户开始");

      setSubStepProgress(prev => ({ ...prev, 0: 1 })); // 初始化根钱包
      const walletInfo = await walletService.createNewRootWallet(provider);
      if (!walletInfo || !ethers.utils.isAddress(walletInfo.address)) {
        throw new Error("创建根账户失败: 无效地址");
      }
      addDebugLog("根钱包创建完成", walletInfo);

      setSubStepProgress(prev => ({ ...prev, 0: 2 })); // 保存根账户

      setRootPrivateKey(walletInfo.privateKey); // 保存私钥
      setShowPrivateKeyPrompt(true); // 显示私钥弹窗

      setSuccess("根账户创建成功");
      setCurrentStep(1);
      setShowRootAccountPrompt(false);
    } catch (err) {
      setError(`创建根账户失败: ${err.message}`);
      addDebugLog(`创建根账户失败: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const createShadowWallet = async () => {
    setShowInputPrivateKeyPrompt(true); // 显示输入私钥弹窗
  };
  
  const handlePrivateKeySubmit = async () => {
    try {
      setIsProcessing(true);
      setError(null);
      addDebugLog("创建影子账户开始");

      if (!rootAddress) throw new Error("rootAddress 未定义");
      if (!ethers.utils.isHexString(inputPrivateKey) || inputPrivateKey.length !== 66) {
        throw new Error("无效的私钥格式");
      }
      addDebugLog("rootAddress:", rootAddress);

      const salt = Math.floor(Date.now() / 1000);
      addDebugLog("salt:", salt);

      setSubStepProgress(prev => ({ ...prev, 1: 1 })); // 生成环签名
      const tempPublicKey = secp256k1.g.mul(BigInt(inputPrivateKey));
      const calculatedPkFromSk_x = tempPublicKey.getX().toString("hex");
      const calculatedPkFromSk_y = tempPublicKey.getY().toString("hex");
      const pkToCompareWithSk = `0x${ethers.utils.hexZeroPad("0x" + calculatedPkFromSk_x, 32).slice(2)}${ethers.utils.hexZeroPad("0x" + calculatedPkFromSk_y, 32).slice(2)}`;
      addDebugLog("publicKey:", pkToCompareWithSk);

      const ringInput = { x: "0x" + calculatedPkFromSk_x, y: "0x" + calculatedPkFromSk_y };
      addDebugLog("ringInput:", ringInput);

      const ring = await walletService.constructRing(ringInput, 10);
      if (!Array.isArray(ring) || ring.length === 0) throw new Error("constructRing 返回无效的 ring");
      
      // 修正 ring 元素，确保长度为偶数
      const formattedRing = ring.map((item, i) => {
        if (!item.startsWith("0x") || !ethers.utils.isHexString(item)) {
          throw new Error(`ring 元素 ${i} 无效: ${item}`);
        }
        const hex = item.startsWith("0x") ? item.slice(2) : item;
        // 如果 hex 长度为奇数，补前导 0
        const paddedHex = hex.length % 2 !== 0 ? `0${hex}` : hex;
        return `0x${paddedHex}`;
      });
      addDebugLog("formattedRing:", formattedRing);

      const ringId = ethers.utils.keccak256(ethers.utils.concat(formattedRing));
      if (!ringId.startsWith("0x") || !ethers.utils.isHexString(ringId)) throw new Error(`无效的 ringId: ${ringId}`);
      addDebugLog("ringId:", ringId);

      setSubStepProgress(prev => ({ ...prev, 1: 2 })); // 部署影子账户
      const shadowWalletAddress = await walletService.getShadowWalletAddress(salt);
      if (!shadowWalletAddress || !ethers.utils.isAddress(shadowWalletAddress)) {
        throw new Error(`无效的 shadowWalletAddress: ${shadowWalletAddress}`);
      }
      addDebugLog("shadowWalletAddress:", shadowWalletAddress);

      const result = await walletService.createShadowAA(salt, formattedRing, ringId, shadowWalletAddress, pkToCompareWithSk, inputPrivateKey);
      const walletAddress = result.shadowWalletAddress;
      if (!ethers.utils.isAddress(walletAddress)) throw new Error(`无效的 shadowWalletAddress: ${walletAddress}`);
      addDebugLog("createShadowAA 结果:", result);

      const saveResponse = await fetch("http://localhost:3001/wallet/save-shadow-wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: userEmail,
          walletAddress,
          ringMembers: formattedRing,
        }),
      });
      if (!saveResponse.ok) throw new Error("保存影子钱包失败");

      const newWallet: Wallet = {
        id: `shadow-${Date.now()}`,
        address: walletAddress,
        type: "shadow",
        createdAt: Date.now(),
      };

      setWallets((prev) => [...prev, newWallet]);
      setSelectedWallet(newWallet.id);
      setAvailableWallets((prev) => [...prev, { address: walletAddress, ringMembers: formattedRing }]);
      setSuccess(`影子账户创建成功: ${walletAddress.substring(0, 6)}...${walletAddress.substring(38)}`);
      setCurrentStep(2);
      setShowInputPrivateKeyPrompt(false);
      setInputPrivateKey("");
      addDebugLog(`影子账户创建成功: ${walletAddress}`);
    } catch (err) {
      const errorMessage = `创建影子账户失败: ${err.message}`;
      setError(errorMessage);
      addDebugLog(errorMessage, err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Send transaction
  const sendTransaction = async () => {
    if (!selectedWallet || !recipient || !amount) {
      setError("请填写所有交易详情");
      addDebugLog("交易失败：缺少交易详情");
      return;
    }

    // 显示私钥输入弹窗
    setShowTransactionPrivateKeyPrompt(true);
  };

  // 处理交易私钥提交并发送交易
  const handleTransactionPrivateKeySubmit = async () => {
    if (!ethers.utils.isHexString(transactionPrivateKey) || transactionPrivateKey.length !== 66) {
      setError("无效的私钥格式");
      addDebugLog("交易失败：无效的私钥格式");
      return;
    }

    try {
      setIsTransacting(true);
      setError(null);
      setShowTransactionPrivateKeyPrompt(false);
      addDebugLog("发送交易开始");

      const wallet = wallets.find((w) => w.id === selectedWallet);
      if (!wallet) {
        throw new Error("未找到选定的钱包");
      }

      const txData = {
        from: wallet.address,
        sk: transactionPrivateKey, // 使用用户输入的私钥
        pk: wallet,
        to: recipient,
        value: amount,
        useShadowAccount: wallet.type === "shadow",
      };

      console.log("txData:", txData);

      const pendingTx: Transaction = {
        hash: "0x" + Math.random().toString(16).substring(2, 42),
        from: wallet.address,
        to: recipient,
        value: amount,
        timestamp: Date.now(),
        status: "pending",
      };

      setTransactions((prev) => [pendingTx, ...prev]);
      addDebugLog(`添加待处理交易: ${pendingTx.hash}`);

      const txHash = await onSendTransaction!(txData);
      setSuccess(`交易发送成功! 哈希: ${txHash.substring(0, 10)}...`);
      addDebugLog(`交易发送成功: ${txHash}`);

      setTransactions((prev) =>
        prev.map((tx) => (tx.hash === pendingTx.hash ? { ...tx, hash: txHash, status: "success" } : tx))
      );
      setRecipient("");
      setAmount("");
      setTransactionPrivateKey(""); // 清空私钥
    } catch (err) {
      setError(`交易失败: ${err.message}`);
      setTransactions((prev) =>
        prev.map((tx) => (tx.status === "pending" ? { ...tx, status: "failed", error: err.message } : tx))
      );
      addDebugLog(`交易失败: ${err.message}`);
    } finally {
      setIsTransacting(false);
    }
  };

  // Clear notifications after 5 seconds
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
    <div className="space-y-6">
      {/* Process Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <h3 className={`text-lg font-medium ${isShadowMode ? "text-purple-300" : "text-cyan-300"}`}>钱包设置</h3>
          <Badge
            variant={isShadowMode ? "outline" : "secondary"}
            className={
              isShadowMode ? "bg-purple-900/50 text-purple-200 border-purple-600" : "bg-cyan-900/50 text-cyan-200"
            }
          >
            {currentStep === 0 ? "未开始" : currentStep === 2 ? "完成" : `步骤 ${currentStep + 1}/3`}
          </Badge>
        </div>

        <div className="relative">
          <div
            className={`absolute top-4 left-0 h-1 ${isShadowMode ? "bg-purple-600" : "bg-cyan-600"}`}
            style={{ width: `${Math.min((currentStep / 2) * 100, 100)}%`, transition: "width 0.5s ease-in-out" }}
          />
          <div className="grid grid-cols-3 gap-2">
            {steps.map((step, index) => (
              <div key={index} className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 z-10
                    ${
                      index <= currentStep
                        ? isShadowMode
                          ? "bg-purple-600 text-white"
                          : "bg-cyan-600 text-white"
                        : "bg-gray-700 text-gray-400"
                    }`}
                >
                  {index < currentStep ? (
                    <Check className="h-4 w-4" />
                  ) : index === currentStep && isProcessing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>
                <span
                  className={`text-xs text-center ${
                    index <= currentStep ? (isShadowMode ? "text-purple-300" : "text-cyan-300") : "text-gray-500"
                  }`}
                >
                  {step.name}
                </span>
                {index === currentStep && step.subSteps.length > 0 && (
                  <div className="mt-2 text-xs text-purple-400">
                    {step.subSteps.map((subStep, subIndex) => (
                      <div key={subIndex} className="flex items-center">
                        <span
                          className={`mr-1 ${
                            subStepProgress[index] > subIndex ? "text-green-400" : "text-purple-400"
                          }`}
                        >
                          {subStepProgress[index] > subIndex ? "✔" : subStepProgress[index] === subIndex ? "⏳" : "○"}
                        </span>
                        {subStep}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <Alert variant="destructive" className="bg-red-900/50 border-red-700 text-red-200">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>错误</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert
          className={
            isShadowMode
              ? "bg-purple-900/50 border-purple-700 text-purple-200"
              : "bg-cyan-900/50 border-cyan-700 text-cyan-200"
          }
        >
          <Check className="h-4 w-4" />
          <AlertTitle>成功</AlertTitle>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Debug Logs */}
      <Card className="bg-slate-800 border-purple-600">
        <CardHeader>
          <CardTitle className="text-purple-300 flex items-center">
            <ScrollText className="h-5 w-5 mr-2" />
            调试日志
          </CardTitle>
          <CardDescription className="text-purple-400">查看创建和交易的详细日志</CardDescription>
        </CardHeader>
        <CardContent>
          {debugLogs.length > 0 ? (
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {debugLogs.map((log, index) => (
                <div key={index} className="text-sm text-purple-300">
                  <span className="text-purple-400">
                    {new Date(log.timestamp).toLocaleTimeString()}:
                  </span>{" "}
                  {log.message}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-purple-400">暂无日志</div>
          )}
        </CardContent>
      </Card>

      {/* Shadow Mode Toggle */}
      <Card className={`border ${isShadowMode ? "border-purple-600 bg-slate-800" : "border-cyan-600 bg-gray-800"}`}>
        <CardHeader className="pb-2">
          <CardTitle className={isShadowMode ? "text-purple-300" : "text-cyan-300"}>钱包模式</CardTitle>
          <CardDescription className={isShadowMode ? "text-purple-400" : "text-cyan-400"}>
            {isShadowMode ? "影子模式已激活。支持隐私交易。" : "启用影子模式以创建隐私钱包。"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="flex items-center space-x-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span className="text-sm text-gray-300">根账户:</span>
            </div>
            <code className="bg-gray-900 p-2 rounded text-sm block overflow-x-auto">{rootAddress || "未连接"}</code>
          </div>
          <Button
            onClick={toggleShadowMode}
            disabled={isProcessing}
            className={`w-full ${
              isShadowMode
                ? "bg-purple-700 hover:bg-purple-600 border border-purple-500"
                : "bg-cyan-700 hover:bg-cyan-600 border border-cyan-500"
            }`}
          >
            {isProcessing && currentStep === 0 ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Shield className="mr-2 h-4 w-4" />
            )}
            {isShadowMode ? "禁用影子模式" : "启用影子模式"}
          </Button>
        </CardContent>
      </Card>

      {/* Account Details with Refresh Balance */}
      <Card className={isShadowMode ? "bg-slate-800 border-purple-600" : "bg-gray-800 border-cyan-600"}>
        <CardHeader className="pb-3">
          <CardTitle className={isShadowMode ? "text-purple-300" : "text-cyan-300"}>账户详情</CardTitle>
          <CardDescription className={isShadowMode ? "text-purple-400" : "text-cyan-400"}>
            {isShadowMode ? "影子账户已激活" : "标准账户"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingWallet ? (
            <div className="flex justify-center py-4">
              <Loader2 className={`h-6 w-6 animate-spin ${isShadowMode ? "text-purple-400" : "text-cyan-400"}`} />
            </div>
          ) : (
            <div className="flex justify-between items-center">
              <div>
                <p className={`text-sm font-medium ${isShadowMode ? "text-purple-400" : "text-cyan-400"} mb-1`}>
                  地址
                </p>
                <p className={`font-mono text-sm ${isShadowMode ? "text-purple-300" : "text-cyan-300"}`}>
                  {isShadowMode ? shadowAddress : address}
                </p>
              </div>
              <div className="text-right flex items-center space-x-2">
                <div>
                  <p className={`text-sm font-medium ${isShadowMode ? "text-purple-400" : "text-cyan-400"} mb-1`}>
                    余额
                  </p>
                  <p className={`text-2xl font-bold ${isShadowMode ? "text-purple-200" : "text-cyan-200"}`}>
                    {balance} ETH
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={async () => {
                    setIsLoadingWallet(true);
                    try {
                      const walletAddr = isShadowMode ? shadowAddress : address;
                      if (walletAddr && ethers.utils.isAddress(walletAddr)) {
                        const newBalance = await walletService.getETHBalance(walletAddr, provider);
                        setBalance(newBalance || "0.0");
                      }
                    } catch (error) {
                      console.error("Error refreshing balance:", error);
                      alert(`Failed to refresh balance: ${error.message}`);
                    } finally {
                      setIsLoadingWallet(false);
                    }
                  }}
                  disabled={isLoadingWallet}
                  className={isShadowMode ? "text-purple-400 hover:text-purple-300" : "text-cyan-400 hover:text-cyan-300"}
                >
                  {isLoadingWallet ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {isShadowMode && (
        <>
          <Dialog open={showRootAccountPrompt} onOpenChange={setShowRootAccountPrompt}>
            <DialogContent className="bg-slate-800 border-purple-600 text-purple-200">
              <DialogHeader>
                <DialogTitle className="text-purple-300">创建根账户</DialogTitle>
                <DialogDescription className="text-purple-400">
                  未检测到影子钱包地址。请先创建根账户以继续。
                </DialogDescription>
              </DialogHeader>
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  className="border-purple-500 text-purple-200 hover:bg-purple-700"
                  onClick={() => setShowRootAccountPrompt(false)}
                >
                  取消
                </Button>
                <Button
                  className="bg-purple-700 hover:bg-purple-600"
                  onClick={() => {
                    setShowRootAccountPrompt(false);
                    createRootWallet();
                  }}
                >
                  创建根账户
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={showPrivateKeyPrompt} onOpenChange={() => {
            setShowPrivateKeyPrompt(false);
            setRootPrivateKey(null); // Clear private key after closing
          }}>
            <DialogContent className="bg-slate-800 border-purple-600 text-purple-200">
              <DialogHeader>
                <DialogTitle className="text-purple-300">保存您的私钥</DialogTitle>
                <DialogDescription className="text-purple-400">
                  这是您的根账户私钥，仅显示一次！请妥善保存，切勿泄露。
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  value={rootPrivateKey || ""}
                  readOnly
                  className="bg-slate-900 border-purple-700 text-purple-200 font-mono"
                />
                <p className="text-red-400 text-sm">警告：丢失私钥将无法恢复账户！</p>
              </div>
              <div className="flex justify-end">
                <Button
                  className="bg-purple-700 hover:bg-purple-600"
                  onClick={() => {
                    setShowPrivateKeyPrompt(false);
                    setRootPrivateKey(null);
                  }}
                >
                  我已保存
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={showInputPrivateKeyPrompt} onOpenChange={setShowInputPrivateKeyPrompt}>
            <DialogContent className="bg-slate-800 border-purple-600 text-purple-200">
              <DialogHeader>
                <DialogTitle className="text-purple-300">输入私钥</DialogTitle>
                <DialogDescription className="text-purple-400">
                  请输入您的根账户私钥以创建影子账户。
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  value={inputPrivateKey}
                  onChange={(e) => setInputPrivateKey(e.target.value)}
                  placeholder="0x..."
                  className="bg-slate-900 border-purple-700 text-purple-200 font-mono"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  className="border-purple-500 text-purple-200 hover:bg-purple-700"
                  onClick={() => {
                    setShowInputPrivateKeyPrompt(false);
                    setInputPrivateKey("");
                  }}
                >
                  取消
                </Button>
                <Button
                  className="bg-purple-700 hover:bg-purple-600"
                  onClick={handlePrivateKeySubmit}
                  disabled={!inputPrivateKey}
                >
                  提交
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={showTransactionPrivateKeyPrompt} onOpenChange={() => {
            setShowTransactionPrivateKeyPrompt(false);
            setTransactionPrivateKey("");
          }}>
            <DialogContent className="bg-slate-800 border-purple-600 text-purple-200">
              <DialogHeader>
                <DialogTitle className="text-purple-300">输入私钥</DialogTitle>
                <DialogDescription className="text-purple-400">
                  请输入您的私钥以签名交易。
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  value={transactionPrivateKey}
                  onChange={(e) => setTransactionPrivateKey(e.target.value)}
                  placeholder="0x..."
                  className="bg-slate-900 border-purple-700 text-purple-200 font-mono"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  className="border-purple-500 text-purple-200 hover:bg-purple-700"
                  onClick={() => {
                    setShowTransactionPrivateKeyPrompt(false);
                    setTransactionPrivateKey("");
                  }}
                >
                  取消
                </Button>
                <Button
                  className="bg-purple-700 hover:bg-purple-600"
                  onClick={handleTransactionPrivateKeySubmit}
                  disabled={!transactionPrivateKey}
                >
                  提交
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Tabs defaultValue="setup" className="w-full">
            <TabsList className={`grid grid-cols-4 mb-4 bg-slate-800`}>
              <TabsTrigger value="setup" className="data-[state=active]:bg-purple-700 data-[state=active]:text-white">
                钱包设置
              </TabsTrigger>
              <TabsTrigger value="ring-members" className="data-[state=active]:bg-purple-700 data-[state=active]:text-white">
                环成员
              </TabsTrigger>
              <TabsTrigger value="transactions" className="data-[state=active]:bg-purple-700 data-[state=active]:text-white">
                交易
              </TabsTrigger>
              <TabsTrigger value="history" className="data-[state=active]:bg-purple-700 data-[state=active]:text-white">
                历史记录
              </TabsTrigger>
            </TabsList>

            <TabsContent value="setup">
              <div className="space-y-6">
                <Card className="bg-slate-800 border-purple-600">
                  <CardHeader>
                    <CardTitle className="text-purple-300 flex items-center">
                      <Wallet className="h-5 w-5 mr-2" />
                      钱包管理
                    </CardTitle>
                    <CardDescription className="text-purple-400">选择或创建影子钱包</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-purple-300">选择现有钱包</Label>
                      <select
                        className="w-full bg-slate-900 border-purple-700 text-purple-200 p-2 rounded"
                        value={selectedWallet || ""}
                        onChange={(e) => {
                          const wallet = availableWallets.find(w => w.address === e.target.value);
                          if (wallet) {
                            setSelectedWallet(wallet.address);
                            setWallets([{ id: wallet.address, address: wallet.address, type: "shadow", createdAt: Date.now() }]);
                            setCurrentStep(2);
                            setShadowWalletAddress(wallet.address);
                          }
                        }}
                      >
                        <option value="">选择钱包</option>
                        {availableWallets.map(wallet => (
                          <option key={wallet.address} value={wallet.address}>
                            {wallet.address.substring(0, 6)}...{wallet.address.substring(38)}
                          </option>
                        ))}
                      </select>
                    </div>
                    {availableWallets.length === 0 && (
                      <div className="text-center py-4 border border-dashed border-purple-700 rounded">
                        <p className="text-purple-400 text-sm">无现有影子钱包</p>
                      </div>
                    )}
                    <Button
                      onClick={createShadowWallet}
                      disabled={isProcessing || currentStep < 1}
                      className="w-full bg-purple-700 hover:bg-purple-600 border border-purple-500"
                    >
                      {isProcessing && currentStep === 1 ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Wallet className="mr-2 h-4 w-4" />
                      )}
                      创建影子账户
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="ring-members">
              <Card className="bg-slate-800 border-purple-600">
                <CardHeader>
                  <CardTitle className="flex items-center text-purple-300">
                    <Users className="h-5 w-5 mr-2" />
                    环签名成员
                  </CardTitle>
                  <CardDescription className="text-purple-400">查看您的环成员以增强隐私</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-purple-300">当前环成员 ({ringMembers.length})</Label>
                    {isLoadingRingMembers ? (
                      <div className="flex justify-center py-4">
                        <Loader2 className="h-6 w-6 animate-spin text-purple-400" />
                      </div>
                    ) : (
                      <div className="mt-2 space-y-2 max-h-48 overflow-y-auto">
                        {ringMembers.length === 0 ? (
                          <p className="text-sm text-purple-400 py-2 border border-dashed border-purple-700 rounded p-3 text-center">
                            尚未添加环成员
                          </p>
                        ) : (
                          ringMembers.map((member, index) => (
                            <div
                              key={index}
                              className="p-2 border rounded-md border-purple-700 bg-slate-900"
                            >
                              <span className="font-mono text-sm truncate text-purple-300">
                                {member.substring(0, 6)}...{member.substring(member.length - 4)}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter>
                  <div className="text-sm text-purple-400 border-t border-purple-800/50 pt-4 w-full text-center">
                    建议：至少添加 5 个成员以获得更好的隐私
                  </div>
                </CardFooter>
              </Card>
            </TabsContent>

            <TabsContent value="transactions">
              <Card className="bg-slate-800 border-purple-600">
                <CardHeader>
                  <CardTitle className="text-purple-300 flex items-center">
                    <Send className="h-5 w-5 mr-2" />
                    交易
                  </CardTitle>
                  <CardDescription className="text-purple-400">使用您的钱包发送交易</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-purple-300">选定的钱包</Label>
                    {selectedWallet ? (
                      <div className="p-3 bg-purple-900/30 border border-purple-700 rounded">
                        <div className="flex items-center space-x-2">
                          <Wallet className="h-4 w-4 text-purple-400" />
                          <span className="font-mono text-sm text-purple-300">
                            {wallets.find((w) => w.id === selectedWallet)?.address.substring(0, 6)}...
                            {wallets.find((w) => w.id === selectedWallet)?.address.substring(38)}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 bg-slate-900 border border-purple-800 rounded">
                        <div className="flex items-center justify-center text-purple-500">
                          <AlertTriangle className="h-4 w-4 mr-2" />
                          <span className="text-sm">
                            {currentStep < 2 ? "请先完成设置流程" : "请选择一个钱包"}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="recipient" className="text-purple-300">
                      接收地址
                    </Label>
                    <Input
                      id="recipient"
                      placeholder="0x..."
                      value={recipient}
                      onChange={(e) => setRecipient(e.target.value)}
                      className="bg-slate-900 border-purple-700 text-purple-200"
                      disabled={currentStep < 2 || !selectedWallet}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="amount" className="text-purple-300">
                      金额 (ETH)
                    </Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.001"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="bg-slate-900 border-purple-700 text-purple-200"
                      disabled={currentStep < 2 || !selectedWallet}
                    />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    onClick={sendTransaction}
                    disabled={isTransacting || currentStep < 2 || !selectedWallet || !recipient || !amount}
                    className="w-full bg-purple-700 hover:bg-purple-600 border border-purple-500"
                  >
                    {isTransacting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        处理交易中...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        发送交易
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            <TabsContent value="history">
              <Card className="bg-slate-800 border-purple-600">
                <CardHeader>
                  <CardTitle className="text-purple-300 flex items-center">
                    <RefreshCw className="h-5 w-5 mr-2" />
                    交易历史
                  </CardTitle>
                  <CardDescription className="text-purple-400">查看您的钱包交易历史</CardDescription>
                </CardHeader>
                <CardContent>
                  {transactions.length > 0 ? (
                    <div className="space-y-4">
                      {transactions.map((tx, index) => (
                        <div
                          key={index}
                          className={`p-3 rounded border ${
                            tx.status === "success"
                              ? "border-green-600 bg-green-900/20"
                              : tx.status === "pending"
                              ? "border-yellow-600 bg-yellow-900/20"
                              : "border-red-600 bg-red-900/20"
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="flex items-center">
                                {tx.status === "success" ? (
                                  <Check className="h-4 w-4 text-green-400 mr-1" />
                                ) : tx.status === "pending" ? (
                                  <Loader2 className="h-4 w-4 text-yellow-400 mr-1 animate-spin" />
                                ) : (
                                  <AlertTriangle className="h-4 w-4 text-red-400 mr-1" />
                                )}
                                <span
                                  className={`text-sm font-medium ${
                                    tx.status === "success"
                                      ? "text-green-400"
                                      : tx.status === "pending"
                                      ? "text-yellow-400"
                                      : "text-red-400"
                                  }`}
                                >
                                  {tx.status === "success"
                                    ? "交易成功"
                                    : tx.status === "pending"
                                    ? "交易处理中"
                                    : "交易失败"}
                                </span>
                              </div>
                              <div className="mt-1 text-xs text-purple-300 font-mono">
                                <div className="flex items-center">
                                  <span className="text-purple-400 mr-1">哈希:</span>
                                  {tx.hash.substring(0, 10)}...{tx.hash.substring(tx.hash.length - 8)}
                                </div>
                                <div className="flex items-center mt-1">
                                  <span className="text-purple-400 mr-1">从:</span>
                                  {tx.from.substring(0, 8)}...{tx.from.substring(tx.from.length - 6)}
                                </div>
                                <div className="flex items-center mt-1">
                                  <ArrowRight className="h-3 w-3 text-purple-400 mr-1" />
                                  {tx.to.substring(0, 8)}...{tx.to.substring(tx.to.length - 6)}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-medium text-purple-200">{tx.value} ETH</div>
                              <div className="text-xs text-purple-400 mt-1">
                                {new Date(tx.timestamp).toLocaleString()}
                              </div>
                            </div>
                          </div>
                          {tx.error && (
                            <div className="mt-2 text-xs text-red-400 bg-red-900/30 p-2 rounded">错误: {tx.error}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 border border-dashed border-purple-700 rounded">
                      <p className="text-purple-400">尚无交易历史</p>
                      <p className="text-purple-500 text-sm mt-2">完成交易后将在此处显示</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}