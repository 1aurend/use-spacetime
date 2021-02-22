import React from 'react'
import useScrub from 'use-spacetime'

const App = () => {
  const keyframes = {
    0: 25,
    50: 50,
    100: 100
  }
  const test = useScrub(keyframes, 0.5)
  return (
    <div>
      {test.current}
    </div>
  )
}
export default App
