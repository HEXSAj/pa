'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

export function usePageLoad() {
  const [isPageLoaded, setIsPageLoaded] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    // Reset page load state when pathname changes
    setIsPageLoaded(false);

    let checkCount = 0;
    const maxChecks = 30; // Maximum 3 seconds of checking

    // Check if page content is ready
    const checkPageContent = () => {
      checkCount++;
      
      const mainContent = document.querySelector('main');
      const hasContent = mainContent && mainContent.children.length > 0;
      
      // Also check if there are any loading indicators or spinners
      const loadingElements = document.querySelectorAll('[data-loading], .loading, .spinner');
      const hasLoadingElements = loadingElements.length > 0;
      
      if (hasContent && !hasLoadingElements) {
        // Page content is ready and no loading indicators
        setTimeout(() => {
          setIsPageLoaded(true);
        }, 150);
      } else if (checkCount < maxChecks) {
        // If no content yet or still loading, check again
        setTimeout(checkPageContent, 100);
      } else {
        // Fallback: assume page is loaded after max checks
        setIsPageLoaded(true);
      }
    };

    // Start checking after a short delay
    const timer = setTimeout(checkPageContent, 200);
    
    return () => clearTimeout(timer);
  }, [pathname]);

  return isPageLoaded;
}
