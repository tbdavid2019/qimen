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
    variant: z.ZodOptional<z.ZodEnum<["timeline", "relationship", "decision", "situation"]>>;
    time_factor: z.ZodOptional<z.ZodEnum<["morning", "afternoon", "night"]>>;
    timeFactor: z.ZodOptional<z.ZodEnum<["morning", "afternoon", "night"]>>;
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
    variant?: "timeline" | "relationship" | "decision" | "situation" | undefined;
    time_factor?: "morning" | "afternoon" | "night" | undefined;
    timeFactor?: "morning" | "afternoon" | "night" | undefined;
    seed?: string | undefined;
}, {
    question: string;
    spread?: "single" | "three" | "diamond" | "moon" | "horseshoe" | "celtic" | undefined;
    variant?: "timeline" | "relationship" | "decision" | "situation" | undefined;
    time_factor?: "morning" | "afternoon" | "night" | undefined;
    timeFactor?: "morning" | "afternoon" | "night" | undefined;
    seed?: string | undefined;
    lang?: "zh-tw" | "zh-cn" | undefined;
    conversationHistory?: {
        role: "user" | "assistant";
        content: string;
    }[] | undefined;
}>;
export declare const FengShuiInputSchema: z.ZodObject<{
    question: z.ZodString;
    mode: z.ZodDefault<z.ZodOptional<z.ZodEnum<["yangzhai", "shaqi", "zeri"]>>>;
    facing: z.ZodDefault<z.ZodOptional<z.ZodEnum<["南", "北", "東", "西", "東南", "西北", "東北", "西南", "壬山丙向", "子山午向", "癸山丁向", "丑山未向", "艮山坤向", "寅山申向", "甲山庚向", "卯山酉向", "乙山辛向", "辰山戌向", "巽山乾向", "巳山亥向", "丙山壬向", "午山子向", "丁山癸向", "未山丑向", "坤山艮向", "申山寅向", "庚山甲向", "酉山卯向", "辛山乙向", "戌山辰向", "乾山巽向", "亥山巳向"]>>>;
    moveInYear: z.ZodOptional<z.ZodNumber>;
    residentYear: z.ZodOptional<z.ZodNumber>;
    sex: z.ZodOptional<z.ZodEnum<["男", "女"]>>;
    year: z.ZodOptional<z.ZodNumber>;
    shaType: z.ZodOptional<z.ZodString>;
    matter: z.ZodOptional<z.ZodString>;
    zeriYear: z.ZodOptional<z.ZodNumber>;
    zeriMonth: z.ZodOptional<z.ZodNumber>;
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
    mode: "yangzhai" | "shaqi" | "zeri";
    facing: "南" | "北" | "東" | "西" | "東南" | "西北" | "東北" | "西南" | "壬山丙向" | "子山午向" | "癸山丁向" | "丑山未向" | "艮山坤向" | "寅山申向" | "甲山庚向" | "卯山酉向" | "乙山辛向" | "辰山戌向" | "巽山乾向" | "巳山亥向" | "丙山壬向" | "午山子向" | "丁山癸向" | "未山丑向" | "坤山艮向" | "申山寅向" | "庚山甲向" | "酉山卯向" | "辛山乙向" | "戌山辰向" | "乾山巽向" | "亥山巳向";
    moveInYear?: number | undefined;
    residentYear?: number | undefined;
    sex?: "男" | "女" | undefined;
    year?: number | undefined;
    shaType?: string | undefined;
    matter?: string | undefined;
    zeriYear?: number | undefined;
    zeriMonth?: number | undefined;
}, {
    question: string;
    lang?: "zh-tw" | "zh-cn" | undefined;
    conversationHistory?: {
        role: "user" | "assistant";
        content: string;
    }[] | undefined;
    mode?: "yangzhai" | "shaqi" | "zeri" | undefined;
    facing?: "南" | "北" | "東" | "西" | "東南" | "西北" | "東北" | "西南" | "壬山丙向" | "子山午向" | "癸山丁向" | "丑山未向" | "艮山坤向" | "寅山申向" | "甲山庚向" | "卯山酉向" | "乙山辛向" | "辰山戌向" | "巽山乾向" | "巳山亥向" | "丙山壬向" | "午山子向" | "丁山癸向" | "未山丑向" | "坤山艮向" | "申山寅向" | "庚山甲向" | "酉山卯向" | "辛山乙向" | "戌山辰向" | "乾山巽向" | "亥山巳向" | undefined;
    moveInYear?: number | undefined;
    residentYear?: number | undefined;
    sex?: "男" | "女" | undefined;
    year?: number | undefined;
    shaType?: string | undefined;
    matter?: string | undefined;
    zeriYear?: number | undefined;
    zeriMonth?: number | undefined;
}>;
export declare const Bazi2InputSchema: z.ZodObject<{
    question: z.ZodString;
    date: z.ZodString;
    time: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    shichen: z.ZodOptional<z.ZodEnum<["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"]>>;
    hour: z.ZodOptional<z.ZodNumber>;
    sex: z.ZodDefault<z.ZodOptional<z.ZodEnum<["男", "女"]>>>;
    calendar: z.ZodDefault<z.ZodOptional<z.ZodEnum<["solar", "lunar"]>>>;
    deceasedYear: z.ZodOptional<z.ZodNumber>;
    allowUnknownHour: z.ZodOptional<z.ZodBoolean>;
    name: z.ZodOptional<z.ZodString>;
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
    date: string;
    question: string;
    time: string;
    lang: "zh-tw" | "zh-cn";
    conversationHistory: {
        role: "user" | "assistant";
        content: string;
    }[];
    sex: "男" | "女";
    calendar: "solar" | "lunar";
    shichen?: "子" | "丑" | "寅" | "卯" | "辰" | "巳" | "午" | "未" | "申" | "酉" | "戌" | "亥" | undefined;
    hour?: number | undefined;
    deceasedYear?: number | undefined;
    allowUnknownHour?: boolean | undefined;
    name?: string | undefined;
    place?: string | undefined;
}, {
    date: string;
    question: string;
    time?: string | undefined;
    lang?: "zh-tw" | "zh-cn" | undefined;
    conversationHistory?: {
        role: "user" | "assistant";
        content: string;
    }[] | undefined;
    sex?: "男" | "女" | undefined;
    shichen?: "子" | "丑" | "寅" | "卯" | "辰" | "巳" | "午" | "未" | "申" | "酉" | "戌" | "亥" | undefined;
    hour?: number | undefined;
    calendar?: "solar" | "lunar" | undefined;
    deceasedYear?: number | undefined;
    allowUnknownHour?: boolean | undefined;
    name?: string | undefined;
    place?: string | undefined;
}>;
export declare const ZiweiInputSchema: z.ZodObject<{
    question: z.ZodString;
    date: z.ZodString;
    time: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    shichen: z.ZodOptional<z.ZodEnum<["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"]>>;
    sex: z.ZodDefault<z.ZodOptional<z.ZodEnum<["男", "女"]>>>;
    calendar: z.ZodDefault<z.ZodOptional<z.ZodEnum<["solar", "lunar"]>>>;
    leap: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
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
    date: string;
    question: string;
    time: string;
    lang: "zh-tw" | "zh-cn";
    conversationHistory: {
        role: "user" | "assistant";
        content: string;
    }[];
    sex: "男" | "女";
    calendar: "solar" | "lunar";
    leap: boolean;
    shichen?: "子" | "丑" | "寅" | "卯" | "辰" | "巳" | "午" | "未" | "申" | "酉" | "戌" | "亥" | undefined;
}, {
    date: string;
    question: string;
    time?: string | undefined;
    lang?: "zh-tw" | "zh-cn" | undefined;
    conversationHistory?: {
        role: "user" | "assistant";
        content: string;
    }[] | undefined;
    sex?: "男" | "女" | undefined;
    shichen?: "子" | "丑" | "寅" | "卯" | "辰" | "巳" | "午" | "未" | "申" | "酉" | "戌" | "亥" | undefined;
    calendar?: "solar" | "lunar" | undefined;
    leap?: boolean | undefined;
}>;
export declare const YinyuanInputSchema: z.ZodObject<{
    question: z.ZodString;
    mode: z.ZodDefault<z.ZodOptional<z.ZodEnum<["fortune", "zodiac", "red-thread", "bazi-match", "ziwei-marriage", "marriage-palace", "peach-blossom", "taohua-luck"]>>>;
    firstZodiac: z.ZodOptional<z.ZodString>;
    secondZodiac: z.ZodOptional<z.ZodString>;
    firstYear: z.ZodOptional<z.ZodNumber>;
    secondYear: z.ZodOptional<z.ZodNumber>;
    stickNum: z.ZodOptional<z.ZodNumber>;
    date: z.ZodOptional<z.ZodString>;
    birthDate: z.ZodOptional<z.ZodString>;
    first: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    second: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    status: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    stage: z.ZodOptional<z.ZodString>;
    seekingSex: z.ZodOptional<z.ZodString>;
    preference: z.ZodOptional<z.ZodString>;
    scope: z.ZodOptional<z.ZodString>;
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
    status: string;
    question: string;
    lang: "zh-tw" | "zh-cn";
    conversationHistory: {
        role: "user" | "assistant";
        content: string;
    }[];
    mode: "fortune" | "zodiac" | "red-thread" | "bazi-match" | "ziwei-marriage" | "marriage-palace" | "peach-blossom" | "taohua-luck";
    date?: string | undefined;
    seed?: string | undefined;
    firstZodiac?: string | undefined;
    secondZodiac?: string | undefined;
    firstYear?: number | undefined;
    secondYear?: number | undefined;
    stickNum?: number | undefined;
    birthDate?: string | undefined;
    first?: Record<string, any> | undefined;
    second?: Record<string, any> | undefined;
    stage?: string | undefined;
    seekingSex?: string | undefined;
    preference?: string | undefined;
    scope?: string | undefined;
}, {
    question: string;
    status?: string | undefined;
    date?: string | undefined;
    seed?: string | undefined;
    lang?: "zh-tw" | "zh-cn" | undefined;
    conversationHistory?: {
        role: "user" | "assistant";
        content: string;
    }[] | undefined;
    mode?: "fortune" | "zodiac" | "red-thread" | "bazi-match" | "ziwei-marriage" | "marriage-palace" | "peach-blossom" | "taohua-luck" | undefined;
    firstZodiac?: string | undefined;
    secondZodiac?: string | undefined;
    firstYear?: number | undefined;
    secondYear?: number | undefined;
    stickNum?: number | undefined;
    birthDate?: string | undefined;
    first?: Record<string, any> | undefined;
    second?: Record<string, any> | undefined;
    stage?: string | undefined;
    seekingSex?: string | undefined;
    preference?: string | undefined;
    scope?: string | undefined;
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
export declare function registerDivinationTools(server: McpServer): void;
//# sourceMappingURL=divination.d.ts.map