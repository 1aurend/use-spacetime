# use-spacetime

> Animate anything that can be animated with a Framer Motion motion value by progressing through space rather than time

[![NPM](https://img.shields.io/npm/v/use-spacetime.svg)](https://www.npmjs.com/package/use-spacetime) [![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

## Install

```bash
npm i use-spacetime
```

# Spacetime Animation Hooks

Together `useScrub` and `useInterval` allow you to animate anything that can be animated with a Framer Motion motion value by progressing through space rather than time. The primary use case is a site with a large number of animations controlled by scroll, but the hooks are flexible enough to animate just one section of a site or in response to any continuum of user controlled values, such as a draggable slider.

## How to think about `useScrub` and `useInterval`

The mental model for these hooks is the animator's timeline. The global "timeline" for your app or the relevant section is determined by the continuum of values you supply. For fully animated sites, we like to set body to `overflow:'hidden'` and and supply our own scroll progress value by capturing mouse wheel events, but you could use Framer's `useViewportScroll`, etc. Whatever this continuum represents the hooks require that you convert it to a percentage, so a range of 0 to 1, to calculate keyframes correctly.

Continuing with our mental model, the animator sets keyframes along the timeline for a particular property, say scale or rotation, and lets the library tween between them. This is how to think of `useScrub`. You give `useScrub` starting and ending values and a set of keyframes, and it will determine the current value for any point on the "timeline". Framer itself does the tweening between these incremental values as your user scrolls, slides, etc.

Finally, `useInterval` allows you to relativize the keyframes you supply to `useScrub` to a particular section of your timeline. This is particularly helpful for complex animations where a series of events might take place over only 5% or 10% of the global timeline.

There are two ways to use `useInterval` depending on the setup of your project. You can setup a list of scenes or segments and call `useInterval` directly, passing the resulting values to all the components that animate in those scenes. Or you can pass individual intervals to `useScrub`, and `useScrub` will call `useInterval` for you and apply the interval to just that value. This method may be most intuitive in apps where animations don't cluster naturally into segments.

## The API

### `useScrub`

Usage:
```js
  /**
  *@param {object{keyframes, [type], [buffer]}} params  Values that describe the animation.
      *@param {object} keyframes  List of keyframes for the animation. Required.
      *@param {string} type       If the keyframes object contains values for more than one property, the name of the property being animated with this call to `useScrub`. Optional.
      *@param {number} buffer     An offset around 0 and 1 to ensure that 0 and 100 keyframes are always reached. Optional. Default = 0.05.
  * @param {number}                             current   The current
  * @param {number[in, out]}                    interval  The segment to relativize keyframes to.
   state calculated globally.
  */
  const currentValue = useScrub(params, current, [interval])
  ```
  Basic Example:
  ```js
    import { useScrub } from 'use-spacetime'
    import { motion, useViewportScroll } from 'framer-motion'

    const AnimatedComponent = () => {
      //setup your global "timeline", e.g. using Framer's hook
      const { scrollYProgress } = useViewportScroll()
      //animate according to global Y position with separate keyframes objects for each property
      const radiusKfs = {
        0: 10,
        50: 100,
        100: 20
      }
      const radius = useScrub(radiusKfs, scrollYProgress)
      const colorKfs = {
        0: 'rgb(255,0,0)',
        50: 'rgb(0,255,0)',
        100: 'rgb(0,0,255)'
      }
      const color = useScrub(colorKfs, scrollYProgress)

      return <motion.div style={{color:color, borderRadius:radius}}></motion.div>
    }
  ```

  With Shared Keyframes Object:
  ```js
  import { useScrub } from 'use-spacetime'
  import { motion, useViewportScroll } from 'framer-motion'

  const AnimatedComponent = () => {
    //setup your global "timeline", e.g. using Framer's hook
    const { scrollYProgress } = useViewportScroll()
    //animate according to global Y position with single keyframes object for the html element
    const keyframes = {
      0: {
        radius: 10,
        color: 'rgb(255,0,0)'
        },
      25: {
        radius: 30
      },
      50: {
        radius: 100,
        color: 'rgb(0,255,0)'
        },
      75: {
        color: 'rgb(0,0,255)'
      },
      100: {
        radius: 20
      }
    }
    const radiusParams = {keyframes:keyframes, type:'radius'}
    const radius = useScrub(radiusParams, scrollYProgress)
    const colorParams = {keyframes:keyframes, type:'color'}
    const color = useScrub(keyframes, scrollYProgress)

    return <motion.div style={{color:color, borderRadius:radius}}></motion.div>
  }
  ```
  With intervals:
  ```js
  import { useScrub } from 'use-spacetime'
  import { motion, useViewportScroll } from 'framer-motion'

  const AnimatedComponent = () => {
    //setup your global "timeline", e.g. using Framer's hook
    const { scrollYProgress } = useViewportScroll()
    //animate in specific ranges of the global progress with separate keyframes objects for each property
    const radiusKfs = {
      0: 10,
      50: 100,
      100: 20
    }
    //the div grows and shrinks only while `scrollYProgress` is between 0.25 and 0.75
    const radius = useScrub(radiusKfs, scrollYProgress, [0.25, 0.75])
    const colorKfs = {
      0: 'rgb(255,0,0)',
      50: 'rgb(0,255,0)',
      100: 'rgb(0,0,255)'
    }
    //the color changes over a slightly shorter interval
    const color = useScrub(colorKfs, scrollYProgress, [0.3, 0.7])

    return <motion.div style={{color:color, borderRadius:radius}}></motion.div>
  }
  ```

&nbsp;
### `useInterval`

Usage:
```js
  /**
  * @param {number[in, out]} interval  The segment to relativize keyframes to.
  * @param {number}          current   The current state calculated globally.
  */
  const sceneCurrent = useInterval(interval, current)
```
Example:
```js
import { useScrub } from 'use-spacetime'
import { motion, useViewportScroll } from 'framer-motion'

const Controller = () => {
  //setup your global "timeline", e.g. using Framer's hook
  const { scrollYProgress } = useViewportScroll()
  //create a list of segments
  const segmentList = {
    1: [0, .25],
    2: [.1, .50],
    3: [.50, .55],
    4: [.40, .75],
    5: [.75, 1]
  }
  //track the relativized current positions for each segment
  const scene1Current = useInterval(segmentList[1], scrollYProgress)
  const scene2Current = useInterval(segmentList[2], scrollYProgress)
  const scene3Current = useInterval(segmentList[3], scrollYProgress)
  const scene4Current = useInterval(segmentList[4], scrollYProgress)
  const scene5Current = useInterval(segmentList[5], scrollYProgress)

  //pass these values to components that need them. Or call `useInterval` for the appropriate segment in each component.
  return <SquareCircle scene={scene3Current} />
}
```
```js
//SquareCircle.js

const SquareCircle = ({scene}) => {
  const radiusKfs = {
    0: 10,
    50: 100,
    100: 20
  }
  const radius = useScrub(radiusKfs, scene)
  const colorKfs = {
    0: 'rgb(255,0,0)',
    50: 'rgb(0,255,0)',
    100: 'rgb(0,0,255)'
  }
  const color = useScrub(colorKfs, scene)

  return <motion.div style={{color:color, borderRadius:radius}}></motion.div>
}
```

## License

MIT © [1aurend](https://github.com/1aurend)

---

Hooks created with [create-react-hook](https://github.com/hermanya/create-react-hook).
