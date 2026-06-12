import React from 'react'
import type { QueryLikeResult } from '../types/teacher'

export function useMockQuery<TData>(data: TData): QueryLikeResult<TData> {
  const [tick, setTick] = React.useState(0)

  return React.useMemo(() => ({
    data,
    isError: false,
    isLoading: false,
    refetch: () => setTick((value) => value + 1),
  }), [data, tick])
}
