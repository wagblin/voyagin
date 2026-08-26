import { describe, expect, it, vi } from 'vitest'
import { isAndroid } from '../platform'

describe('isAndroid', () => {
  it('returns true when the user agent reports Android', () => {
    vi.stubGlobal('navigator', {
      userAgent:
        'Mozilla/5.0 (Linux; Android 14; Pixel 10a) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Mobile Safari/537.36',
    })

    expect(isAndroid()).toBe(true)
  })

  it('returns false when the user agent does not report Android', () => {
    vi.stubGlobal('navigator', {
      userAgent:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
    })

    expect(isAndroid()).toBe(false)
  })
})
