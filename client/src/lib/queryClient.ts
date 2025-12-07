import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(method: string, url: string, data?: any) {
  const options = {
    method,
    headers: {
      "Content-Type": "application/json",
      // Add auth token if needed
      // Authorization: `Bearer ${getToken()}`
    },
    body: data ? JSON.stringify(data) : undefined,
  };

  const res = await fetch(url, options);

  // Log the response for debugging
  console.log(`📡 API Request: ${method} ${url}`, { status: res.status, ok: res.ok });

  if (!res.ok) {
    const text = await res.text();
    console.error(`❌ API Error Response:`, { status: res.status, body: text.substring(0, 200) });

    // Try to parse as JSON, fallback to text
    let errorMessage = res.statusText;
    try {
      const error = JSON.parse(text);
      errorMessage = error.message || error.error || res.statusText;
    } catch {
      errorMessage = text || res.statusText;
    }
    throw new Error(errorMessage);
  }

  const text = await res.text();
  if (!text) {
    console.warn(`⚠️ API returned empty response for ${method} ${url}`);
    return {};
  }

  try {
    const json = JSON.parse(text);
    console.log(`✅ API Response parsed successfully:`, { url, dataKeys: Object.keys(json) });
    return json;
  } catch (parseError) {
    console.error(`❌ Failed to parse JSON response:`, {
      url,
      responseStart: text.substring(0, 200),
      error: parseError
    });
    throw new Error(`Invalid JSON response from ${url}: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

// Define defaultQueryFn to be used in QueryClient
const defaultQueryFn: QueryFunction = getQueryFn({ on401: "throw" });

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: defaultQueryFn,
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 0, // No cache
      gcTime: 0, // Clear immediately
    },
    mutations: {
      retry: false,
    },
  },
});