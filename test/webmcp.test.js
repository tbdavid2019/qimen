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

test("靜心問事功能已從網站移除", async () => {
	const app = require("../app");
	const server = http.createServer(app);
	await new Promise((resolve) => server.listen(0, resolve));
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

test("伺服器發送 Permissions-Policy: tools=(self) 標頭", async () => {
	const app = require("../app");
	const server = http.createServer(app);

	await new Promise((resolve) => server.listen(0, resolve));
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
