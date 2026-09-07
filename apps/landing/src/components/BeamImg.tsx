import { type ImgHTMLAttributes, useState } from "react";
import placeholder from "../assets/splash-icon-solid.png";

/**
 * Drop-in replacement for <img>. Whenever `src` is missing or the image fails
 * to load, it renders the Beam brand mark instead of a broken-image icon.
 */
type Props = Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> & {
  src?: string | null;
};

export function BeamImg({ src, alt = "", onError, ...rest }: Props) {
  const [erroredSrc, setErroredSrc] = useState<string | null>(null);
  const usePlaceholder = !src || erroredSrc === src;

  return (
    <img
      {...rest}
      src={usePlaceholder ? placeholder : src}
      alt={alt}
      onError={(event) => {
        setErroredSrc(src ?? null);
        onError?.(event);
      }}
    />
  );
}
