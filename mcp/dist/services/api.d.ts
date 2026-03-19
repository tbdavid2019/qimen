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
/**
 * Perform a POST request to qi.david888.com
 */
export declare function makeApiRequest<T>(endpoint: string, data: any): Promise<T>;
//# sourceMappingURL=api.d.ts.map