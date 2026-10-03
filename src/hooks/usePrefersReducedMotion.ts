import { useEffect, useState } from 'react';

const QUERY = '(prefers-reduced-motion: reduce)';

// Decorative loops should settle on their end state rather than run forever for
// users who have asked the OS to tone motion down.
function usePrefersReducedMotion(): boolean {
  const [prefersReduced, setPrefersReduced] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(QUERY).matches
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia(QUERY);
    const onChange = () => setPrefersReduced(mediaQuery.matches);
    mediaQuery.addEventListener('change', onChange);
    return () => mediaQuery.removeEventListener('change', onChange);
  }, []);

  return prefersReduced;
}

export default usePrefersReducedMotion;
