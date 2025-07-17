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

  return {
    leaderboard: (data?.leaderboard || []) as LeaderboardUser[],
    isLoading,
    isError: error,
    refresh: mutate,
    totalUsers: data?.total_users || 0,
  }
}
