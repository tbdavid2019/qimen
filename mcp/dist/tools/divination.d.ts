import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
export declare const QimenInputSchema: z.ZodObject<{
    question: z.ZodString;
    datetime: z.ZodOptional<z.ZodString>;
    purpose: z.ZodDefault<z.ZodOptional<z.ZodString>>;
}, z.core.$strict>;
export declare const MeihuaInputSchema: z.ZodObject<{
    question: z.ZodString;
    method: z.ZodDefault<z.ZodOptional<z.ZodEnum<{
        number: "number";
        time: "time";
    }>>>;
    purpose: z.ZodDefault<z.ZodOptional<z.ZodString>>;
}, z.core.$strict>;
export declare const TarotInputSchema: z.ZodObject<{
    question: z.ZodString;
    spread: z.ZodDefault<z.ZodOptional<z.ZodEnum<{
        single: "single";
        three: "three";
        diamond: "diamond";
        moon: "moon";
        horseshoe: "horseshoe";
        celtic: "celtic";
    }>>>;
    variant: z.ZodOptional<z.ZodEnum<{
        timeline: "timeline";
        relationship: "relationship";
        decision: "decision";
        situation: "situation";
    }>>;
    time_factor: z.ZodOptional<z.ZodEnum<{
        morning: "morning";
        afternoon: "afternoon";
        night: "night";
    }>>;
    timeFactor: z.ZodOptional<z.ZodEnum<{
        morning: "morning";
        afternoon: "afternoon";
        night: "night";
    }>>;
    seed: z.ZodOptional<z.ZodString>;
    lang: z.ZodDefault<z.ZodOptional<z.ZodEnum<{
        "zh-tw": "zh-tw";
        "zh-cn": "zh-cn";
    }>>>;
    conversationHistory: z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodObject<{
        role: z.ZodEnum<{
            user: "user";
            assistant: "assistant";
        }>;
        content: z.ZodString;
    }, z.core.$strip>>>>;
}, z.core.$strict>;
export declare const FengShuiInputSchema: z.ZodObject<{
    question: z.ZodString;
    mode: z.ZodDefault<z.ZodOptional<z.ZodEnum<{
        yangzhai: "yangzhai";
        shaqi: "shaqi";
        zeri: "zeri";
        "evaluate-layout": "evaluate-layout";
    }>>>;
    facing: z.ZodDefault<z.ZodOptional<z.ZodEnum<{
        東南: "東南";
        南: "南";
        西南: "西南";
        東: "東";
        西: "西";
        東北: "東北";
        北: "北";
        西北: "西北";
        壬山丙向: "壬山丙向";
        子山午向: "子山午向";
        癸山丁向: "癸山丁向";
        丑山未向: "丑山未向";
        艮山坤向: "艮山坤向";
        寅山申向: "寅山申向";
        甲山庚向: "甲山庚向";
        卯山酉向: "卯山酉向";
        乙山辛向: "乙山辛向";
        辰山戌向: "辰山戌向";
        巽山乾向: "巽山乾向";
        巳山亥向: "巳山亥向";
        丙山壬向: "丙山壬向";
        午山子向: "午山子向";
        丁山癸向: "丁山癸向";
        未山丑向: "未山丑向";
        坤山艮向: "坤山艮向";
        申山寅向: "申山寅向";
        庚山甲向: "庚山甲向";
        酉山卯向: "酉山卯向";
        辛山乙向: "辛山乙向";
        戌山辰向: "戌山辰向";
        乾山巽向: "乾山巽向";
        亥山巳向: "亥山巳向";
    }>>>;
    moveInYear: z.ZodOptional<z.ZodNumber>;
    residentYear: z.ZodOptional<z.ZodNumber>;
    sex: z.ZodOptional<z.ZodEnum<{
        男: "男";
        女: "女";
    }>>;
    year: z.ZodOptional<z.ZodNumber>;
    shaType: z.ZodOptional<z.ZodString>;
    matter: z.ZodOptional<z.ZodString>;
    zeriYear: z.ZodOptional<z.ZodNumber>;
    zeriMonth: z.ZodOptional<z.ZodNumber>;
    heading: z.ZodOptional<z.ZodNumber>;
    northReference: z.ZodOptional<z.ZodEnum<{
        magnetic: "magnetic";
        true: "true";
    }>>;
    declination: z.ZodOptional<z.ZodNumber>;
    headingSource: z.ZodOptional<z.ZodEnum<{
        sensor: "sensor";
        manual: "manual";
    }>>;
    layoutObjects: z.ZodOptional<z.ZodRecord<z.ZodEnum<{
        東南: "東南";
        南: "南";
        西南: "西南";
        東: "東";
        中: "中";
        西: "西";
        東北: "東北";
        北: "北";
        西北: "西北";
    }>, z.ZodArray<z.ZodString>>>;
    entryPath: z.ZodOptional<z.ZodArray<z.ZodEnum<{
        東南: "東南";
        南: "南";
        西南: "西南";
        東: "東";
        中: "中";
        西: "西";
        東北: "東北";
        北: "北";
        西北: "西北";
    }>>>;
    pathQuality: z.ZodOptional<z.ZodEnum<{
        unknown: "unknown";
        open: "open";
        obstructed: "obstructed";
    }>>;
    lang: z.ZodDefault<z.ZodOptional<z.ZodEnum<{
        "zh-tw": "zh-tw";
        "zh-cn": "zh-cn";
    }>>>;
    conversationHistory: z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodObject<{
        role: z.ZodEnum<{
            user: "user";
            assistant: "assistant";
        }>;
        content: z.ZodString;
    }, z.core.$strip>>>>;
}, z.core.$strict>;
export declare const FengShuiLayoutEvaluationSchema: z.ZodObject<{
    layoutObjects: z.ZodRecord<z.ZodEnum<{
        東南: "東南";
        南: "南";
        西南: "西南";
        東: "東";
        中: "中";
        西: "西";
        東北: "東北";
        北: "北";
        西北: "西北";
    }>, z.ZodArray<z.ZodString>>;
    heading: z.ZodOptional<z.ZodNumber>;
    northReference: z.ZodOptional<z.ZodEnum<{
        magnetic: "magnetic";
        true: "true";
    }>>;
    declination: z.ZodOptional<z.ZodNumber>;
    headingSource: z.ZodOptional<z.ZodEnum<{
        sensor: "sensor";
        manual: "manual";
    }>>;
    facing: z.ZodOptional<z.ZodEnum<{
        東南: "東南";
        南: "南";
        西南: "西南";
        東: "東";
        西: "西";
        東北: "東北";
        北: "北";
        西北: "西北";
        壬山丙向: "壬山丙向";
        子山午向: "子山午向";
        癸山丁向: "癸山丁向";
        丑山未向: "丑山未向";
        艮山坤向: "艮山坤向";
        寅山申向: "寅山申向";
        甲山庚向: "甲山庚向";
        卯山酉向: "卯山酉向";
        乙山辛向: "乙山辛向";
        辰山戌向: "辰山戌向";
        巽山乾向: "巽山乾向";
        巳山亥向: "巳山亥向";
        丙山壬向: "丙山壬向";
        午山子向: "午山子向";
        丁山癸向: "丁山癸向";
        未山丑向: "未山丑向";
        坤山艮向: "坤山艮向";
        申山寅向: "申山寅向";
        庚山甲向: "庚山甲向";
        酉山卯向: "酉山卯向";
        辛山乙向: "辛山乙向";
        戌山辰向: "戌山辰向";
        乾山巽向: "乾山巽向";
        亥山巳向: "亥山巳向";
    }>>;
    entryPath: z.ZodOptional<z.ZodArray<z.ZodEnum<{
        東南: "東南";
        南: "南";
        西南: "西南";
        東: "東";
        中: "中";
        西: "西";
        東北: "東北";
        北: "北";
        西北: "西北";
    }>>>;
    pathQuality: z.ZodOptional<z.ZodEnum<{
        unknown: "unknown";
        open: "open";
        obstructed: "obstructed";
    }>>;
    moveInYear: z.ZodOptional<z.ZodNumber>;
    year: z.ZodOptional<z.ZodNumber>;
}, z.core.$strict>;
export declare const Bazi2InputSchema: z.ZodObject<{
    question: z.ZodString;
    date: z.ZodString;
    time: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    shichen: z.ZodOptional<z.ZodEnum<{
        子: "子";
        丑: "丑";
        寅: "寅";
        卯: "卯";
        辰: "辰";
        巳: "巳";
        午: "午";
        未: "未";
        申: "申";
        酉: "酉";
        戌: "戌";
        亥: "亥";
    }>>;
    hour: z.ZodOptional<z.ZodNumber>;
    sex: z.ZodDefault<z.ZodOptional<z.ZodEnum<{
        男: "男";
        女: "女";
    }>>>;
    calendar: z.ZodDefault<z.ZodOptional<z.ZodEnum<{
        solar: "solar";
        lunar: "lunar";
    }>>>;
    deceasedYear: z.ZodOptional<z.ZodNumber>;
    allowUnknownHour: z.ZodOptional<z.ZodBoolean>;
    name: z.ZodOptional<z.ZodString>;
    place: z.ZodOptional<z.ZodString>;
    lang: z.ZodDefault<z.ZodOptional<z.ZodEnum<{
        "zh-tw": "zh-tw";
        "zh-cn": "zh-cn";
    }>>>;
    conversationHistory: z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodObject<{
        role: z.ZodEnum<{
            user: "user";
            assistant: "assistant";
        }>;
        content: z.ZodString;
    }, z.core.$strip>>>>;
}, z.core.$strict>;
export declare const ZiweiInputSchema: z.ZodObject<{
    question: z.ZodString;
    date: z.ZodString;
    time: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    shichen: z.ZodOptional<z.ZodEnum<{
        子: "子";
        丑: "丑";
        寅: "寅";
        卯: "卯";
        辰: "辰";
        巳: "巳";
        午: "午";
        未: "未";
        申: "申";
        酉: "酉";
        戌: "戌";
        亥: "亥";
    }>>;
    sex: z.ZodDefault<z.ZodOptional<z.ZodEnum<{
        男: "男";
        女: "女";
    }>>>;
    calendar: z.ZodDefault<z.ZodOptional<z.ZodEnum<{
        solar: "solar";
        lunar: "lunar";
    }>>>;
    leap: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    lang: z.ZodDefault<z.ZodOptional<z.ZodEnum<{
        "zh-tw": "zh-tw";
        "zh-cn": "zh-cn";
    }>>>;
    conversationHistory: z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodObject<{
        role: z.ZodEnum<{
            user: "user";
            assistant: "assistant";
        }>;
        content: z.ZodString;
    }, z.core.$strip>>>>;
}, z.core.$strict>;
export declare const ZiweiMaleSizeInputSchema: z.ZodObject<{
    date: z.ZodString;
    time: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    shichen: z.ZodOptional<z.ZodEnum<{
        子: "子";
        丑: "丑";
        寅: "寅";
        卯: "卯";
        辰: "辰";
        巳: "巳";
        午: "午";
        未: "未";
        申: "申";
        酉: "酉";
        戌: "戌";
        亥: "亥";
    }>>;
    sex: z.ZodDefault<z.ZodOptional<z.ZodEnum<{
        男: "男";
    }>>>;
    calendar: z.ZodDefault<z.ZodOptional<z.ZodEnum<{
        solar: "solar";
        lunar: "lunar";
    }>>>;
    leap: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
}, z.core.$strict>;
export declare const YinyuanInputSchema: z.ZodObject<{
    question: z.ZodString;
    mode: z.ZodDefault<z.ZodOptional<z.ZodEnum<{
        fortune: "fortune";
        zodiac: "zodiac";
        "red-thread": "red-thread";
        "bazi-match": "bazi-match";
        "ziwei-marriage": "ziwei-marriage";
        "marriage-palace": "marriage-palace";
        "peach-blossom": "peach-blossom";
        "taohua-luck": "taohua-luck";
    }>>>;
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
    lang: z.ZodDefault<z.ZodOptional<z.ZodEnum<{
        "zh-tw": "zh-tw";
        "zh-cn": "zh-cn";
    }>>>;
    conversationHistory: z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodObject<{
        role: z.ZodEnum<{
            user: "user";
            assistant: "assistant";
        }>;
        content: z.ZodString;
    }, z.core.$strip>>>>;
}, z.core.$strict>;
export declare const AnswerbookInputSchema: z.ZodObject<{
    mode: z.ZodDefault<z.ZodOptional<z.ZodEnum<{
        question: "question";
        direct: "direct";
    }>>>;
    question: z.ZodOptional<z.ZodString>;
    lang: z.ZodDefault<z.ZodOptional<z.ZodEnum<{
        "zh-tw": "zh-tw";
        "zh-cn": "zh-cn";
    }>>>;
    conversationHistory: z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodObject<{
        role: z.ZodEnum<{
            user: "user";
            assistant: "assistant";
        }>;
        content: z.ZodString;
    }, z.core.$strip>>>>;
}, z.core.$strict>;
export declare function registerDivinationTools(server: McpServer): void;
//# sourceMappingURL=divination.d.ts.map