import Image, { ImageProps } from 'next/image';
import { useState } from 'react';

// Optimized Image component with lazy loading and blur placeholder
export function OptimizedImage({ 
  src, 
  alt, 
  width, 
  height, 
  priority = false,
  className = '',
  ...props 
}: ImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  return (
    <div className={`relative ${className}`}>
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        priority={priority}
        loading={priority ? 'eager' : 'lazy'}
        placeholder="blur"
        blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/8A8A"
        className={`
          transition-all duration-300 ease-in-out
          ${isLoading ? 'scale-110 blur-2xl grayscale' : 'scale-100 blur-0 grayscale-0'}
          ${error ? 'opacity-0' : 'opacity-100'}
        `}
        onLoadingComplete={() => setIsLoading(false)}
        onError={() => setError(true)}
        {...props}
      />
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-400">
          <span className="text-sm">Image not available</span>
        </div>
      )}
    </div>
  );
}

// WebP image generation helper
export function generateImageUrls(originalUrl: string) {
  const baseUrl = originalUrl.split('.')[0];
  return {
    webp: `${baseUrl}.webp`,
    avif: `${baseUrl}.avif`,
    original: originalUrl,
  };
}

// Critical image preloading
export function preloadCriticalImages(imageUrls: string[]) {
  if (typeof window !== 'undefined') {
    imageUrls.forEach(url => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = url;
      document.head.appendChild(link);
    });
  }
}

// Image optimization utilities
export const imageOptimization = {
  // Get responsive image sizes
  getResponsiveSizes: (baseWidth: number, baseHeight: number) => {
    const aspectRatio = baseWidth / baseHeight;
    return {
      sm: { width: Math.min(baseWidth * 0.5, 640), height: Math.min(baseHeight * 0.5, 640 / aspectRatio) },
      md: { width: Math.min(baseWidth * 0.75, 768), height: Math.min(baseHeight * 0.75, 768 / aspectRatio) },
      lg: { width: Math.min(baseWidth, 1024), height: Math.min(baseHeight, 1024 / aspectRatio) },
      xl: { width: Math.min(baseWidth * 1.25, 1280), height: Math.min(baseHeight * 1.25, 1280 / aspectRatio) },
    };
  },

  // Generate srcset for responsive images
  generateSrcSet: (baseUrl: string, widths: number[]) => {
    return widths
      .map(width => `${baseUrl}?w=${width} ${width}w`)
      .join(', ');
  },

  // Calculate optimal image quality based on device
  getOptimalQuality: () => {
    if (typeof window === 'undefined') return 80;
    
    const connection = (navigator as any).connection;
    if (connection) {
      if (connection.saveData || connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
        return 60;
      }
      if (connection.effectiveType === '3g') {
        return 75;
      }
    }
    
    return 85;
  },
};
