"use client"

import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

interface ShadowAccountToggleProps {
  isShadowMode: boolean
  onToggle: () => void
  onShowShadowAccounts?: () => void // 新增属性，用于显示影子账户模块
}

export function ShadowAccountToggle({ isShadowMode, onToggle, onShowShadowAccounts }: ShadowAccountToggleProps) {
  return (
    <Card className={`border ${isShadowMode ? "border-purple-600 bg-slate-800" : "border-cyan-600 bg-gray-800"}`}>
      <CardContent className="p-4">
        <div className="flex items-center space-x-4">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-full ${
              isShadowMode ? "bg-purple-500/20" : "bg-cyan-500/20"
            }`}
          >
            {isShadowMode ? <EyeOff className="h-5 w-5 text-purple-400" /> : <Eye className="h-5 w-5 text-cyan-400" />}
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <Label
                htmlFor="shadow-mode"
                className={`font-medium ${isShadowMode ? "text-purple-300" : "text-cyan-300"}`}
              >
                Shadow Mode
              </Label>
              <Switch
                id="shadow-mode"
                checked={isShadowMode}
                onCheckedChange={(checked) => {
                  onToggle()
                  if (checked && onShowShadowAccounts) {
                    onShowShadowAccounts()
                  }
                }}
                className={isShadowMode ? "data-[state=checked]:bg-purple-500" : "data-[state=checked]:bg-cyan-500"}
              />
            </div>
            <p className={`text-sm ${isShadowMode ? "text-purple-400" : "text-cyan-400"} mt-1`}>
              {isShadowMode ? "STEALTH MODE ACTIVE :: RING SIGNATURES ENABLED" : "SWITCH TO ENABLE PRIVACY FEATURES"}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
