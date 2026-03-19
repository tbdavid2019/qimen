import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
export declare const QimenInputSchema: z.ZodObject<{
    question: z.ZodString;
    datetime: z.ZodOptional<z.ZodString>;
    purpose: z.ZodDefault<z.ZodOptional<z.ZodString>>;
}, "strict", z.ZodTypeAny, {
    question: string;
    purpose: string;
    datetime?: string | undefined;
}, {
    question: string;
    datetime?: string | undefined;
    purpose?: string | undefined;
}>;
export declare const MeihuaInputSchema: z.ZodObject<{
    question: z.ZodString;
    method: z.ZodDefault<z.ZodOptional<z.ZodEnum<["time", "number"]>>>;
    purpose: z.ZodDefault<z.ZodOptional<z.ZodString>>;
}, "strict", z.ZodTypeAny, {
    method: "number" | "time";
    question: string;
    purpose: string;
}, {
    question: string;
    method?: "number" | "time" | undefined;
    purpose?: string | undefined;
}>;
/**
 * Registers all divination tools onto the given server instance.
 */
export declare function registerDivinationTools(server: McpServer): void;
//# sourceMappingURL=divination.d.ts.map