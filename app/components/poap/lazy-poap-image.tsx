import React, { useEffect, useRef, useState } from "react";

// Custom hook for lazy loading images - extracted from poap-list-item.tsx
export const useLazyImage = () => {
  const imageRef = useRef<HTMLImageElement>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const lazyImage = entry.target as HTMLImageElement;
            const imageSrc = lazyImage.dataset.src || "";
            
            // Set up image load handlers
            lazyImage.onload = () => setImageLoaded(true);
            lazyImage.onerror = () => setImageError(true);
            
            lazyImage.src = imageSrc;
            observer.unobserve(lazyImage);
          }
        });
      },
      {
        rootMargin: "200px", // Start loading images 200px before they come into view
        threshold: 0.1,
      }
    );

    if (imageRef.current) {
      observer.observe(imageRef.current);
    }

    return () => {
      if (imageRef.current) {
        observer.unobserve(imageRef.current);
      }
    };
  }, []);

  return { imageRef, imageLoaded, imageError };
};

export enum POAP_SIZE {
  SMALL = "small",
  MEDIUM = "medium",
  LARGE = "large",
}

// Unified lazy POAP image component for both classic and timeline modes
interface LazyPoapImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  poapSize?: POAP_SIZE;
  title?: string;
  containerClassName?: string;
  // Skeleton customization
  skeletonClassName?: string;
  // Error state customization
  errorClassName?: string;
  showErrorText?: boolean;
}

export const LazyPoapImage: React.FC<LazyPoapImageProps> = ({
  src,
  alt,
  className = "",
  width = 300,
  height = 300,
  poapSize = POAP_SIZE.MEDIUM,
  title,
  containerClassName = "relative w-full h-full rounded-full overflow-hidden",
  skeletonClassName = "bg-white/20 border border-white/30",
  errorClassName = "bg-default-100 text-default-400",
  showErrorText = true,
}) => {
  const { imageRef, imageLoaded, imageError } = useLazyImage();

  const poapSizeParam = poapSize === POAP_SIZE.SMALL ? "small" : poapSize === POAP_SIZE.LARGE ? "large" : "medium";

  return (
    <div className={containerClassName}>
      {/* Placeholder/Skeleton */}
      {!imageLoaded && !imageError && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/10 backdrop-blur-sm">
          <div className="animate-pulse w-full h-full p-2">
            <div className={`w-full h-full rounded-full ${skeletonClassName}`}></div>
          </div>
        </div>
      )}
      
      {/* Error state */}
      {imageError && (
        <div className={`absolute inset-0 flex items-center justify-center ${errorClassName}`}>
          <div className="text-center">
            <div className="w-8 h-8 mx-auto mb-1 rounded-full bg-default-300"></div>
            {showErrorText && <p className="text-xs">Image unavailable</p>}
          </div>
        </div>
      )}
      
      {/* Actual image */}
      <img
        ref={imageRef}
        alt={alt}
        data-src={src + "?size=" + poapSizeParam}
        className={`w-full h-full object-cover rounded-full transition-opacity duration-300 ${
          imageLoaded ? 'opacity-100' : 'opacity-0'
        } ${className}`}
        width={width}
        height={height}
        title={title}
      />
    </div>
  );
};

// Convenience component for timeline use
export const TimelinePoapImage: React.FC<{
  src: string;
  alt: string;
  width?: number;
  height?: number;
  title?: string;
  poapSize?: POAP_SIZE;
}> = ({ src, alt, width = 128, height = 128, title, poapSize }) => (
  <LazyPoapImage
    src={src}
    alt={alt}
    width={width}
    height={height}
    title={title}
    poapSize={poapSize}
    containerClassName="relative w-full h-full rounded-full overflow-hidden"
  />
);
