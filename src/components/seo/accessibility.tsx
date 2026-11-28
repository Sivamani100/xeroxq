'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff, Type, Move, Keyboard, Volume2, VolumeX } from 'lucide-react';

// Comprehensive accessibility and UI/UX optimization components

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const [highContrast, setHighContrast] = useState(false);
  const [largeText, setLargeText] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [screenReaderMode, setScreenReaderMode] = useState(false);
  const [keyboardNavigation, setKeyboardNavigation] = useState(false);

  useEffect(() => {
    // Detect user preferences
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const prefersHighContrast = window.matchMedia('(prefers-contrast: high)').matches;
    const prefersLargeText = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    setReducedMotion(prefersReducedMotion);
    setHighContrast(prefersHighContrast);
    setLargeText(prefersLargeText);

    // Apply accessibility classes
    document.documentElement.classList.toggle('high-contrast', highContrast);
    document.documentElement.classList.toggle('large-text', largeText);
    document.documentElement.classList.toggle('reduced-motion', reducedMotion);
    document.documentElement.classList.toggle('screen-reader', screenReaderMode);

    // Keyboard navigation
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        setKeyboardNavigation(true);
        document.body.classList.add('keyboard-navigation');
      }
    };

    const handleMouseDown = () => {
      setKeyboardNavigation(false);
      document.body.classList.remove('keyboard-navigation');
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleMouseDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, [highContrast, largeText, reducedMotion, screenReaderMode]);

  const toggleHighContrast = () => {
    const newValue = !highContrast;
    setHighContrast(newValue);
    document.documentElement.classList.toggle('high-contrast', newValue);
  };

  const toggleLargeText = () => {
    const newValue = !largeText;
    setLargeText(newValue);
    document.documentElement.classList.toggle('large-text', newValue);
  };

  const toggleReducedMotion = () => {
    const newValue = !reducedMotion;
    setReducedMotion(newValue);
    document.documentElement.classList.toggle('reduced-motion', newValue);
  };

  const toggleScreenReaderMode = () => {
    const newValue = !screenReaderMode;
    setScreenReaderMode(newValue);
    document.documentElement.classList.toggle('screen-reader', newValue);
  };

  return (
    <>
      <AccessibilityControls
        highContrast={highContrast}
        largeText={largeText}
        reducedMotion={reducedMotion}
        screenReaderMode={screenReaderMode}
        onToggleHighContrast={toggleHighContrast}
        onToggleLargeText={toggleLargeText}
        onToggleReducedMotion={toggleReducedMotion}
        onToggleScreenReaderMode={toggleScreenReaderMode}
      />
      {children}
    </>
  );
}

export function AccessibilityControls({
  highContrast,
  largeText,
  reducedMotion,
  screenReaderMode,
  onToggleHighContrast,
  onToggleLargeText,
  onToggleReducedMotion,
  onToggleScreenReaderMode,
}: {
  highContrast: boolean;
  largeText: boolean;
  reducedMotion: boolean;
  screenReaderMode: boolean;
  onToggleHighContrast: () => void;
  onToggleLargeText: () => void;
  onToggleReducedMotion: () => void;
  onToggleScreenReaderMode: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-[#171717] dark:bg-[#EDEDED] text-white dark:text-[#111113] rounded-full p-3 shadow-lg hover:bg-[#FB432C] dark:hover:bg-[#FB432C] dark:hover:text-white transition-colors"
        aria-label="Accessibility options"
      >
        <Keyboard className="w-5 h-5" />
      </Button>

      {isOpen && (
        <div className="absolute bottom-16 right-0 bg-white dark:bg-[#19191B] rounded-lg shadow-xl border border-[#171717]/[0.10] dark:border-white/[0.10] p-4 w-64">
          <h3 className="font-semibold text-[#171717] dark:text-[#EDEDED] mb-4">Accessibility Options</h3>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#525252] dark:text-[#A1A1A6]">High Contrast</span>
              <Button
                variant={highContrast ? "default" : "outline"}
                size="sm"
                onClick={onToggleHighContrast}
                aria-label="Toggle high contrast mode"
              >
                {highContrast ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </Button>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-[#525252] dark:text-[#A1A1A6]">Large Text</span>
              <Button
                variant={largeText ? "default" : "outline"}
                size="sm"
                onClick={onToggleLargeText}
                aria-label="Toggle large text"
              >
                <Type className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-[#525252] dark:text-[#A1A1A6]">Reduced Motion</span>
              <Button
                variant={reducedMotion ? "default" : "outline"}
                size="sm"
                onClick={onToggleReducedMotion}
                aria-label="Toggle reduced motion"
              >
                <Move className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-[#525252] dark:text-[#A1A1A6]">Screen Reader</span>
              <Button
                variant={screenReaderMode ? "default" : "outline"}
                size="sm"
                onClick={onToggleScreenReaderMode}
                aria-label="Toggle screen reader mode"
              >
                {screenReaderMode ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-[#171717]/[0.08] dark:border-white/[0.08]">
            <p className="text-xs text-[#737373] dark:text-[#85858B]">
              Press Tab to navigate, Enter to select
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// Skip to main content link for screen readers
export function SkipToContent() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-[#171717] dark:bg-[#EDEDED] text-white dark:text-[#111113] px-4 py-2 rounded-md z-50"
    >
      Skip to main content
    </a>
  );
}

// Focus management utilities
export function useFocusManagement() {
  const trapFocus = (containerRef: React.RefObject<HTMLElement>) => {
    const container = containerRef.current;
    if (!container) return;

    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement.focus();
            e.preventDefault();
          }
        }
      }
    };

    container.addEventListener('keydown', handleTabKey);
    firstElement?.focus();

    return () => {
      container.removeEventListener('keydown', handleTabKey);
    };
  };

  return { trapFocus };
}

// ARIA live region for announcements
export function AriaLiveAnnouncer() {
  const [announcement, setAnnouncement] = useState('');

  const announce = (message: string) => {
    setAnnouncement(message);
    setTimeout(() => setAnnouncement(''), 1000);
  };

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
    >
      {announcement}
    </div>
  );
}

// Semantic HTML components with proper accessibility
export function SemanticSection({ 
  id, 
  ariaLabel, 
  children, 
  className = '' 
}: { 
  id: string; 
  ariaLabel?: string; 
  children: React.ReactNode; 
  className?: string;
}) {
  return (
    <section
      id={id}
      aria-label={ariaLabel}
      className={className}
      role="region"
    >
      {children}
    </section>
  );
}

export function SemanticNav({ 
  ariaLabel, 
  children, 
  className = '' 
}: { 
  ariaLabel: string; 
  children: React.ReactNode; 
  className?: string;
}) {
  return (
    <nav
      aria-label={ariaLabel}
      className={className}
      role="navigation"
    >
      {children}
    </nav>
  );
}

export function SemanticMain({ 
  id = 'main-content', 
  children, 
  className = '' 
}: { 
  id?: string; 
  children: React.ReactNode; 
  className?: string;
}) {
  return (
    <main
      id={id}
      className={className}
      role="main"
    >
      {children}
    </main>
  );
}

export function SemanticAside({ 
  ariaLabel, 
  children, 
  className = '' 
}: { 
  ariaLabel: string; 
  children: React.ReactNode; 
  className?: string;
}) {
  return (
    <aside
      aria-label={ariaLabel}
      className={className}
      role="complementary"
    >
      {children}
    </aside>
  );
}

// Form accessibility utilities
export function AccessibleForm({ 
  onSubmit, 
  children, 
  className = '' 
}: { 
  onSubmit: (e: React.FormEvent) => void; 
  children: React.ReactNode; 
  className?: string;
}) {
  return (
    <form
      onSubmit={onSubmit}
      className={className}
      noValidate
    >
      {children}
    </form>
  );
}

export function AccessibleInput({
  id,
  label,
  error,
  required = false,
  type = 'text',
  placeholder,
  value,
  onChange,
  className = '',
  ...props
}: {
  id: string;
  label: string;
  error?: string;
  required?: boolean;
  type?: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
  [key: string]: any;
}) {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
  const errorId = `${inputId}-error`;

  return (
    <div className={className}>
      <label 
        htmlFor={inputId}
        className="block text-sm font-medium text-[#171717] dark:text-[#EDEDED] mb-1"
      >
        {label}
        {required && <span className="text-[#DC2626] dark:text-[#E5484D] ml-1" aria-label="required">*</span>}
      </label>
      <input
        id={inputId}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        aria-invalid={!!error}
        aria-describedby={error ? errorId : undefined}
        className="w-full px-3 py-2 bg-white dark:bg-[#232325] text-[#171717] dark:text-[#EDEDED] placeholder:text-[#737373] dark:placeholder:text-[#85858B] border border-[#171717]/[0.15] dark:border-white/[0.12] rounded-md focus:outline-none focus:ring-2 focus:ring-[#FB432C] focus:border-transparent"
        {...props}
      />
      {error && (
        <div id={errorId} className="mt-1 text-sm text-[#DC2626] dark:text-[#E5484D]" role="alert">
          {error}
        </div>
      )}
    </div>
  );
}

// Button accessibility utilities
export function AccessibleButton({
  children,
  onClick,
  disabled = false,
  ariaLabel,
  ariaDescribedBy,
  className = '',
  ...props
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  ariaLabel?: string;
  ariaDescribedBy?: string;
  className?: string;
  [key: string]: any;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      className={`px-4 py-2 bg-[#FB432C] text-white rounded-md hover:bg-[#E03923] focus:outline-none focus:ring-2 focus:ring-[#FB432C] focus:ring-offset-2 dark:focus:ring-offset-[#111113] disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

// Image accessibility utilities
export function AccessibleImage({
  src,
  alt,
  width,
  height,
  className = '',
  loading = 'lazy',
  ...props
}: {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  loading?: 'lazy' | 'eager';
  [key: string]: any;
}) {
  return (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      loading={loading}
      className={className}
      {...props}
    />
  );
}

// Link accessibility utilities
export function AccessibleLink({
  href,
  children,
  ariaLabel,
  external = false,
  className = '',
  ...props
}: {
  href: string;
  children: React.ReactNode;
  ariaLabel?: string;
  external?: boolean;
  className?: string;
  [key: string]: any;
}) {
  return (
    <a
      href={href}
      aria-label={ariaLabel}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
      className={`text-[#FB432C] hover:text-[#171717] dark:hover:text-[#EDEDED] transition-colors ${className}`}
      {...props}
    >
      {children}
      {external && (
        <span className="sr-only"> (opens in new tab)</span>
      )}
    </a>
  );
}

// Progress indicator with accessibility
export function AccessibleProgress({
  value,
  max = 100,
  label = 'Loading progress',
  className = '',
}: {
  value: number;
  max?: number;
  label?: string;
  className?: string;
}) {
  const percentage = (value / max) * 100;

  return (
    <div className={className}>
      <div className="sr-only" role="status" aria-live="polite">
        {label}: {Math.round(percentage)}%
      </div>
      <div
        className="w-full bg-[#E5E5E5] dark:bg-[#232325] rounded-full h-2"
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label}
      >
        <div
          className="bg-[#FB432C] h-2 rounded-full transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

// Toast notification with accessibility
export function AccessibleToast({
  message,
  type = 'info',
  onClose,
  className = '',
}: {
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  onClose: () => void;
  className?: string;
}) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      onClose();
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  if (!isVisible) return null;

  const typeStyles = {
    info: 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/70 dark:text-blue-200 dark:border-blue-500/30',
    success: 'bg-[#ECFDF5] text-[#16A34A] border-[#16A34A]/20 dark:bg-[#102A1E] dark:text-[#4CC38A] dark:border-[#4CC38A]/25',
    warning: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/70 dark:text-amber-200 dark:border-amber-500/30',
    error: 'bg-[#FEF2F2] text-[#DC2626] border-[#DC2626]/20 dark:bg-[#2A1517] dark:text-[#E5484D] dark:border-[#E5484D]/25',
  };

  return (
    <div
      className={`fixed top-4 right-4 p-4 rounded-lg border ${typeStyles[type]} ${className}`}
      role="alert"
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="flex items-center justify-between">
        <p>{message}</p>
        <button
          onClick={() => {
            setIsVisible(false);
            onClose();
          }}
          className="ml-4 text-current hover:opacity-75"
          aria-label="Close notification"
        >
          ×
        </button>
      </div>
    </div>
  );
}
