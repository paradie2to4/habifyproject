import React, { useEffect, useState } from 'react';
import { PROPERTY_IMAGE_FALLBACK, resolvePropertyImage } from '../utils/images';

interface PropertyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  images?: unknown;
  imageIndex?: number;
  seedKey?: string;
  src?: string;
}

/**
 * Listing photo with Unsplash-friendly referrer policy and graceful fallbacks.
 */
export const PropertyImage: React.FC<PropertyImageProps> = ({
  images,
  imageIndex = 0,
  seedKey = '',
  src,
  alt = 'Property photo',
  className,
  onError,
  ...rest
}) => {
  const preferred = src || resolvePropertyImage(images, imageIndex, seedKey);
  const [current, setCurrent] = useState(preferred);

  useEffect(() => {
    setCurrent(src || resolvePropertyImage(images, imageIndex, seedKey));
  }, [src, images, imageIndex, seedKey]);

  return (
    <img
      {...rest}
      src={current}
      alt={alt}
      className={className}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      onError={e => {
        if (current !== PROPERTY_IMAGE_FALLBACK) {
          setCurrent(PROPERTY_IMAGE_FALLBACK);
        }
        onError?.(e);
      }}
    />
  );
};
