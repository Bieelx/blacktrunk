import {useEffect, useState} from 'react';

type ClientJsonState<T> = {
  data: T | null;
  error: Error | null;
  loading: boolean;
};

export function useClientJson<T>(url: string): ClientJsonState<T> {
  const [state, setState] = useState<ClientJsonState<T>>({
    data: null,
    error: null,
    loading: true,
  });

  useEffect(() => {
    const controller = new AbortController();
    const t0 = performance.now();
    console.debug(`[clientJson] fetch START ${url}`);

    setState((current) => ({...current, error: null, loading: true}));

    fetch(url, {
      headers: {Accept: 'application/json'},
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to load ${url}: ${response.status}`);
        }
        return response.json() as Promise<T>;
      })
      .then((data) => {
        if (!controller.signal.aborted) {
          console.debug(`[clientJson] fetch OK ${url} (${(performance.now() - t0).toFixed(0)}ms)`);
          setState({data, error: null, loading: false});
        }
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) {
          console.debug(`[clientJson] fetch ABORTED ${url} (${(performance.now() - t0).toFixed(0)}ms)`);
          return;
        }
        console.error(`[clientJson] fetch ERROR ${url}`, error);
        setState({
          data: null,
          error: error instanceof Error ? error : new Error(String(error)),
          loading: false,
        });
      });

    return () => {
      console.debug(`[clientJson] cleanup/abort ${url}`);
      controller.abort();
    };
  }, [url]);

  return state;
}
