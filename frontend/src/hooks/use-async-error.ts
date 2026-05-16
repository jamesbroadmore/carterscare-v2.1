import { useCallback, useState } from "react";
import { toast } from "sonner";
import { ERROR_MESSAGES } from "@/lib/constants";

interface AsyncError {
  message: string;
  status?: number;
  details?: unknown;
}

export function useAsyncError() {
  const [error, setError] = useState<AsyncError | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const execute = useCallback(
    async <T,>(
      fn: () => Promise<T>,
      options?: {
        onSuccess?: (data: T) => void;
        onError?: (error: AsyncError) => void;
        successMessage?: string;
        errorMessage?: string;
        showToast?: boolean;
      }
    ): Promise<T | null> => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await fn();
        if (options?.successMessage && options?.showToast !== false) {
          toast.success(options.successMessage);
        }
        options?.onSuccess?.(result);
        return result;
      } catch (err: unknown) {
        const asyncError = parseError(err);
        setError(asyncError);

        const message =
          options?.errorMessage ||
          getErrorMessage(asyncError.status) ||
          asyncError.message;

        if (options?.showToast !== false) {
          toast.error(message);
        }
        options?.onError?.(asyncError);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return { execute, error, isLoading, clearError };
}

function parseError(err: unknown): AsyncError {
  if (err instanceof Error) {
    return {
      message: err.message,
      details: err,
    };
  }

  if (typeof err === "object" && err !== null && "message" in err) {
    return {
      message: String((err as Record<string, unknown>).message),
      status: (err as Record<string, unknown>).status as number | undefined,
      details: err,
    };
  }

  return {
    message: String(err),
    details: err,
  };
}

function getErrorMessage(status?: number): string | null {
  switch (status) {
    case 401:
      return ERROR_MESSAGES.UNAUTHORIZED;
    case 404:
      return ERROR_MESSAGES.NOT_FOUND;
    case 500:
    case 502:
    case 503:
      return ERROR_MESSAGES.SERVER_ERROR;
    case 422:
      return ERROR_MESSAGES.VALIDATION;
    default:
      return null;
  }
}
