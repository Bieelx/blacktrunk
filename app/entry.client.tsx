import {HydratedRouter} from 'react-router/dom';
import {hydrateRoot} from 'react-dom/client';
import {NonceProvider} from '@shopify/hydrogen';

if (!window.location.origin.includes('webcache.googleusercontent.com')) {
  // Navigation debug logging — remove after freeze investigation
  if (typeof window !== 'undefined') {
    window.addEventListener('click', (e) => {
      const anchor = (e.target as Element).closest('a');
      if (anchor) {
        console.debug(`[nav] click → href="${anchor.getAttribute('href')}" current="${location.pathname}"`);
      }
    }, true);

    window.addEventListener('popstate', () => {
      console.debug(`[nav] popstate → ${location.pathname}`);
    });

    // React Router emits these on the window
    window.addEventListener('__reactrouter_navigate', (e) => {
      console.debug('[nav] RR navigate event', e);
    });

    // Track URL changes via MutationObserver on title (fires after commit)
    let lastPathname = location.pathname;
    const urlPoller = setInterval(() => {
      if (location.pathname !== lastPathname) {
        console.debug(`[nav] URL committed: ${lastPathname} → ${location.pathname}`);
        lastPathname = location.pathname;
      }
    }, 50);
    // urlPoller intentionally never cleared — dev-only debug
    void urlPoller;
  }

  // Extract nonce from existing script tags.
  const existingNonce =
    document.querySelector<HTMLScriptElement>('script[nonce]')?.nonce;

  hydrateRoot(
    document,
    <NonceProvider value={existingNonce}>
      <HydratedRouter />
    </NonceProvider>,
  );
}
