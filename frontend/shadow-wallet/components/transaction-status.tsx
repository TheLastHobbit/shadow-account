"use client"

import { CheckCircle, XCircle, Clock } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface Transaction {
  status: "pending" | "success" | "failed"
  hash: string
  timestamp: number
  error?: string
}

interface TransactionStatusProps {
  transaction: Transaction | null
}

export function TransactionStatus({ transaction }: TransactionStatusProps) {
  if (!transaction) return null

  const getStatusIcon = () => {
    switch (transaction.status) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "failed":
        return <XCircle className="h-5 w-5 text-red-500" />
      case "pending":
        return <Clock className="h-5 w-5 text-yellow-500" />
      default:
        return null
    }
  }

  const getStatusText = () => {
    switch (transaction.status) {
      case "success":
        return "TRANSACTION SUCCESSFUL"
      case "failed":
        return "TRANSACTION FAILED"
      case "pending":
        return "TRANSACTION PENDING"
      default:
        return "UNKNOWN STATUS"
    }
  }

  const timeAgo = () => {
    const seconds = Math.floor((Date.now() - transaction.timestamp) / 1000)
    if (seconds < 60) return `${seconds} seconds ago`
    const minutes = Math.floor(seconds / 60)
    return `${minutes} minute${minutes > 1 ? "s" : ""} ago`
  }

  return (
    <Alert className="w-fit bg-gray-800 border-cyan-700">
      <div className="flex items-center gap-2">
        {getStatusIcon()}
        <div>
          <AlertTitle className="text-cyan-300">{getStatusText()}</AlertTitle>
          <AlertDescription className="flex flex-col text-xs text-cyan-400 font-mono">
            <span>
              {transaction.hash.substring(0, 10)}...{transaction.hash.substring(transaction.hash.length - 8)}
            </span>
            <span>{timeAgo()}</span>
            {transaction.error && <span className="text-red-400 mt-1">{transaction.error}</span>}
          </AlertDescription>
        </div>
      </div>
    </Alert>
  )
}

