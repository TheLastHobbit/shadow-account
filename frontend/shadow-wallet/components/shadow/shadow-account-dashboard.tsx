"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ShadowAccountModule } from "./shadow-account-module"
import { useWalletService } from "@/lib/wallet-service"

export function ShadowAccountDashboard() {
  const [walletAddress, setWalletAddress] = useState("")
  const [rootAddress, setRootAddress] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const walletService = useWalletService()

  useEffect(() => {
    const fetchWalletInfo = async () => {
      try {
        setIsLoading(true)
        const walletInfo = await walletService.getWalletInfo()
        // console.log("walletInfo:",walletInfo)
        setWalletAddress(walletInfo.address || "")
        setRootAddress(walletInfo.rootAddress || "")
      } catch (error) {
        console.error("Error fetching wallet info:", error)
      } finally {
        setIsLoading(false)
      }
    }

    if (walletService) {
      fetchWalletInfo()
    }
  }, [walletService])

  const handleSendTransaction = async (txData) => {
    try {
      return await walletService.sendTransaction(txData, true)
    } catch (error) {
      console.error("Transaction error:", error)
      throw error
    }
  }

  return (
    <Card className="border-purple-600 bg-slate-800">
      <CardHeader>
        <CardTitle className="text-purple-300">影子账户仪表板</CardTitle>
        <CardDescription className="text-purple-400">管理您的私密影子账户和交易</CardDescription>
      </CardHeader>
      <CardContent>
        <ShadowAccountModule
          rootAddress={rootAddress}
          walletService={walletService}
          onSendTransaction={handleSendTransaction}
        />
      </CardContent>
    </Card>
  )
}
