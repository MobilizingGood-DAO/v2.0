import useSWR from "swr"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface UserStats {
  total_points: number
  total_checkins: number
  current_streak: number
  longest_streak: number
  level: number
  last_checkin?: string
}

export function useUserStats(userId?: string) {
  const { data, error, isLoading, mutate } = useSWR(userId ? `/api/users/stats?user_id=${userId}` : null, fetcher, {
    refreshInterval: 30000,
    revalidateOnFocus: true,
  })

  return {
    stats: data?.stats as UserStats | null,
    isLoading,
    isError: error,
    refresh: mutate,
  }
}
