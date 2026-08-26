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
		"qimen_custom_paipan",
		"get_current_pan",
		"switch_time_mode",
		"switch_theme",
		"meihua_qigua_time",
		"meihua_qigua_numbers",
		"meihua_divination",
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
	assert.deepEqual(qimenDiv.inputSchema.properties.purpose.enum, [
		"綜合",
		"事業",
		"財運",
		"婚姻",
		"健康",
		"學業",
	]);

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
});

test("奇門首頁正確載入 webmcp.js 並包含宣告式 WebMCP 表單屬性", () => {
	const html = read("views/index.html");
	assert.ok(html.includes("js/webmcp.js"), "index.html 必須載入 js/webmcp.js");

	// 宣告式自定義排盤表單
	assert.match(
		html,
		/<form[^>]*id="customPanForm"[^>]*toolname="qimen_custom_paipan_tool"/,
	);
	assert.match(html, /<form[^>]*id="customPanForm"[^>]*tooldescription=/);
	assert.match(html, /<form[^>]*id="customPanForm"[^>]*toolautosubmit/);
	assert.match(html, /toolparamdescription="排盤日期/);
	assert.match(html, /toolparamdescription="排盤時間/);

	// 宣告式 AI 問答表單
	assert.match(
		html,
		/<form[^>]*id="qimenQuestionForm"[^>]*toolname="qimen_question_tool"/,
	);
	assert.match(html, /<form[^>]*id="qimenQuestionForm"[^>]*tooldescription=/);
	assert.match(html, /<form[^>]*id="qimenQuestionForm"[^>]*toolautosubmit/);
	assert.match(html, /<input[^>]*id="userQuestion"[^>]*toolparamdescription=/);
});

test("梅花頁面正確載入 webmcp.js 並包含宣告式 WebMCP 表單屬性", () => {
	const html = read("views/meihua.html");
	assert.ok(html.includes("js/webmcp.js"), "meihua.html 必須載入 js/webmcp.js");

	// 時間起卦表單
	assert.match(
		html,
		/<form[^>]*id="meihuaTimeForm"[^>]*toolname="meihua_time_qigua_tool"/,
	);
	assert.match(html, /<form[^>]*id="meihuaTimeForm"[^>]*tooldescription=/);
	assert.match(html, /<form[^>]*id="meihuaTimeForm"[^>]*toolautosubmit/);

	// 數字起卦表單
	assert.match(
		html,
		/<form[^>]*id="meihuaNumberForm"[^>]*toolname="meihua_number_qigua_tool"/,
	);
	assert.match(html, /<form[^>]*id="meihuaNumberForm"[^>]*tooldescription=/);
	assert.match(html, /<form[^>]*id="meihuaNumberForm"[^>]*toolautosubmit/);
	assert.match(html, /<input[^>]*id="meihuaNum1"[^>]*toolparamdescription=/);

	// 問答表單
	assert.match(
		html,
		/<form[^>]*id="meihuaQuestionForm"[^>]*toolname="meihua_question_tool"/,
	);
	assert.match(html, /<form[^>]*id="meihuaQuestionForm"[^>]*tooldescription=/);
	assert.match(html, /<form[^>]*id="meihuaQuestionForm"[^>]*toolautosubmit/);
});

test("新增四個服務的 WebMCP schema 暴露完整輸入", () => {
	const WebMCP = require("../public/js/webmcp");
	const expectations = {
		tarot_reading: ["question", "spread", "seed"],
		fengshui_report: ["question", "facing", "moveInYear", "residentYear", "sex", "year"],
		bazi2_chart: ["question", "date", "time", "sex", "calendar", "name", "formerName", "place"],
		yinyuan_reading: ["question", "mode", "firstYear", "secondYear", "status", "chart", "firstChart", "secondChart"]
	};

	for (const [toolName, fields] of Object.entries(expectations)) {
		const tool = WebMCP.tools[toolName];
		assert.ok(tool, `缺少工具：${toolName}`);
		for (const field of fields) {
			assert.ok(tool.inputSchema.properties[field], `${toolName} 缺少 ${field} schema`);
		}
	}
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

test("四個術數套件頁面都提供宣告式 WebMCP 表單欄位", () => {
	const pages = {
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
