import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { AppState } from 'react-native';
import type { PageResponse } from '../types/page';
import { getApiErrorMessage } from '../utils/apiError';

export function usePagedResource<T>(
  load: (page: number, signal: AbortSignal) => Promise<PageResponse<T>>,
  enabled = true,
  pollIntervalMs = 0,
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
        setData(null);
      }
      try {
        const response = await load(page, controller.signal);
        if (isCurrent()) {
          setData(response);
          if (silent) setError(null);
        }
      } catch (cause) {
        // Keep the last successfully loaded page visible if a poll fails.
        if (!silent && isCurrent()) {
          setError(getApiErrorMessage(cause, 'Unable to load this list.'));
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

  return { page, setPage, data, loading, error, reload };
}
