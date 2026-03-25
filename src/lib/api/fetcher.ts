export interface ApiEnvelope<T, M = Record<string, unknown>> {
  data: T;
  meta?: M;
}

interface ApiErrorBody {
  error?: string;
}

export async function fetchApi<T, M = Record<string, unknown>>(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<ApiEnvelope<T, M>> {
  const response = await fetch(input, init);
  const body = (await response.json().catch(() => ({}))) as Partial<ApiEnvelope<T, M>> & ApiErrorBody;

  if (!response.ok) {
    throw new Error(body.error ?? "Request failed");
  }

  if (!("data" in body)) {
    throw new Error("Malformed API response");
  }

  return body as ApiEnvelope<T, M>;
}

export async function fetchApiData<T, M = Record<string, unknown>>(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<T> {
  const body = await fetchApi<T, M>(input, init);
  return body.data;
}