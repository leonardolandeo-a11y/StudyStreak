import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
export type ResourceState<T> = { status: 'loading' } | { status: 'error' } | { status: 'success'; data: T };

export function useFocusedResource<T>(load: (signal: AbortSignal) => Promise<T>) {
  const [revision, setRevision] = useState(0);
  const [result, setResult] = useState<{ load: typeof load; revision: number; value: ResourceState<T> } | null>(null);
  const retry = useCallback(() => setRevision(value => value + 1), []);
  useFocusEffect(useCallback(() => {
    const controller = new AbortController();
    void Promise.resolve().then(async () => {
      if (controller.signal.aborted) return;
      setResult({ load, revision, value: { status: 'loading' } });
      try {
        const data = await load(controller.signal);
        if (!controller.signal.aborted) setResult({ load, revision, value: { status: 'success', data } });
      } catch { if (!controller.signal.aborted) setResult({ load, revision, value: { status: 'error' } }); }
    });
    return () => controller.abort();
  }, [load, revision]));
  const state: ResourceState<T> = result?.load === load && result.revision === revision ? result.value : { status: 'loading' };
  return { state, retry };
}
