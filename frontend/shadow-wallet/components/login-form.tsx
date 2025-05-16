"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Loader2, Lock, Mail } from "lucide-react"
import { useWalletService } from "@/lib/wallet-service"

interface LoginFormProps {
  onLoginSuccess?: () => void
}

export function LoginForm({ onLoginSuccess }: LoginFormProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [message, setMessage] = useState("")
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const walletService = useWalletService()

  const handleLogin = async (e) => {
    e.preventDefault()

    // Validate inputs
    if (!email || !password) {
      setMessage("Please fill in all fields")
      return
    }

    if (!email.endsWith("@qq.com")) {
      setMessage("Please use a QQ email address")
      return
    }

    setIsLoggingIn(true)
    try {
      // Login the user with the wallet service
      await walletService.loginUser(email, password)

      setMessage("Login successful!")

      // Call the success callback
      if (onLoginSuccess) {
        onLoginSuccess()
      }
    } catch (error) {
      console.error("Login error:", error)
      setMessage(`Login failed: ${error.message || "Invalid email or password"}`)
    } finally {
      setIsLoggingIn(false)
    }
  }

  return (
    <Card className="w-full border-0 bg-transparent shadow-none">
      <CardContent className="space-y-6 p-0">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-cyan-400 flex items-center">
            <Mail className="h-4 w-4 mr-2" />
            Email (QQ)
          </Label>
          <div className="relative">
            <Input
              id="email"
              type="email"
              placeholder="your-email@qq.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-gray-800 border-cyan-700 text-cyan-100 focus:border-cyan-500 focus:ring-cyan-500 pl-4 h-12"
            />
            <div className="absolute right-3 top-3 text-xs text-cyan-600">QQ MAIL ONLY</div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-cyan-400 flex items-center">
            <Lock className="h-4 w-4 mr-2" />
            Password
          </Label>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="bg-gray-800 border-cyan-700 text-cyan-100 focus:border-cyan-500 focus:ring-cyan-500 h-12"
          />
        </div>

        {message && (
          <div
            className={`p-3 rounded-md text-sm ${message.includes("successful") ? "bg-green-900/50 text-green-400 border border-green-700" : "bg-red-900/50 text-red-400 border border-red-700"}`}
          >
            {message}
          </div>
        )}

        <Button
          className="w-full h-12 bg-cyan-700 hover:bg-cyan-600 text-white border border-cyan-500 mt-4 relative overflow-hidden group"
          onClick={handleLogin}
          disabled={isLoggingIn || !email || !password}
        >
          <span className="absolute inset-0 w-full h-full transition-all duration-300 ease-out transform translate-x-0 -skew-x-12 bg-cyan-900 group-hover:translate-x-full group-hover:skew-x-12"></span>
          <span className="absolute inset-0 w-full h-full transition-all duration-300 ease-out transform skew-x-12 bg-cyan-800 group-hover:translate-x-full group-hover:-skew-x-12"></span>
          <span className="absolute bottom-0 left-0 hidden w-10 h-20 transition-all duration-100 ease-out transform translate-x-10 translate-y-0 bg-cyan-600 -rotate-12"></span>
          <span className="absolute bottom-0 right-0 hidden w-10 h-20 transition-all duration-100 ease-out transform translate-x-10 translate-y-0 bg-cyan-600 -rotate-12"></span>
          <span className="relative flex items-center justify-center">
            {isLoggingIn ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                AUTHENTICATING...
              </>
            ) : (
              "ACCESS SYSTEM"
            )}
          </span>
        </Button>
      </CardContent>
    </Card>
  )
}

