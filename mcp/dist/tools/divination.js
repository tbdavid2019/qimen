import { z } from "zod";
import { makeApiRequest } from "../services/api.js";
// Input Schemas using Zod
export const QimenInputSchema = z.object({
    question: z.string().describe("The user's question or situation requiring divination."),
    datetime: z.string().optional().describe("Optional ISO 8601 datetime string (e.g., 2026-03-19T10:00:00). If omitted, the server uses current time."),
    purpose: z.string().optional().default("綜合").describe("The specific life area to focus on, e.g., '事業' (Career), '財運' (Wealth), '感情' (Romance). Defaults to '綜合' (General).")
}).strict();
export const MeihuaInputSchema = z.object({
    question: z.string().describe("The user's question or situation requiring divination."),
    method: z.enum(["time", "number"]).optional().default("time").describe("The method to generate hexagrams: 'time' (uses current time) or 'number' (if the user provided specific numbers)."),
    purpose: z.string().optional().default("綜合").describe("The specific life area to focus on.")
}).strict();
/**
 * Registers all divination tools onto the given server instance.
 */
export function registerDivinationTools(server) {
    // Tool 1: Qimen Divination
    server.registerTool("qimen_divination", {
        title: "Qimen Dunjia Professional Divination",
        description: `Get a professional Qimen Dunjia (奇門遁甲) chart calculation and analysis based on the current time or a provided datetime. 
Use this when the user asks for a high-precision divination, fortune-telling reading, or strategy regarding their career, romance, health, etc.
It returns a detailed analysis including the Day Stem, Hour Stem, and specific advice.`,
        inputSchema: QimenInputSchema,
        annotations: {
            readOnlyHint: true,
            destructiveHint: false,
            idempotentHint: true,
            openWorldHint: true
        }
    }, async (params) => {
        try {
            const payload = {
                question: params.question,
                datetime: params.datetime || null,
                purpose: params.purpose,
                mode: 'advanced'
            };
            const result = await makeApiRequest("qimen-question", payload);
            if (!result.success) {
                return {
                    content: [{ type: "text", text: `API Error: ${result.error || result.message || "Unknown error"}` }]
                };
            }
            const answer = result.answer || result.fallback || "No reading generated.";
            return {
                content: [{ type: "text", text: `## Qimen Dunjia Reading\n\n${answer}` }]
            };
        }
        catch (error) {
            return {
                content: [{ type: "text", text: `Error executing Qimen Divination: ${error instanceof Error ? error.message : String(error)}` }]
            };
        }
    });
    // Tool 2: Meihua Divination
    server.registerTool("meihua_divination", {
        title: "Meihua Yishu Quick Decision Divination",
        description: `Get a Meihua Yishu (梅花易數) hexagram calculation and reading.
Use this for quick insights or decision-making. Can be triggered by exact time or random numbers.`,
        inputSchema: MeihuaInputSchema,
        annotations: {
            readOnlyHint: true,
            destructiveHint: false,
            idempotentHint: true,
            openWorldHint: true
        }
    }, async (params) => {
        try {
            const payload = {
                question: params.question,
                method: params.method,
                purpose: params.purpose
            };
            const result = await makeApiRequest("meihua-question", payload);
            if (!result.success) {
                return {
                    content: [{ type: "text", text: `API Error: ${result.error || result.message || "Unknown error"}` }]
                };
            }
            return {
                content: [{ type: "text", text: `## Meihua Yishu Reading\n\n${result.answer || "No reading generated."}` }]
            };
        }
        catch (error) {
            return {
                content: [{ type: "text", text: `Error executing Meihua Divination: ${error instanceof Error ? error.message : String(error)}` }]
            };
        }
    });
}
//# sourceMappingURL=divination.js.map