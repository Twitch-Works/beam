import React from 'react'

export function usePullToRefresh(onRefresh: () => Promise<unknown>) {
  const [refreshing, setRefreshing] = React.useState(false)

  const handleRefresh = React.useCallback(async () => {
    setRefreshing(true)
    try {
      await onRefresh()
    } finally {
      setRefreshing(false)
    }
  }, [onRefresh])

  return { refreshing, onRefresh: handleRefresh }
}
