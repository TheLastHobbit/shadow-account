"use client"

import { useState, useEffect } from "react"
import { ConnectButton } from "@/components/connect-button"
import { WalletView } from "@/components/wallet-view"
import { ShadowAccountToggle } from "@/components/shadow-account-toggle"
import { RingSignatureMembers } from "@/components/ring-signature-members"
import { TransactionStatus } from "@/components/transaction-status"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useWalletService } from "@/lib/wallet-service"
import { Button } from "@/components/ui/button"
import { LoginForm } from "@/components/login-form"
import { RegisterForm } from "@/components/register-form"
import { Shield, User, UserPlus, LogOut, KeyRound } from "lucide-react"
import { ShadowAccountDashboard } from "@/components/shadow/shadow-account-dashboard"
import { SocialRecoveryFlow } from "@/components/SocialRecoveryFlow"

export default function Home() {
  const [isConnected, setIsConnected] = useState(false)
  const [isShadowMode, setIsShadowMode] = useState(false)
  const [lastTransaction, setLastTransaction] = useState(null)
  const [userEmail, setUserEmail] = useState("")
  const [authMode, setAuthMode] = useState<"none" | "login" | "register">("none")
  const walletService = useWalletService()
  const [showShadowAccounts, setShowShadowAccounts] = useState(false)
  const [showRecoveryFlow, setShowRecoveryFlow] = useState(false)

  // Check if user is logged in
  useEffect(() => {

    // if (walletService.isLoggedIn) {
    if (true) {
      setIsConnected(true)
      // Get user email from storage
      const user = localStorage.getItem("user_key")
      if (user) {
        try {
          const userData = JSON.parse(user)
          setUserEmail(userData.passport || "")
        } catch (e) {
          console.error("Error parsing user data:", e)
        }
      }
    }
  }, [walletService.isLoggedIn])

  // Update the handleConnect function to handle real API responses
  const handleConnect = async (email) => {
    try {
      if (email && email.endsWith("@qq.com")) {
        setUserEmail(email)
        await walletService.connectWithEmail(email)
        setIsConnected(true)
        setAuthMode("none")
      } else {
        alert("Please use a QQ email address")
      }
    } catch (error) {
      console.error("Connection error:", error)
      alert(`Connection failed: ${error.message}`)
    }
  }

  // Update the toggleShadowMode function to handle real API responses
  const toggleShadowMode = async () => {
    try {
      if (!isShadowMode) {
        // Activate shadow mode
        await walletService.activateShadowMode()
      } else {
        // Deactivate shadow mode
        await walletService.deactivateShadowMode()
      }

      setIsShadowMode(!isShadowMode)

      // Apply dark mode class to document when shadow mode is enabled
      if (!isShadowMode) {
        document.documentElement.classList.add("dark")
      } else {
        document.documentElement.classList.remove("dark")
      }
    } catch (error) {
      console.error("Shadow mode toggle error:", error)
      alert(`Failed to toggle shadow mode: ${error.message}`)
    }
  }

  // Update the executeTransaction function to handle real API responses
  const executeTransaction = async (txData) => {
    try {
      const txHash = await walletService.sendTransaction(txData, isShadowMode)

      setLastTransaction({
        status: "success",
        hash: txHash,
        timestamp: Date.now(),
      })

      return txHash
    } catch (error) {
      console.error("Transaction error:", error)

      setLastTransaction({
        status: "failed",
        hash: "0x0",
        timestamp: Date.now(),
        error: error.message,
      })

      throw error
    }
  }

  // Handle user logout
  const handleLogout = async () => {
    try {
      await walletService.logoutUser()
      setIsConnected(false)
      setIsShadowMode(false)
      setLastTransaction(null)
      setUserEmail("")
      setAuthMode("none")

      // Remove dark mode class if it was applied
      document.documentElement.classList.remove("dark")
    } catch (error) {
      console.error("Logout error:", error)
      alert(`Failed to logout: ${error.message}`)
    }
  }

  return (
    <div className="min-h-screen bg-black text-cyan-400 cyberpunk-bg">
      <div className="container mx-auto px-4 py-8 max-w-4xl relative z-10">
        <div
          className={`transition-colors duration-300 rounded-lg overflow-hidden ${isShadowMode ? "shadow-purple-glow" : "shadow-cyan-glow"}`}
        >
          <Card
            className={`border-2 ${isShadowMode ? "bg-slate-900 border-purple-500" : "bg-gray-900 border-cyan-500"} cyberpunk-card`}
          >
            <CardHeader
              className={`${isShadowMode ? "bg-gradient-to-r from-purple-900 to-indigo-900" : "bg-gradient-to-r from-cyan-900 to-blue-900"} text-white relative overflow-hidden`}
            >
              <div className="cyberpunk-grid absolute inset-0 opacity-20"></div>
              <div className="flex justify-between items-center relative z-10">
                <div>
                  <CardTitle className="text-3xl font-glitch">
                    <span className={`mr-2 ${isShadowMode ? "text-purple-400" : "text-cyan-400"}`}>⟨⟨</span>
                    Shadow Wallet
                    <span className={`ml-2 ${isShadowMode ? "text-purple-400" : "text-cyan-400"}`}>⟩⟩</span>
                  </CardTitle>
                  <CardDescription
                    className={`${isShadowMode ? "text-purple-300" : "text-cyan-300"} text-sm tracking-wider`}
                  >
                    {isShadowMode
                      ? "STEALTH MODE ACTIVE :: RING SIGNATURE ENABLED"
                      : "PRIVACY-FOCUSED ERC-4337 SMART CONTRACT WALLET"}
                  </CardDescription>
                </div>
                {isConnected && (
                  <div className="flex items-center gap-2">
                    <ConnectButton
                      isConnected={isConnected}
                      onConnect={handleConnect}
                      isShadowMode={isShadowMode}
                      email={userEmail}
                    />
                    <Button
                      variant="outline"
                      className={`${
                        isShadowMode
                          ? "bg-purple-900/50 hover:bg-purple-900/70 text-purple-200 border-purple-600"
                          : "bg-cyan-900/50 hover:bg-cyan-900/70 text-cyan-200 border-cyan-600"
                      }`}
                      onClick={handleLogout}
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      LOGOUT
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className={`p-6 ${isShadowMode ? "bg-slate-900" : "bg-gray-900"}`}>
              {!isConnected ? (
                <div className="py-8">
                  {authMode === "none" ? (
                    <div className="text-center space-y-8">
                      <div className="space-y-4">
                        <h2 className="text-2xl font-bold glitch-text">
                          <span className={isShadowMode ? "text-purple-400" : "text-cyan-400"}>
                            Welcome to the Shadow Network
                          </span>
                        </h2>
                        <p className="text-gray-400 max-w-lg mx-auto">
                          Access the decentralized web with enhanced privacy. Your gateway to anonymous transactions and
                          digital sovereignty.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-md mx-auto">
                        <Button
                          onClick={() => setAuthMode("login")}
                          className={`h-16 text-lg ${
                            isShadowMode
                              ? "bg-purple-700 hover:bg-purple-600 text-white border border-purple-500"
                              : "bg-cyan-800 hover:bg-cyan-700 text-white border border-cyan-500"
                          }`}
                        >
                          <User className="mr-2 h-5 w-5" />
                          Login
                        </Button>

                        <Button
                          onClick={() => setShowRecoveryFlow(true)}
                          className={`h-16 text-lg ${
                            isShadowMode
                              ? "bg-amber-700 hover:bg-amber-600 text-white border border-amber-500"
                              : "bg-yellow-800 hover:bg-yellow-700 text-white border border-yellow-500"
                          }`}
                        >
                          <KeyRound className="mr-2 h-5 w-5" />
                          恢复钱包
                        </Button>

                        <Button
                          onClick={() => setAuthMode("register")}
                          className={`h-16 text-lg ${
                            isShadowMode
                              ? "bg-indigo-700 hover:bg-indigo-600 text-white border border-indigo-500"
                              : "bg-blue-800 hover:bg-blue-700 text-white border border-blue-500"
                          }`}
                        >
                          <UserPlus className="mr-2 h-5 w-5" />
                          Register
                        </Button>
                      </div>

                      <div className="pt-8 flex justify-center">
                        <div
                          className={`inline-flex items-center px-4 py-2 rounded-full ${isShadowMode ? "bg-purple-900/50 text-purple-300" : "bg-cyan-900/50 text-cyan-300"}`}
                        >
                          <Shield className="h-4 w-4 mr-2" />
                          <span className="text-sm">Military-grade encryption & privacy</span>
                        </div>
                      </div>
                    </div>
                  ) : authMode === "login" ? (
                    <div>
                      <div className="mb-6 flex items-center">
                        <Button
                          variant="ghost"
                          onClick={() => setAuthMode("none")}
                          className={
                            isShadowMode ? "text-purple-400 hover:text-purple-300" : "text-cyan-400 hover:text-cyan-300"
                          }
                        >
                          ← Back
                        </Button>
                        <h2 className={`text-xl font-bold ml-2 ${isShadowMode ? "text-purple-400" : "text-cyan-400"}`}>
                          Login to Shadow Wallet
                        </h2>
                      </div>
                      <LoginForm onLoginSuccess={() => setIsConnected(true)} />
                    </div>
                  ) : (
                    <div>
                      <div className="mb-6 flex items-center">
                        <Button
                          variant="ghost"
                          onClick={() => setAuthMode("none")}
                          className={
                            isShadowMode ? "text-purple-400 hover:text-purple-300" : "text-cyan-400 hover:text-cyan-300"
                          }
                        >
                          ← Back
                        </Button>
                        <h2 className={`text-xl font-bold ml-2 ${isShadowMode ? "text-purple-400" : "text-cyan-400"}`}>
                          Register New Account
                        </h2>
                      </div>
                      <RegisterForm onRegisterSuccess={() => setIsConnected(true)} />
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-center mb-6">
                    <ShadowAccountToggle
                      isShadowMode={isShadowMode}
                      onToggle={toggleShadowMode}
                      onShowShadowAccounts={() => setShowShadowAccounts(true)}
                    />
                    <TransactionStatus transaction={lastTransaction} />
                  </div>

                  <Tabs defaultValue="wallet" className="w-full">
                    <TabsList className={`grid grid-cols-3 mb-4 ${isShadowMode ? "bg-slate-800" : "bg-gray-800"}`}>
                      <TabsTrigger
                        value="wallet"
                        className={
                          isShadowMode
                            ? "data-[state=active]:bg-purple-700 data-[state=active]:text-white"
                            : "data-[state=active]:bg-cyan-700 data-[state=active]:text-white"
                        }
                      >
                        Wallet
                      </TabsTrigger>
                      <TabsTrigger
                        value="transactions"
                        className={
                          isShadowMode
                            ? "data-[state=active]:bg-purple-700 data-[state=active]:text-white"
                            : "data-[state=active]:bg-cyan-700 data-[state=active]:text-white"
                        }
                      >
                        Transactions
                      </TabsTrigger>
                      <TabsTrigger
                        value="settings"
                        className={
                          isShadowMode
                            ? "data-[state=active]:bg-purple-700 data-[state=active]:text-white"
                            : "data-[state=active]:bg-cyan-700 data-[state=active]:text-white"
                        }
                      >
                        Settings
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="wallet">
                      <WalletView
                        isShadowMode={isShadowMode}
                        onSendTransaction={executeTransaction}
                        walletService={walletService}
                      />
                    </TabsContent>

                    <TabsContent value="transactions">
                      <div
                        className={`text-center py-8 ${isShadowMode ? "text-purple-400" : "text-cyan-400"} border border-dashed rounded-md ${isShadowMode ? "border-purple-700" : "border-cyan-700"} p-6`}
                      >
                        <div className="terminal-text">
                          <span className="text-green-400">$</span>{" "}
                          <span className="typing-animation">Loading transaction history...</span>
                          <div className="mt-2 text-xs opacity-70">
                            NO_DATA_FOUND: Transaction history will appear here
                          </div>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="settings">
                      <div className="space-y-6">
                        <RingSignatureMembers isShadowMode={isShadowMode} walletService={walletService} />

                        <Card
                          className={isShadowMode ? "bg-slate-800 border-purple-600" : "bg-gray-800 border-cyan-600"}
                        >
                          <CardHeader>
                            <CardTitle className={isShadowMode ? "text-purple-300" : "text-cyan-300"}>
                              Account Management
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-4">
                              <div className="flex justify-between items-center">
                                <div>
                                  <h3 className={`font-medium ${isShadowMode ? "text-purple-300" : "text-cyan-300"}`}>
                                    Current Account
                                  </h3>
                                  <p className={`text-sm ${isShadowMode ? "text-purple-400" : "text-cyan-400"}`}>
                                    {userEmail}
                                  </p>
                                </div>
                                <Button
                                  variant="destructive"
                                  onClick={handleLogout}
                                  className="bg-red-700 hover:bg-red-600 text-white border border-red-500"
                                >
                                  <LogOut className="mr-2 h-4 w-4" />
                                  LOGOUT
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </TabsContent>
                  </Tabs>
                  {isShadowMode && showShadowAccounts && (
                    <div className="mt-6">
                      <ShadowAccountDashboard />
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      <SocialRecoveryFlow open={showRecoveryFlow} onOpenChange={setShowRecoveryFlow} />
    </div>
  )
}
