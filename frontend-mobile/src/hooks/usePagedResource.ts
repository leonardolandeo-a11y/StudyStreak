import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import type { PageResponse } from '../types/page';
import { getApiErrorMessage } from '../utils/apiError';

export function usePagedResource<T>(
  load: (page: number, signal: AbortSignal) => Promise<PageResponse<T>>,
  enabled = true,
) {
  const [page, setPage] = useState(0);
  const [data, setData] = useState<PageResponse<T> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);
  const latestRevision = useRef(revision);
  const reload = useCallback(() => setRevision((value) => value + 1), []);

  useFocusEffect(useCallback(() => {
    const controller = new AbortController();
    latestRevision.current = revision;
    const isCurrent = () => !controller.signal.aborted && latestRevision.current === revision;
    void Promise.resolve().then(async () => {
      if (!isCurrent()) return;
      if (!enabled) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      setData(null);
      try {
        const response = await load(page, controller.signal);
        if (isCurrent()) setData(response);
      } catch (cause) {
        if (isCurrent()) {
          setError(getApiErrorMessage(cause, 'Unable to load this list.'));
        }
      } finally {
        if (isCurrent()) setLoading(false);
      }
    });
    return () => controller.abort();
  }, [enabled, load, page, revision]));

  return { page, setPage, data, loading, error, reload };
}
