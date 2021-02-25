import { useMotionValue } from 'framer-motion'
import { useLayoutEffect } from 'react'

const filter = (keyframes, type) => {
  return Object.keys(keyframes)
    .filter(key => keyframes[key][type] !== undefined)
    .reduce((acc, key) => Object.assign(acc, { [key]: keyframes[key][type] }), {})
}

const kfToSeg = (i, keyframes) => {
  const start = Object.keys(keyframes)[i - 1] / 100
  const end = Object.keys(keyframes)[i] / 100
  const from = keyframes[Object.keys(keyframes)[i - 1]]
  const fromNum = typeof from === 'string' ? from.indexOf('rgb') >= 0 ? from : from.match(/[+-]?(\d*\.?\d+)/g).map(Number)[0] : from
  const to = keyframes[Object.keys(keyframes)[i]]
  const toNum = typeof to === 'string' ? to.indexOf('rgb') >= 0 ? to : to.match(/[+-]?(\d*\.?\d+)/g).map(Number)[0] : to
  const unit = typeof from === 'string' ? from.indexOf('rgb') >= 0 ? 'rgb' : from.replace(/[^a-zA-Z%]/g, '') : ''
  return {
    start: start,
    end: end,
    from: fromNum,
    to: toNum,
    unit: unit
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
  const current = localCurrent ?? globalCurrent
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
    ? kfToSeg(currentIndex, validKfs)
    : currentIndex === 0
      ? kfToSeg(1, validKfs)
      : kfToSeg(Object.keys(validKfs).length - 1, validKfs)

  const init = validKfs[Object.keys(validKfs)[0]]
  const val = useMotionValue(init)

  useLayoutEffect(() => {
    const getScrubPercent = (current, start, end) => {
      const delta = end - start
      const currentPercent = (current - start) / delta
      return currentPercent
    }
    const getCurrentVal = (percent, from, to, unit) => {
      if (unit === 'rgb') {
        const fromArr = from
          .match(/[+-]?(\d*\.?\d+)/g)
          .map(val => Number(val))
        const toArr = to
          .match(/[+-]?(\d*\.?\d+)/g)
          .map(val => Number(val))
        const vals = fromArr.map((val, i) => {
          const delta = toArr[i] - fromArr[i]
          return delta >= 0 ? (val + (delta * percent)).toFixed(4) : (val - Math.abs(delta * percent)).toFixed(4)
        })
        return `rgba(${vals[0]},${vals[1]},${vals[2]},${vals[3] || 1.0})`
      }
      const delta = to - from
      const val = delta >= 0 ? (from + (delta * percent)).toFixed(4) : (from - Math.abs(delta * percent)).toFixed(4)
      return `${val}${unit}`
    }

    const setScrubMotionValue = () => {
      if (current < currentSegment.start) {
        if (currentSegment.start - current > buffer) {
          return
        }
        val.set(`${currentSegment.from}${currentSegment.unit}`)
        return
      }
      if (current > currentSegment.end) {
        if (current - currentSegment.end > buffer) {
          return
        }
        val.set(`${currentSegment.to}${currentSegment.unit}`)
        return
      }
      const currentScrubPercent = getScrubPercent(current, currentSegment.start, currentSegment.end)
      val.set(getCurrentVal(currentScrubPercent, currentSegment.from, currentSegment.to, currentSegment.unit))
    }
    setScrubMotionValue()
  }, [buffer, current, val, currentSegment])

  return val
}
