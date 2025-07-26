import useSWR from "swr"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface LeaderboardUser {
  rank: number
  id: string
  name: string
  handle: string
  avatar: string
  points: number
  streak: number
  level: number
  total_checkins: number
  longest_streak: number
}

interface UseLeaderboardOptions {
  period?: string
  category?: string
  limit?: number
}

export function useLeaderboard(options: UseLeaderboardOptions = {}) {
  const { period = "all-time", category = "overall", limit = 50 } = options

  const params = new URLSearchParams({
    period,
    category,
    limit: limit.toString(),
  })

  const { data, error, isLoading, mutate } = useSWR(`/api/community/leaderboard?${params}`, fetcher, {
    refreshInterval: 30000, // Refresh every 30 seconds
    revalidateOnFocus: true,
  })

  // Map API response to expected format
  const mappedLeaderboard = (data?.leaderboard || []).map((entry: any) => ({
    rank: entry.rank,
    id: entry.id,
    name: entry.name,
    handle: entry.wallet_address ? `${entry.wallet_address.slice(0, 6)}...${entry.wallet_address.slice(-4)}` : `@user${entry.id.slice(0, 8)}`,
    avatar: "/placeholder.svg?height=40&width=40",
    points: entry.care_points || 0,
    streak: entry.current_streak || 0,
    level: 1,
    total_checkins: entry.total_checkins || 0,
    longest_streak: entry.longest_streak || 0,
  }))

  return {
    leaderboard: mappedLeaderboard as LeaderboardUser[],
    isLoading,
    isError: error,
    refresh: mutate,
    totalUsers: data?.total_users || 0,
  }
}
