import { useCallback, useEffect, useRef, useState } from 'react';
import { getApiErrorMessage } from '@/api/client';

interface ApiDataState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export interface ApiDataResult<T> extends ApiDataState<T> {
  refresh: () => void;
}

/**
 * Small data-fetching hook used by pages that talk to the AutoCare API.
 *
 * ```ts
 * const { data, loading, error, refresh } = useApiData(() => getVehicles(), []);
 * ```
 *
 * `deps` re-triggers the fetch (like useEffect deps). The fetcher itself is
 * kept in a ref so it never needs to be memoised by the caller.
 */
export function useApiData<T>(fetcher: () => Promise<T>, deps: unknown[] = []): ApiDataResult<T> {
  const [state, setState] = useState<ApiDataState<T>>({
    data: null,
    loading: true,
    error: null,
  });
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const run = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await fetcherRef.current();
      setState({ data, loading: false, error: null });
    } catch (err) {
      setState({ data: null, loading: false, error: getApiErrorMessage(err) });
    }
  }, []);

  useEffect(() => {
    void run();
    // The caller explicitly owns the dependency list.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { ...state, refresh: run };
}
