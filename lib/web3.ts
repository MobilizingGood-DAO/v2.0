import { JsonRpcProvider, BrowserProvider, Contract, parseEther, formatEther } from "ethers"

// CARE Token Contract ABI (simplified for key functions)
export const CARE_TOKEN_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function transferFrom(address from, address to, uint256 amount) returns (bool)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function totalSupply() view returns (uint256)",
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event Approval(address indexed owner, address indexed spender, uint256 value)",
]

// GOOD CARE Network configuration
export const GOOD_CARE_NETWORK = {
  chainId: "0xB516D", // 741741 in hex
  chainName: "GOOD CARE",
  nativeCurrency: {
    name: "CARE",
    symbol: "CARE",
    decimals: 18,
  },
  rpcUrls: ["https://subnets.avax.network/goodcare/mainnet/rpc"],
  blockExplorerUrls: ["https://subnets.avax.network/goodcare"],
}

// CARE Token Contract Address (replace with actual deployed address)
export const CARE_TOKEN_ADDRESS = "0x..." // TODO: Add actual contract address

// Get provider for read-only operations
export function getProvider(): JsonRpcProvider {
  return new JsonRpcProvider(GOOD_CARE_NETWORK.rpcUrls[0])
}

// Get signer for write operations (requires wallet connection)
export async function getSigner(): Promise<BrowserProvider> {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error("No wallet found")
  }

  const provider = new BrowserProvider(window.ethereum)
  await provider.send("eth_requestAccounts", [])
  return provider
}

// Get CARE token contract instance
export async function getCareTokenContract(withSigner = false): Promise<Contract> {
  if (withSigner) {
    const signer = await getSigner()
    return new Contract(CARE_TOKEN_ADDRESS, CARE_TOKEN_ABI, signer)
  } else {
    const provider = getProvider()
    return new Contract(CARE_TOKEN_ADDRESS, CARE_TOKEN_ABI, provider)
  }
}

// Utility functions
export function parseCAREAmount(amount: string): bigint {
  return parseEther(amount)
}

export function formatCAREAmount(amount: bigint): string {
  return formatEther(amount)
}

// Check if user is on GOOD CARE network
export async function isOnGoodCareNetwork(): Promise<boolean> {
  if (typeof window === "undefined" || !window.ethereum) {
    return false
  }

  try {
    const chainId = await window.ethereum.request({ method: "eth_chainId" })
    return chainId === GOOD_CARE_NETWORK.chainId
  } catch (error) {
    console.error("Error checking network:", error)
    return false
  }
}

// Switch to GOOD CARE network
export async function switchToGoodCareNetwork(): Promise<boolean> {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error("No wallet found")
  }

  try {
    // Try to switch to the network
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: GOOD_CARE_NETWORK.chainId }],
    })
    return true
  } catch (switchError: any) {
    // Network doesn't exist, try to add it
    if (switchError.code === 4902) {
      try {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [GOOD_CARE_NETWORK],
        })
        return true
      } catch (addError) {
        console.error("Error adding network:", addError)
        throw addError
      }
    } else {
      console.error("Error switching network:", switchError)
      throw switchError
    }
  }
}

// Get user's CARE token balance
export async function getCareBalance(address: string): Promise<string> {
  try {
    const contract = await getCareTokenContract(false)
    const balance = await contract.balanceOf(address)
    return formatCAREAmount(balance)
  } catch (error) {
    console.error("Error getting CARE balance:", error)
    return "0"
  }
}

// Send CARE tokens
export async function sendCareTokens(to: string, amount: string): Promise<string> {
  try {
    const contract = await getCareTokenContract(true)
    const parsedAmount = parseCAREAmount(amount)

    const tx = await contract.transfer(to, parsedAmount)
    console.log("Transaction sent:", tx.hash)

    const receipt = await tx.wait()
    console.log("Transaction confirmed:", receipt.hash)

    return receipt.hash
  } catch (error) {
    console.error("Error sending CARE tokens:", error)
    throw error
  }
}

// Type declarations
declare global {
  interface Window {
    ethereum?: any
  }
}

export class Web3Service {
  private provider: BrowserProvider | null = null
  private contract: Contract | null = null

  async initialize() {
    if (typeof window !== "undefined" && window.ethereum) {
      this.provider = await getSigner()
      this.contract = new Contract(CARE_TOKEN_ADDRESS, CARE_TOKEN_ABI, this.provider)
    }
  }

  async getCareBalance(address: string): Promise<string> {
    if (!this.contract) await this.initialize()
    if (!this.contract) throw new Error("Contract not initialized")

    const balance = await this.contract.balanceOf(address)
    return formatCAREAmount(balance)
  }

  async sendCarePoints(toAddress: string, amount: number, postId: string): Promise<string> {
    if (!this.contract) await this.initialize()
    if (!this.contract) throw new Error("Contract not initialized")

    const amountWei = parseEther(amount.toString())
    const tx = await this.contract.transfer(toAddress, amountWei)
    await tx.wait()
    return tx.hash
  }

  async awardActivityPoints(userAddress: string, activityType: string): Promise<string> {
    if (!this.contract) await this.initialize()
    if (!this.contract) throw new Error("Contract not initialized")

    let tx
    switch (activityType) {
      case "mood_check":
        tx = await this.contract.transfer(userAddress, parseEther("100")) // Example amount
        break
      case "journal":
        tx = await this.contract.transfer(userAddress, parseEther("200")) // Example amount
        break
      case "community_post":
        tx = await this.contract.transfer(userAddress, parseEther("300")) // Example amount
        break
      case "comment":
        tx = await this.contract.transfer(userAddress, parseEther("400")) // Example amount
        break
      default:
        throw new Error("Invalid activity type")
    }

    await tx.wait()
    return tx.hash
  }

  // Listen for CARE point events
  onCarePointsTransferred(callback: (from: string, to: string, amount: string) => void) {
    if (!this.contract) return

    this.contract.on("Transfer", (from, to, amount) => {
      callback(from, to, formatCAREAmount(amount))
    })
  }

  onCarePointsAwarded(callback: (user: string, amount: string, reason: string) => void) {
    if (!this.contract) return

    // Assuming a custom event for awarding points
    this.contract.on("CustomAwardPoints", (user, amount, reason) => {
      callback(user, formatCAREAmount(amount), reason)
    })
  }
}

export const web3Service = new Web3Service()
