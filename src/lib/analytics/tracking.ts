// Comprehensive analytics and tracking system

export interface AnalyticsEvent {
  event: string;
  category?: string;
  action?: string;
  label?: string;
  value?: number;
  custom_parameters?: Record<string, any>;
}

export interface UserProperties {
  user_id?: string;
  location?: string;
  user_type?: 'customer' | 'shop_owner' | 'admin';
  registration_date?: string;
  last_login?: string;
  total_prints?: number;
  preferred_city?: string;
}

export class AnalyticsTracker {
  private static instance: AnalyticsTracker;
  private isInitialized = false;
  private userId: string | null = null;
  private userProperties: UserProperties = {};

  static getInstance(): AnalyticsTracker {
    if (!AnalyticsTracker.instance) {
      AnalyticsTracker.instance = new AnalyticsTracker();
    }
    return AnalyticsTracker.instance;
  }

  // Initialize all analytics services
  initialize(): void {
    if (typeof window === 'undefined' || this.isInitialized) return;

    this.initializeGoogleAnalytics();
    this.initializeVercelAnalytics();
    this.initializeMicrosoftClarity();
    this.initializeSearchConsole();
    this.initializeCustomEvents();
    
    this.isInitialized = true;
    console.log('Analytics initialized successfully');
  }

  // Google Analytics 4
  private initializeGoogleAnalytics(): void {
    // GA4 is already initialized in layout.tsx, but we can add enhanced tracking
    if (typeof gtag !== 'undefined') {
      // Set default parameters
      gtag('config', 'G-XXXXXXXXXX', {
        send_page_view: false, // We'll handle page views manually
        custom_map: { 'custom_parameter_1': 'user_type' },
      });

      // Enhanced ecommerce tracking
      gtag('config', 'G-XXXXXXXXXX', {
        enhanced_conversions: true,
        allow_google_signals: true,
      });
    }
  }

  // Vercel Analytics
  private initializeVercelAnalytics(): void {
    // Vercel Analytics is already initialized in layout.tsx
    // Add custom event tracking
    if (typeof window !== 'undefined' && 'va' in window) {
      const va = (window as any).va;
      
      // Track page views with custom dimensions
      va('track', 'page_view', {
        custom: {
          path: window.location.pathname,
          referrer: document.referrer,
          user_agent: navigator.userAgent,
        },
      });
    }
  }

  // Microsoft Clarity
  private initializeMicrosoftClarity(): void {
    if (typeof window !== 'undefined') {
      // Initialize Clarity if not already done
      if (!window.clarity) {
        const clarityScript = document.createElement('script');
        clarityScript.innerHTML = `
          (function(c,l,a,r,i,t,y){
            c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
            t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
            y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
          })(window, document, "clarity", "script", "your_clarity_project_id");
        `;
        document.head.appendChild(clarityScript);
      }
    }
  }

  // Search Console verification and tracking
  private initializeSearchConsole(): void {
    // Add Search Console verification meta tag if not present
    if (typeof document !== 'undefined') {
      const verificationTag = document.querySelector('meta[name="google-site-verification"]');
      if (!verificationTag) {
        const meta = document.createElement('meta');
        meta.name = 'google-site-verification';
        meta.content = 'zAZIwBcueJ0zXcjzyVS-DexvshYM0ImpIiSwVEodrsY';
        document.head.appendChild(meta);
      }
    }
  }

  // Custom event tracking setup
  private initializeCustomEvents(): void {
    // Track user interactions
    this.trackUserInteractions();
    this.trackScrollEvents();
    this.trackFormSubmissions();
    this.trackFileUploads();
    this.trackSearchQueries();
  }

  // Track user interactions
  private trackUserInteractions(): void {
    if (typeof document === 'undefined') return;

    // Track button clicks
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      const button = target.closest('button');
      const link = target.closest('a');
      
      if (button) {
        this.trackEvent('button_click', {
          category: 'User Interaction',
          action: 'Button Click',
          label: button.textContent?.trim() || 'Unknown Button',
          custom_parameters: {
            button_type: button.type || 'button',
            button_class: button.className,
          },
        });
      }
      
      if (link) {
        this.trackEvent('link_click', {
          category: 'Navigation',
          action: 'Link Click',
          label: link.textContent?.trim() || link.href,
          custom_parameters: {
            link_url: link.href,
            link_target: link.target || '_self',
          },
        });
      }
    });
  }

  // Track scroll events
  private trackScrollEvents(): void {
    if (typeof window === 'undefined') return;

    let maxScroll = 0;
    const scrollThresholds = [25, 50, 75, 90];
    const trackedThresholds = new Set();

    window.addEventListener('scroll', () => {
      const scrollPercentage = Math.round(
        (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
      );
      
      maxScroll = Math.max(maxScroll, scrollPercentage);

      scrollThresholds.forEach(threshold => {
        if (scrollPercentage >= threshold && !trackedThresholds.has(threshold)) {
          trackedThresholds.add(threshold);
          this.trackEvent('scroll_depth', {
            category: 'Engagement',
            action: 'Scroll Depth',
            label: `${threshold}%`,
            value: threshold,
          });
        }
      });
    });

    // Track max scroll on page unload
    window.addEventListener('beforeunload', () => {
      this.trackEvent('max_scroll', {
        category: 'Engagement',
        action: 'Max Scroll Depth',
        label: `${maxScroll}%`,
        value: maxScroll,
      });
    });
  }

  // Track form submissions
  private trackFormSubmissions(): void {
    if (typeof document === 'undefined') return;

    document.addEventListener('submit', (event) => {
      const form = event.target as HTMLFormElement;
      const formId = form.id || 'unknown_form';
      const formName = form.getAttribute('data-name') || 'Unknown Form';

      this.trackEvent('form_submit', {
        category: 'Conversion',
        action: 'Form Submit',
        label: formName,
        custom_parameters: {
          form_id: formId,
          form_fields: form.elements.length,
        },
      });
    });
  }

  // Track file uploads
  private trackFileUploads(): void {
    if (typeof document === 'undefined') return;

    document.addEventListener('change', (event) => {
      const target = event.target as HTMLInputElement;
      if (target.type === 'file' && target.files) {
        const fileCount = target.files.length;
        const totalSize = Array.from(target.files).reduce((sum, file) => sum + file.size, 0);

        this.trackEvent('file_upload', {
          category: 'File Operations',
          action: 'File Upload',
          label: `${fileCount} files`,
          value: fileCount,
          custom_parameters: {
            total_size: totalSize,
            file_types: Array.from(target.files).map(f => f.type),
          },
        });
      }
    });
  }

  // Track search queries
  private trackSearchQueries(): void {
    if (typeof document === 'undefined') return;

    document.addEventListener('submit', (event) => {
      const form = event.target as HTMLFormElement;
      const searchInput = form.querySelector('input[type="search"], input[name="q"], input[name="query"]');
      
      if (searchInput) {
        const query = (searchInput as HTMLInputElement).value;
        if (query.trim()) {
          this.trackEvent('search_query', {
            category: 'Search',
            action: 'Search Query',
            label: query,
            custom_parameters: {
              query_length: query.length,
              search_type: 'site_search',
            },
          });
        }
      }
    });
  }

  // Track custom events
  trackEvent(eventName: string, parameters?: AnalyticsEvent): void {
    if (!this.isInitialized) return;

    // Send to Google Analytics
    if (typeof gtag !== 'undefined') {
      gtag('event', eventName, {
        event_category: parameters?.category,
        event_action: parameters?.action,
        event_label: parameters?.label,
        value: parameters?.value,
        custom_map: parameters?.custom_parameters,
      });
    }

    // Send to Vercel Analytics
    if (typeof window !== 'undefined' && 'va' in window) {
      (window as any).va('track', eventName, {
        category: parameters?.category,
        action: parameters?.action,
        label: parameters?.label,
        value: parameters?.value,
        ...parameters?.custom_parameters,
      });
    }

    // Send to Clarity
    if (typeof window !== 'undefined' && window.clarity) {
      window.clarity('event', eventName, parameters);
    }

    // Log for debugging
    console.log('Analytics Event:', eventName, parameters);
  }

  // Track page views
  trackPageView(path: string, title?: string): void {
    if (!this.isInitialized) return;

    // Send to Google Analytics
    if (typeof gtag !== 'undefined') {
      gtag('config', 'G-XXXXXXXXXX', {
        page_path: path,
        page_title: title || document.title,
      });
    }

    // Send to Vercel Analytics
    if (typeof window !== 'undefined' && 'va' in window) {
      (window as any).va('track', 'page_view', {
        path,
        title: title || document.title,
      });
    }

    // Send to Clarity
    if (typeof window !== 'undefined' && window.clarity) {
      window.clarity('set', 'page', path);
    }
  }

  // Set user properties
  setUserProperties(properties: UserProperties): void {
    this.userProperties = { ...this.userProperties, ...properties };

    // Send to Google Analytics
    if (typeof gtag !== 'undefined') {
      gtag('config', 'G-XXXXXXXXXX', {
        user_id: properties.user_id,
        custom_map: properties,
      });
    }

    // Send to Clarity
    if (typeof window !== 'undefined' && window.clarity) {
      if (properties.user_id) {
        window.clarity('identify', properties.user_id);
      }
      Object.entries(properties).forEach(([key, value]) => {
        window.clarity('set', key, value);
      });
    }
  }

  // Track conversion events
  trackConversion(conversionType: string, value?: number, currency?: string): void {
    this.trackEvent('conversion', {
      category: 'Conversion',
      action: conversionType,
      label: conversionType,
      value: value,
      custom_parameters: {
        currency: currency || 'INR',
        timestamp: new Date().toISOString(),
      },
    });

    // Send to Google Ads if available
    if (typeof gtag !== 'undefined') {
      gtag('event', 'conversion', {
        send_to: 'AW-XXXXXXXXXX/XXXXXXXXXXX',
        value: value,
        currency: currency || 'INR',
        transaction_id: `txn_${Date.now()}`,
      });
    }
  }

  // Track performance metrics
  trackPerformanceMetrics(metrics: {
    lcp?: number;
    fid?: number;
    cls?: number;
    fcp?: number;
    ttfb?: number;
  }): void {
    this.trackEvent('performance_metrics', {
      category: 'Performance',
      action: 'Core Web Vitals',
      label: 'Performance Metrics',
      custom_parameters: metrics,
    });
  }

  // Track SEO-specific events
  trackSEOEvent(action: string, label: string, value?: number): void {
    this.trackEvent('seo_event', {
      category: 'SEO',
      action,
      label,
      value,
      custom_parameters: {
        timestamp: new Date().toISOString(),
        user_agent: navigator.userAgent,
        referrer: document.referrer,
      },
    });
  }

  // Get current user properties
  getUserProperties(): UserProperties {
    return { ...this.userProperties };
  }

  // Reset user data
  reset(): void {
    this.userId = null;
    this.userProperties = {};
    
    if (typeof gtag !== 'undefined') {
      gtag('config', 'G-XXXXXXXXXX', {
        user_id: undefined,
      });
    }
  }
}

// Export singleton instance
export const analytics = AnalyticsTracker.getInstance();

// Custom hooks for React components
export function useAnalytics() {
  return {
    trackEvent: analytics.trackEvent.bind(analytics),
    trackPageView: analytics.trackPageView.bind(analytics),
    trackConversion: analytics.trackConversion.bind(analytics),
    setUserProperties: analytics.setUserProperties.bind(analytics),
    trackSEOEvent: analytics.trackSEOEvent.bind(analytics),
  };
}

// Initialize analytics on client side
export function initializeAnalytics(): void {
  analytics.initialize();
}
