import { useEffect } from 'react';

/**
 * Hook to set the document title with proper cleanup
 * @param {string} title - The page title (will be appended with "- NotThisDate")
 * @param {boolean} includeAppName - Whether to append the app name (default: true)
 */
function useDocumentTitle(title, includeAppName = true) {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = title
      ? (includeAppName ? `${title} - NotThisDate` : title)
      : 'NotThisDate - Reverse Availability Trip Planner';

    return () => {
      document.title = previousTitle;
    };
  }, [title, includeAppName]);
}

export default useDocumentTitle;
