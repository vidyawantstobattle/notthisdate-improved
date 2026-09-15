// Stopgap: @types/react-dom could not be fetched from the registry due to a
// network/proxy issue on this machine (see repo memory notes). Remove this file
// once `npm i --save-dev @types/react-dom` succeeds — it duplicates that package's
// declarations for the one API surface this app actually uses.
declare module 'react-dom/client' {
  import type { ReactNode } from 'react';

  interface Root {
    render(children: ReactNode): void;
    unmount(): void;
  }

  export function createRoot(container: Element | DocumentFragment): Root;
}
