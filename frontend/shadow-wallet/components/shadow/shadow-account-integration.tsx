"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Shield } from "lucide-react"
import { ShadowAccountModule } from "./shadow-account-module"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

interface ShadowAccountIntegrationProps {
  rootAddress: string
  walletService: any
  onSendTransaction?: (txData: any) => Promise<string>
}


export function ShadowAccountIntegration({
  rootAddress,
  walletService,
  onSendTransaction,
}: ShadowAccountIntegrationProps) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-purple-700 hover:bg-purple-600 text-white border border-purple-500">
          <Shield className="mr-2 h-4 w-4" />
          影子账户
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-3xl bg-gray-900 border-purple-600 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-purple-300">影子账户管理</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <ShadowAccountModule
            rootAddress={rootAddress}
            walletService={walletService}
            onSendTransaction={(txData) => {
              const result = onSendTransaction?.(txData)
              setOpen(false)
              return result
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
