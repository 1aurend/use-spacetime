import { useState, useEffect } from 'react'

export default function useInterval(interval, current) {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (!interval) {
      return setProgress(null)
    }

    const getLocalScrubPercent = (globalState, localStart, localEnd) => {
      const delta = localEnd - localStart
      const localState = (globalState - localStart) / delta
      return localState
    }

    const [start, end] = interval
    if (current < start) {
      return setProgress(0)
    }
    if (current > end) {
      return setProgress(1)
    }
    return setProgress(getLocalScrubPercent(current, start, end))
  }, [interval, current])

  return progress
}
