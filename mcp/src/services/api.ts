/**
 * Wrapper for remote API calls to qi.david888.com.
 */

// Define standard response structures
export interface QimenResponse {
  success: boolean;
  answer?: string;
  fallback?: string;
  error?: string;
  message?: string;
}

export interface MeihuaResponse {
  success: boolean;
  answer?: string;
  error?: string;
  message?: string;
}

export interface ServiceResponse {
  success: boolean;
  mode?: string;
  answer?: string;
  analysis?: string | null;
  analysisSuccess?: boolean | null;
  rawAnswer?: unknown;
  result?: unknown;
  reading?: unknown;
  report?: unknown;
  chart?: unknown;
  error?: string;
  message?: string;
  metadata?: {
    provider?: string | null;
    model?: string | null;
    language?: string;
    apiVersion?: string;
  };
}

/**
 * Perform a POST request to qi.david888.com
 */
export async function makeApiRequest<T>(
  endpoint: string,
  data: any
): Promise<T> {
  const url = `https://qi.david888.com/api/${endpoint}`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status} (${response.statusText})`);
    }

    const json = await response.json();
    return json as T;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Network/API Error: ${error.message}`);
    }
    throw new Error("Unknown error occurred during API request");
  }
}
