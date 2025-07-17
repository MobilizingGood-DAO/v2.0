"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Bug, ChevronDown, ChevronUp } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"

export function DebugPanel() {
  const [isOpen, setIsOpen] = useState(false)
  const { user, wallet, carePoints } = useAuth()

  if (process.env.NODE_ENV === "production") return null

  return (
    <Card className="fixed bottom-4 right-4 w-80 bg-black/90 text-white border-gray-700 z-50">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Bug className="w-4 h-4" />
            Debug Panel
          </div>
          <Button variant="ghost" size="sm" onClick={() => setIsOpen(!isOpen)} className="text-white hover:bg-gray-800">
            {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </Button>
        </CardTitle>
      </CardHeader>

      {isOpen && (
        <CardContent className="pt-0 space-y-3">
          <div>
            <div className="text-xs font-medium text-gray-300 mb-1">Wallet Status</div>
            <Badge variant={wallet.isConnected ? "default" : "secondary"} className="text-xs">
              {wallet.isConnected ? "Connected" : "Disconnected"}
            </Badge>
            {wallet.isConnected && (
              <div className="text-xs text-gray-400 mt-1">
                {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}
              </div>
            )}
          </div>

          <div>
            <div className="text-xs font-medium text-gray-300 mb-1">User Data</div>
            {user ? (
              <div className="space-y-1">
                <div className="text-xs">ID: {user.id.slice(0, 8)}...</div>
                <div className="text-xs">Name: {user.username || user.name || "No name"}</div>
                <div className="text-xs">Points: {carePoints}</div>
                {user.stats && (
                  <div className="text-xs">
                    Streak: {user.stats.current_streak} | Level: {user.stats.level}
                  </div>
                )}
              </div>
            ) : (
              <Badge variant="secondary" className="text-xs">
                No user data
              </Badge>
            )}
          </div>

          <div>
            <div className="text-xs font-medium text-gray-300 mb-1">Environment</div>
            <div className="text-xs text-gray-400">{process.env.NODE_ENV || "development"}</div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              console.log("🐛 Debug Info:", {
                user,
                wallet,
                carePoints,
                timestamp: new Date().toISOString(),
              })
            }}
            className="w-full text-xs bg-transparent border-gray-600 text-white hover:bg-gray-800"
          >
            Log Debug Info
          </Button>
        </CardContent>
      )}
    </Card>
  )
}
