"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, Send, Loader2 } from "lucide-react"
import { useWallet } from "../contexts/WalletContext";

interface WalletViewProps {
  isShadowMode: boolean
  onSendTransaction: (txData: any) => Promise<string>
  walletService: any
}

export function WalletView({ isShadowMode, onSendTransaction, walletService }: WalletViewProps) {
  const [recipient, setRecipient] = useState("")
  const [amount, setAmount] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [balance, setBalance] = useState("0.0")
  const [address, setAddress] = useState("")
  const [shadowAddress, setShadowAddress] = useState("")
  const [isLoadingWallet, setIsLoadingWallet] = useState(true)
  const { shadowWalletAddress } = useWallet();

  useEffect(() => {
    const fetchWalletInfo = async () => {
      try {
        setIsLoadingWallet(true)
        const walletInfo = await walletService.getWalletInfo()
        setBalance(walletInfo.balance || "0.0")
        setAddress(walletInfo.address || "")
        setShadowAddress(shadowWalletAddress || "")
      } catch (error) {
        console.error("Error fetching wallet info:", error)
        // Show error message to user
        alert(`Failed to load wallet info: ${error.message}`)
      } finally {
        setIsLoadingWallet(false)
      }
    }

    if (walletService) {
      fetchWalletInfo()
    }
  }, [walletService, isShadowMode])

  const handleSend = async () => {
    if (!recipient || !amount) return

    setIsLoading(true)
    try {
      await onSendTransaction({
        to: recipient,
        value: amount,
        useShadowAccount: isShadowMode,
      })
      setRecipient("")
      setAmount("")

      // Refresh balance after transaction
      const balance = await walletService.getETHBalance(shadowAddress)
      setBalance(balance || "0.0")
    } catch (error) {
      console.error("Transaction failed:", error)
      // Show error message to user
      alert(`Transaction failed: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card className={isShadowMode ? "bg-slate-800 border-purple-600" : "bg-gray-800 border-cyan-600"}>
        <CardHeader className="pb-3">
          <CardTitle className={isShadowMode ? "text-purple-300" : "text-cyan-300"}>账户详情</CardTitle>
          <CardDescription className={isShadowMode ? "text-purple-400" : "text-cyan-400"}>
            {isShadowMode ? "影子账户启动" : "标准账户"}
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
            const addressToRefresh = isShadowMode ? shadowAddress : address;
            try {
              const balance = await walletService.getETHBalance(addressToRefresh)
              setBalance(balance || "0.0");
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
            <Shield className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  )}
</CardContent>
      </Card>

      {!isShadowMode && (
  <Card className="bg-gray-800 border-cyan-600">
    <CardHeader>
      <CardTitle className="text-cyan-300">发送交易</CardTitle>
      <CardDescription>
        <span className="text-cyan-400">发送ETH给任何地址</span>
      </CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="recipient" className="text-cyan-300">
          接受地址
        </Label>
        <Input
          id="recipient"
          placeholder="0x..."
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
          className="bg-gray-900 border-cyan-700 text-cyan-200"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="amount" className="text-cyan-300">
          金额
        </Label>
        <Input
          id="amount"
          type="number"
          step="0.001"
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="bg-gray-900 border-cyan-700 text-cyan-200"
        />
      </div>
    </CardContent>
    <CardFooter>
      <Button
        onClick={handleSend}
        disabled={isLoading || !recipient || !amount || isLoadingWallet}
        className="w-full bg-cyan-700 hover:bg-cyan-600 border border-cyan-500"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            PROCESSING...
          </>
        ) : (
          <>
            <Send className="mr-2 h-4 w-4" />
            执行交易
          </>
        )}
      </Button>
    </CardFooter>
  </Card>
)}
    </div>
  )
}

