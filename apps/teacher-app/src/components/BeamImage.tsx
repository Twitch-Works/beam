import { useState } from 'react'
import { Image, type ImageProps } from 'expo-image'

/**
 * Drop-in replacement for expo-image's <Image>. Whenever the source is missing
 * (null / undefined / empty uri) or fails to load, it renders the Beam brand
 * mark instead of a blank box. Use this everywhere a content image is shown
 * (activity photos, teacher/child avatars, session thumbnails, …).
 */
const PLACEHOLDER = require('../../assets/images/splash-icon-solid.png')

function isMissing(source: ImageProps['source']): boolean {
  if (source == null) return true
  if (typeof source === 'number') return false // bundled require()
  if (typeof source === 'string') return source.trim().length === 0
  if (Array.isArray(source)) return source.length === 0 || source.every(isMissing)
  if (typeof source === 'object') {
    const uri = (source as { uri?: string | null }).uri
    return uri == null || uri.trim().length === 0
  }
  return false
}

function keyOf(source: ImageProps['source']): string {
  try {
    return JSON.stringify(source) ?? ''
  } catch {
    return String(source)
  }
}

export function BeamImage({ source, onError, contentFit, ...rest }: ImageProps) {
  const [erroredKey, setErroredKey] = useState<string | null>(null)
  const key = keyOf(source)
  const usePlaceholder = isMissing(source) || erroredKey === key

  return (
    <Image
      {...rest}
      source={usePlaceholder ? PLACEHOLDER : source}
      contentFit={usePlaceholder ? 'contain' : contentFit}
      onError={(event) => {
        setErroredKey(key)
        onError?.(event)
      }}
    />
  )
}
