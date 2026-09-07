'use client'

import { type ImgHTMLAttributes, useState } from 'react'

/**
 * Drop-in replacement for <img>. Whenever `src` is missing or the image fails
 * to load, it renders the Beam brand mark instead of a broken-image icon.
 * Use this everywhere a content image is shown.
 */
const PLACEHOLDER = '/beam-placeholder.png'

type Props = Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> & { src?: string | null }

export function BeamImage({ src, alt = '', onError, ...rest }: Props) {
  // When `src` changes this comparison resets on its own — no effect needed.
  const [erroredSrc, setErroredSrc] = useState<string | null>(null)
  const usePlaceholder = !src || erroredSrc === src

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      {...rest}
      src={usePlaceholder ? PLACEHOLDER : src}
      alt={alt}
      onError={(event) => {
        setErroredSrc(src ?? null)
        onError?.(event)
      }}
    />
  )
}
