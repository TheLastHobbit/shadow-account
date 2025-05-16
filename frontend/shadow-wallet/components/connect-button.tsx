"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Mail, Shield } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface ConnectButtonProps {
  isConnected: boolean
  onConnect: (email: string) => void
  isShadowMode?: boolean
  email?: string
}

export function ConnectButton({ isConnected, onConnect, isShadowMode, email }: ConnectButtonProps) {
  const [open, setOpen] = useState(false)
  const [inputEmail, setInputEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleConnect = async (e) => {
    e.preventDefault()
    if (!inputEmail) return

    // Validate QQ email
    if (!inputEmail.endsWith("@qq.com")) {
      alert("Please use a QQ email address")
      return
    }

    setIsLoading(true)
    try {
      await onConnect(inputEmail)
      setOpen(false)
    } catch (error) {
      console.error("Login error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isConnected) {
    return (
      <div
        className={`flex items-center px-3 py-2 rounded ${
          isShadowMode
            ? "bg-purple-900/50 text-purple-200 border border-purple-600"
            : "bg-cyan-900/50 text-cyan-200 border border-cyan-600"
        }`}
      >
        <Mail className="mr-2 h-4 w-4" />
        <span className="font-mono">{email || "CONNECTED"}</span>
      </div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-cyan-600 text-white hover:bg-cyan-500 border border-cyan-400">
          <Shield className="mr-2 h-4 w-4" />
          CONNECT
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-gray-900 border-cyan-600">
        <DialogHeader>
          <DialogTitle className="text-cyan-300">Connect to Shadow Wallet</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleConnect} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-cyan-400">
              QQ Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="your-email@qq.com"
              value={inputEmail}
              onChange={(e) => setInputEmail(e.target.value)}
              required
              className="bg-gray-800 border-cyan-700 text-cyan-100"
            />
            <p className="text-sm text-cyan-500">Please use your QQ email address to login</p>
          </div>
          <Button
            type="submit"
            className="w-full bg-cyan-700 hover:bg-cyan-600 text-white border border-cyan-500"
            disabled={isLoading || !inputEmail}
          >
            {isLoading ? "CONNECTING..." : "CONNECT WITH QQ EMAIL"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

