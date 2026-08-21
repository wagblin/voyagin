import { describe, expect, it, vi } from 'vitest'
import { cloudinaryThumbnailUrl } from '../cloudinary'

describe('cloudinaryThumbnailUrl', () => {
  it('insère les paramètres de transformation après /upload/ pour une URL avec segment de version', () => {
    const url = 'https://res.cloudinary.com/jlpz91qq/image/upload/v1234567890/voyagin/photo.jpg'

    expect(cloudinaryThumbnailUrl(url, 400)).toBe(
      'https://res.cloudinary.com/jlpz91qq/image/upload/w_400,c_limit,q_auto,f_auto/v1234567890/voyagin/photo.jpg',
    )
  })

  it('insère les paramètres de transformation après /upload/ pour une URL sans segment de version', () => {
    const url = 'https://res.cloudinary.com/jlpz91qq/image/upload/voyagin/photo.jpg'

    expect(cloudinaryThumbnailUrl(url, 320)).toBe(
      'https://res.cloudinary.com/jlpz91qq/image/upload/w_320,c_limit,q_auto,f_auto/voyagin/photo.jpg',
    )
  })

  it("retourne l'URL inchangée sans lever d'exception quand /upload/ est absent", () => {
    const url = 'https://example.com/not-cloudinary/photo.jpg'

    expect(() => cloudinaryThumbnailUrl(url, 300)).not.toThrow()
    expect(cloudinaryThumbnailUrl(url, 300)).toBe(url)
  })

  it('est une fonction pure : ne fait aucun appel réseau et est déterministe', () => {
    const url = 'https://res.cloudinary.com/jlpz91qq/image/upload/v1234567890/voyagin/photo.jpg'
    const fetchSpy = vi.spyOn(globalThis, 'fetch')

    const first = cloudinaryThumbnailUrl(url, 400)
    const second = cloudinaryThumbnailUrl(url, 400)

    expect(first).toBe(second)
    expect(fetchSpy).not.toHaveBeenCalled()

    fetchSpy.mockRestore()
  })
})
