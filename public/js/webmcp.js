((root, factory) => {
	const api = factory();
	if (typeof module === "object" && module.exports) {
		module.exports = api;
	}
	if (root) {
		root.WebMCP = api;
	}
})(typeof globalThis !== "undefined" ? globalThis : this, () => {
	/**
	 * Helper to get document.modelContext or navigator.modelContext
	 * (Chrome 150+ uses document.modelContext, older previews used navigator.modelContext)
	 */
	function getModelContext() {
		if (typeof document !== "undefined" && document.modelContext) {
			return document.modelContext;
		}
		if (typeof navigator !== "undefined" && navigator.modelContext) {
			return navigator.modelContext;
		}
		return null;
	}

	/**
	 * Show a temporary feedback toast when an agent activates a WebMCP tool
	 */
	function showAgentFeedback(message, type) {
		if (typeof document === "undefined") return;
		let existing = document.getElementById("webmcp-agent-indicator");
		if (!existing) {
			existing = document.createElement("div");
			existing.id = "webmcp-agent-indicator";
			existing.className = "webmcp-agent-indicator";
			document.body.appendChild(existing);
		}
		existing.textContent = `🤖 WebMCP: ${message}`;
		existing.classList.remove("active", "error");
		if (type === "error") {
			existing.classList.add("error");
		}
		existing.classList.add("active");

		setTimeout(() => {
			if (existing?.classList.contains("active")) {
				existing.classList.remove("active");
			}
		}, 4000);
	}

	/**
	 * Tool Definitions conforming to Chrome WebMCP Specifications
	 */
	const toolDefinitions = {
		// 1. 奇門遁甲問答占卜
		qimen_divination: {
			name: "qimen_divination",
			description:
				"奇門遁甲即時起盤與 AI 大師深度解讀。請提供具體問題與分析目的（如事業、財運、婚姻、健康、學業），將為您排盤並透過大師深度分析。",
			inputSchema: {
				type: "object",
				properties: {
					question: {
						type: "string",
						description:
							"您想占卜的具體問題或當前狀況描述（例如：今天適合換工作嗎？這項投資前景如何？）",
					},
					purpose: {
						type: "string",
						enum: ["綜合", "事業", "財運", "婚姻", "健康", "學業"],
						description: "占卜目的，預設為「綜合」",
					},
					datetime: {
						type: "string",
						description:
							"選擇性自定義時間（ISO 8601 格式，如 2026-08-23T14:30:00），預設為當前時間",
					},
					mode: {
						type: "string",
						enum: ["advanced", "traditional"],
						description:
							"時間精度模式：advanced (進階九時段模式) 或 traditional (傳統模式)，預設 advanced",
					},
				},
				required: ["question"],
			},
			annotations: {
				readOnlyHint: false,
				untrustedContentHint: false,
			},
			execute: async (args) => {
				const question = args?.question ? String(args.question).trim() : "";
				if (!question) {
					throw new Error("請提供問題內容 (question)");
				}
				const purpose = args?.purpose || "綜合";
				const mode = args?.mode || "advanced";
				const datetime = args?.datetime ? args.datetime : null;

				showAgentFeedback(`奇門遁甲解盤中：「${question}」`);

				// If on Qimen page with question form, sync UI
				const userQuestionEl = document.getElementById("userQuestion");
				if (userQuestionEl) {
					userQuestionEl.value = question;
				}

				const payload = {
					question,
					purpose,
					mode,
					datetime,
				};

				try {
					const res = await fetch("/api/qimen-question", {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify(payload),
					});
					const data = await res.json();
					if (!data.success) {
						const errMsg = data.message || data.error || "奇門解盤失敗";
						showAgentFeedback(errMsg, "error");
						return `解盤失敗：${errMsg}`;
					}

					// If on page and conversation history container exists, display response
					const respDiv = document.getElementById("llmQuestionResponse");
					if (respDiv) {
						const respContent = respDiv.querySelector(".response-content");
						if (respContent) {
							if (typeof window.MarkdownRenderer !== "undefined") {
								respContent.innerHTML = window.MarkdownRenderer.render(
									data.answer,
								);
							} else {
								respContent.textContent = data.answer;
							}
						}
						respDiv.style.display = "block";
					}

					showAgentFeedback("奇門解盤完成！");
					return data.answer;
				} catch (err) {
					showAgentFeedback(`網路連線失敗: ${err.message}`, "error");
					throw err;
				}
			},
		},

		// 2. 奇門遁甲自定義排盤
		qimen_custom_paipan: {
			name: "qimen_custom_paipan",
			description:
				"奇門遁甲自定義排盤。設定排盤類型、排盤方法、時間精度模式、日期、時間、地點與分析目的，並前往該盤結果。",
			inputSchema: {
				type: "object",
				properties: {
					date: {
						type: "string",
						description: "排盤日期 (格式 YYYY-MM-DD，如 2026-08-23)",
					},
					time: {
						type: "string",
						description: "排盤時間 (格式 HH:mm，如 14:30)",
					},
					type: {
						type: "string",
						enum: ["四柱"],
						description: "排盤類型（預設四柱）",
					},
					method: {
						type: "string",
						enum: ["時家", "日家", "月家", "年家"],
						description: "排盤方法（時家、日家、月家、年家，預設時家）",
					},
					timePrecisionMode: {
						type: "string",
						enum: ["advanced", "traditional"],
						description:
							"時間精度模式（advanced 進階九時段 或 traditional 傳統時辰）",
					},
					location: {
						type: "string",
						description: "地點名稱（如：台北市、高雄市）",
					},
					purpose: {
						type: "string",
						enum: ["綜合", "事業", "財運", "婚姻", "健康", "學業"],
						description: "占卜目的",
					},
				},
				required: ["date", "time"],
			},
			annotations: {
				readOnlyHint: false,
				untrustedContentHint: false,
			},
			execute: async (args) => {
				const date = args.date;
				const time = args.time;
				const type = args.type || "四柱";
				const method = args.method || "時家";
				const mode = args.timePrecisionMode || "advanced";
				const location = args.location || "";
				const purpose = args.purpose || "綜合";

				showAgentFeedback(`執行自定義排盤: ${date} ${time}`);

				const query = new URLSearchParams({
					type,
					method,
					timePrecisionMode: mode,
					date,
					time,
					location,
					purpose,
				});

				const targetUrl = `/custom?${query.toString()}`;
				if (typeof window !== "undefined") {
					window.location.href = targetUrl;
				}
				return `已觸發奇門自定義排盤導覽，目標網址: ${targetUrl}`;
			},
		},

		// 3. 獲取當前奇門盤結構化資訊
		get_current_pan: {
			name: "get_current_pan",
			description:
				"獲取當前頁面上的奇門遁甲盤結構化資料（包括局數、旬首、四柱干支、九宮八門九星八神排布）。",
			inputSchema: {
				type: "object",
				properties: {},
			},
			annotations: {
				readOnlyHint: true,
				untrustedContentHint: false,
			},
			execute: async () => {
				if (typeof window !== "undefined" && window.qimenData) {
					return JSON.stringify(window.qimenData, null, 2);
				}
				const scriptEl = document.getElementById("qimen-data");
				if (scriptEl?.textContent) {
					return scriptEl.textContent;
				}
				return JSON.stringify({ message: "當前頁面未載入奇門排盤數據" });
			},
		},

		// 4. 切換時間精度模式
		switch_time_mode: {
			name: "switch_time_mode",
			description:
				"切換奇門遁甲時間精度模式（advanced 進階九時段模式 或 traditional 傳統時辰模式）。",
			inputSchema: {
				type: "object",
				properties: {
					mode: {
						type: "string",
						enum: ["advanced", "traditional"],
						description: "欲切換的模式",
					},
				},
				required: ["mode"],
			},
			annotations: {
				readOnlyHint: false,
				untrustedContentHint: false,
			},
			execute: async (args) => {
				const mode = args?.mode ? args.mode : "advanced";
				showAgentFeedback(`切換時間精度模式至: ${mode}`);

				const currentUrl = new URL(window.location.href);
				if (mode === "advanced") {
					currentUrl.searchParams.delete("timePrecisionMode");
				} else {
					currentUrl.searchParams.set("timePrecisionMode", "traditional");
				}
				window.location.href = currentUrl.toString();
				return `已切換時間精度模式為: ${mode}`;
			},
		},

		// 5. 切換主題風格
		switch_theme: {
			name: "switch_theme",
			description: "切換網站介面主題顏色（dark 暗黑模式 或 light 明亮模式）。",
			inputSchema: {
				type: "object",
				properties: {
					theme: {
						type: "string",
						enum: ["dark", "light"],
						description: "欲切換的主題",
					},
				},
				required: ["theme"],
			},
			annotations: {
				readOnlyHint: false,
				untrustedContentHint: false,
			},
			execute: async (args) => {
				const theme = args?.theme ? args.theme : "dark";
				showAgentFeedback(`切換主題至: ${theme}`);
				document.documentElement.setAttribute("data-theme", theme);
				try {
					localStorage.setItem("theme", theme);
				} catch (_e) {}

				const toggle = document.getElementById("darkModeToggle");
				if (toggle) {
					const isDark = theme === "dark";
					toggle.setAttribute("aria-pressed", isDark ? "true" : "false");
					const label = toggle.querySelector(".dark-mode-label");
					if (label) {
						label.textContent = isDark
							? toggle.getAttribute("data-label-dark") || "明亮"
							: toggle.getAttribute("data-label-light") || "暗黑";
					}
				}
				return `主題已切換為 ${theme}`;
			},
		},

		// 6. 梅花易數時間起卦
		meihua_qigua_time: {
			name: "meihua_qigua_time",
			description:
				"梅花易數時間起卦。使用當前時間或指定自定義時間進行起卦，回傳本卦、互卦、變卦、體用五行生剋與爻辭。",
			inputSchema: {
				type: "object",
				properties: {
					datetime: {
						type: "string",
						description:
							"選擇性自定義起卦時間（格式 YYYY-MM-DDTHH:mm），留空則使用當前時間",
					},
				},
			},
			annotations: {
				readOnlyHint: false,
				untrustedContentHint: false,
			},
			execute: async (args) => {
				const customDateTime = args?.datetime ? args.datetime : null;
				showAgentFeedback("梅花易數時間起卦中...");

				let payload;
				if (customDateTime) {
					const parsed = new Date(customDateTime);
					payload = {
						method: "custom_time",
						customDateTime: customDateTime,
						userDateTime: customDateTime,
						timestamp: parsed.getTime(),
						timezoneOffset: parsed.getTimezoneOffset(),
					};
				} else {
					const now = new Date();
					const year = now.getFullYear();
					const month = String(now.getMonth() + 1).padStart(2, "0");
					const day = String(now.getDate()).padStart(2, "0");
					const hours = String(now.getHours()).padStart(2, "0");
					const minutes = String(now.getMinutes()).padStart(2, "0");
					const seconds = String(now.getSeconds()).padStart(2, "0");
					const userDateTime = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
					payload = {
						method: "time",
						userDateTime: userDateTime,
						timestamp: now.getTime(),
						timezoneOffset: now.getTimezoneOffset(),
					};
				}

				const res = await fetch("/api/meihua/qigua", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(payload),
				});
				const data = await res.json();
				if (!data.success) {
					throw new Error(data.message || "梅花起卦失敗");
				}

				if (typeof window.updateResult === "function") {
					window.updateResult(data.data);
				}

				showAgentFeedback(`梅花起卦成功：${data.data.bengua.name}`);
				return JSON.stringify(data.data, null, 2);
			},
		},

		// 7. 梅花易數數字起卦
		meihua_qigua_numbers: {
			name: "meihua_qigua_numbers",
			description:
				"梅花易數數字起卦。提供三個 1 到 100 之間的數字，計算上卦、下卦與動爻。",
			inputSchema: {
				type: "object",
				properties: {
					num1: {
						type: "integer",
						minimum: 1,
						maximum: 100,
						description: "第一個數字（1-100，計算上卦）",
					},
					num2: {
						type: "integer",
						minimum: 1,
						maximum: 100,
						description: "第二個數字（1-100，計算下卦）",
					},
					num3: {
						type: "integer",
						minimum: 1,
						maximum: 100,
						description: "第三個數字（1-100，計算動爻）",
					},
				},
				required: ["num1", "num2", "num3"],
			},
			annotations: {
				readOnlyHint: false,
				untrustedContentHint: false,
			},
			execute: async (args) => {
				const num1 = Number.parseInt(args.num1, 10);
				const num2 = Number.parseInt(args.num2, 10);
				const num3 = Number.parseInt(args.num3, 10);

				showAgentFeedback(`梅花數字起卦: ${num1}, ${num2}, ${num3}`);

				const res = await fetch("/api/meihua/qigua", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						method: "numbers",
						num1,
						num2,
						num3,
					}),
				});
				const data = await res.json();
				if (!data.success) {
					throw new Error(data.message || "梅花數字起卦失敗");
				}

				if (typeof window.updateResult === "function") {
					window.updateResult(data.data);
				}

				showAgentFeedback(`梅花起卦成功：${data.data.bengua.name}`);
				return JSON.stringify(data.data, null, 2);
			},
		},

		// 8. 梅花易數大師解卦
		meihua_divination: {
			name: "meihua_divination",
			description:
				"梅花易數大師解卦。輸入問題與占卜目的，結合卦象進行深度解答與吉凶決策建議。",
			inputSchema: {
				type: "object",
				properties: {
					question: {
						type: "string",
						description: "您的具體問題或想了解的事項",
					},
					purpose: {
						type: "string",
						enum: ["綜合", "事業", "財運", "婚姻", "健康", "學業"],
						description: "占卜目的，預設「綜合」",
					},
				},
				required: ["question"],
			},
			annotations: {
				readOnlyHint: false,
				untrustedContentHint: false,
			},
			execute: async (args) => {
				const question = args?.question ? String(args.question).trim() : "";
				if (!question) {
					throw new Error("請提供問題內容 (question)");
				}
				const purpose = args?.purpose || "綜合";

				showAgentFeedback(`梅花大師解卦中：「${question}」`);

				const res = await fetch("/api/meihua-question", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						question,
						purpose,
						method: "time",
					}),
				});
				const data = await res.json();
				if (!data.success) {
					const errMsg = data.message || data.error || "解卦失敗";
					showAgentFeedback(errMsg, "error");
					return `解卦失敗：${errMsg}`;
				}

				showAgentFeedback("梅花大師解卦完成！");
				return data.answer;
			},
		},

		// 9. 靜心問事並起盤
		start_meditation_divination: {
			name: "start_meditation_divination",
			description: "輸入靜心問事題目，並進入奇門遁甲起盤流程。",
			inputSchema: {
				type: "object",
				properties: {
					question: {
						type: "string",
						description: "靜心後想問的題目",
					},
					mode: {
						type: "string",
						enum: ["advanced", "traditional"],
						description: "時間精度模式，預設 advanced",
					},
				},
				required: ["question"],
			},
			annotations: {
				readOnlyHint: false,
				untrustedContentHint: false,
			},
			execute: async (args) => {
				const question = args.question;
				const mode = args.mode || "advanced";
				showAgentFeedback(`靜心問事起盤：「${question}」`);

				const now = new Date();
				const userDateTime = now.toISOString().slice(0, 19);
				const targetUrl = `/?timePrecisionMode=${mode}&fromMeditation=true&userDateTime=${userDateTime}`;
				if (typeof window !== "undefined") {
					window.location.href = targetUrl;
				}
				return `已進入靜心起盤流程，跳轉至: ${targetUrl}`;
			},
		},
	};

	function createSuiteTool(name, description, endpoint) {
		return {
			name,
			description,
			inputSchema: { type: "object", properties: { question: { type: "string", description: "使用者的問題或補充說明" } } },
			annotations: { readOnlyHint: false, untrustedContentHint: false },
			execute: async (args) => {
				const response = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(args || {}) });
				const data = await response.json();
				if (!data.success) throw new Error(data.error || "計算失敗");
				return JSON.stringify(data.reading || data.report || data.chart || data.result);
			},
		};
	}

	Object.assign(toolDefinitions, {
		tarot_reading: createSuiteTool("tarot_reading", "塔羅牌陣抽牌與結構化結果。", "/api/tarot/reading"),
		fengshui_report: createSuiteTool("fengshui_report", "八宅與飛星風水報告。", "/api/fengshui/report"),
		bazi2_chart: createSuiteTool("bazi2_chart", "八字二四柱、大運與五行排盤。", "/api/bazi2/chart"),
		yinyuan_reading: createSuiteTool("yinyuan_reading", "月老姻緣、生肖、籤詩與桃花測算。", "/api/yinyuan/reading"),
	});

	/**
	 * WebMCP Controller & Registration Manager
	 */
	let registeredTools = [];
	const abortControllers = [];

	async function registerAllTools() {
		const mc = getModelContext();
		if (!mc || typeof mc.registerTool !== "function") {
			return false;
		}

		// Determine relevant tools for current page
		const pathname =
			typeof window !== "undefined" ? window.location.pathname : "";
		let toolsToRegister = [];

		if (pathname === "/meihua") {
			toolsToRegister = [
				toolDefinitions.meihua_qigua_time,
				toolDefinitions.meihua_qigua_numbers,
				toolDefinitions.meihua_divination,
				toolDefinitions.switch_theme,
			];
		} else if (["/tarot", "/fengshui", "/bazi2", "/yinyuan"].includes(pathname)) {
			const suiteTool = { "/tarot": "tarot_reading", "/fengshui": "fengshui_report", "/bazi2": "bazi2_chart", "/yinyuan": "yinyuan_reading" }[pathname];
			toolsToRegister = [toolDefinitions[suiteTool], toolDefinitions.switch_theme];
		} else if (pathname === "/start") {
			toolsToRegister = [
				toolDefinitions.start_meditation_divination,
				toolDefinitions.qimen_divination,
				toolDefinitions.switch_theme,
			];
		} else {
			// Default / or /custom
			toolsToRegister = [
				toolDefinitions.qimen_divination,
				toolDefinitions.qimen_custom_paipan,
				toolDefinitions.get_current_pan,
				toolDefinitions.switch_time_mode,
				toolDefinitions.switch_theme,
				toolDefinitions.meihua_qigua_time,
				toolDefinitions.meihua_divination,
			];
		}

		registeredTools = [];
		for (let i = 0; i < toolsToRegister.length; i++) {
			const tool = toolsToRegister[i];
			try {
				const controller = new AbortController();
				abortControllers.push(controller);
				await mc.registerTool(tool, { signal: controller.signal });
				registeredTools.push(tool.name);
			} catch (err) {
				console.warn(`[WebMCP] Failed to register tool ${tool.name}:`, err);
			}
		}

		console.log(
			`[WebMCP] Successfully registered ${registeredTools.length} tools:`,
			registeredTools,
		);
		return true;
	}

	/**
	 * Setup Declarative WebMCP Form Listeners and Window Tool Events
	 */
	function setupDeclarativeListeners() {
		if (typeof window === "undefined" || typeof document === "undefined")
			return;

		// Window events for WebMCP tool activity
		window.addEventListener("toolactivated", (event) => {
			const toolName = event.toolName || event.detail?.toolName || "unknown";
			console.log("[WebMCP] Tool activated by AI Agent:", toolName);
			showAgentFeedback(`AI 代理正在執行工具: ${toolName}`);
		});

		window.addEventListener("toolcancel", (event) => {
			const toolName = event.toolName || event.detail?.toolName || "unknown";
			console.log("[WebMCP] Tool cancelled:", toolName);
			showAgentFeedback(`工具執行已取消: ${toolName}`);
		});

		// Declarative forms: handle agentInvoked and respondWith
		document.addEventListener(
			"submit",
			(event) => {
				const form = event.target;
				if (!form || !form.getAttribute || !form.getAttribute("toolname"))
					return;

				const toolName = form.getAttribute("toolname");
				if (event.agentInvoked) {
					console.log(
						"[WebMCP] Declarative form submitted by AI Agent:",
						toolName,
					);
					if (typeof event.respondWith === "function") {
						const responsePromise = Promise.resolve(
							`Form ${toolName} processed successfully`,
						);
						event.respondWith(responsePromise);
					}
				}
			},
			true,
		);
	}

	/**
	 * Initialize on DOM ready
	 */
	function init() {
		setupDeclarativeListeners();
		registerAllTools().catch((err) => {
			console.warn("[WebMCP] Registration error:", err);
		});
	}

	if (typeof document !== "undefined") {
		if (document.readyState === "loading") {
			document.addEventListener("DOMContentLoaded", init);
		} else {
			init();
		}
	}

	return {
		tools: toolDefinitions,
		getModelContext,
		isSupported: () => !!getModelContext(),
		getRegisteredTools: () => registeredTools.slice(),
		registerAllTools,
		showAgentFeedback,
	};
});
