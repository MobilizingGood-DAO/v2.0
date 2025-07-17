// GOOD CARE network configuration
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

export interface WalletState {
  isConnected: boolean
  address: string
  chainId: string
  balance: string
}

// Wallet helper functions
export const detectWalletProvider = () => {
  if (typeof window === "undefined") return null

  // Check for MetaMask
  if ((window as any).ethereum?.isMetaMask) {
    return { name: "MetaMask", provider: (window as any).ethereum }
  }

  // Check for Core Wallet
  if ((window as any).avalanche) {
    return { name: "Core", provider: (window as any).avalanche }
  }

  // Check for generic ethereum provider
  if ((window as any).ethereum) {
    return { name: "Wallet", provider: (window as any).ethereum }
  }

  return null
}

export const switchToGoodCareNetwork = async (provider: any) => {
  try {
    // First try to switch to the network
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: GOOD_CARE_NETWORK.chainId }],
    })
  } catch (switchError: any) {
    // If network doesn't exist (error 4902), add it
    if (switchError.code === 4902) {
      try {
        await provider.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: GOOD_CARE_NETWORK.chainId,
              chainName: GOOD_CARE_NETWORK.chainName,
              nativeCurrency: GOOD_CARE_NETWORK.nativeCurrency,
              rpcUrls: GOOD_CARE_NETWORK.rpcUrls,
              blockExplorerUrls: GOOD_CARE_NETWORK.blockExplorerUrls,
            },
          ],
        })
      } catch (addError) {
        throw new Error(`Failed to add GOOD CARE network: ${addError}`)
      }
    } else {
      throw new Error(`Failed to switch to GOOD CARE network: ${switchError.message}`)
    }
  }
}

// Helper to get balance
export const getBalance = async (provider: any, address: string): Promise<string> => {
  try {
    const balance = await provider.request({
      method: "eth_getBalance",
      params: [address, "latest"],
    })
    // Convert from wei to CARE (18 decimals)
    const balanceInCare = Number.parseInt(balance, 16) / Math.pow(10, 18)
    return balanceInCare.toFixed(4)
  } catch (error) {
    console.error("Error getting balance:", error)
    return "0.0000"
  }
}
