"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Loader2, Sparkles, Check, ExternalLink } from "lucide-react"

interface GratitudeMintModalProps {
  isOpen: boolean
  onClose: () => void
  journalContent: string
  userId: string
}

const EMOTIONAL_TAGS = [
  { value: "gratitude", label: "Gratitude 🙏" },
  { value: "relief", label: "Relief 😌" },
  { value: "joy", label: "Joy 😊" },
  { value: "peace", label: "Peace ☮️" },
  { value: "hope", label: "Hope 🌟" },
  { value: "love", label: "Love ❤️" },
]

export default function GratitudeMintModal({ isOpen, onClose, journalContent, userId }: GratitudeMintModalProps) {
  const [selectedTag, setSelectedTag] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [txHash, setTxHash] = useState<string>("")
  const [error, setError] = useState<string>("")

  const handleMint = async () => {
    if (!selectedTag) {
      setError("Please select an emotional tag")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      const response = await fetch("/api/mint", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          content: journalContent,
          emotionalTag: selectedTag,
        }),
      })

      const data = await response.json()

      if (data.success && data.txHash) {
        setTxHash(data.txHash)
        setIsSuccess(true)
      } else {
        setError(data.error || "Failed to mint on blockchain")
      }
    } catch (err) {
      console.error("Mint error:", err)
      setError("Network error. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setSelectedTag("")
    setIsLoading(false)
    setIsSuccess(false)
    setTxHash("")
    setError("")
    onClose()
  }

  const getShortHash = (hash: string) => {
    if (!hash) return ""
    return `${hash.slice(0, 6)}...${hash.slice(-4)}`
  }

  const getExplorerUrl = (hash: string) => {
    return `https://subnets.avax.network/goodcare/mainnet/tx/${hash}`
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            {isSuccess ? "Minted Successfully!" : "Mint On-Chain"}
          </DialogTitle>
          <DialogDescription>
            {isSuccess
              ? "Your journal entry hash has been stored on the GOOD CARE blockchain."
              : "Store a cryptographic hash of your journal entry on the blockchain."}
          </DialogDescription>
        </DialogHeader>

        {isSuccess ? (
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="rounded-full bg-green-100 p-3">
                <Check className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-green-800">Successfully Minted!</h3>
              <p className="text-sm text-gray-600 mt-1">Your gratitude is now permanently on-chain.</p>
            </div>
            {txHash && (
              <div className="space-y-2">
                <div className="p-2 bg-gray-50 rounded text-xs font-mono">{getShortHash(txHash)}</div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(getExplorerUrl(txHash), "_blank")}
                  className="text-xs"
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  View on Explorer
                </Button>
              </div>
            )}
            <Button onClick={handleClose} className="w-full">
              Done
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Choose an emotional tag:</label>
              <div className="grid grid-cols-2 gap-2">
                {EMOTIONAL_TAGS.map((tag) => (
                  <Badge
                    key={tag.value}
                    variant={selectedTag === tag.value ? "default" : "outline"}
                    className={`cursor-pointer p-2 text-center justify-center ${
                      selectedTag === tag.value ? "ring-2 ring-purple-500" : ""
                    }`}
                    onClick={() => setSelectedTag(tag.value)}
                  >
                    {tag.label}
                  </Badge>
                ))}
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-md">
              <strong>Privacy:</strong> Only a hash of your content is stored on-chain, not the actual text.
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={handleClose} className="flex-1 bg-transparent">
                Skip
              </Button>
              <Button
                onClick={handleMint}
                disabled={!selectedTag || isLoading}
                className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Minting...
                  </>
                ) : (
                  "Mint On-Chain"
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
