// Core Web Vitals optimization utilities

export interface WebVitalsMetrics {
  lcp: number; // Largest Contentful Paint
  fid: number; // First Input Delay
  cls: number; // Cumulative Layout Shift
  fcp: number; // First Contentful Paint
  ttfb: number; // Time to First Byte
  inp: number; // Interaction to Next Paint
}

export class CoreWebVitalsOptimizer {
  private static instance: CoreWebVitalsOptimizer;
  private metrics: Partial<WebVitalsMetrics> = {};
  private observers: Map<string, PerformanceObserver> = new Map();

  static getInstance(): CoreWebVitalsOptimizer {
    if (!CoreWebVitalsOptimizer.instance) {
      CoreWebVitalsOptimizer.instance = new CoreWebVitalsOptimizer();
    }
    return CoreWebVitalsOptimizer.instance;
  }

  // Initialize all performance observers
  initialize(): void {
    if (typeof window === 'undefined') return;

    this.observeLCP();
    this.observeFID();
    this.observeCLS();
    this.observeFCP();
    this.observeTTFB();
    this.observeINP();
  }

  // Observe Largest Contentful Paint
  private observeLCP(): void {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.metrics.lcp = lastEntry.startTime;
        this.reportMetric('LCP', lastEntry.startTime);
      });
      observer.observe({ entryTypes: ['largest-contentful-paint'] });
      this.observers.set('lcp', observer);
    } catch (error) {
      console.warn('LCP observation not supported:', error);
    }
  }

  // Observe First Input Delay
  private observeFID(): void {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (entry.processingStart) {
            const fid = entry.processingStart - entry.startTime;
            this.metrics.fid = fid;
            this.reportMetric('FID', fid);
          }
        });
      });
      observer.observe({ entryTypes: ['first-input'] });
      this.observers.set('fid', observer);
    } catch (error) {
      console.warn('FID observation not supported:', error);
    }
  }

  // Observe Cumulative Layout Shift
  private observeCLS(): void {
    try {
      let clsValue = 0;
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
            this.metrics.cls = clsValue;
          }
        });
        this.reportMetric('CLS', clsValue);
      });
      observer.observe({ entryTypes: ['layout-shift'] });
      this.observers.set('cls', observer);
    } catch (error) {
      console.warn('CLS observation not supported:', error);
    }
  }

  // Observe First Contentful Paint
  private observeFCP(): void {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const fcpEntry = entries.find((entry) => entry.name === 'first-contentful-paint');
        if (fcpEntry) {
          this.metrics.fcp = fcpEntry.startTime;
          this.reportMetric('FCP', fcpEntry.startTime);
        }
      });
      observer.observe({ entryTypes: ['paint'] });
      this.observers.set('fcp', observer);
    } catch (error) {
      console.warn('FCP observation not supported:', error);
    }
  }

  // Observe Time to First Byte
  private observeTTFB(): void {
    if (typeof performance !== 'undefined' && performance.getEntriesByType) {
      const navigationEntries = performance.getEntriesByType('navigation');
      if (navigationEntries.length > 0) {
        const navEntry = navigationEntries[0] as PerformanceNavigationTiming;
        const ttfb = navEntry.responseStart - navEntry.requestStart;
        this.metrics.ttfb = ttfb;
        this.reportMetric('TTFB', ttfb);
      }
    }
  }

  // Observe Interaction to Next Paint
  private observeINP(): void {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (entry.interactionId) {
            const inp = entry.duration;
            if (!this.metrics.inp || inp > this.metrics.inp) {
              this.metrics.inp = inp;
              this.reportMetric('INP', inp);
            }
          }
        });
      });
      observer.observe({ entryTypes: ['event'] });
      this.observers.set('inp', observer);
    } catch (error) {
      console.warn('INP observation not supported:', error);
    }
  }

  // Report metrics to analytics
  private reportMetric(name: string, value: number): void {
    // Send to Google Analytics
    if (typeof gtag !== 'undefined') {
      gtag('event', 'web_vitals', {
        metric_name: name,
        metric_value: Math.round(value),
        metric_rating: this.getRating(name, value),
      });
    }

    // Send to Vercel Analytics
    if (typeof window !== 'undefined' && 'va' in window) {
      (window as any).va('track', 'Web Vitals', {
        name,
        value: Math.round(value),
        rating: this.getRating(name, value),
      });
    }
  }

  // Get performance rating based on thresholds
  private getRating(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
    const thresholds: Record<string, [number, number]> = {
      LCP: [2500, 4000],
      FID: [100, 300],
      CLS: [0.1, 0.25],
      FCP: [1800, 3000],
      TTFB: [800, 1800],
      INP: [200, 500],
    };

    const [good, poor] = thresholds[name] || [0, 0];
    if (value <= good) return 'good';
    if (value <= poor) return 'needs-improvement';
    return 'poor';
  }

  // Get current metrics
  getMetrics(): Partial<WebVitalsMetrics> {
    return { ...this.metrics };
  }

  // Disconnect all observers
  disconnect(): void {
    this.observers.forEach((observer) => observer.disconnect());
    this.observers.clear();
  }
}

// Performance optimization utilities
export const performanceOptimization = {
  // Preload critical resources
  preloadCriticalResources: (resources: string[]) => {
    if (typeof document === 'undefined') return;

    resources.forEach(resource => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = resource;
      
      // Determine resource type
      if (resource.endsWith('.css')) {
        link.as = 'style';
      } else if (resource.endsWith('.js')) {
        link.as = 'script';
      } else if (resource.match(/\.(png|jpg|jpeg|webp|avif)$/)) {
        link.as = 'image';
      } else if (resource.endsWith('.woff2')) {
        link.as = 'font';
        link.crossOrigin = 'anonymous';
      }
      
      document.head.appendChild(link);
    });
  },

  // Optimize images for performance
  optimizeImages: () => {
    if (typeof document === 'undefined') return;

    const images = document.querySelectorAll('img');
    images.forEach(img => {
      if (!img.loading) {
        img.loading = 'lazy';
      }
      
      // Add error handling
      img.addEventListener('error', () => {
        img.style.display = 'none';
        const fallback = document.createElement('div');
        fallback.className = 'image-fallback';
        fallback.textContent = 'Image not available';
        img.parentNode?.insertBefore(fallback, img);
      });
    });
  },

  // Minimize layout shifts
  preventLayoutShifts: () => {
    if (typeof document === 'undefined') return;

    // Add dimensions to images without explicit dimensions
    const images = document.querySelectorAll('img:not([width]):not([height])');
    images.forEach(img => {
      if (img.naturalWidth && img.naturalHeight) {
        img.width = img.naturalWidth;
        img.height = img.naturalHeight;
      }
    });

    // Reserve space for dynamic content
    const dynamicElements = document.querySelectorAll('[data-reserve-space]');
    dynamicElements.forEach(element => {
      const width = element.getAttribute('data-reserve-width');
      const height = element.getAttribute('data-reserve-height');
      if (width) element.style.width = width;
      if (height) element.style.height = height;
    });
  },

  // Optimize third-party scripts
  optimizeThirdPartyScripts: () => {
    if (typeof document === 'undefined') return;

    const scripts = document.querySelectorAll('script[src]');
    scripts.forEach(script => {
      // Add async or defer to non-critical scripts
      if (!script.async && !script.defer && !script.hasAttribute('data-critical')) {
        script.async = true;
      }
    });
  },
};

// Initialize performance monitoring
export function initializePerformanceMonitoring(): void {
  const optimizer = CoreWebVitalsOptimizer.getInstance();
  optimizer.initialize();

  // Run optimizations after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      performanceOptimization.optimizeImages();
      performanceOptimization.preventLayoutShifts();
      performanceOptimization.optimizeThirdPartyScripts();
    });
  } else {
    performanceOptimization.optimizeImages();
    performanceOptimization.preventLayoutShifts();
    performanceOptimization.optimizeThirdPartyScripts();
  }
}
