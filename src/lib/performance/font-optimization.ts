// Font optimization utilities for better Core Web Vitals

export const fontOptimization = {
  // Preload critical fonts
  preloadCriticalFonts: () => {
    if (typeof document === 'undefined') return;

    const criticalFonts = [
      {
        href: '/fonts/inter-latin-400-normal.woff2',
        as: 'font',
        type: 'font/woff2',
        crossOrigin: 'anonymous',
      },
      {
        href: '/fonts/inter-latin-700-normal.woff2',
        as: 'font',
        type: 'font/woff2',
        crossOrigin: 'anonymous',
      },
    ];

    criticalFonts.forEach(font => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = font.href;
      link.as = font.as;
      link.type = font.type;
      if (font.crossOrigin) {
        link.crossOrigin = font.crossOrigin;
      }
      document.head.appendChild(link);
    });
  },

  // Font display strategies
  getFontDisplayStrategy: () => {
    return 'swap'; // Shows fallback text immediately, then swaps with custom font
  },

  // Optimize font loading based on connection
  optimizeForConnection: () => {
    if (typeof navigator === 'undefined') return;

    const connection = (navigator as any).connection;
    if (connection) {
      const isSlowConnection = connection.effectiveType === 'slow-2g' || 
                             connection.effectiveType === '2g' || 
                             connection.saveData;

      if (isSlowConnection) {
        // Use system fonts for slow connections
        document.documentElement.style.setProperty('--font-primary', '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif');
        return false;
      }
    }
    return true;
  },

  // Critical font subset loading
  loadCriticalSubset: () => {
    if (typeof document === 'undefined') return;

    // Load only characters needed for above-the-fold content
    const criticalSubset = document.createElement('link');
    criticalSubset.rel = 'preload';
    criticalSubset.href = '/fonts/inter-latin-critical.woff2';
    criticalSubset.as = 'font';
    criticalSubset.type = 'font/woff2';
    criticalSubset.crossOrigin = 'anonymous';
    document.head.appendChild(criticalSubset);
  },
};

// Font loading performance monitoring
export const fontPerformance = {
  // Measure font loading time
  measureFontLoadTime: (fontFamily: string) => {
    if (typeof window === 'undefined') return;

    const startTime = performance.now();
    
    document.fonts.load(`16px ${fontFamily}`).then(() => {
      const endTime = performance.now();
      const loadTime = endTime - startTime;
      
      // Log performance metrics
      console.log(`Font ${fontFamily} loaded in ${loadTime.toFixed(2)}ms`);
      
      // Send to analytics (stub - gtag not available)
      console.log(`Font load time metric: ${fontFamily} - ${Math.round(loadTime)}ms`);
    });
  },

  // Check if fonts are loaded
  areFontsLoaded: () => {
    if (typeof document === 'undefined') return false;

    const testElement = document.createElement('span');
    testElement.style.fontFamily = 'Inter, sans-serif';
    testElement.style.position = 'absolute';
    testElement.style.visibility = 'hidden';
    testElement.textContent = 'test';
    document.body.appendChild(testElement);

    const width = testElement.offsetWidth;
    testElement.style.fontFamily = 'monospace';
    const monospaceWidth = testElement.offsetWidth;

    document.body.removeChild(testElement);

    return width !== monospaceWidth;
  },
};
