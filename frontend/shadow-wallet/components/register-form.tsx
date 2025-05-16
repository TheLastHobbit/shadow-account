"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Loader2, Mail, User, Lock, KeyRound, Shield } from "lucide-react"
import { useWalletService } from "@/lib/wallet-service"

interface RegisterFormProps {
  onRegisterSuccess?: () => void
}

export function RegisterForm({ onRegisterSuccess }: RegisterFormProps) {
  const [passport, setPassport] = useState("")
  const [password, setPassword] = useState("")
  const [password2, setPassword2] = useState("")
  const [nickname, setNickname] = useState("")
  const [code, setCode] = useState("")
  const [message, setMessage] = useState("")
  const [errorDetails, setErrorDetails] = useState("")
  const [isSendingCode, setIsSendingCode] = useState(false)
  const [isRegistering, setIsRegistering] = useState(false)
  const walletService = useWalletService()

  // Update the handleSendCode function to make real API calls
  const handleSendCode = async (e) => {
    e.preventDefault()

    // Validate inputs
    if (!passport || !password || !password2 || !nickname) {
      setMessage("Please fill in all fields")
      return
    }

    if (!passport.endsWith("@qq.com")) {
      setMessage("Please use a QQ email address")
      return
    }

    if (password !== password2) {
      setMessage("Passwords do not match")
      return
    }

    setIsSendingCode(true)
    setErrorDetails("")
    try {
      // Make a real API call to the backend
      const response = await fetch("http://127.0.0.1:8000/user/sign-up", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          passport,
          password,
          password2,
          nickname,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to send verification code")
      }

      const data = await response.json()
      console.log("Send code response:", data)

      setMessage("Verification code sent to your email")
    } catch (error) {
      console.error("Error sending verification code:", error)
      setMessage(`Failed to send verification code: ${error.message}`)
      setErrorDetails(`Error in components/register-form.tsx (handleSendCode): ${error.stack || error}`)
    } finally {
      setIsSendingCode(false)
    }
  }

  // Update the handleRegister function to handle real API responses
  const handleRegister = async (e) => {
    e.preventDefault()

    // Validate inputs
    if (!code) {
      setMessage("Please enter verification code")
      return
    }

    setIsRegistering(true)
    setErrorDetails("")
    try {
      // Register the user with the wallet service
      await walletService.registerUser(passport, password, nickname, code)

      setMessage("Registration successful!")

      // Call the success callback
      if (onRegisterSuccess) {
        setTimeout(() => {
          onRegisterSuccess()
        }, 1000)
      }
    } catch (error) {
      console.error("Registration error:", error)
      setMessage(`Registration failed: ${error.message}`)
      setErrorDetails(`Error in components/register-form.tsx (handleRegister): ${error.stack || error}`)
    } finally {
      setIsRegistering(false)
    }
  }

  return (
    <Card className="w-full border-0 bg-transparent shadow-none">
      <CardContent className="space-y-5 p-0">
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
              value={passport}
              onChange={(e) => setPassport(e.target.value)}
              required
              className="bg-gray-800 border-cyan-700 text-cyan-100 focus:border-cyan-500 focus:ring-cyan-500 pl-4 h-12"
            />
            <div className="absolute right-3 top-3 text-xs text-cyan-600">QQ MAIL ONLY</div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="nickname" className="text-cyan-400 flex items-center">
            <User className="h-4 w-4 mr-2" />
            Nickname
          </Label>
          <Input
            id="nickname"
            type="text"
            placeholder="Your nickname"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            required
            className="bg-gray-800 border-cyan-700 text-cyan-100 focus:border-cyan-500 focus:ring-cyan-500 h-12"
          />
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

        <div className="space-y-2">
          <Label htmlFor="password2" className="text-cyan-400 flex items-center">
            <KeyRound className="h-4 w-4 mr-2" />
            Confirm Password
          </Label>
          <Input
            id="password2"
            type="password"
            placeholder="••••••••"
            value={password2}
            onChange={(e) => setPassword2(e.target.value)}
            required
            className="bg-gray-800 border-cyan-700 text-cyan-100 focus:border-cyan-500 focus:ring-cyan-500 h-12"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="code" className="text-cyan-400 flex items-center">
            <Shield className="h-4 w-4 mr-2" />
            Verification Code
          </Label>
          <div className="flex space-x-2">
            <Input
              id="code"
              type="text"
              placeholder="Enter code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
              className="bg-gray-800 border-cyan-700 text-cyan-100 focus:border-cyan-500 focus:ring-cyan-500 h-12"
            />
            <Button
              onClick={handleSendCode}
              disabled={isSendingCode || !passport || !password || !password2 || !nickname}
              className="whitespace-nowrap bg-cyan-800 hover:bg-cyan-700 text-white border border-cyan-600 min-w-[120px]"
            >
              {isSendingCode ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                "Send Code"
              )}
            </Button>
          </div>
        </div>

        {message && (
          <div
            className={`p-3 rounded-md text-sm ${message.includes("successful") ? "bg-green-900/50 text-green-400 border border-green-700" : message.includes("Verification code sent") ? "bg-blue-900/50 text-blue-400 border border-blue-700" : "bg-red-900/50 text-red-400 border border-red-700"}`}
          >
            {message}
            {errorDetails && (
              <div className="mt-2 text-xs font-mono overflow-auto max-h-32 whitespace-pre-wrap">{errorDetails}</div>
            )}
          </div>
        )}

        <Button
          className="w-full h-12 bg-cyan-700 hover:bg-cyan-600 text-white border border-cyan-500 mt-4 relative overflow-hidden group"
          onClick={handleRegister}
          disabled={isRegistering || !passport || !password || !password2 || !nickname || !code}
        >
          <span className="absolute inset-0 w-full h-full transition-all duration-300 ease-out transform translate-x-0 -skew-x-12 bg-cyan-900 group-hover:translate-x-full group-hover:skew-x-12"></span>
          <span className="absolute inset-0 w-full h-full transition-all duration-300 ease-out transform skew-x-12 bg-cyan-800 group-hover:translate-x-full group-hover:-skew-x-12"></span>
          <span className="relative flex items-center justify-center">
            {isRegistering ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                INITIALIZING...
              </>
            ) : (
              "CREATE IDENTITY"
            )}
          </span>
        </Button>
      </CardContent>
    </Card>
  )
}

