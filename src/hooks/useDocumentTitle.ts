import { useEffect } from 'react';

/**
 * Sets the document title with cleanup on unmount.
 * @param title - Page title (appended with "- NotThisDate" unless includeAppName is false)
 * @param includeAppName - Whether to append the app name (default: true)
 */
function useDocumentTitle(title: string, includeAppName = true): void {
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
