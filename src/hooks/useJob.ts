import { useCallback, useRef, useState } from "react";
import { analysisService } from "../services/analysis";
import { apiError } from "../services/api";
import type { Job } from "../types";

/**
 * Small helper around the backend job contract: POST returns 202 + job id,
 * then we poll GET /api/jobs/{id} until it succeeds or fails.
 */
export function useJob() {
  const [job, setJob] = useState<Job | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setRunning(false);
  }, []);

  const track = useCallback(async (start: () => Promise<Job>): Promise<Job | null> => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setRunning(true);
    setError(null);
    try {
      const created = await start();
      setJob(created);
      const finished = await analysisService.waitForJob(
        created.id,
        (update) => setJob(update),
        controller.signal,
      );
      if (finished.status === "failed") {
        setError(finished.error || "The analysis job failed.");
        return finished;
      }
      return finished;
    } catch (err) {
      if ((err as Error).name !== "AbortError") setError(apiError(err));
      return null;
    } finally {
      setRunning(false);
      abortRef.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    setJob(null);
    setError(null);
  }, []);

  return { job, running, error, track, cancel, reset, setError };
}
