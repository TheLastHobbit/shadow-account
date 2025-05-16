"use client"

import { ShadowAccountDashboard } from "/Users/sanji/Library/Containers/com.tencent.xinWeChat/Data/Library/Application Support/com.tencent.xinWeChat/2.0b4.0.9/be11db6499d7798710c7b6e96950220b/Message/MessageTemp/9e20f478899dc29eb19741386f9343c8/File/AA_DID/frontend/shadow-wallet/components/shadow/shadow-account-dashboard.tsx"

export default function ShadowAccountsPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-purple-300 mb-2">影子账户</h1>
          <p className="text-purple-400 max-w-2xl mx-auto">创建和管理您的私密影子账户，增强交易隐私性和匿名性。</p>
        </div>

        <ShadowAccountDashboard />
      </div>
    </div>
  )
}
