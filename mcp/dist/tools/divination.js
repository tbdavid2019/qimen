import { z } from "zod";
import { makeApiRequest } from "../services/api.js";
const ConversationHistorySchema = z.array(z.object({
    role: z.enum(["user", "assistant"]),
    content: z.string()
})).optional().default([]);
// 1. 奇門遁甲
export const QimenInputSchema = z.object({
    question: z.string().describe("The user's question or situation requiring divination."),
    datetime: z.string().optional().describe("Optional ISO 8601 datetime string (e.g., 2026-03-19T10:00:00). If omitted, uses current time."),
    purpose: z.string().optional().default("綜合").describe("The specific life area: '事業', '財運', '感情', '綜合'. Defaults to '綜合'.")
}).strict();
// 2. 梅花易數
export const MeihuaInputSchema = z.object({
    question: z.string().describe("The user's question or situation requiring divination."),
    method: z.enum(["time", "number"]).optional().default("time").describe("The method to generate hexagrams: 'time' or 'number'."),
    purpose: z.string().optional().default("綜合").describe("The specific life area.")
}).strict();
// 3. 韋特塔羅
export const TarotInputSchema = z.object({
    question: z.string().describe("The user's Tarot question."),
    spread: z.enum(["single", "three", "diamond", "moon", "horseshoe", "celtic"]).optional().default("three").describe("Tarot spread."),
    variant: z.enum(["timeline", "relationship", "decision", "situation"]).optional().describe("Spread variant for three-card spread."),
    time_factor: z.enum(["morning", "afternoon", "night"]).optional().describe("Time factor element weighting."),
    timeFactor: z.enum(["morning", "afternoon", "night"]).optional(),
    seed: z.string().optional().describe("Optional deterministic draw seed."),
    lang: z.enum(["zh-tw", "zh-cn"]).optional().default("zh-tw"),
    conversationHistory: ConversationHistorySchema
}).strict();
// 4. 易經風水 (24 山玄空飛星 / 煞氣化解 / 協紀辨方擇日)
export const FengShuiInputSchema = z.object({
    question: z.string().describe("The user's Feng Shui question."),
    mode: z.enum(["yangzhai", "shaqi", "zeri"]).optional().default("yangzhai").describe("Analysis mode: yangzhai (陽宅飛星), shaqi (形煞化解), zeri (擇日)."),
    facing: z.enum([
        "南", "北", "東", "西", "東南", "西北", "東北", "西南",
        "壬山丙向", "子山午向", "癸山丁向", "丑山未向", "艮山坤向", "寅山申向",
        "甲山庚向", "卯山酉向", "乙山辛向", "辰山戌向", "巽山乾向", "巳山亥向",
        "丙山壬向", "午山子向", "丁山癸向", "未山丑向", "坤山艮向", "申山寅向",
        "庚山甲向", "酉山卯向", "辛山乙向", "戌山辰向", "乾山巽向", "亥山巳向"
    ]).optional().default("南").describe("24 mountains or 8 main directions facing."),
    moveInYear: z.number().int().min(1).max(9999).optional(),
    residentYear: z.number().int().min(1).max(9999).optional(),
    sex: z.enum(["男", "女"]).optional(),
    year: z.number().int().min(1).max(9999).optional(),
    shaType: z.string().optional().describe("Specific sha type for shaqi mode (e.g., 天斬煞, 路衝煞, 穿堂煞)."),
    matter: z.string().optional().describe("Matter for zeri mode (e.g., 入宅/喬遷, 開市/開業, 動土修造)."),
    zeriYear: z.number().int().optional(),
    zeriMonth: z.number().int().min(1).max(12).optional(),
    lang: z.enum(["zh-tw", "zh-cn"]).optional().default("zh-tw"),
    conversationHistory: ConversationHistorySchema
}).strict();
// 5. 生辰八字2 (完整神煞、精確起運歲月、未知時辰)
export const Bazi2InputSchema = z.object({
    question: z.string().describe("The user's 八字命理 question."),
    date: z.string().describe("Birth date in YYYY-MM-DD format."),
    time: z.string().optional().default("12:00").describe("Birth time in HH:mm format."),
    shichen: z.enum(["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"]).optional().describe("Traditional Chinese birth shichen (時辰)."),
    hour: z.number().int().min(0).max(23).optional(),
    sex: z.enum(["男", "女"]).optional().default("男"),
    calendar: z.enum(["solar", "lunar"]).optional().default("solar"),
    deceasedYear: z.number().int().optional().describe("Optional filter year limit for deceased profiles."),
    allowUnknownHour: z.boolean().optional(),
    name: z.string().optional(),
    place: z.string().optional(),
    lang: z.enum(["zh-tw", "zh-cn"]).optional().default("zh-tw"),
    conversationHistory: ConversationHistorySchema
}).strict();
// 6. 紫微斗數 (12宮命盤、18經典格局、生年四化、大限流年)
export const ZiweiInputSchema = z.object({
    question: z.string().describe("The user's 紫微斗數 question."),
    date: z.string().describe("Birth date in YYYY-MM-DD format."),
    time: z.string().optional().default("12:00").describe("Birth time in HH:mm format."),
    shichen: z.enum(["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"]).optional().describe("Traditional birth shichen."),
    sex: z.enum(["男", "女"]).optional().default("男"),
    calendar: z.enum(["solar", "lunar"]).optional().default("solar"),
    leap: z.boolean().optional().default(false),
    lang: z.enum(["zh-tw", "zh-cn"]).optional().default("zh-tw"),
    conversationHistory: ConversationHistorySchema
}).strict();
// 7. 月老姻緣 (6大正統模式)
export const YinyuanInputSchema = z.object({
    question: z.string().describe("The user's relationship question."),
    mode: z.enum(["fortune", "zodiac", "red-thread", "bazi-match", "ziwei-marriage", "marriage-palace", "peach-blossom", "taohua-luck"]).optional().default("fortune"),
    firstZodiac: z.string().optional(),
    secondZodiac: z.string().optional(),
    firstYear: z.number().int().min(1).max(9999).optional(),
    secondYear: z.number().int().min(1).max(9999).optional(),
    stickNum: z.number().int().min(1).max(100).optional().describe("1-100 fortune stick number."),
    date: z.string().optional(),
    birthDate: z.string().optional(),
    first: z.record(z.any()).optional().describe("First person's birth info for bazi-match."),
    second: z.record(z.any()).optional().describe("Second person's birth info for bazi-match."),
    status: z.string().optional().default("單身"),
    stage: z.string().optional(),
    seekingSex: z.string().optional(),
    preference: z.string().optional(),
    scope: z.string().optional(),
    seed: z.string().optional(),
    lang: z.enum(["zh-tw", "zh-cn"]).optional().default("zh-tw"),
    conversationHistory: ConversationHistorySchema
}).strict();
// 8. 解答之書
export const AnswerbookInputSchema = z.object({
    mode: z.enum(["direct", "question"]).optional().default("direct").describe("direct 直接默念；question 輸入問題由 AI 解讀"),
    question: z.string().optional().describe("問題模式使用的具體問題；直接模式可省略"),
    lang: z.enum(["zh-tw", "zh-cn"]).optional().default("zh-tw"),
    conversationHistory: ConversationHistorySchema
}).strict();
export function registerDivinationTools(server) {
    // 1. Qimen
    server.registerTool("qimen_divination", {
        title: "Qimen Dunjia Professional Divination",
        description: "Get professional Qimen Dunjia (奇門遁甲) chart calculation and analysis.",
        inputSchema: QimenInputSchema,
        annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true }
    }, async (params) => {
        const response = await makeApiRequest("ask", {
            question: params.question,
            datetime: params.datetime,
            purpose: params.purpose
        });
        return {
            content: [{ type: "text", text: response.answer || response.fallback || response.error || "No response received." }]
        };
    });
    // 2. Meihua
    server.registerTool("meihua_divination", {
        title: "Meihua Yishu Divination",
        description: "Get Meihua Yishu (梅花易數) calculation and analysis.",
        inputSchema: MeihuaInputSchema,
        annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true }
    }, async (params) => {
        const response = await makeApiRequest("meihua-question", {
            question: params.question,
            method: params.method,
            purpose: params.purpose
        });
        return {
            content: [{ type: "text", text: response.answer || response.error || "No response received." }]
        };
    });
    // 3. Tarot
    server.registerTool("tarot_divination", {
        title: "Tarot Professional Reading",
        description: "Draw authentic 78-card Tarot spread with weighted position mechanics.",
        inputSchema: TarotInputSchema,
        annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true }
    }, async (params) => {
        const response = await makeApiRequest("tarot-question", params);
        return {
            content: [{
                    type: "text",
                    text: JSON.stringify({
                        analysis: response.answer || response.analysis || null,
                        reading: response.reading || response.result || null,
                        error: response.error || null
                    }, null, 2)
                }]
        };
    });
    // 4. Fengshui
    server.registerTool("fengshui_consultation", {
        title: "Feng Shui Professional Analysis",
        description: "San-Yuan Xuan-Kong 24-mountain flying stars, shaqi remedies, and zeri.",
        inputSchema: FengShuiInputSchema,
        annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true }
    }, async (params) => {
        const response = await makeApiRequest("fengshui-question", params);
        return {
            content: [{
                    type: "text",
                    text: JSON.stringify({
                        analysis: response.answer || response.analysis || null,
                        report: response.report || response.result || null,
                        error: response.error || null
                    }, null, 2)
                }]
        };
    });
    // 5. Bazi2
    server.registerTool("bazi2_analysis", {
        title: "Bazi Professional Analysis",
        description: "Authentic Four Pillars of Destiny calculation with complete 20+ shensha and luck cycles.",
        inputSchema: Bazi2InputSchema,
        annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true }
    }, async (params) => {
        const response = await makeApiRequest("bazi2-question", params);
        return {
            content: [{
                    type: "text",
                    text: JSON.stringify({
                        analysis: response.answer || response.analysis || null,
                        chart: response.chart || response.result || null,
                        error: response.error || null
                    }, null, 2)
                }]
        };
    });
    // 6. Ziwei
    server.registerTool("ziwei_analysis", {
        title: "Ziwei Doushu Professional Analysis",
        description: "Authentic Ziwei Doushu 12-palace astrological chart with 18 classical patterns and sihua.",
        inputSchema: ZiweiInputSchema,
        annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true }
    }, async (params) => {
        const response = await makeApiRequest("ziwei-question", params);
        return {
            content: [{
                    type: "text",
                    text: JSON.stringify({
                        analysis: response.answer || response.analysis || null,
                        chart: response.chart || response.result || null,
                        error: response.error || null
                    }, null, 2)
                }]
        };
    });
    // 7. Yinyuan
    server.registerTool("yinyuan_reading", {
        title: "Yinyuan Relationship Analysis",
        description: "Authentic Moon Old relationship divination with 6 specialized modes.",
        inputSchema: YinyuanInputSchema,
        annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true }
    }, async (params) => {
        const response = await makeApiRequest("yinyuan-question", params);
        return {
            content: [{
                    type: "text",
                    text: JSON.stringify({
                        analysis: response.answer || response.analysis || null,
                        result: response.result || null,
                        error: response.error || null
                    }, null, 2)
                }]
        };
    });
    // 8. Answerbook
    server.registerTool("answerbook_reading", {
        title: "Book of Answers Oracle",
        description: "333 classic answers book oracle for instant intuitive clarity.",
        inputSchema: AnswerbookInputSchema,
        annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true }
    }, async (params) => {
        const response = await makeApiRequest("answerbook-question", params);
        return {
            content: [{
                    type: "text",
                    text: JSON.stringify({
                        analysis: response.answer || response.analysis || null,
                        rawAnswer: response.rawAnswer || response.result || null,
                        error: response.error || null
                    }, null, 2)
                }]
        };
    });
}
//# sourceMappingURL=divination.js.map