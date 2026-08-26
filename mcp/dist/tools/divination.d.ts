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
export declare const TarotInputSchema: z.ZodObject<{
    question: z.ZodString;
    spread: z.ZodDefault<z.ZodOptional<z.ZodEnum<["single", "three", "diamond", "moon", "horseshoe", "celtic"]>>>;
    seed: z.ZodOptional<z.ZodString>;
    lang: z.ZodDefault<z.ZodOptional<z.ZodEnum<["zh-tw", "zh-cn"]>>>;
    conversationHistory: z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodObject<{
        role: z.ZodEnum<["user", "assistant"]>;
        content: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        role: "user" | "assistant";
        content: string;
    }, {
        role: "user" | "assistant";
        content: string;
    }>, "many">>>;
}, "strict", z.ZodTypeAny, {
    question: string;
    spread: "single" | "three" | "diamond" | "moon" | "horseshoe" | "celtic";
    lang: "zh-tw" | "zh-cn";
    conversationHistory: {
        role: "user" | "assistant";
        content: string;
    }[];
    seed?: string | undefined;
}, {
    question: string;
    spread?: "single" | "three" | "diamond" | "moon" | "horseshoe" | "celtic" | undefined;
    seed?: string | undefined;
    lang?: "zh-tw" | "zh-cn" | undefined;
    conversationHistory?: {
        role: "user" | "assistant";
        content: string;
    }[] | undefined;
}>;
export declare const FengShuiInputSchema: z.ZodObject<{
    question: z.ZodString;
    facing: z.ZodDefault<z.ZodOptional<z.ZodEnum<["南", "北", "東", "西", "東南", "西北", "東北", "西南"]>>>;
    moveInYear: z.ZodOptional<z.ZodNumber>;
    residentYear: z.ZodOptional<z.ZodNumber>;
    sex: z.ZodOptional<z.ZodEnum<["男", "女"]>>;
    year: z.ZodOptional<z.ZodNumber>;
    lang: z.ZodDefault<z.ZodOptional<z.ZodEnum<["zh-tw", "zh-cn"]>>>;
    conversationHistory: z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodObject<{
        role: z.ZodEnum<["user", "assistant"]>;
        content: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        role: "user" | "assistant";
        content: string;
    }, {
        role: "user" | "assistant";
        content: string;
    }>, "many">>>;
}, "strict", z.ZodTypeAny, {
    question: string;
    lang: "zh-tw" | "zh-cn";
    conversationHistory: {
        role: "user" | "assistant";
        content: string;
    }[];
    facing: "南" | "北" | "東" | "西" | "東南" | "西北" | "東北" | "西南";
    moveInYear?: number | undefined;
    residentYear?: number | undefined;
    sex?: "男" | "女" | undefined;
    year?: number | undefined;
}, {
    question: string;
    lang?: "zh-tw" | "zh-cn" | undefined;
    conversationHistory?: {
        role: "user" | "assistant";
        content: string;
    }[] | undefined;
    facing?: "南" | "北" | "東" | "西" | "東南" | "西北" | "東北" | "西南" | undefined;
    moveInYear?: number | undefined;
    residentYear?: number | undefined;
    sex?: "男" | "女" | undefined;
    year?: number | undefined;
}>;
export declare const Bazi2InputSchema: z.ZodObject<{
    question: z.ZodString;
    date: z.ZodString;
    time: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    sex: z.ZodDefault<z.ZodOptional<z.ZodEnum<["男", "女"]>>>;
    calendar: z.ZodDefault<z.ZodOptional<z.ZodEnum<["solar", "lunar"]>>>;
    name: z.ZodOptional<z.ZodString>;
    formerName: z.ZodOptional<z.ZodString>;
    place: z.ZodOptional<z.ZodString>;
    lang: z.ZodDefault<z.ZodOptional<z.ZodEnum<["zh-tw", "zh-cn"]>>>;
    conversationHistory: z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodObject<{
        role: z.ZodEnum<["user", "assistant"]>;
        content: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        role: "user" | "assistant";
        content: string;
    }, {
        role: "user" | "assistant";
        content: string;
    }>, "many">>>;
}, "strict", z.ZodTypeAny, {
    question: string;
    time: string;
    date: string;
    lang: "zh-tw" | "zh-cn";
    conversationHistory: {
        role: "user" | "assistant";
        content: string;
    }[];
    sex: "男" | "女";
    calendar: "solar" | "lunar";
    name?: string | undefined;
    formerName?: string | undefined;
    place?: string | undefined;
}, {
    question: string;
    date: string;
    time?: string | undefined;
    lang?: "zh-tw" | "zh-cn" | undefined;
    conversationHistory?: {
        role: "user" | "assistant";
        content: string;
    }[] | undefined;
    sex?: "男" | "女" | undefined;
    calendar?: "solar" | "lunar" | undefined;
    name?: string | undefined;
    formerName?: string | undefined;
    place?: string | undefined;
}>;
export declare const YinyuanInputSchema: z.ZodObject<{
    question: z.ZodString;
    mode: z.ZodDefault<z.ZodOptional<z.ZodEnum<["fortune", "zodiac", "red-thread", "bazi-match", "marriage-palace", "peach-blossom"]>>>;
    firstYear: z.ZodOptional<z.ZodNumber>;
    secondYear: z.ZodOptional<z.ZodNumber>;
    status: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    seed: z.ZodOptional<z.ZodString>;
    chart: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    firstChart: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    secondChart: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    lang: z.ZodDefault<z.ZodOptional<z.ZodEnum<["zh-tw", "zh-cn"]>>>;
    conversationHistory: z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodObject<{
        role: z.ZodEnum<["user", "assistant"]>;
        content: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        role: "user" | "assistant";
        content: string;
    }, {
        role: "user" | "assistant";
        content: string;
    }>, "many">>>;
}, "strict", z.ZodTypeAny, {
    question: string;
    status: string;
    lang: "zh-tw" | "zh-cn";
    conversationHistory: {
        role: "user" | "assistant";
        content: string;
    }[];
    mode: "fortune" | "zodiac" | "red-thread" | "bazi-match" | "marriage-palace" | "peach-blossom";
    seed?: string | undefined;
    firstYear?: number | undefined;
    secondYear?: number | undefined;
    chart?: Record<string, any> | undefined;
    firstChart?: Record<string, any> | undefined;
    secondChart?: Record<string, any> | undefined;
}, {
    question: string;
    status?: string | undefined;
    seed?: string | undefined;
    lang?: "zh-tw" | "zh-cn" | undefined;
    conversationHistory?: {
        role: "user" | "assistant";
        content: string;
    }[] | undefined;
    mode?: "fortune" | "zodiac" | "red-thread" | "bazi-match" | "marriage-palace" | "peach-blossom" | undefined;
    firstYear?: number | undefined;
    secondYear?: number | undefined;
    chart?: Record<string, any> | undefined;
    firstChart?: Record<string, any> | undefined;
    secondChart?: Record<string, any> | undefined;
}>;
export declare const AnswerbookInputSchema: z.ZodObject<{
    mode: z.ZodDefault<z.ZodOptional<z.ZodEnum<["direct", "question"]>>>;
    question: z.ZodOptional<z.ZodString>;
    lang: z.ZodDefault<z.ZodOptional<z.ZodEnum<["zh-tw", "zh-cn"]>>>;
    conversationHistory: z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodObject<{
        role: z.ZodEnum<["user", "assistant"]>;
        content: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        role: "user" | "assistant";
        content: string;
    }, {
        role: "user" | "assistant";
        content: string;
    }>, "many">>>;
}, "strict", z.ZodTypeAny, {
    lang: "zh-tw" | "zh-cn";
    conversationHistory: {
        role: "user" | "assistant";
        content: string;
    }[];
    mode: "question" | "direct";
    question?: string | undefined;
}, {
    question?: string | undefined;
    lang?: "zh-tw" | "zh-cn" | undefined;
    conversationHistory?: {
        role: "user" | "assistant";
        content: string;
    }[] | undefined;
    mode?: "question" | "direct" | undefined;
}>;
/**
 * Registers all divination tools onto the given server instance.
 */
export declare function registerDivinationTools(server: McpServer): void;
//# sourceMappingURL=divination.d.ts.map