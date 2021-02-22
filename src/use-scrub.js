import { useMotionValue } from 'framer-motion'
import { useLayoutEffect } from 'react'

const filter = (keyframes, type) => {
  return Object.keys(keyframes)
    .filter(key => keyframes[key][type] !== undefined)
    .reduce((acc, key) => Object.assign(acc, { [key]: keyframes[key] }), {})
}

const kfToSeg = (i, keyframes, type) => {
  const start = Object.keys(keyframes)[i - 1] / 100
  const end = Object.keys(keyframes)[i] / 100
  const from = type ? keyframes[Object.keys(keyframes)[i - 1]][type] : keyframes[Object.keys(keyframes)[i - 1]]
  const to = type ? keyframes[Object.keys(keyframes)[i]][type] : keyframes[Object.keys(keyframes)[i]]
  return {
    start: start,
    end: end,
    from: from,
    to: to
  }
}

const getLocalCurrent = (current, interval) => {
  const [start, end] = interval
  const getLocalScrubPercent = (globalState, localStart, localEnd) => {
    const delta = localEnd - localStart
    const localState = (globalState - localStart) / delta
    return localState
  }

  if (current < start) {
    return 0
  }
  if (current > end) {
    return 1
  }
  return getLocalScrubPercent(current, start, end)
}

export default function useScrub(params, globalCurrent, interval=null) {
  const localCurrent = interval ? getLocalCurrent(globalCurrent, interval) : null
  const current = localCurrent !== null ? localCurrent : globalCurrent
  const buffer = params.buffer || 0.05
  const type = params.type || null
  const keyframes = params.keyframes || params

  const validKfs = type ? filter(keyframes, type) : keyframes
  const currentIndex = Object.keys(validKfs)
    .indexOf(
      Object.keys(validKfs)
        .filter(kf => current * 100 <= kf)[0]
    )
  const currentSegment = currentIndex > 0
    ? kfToSeg(currentIndex, validKfs, type)
    : currentIndex === 0
      ? kfToSeg(1, validKfs, type)
      : kfToSeg(Object.keys(validKfs).length - 1, validKfs, type)

  const init = type ? validKfs[Object.keys(validKfs)[0]][type] : validKfs[Object.keys(validKfs)[0]]
  const val = useMotionValue(init)

  useLayoutEffect(() => {
    const getScrubPercent = (current, start, end) => {
      const delta = end - start
      const currentPercent = (current - start) / delta
      return currentPercent
    }
    const getCurrentVal = (percent, from, to) => {
      const delta = to - from
      const val = delta >= 0 ? (from + (delta * percent)).toFixed(4) : (from - Math.abs(delta * percent)).toFixed(4)
      return val
    }

    const setScrubMotionValue = () => {
      if (current < currentSegment.start) {
        if (currentSegment.start - current > buffer) {
          return
        }
        val.set(currentSegment.from)
        return
      }
      if (current > currentSegment.end) {
        if (current - currentSegment.end > buffer) {
          return
        }
        val.set(currentSegment.to)
        return
      }
      const currentScrubPercent = getScrubPercent(current, currentSegment.start, currentSegment.end)
      val.set(getCurrentVal(currentScrubPercent, currentSegment.from, currentSegment.to))
    }
    setScrubMotionValue()
  }, [buffer, current, val, currentSegment])

  return val
}
