"use client"

import { useAuth } from "@/hooks/useAuth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Wallet } from "lucide-react"

export function WalletConnect() {
  const { connectWallet, isLoading } = useAuth()

  return (
    <Card>
      <CardHeader className="text-center">
        <Wallet className="h-12 w-12 mx-auto mb-4 text-blue-600" />
        <CardTitle>Connect Your Wallet</CardTitle>
        <CardDescription>
          Connect your wallet to start tracking your wellness journey and earning CARE tokens
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={connectWallet} disabled={isLoading} className="w-full" size="lg">
          {isLoading ? "Connecting..." : "Connect Wallet"}
        </Button>
      </CardContent>
    </Card>
  )
}
