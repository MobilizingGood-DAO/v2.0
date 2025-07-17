import { type NextRequest, NextResponse } from "next/server"
import { ethers } from "ethers"
import { createHash } from "crypto"

const GRATITUDE_ABI = ["function logGratitude(string hash, string emotionalTag) public"]

export async function POST(request: NextRequest) {
  try {
    const { userId, content, emotionalTag } = await request.json()

    if (!userId || !content || !emotionalTag) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Check for required environment variables
    if (!process.env.GOODCARE_PRIVATE_KEY) {
      console.error("❌ Missing GOODCARE_PRIVATE_KEY environment variable")
      return NextResponse.json({ 
        error: "Blockchain configuration missing. Please set up environment variables." 
      }, { status: 500 })
    }

    if (!process.env.GOODCARE_RPC_URL) {
      console.error("❌ Missing GOODCARE_RPC_URL environment variable")
      return NextResponse.json({ 
        error: "Blockchain configuration missing. Please set up environment variables." 
      }, { status: 500 })
    }

    if (!process.env.GRATITUDE_CONTRACT_ADDRESS) {
      console.error("❌ Missing GRATITUDE_CONTRACT_ADDRESS environment variable")
      return NextResponse.json({ 
        error: "Blockchain configuration missing. Please set up environment variables." 
      }, { status: 500    })
    }

    // Hash the content (private on-chain!)
    const hash = createHash("sha256").update(content).digest("hex")

    console.log("Minting gratitude:", { userId, emotionalTag, hash: hash.slice(0, 10) + "..." })

    const provider = new ethers.JsonRpcProvider(process.env.GOODCARE_RPC_URL)
    const wallet = new ethers.Wallet(process.env.GOODCARE_PRIVATE_KEY!, provider)
    const contract = new ethers.Contract(process.env.GRATITUDE_CONTRACT_ADDRESS!, GRATITUDE_ABI, wallet)

    console.log("Provider URL:", process.env.GOODCARE_RPC_URL)
    console.log("Contract address:", process.env.GRATITUDE_CONTRACT_ADDRESS)
    console.log("Wallet address:", wallet.address)

    const tx = await contract.logGratitude(hash, emotionalTag)
    console.log("Transaction sent:", tx.hash)

    const receipt = await tx.wait()
    console.log("✅ Gratitude logged. Tx hash:", receipt.hash)
    return NextResponse.json({ success: true, txHash: receipt.hash })
  } catch (error) {
    console.error("❌ Error minting gratitude:", error)
    if (typeof error === "object" && error !== null && "message" in error) {
      console.error("Error message:", (error as { message: string }).message)
      return NextResponse.json({ error: (error as { message: string }).message }, { status: 500 })
    }
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
