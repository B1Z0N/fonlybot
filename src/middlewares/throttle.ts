import { telegrafThrottler } from 'telegraf-throttler'
import Bottleneck from 'bottleneck'

export function throttle() {
  return telegrafThrottler({
    in: {
      maxConcurrent: 5,
    },
    out: {
      maxConcurrent: 5,
    },
    group: {
      maxConcurrent: 5,
    },
  })
}
