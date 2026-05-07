// Analytics Tracking - Simplified stub to fix build
// TODO: Re-implement with proper TypeScript types

export interface AnalyticsEvent {
  event?: string;
  category: string;
  action: string;
  label: string;
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

  static getInstance(): AnalyticsTracker {
    if (!AnalyticsTracker.instance) {
      AnalyticsTracker.instance = new AnalyticsTracker();
    }
    return AnalyticsTracker.instance;
  }

  initialize(userId?: string): void {
    this.isInitialized = true;
    console.log('Analytics initialized (stub)');
  }

  trackEvent(event: AnalyticsEvent): void {
    // Stub implementation
    console.log('Track event:', event);
  }

  // Stub methods for all tracking functions
  trackButtonClick(buttonText: string, buttonClass: string): void {
    console.log('Button click tracked:', buttonText);
  }

  trackPageView(pageTitle: string, pageUrl: string): void {
    console.log('Page view tracked:', pageTitle);
  }

  trackPrintRequest(fileType: string, fileSize: number): void {
    console.log('Print request tracked:', fileType);
  }

  trackShopRegistration(city: string): void {
    console.log('Shop registration tracked:', city);
  }

  trackFormSubmit(formId: string, fieldCount: number): void {
    console.log('Form submit tracked:', formId);
  }

  trackFileUpload(fileCount: number, totalSize: number, fileTypes: string[]): void {
    console.log('File upload tracked:', fileCount);
  }

  trackSearch(query: string, resultCount: number, searchType: string): void {
    console.log('Search tracked:', query);
  }

  setUserProperty(property: string, value: string): void {
    console.log('User property set:', property, value);
  }
}

export const analytics = AnalyticsTracker.getInstance();
