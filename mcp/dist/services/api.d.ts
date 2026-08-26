/**
 * Wrapper for remote API calls to qi.david888.com.
 */
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
export declare function makeApiRequest<T>(endpoint: string, data: any): Promise<T>;
//# sourceMappingURL=api.d.ts.map