import { useState, useEffect } from 'react'

export function useLocalStorage(k, init) {
  const [v, setV] = useState(() => {
    try {
      const s = localStorage.getItem(k)
      if (!s) return init
      const parsed = JSON.parse(s)
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed) && init && typeof init === 'object') {
        return { ...init, ...parsed }
      }
      return parsed
    } catch {
      return init
    }
  })
  useEffect(() => {
    try {
      localStorage.setItem(k, JSON.stringify(v))
    } catch {
      /* ignore quota */
    }
  }, [k, v])
  return [v, setV]
}
