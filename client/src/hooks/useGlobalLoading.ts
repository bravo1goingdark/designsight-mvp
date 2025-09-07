import { useEffect, useState } from 'react'
import { globalLoading } from '../utils/globalLoading'

export function useGlobalLoading() {
  const [count, setCount] = useState(globalLoading.count)

  useEffect(() => {
    const unsub = globalLoading.subscribe(setCount)
    return () => unsub()
  }, [])

  return count > 0
}

