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
				"奇門遁甲即時起盤與解讀。請提供具體問題與分析目的（如事業、財運、婚姻、健康、學業），取得盤面與可執行建議。",
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
						enum: ["綜合", "求財", "事業", "感情", "考試", "健康", "出行", "官司", "財運", "婚姻", "學業"],
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

		// 2. 奇門遁甲針對目前盤面追問
		qimen_question: {
			name: "qimen_question",
			description: "針對目前頁面上的奇門遁甲盤面提出問題，取得直接解讀與行動建議。",
			inputSchema: {
				type: "object",
				properties: {
					question: { type: "string", description: "想針對目前盤面詢問的具體問題" },
					purpose: { type: "string", enum: ["綜合", "求財", "事業", "感情", "考試", "健康", "出行", "官司"], description: "占問事項類別" },
					conversationHistory: { type: "array", description: "可選的續問對話歷史" },
					lang: { type: "string", enum: ["zh-tw", "zh-cn"], description: "回答語言" }
				},
				required: ["question"]
			},
			annotations: { readOnlyHint: false, untrustedContentHint: false },
			execute: async (args) => {
				const question = args?.question ? String(args.question).trim() : "";
				if (!question) throw new Error("請提供問題內容 (question)");
				const payload = {
					qimenData: typeof window !== "undefined" ? window.qimenData || {} : {},
					userQuestion: question,
					purpose: args?.purpose || "綜合",
					conversationHistory: args?.conversationHistory || [],
					lang: args?.lang || "zh-tw"
				};
				const res = await fetch("/api/llm-analysis", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(payload)
				});
				const data = await res.json();
				if (!data.success) throw new Error(data.message || data.error || "奇門解讀失敗");
				return data.analysis || data.answer || "";
			}
		},

		// 3. 奇門遁甲自定義排盤
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

		// 7. 梅花易數時間起卦
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
						method: "time",
						datetime: customDateTime,
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

				if (typeof window !== "undefined" && typeof window.updateResult === "function") {
					window.updateResult(data.data);
				}

				showAgentFeedback(`梅花起卦成功：${data.data.bengua.name}`);
				return JSON.stringify(data.data, null, 2);
			},
		},

		// 8. 梅花易數數字起卦
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
						method: "number",
						num1,
						num2,
						num3,
					}),
				});
				const data = await res.json();
				if (!data.success) {
					throw new Error(data.message || "梅花數字起卦失敗");
				}

				if (typeof window !== "undefined" && typeof window.updateResult === "function") {
					window.updateResult(data.data);
				}

				showAgentFeedback(`梅花起卦成功：${data.data.bengua.name}`);
				return JSON.stringify(data.data, null, 2);
			},
		},

		// 8. 梅花易數漢字報字起卦
		meihua_qigua_text: {
			name: "meihua_qigua_text",
			description:
				"梅花易數漢字報字起卦。輸入任意漢字，依筆畫計算上下卦與動爻，展開本互變錯綜五卦全息盤面。",
			inputSchema: {
				type: "object",
				properties: {
					text: {
						type: "string",
						description: "起卦漢字字串（如「吉祥」、「平安喜樂」）",
					},
					purpose: {
						type: "string",
						description: "占卜目的",
					},
				},
				required: ["text"],
			},
			annotations: {
				readOnlyHint: false,
				untrustedContentHint: false,
			},
			execute: async (args) => {
				const text = String(args?.text || "").trim();
				showAgentFeedback(`梅花漢字起卦: ${text}`);

				const res = await fetch("/api/meihua/qigua", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						method: "text",
						text,
						purpose: args?.purpose || "綜合",
					}),
				});
				const data = await res.json();
				if (!data.success) {
					throw new Error(data.message || "梅花漢字起卦失敗");
				}

				if (typeof window !== "undefined" && typeof window.updateResult === "function") {
					window.updateResult(data.data);
				}

				showAgentFeedback(`梅花起卦成功：${data.data.bengua.name}`);
				return JSON.stringify(data.data, null, 2);
			},
		},

		// 10. 梅花易數目前卦象追問
		meihua_question: {
			name: "meihua_question",
			description: "針對目前梅花易數卦象提出問題，取得卦象解讀與行動建議。",
			inputSchema: {
				type: "object",
				properties: {
					question: { type: "string", description: "想針對目前卦象詢問的具體問題" },
					purpose: { type: "string", enum: ["綜合", "求財", "事業", "感情", "考試", "健康", "出行", "官司"], description: "占問事項類別" },
					conversationHistory: { type: "array", description: "可選的續問對話歷史" },
					lang: { type: "string", enum: ["zh-tw", "zh-cn"], description: "回答語言" }
				},
				required: ["question"]
			},
			annotations: { readOnlyHint: false, untrustedContentHint: false },
			execute: async (args) => {
				const question = args?.question ? String(args.question).trim() : "";
				if (!question) throw new Error("請提供問題內容 (question)");
				let meihuaData = typeof window !== "undefined" ? window.currentMeihuaData : null;
				if (!meihuaData) {
					const qiguaRes = await fetch("/api/meihua/qigua", {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({ method: "time", userDateTime: new Date().toISOString() })
					});
					const qiguaData = await qiguaRes.json();
					if (!qiguaData.success) throw new Error(qiguaData.error || "梅花起卦失敗");
					meihuaData = qiguaData.data;
					if (typeof window !== "undefined") {
						window.currentMeihuaData = meihuaData;
						if (typeof window.updateResult === "function") window.updateResult(meihuaData);
					}
				}
				const res = await fetch("/api/meihua/llm-analysis", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						meihuaData,
						userQuestion: question,
						purpose: args?.purpose || "綜合",
						conversationHistory: args?.conversationHistory || [],
						lang: args?.lang || "zh-tw"
					})
				});
				const data = await res.json();
				if (!data.success) throw new Error(data.message || data.error || "梅花解讀失敗");
				return data.analysis || data.answer || "";
			}
		},

		// 11. 梅花易數完整解卦
		meihua_divination: {
			name: "meihua_divination",
			description:
				"梅花易數解卦。輸入問題與占卜目的（支援時間起卦、數字起卦、漢字起卦），結合五卦全息象數提供解答與行動建議。",
			inputSchema: {
				type: "object",
				properties: {
					question: {
						type: "string",
						description: "您的具體問題或想了解的事項",
					},
					method: {
						type: "string",
						enum: ["time", "number", "text"],
						description: "起卦方式（time 時間起卦, number 數字起卦, text 漢字起卦，預設 time）",
					},
					text: {
						type: "string",
						description: "漢字起卦字串（method 為 text 時使用）",
					},
					num1: {
						type: "integer",
						description: "第一個數字（method 為 numbers 時使用）",
					},
					num2: {
						type: "integer",
						description: "第二個數字（method 為 numbers 時使用）",
					},
					num3: {
						type: "integer",
						description: "第三個數字（method 為 numbers 時使用）",
					},
					purpose: {
						type: "string",
						enum: ["綜合", "求財", "事業", "感情", "考試", "健康", "出行", "官司", "財運", "婚姻", "學業"],
						description: "占卜目的，預設「綜合」",
					},
					conversationHistory: {
						type: "array",
						description: "可選的續問對話歷史",
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

				showAgentFeedback(`梅花解卦中：「${question}」`);

				const res = await fetch("/api/meihua-question", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						question,
						purpose,
						method: args?.method || "time",
						text: args?.text,
						num1: args?.num1,
						num2: args?.num2,
						num3: args?.num3,
						conversationHistory: args?.conversationHistory
					}),
				});
				const data = await res.json();
				if (!data.success) {
					const errMsg = data.message || data.error || "解卦失敗";
					showAgentFeedback(errMsg, "error");
					return `解卦失敗：${errMsg}`;
				}

				showAgentFeedback("梅花解卦完成！");
				return data.answer;
			},
		},

	};

	function createSuiteTool(name, description, endpoint, inputSchema) {
		return {
			name,
			description,
			inputSchema,
			annotations: { readOnlyHint: false, untrustedContentHint: false },
			execute: async (args) => {
				const response = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(args || {}) });
				const data = await response.json();
				if (!data.success) throw new Error(data.error || "計算失敗");
				return JSON.stringify({
					answer: data.answer || null,
					analysis: data.analysis || null,
					mode: data.mode || null,
					result: data.result || data.reading || data.report || data.chart || null,
					metadata: data.metadata || null
				}, null, 2);
			},
		};
	}

	Object.assign(toolDefinitions, {
		ziwei_chart: createSuiteTool("ziwei_chart", "紫微斗數安星排盤、十二宮位、十四主星廟旺、生年四化、大限流年與命理解讀。", "/api/ziwei-question", {
			type: "object",
			properties: {
				question: { type: "string", description: "使用者的命理諮詢問題" },
				date: { type: "string", description: "出生日期 YYYY-MM-DD" },
				time: { type: "string", description: "出生時間 HH:mm" },
				shichen: { type: "string", enum: ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"], description: "出生時辰地支" },
				sex: { type: "string", enum: ["男", "女"], description: "性別" },
				calendar: { type: "string", enum: ["solar", "lunar"], description: "曆法" },
				leap: { type: "boolean", description: "農曆是否閏月" },
				name: { type: "string", description: "姓名或稱謂（可選）" },
				lang: { type: "string", enum: ["zh-tw", "zh-cn"], description: "回答語言" },
				conversationHistory: { type: "array", description: "可選的續問對話歷史" }
			},
			required: ["question", "date"]
		}),
		tarot_reading: createSuiteTool("tarot_reading", "塔羅牌陣抽牌與解讀（78張牌、6大牌陣與四維透鏡）。", "/api/tarot-question", {
			type: "object",
			properties: {
				question: { type: "string", description: "使用者的問題" },
				spread: { type: "string", enum: ["single", "three", "diamond", "moon", "horseshoe", "celtic"], description: "牌陣" },
				variant: { type: "string", enum: ["timeline", "situation", "relationship", "decision"], description: "三牌陣變體解讀維度" },
				time_factor: { type: "string", enum: ["morning", "afternoon", "night"], description: "時間能量因子加權" },
				timeFactor: { type: "string", enum: ["morning", "afternoon", "night"] },
				seed: { type: "string", description: "可選的可重現抽牌種子" },
				cards: { type: "array", description: "手動指定牌組（可選）" },
				lang: { type: "string", enum: ["zh-tw", "zh-cn"], description: "回答語言" },
				conversationHistory: { type: "array", description: "可選的續問對話歷史" }
			},
			required: ["question"]
		}),
		fengshui_report: createSuiteTool("fengshui_report", "八宅、九運與流年飛星、形煞化解及協紀辨方擇日風水報告與行動建議。", "/api/fengshui-question", {
			type: "object",
			properties: {
				question: { type: "string", description: "使用者的空間或擇日問題" },
				mode: { type: "string", enum: ["yangzhai", "shaqi", "zeri"], description: "風水模式：yangzhai 陽宅飛星八宅；shaqi 形煞診斷；zeri 協紀辨方擇日" },
				facing: { type: "string", enum: ["南", "北", "東", "西", "東南", "西北", "東北", "西南", "壬山丙向", "子山午向", "癸山丁向", "丑山未向", "艮山坤向", "寅山申向", "甲山庚向", "卯山酉向", "乙山辛向", "辰山戌向", "巽山乾向", "巳山亥向", "丙山壬向", "午山子向", "丁山癸向", "未山丑向", "坤山艮向", "申山寅向", "庚山甲向", "酉山卯向", "辛山乙向", "戌山辰向", "乾山巽向", "亥山巳向"], description: "房屋朝向（陽宅模式，支援8大方位與24山精確坐向）" },
				moveInYear: { type: "integer", minimum: 1, maximum: 9999, description: "入住或建造年份（陽宅模式）" },
				residentYear: { type: "integer", minimum: 1, maximum: 9999, description: "主要居住者出生年（陽宅模式）" },
				sex: { type: "string", enum: ["男", "女"], description: "主要居住者性別" },
				year: { type: "integer", minimum: 1, maximum: 9999, description: "分析流年" },
				shaType: { type: "string", enum: ["天斬煞", "路沖煞", "槍煞", "壁刀煞", "反弓煞", "反弓水", "鐮刀煞", "穿心煞", "白虎煞", "孤陽煞", "獨陰煞", "探頭煞", "頂心煞", "火形煞", "穿堂煞", "門沖床", "樑壓床", "橫樑壓頂", "樑壓灶", "門沖灶", "水火相沖", "廁居中宮", "開門見灶", "開門見廁"], description: "形煞類型（形煞模式）" },
				matter: { type: "string", enum: ["入宅/喬遷", "開業/開市", "動土/修造", "嫁娶/結婚", "open", "renovate", "marry"], description: "擇日事項（擇日模式）" },
				zeriYear: { type: "integer", description: "擇日目標年份（擇日模式）" },
				zeriMonth: { type: "integer", minimum: 1, maximum: 12, description: "擇日目標月份（擇日模式）" },
				lang: { type: "string", enum: ["zh-tw", "zh-cn"], description: "回答語言" },
				conversationHistory: { type: "array", description: "可選的續問對話歷史" }
			},
			required: ["question"]
		}),
		bazi2_chart: createSuiteTool("bazi2_chart", "生辰八字2四柱、十神藏干、神煞、旺衰格局與命理解讀。", "/api/bazi2-question", {
			type: "object",
			properties: {
				question: { type: "string", description: "使用者的命理問題" },
				date: { type: "string", description: "出生日期 YYYY-MM-DD" },
				time: { type: "string", description: "出生時間 HH:mm" },
				shichen: { type: "string", enum: ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"], description: "傳統出生時辰地支" },
				hour: { type: "integer", minimum: 0, maximum: 23, description: "出生小時 (0-23)" },
				sex: { type: "string", enum: ["男", "女"], description: "命主性別" },
				calendar: { type: "string", enum: ["solar", "lunar"], description: "曆法" },
				deceasedYear: { type: "integer", description: "已故年份上限過濾" },
				allowUnknownHour: { type: "boolean", description: "若未提供時辰則保留時柱未知" },
				name: { type: "string", description: "姓名（可選）" },
				formerName: { type: "string", description: "曾用名（可選）" },
				place: { type: "string", description: "出生地（可選）" },
				lang: { type: "string", enum: ["zh-tw", "zh-cn"], description: "回答語言" },
				conversationHistory: { type: "array", description: "可選的續問對話歷史" }
			},
			required: ["question", "date"]
		}),
		yinyuan_reading: createSuiteTool("yinyuan_reading", "月老姻緣籤（100籤）、生肖配對、紫微夫妻宮、桃花運勢、八字合婚與紅線測算指引。", "/api/yinyuan-question", {
			type: "object",
			properties: {
				question: { type: "string", description: "使用者的感情問題" },
				mode: { type: "string", enum: ["fortune", "zodiac", "red-thread", "bazi-match", "marriage-palace", "ziwei-marriage", "peach-blossom", "taohua-luck"], description: "姻緣測算模式" },
				firstYear: { type: "integer", minimum: 1, maximum: 9999, description: "第一人的出生年" },
				secondYear: { type: "integer", minimum: 1, maximum: 9999, description: "第二人的出生年" },
				firstZodiac: { type: "string", description: "第一人的生肖" },
				secondZodiac: { type: "string", description: "第二人的生肖" },
				name: { type: "string", description: "姓名" },
				sex: { type: "string", enum: ["男", "女"], description: "性別" },
				stickNum: { type: "integer", minimum: 1, maximum: 100, description: "自選靈籤號碼 (1-100)" },
				calendar: { type: "string", enum: ["solar", "lunar"], description: "曆法 (公曆或農曆)" },
				date: { type: "string", description: "出生日期 (YYYY-MM-DD)" },
				time: { type: "string", description: "出生時間 (HH:mm 或 時辰)" },
				first: { type: "object", description: "八字合婚第一方資料 (name, sex, calendar, date, time)" },
				second: { type: "object", description: "八字合婚第二方資料 (name, sex, calendar, date, time)" },
				stage: { type: "string", description: "關係交往階段" },
				seekingSex: { type: "string", enum: ["男", "女"], description: "尋找對象性別" },
				preference: { type: "string", description: "理想型特質偏好" },
				status: { type: "string", description: "目前感情狀態" },
				scope: { type: "string", description: "桃花查詢時效範圍" },
				seed: { type: "string", description: "籤詩可重現種子" },
				chart: { type: "object", description: "夫妻宮或紅線模式使用的八字命盤" },
				firstChart: { type: "object", description: "八字合婚第一份命盤" },
				secondChart: { type: "object", description: "八字合婚第二份命盤" },
				lang: { type: "string", enum: ["zh-tw", "zh-cn"], description: "回答語言" },
				conversationHistory: { type: "array", description: "可選的續問對話歷史" }
			},
			required: ["question"]
		}),
		answerbook_reading: createSuiteTool("answerbook_reading", "解答之書直接默念取得提醒，或輸入問題後請 AI 解讀。", "/api/answerbook-question", {
			type: "object",
			properties: {
				mode: { type: "string", enum: ["direct", "question"], default: "direct", description: "direct 直接默念；question 輸入問題並由 AI 解讀" },
				question: { type: "string", description: "問題模式使用的具體問題；直接模式可省略" },
				lang: { type: "string", enum: ["zh-tw", "zh-cn"], default: "zh-tw", description: "回答語言" },
				conversationHistory: { type: "array", description: "問題模式的續問對話歷史" }
			},
			required: []
		})
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
				toolDefinitions.meihua_qigua_text,
				toolDefinitions.meihua_question,
				toolDefinitions.meihua_divination,
				toolDefinitions.switch_theme,
			];
		} else if (["/ziwei", "/tarot", "/fengshui", "/bazi2", "/yinyuan", "/answerbook"].includes(pathname)) {
			const suiteTool = { "/ziwei": "ziwei_chart", "/tarot": "tarot_reading", "/fengshui": "fengshui_report", "/bazi2": "bazi2_chart", "/yinyuan": "yinyuan_reading", "/answerbook": "answerbook_reading" }[pathname];
			toolsToRegister = [toolDefinitions[suiteTool], toolDefinitions.switch_theme];
		} else {
			// Default / or /custom
			toolsToRegister = [
				toolDefinitions.qimen_divination,
				toolDefinitions.qimen_question,
				toolDefinitions.qimen_custom_paipan,
				toolDefinitions.get_current_pan,
				toolDefinitions.switch_time_mode,
				toolDefinitions.switch_theme,
				toolDefinitions.meihua_qigua_time,
				toolDefinitions.meihua_qigua_numbers,
				toolDefinitions.meihua_qigua_text,
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
	function readDeclarativeForm(form) {
		const values = {};
		for (const [key, value] of new FormData(form).entries()) {
			if (Object.prototype.hasOwnProperty.call(values, key)) {
				values[key] = Array.isArray(values[key]) ? [...values[key], value] : [values[key], value];
			} else {
				values[key] = value;
			}
		}

		const toolName = form.getAttribute("toolname");
		if (toolName === "meihua_qigua_time") {
			if (values.timeMode !== "custom") delete values.customDateTime;
			delete values.timeMode;
		}
		if (toolName === "fengshui_report" && values.zeriMatter) values.matter = values.zeriMatter;
		if (toolName === "yinyuan_reading") {
			const aliases = {
				fortuneName: "name", fortuneSex: "sex", fortuneStickNum: "stickNum", fortuneBirthDate: "birthDate", fortuneStatus: "status",
				ziweiName: "name", ziweiSex: "sex", ziweiCalendar: "calendar", ziweiDate: "date", ziweiShichen: "shichen", ziweiStatus: "status",
				taohuaBirthDate: "birthDate", taohuaYear: "firstYear", taohuaSex: "sex", taohuaStatus: "status", taohuaScope: "scope",
				zodiacRelationStage: "stage"
			};
			for (const [source, target] of Object.entries(aliases)) {
				if (values[source] !== undefined && values[source] !== "") values[target] = values[source];
				delete values[source];
			}
			if (values.mode === "bazi-match") {
				values.first = { name: values.bmName1, sex: values.bmSex1, calendar: values.bmCal1, date: values.bmDate1, time: values.bmTime1 };
				values.second = { name: values.bmName2, sex: values.bmSex2, calendar: values.bmCal2, date: values.bmDate2, time: values.bmTime2 };
				values.stage = values.bmStage;
			} else if (values.mode === "red-thread") {
				values.time = values.rtShichen;
				values.calendar = values.rtCalendar;
				values.date = values.rtDate;
				values.name = values.rtName;
				values.sex = values.rtSex;
				values.seekingSex = values.rtSeekingSex;
				values.status = values.rtStatus;
				values.preference = values.rtPreference;
			}
			for (const key of Object.keys(values)) if (/^(bm|rt)/.test(key)) delete values[key];
		}
		return values;
	}

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
					event.preventDefault();
					const tool = toolDefinitions[toolName];
					const responsePromise = tool
						? tool.execute(readDeclarativeForm(form))
						: Promise.reject(new Error(`找不到 WebMCP 工具：${toolName}`));
					if (typeof event.respondWith === "function") event.respondWith(responsePromise);
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
