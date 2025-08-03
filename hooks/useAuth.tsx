"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { supabase } from '@/lib/supabase'

interface User {
  id: string
  wallet_address?: string
  twitter_username?: string
  twitter_name?: string
  twitter_avatar_url?: string
  name?: string
  care_points: number
  user_stats: {
    current_streak: number
    longest_streak: number
    total_checkins: number
    total_points: number
    level: number
    last_checkin?: string
  }
  last_checkin_date?: string
  created_at: string
  updated_at: string
}

interface AuthContextType {
  user: User | null
  isConnected: boolean
  isLoading: boolean
  connectWallet: () => Promise<void>
  disconnectWallet: () => void
  updateUsername: (name: string) => Promise<boolean>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const connectWallet = async () => {
    try {
      if (typeof window.ethereum !== "undefined") {
        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        })
        if (accounts.length > 0) {
          const walletAddress = accounts[0]
          setIsConnected(true)
          // Check if user exists in Supabase
          let { data: user, error } = await supabase
            .from("users")
            .select("*, user_stats(*)")
            .eq("wallet_address", walletAddress.toLowerCase())
            .single()
          if (!user) {
            // Create new user
            const { data: newUser, error: createError } = await supabase
              .from("users")
              .insert({ wallet_address: walletAddress.toLowerCase() })
              .select("*, user_stats(*)")
              .single()
            if (createError) throw createError
            user = newUser
          }
          setUser(user)
        }
      } else {
        alert("Please install MetaMask!")
      }
    } catch (error) {
      console.error("Error connecting wallet:", error)
      throw error
    }
  }

  const connectTwitter = async () => {
    try {
      // Generate state parameter for OAuth
      const state = Math.random().toString(36).substring(7)
      localStorage.setItem("twitter_oauth_state", state)

      // Open Twitter OAuth popup
      const width = 600
      const height = 600
      const left = window.screenX + (window.outerWidth - width) / 2
      const top = window.screenY + (window.outerHeight - height) / 2

      const popup = window.open(
        `/auth/twitter?state=${state}`,
        "twitter-auth",
        `width=${width},height=${height},left=${left},top=${top}`
      )

      if (!popup) {
        throw new Error("Popup blocked. Please allow popups for this site.")
      }

      // Listen for OAuth result
      const result = await new Promise((resolve, reject) => {
        const handleMessage = (event: MessageEvent) => {
          if (event.origin !== window.location.origin) return

          if (event.data.type === "TWITTER_AUTH_SUCCESS") {
            window.removeEventListener("message", handleMessage)
            resolve(event.data.user)
          } else if (event.data.type === "TWITTER_AUTH_ERROR") {
            window.removeEventListener("message", handleMessage)
            reject(new Error(event.data.error))
          }
        }

        window.addEventListener("message", handleMessage)

        // Timeout after 5 minutes
        setTimeout(() => {
          window.removeEventListener("message", handleMessage)
          reject(new Error("Authentication timeout"))
        }, 300000)
      })

      // Handle successful Twitter auth
      const twitterUser = result as any
      setIsConnected(true)

      // Check if user exists in database
      const response = await fetch("/api/users/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ twitter_username: twitterUser.username }),
      })

      const data = await response.json()

      setUser({
  ...user,
  username: user.name, // alias for compatibility
})

      if (data.success && data.user) {
        setUser(data.user)
      } else {
        // Create new user with Twitter data
        const createResponse = await fetch("/api/users/profile", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            twitter_username: twitterUser.username,
            twitter_name: twitterUser.name,
            twitter_avatar_url: twitterUser.profile_image_url,
            name: twitterUser.name,
            care_points: 0,
            user_stats: {
              current_streak: 0,
              longest_streak: 0,
              total_checkins: 0,
            },
          }),
        })

        const createData = await createResponse.json()

        if (createData.success && createData.user) {
          setUser(createData.user)
        } else {
          throw new Error(createData.error || "Failed to create user")
        }
      }
    } catch (error) {
      console.error("Error connecting Twitter:", error)
      throw error
    }
  }

  const disconnectWallet = () => {
    setUser(null)
    setIsConnected(false)
  }

  const updateUsername = async (name: string): Promise<boolean> => {
    if (!user) return false
    try {
      const { data: updatedUser, error } = await supabase
        .from("users")
        .update({ name: name.trim(), updated_at: new Date().toISOString() })
        .eq("id", user.id)
        .select("*, user_stats(*)")
        .single()
      if (error) throw error
      setUser(updatedUser)
      return true
    } catch (error) {
      console.error("Error updating username:", error)
      return false
    }
  }

  const refreshUser = async () => {
    if (!user) return
    try {
      const { data: refreshedUser, error } = await supabase
        .from("users")
        .select("*, user_stats(*)")
        .eq("id", user.id)
        .single()
      if (error) throw error
      setUser(refreshedUser)
    } catch (error) {
      console.error("Error refreshing user:", error)
    }
  }

  useEffect(() => {
    const checkConnection = async () => {
      try {
        // Check for wallet connection
        if (typeof window.ethereum !== "undefined") {
          const accounts = await window.ethereum.request({
            method: "eth_accounts",
          })
          if (accounts.length > 0) {
            const walletAddress = accounts[0]
            setIsConnected(true)
            
            // Try to get user with stats first
            let { data: user, error } = await supabase
              .from("users")
              .select("*, user_stats(*)")
              .eq("wallet_address", walletAddress.toLowerCase())
              .single()
            
            // If user doesn't exist, create a new one
            if (error && error.code === 'PGRST116') {
              console.log("User not found, creating new user for wallet:", walletAddress)
              const { data: newUser, error: createError } = await supabase
                .from("users")
                .insert({
                  wallet_address: walletAddress.toLowerCase(),
                  care_points: 0,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                })
                .select("*, user_stats(*)")
                .single()
              
              if (createError) {
                console.error("Error creating user:", createError)
              } else {
                user = newUser
              }
            } else if (error) {
              console.log("Failed to fetch with user_stats, trying without:", error)
              const { data: userWithoutStats, error: error2 } = await supabase
                .from("users")
                .select("*")
                .eq("wallet_address", walletAddress.toLowerCase())
                .single()
              
              if (userWithoutStats) {
                // Add default user_stats structure
                user = {
                  ...userWithoutStats,
                  user_stats: {
                    current_streak: 0,
                    longest_streak: 0,
                    total_checkins: 0,
                    total_points: 0,
                    level: 1
                  }
                }
              } else {
                console.error("Failed to fetch user:", error2)
              }
            }
            
            if (user) {
              setUser(user)
            }
          }
        }
      } catch (error) {
        console.error("Error checking connection:", error)
      } finally {
        setIsLoading(false)
      }
    }
    checkConnection()
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        isConnected,
        isLoading,
        connectWallet,
        disconnectWallet,
        updateUsername,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
