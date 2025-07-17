"use client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Zap, Database } from "lucide-react"

interface BlockchainToggleProps {
  onChain: boolean
  onToggle: (enabled: boolean) => void
}

export function BlockchainToggle({ onChain, onToggle }: BlockchainToggleProps) {
  return (
    <Card className="bg-white/80 backdrop-blur-sm border-indigo-200">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Zap className="w-4 h-4 text-indigo-500" />
          Transaction Mode
        </CardTitle>
        <CardDescription className="text-xs">Choose how CARE points are processed</CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {onChain ? (
              <>
                <Zap className="w-4 h-4 text-indigo-500" />
                <span className="text-sm font-medium">On-Chain</span>
                <Badge variant="outline" className="text-xs bg-indigo-50 text-indigo-700">
                  Blockchain
                </Badge>
              </>
            ) : (
              <>
                <Database className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium">Off-Chain</span>
                <Badge variant="outline" className="text-xs bg-gray-50 text-gray-700">
                  Database
                </Badge>
              </>
            )}
          </div>
          <Switch checked={onChain} onCheckedChange={onToggle} />
        </div>

        <div className="mt-3 text-xs text-gray-600">
          {onChain ? (
            <div className="space-y-1">
              <div>✅ Transparent & immutable</div>
              <div>✅ True ownership of CARE tokens</div>
              <div>⚠️ Requires gas fees</div>
            </div>
          ) : (
            <div className="space-y-1">
              <div>✅ Instant transactions</div>
              <div>✅ No gas fees</div>
              <div>⚠️ Centralized database</div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
