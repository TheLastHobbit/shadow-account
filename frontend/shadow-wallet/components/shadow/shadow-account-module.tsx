"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Loader2, Shield, Wallet, Send, AlertTriangle, Check, RefreshCw, ScrollText, ArrowRight } from "lucide-react";
import { ethers } from "ethers";
import { H2 } from '../../lib/crypto';
const { ec: EC } = require('elliptic');
const secp256k1 = new EC('secp256k1');

// 钱包类型定义
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
  // 影子模式状态
  const [isShadowMode, setIsShadowMode] = useState(false);

  // 钱包状态
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);

  // 交易状态
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [isTransacting, setIsTransacting] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // 流程步骤状态
  const [currentStep, setCurrentStep] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  // 错误和成功消息状态
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // 调试日志状态
  const [debugLogs, setDebugLogs] = useState<DebugLog[]>([]);

  // 流程步骤
  const steps = ["启用影子模式", "创建钱包", "准备交易"];

  // 添加调试日志
  const addDebugLog = (message: string, data: any = {}) => {
    setDebugLogs((prev) => [{ timestamp: Date.now(), message: `${message} ${JSON.stringify(data)}` }, ...prev.slice(0, 9)]);
    console.log(`[DEBUG] ${message}`, data);
  };

  // 切换影子模式
  const toggleShadowMode = async () => {
    try {
      setIsProcessing(true);
      setError(null);
      addDebugLog("切换影子模式开始");

      await new Promise((resolve) => setTimeout(resolve, 1000));
      setIsShadowMode(!isShadowMode);

      if (!isShadowMode) {
        setSuccess("影子模式已激活。支持隐私交易。");
        setCurrentStep(1);
        addDebugLog("影子模式激活，进入步骤 1");
      } else {
        setSuccess("影子模式已停用。返回标准模式。");
        setCurrentStep(0);
        setWallets([]);
        setSelectedWallet(null);
        addDebugLog("影子模式停用，重置钱包状态");
      }
    } catch (err) {
      setError(`切换影子模式失败: ${err.message}`);
      addDebugLog(`切换影子模式失败: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // 创建普通 Wallet
  const createStandardWallet = async () => {
    try {
      setIsProcessing(true);
      setError(null);
      addDebugLog("创建普通 Wallet 开始");

      const salt = Math.floor(Date.now() / 1000);
      const result = await walletService.createWallet(rootAddress, salt);
      const walletAddress = result.walletAddress;

      const newWallet: Wallet = {
        id: `wallet-${Date.now()}`,
        address: walletAddress,
        type: "standard",
        createdAt: Date.now(),
      };

      setWallets((prev) => [...prev, newWallet]);
      setSelectedWallet(newWallet.id);
      setSuccess(`普通 Wallet 创建成功: ${walletAddress.substring(0, 6)}...${walletAddress.substring(38)}`);
      setCurrentStep(2);
      addDebugLog(`普通 Wallet 创建成功: ${walletAddress}`);
    } catch (err) {
      setError(`创建普通 Wallet 失败: ${err.message}`);
      addDebugLog(`创建普通 Wallet 失败: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // 创建 ShadowWallet
const createShadowWallet = async () => {
  try {
    setIsProcessing(true);
    setError(null);
    addDebugLog("创建 ShadowWallet 开始");

    if (!rootAddress) {
      throw new Error("rootAddress 未定义");
    }
    addDebugLog("rootAddress:", rootAddress);

    const salt = Math.floor(Date.now() / 1000);
    addDebugLog("salt:", salt);
    

    const walletInfo = await walletService.getWalletInfo();

    let privateKey = walletInfo.wallet.privateKey;
    const tempPublicKey = secp256k1.g.mul(BigInt(privateKey))
    console.log("tempPublicKey:",tempPublicKey);
    const calculatedPkFromSk_x = tempPublicKey.getX().toString('hex');
    const calculatedPkFromSk_y = tempPublicKey.getY().toString('hex');

    const pkToCompareWithSk = `0x${ethers.utils.hexZeroPad("0x" + calculatedPkFromSk_x, 32).slice(2)}${ethers.utils.hexZeroPad("0x" + calculatedPkFromSk_y, 32).slice(2)}`;

    walletInfo.wallet.publicKey = pkToCompareWithSk;

    addDebugLog("publicKey:", tempPublicKey);
    // const calculatedPkFromSk_x = tempPublicKey.getX().toString('hex');
    // const calculatedPkFromSk_y = tempPublicKey.getY().toString('hex');
    console.log("calculatedPkFromSk_x:",calculatedPkFromSk_x)
    console.log("calculatedPkFromSk_y:",calculatedPkFromSk_y)

    const ringInput = {
      x: '0x'+calculatedPkFromSk_x,
      y:'0x'+calculatedPkFromSk_y
    };
    addDebugLog("ringInput:", ringInput);

    const ring = await walletService.constructRing(ringInput, 10);
    if (!Array.isArray(ring) || ring.length === 0) {
      throw new Error("constructRing 返回无效的 ring");
    }
    ring.forEach((item, i) => {
      if (!item.startsWith("0x") || !ethers.utils.isHexString(item)) {
        throw new Error(`ring 元素 ${i} 无效: ${item}`);
      }
    });
    addDebugLog("ring:", ring);

    const ringId = ethers.utils.keccak256(ethers.utils.concat(ring));
    if (!ringId.startsWith("0x") || !ethers.utils.isHexString(ringId)) {
      throw new Error(`无效的 ringId: ${ringId}`);
    }
    addDebugLog("ringId:", ringId);

    const nonce = 1;
    const shadowWalletAddress = await walletService.getShadowWalletAddress(salt);
    if (!shadowWalletAddress || !ethers.utils.isAddress(shadowWalletAddress)) {
      throw new Error(`无效的 shadowWalletAddress: ${shadowWalletAddress}`);
    }
    addDebugLog("shadowWalletAddress:", shadowWalletAddress);

    const result = await walletService.createShadowAA(
      salt,
      ring,
      ringId,
      shadowWalletAddress
    );
    const walletAddress = result.shadowWalletAddress;
    if (!ethers.utils.isAddress(walletAddress)) {
      throw new Error(`无效的 shadowWalletAddress: ${walletAddress}`);
    }
    addDebugLog("createShadowAA 结果:", result);

    const newWallet: Wallet = {
      id: `shadow-${Date.now()}`,
      address: walletAddress,
      type: "shadow",
      createdAt: Date.now(),
    };

    setWallets((prev) => [...prev, newWallet]);
    setSelectedWallet(newWallet.id);
    setSuccess(`ShadowWallet 创建成功: ${walletAddress.substring(0, 6)}...${walletAddress.substring(38)}`);
    setCurrentStep(2);
    addDebugLog(`ShadowWallet 创建成功: ${walletAddress}`);
  } catch (err) {
    const errorMessage = `创建 ShadowWallet 失败: ${err.message}`;
    setError(errorMessage);
    addDebugLog(errorMessage, err);
    throw err;
  } finally {
    setIsProcessing(false);
  }
};

  // 发送交易
  const sendTransaction = async () => {
    if (!selectedWallet || !recipient || !amount) {
      setError("请填写所有交易详情");
      addDebugLog("交易失败：缺少交易详情");
      return;
    }

    try {
      setIsTransacting(true);
      setError(null);
      addDebugLog("发送交易开始");

      const wallet = wallets.find((w) => w.id === selectedWallet);
      if (!wallet) {
        throw new Error("未找到选定的钱包");
      }

      const txData = {
        to: recipient,
        value: amount,
        useShadowAccount: wallet.type === "shadow"
      };

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

  // 5秒后清除通知
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
      {/* 流程步骤 */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <h3 className={`text-lg font-medium ${isShadowMode ? "text-purple-300" : "text-cyan-300"}`}>钱包设置</h3>
          <Badge
            variant={isShadowMode ? "outline" : "secondary"}
            className={
              isShadowMode ? "bg-purple-900/50 text-purple-200 border-purple-600" : "bg-cyan-900/50 text-cyan-200"
            }
          >
            {currentStep === 0 ? "未开始" : currentStep === 2 ? "完成" : `步骤 ${currentStep}/2`}
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
                  ) : index === currentStep ? (
                    isProcessing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <span>{index + 1}</span>
                    )
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>
                <span
                  className={`text-xs text-center ${
                    index <= currentStep ? (isShadowMode ? "text-purple-300" : "text-cyan-300") : "text-gray-500"
                  }`}
                >
                  {step}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 通知 */}
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

      {/* 调试日志 */}
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

      {/* 影子模式切换 */}
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

      {isShadowMode && (
        <>
          <Tabs defaultValue="setup" className="w-full">
            <TabsList className={`grid grid-cols-3 mb-4 bg-slate-800`}>
              <TabsTrigger value="setup" className="data-[state=active]:bg-purple-700 data-[state=active]:text-white">
                钱包设置
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
                  <CardHeader className="pb-2">
                    <CardTitle className="text-purple-300 flex items-center">
                      <Wallet className="h-5 w-5 mr-2" />
                      钱包管理
                    </CardTitle>
                    <CardDescription className="text-purple-400">创建和管理您的标准或影子钱包</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {wallets.length > 0 ? (
                      <div className="space-y-2">
                        <Label className="text-purple-300">您的钱包</Label>
                        <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                          {wallets.map((wallet) => (
                            <div
                              key={wallet.id}
                              className={`p-2 rounded border ${
                                selectedWallet === wallet.id
                                  ? "bg-purple-900/70 border-purple-500"
                                  : "bg-slate-900 border-purple-800"
                              } cursor-pointer`}
                              onClick={() => setSelectedWallet(wallet.id)}
                            >
                              <div className="flex items-center justify-between">
                                <div className="font-mono text-sm text-purple-300 truncate">
                                  {wallet.address.substring(0, 6)}...{wallet.address.substring(38)}
                                </div>
                                <Badge
                                  variant="default"
                                  className={wallet.type === "shadow" ? "bg-purple-800 text-purple-200" : "bg-blue-800 text-blue-200"}
                                >
                                  {wallet.type === "shadow" ? "影子钱包" : "标准钱包"}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4 border border-dashed border-purple-700 rounded">
                        <p className="text-purple-400 text-sm">尚未创建钱包</p>
                      </div>
                    )}

                    <Button
                      onClick={createStandardWallet}
                      disabled={isProcessing || currentStep < 1}
                      className="w-full bg-blue-700 hover:bg-blue-600 border border-blue-500"
                    >
                      {isProcessing && currentStep === 1 ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Wallet className="mr-2 h-4 w-4" />
                      )}
                      创建标准钱包
                    </Button>

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
                      创建影子钱包
                    </Button>
                  </CardContent>
                </Card>
              </div>
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