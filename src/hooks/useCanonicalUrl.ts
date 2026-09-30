import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { SITE_URL } from '../config/site';

// The tags in index.html are static and describe the landing page, which would make
// every SPA route claim "/" as its canonical. This retargets them on navigation.
function useCanonicalUrl(): void {
  const { pathname } = useLocation();

  useEffect(() => {
    const url = new URL(pathname, SITE_URL).href;

    let canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = url;

    document.querySelectorAll<HTMLMetaElement>(
      'meta[property="og:url"], meta[property="twitter:url"]'
    ).forEach(tag => {
      tag.content = url;
    });
  }, [pathname]);
}

export default useCanonicalUrl;
