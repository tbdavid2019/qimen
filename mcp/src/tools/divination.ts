import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { makeApiRequest, QimenResponse, MeihuaResponse, ServiceResponse } from "../services/api.js";

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

const ConversationHistorySchema = z.array(z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string()
})).optional().default([]);

export const TarotInputSchema = z.object({
  question: z.string().describe("The user's Tarot question."),
  spread: z.enum(["single", "three", "diamond", "moon", "horseshoe", "celtic"]).optional().default("three").describe("Tarot spread."),
  seed: z.string().optional().describe("Optional deterministic draw seed."),
  lang: z.enum(["zh-tw", "zh-cn"]).optional().default("zh-tw"),
  conversationHistory: ConversationHistorySchema
}).strict();

export const FengShuiInputSchema = z.object({
  question: z.string().describe("The user's Feng Shui question."),
  facing: z.enum(["南", "北", "東", "西", "東南", "西北", "東北", "西南"]).optional().default("南"),
  moveInYear: z.number().int().min(1).max(9999).optional(),
  residentYear: z.number().int().min(1).max(9999).optional(),
  sex: z.enum(["男", "女"]).optional(),
  year: z.number().int().min(1).max(9999).optional(),
  lang: z.enum(["zh-tw", "zh-cn"]).optional().default("zh-tw"),
  conversationHistory: ConversationHistorySchema
}).strict();

export const Bazi2InputSchema = z.object({
  question: z.string().describe("The user's 生辰八字2 question."),
  date: z.string().describe("Birth date in YYYY-MM-DD format."),
  time: z.string().optional().default("12:00"),
  sex: z.enum(["男", "女"]).optional().default("男"),
  calendar: z.enum(["solar", "lunar"]).optional().default("solar"),
  name: z.string().optional(),
  formerName: z.string().optional(),
  place: z.string().optional(),
  lang: z.enum(["zh-tw", "zh-cn"]).optional().default("zh-tw"),
  conversationHistory: ConversationHistorySchema
}).strict();

export const YinyuanInputSchema = z.object({
  question: z.string().describe("The user's relationship question."),
  mode: z.enum(["fortune", "zodiac", "red-thread", "bazi-match", "marriage-palace", "peach-blossom"]).optional().default("fortune"),
  firstYear: z.number().int().min(1).max(9999).optional(),
  secondYear: z.number().int().min(1).max(9999).optional(),
  status: z.string().optional().default("單身"),
  seed: z.string().optional(),
  chart: z.record(z.any()).optional(),
  firstChart: z.record(z.any()).optional(),
  secondChart: z.record(z.any()).optional(),
  lang: z.enum(["zh-tw", "zh-cn"]).optional().default("zh-tw"),
  conversationHistory: ConversationHistorySchema
}).strict();

export const AnswerbookInputSchema = z.object({
  mode: z.enum(["direct", "question"]).optional().default("direct").describe("direct 直接默念；question 輸入問題並由 AI 解讀"),
  question: z.string().optional().describe("問題模式使用的具體問題；直接模式可省略"),
  lang: z.enum(["zh-tw", "zh-cn"]).optional().default("zh-tw"),
  conversationHistory: ConversationHistorySchema
}).strict();

type QimenInput = z.infer<typeof QimenInputSchema>;
type MeihuaInput = z.infer<typeof MeihuaInputSchema>;
type TarotInput = z.infer<typeof TarotInputSchema>;
type FengShuiInput = z.infer<typeof FengShuiInputSchema>;
type Bazi2Input = z.infer<typeof Bazi2InputSchema>;
type YinyuanInput = z.infer<typeof YinyuanInputSchema>;
type AnswerbookInput = z.infer<typeof AnswerbookInputSchema>;

/**
 * Registers all divination tools onto the given server instance.
 */
export function registerDivinationTools(server: McpServer) {

  // Tool 1: Qimen Divination
  server.registerTool(
    "qimen_divination",
    {
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
    },
    async (params: QimenInput) => {
      try {
        const payload = {
          question: params.question,
          datetime: params.datetime || null,
          purpose: params.purpose,
          mode: 'advanced'
        };

        const result = await makeApiRequest<QimenResponse>("qimen-question", payload);

        if (!result.success) {
          return {
            content: [{ type: "text", text: `API Error: ${result.error || result.message || "Unknown error"}` }]
          };
        }

        const answer = result.answer || result.fallback || "No reading generated.";
        
        return {
          content: [{ type: "text", text: `## Qimen Dunjia Reading\n\n${answer}` }]
        };

      } catch (error) {
        return {
          content: [{ type: "text", text: `Error executing Qimen Divination: ${error instanceof Error ? error.message : String(error)}` }]
        };
      }
    }
  );

  // Tool 2: Meihua Divination
  server.registerTool(
    "meihua_divination",
    {
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
    },
    async (params: MeihuaInput) => {
      try {
        const payload = {
          question: params.question,
          method: params.method,
          purpose: params.purpose
        };

        const result = await makeApiRequest<MeihuaResponse>("meihua-question", payload);

        if (!result.success) {
          return {
            content: [{ type: "text", text: `API Error: ${result.error || result.message || "Unknown error"}` }]
          };
        }

        return {
          content: [{ type: "text", text: `## Meihua Yishu Reading\n\n${result.answer || "No reading generated."}` }]
        };

      } catch (error) {
        return {
          content: [{ type: "text", text: `Error executing Meihua Divination: ${error instanceof Error ? error.message : String(error)}` }]
        };
      }
    }
  );

  // Tool 3: Tarot one-shot reading
  server.registerTool(
    "tarot_divination",
    {
      title: "Tarot Reflective Reading",
      description: "Draw a supported Tarot spread and receive an AI interpretation with practical, non-fatalistic guidance.",
      inputSchema: TarotInputSchema,
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true }
    },
    async (params: TarotInput) => {
      try {
        const result = await makeApiRequest<ServiceResponse>("tarot-question", params);
        if (!result.success) return { content: [{ type: "text", text: `API Error: ${result.error || result.message || "Unknown error"}` }] };
        return { content: [{ type: "text", text: `## Tarot Reading\n\n${result.answer || "No reading generated."}\n\n${JSON.stringify(result.reading || result.result || null, null, 2)}` }] };
      } catch (error) {
        return { content: [{ type: "text", text: `Error executing Tarot Reading: ${error instanceof Error ? error.message : String(error)}` }] };
      }
    }
  );

  // Tool 4: Feng Shui consultation
  server.registerTool(
    "fengshui_consultation",
    {
      title: "Feng Shui Consultation",
      description: "Generate an Eight Mansions and Period 9 flying-star report with practical home-layout advice.",
      inputSchema: FengShuiInputSchema,
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: true }
    },
    async (params: FengShuiInput) => {
      try {
        const result = await makeApiRequest<ServiceResponse>("fengshui-question", params);
        if (!result.success) return { content: [{ type: "text", text: `API Error: ${result.error || result.message || "Unknown error"}` }] };
        return { content: [{ type: "text", text: `## Feng Shui Consultation\n\n${result.answer || "No consultation generated."}\n\n${JSON.stringify(result.report || result.result || null, null, 2)}` }] };
      } catch (error) {
        return { content: [{ type: "text", text: `Error executing Feng Shui Consultation: ${error instanceof Error ? error.message : String(error)}` }] };
      }
    }
  );

  // Tool 5: 生辰八字2 analysis
  server.registerTool(
    "bazi2_analysis",
    {
      title: "生辰八字2 Analysis",
      description: "Calculate the four pillars, ten gods, five elements, and luck cycles, then receive an AI interpretation.",
      inputSchema: Bazi2InputSchema,
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: true }
    },
    async (params: Bazi2Input) => {
      try {
        const result = await makeApiRequest<ServiceResponse>("bazi2-question", params);
        if (!result.success) return { content: [{ type: "text", text: `API Error: ${result.error || result.message || "Unknown error"}` }] };
        return { content: [{ type: "text", text: `## 生辰八字2 Analysis\n\n${result.answer || "No analysis generated."}\n\n${JSON.stringify(result.chart || result.result || null, null, 2)}` }] };
      } catch (error) {
        return { content: [{ type: "text", text: `Error executing 生辰八字2 Analysis: ${error instanceof Error ? error.message : String(error)}` }] };
      }
    }
  );

  // Tool 6: 姻緣 reading
  server.registerTool(
    "yinyuan_reading",
    {
      title: "姻緣 Relationship Reading",
      description: "Use fortune sticks, zodiac matching, Bazi relationship patterns, spouse palace, or peach-blossom guidance with practical communication advice.",
      inputSchema: YinyuanInputSchema,
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true }
    },
    async (params: YinyuanInput) => {
      try {
        const result = await makeApiRequest<ServiceResponse>("yinyuan-question", params);
        if (!result.success) return { content: [{ type: "text", text: `API Error: ${result.error || result.message || "Unknown error"}` }] };
        return { content: [{ type: "text", text: `## 姻緣 Reading\n\n${result.answer || "No reading generated."}\n\n${JSON.stringify(result.result || null, null, 2)}` }] };
      } catch (error) {
        return { content: [{ type: "text", text: `Error executing 姻緣 Reading: ${error instanceof Error ? error.message : String(error)}` }] };
      }
    }
  );

  // Tool 7: 解答之書 reading
  server.registerTool(
    "answerbook_reading",
    {
      title: "解答之書 Reading",
      description: "直接默念取得解答之書提醒，或輸入問題後取得答案並交由 AI 進行理性解讀。",
      inputSchema: AnswerbookInputSchema,
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true }
    },
    async (params: AnswerbookInput) => {
      try {
        const result = await makeApiRequest<ServiceResponse>("answerbook-question", params);
        if (!result.success) return { content: [{ type: "text", text: `API Error: ${result.error || result.message || "Unknown error"}` }] };
        const analysis = result.analysis ? `\n\n## AI 解讀\n\n${result.analysis}` : "";
        return { content: [{ type: "text", text: `## 解答之書\n\n${result.answer || "No answer generated."}${analysis}\n\n${JSON.stringify(result.result || null, null, 2)}` }] };
      } catch (error) {
        return { content: [{ type: "text", text: `Error executing Answerbook Reading: ${error instanceof Error ? error.message : String(error)}` }] };
      }
    }
  );

}
