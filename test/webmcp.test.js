const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const http = require("node:http");

const root = path.join(__dirname, "..");

function read(relativePath) {
	return fs.readFileSync(path.join(root, relativePath), "utf8");
}

test("WebMCP 模組載入並提供完整的工具定義", () => {
	const WebMCP = require("../public/js/webmcp");
	assert.ok(WebMCP, "WebMCP 模組必須存在");
	assert.ok(WebMCP.tools, "WebMCP.tools 必須包含工具定義");

	const expectedTools = [
		"qimen_divination",
		"qimen_question",
		"qimen_custom_paipan",
		"get_current_pan",
		"switch_time_mode",
		"switch_theme",
		"meihua_qigua_time",
		"meihua_qigua_numbers",
		"meihua_qigua_text",
		"meihua_question",
		"meihua_divination",
		"ziwei_chart",
		"tarot_reading",
		"fengshui_report",
		"bazi2_chart",
		"yinyuan_reading",
		"answerbook_reading",
		"ziwei_male_size",
		"ziwei_future_spouse",
	];

	for (const toolName of expectedTools) {
		const tool = WebMCP.tools[toolName];
		assert.ok(tool, `缺少工具定義: ${toolName}`);
		assert.equal(tool.name, toolName, `工具 name 必須為 ${toolName}`);
		assert.ok(
			typeof tool.description === "string" && tool.description.length > 0,
			`工具 ${toolName} 缺少 description`,
		);
		assert.ok(
			tool.inputSchema && typeof tool.inputSchema === "object",
			`工具 ${toolName} 缺少 inputSchema`,
		);
		assert.equal(
			tool.inputSchema.type,
			"object",
			`工具 ${toolName} 的 inputSchema 根節點必須是 object`,
		);
		assert.ok(
			typeof tool.execute === "function",
			`工具 ${toolName} 必須實作 execute 函式`,
		);
	}
});

test("奇門遁甲工具 schema 格式符合 WebMCP 標準", () => {
	const WebMCP = require("../public/js/webmcp");
	const qimenDiv = WebMCP.tools.qimen_divination;

	assert.ok(
		qimenDiv.inputSchema.properties.question,
		"qimen_divination 缺少 question 參數",
	);
	assert.ok(
		qimenDiv.inputSchema.required.includes("question"),
		"qimen_divination question 必須為必填",
	);
	assert.ok(qimenDiv.inputSchema.properties.purpose.enum.includes("綜合"));
	assert.ok(qimenDiv.inputSchema.properties.purpose.enum.includes("求財"));
	assert.ok(qimenDiv.inputSchema.properties.purpose.enum.includes("事業"));
	assert.ok(qimenDiv.inputSchema.properties.purpose.enum.includes("感情"));

	const customPan = WebMCP.tools.qimen_custom_paipan;
	assert.ok(
		customPan.inputSchema.properties.date,
		"qimen_custom_paipan 缺少 date 參數",
	);
	assert.ok(
		customPan.inputSchema.properties.time,
		"qimen_custom_paipan 缺少 time 參數",
	);
	assert.ok(customPan.inputSchema.required.includes("date"));
	assert.ok(customPan.inputSchema.required.includes("time"));
});

test("梅花易數工具 schema 格式符合 WebMCP 標準", () => {
	const WebMCP = require("../public/js/webmcp");
	const numQigua = WebMCP.tools.meihua_qigua_numbers;

	assert.ok(numQigua.inputSchema.properties.num1, "缺少 num1 參數");
	assert.ok(numQigua.inputSchema.properties.num2, "缺少 num2 參數");
	assert.ok(numQigua.inputSchema.properties.num3, "缺少 num3 參數");
	assert.equal(numQigua.inputSchema.properties.num1.minimum, 1);
	assert.equal(numQigua.inputSchema.properties.num1.maximum, 100);
	assert.deepEqual(numQigua.inputSchema.required, ["num1", "num2", "num3"]);

	const textQigua = WebMCP.tools.meihua_qigua_text;
	assert.ok(textQigua, "缺少 meihua_qigua_text 工具");
	assert.ok(textQigua.inputSchema.properties.text, "缺少 text 參數");
	assert.deepEqual(textQigua.inputSchema.required, ["text"]);
	assert.deepEqual(WebMCP.tools.meihua_divination.inputSchema.properties.method.enum, ["time", "number", "text"]);
});

test("WebMCP 梅花工具會送出 API 可接受的 canonical method", async () => {
	const WebMCP = require("../public/js/webmcp");
	const originalFetch = global.fetch;
	const requests = [];
	global.fetch = async (_url, options) => {
		requests.push(JSON.parse(options.body));
		return { json: async () => ({ success: true, data: { bengua: { name: "測試卦" } } }) };
	};
	try {
		await WebMCP.tools.meihua_qigua_time.execute({ datetime: "2026-08-29T14:30" });
		await WebMCP.tools.meihua_qigua_numbers.execute({ num1: 1, num2: 2, num3: 3 });
	} finally {
		global.fetch = originalFetch;
	}
	assert.equal(requests[0].method, "time");
	assert.equal(requests[0].datetime, "2026-08-29T14:30");
	assert.equal(requests[1].method, "number");
});

test("新增四個服務的 WebMCP schema 暴露完整輸入", () => {
	const WebMCP = require("../public/js/webmcp");
	const expectations = {
		tarot_reading: ["question", "spread", "variant", "seed"],
		fengshui_report: ["question", "mode", "facing", "moveInYear", "residentYear", "sex", "year", "shaType", "matter", "zeriYear", "zeriMonth"],
		bazi2_chart: ["question", "date", "time", "sex", "calendar", "name", "formerName", "place"],
		yinyuan_reading: ["question", "mode", "firstYear", "secondYear", "name", "sex", "stickNum", "calendar", "date", "time", "stage", "status", "scope", "seekingSex", "chart", "firstChart", "secondChart"]
	};

	for (const [toolName, fields] of Object.entries(expectations)) {
		const tool = WebMCP.tools[toolName];
		assert.ok(tool, `缺少工具：${toolName}`);
		for (const field of fields) {
			assert.ok(tool.inputSchema.properties[field], `${toolName} 缺少 ${field} schema`);
		}
	}
	assert.ok(WebMCP.tools.fengshui_report.inputSchema.properties.shaType.enum.includes("天斬煞"));
	assert.ok(!WebMCP.tools.fengshui_report.inputSchema.properties.shaType.enum.includes("tianzan"));
	assert.ok(WebMCP.tools.yinyuan_reading.inputSchema.properties.mode.enum.includes("ziwei-marriage"));
	assert.ok(!WebMCP.tools.yinyuan_reading.inputSchema.properties.mode.enum.includes("ziwei"));
});

test("WebMCP 風水佈局評估工具提供嚴格九宮與路徑契約", () => {
	const WebMCP = require("../public/js/webmcp");
	const tool = WebMCP.tools.fengshui_layout_evaluation;
	assert.ok(tool);
	assert.deepEqual(tool.inputSchema.required, ["layoutObjects"]);
	assert.equal(tool.inputSchema.additionalProperties, false);
	assert.equal(tool.inputSchema.properties.layoutObjects.minProperties, 1);
	assert.deepEqual(Object.keys(tool.inputSchema.properties.layoutObjects.properties), ["東南", "南", "西南", "東", "中", "西", "東北", "北", "西北"]);
	assert.equal(tool.inputSchema.properties.layoutObjects.properties["南"].maxItems, 63);
	assert.equal(tool.inputSchema.properties.entryPath.maxItems, 9);
	assert.deepEqual(tool.inputSchema.properties.entryPath.items.enum, ["東南", "南", "西南", "東", "中", "西", "東北", "北", "西北"]);
});

test("解答之書 WebMCP schema 支援兩種模式", () => {
	const WebMCP = require("../public/js/webmcp");
	const tool = WebMCP.tools.answerbook_reading;
	assert.ok(tool, "缺少 answerbook_reading 工具");
	assert.deepEqual(tool.inputSchema.properties.mode.enum, ["direct", "question"]);
	assert.ok(tool.inputSchema.properties.question);
	assert.ok(tool.inputSchema.properties.lang);
	assert.ok(tool.inputSchema.properties.conversationHistory);
	assert.deepEqual(tool.inputSchema.required, []);
});

test("解答之書頁面包含宣告式 WebMCP 表單與兩種操作", () => {
	const html = read("views/answerbook.html");
	assert.ok(html.includes("js/webmcp.js"));
	assert.match(html, /<form[^>]*id="answerbookForm"[^>]*toolname="answerbook_reading"/);
	assert.match(html, /toolautosubmit/);
	assert.match(html, /data-mode="direct"/);
	assert.match(html, /data-mode="question"/);
	assert.match(html, /toolparamdescription=/);
});

test("宣告式表單名稱與 imperative WebMCP 工具一致", () => {
	assert.match(read("views/index.html"), /id="qimenQuestionForm"[^>]*toolname="qimen_question"/);
	assert.match(read("views/index.html"), /id="customPanForm"[^>]*toolname="qimen_custom_paipan"/);
	const html = read("views/meihua.html");
	assert.match(html, /id="meihuaQuestionForm"[\s\S]*?toolname="meihua_question"/);
	assert.match(html, /id="meihuaTimeForm"[\s\S]*?toolname="meihua_qigua_time"/);
	assert.match(html, /id="meihuaNumberForm"[\s\S]*?toolname="meihua_qigua_numbers"/);
	assert.match(html, /id="meihuaTextForm"[\s\S]*?toolname="meihua_qigua_text"/);
});

test("宣告式 WebMCP 事件會執行工具而非回傳假成功訊息", () => {
	const source = read("public/js/webmcp.js");
	assert.match(source, /new FormData\(form\)/);
	assert.match(source, /tool\.execute\(readDeclarativeForm\(form\)\)/);
	assert.doesNotMatch(source, /Form \$\{toolName\} processed successfully/);
});

test("WebMCP 註冊器會跳過已有宣告式表單的同名工具", () => {
	const source = read("public/js/webmcp.js");
	assert.match(source, /document\.querySelectorAll\("form\[toolname\]"\)/);
	assert.match(source, /declarativeToolNames\.has\(tool\.name\)/);
	assert.match(source, /InvalidStateError: Duplicate tool name/);
});

test("風水頁面會保留宣告式報告並註冊確定性佈局評估工具", async () => {
	const previousWindow = global.window;
	const previousDocument = global.document;
	const registered = [];
	global.window = { location: { pathname: "/fengshui" } };
	global.document = {
		readyState: "loading",
		addEventListener: () => {},
		modelContext: {
			registerTool: async (tool) => {
				registered.push(tool.name);
			},
		},
		querySelectorAll: (selector) => selector === "form[toolname]"
			? [{ getAttribute: () => "fengshui_report" }]
			: [],
	};

	try {
		const WebMCP = require("../public/js/webmcp");
		await WebMCP.registerAllTools();
		assert.deepEqual(registered, ["fengshui_layout_evaluation", "switch_theme", "send_conversation_email"]);
		assert.deepEqual(WebMCP.getRegisteredTools(), ["fengshui_layout_evaluation", "switch_theme", "send_conversation_email"]);
	} finally {
		if (previousWindow === undefined) delete global.window;
		else global.window = previousWindow;
		if (previousDocument === undefined) delete global.document;
		else global.document = previousDocument;
	}
});

test("紫微頁面會保留宣告式排盤並註冊確定性男生尺寸與未來另一半工具", async () => {
	const previousWindow = global.window;
	const previousDocument = global.document;
	const registered = [];
	global.window = { location: { pathname: "/ziwei" } };
	global.document = {
		readyState: "loading",
		addEventListener: () => {},
		modelContext: {
			registerTool: async (tool) => {
				registered.push(tool.name);
			},
		},
		querySelectorAll: (selector) => selector === "form[toolname]"
			? [{ getAttribute: () => "ziwei_chart" }]
			: [],
	};

	try {
		const WebMCP = require("../public/js/webmcp");
		WebMCP.resetForTesting();
		await WebMCP.registerAllTools();
		assert.deepEqual(registered, ["ziwei_male_size", "ziwei_future_spouse", "switch_theme", "send_conversation_email"]);
		assert.deepEqual(WebMCP.getRegisteredTools(), ["ziwei_male_size", "ziwei_future_spouse", "switch_theme", "send_conversation_email"]);
	} finally {
		if (previousWindow === undefined) delete global.window;
		else global.window = previousWindow;
		if (previousDocument === undefined) delete global.document;
		else global.document = previousDocument;
	}
});

test("奇門預設頁面註冊 send_conversation_email 工具", async () => {
	const previousWindow = global.window;
	const previousDocument = global.document;
	const registered = [];
	global.window = { location: { pathname: "/" } };
	global.document = {
		readyState: "loading",
		addEventListener: () => {},
		modelContext: {
			registerTool: async (tool) => {
				registered.push(tool.name);
			},
		},
		querySelectorAll: () => [],
	};

	try {
		const WebMCP = require("../public/js/webmcp");
		WebMCP.resetForTesting();
		await WebMCP.registerAllTools();
		assert.ok(registered.includes("send_conversation_email"), "首頁必須包含 send_conversation_email 工具");
	} finally {
		if (previousWindow === undefined) delete global.window;
		else global.window = previousWindow;
		if (previousDocument === undefined) delete global.document;
		else global.document = previousDocument;
	}
});

test("術數套件頁面都提供宣告式 WebMCP 表單欄位", () => {
	const pages = {
		ziwei: ["ziweiQuestion", "ziweiDate"],
		tarot: ["tarotQuestion"],
		fengshui: ["fengshuiQuestion", "fengshuiFacing"],
		bazi2: ["baziQuestion", "baziDate"],
		yinyuan: ["yinyuanQuestion", "yinyuanMode"]
	};
	for (const [page, ids] of Object.entries(pages)) {
		const html = read(`views/${page}.html`);
		assert.match(html, /<form[^>]*id="suiteForm"[^>]*toolautosubmit/, page);
		for (const id of ids) assert.match(html, new RegExp(`<[^>]+id="${id}"[^>]*toolparamdescription=`), `${page} ${id}`);
	}
});

test("靜心問事功能已從網站移除", async (t) => {
	const app = require("../app");
	const server = http.createServer(app);

	try {
		await new Promise((resolve, reject) => {
			server.once("error", reject);
			server.listen(0, "127.0.0.1", resolve);
		});
	} catch (err) {
		if (err.code === "EPERM" || err.code === "EACCES") {
			if (t && typeof t.skip === "function") {
				t.skip(`Skipping test: environment restricts local binding (${err.code})`);
			}
			return;
		}
		throw err;
	}
	const port = server.address().port;

	try {
		const response = await fetch(`http://127.0.0.1:${port}/start`);
		assert.equal(response.status, 404);
	} finally {
		await new Promise((resolve) => server.close(resolve));
	}
});

test("樣式表包含 WebMCP :tool-form-active 與 :tool-submit-active 規則", () => {
	const styleCss = read("public/css/style-new.css");
	assert.match(styleCss, /form:tool-form-active\s*\{/);
	assert.match(styleCss, /button:tool-submit-active/);
	assert.match(styleCss, /input:tool-submit-active/);
	assert.match(styleCss, /\.webmcp-agent-indicator\s*\{/);

	const darkCss = read("public/css/dark-mode.css");
	assert.match(darkCss, /\[data-theme="dark"\]\s+form:tool-form-active/);
	assert.match(darkCss, /\[data-theme="dark"\]\s+button:tool-submit-active/);
});

test("伺服器發送 Permissions-Policy: tools=(self) 標頭", async (t) => {
	const app = require("../app");
	const server = http.createServer(app);

	try {
		await new Promise((resolve, reject) => {
			server.once("error", reject);
			server.listen(0, "127.0.0.1", resolve);
		});
	} catch (err) {
		if (err.code === "EPERM" || err.code === "EACCES") {
			if (t && typeof t.skip === "function") {
				t.skip(`Skipping test: environment restricts local binding (${err.code})`);
			}
			return;
		}
		throw err;
	}
	const port = server.address().port;

	try {
		const response = await fetch(`http://127.0.0.1:${port}/`);
		const header = response.headers.get("permissions-policy");
		assert.ok(header, "缺少 Permissions-Policy 標頭");
		assert.match(
			header,
			/tools=\(self\)/,
			"Permissions-Policy 必須設定 tools=(self)",
		);
	} finally {
		await new Promise((resolve) => server.close(resolve));
	}
});

test("WebMCP send_conversation_email 工具 schema 包含 turnstileToken 且支援自訂權杖", () => {
	const WebMCP = require("../public/js/webmcp");
	const emailTool = WebMCP.tools.send_conversation_email;
	assert.ok(emailTool, "send_conversation_email 必須存在於 WebMCP 工具庫");
	assert.ok(emailTool.inputSchema.properties.email, "email 屬性必須存在");
	assert.ok(emailTool.inputSchema.properties.turnstileToken, "turnstileToken 屬性必須存在於 inputSchema");
});

test("WebMCP send_conversation_email 工具在傳入 turnstileToken 時能正確發送載荷", async () => {
	const WebMCP = require("../public/js/webmcp");
	const emailTool = WebMCP.tools.send_conversation_email;
	const origFetch = global.fetch;
	let capturedPayload = null;

	try {
		global.fetch = async (url, opts) => {
			if (url === "/api/conversation/send-email") {
				capturedPayload = JSON.parse(opts.body);
				return {
					ok: true,
					json: async () => ({ success: true, message: "郵件寄送成功" })
				};
			}
			return { ok: false };
		};

		const res = await emailTool.execute({
			email: "tester@example.com",
			history: [{ role: "user", content: "今日運勢如何？" }],
			turnstileToken: "manual-token-xyz"
		});
		assert.equal(res, "郵件寄送成功");
		assert.equal(capturedPayload["cf-turnstile-response"], "manual-token-xyz");
		assert.equal(capturedPayload.email, "tester@example.com");
		assert.deepEqual(capturedPayload.history, [{ role: "user", content: "今日運勢如何？" }]);
	} finally {
		global.fetch = origFetch;
	}
});

test("WebMCP send_conversation_email 工具在寄送後主動重置 Turnstile widget", async () => {
	const WebMCP = require("../public/js/webmcp");
	const emailTool = WebMCP.tools.send_conversation_email;
	const origFetch = global.fetch;
	const origWindow = global.window;
	let resetCalledWith = null;

	try {
		global.window = {
			emailTurnstileWidgetId: "widget-abc-123",
			turnstile: {
				reset: (id) => {
					resetCalledWith = id;
				}
			}
		};
		global.fetch = async () => ({
			ok: true,
			json: async () => ({ success: true, message: "郵件寄送成功" })
		});

		await emailTool.execute({
			email: "tester@example.com",
			history: [{ role: "user", content: "測算" }],
			turnstileToken: "manual-token-xyz"
		});
		assert.equal(resetCalledWith, "widget-abc-123");
	} finally {
		global.fetch = origFetch;
		if (origWindow === undefined) delete global.window;
		else global.window = origWindow;
	}
});

test("WebMCP send_conversation_email 工具在缺少 history 且無全域對話時拋錯", async () => {
	const WebMCP = require("../public/js/webmcp");
	const emailTool = WebMCP.tools.send_conversation_email;
	await assert.rejects(
		async () => {
			await emailTool.execute({
				email: "tester@example.com"
			});
		},
		/目前尚無解盤或對話紀錄可供寄送/
	);
});

test("WebMCP send_conversation_email 工具在未傳入 history 時可自動讀取 window.conversationHistory", async () => {
	const WebMCP = require("../public/js/webmcp");
	const emailTool = WebMCP.tools.send_conversation_email;
	const origFetch = global.fetch;
	const origWindow = global.window;
	let capturedPayload = null;

	try {
		global.window = {
			conversationHistory: [
				{ role: "user", content: "測算" },
				{ role: "assistant", content: "大吉大利" }
			]
		};
		global.fetch = async (url, opts) => {
			capturedPayload = JSON.parse(opts.body);
			return {
				ok: true,
				json: async () => ({ success: true, message: "郵件寄送成功" })
			};
		};

		const res = await emailTool.execute({
			email: "tester@example.com",
			turnstileToken: "tok-123"
		});
		assert.equal(res, "郵件寄送成功");
		assert.deepEqual(capturedPayload.history, [
			{ role: "user", content: "測算" },
			{ role: "assistant", content: "大吉大利" }
		]);
	} finally {
		global.fetch = origFetch;
		if (origWindow === undefined) delete global.window;
		else global.window = origWindow;
	}
});

test("WebMCP send_conversation_email 工具在未傳入 history 時可自動讀取 window.meihuaConversationHistory", async () => {
	const WebMCP = require("../public/js/webmcp");
	const emailTool = WebMCP.tools.send_conversation_email;
	const origFetch = global.fetch;
	const origWindow = global.window;
	let capturedPayload = null;

	try {
		global.window = {
			meihuaConversationHistory: [
				{ role: "user", content: "梅花問事" },
				{ role: "assistant", content: "乾為天" }
			]
		};
		global.fetch = async (url, opts) => {
			capturedPayload = JSON.parse(opts.body);
			return {
				ok: true,
				json: async () => ({ success: true, message: "郵件寄送成功" })
			};
		};

		const res = await emailTool.execute({
			email: "tester@example.com",
			turnstileToken: "tok-456"
		});
		assert.equal(res, "郵件寄送成功");
		assert.deepEqual(capturedPayload.history, [
			{ role: "user", content: "梅花問事" },
			{ role: "assistant", content: "乾為天" }
		]);
	} finally {
		global.fetch = origFetch;
		if (origWindow === undefined) delete global.window;
		else global.window = origWindow;
	}
});

test("WebMCP 占卜工具執行後自動儲存歷史，供後續 send_conversation_email 無縫匯出寄送", async () => {
	const WebMCP = require("../public/js/webmcp");
	const origFetch = global.fetch;
	const origWindow = global.window;
	const origDoc = global.document;

	let emailPayload = null;

	try {
		global.window = {};
		global.document = {
			getElementById: () => null,
			querySelector: () => null,
			querySelectorAll: () => []
		};

		global.fetch = async (url, opts) => {
			if (url === "/api/qimen-question") {
				return {
					ok: true,
					json: async () => ({ success: true, answer: "奇門解析：時逢生門，大吉大利。" })
				};
			}
			if (url === "/api/conversation/send-email") {
				emailPayload = JSON.parse(opts.body);
				return {
					ok: true,
					json: async () => ({ success: true, message: "郵件寄送成功" })
				};
			}
			return { ok: false };
		};

		// 1. Agent 呼叫奇門占斷
		const qimenRes = await WebMCP.tools.qimen_divination.execute({
			question: "今年求財運勢如何？"
		});
		assert.match(qimenRes, /奇門解析/);
		assert.equal(global.window.lastQimenAnalysisText, "奇門解析：時逢生門，大吉大利。");
		assert.equal(global.window.conversationHistory.length, 2);
		assert.equal(global.window.conversationHistory[0].content, "今年求財運勢如何？");

		// 2. Agent 緊接著呼叫寄信工具，未帶入 history 參數
		const emailRes = await WebMCP.tools.send_conversation_email.execute({
			email: "client@example.com",
			turnstileToken: "tok-pass-123"
		});
		assert.equal(emailRes, "郵件寄送成功");
		assert.equal(emailPayload.email, "client@example.com");
		assert.deepEqual(emailPayload.history, [
			{ role: "user", content: "今年求財運勢如何？" },
			{ role: "assistant", content: "奇門解析：時逢生門，大吉大利。" }
		]);
	} finally {
		global.fetch = origFetch;
		if (origWindow === undefined) delete global.window;
		else global.window = origWindow;
		if (origDoc === undefined) delete global.document;
		else global.document = origDoc;
	}
});

test("WebMCP send_conversation_email 在頁面僅有單次占卜結果或卦象時能作為 fallback 匯出", async () => {
	const WebMCP = require("../public/js/webmcp");
	const origFetch = global.fetch;
	const origWindow = global.window;
	let capturedPayload = null;

	try {
		// 模擬頁面僅保留 currentMeihuaData 卦象資料，但尚未產生問答歷史
		global.window = {
			currentMeihuaData: {
				bengua: { name: "乾為天" },
				tigua: { name: "乾金" },
				yonggua: { name: "乾金" },
				wuxingRelation: "體用比和",
				timing: { timingDesc: "大吉，近期見效" }
			}
		};
		global.fetch = async (url, opts) => {
			if (url === "/api/conversation/send-email") {
				capturedPayload = JSON.parse(opts.body);
				return {
					ok: true,
					json: async () => ({ success: true, message: "郵件寄送成功" })
				};
			}
			return { ok: false };
		};

		const res = await WebMCP.tools.send_conversation_email.execute({
			email: "client2@example.com",
			turnstileToken: "tok-789"
		});
		assert.equal(res, "郵件寄送成功");
		assert.ok(capturedPayload.history.length === 1);
		assert.match(capturedPayload.history[0].content, /梅花卦象：乾為天/);
		assert.match(capturedPayload.history[0].content, /體用比和/);
	} finally {
		global.fetch = origFetch;
		if (origWindow === undefined) delete global.window;
		else global.window = origWindow;
	}
});

test("WebMCP send_conversation_email 能主動去重首頁重複的初始解讀與問答 turn", async () => {
	const WebMCP = require("../public/js/webmcp");
	const origFetch = global.fetch;
	const origWindow = global.window;
	let capturedPayload = null;

	try {
		// 模擬首頁 buildExportHistory 同時回傳了 lastQimenAnalysisText ('吉門相照')
		// 以及在 conversationHistory 中的同一回答 turn
		global.window = {
			lastQimenAnalysisText: "吉門相照，萬事順遂。",
			conversationHistory: [
				{ role: "user", content: "今日事業如何？" },
				{ role: "assistant", content: "吉門相照，萬事順遂。" }
			],
			buildExportHistory: () => [
				{ role: "assistant", content: "吉門相照，萬事順遂。" },
				{ role: "user", content: "今日事業如何？" },
				{ role: "assistant", content: "吉門相照，萬事順遂。" }
			]
		};

		global.fetch = async (url, opts) => {
			if (url === "/api/conversation/send-email") {
				capturedPayload = JSON.parse(opts.body);
				return { ok: true, json: async () => ({ success: true, message: "郵件寄送成功" }) };
			}
			return { ok: false };
		};

		const res = await WebMCP.tools.send_conversation_email.execute({
			email: "dedup@example.com",
			turnstileToken: "tok-dedup-1"
		});
		assert.equal(res, "郵件寄送成功");
		// 驗證去重後僅保留 2 筆對話問答（問＋答），去除孤立前置的重複 assistant 訊息
		assert.equal(capturedPayload.history.length, 2);
		assert.equal(capturedPayload.history[0].role, "user");
		assert.equal(capturedPayload.history[0].content, "今日事業如何？");
		assert.equal(capturedPayload.history[1].role, "assistant");
		assert.equal(capturedPayload.history[1].content, "吉門相照，萬事順遂。");
	} finally {
		global.fetch = origFetch;
		if (origWindow === undefined) delete global.window;
		else global.window = origWindow;
	}
});

test("WebMCP send_conversation_email 支援解答之書 Answerbook DOM 輸出 fallback 匯出", async () => {
	const WebMCP = require("../public/js/webmcp");
	const origFetch = global.fetch;
	const origWindow = global.window;
	const origDoc = global.document;
	let capturedPayload = null;

	try {
		global.window = {};
		global.document = {
			getElementById: (id) => {
				if (id === "answerbookAnswer") return { textContent: "一切都是最好的安排" };
				if (id === "answerbookAnalysis") return { textContent: "當下放寬心，順應自然的韻律推進。" };
				return null;
			},
			querySelector: () => null,
			querySelectorAll: () => []
		};

		global.fetch = async (url, opts) => {
			if (url === "/api/conversation/send-email") {
				capturedPayload = JSON.parse(opts.body);
				return { ok: true, json: async () => ({ success: true, message: "郵件寄送成功" }) };
			}
			return { ok: false };
		};

		const res = await WebMCP.tools.send_conversation_email.execute({
			email: "answerbook-user@example.com",
			turnstileToken: "tok-ab-123"
		});
		assert.equal(res, "郵件寄送成功");
		assert.equal(capturedPayload.history.length, 1);
		assert.match(capturedPayload.history[0].content, /【答案】一切都是最好的安排/);
		assert.match(capturedPayload.history[0].content, /【解讀】/);
	} finally {
		global.fetch = origFetch;
		if (origWindow === undefined) delete global.window;
		else global.window = origWindow;
		if (origDoc === undefined) delete global.document;
		else global.document = origDoc;
	}
});
