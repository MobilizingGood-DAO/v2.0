import useSWR from "swr"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface FeedItem {
  id: string
  content: string
  author: {
    name: string
    username: string
    avatar: string
  }
  care_points: number
  created_at: string
  type: "gratitude" | "care_objective"
}

interface UseCommunityFeedOptions {
  limit?: number
  offset?: number
}

export function useCommunityFeed(options: UseCommunityFeedOptions = {}) {
  const { limit = 20, offset = 0 } = options

  const params = new URLSearchParams({
    limit: limit.toString(),
    offset: offset.toString(),
  })

  const { data, error, isLoading, mutate } = useSWR(`/api/community/feed?${params}`, fetcher, {
    refreshInterval: 60000, // Refresh every minute
    revalidateOnFocus: true,
  })

  return {
    feed: (data?.feed || []) as FeedItem[],
    isLoading,
    isError: error,
    refresh: mutate,
    hasMore: data?.has_more || false,
  }
}
