"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, Send, Loader2 } from "lucide-react"

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

  useEffect(() => {
    const fetchWalletInfo = async () => {
      try {
        setIsLoadingWallet(true)
        const walletInfo = await walletService.getWalletInfo()
        setBalance(walletInfo.balance || "0.0")
        setAddress(walletInfo.address || "")
        setShadowAddress(walletInfo.shadowAddress || "")
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
      const walletInfo = await walletService.getWalletInfo()
      setBalance(walletInfo.balance || "0.0")
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
          <CardTitle className={isShadowMode ? "text-purple-300" : "text-cyan-300"}>Account Details</CardTitle>
          <CardDescription className={isShadowMode ? "text-purple-400" : "text-cyan-400"}>
            {isShadowMode ? "SHADOW ACCOUNT ACTIVE" : "STANDARD ACCOUNT"}
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
                  Address
                </p>
                <p className={`font-mono text-sm ${isShadowMode ? "text-purple-300" : "text-cyan-300"}`}>
                  {isShadowMode ? shadowAddress : address}
                </p>
              </div>
              <div className="text-right">
                <p className={`text-sm font-medium ${isShadowMode ? "text-purple-400" : "text-cyan-400"} mb-1`}>
                  Balance
                </p>
                <p className={`text-2xl font-bold ${isShadowMode ? "text-purple-200" : "text-cyan-200"}`}>
                  {balance} ETH
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {!isShadowMode && (
  <Card className="bg-gray-800 border-cyan-600">
    <CardHeader>
      <CardTitle className="text-cyan-300">Send Transaction</CardTitle>
      <CardDescription>
        <span className="text-cyan-400">SEND ETH TO ANY ADDRESS</span>
      </CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="recipient" className="text-cyan-300">
          Recipient Address
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
          Amount (ETH)
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
            EXECUTE TRANSFER
          </>
        )}
      </Button>
    </CardFooter>
  </Card>
)}
    </div>
  )
}

