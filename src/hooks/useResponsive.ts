import { useState, useEffect } from 'react';

export function useResponsive() {
  const [screenSize, setScreenSize] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;

      if (width < 640) {
        setScreenSize('mobile');
        setIsMobile(true);
        setIsTablet(false);
      } else if (width < 1024) {
        setScreenSize('tablet');
        setIsMobile(false);
        setIsTablet(true);
      } else {
        setScreenSize('desktop');
        setIsMobile(false);
        setIsTablet(false);
      }
    };

    // Initial call
    handleResize();

    // Listen to resize events
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return { screenSize, isMobile, isTablet };
}

// Media query helpers for CSS-in-JS
export const mediaQueries = {
  mobile: '@media (max-width: 639px)',
  tablet: '@media (min-width: 640px) and (max-width: 1023px)',
  desktop: '@media (min-width: 1024px)',
  smallScreen: '@media (max-width: 768px)',
  mediumScreen: '@media (min-width: 768px) and (max-width: 1024px)',
  largeScreen: '@media (min-width: 1024px)',
};

// Responsive value helper
export function useResponsiveValue<T>(mobileValue: T, tabletValue: T, desktopValue: T): T {
  const { screenSize } = useResponsive();

  switch (screenSize) {
    case 'mobile':
      return mobileValue;
    case 'tablet':
      return tabletValue;
    case 'desktop':
      return desktopValue;
  }
}
