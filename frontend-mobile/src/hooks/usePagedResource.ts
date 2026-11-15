import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { AppState } from 'react-native';
import type { PageResponse } from '../types/page';
import { getApiErrorMessage } from '../utils/apiError';
import { getPageFallback } from '../utils/pageBounds';

export function usePagedResource<T>(
  load: (page: number, signal: AbortSignal) => Promise<PageResponse<T>>,
  enabled = true,
  pollIntervalMs = 0,
) {
  const [page, setPage] = useState(0);
  const [data, setData] = useState<PageResponse<T> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);
  const latestRevision = useRef(revision);
  const reload = useCallback(() => setRevision((value) => value + 1), []);

  useFocusEffect(useCallback(() => {
    const controller = new AbortController();
    let inFlight = false;
    latestRevision.current = revision;
    const isCurrent = () => !controller.signal.aborted && latestRevision.current === revision;

    async function refresh(silent: boolean) {
      if (!isCurrent() || inFlight) return;
      if (!enabled) {
        if (!silent) setLoading(false);
        return;
      }

      inFlight = true;
      if (!silent) {
        setLoading(true);
        setError(null);
        setRefreshError(null);
        setData(null);
      }
      try {
        const response = await load(page, controller.signal);
        if (isCurrent()) {
          const fallback = getPageFallback(page, response.totalPages);
          if (fallback !== null) {
            setPage(fallback);
            return;
          }
          setData(response);
          if (silent) setRefreshError(null);
        }
      } catch (cause) {
        if (isCurrent()) {
          if (silent) setRefreshError(getApiErrorMessage(cause, 'Unable to refresh the list.'));
          else setError(getApiErrorMessage(cause, 'Unable to load this list.'));
        }
      } finally {
        inFlight = false;
        if (!silent && isCurrent()) setLoading(false);
      }
    }

    void Promise.resolve().then(() => refresh(false));

    // Poll only on screens that opt in, while focused and in the foreground.
    const refreshWhenActive = () => {
      if (AppState.currentState === 'active') void refresh(true);
    };
    const subscription = pollIntervalMs > 0
      ? AppState.addEventListener('change', (nextState) => {
          if (nextState === 'active') refreshWhenActive();
        })
      : null;
    const intervalId = pollIntervalMs > 0 ? setInterval(refreshWhenActive, pollIntervalMs) : null;

    return () => {
      if (intervalId !== null) clearInterval(intervalId);
      subscription?.remove();
      controller.abort();
    };
  }, [enabled, load, page, revision, pollIntervalMs]));

  return { page, setPage, data, loading, error, refreshError, reload };
}
