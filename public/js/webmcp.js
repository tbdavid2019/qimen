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
		if (typeof document === "undefined" || typeof document.createElement !== "function" || !document.body) return;
		let existing = typeof document.getElementById === "function" ? document.getElementById("webmcp-agent-indicator") : null;
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
	 * Helper to ensure a valid Turnstile token is acquired for WebMCP tool execution.
	 * If token is already present or Turnstile is disabled, resolves immediately.
	 * If missing, dynamically awaits challenge resolution or polls for completed token.
	 */
	async function acquireTurnstileToken({
		containerId,
		action = "llm_analysis",
		getWidgetId,
		setWidgetId,
		explicitToken
	} = {}) {
		let turnstileToken = explicitToken ? String(explicitToken).trim() : "";
		if (turnstileToken) return turnstileToken;

		let container = typeof document !== "undefined" ? document.getElementById(containerId) : null;
		let sitekey = container?.getAttribute("data-sitekey");

		if (!sitekey && typeof fetch === "function") {
			try {
				const cfgRes = await fetch("/api/turnstile/config");
				const cfg = await cfgRes.json();
				if (cfg?.enabled && cfg?.siteKey) {
					sitekey = cfg.siteKey;
				}
			} catch (e) {}
		}

		if (!sitekey) return "";

		const widgetId = typeof getWidgetId === "function" ? getWidgetId() : null;
		if (typeof window !== "undefined" && window.turnstile && typeof window.turnstile.getResponse === "function") {
			try {
				if (widgetId !== undefined && widgetId !== null) {
					turnstileToken = window.turnstile.getResponse(widgetId);
				} else if (container) {
					turnstileToken = window.turnstile.getResponse(container);
				}
			} catch (e) {}
		}
		if (!turnstileToken && container) {
			const existingInput = container.querySelector('input[name="cf-turnstile-response"]');
			if (existingInput?.value) {
				turnstileToken = existingInput.value;
			}
		}
		if (turnstileToken) return turnstileToken;

		if (typeof window !== "undefined") {
			if (!window.turnstile && typeof document !== "undefined") {
				await new Promise((resolve, reject) => {
					if (window.turnstile) return resolve();
					const waitForTurnstile = (timeoutMs, onDone) => {
						const start = Date.now();
						const timer = setInterval(() => {
							if (window.turnstile && typeof window.turnstile.render === "function") {
								clearInterval(timer);
								onDone(true);
							} else if (Date.now() - start > timeoutMs) {
								clearInterval(timer);
								onDone(false);
							}
						}, 100);
					};
					const existing = document.querySelector('script[src*="challenges.cloudflare.com/turnstile"]');
					if (existing) {
						const onReady = () => {
							waitForTurnstile(4000, (ready) => {
								if (ready) resolve();
								else reject(new Error("Cloudflare Turnstile 驗證元件初始化超時，請於網頁完成驗證或提供 turnstileToken。"));
							});
						};
						if (existing.complete || window.turnstile) onReady();
						else {
							existing.addEventListener("load", onReady);
							existing.addEventListener("error", () => reject(new Error("無法載入 Cloudflare Turnstile 安全驗證元件。")));
						}
						return;
					}
					const script = document.createElement("script");
					script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
					script.async = true;
					script.defer = true;
					script.onload = () => {
						waitForTurnstile(4000, (ready) => {
							if (ready) resolve();
							else reject(new Error("Cloudflare Turnstile 驗證元件初始化超時，請於網頁完成驗證或提供 turnstileToken。"));
						});
					};
					script.onerror = () => reject(new Error("無法載入 Cloudflare Turnstile 安全驗證元件。"));
					document.head.appendChild(script);
				});
			}

			let activeWidgetId = typeof getWidgetId === "function" ? getWidgetId() : null;
			if ((activeWidgetId === undefined || activeWidgetId === null) && container && window.turnstile) {
				await new Promise((resolve) => {
					try {
						activeWidgetId = window.turnstile.render(container, {
							sitekey: sitekey,
							action: action,
							theme: "auto",
							size: "flexible",
							callback: (t) => {
								turnstileToken = t;
								resolve();
							},
							"expired-callback": () => { turnstileToken = ""; },
							"error-callback": () => { turnstileToken = ""; resolve(); }
						});
						if (typeof setWidgetId === "function") setWidgetId(activeWidgetId);
					} catch (e) {
						resolve();
					}
				});
			}

			if (!turnstileToken) {
				await new Promise((resolve) => {
					const start = Date.now();
					const poll = setInterval(() => {
						try {
							const wId = typeof getWidgetId === "function" ? getWidgetId() : activeWidgetId;
							const t = wId !== undefined && wId !== null
								? window.turnstile.getResponse(wId)
								: (container ? window.turnstile.getResponse(container) : "");
							if (t) {
								turnstileToken = t;
								clearInterval(poll);
								resolve();
								return;
							}
						} catch (e) {}
						if (Date.now() - start > 6000) {
							clearInterval(poll);
							resolve();
						}
					}, 150);
				});
			}
		}

		if (!turnstileToken) {
			throw new Error("請先在瀏覽器畫面中完成 Cloudflare Turnstile 人機驗證挑戰，或於參數中提供有效的 turnstileToken。");
		}
		return turnstileToken;
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
					timezone: { type: "string", description: "時區偏移（如 +08:00）" },
					lang: { type: "string", enum: ["zh-tw", "zh-cn"], description: "回答語言" },
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
				const userQuestionEl = typeof document !== "undefined" ? document.getElementById("userQuestion") : null;
				if (userQuestionEl) {
					userQuestionEl.value = question;
				}

				const payload = {
					question,
					purpose,
					mode,
					datetime,
					timezone: args?.timezone || "+08:00",
					lang: args?.lang || "zh-tw",
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

					if (typeof window !== "undefined") {
						if (!window.lastQimenAnalysisText) {
							window.lastQimenAnalysisText = data.answer;
						}
						if (!Array.isArray(window.conversationHistory)) window.conversationHistory = [];
						window.conversationHistory.push({ role: "user", content: question });
						window.conversationHistory.push({ role: "assistant", content: data.answer });
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
					lang: { type: "string", enum: ["zh-tw", "zh-cn"], description: "回答語言" },
					turnstileToken: {
						type: "string",
						description: "Cloudflare Turnstile 人機驗證權杖 (cf-turnstile-response)。可選；若頁面啟用驗證，工具會嘗試自 DOM 或全域中取得。"
					}
				},
				required: ["question"]
			},
			annotations: { readOnlyHint: false, untrustedContentHint: false },
			execute: async (args) => {
				const question = args?.question ? String(args.question).trim() : "";
				if (!question) throw new Error("請提供問題內容 (question)");

				const explicitToken = args?.turnstileToken || (args?.["cf-turnstile-response"] ? String(args["cf-turnstile-response"]).trim() : "");
				const turnstileToken = await acquireTurnstileToken({
					containerId: "question-turnstile",
					action: "llm_analysis",
					getWidgetId: () => typeof window !== "undefined" ? window.questionTurnstileWidgetId : null,
					setWidgetId: (id) => { if (typeof window !== "undefined") window.questionTurnstileWidgetId = id; },
					explicitToken
				});

				const payload = {
					qimenData: typeof window !== "undefined" ? window.qimenData || {} : {},
					userQuestion: question,
					purpose: args?.purpose || "綜合",
					conversationHistory: args?.conversationHistory || [],
					lang: args?.lang || "zh-tw"
				};
				if (turnstileToken) {
					payload["cf-turnstile-response"] = turnstileToken;
					payload.turnstileToken = turnstileToken;
				}

				let data;
				try {
					const res = await fetch("/api/llm-analysis", {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify(payload)
					});
					data = await res.json();
				} finally {
					if (typeof window !== "undefined" && typeof window.resetQuestionTurnstile === "function") {
						try { window.resetQuestionTurnstile(); } catch (e) {}
					}
				}
				if (!data?.success) throw new Error(data?.message || data?.error || "奇門解讀失敗");
				const answer = data.analysis || data.answer || "";
				if (typeof window !== "undefined") {
					if (!Array.isArray(window.conversationHistory)) window.conversationHistory = [];
					window.conversationHistory.push({ role: "user", content: question });
					window.conversationHistory.push({ role: "assistant", content: answer });
				}
				return answer;
			}
		},

		// 寄送對話紀錄至信箱 (Resend API)
		send_conversation_email: {
			name: "send_conversation_email",
			description: "透過 Resend 郵件服務將目前的占斷排盤結果與問答對話紀錄寄送到使用者的電子信箱。",
			inputSchema: {
				type: "object",
				properties: {
					email: { type: "string", description: "收件人電子郵件地址，例如 user@example.com" },
					service: { type: "string", description: "占斷服務名稱，例如 奇門遁甲、梅花易數", default: "奇門遁甲" },
					subject: { type: "string", description: "可選的自訂郵件標題" },
					history: { type: "array", description: "對話紀錄陣列，每項包含 role 與 content" },
					turnstileToken: {
						type: "string",
						description: "Cloudflare Turnstile 人機驗證權杖 (cf-turnstile-response)。可選；若未提供且頁面啟用驗證，工具將主動觸發挑戰並獲取權杖。"
					}
				},
				required: ["email"]
			},
			annotations: { readOnlyHint: false, untrustedContentHint: false },
			execute: async (args) => {
				const email = args?.email ? String(args.email).trim() : "";
				if (!email) throw new Error("請提供收件電子信箱 (email)");

				let resolvedHistory = (Array.isArray(args?.history) && args.history.length > 0) ? args.history : null;
				if (!resolvedHistory && typeof window !== "undefined") {
					if (typeof window.buildExportHistory === "function") {
						try { resolvedHistory = window.buildExportHistory(); } catch (e) {}
					}
					if ((!resolvedHistory || resolvedHistory.length === 0) && Array.isArray(window.conversationHistory) && window.conversationHistory.length > 0) {
						resolvedHistory = window.conversationHistory;
					}
					if ((!resolvedHistory || resolvedHistory.length === 0) && Array.isArray(window.meihuaConversationHistory) && window.meihuaConversationHistory.length > 0) {
						resolvedHistory = window.meihuaConversationHistory;
					}
					if (!resolvedHistory || resolvedHistory.length === 0) {
						if (window.lastQimenAnalysisText) {
							resolvedHistory = [{ role: "assistant", content: window.lastQimenAnalysisText }];
						} else if (window.currentMeihuaData) {
							const md = window.currentMeihuaData;
							const summary = `梅花卦象：${md.bengua?.name || '本卦'}（體：${md.tigua?.name || ''}，用：${md.yonggua?.name || ''}，關係：${md.wuxingRelation || ''}）${md.timing?.timingDesc ? '，應期：' + md.timing.timingDesc : ''}`;
							resolvedHistory = [{ role: "assistant", content: summary }];
						} else if (window.lastSuiteResult) {
							const sr = window.lastSuiteResult;
							const summary = typeof sr === "string" ? sr : JSON.stringify(sr, null, 2);
							resolvedHistory = [{ role: "assistant", content: summary }];
						} else if (typeof document !== "undefined") {
							const answerbookAns = document.getElementById("answerbookAnswer");
							const answerbookAnalysis = document.getElementById("answerbookAnalysis");
							if (answerbookAns && answerbookAns.textContent && answerbookAns.textContent.trim()) {
								const ans = answerbookAns.textContent.trim();
								const ana = answerbookAnalysis && answerbookAnalysis.textContent ? answerbookAnalysis.textContent.trim() : "";
								const fullText = ana ? `【答案】${ans}\n\n【解讀】\n${ana}` : `【解答之書】${ans}`;
								resolvedHistory = [{ role: "assistant", content: fullText }];
							} else {
								const domResponse = document.querySelector("#llmQuestionResponse .response-content, #conversationStream .suite-message-bubble.assistant, #meihuaLLMResponse");
								if (domResponse && domResponse.textContent && domResponse.textContent.trim()) {
									resolvedHistory = [{ role: "assistant", content: domResponse.textContent.trim() }];
								}
							}
						}
					}
				}

				// Deduplicate: if buildExportHistory prepended an initial assistant analysis that also
				// appears identically later within a user-assistant conversation turn, remove the orphaned duplicate.
				if (Array.isArray(resolvedHistory) && resolvedHistory.length > 1) {
					const first = resolvedHistory[0];
					if (first && first.role === "assistant" && first.content) {
						const firstTrimmed = String(first.content).trim();
						const duplicateLater = resolvedHistory.slice(1).some(
							(msg) => msg && msg.role === "assistant" && String(msg.content).trim() === firstTrimmed
						);
						if (duplicateLater) {
							resolvedHistory = resolvedHistory.slice(1);
						}
					}
				}

				if (!resolvedHistory || resolvedHistory.length === 0) {
					throw new Error("目前尚無解盤或對話紀錄可供寄送，請先進行解盤問答或於參數中提供 history。");
				}

				let turnstileToken = args?.turnstileToken ? String(args.turnstileToken).trim() :
					(args?.["cf-turnstile-response"] ? String(args["cf-turnstile-response"]).trim() : "");

				let emailContainer = typeof document !== "undefined" ? document.getElementById("email-turnstile") : null;
				let sitekey = emailContainer?.getAttribute("data-sitekey");

				// 若當前頁面（如紫微、八字、風水等非奇門頁面）沒有靜態的 #email-turnstile，向後端配置查詢有效狀態
				if (!turnstileToken && !sitekey && typeof fetch === "function") {
					try {
						const cfgRes = await fetch("/api/turnstile/config");
						const cfg = await cfgRes.json();
						if (cfg?.enabled && cfg?.siteKey) {
							sitekey = cfg.siteKey;
						}
					} catch (e) {}
				}

				if (!turnstileToken) {
					const existingInput = emailContainer ? emailContainer.querySelector('input[name="cf-turnstile-response"]') :
						(typeof document !== "undefined" ? document.querySelector('input[name="cf-turnstile-response"]') : null);
					if (existingInput?.value) {
						turnstileToken = existingInput.value;
					}
				}

				if (!turnstileToken && typeof window !== "undefined" && window.turnstile && typeof window.turnstile.getResponse === "function") {
					try {
						turnstileToken = window.emailTurnstileWidgetId !== undefined && window.emailTurnstileWidgetId !== null
							? window.turnstile.getResponse(window.emailTurnstileWidgetId)
							: (emailContainer ? window.turnstile.getResponse(emailContainer) : window.turnstile.getResponse());
					} catch (e) {}
				}

				// 若系統啟用 Turnstile 且尚未取得 Token，主動觸發挑戰並等待解算（跨頁面全面支援）
				if (!turnstileToken && sitekey && typeof window !== "undefined") {
					let createdFloatingContainer = false;
					if (!emailContainer && typeof document !== "undefined") {
						emailContainer = document.getElementById("webmcp-turnstile-floating");
						if (!emailContainer) {
							emailContainer = document.createElement("div");
							emailContainer.id = "webmcp-turnstile-floating";
							emailContainer.className = "turnstile-container";
							emailContainer.style.cssText = "position: fixed; bottom: 20px; right: 20px; z-index: 99999; background: #fff; padding: 12px; border-radius: 8px; box-shadow: 0 4px 16px rgba(0,0,0,0.2);";
							document.body.appendChild(emailContainer);
							createdFloatingContainer = true;
						}
					}

					if (typeof $ !== "undefined" && $("#emailConversationModal").length) {
						const $modal = $("#emailConversationModal");
						if (!$modal.hasClass("in")) {
							await new Promise((resolve) => {
								let done = false;
								const onShown = () => {
									if (!done) {
										done = true;
										resolve();
									}
								};
								$modal.one("shown.bs.modal", onShown);
								$modal.modal("show");
								setTimeout(onShown, 800);
							});
						}
					}

					try {
						// 確保 Turnstile 腳本已載入
						if (!window.turnstile && typeof document !== "undefined") {
							await new Promise((resolve, reject) => {
								if (window.turnstile) return resolve();

								const waitForTurnstile = (timeoutMs, onDone) => {
									const start = Date.now();
									const timer = setInterval(() => {
										if (window.turnstile && typeof window.turnstile.render === "function") {
											clearInterval(timer);
											onDone(true);
										} else if (Date.now() - start > timeoutMs) {
											clearInterval(timer);
											onDone(false);
										}
									}, 100);
								};

								const existing = document.querySelector('script[src*="challenges.cloudflare.com/turnstile"]');
								if (existing) {
									const onReady = () => {
										waitForTurnstile(4000, (ready) => {
											if (ready) resolve();
											else reject(new Error("Cloudflare Turnstile 驗證元件初始化超時，請重試或於參數中提供 turnstileToken。"));
										});
									};
									if (existing.complete || window.turnstile) {
										onReady();
									} else {
										existing.addEventListener("load", onReady);
										existing.addEventListener("error", () => {
											reject(new Error("無法載入 Cloudflare Turnstile 安全驗證元件，請檢查廣告攔截器或網路連線。"));
										});
									}
									return;
								}

								const script = document.createElement("script");
								script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
								script.async = true;
								script.defer = true;
								script.onload = () => {
									waitForTurnstile(4000, (ready) => {
										if (ready) resolve();
										else reject(new Error("Cloudflare Turnstile 驗證元件初始化超時，請重試或於參數中提供 turnstileToken。"));
									});
								};
								script.onerror = () => {
									reject(new Error("無法載入 Cloudflare Turnstile 安全驗證元件，請檢查廣告攔截器或網路連線。"));
								};
								document.head.appendChild(script);
							});
						}

						// 若已經有已掛載且仍連線於 DOM 之靜態 Widget，複用現有 Widget 避免 Turnstile 重複 render 錯誤
						const staticElem = document.getElementById("email-turnstile");
						const hasValidStaticWidget = Boolean(staticElem && document.body.contains(staticElem) && !createdFloatingContainer);

						// 若為首頁且靜態 Widget 正由 app.js 的 shown.bs.modal 初始化，稍候 widgetId 綁定以避免重複 render
						if (hasValidStaticWidget && (window.emailTurnstileWidgetId === undefined || window.emailTurnstileWidgetId === null)) {
							await new Promise((resolve) => {
								const startWait = Date.now();
								const pollWidget = setInterval(() => {
									if (window.emailTurnstileWidgetId !== undefined && window.emailTurnstileWidgetId !== null) {
										clearInterval(pollWidget);
										resolve();
									} else if (Date.now() - startWait > 1200) {
										clearInterval(pollWidget);
										resolve();
									}
								}, 100);
							});
						}

						if (hasValidStaticWidget && window.emailTurnstileWidgetId !== undefined && window.emailTurnstileWidgetId !== null) {
							let existingTok = "";
							try {
								existingTok = window.turnstile.getResponse(window.emailTurnstileWidgetId);
							} catch (e) {}
							if (existingTok) {
								turnstileToken = existingTok;
							} else {
								turnstileToken = await new Promise((resolve, reject) => {
									const startTime = Date.now();
									const pollTimer = setInterval(() => {
										let tok = "";
										try {
											tok = window.turnstile.getResponse(window.emailTurnstileWidgetId);
										} catch (e) {}
										if (tok) {
											clearInterval(pollTimer);
											return resolve(tok);
										}
										if (Date.now() - startTime > 8000) {
											clearInterval(pollTimer);
											reject(new Error("Turnstile 人機安全驗證尚未完成，請在畫面彈窗中完成驗證後再試，或於參數中提供 turnstileToken。"));
										}
									}, 250);
								});
							}
						} else if (window.turnstile && typeof window.turnstile.render === "function" && emailContainer) {
							turnstileToken = await new Promise((resolve, reject) => {
								let timer = setTimeout(() => {
									reject(new Error("Turnstile 人機安全驗證尚未完成，請在畫面彈窗中勾選驗證後再試，或於參數中提供 turnstileToken。"));
								}, 8000);

								try {
									const widgetId = window.turnstile.render(emailContainer, {
										sitekey: sitekey,
										action: emailContainer.getAttribute("data-action") || "send_email",
										callback: (tok) => {
											clearTimeout(timer);
											resolve(tok);
										},
										"error-callback": () => {
											clearTimeout(timer);
											reject(new Error("Turnstile 人機驗證挑戰失敗，請重試。"));
										},
										"expired-callback": () => {}
									});
									if (!createdFloatingContainer) {
										window.emailTurnstileWidgetId = widgetId;
									}
								} catch (renderErr) {
									const startTime = Date.now();
									const pollTimer = setInterval(() => {
										let tok = "";
										try {
											tok = window.turnstile.getResponse(emailContainer);
										} catch (e) {}
										if (tok) {
											clearTimeout(timer);
											clearInterval(pollTimer);
											return resolve(tok);
										}
										if (Date.now() - startTime > 7500) {
											clearTimeout(timer);
											clearInterval(pollTimer);
											reject(new Error("Turnstile 人機安全驗證尚未完成，請在畫面彈窗中完成驗證後再試，或於參數中提供 turnstileToken。"));
										}
									}, 250);
								}
							});
						}
					} finally {
						if (createdFloatingContainer && emailContainer) {
							try {
								if (window.turnstile && typeof window.turnstile.remove === "function") {
									window.turnstile.remove(emailContainer);
								}
							} catch (e) {}
							try { emailContainer.remove(); } catch (e) {}
						}
					}
				}

				const payload = {
					email: email,
					service: args?.service || "奇門遁甲",
					subject: args?.subject,
					history: resolvedHistory,
					"cf-turnstile-response": turnstileToken
				};
				try {
					const res = await fetch("/api/conversation/send-email", {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify(payload)
					});
					const data = await res.json();
					if (!data.success) throw new Error(data.message || data.error || "郵件寄送失敗");
					return data.message || "郵件寄送成功";
				} finally {
					// 每次寄送後（無論成功或失敗），重置 Turnstile widget 避免重複使用已消耗之 single-use token，並清除 UI 快取
					if (typeof window !== "undefined") {
						if (typeof window.resetEmailTurnstile === "function") {
							try { window.resetEmailTurnstile(); } catch (e) {}
						} else if (window.turnstile && typeof window.turnstile.reset === "function") {
							if (window.emailTurnstileWidgetId !== undefined && window.emailTurnstileWidgetId !== null) {
								try { window.turnstile.reset(window.emailTurnstileWidgetId); } catch (e) {}
							} else if (typeof document !== "undefined") {
								const staticElem = document.getElementById("email-turnstile");
								if (staticElem) {
									try { window.turnstile.reset(staticElem); } catch (e) {}
								}
							}
						}
					}
				}
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
						enum: ["四柱", "三元"],
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
					if (Number.isNaN(parsed.getTime())) throw new Error("自定義時間格式無效");
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

				if (typeof window !== "undefined") {
					window.currentMeihuaData = data.data;
					if (typeof window.updateResult === "function") {
						window.updateResult(data.data);
					}
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
					if (![num1, num2, num3].every((value) => Number.isInteger(value) && value >= 1 && value <= 100)) {
						throw new Error("三個數字都必須是 1 到 100 的整數");
					}

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

				if (typeof window !== "undefined") {
					window.currentMeihuaData = data.data;
					if (typeof window.updateResult === "function") {
						window.updateResult(data.data);
					}
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
					if (!text) throw new Error("請提供起卦文字 (text)");
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

				if (typeof window !== "undefined") {
					window.currentMeihuaData = data.data;
					if (typeof window.updateResult === "function") {
						window.updateResult(data.data);
					}
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
					lang: { type: "string", enum: ["zh-tw", "zh-cn"], description: "回答語言" },
					turnstileToken: {
						type: "string",
						description: "Cloudflare Turnstile 人機驗證權杖 (cf-turnstile-response)。可選；若頁面啟用驗證，工具會嘗試自 DOM 或全域中取得。"
					}
				},
				required: ["question"]
			},
			annotations: { readOnlyHint: false, untrustedContentHint: false },
			execute: async (args) => {
				const question = args?.question ? String(args.question).trim() : "";
				if (!question) throw new Error("請提供問題內容 (question)");
				const explicitToken = args?.turnstileToken || (args?.["cf-turnstile-response"] ? String(args["cf-turnstile-response"]).trim() : "");
				const turnstileToken = await acquireTurnstileToken({
					containerId: "meihua-turnstile",
					action: "llm_analysis",
					getWidgetId: () => typeof window !== "undefined" ? window.meihuaTurnstileWidgetId : null,
					setWidgetId: (id) => { if (typeof window !== "undefined") window.meihuaTurnstileWidgetId = id; },
					explicitToken
				});

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

				const payload = {
					meihuaData,
					userQuestion: question,
					purpose: args?.purpose || "綜合",
					conversationHistory: args?.conversationHistory || [],
					lang: args?.lang || "zh-tw"
				};
				if (turnstileToken) {
					payload["cf-turnstile-response"] = turnstileToken;
					payload.turnstileToken = turnstileToken;
				}

				let data;
				try {
					const res = await fetch("/api/meihua/llm-analysis", {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify(payload)
					});
					data = await res.json();
				} finally {
					if (typeof window !== "undefined" && typeof window.resetMeihuaTurnstile === "function") {
						try { window.resetMeihuaTurnstile(); } catch (e) {}
					}
				}
				if (!data?.success) throw new Error(data?.message || data?.error || "梅花解讀失敗");
				const answer = data.analysis || data.answer || "";
				if (typeof window !== "undefined") {
					if (!Array.isArray(window.meihuaConversationHistory)) window.meihuaConversationHistory = [];
					window.meihuaConversationHistory.push({ role: "user", content: question });
					window.meihuaConversationHistory.push({ role: "assistant", content: answer });
				}
				return answer;
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
					datetime: { type: "string", description: "時間起卦的指定時間（ISO 8601）" },
					timezone: { type: "string", description: "時區偏移（如 +08:00）" },
					text: {
						type: "string",
						description: "漢字起卦字串（method 為 text 時使用）",
					},
					num1: {
						type: "integer",
						description: "第一個數字（method 為 number 時使用）",
					},
					num2: {
						type: "integer",
						description: "第二個數字（method 為 number 時使用）",
					},
					num3: {
						type: "integer",
						description: "第三個數字（method 為 number 時使用）",
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
					lang: { type: "string", enum: ["zh-tw", "zh-cn"], description: "回答語言" },
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
						conversationHistory: args?.conversationHistory,
						datetime: args?.datetime,
						timezone: args?.timezone || "+08:00",
						lang: args?.lang || "zh-tw"
					}),
				});
				const data = await res.json();
				if (!data.success) {
					const errMsg = data.message || data.error || "解卦失敗";
					showAgentFeedback(errMsg, "error");
					return `解卦失敗：${errMsg}`;
				}

				if (typeof window !== "undefined") {
					if (!Array.isArray(window.meihuaConversationHistory)) window.meihuaConversationHistory = [];
					window.meihuaConversationHistory.push({ role: "user", content: question });
					window.meihuaConversationHistory.push({ role: "assistant", content: data.answer });
				}

				showAgentFeedback("梅花解卦完成！");
				return data.answer;
			},
		},

	};

	function createSuiteTool(name, description, endpoint, inputSchema, defaultPayload = {}) {
		return {
			name,
			description,
			inputSchema,
			annotations: { readOnlyHint: false, untrustedContentHint: false },
			execute: async (args) => {
				const payload = Object.assign({}, defaultPayload, args || {});
				const response = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
				const data = await response.json();
				if (!response.ok || !data.success) throw new Error(data.message || data.error || "計算失敗");

				const answerText = data.answer || data.analysis || "";
				const userQuestion = args?.question ? String(args.question).trim() : (args?.name ? `${args.name} 的測算` : "術數測算分析");
				if (typeof window !== "undefined") {
					if (!Array.isArray(window.conversationHistory)) window.conversationHistory = [];
					if (answerText) {
						window.conversationHistory.push({ role: "user", content: userQuestion });
						window.conversationHistory.push({ role: "assistant", content: answerText });
					}
					window.lastSuiteResult = data.result || data.reading || data.report || data.chart || null;
				}

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
		ziwei_chart_only: createSuiteTool("ziwei_chart_only", "只計算並回傳紫微斗數命盤，不呼叫 LLM，也不送出 Discord 紀錄。", "/api/ziwei/chart", {
			type: "object", properties: {
				date: { type: "string", format: "date", description: "出生日期 YYYY-MM-DD" },
				time: { type: "string", description: "出生時間 HH:mm" },
				shichen: { type: "string", enum: ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"] },
				sex: { type: "string", enum: ["男", "女"] },
				calendar: { type: "string", enum: ["solar", "lunar"] },
				leap: { type: "boolean", description: "農曆是否閏月" },
				skipRecord: { type: "boolean", default: true, description: "略過 Discord 紀錄；純排盤工具預設開啟" }
			}, required: ["date"]
		}, { skipRecord: true }),
		name_analysis_verify: createSuiteTool("name_analysis_verify", "驗證 2 至 8 字中文姓名，回報字義、讀音、資料可得時的筆畫五格，並提示姓氏切分歧義。", "/api/name-analysis/verify", {
			type: "object", properties: {
				name: { type: "string", minLength: 2, maxLength: 8, description: "完整中文姓名，2 至 8 個漢字" },
				surname: { type: "string", minLength: 1, maxLength: 7, description: "可選，明確指定姓名開頭姓氏；驗名最長為 7 字，取名姓氏最長為 3 字" },
				profile: { type: "string", enum: ["taiwanKangxi", "modern"], description: "筆畫口徑" },
				birthData: { type: "object", description: "選填八字資料；出生日期、性別與出生時間/未知時辰選項；在本站以本地八字算法計算", properties: { date: { type: "string", format: "date" }, sex: { type: "string", enum: ["男", "女"] }, time: { type: "string", description: "HH:mm" }, shichen: { type: "string", enum: ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"] }, calendar: { type: "string", enum: ["solar", "lunar"] }, leap: { type: "boolean", description: "農曆是否閏月" }, ziMode: { type: "string", enum: ["early_late", "next_day"], description: "子時換日口徑" }, allowUnknownHour: { type: "boolean" } } }
			}, required: ["name"]
		}),
		name_analysis_generate: createSuiteTool("name_analysis_generate", "依姓氏與明確條件產生中文姓名候選，名可為 1 至 4 字；性別風格採 CCNC 聚合語料與整理字表作軟性排序，不判定個人性別。", "/api/name-analysis/generate", {
			type: "object", properties: {
				surname: { type: "string", minLength: 1, maxLength: 3, description: "姓氏，1 至 3 個漢字" },
				givenNameLength: { type: "integer", minimum: 1, maximum: 4, description: "名字字數" },
				includeChars: { type: "array", items: { type: "string", minLength: 1, maxLength: 1 }, description: "必須出現在名字中的字" },
				excludeChars: { type: "array", items: { type: "string", minLength: 1, maxLength: 1 }, description: "名字中不可出現的字" },
				desiredElements: { type: "array", items: { type: "string", enum: ["木", "火", "土", "金", "水"] }, description: "排序偏好的字五行" },
				nameStyle: { type: "string", enum: ["auto", "feminine", "masculine", "neutral"], default: "auto", description: "命名風格排序；auto 參照 birthData.sex，未提供則用中性。屬風格偏好，不判定性別。" },
				profile: { type: "string", enum: ["taiwanKangxi", "modern"] },
				birthData: { type: "object", description: "選填八字資料；僅於本站本地計算喜用五行", properties: { date: { type: "string", format: "date" }, sex: { type: "string", enum: ["男", "女"] }, time: { type: "string" }, shichen: { type: "string", enum: ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"] }, calendar: { type: "string", enum: ["solar", "lunar"] }, allowUnknownHour: { type: "boolean" } } }
			}, required: ["surname"]
		}),
		name_analysis_question: createSuiteTool("name_analysis_question", "根據確定性姓名分析資料回答補充問題；不需要出生資料。", "/api/name-analysis-question", {
			type: "object", properties: {
				name: { type: "string", minLength: 2, maxLength: 8, description: "完整中文姓名" },
				surname: { type: "string", minLength: 1, maxLength: 7, description: "驗名可選的明確姓氏；取名時最多 3 字" },
				givenNameLength: { type: "integer", minimum: 1, maximum: 4, description: "取名模式名字字數" },
				includeChars: { type: "array", items: { type: "string", minLength: 1, maxLength: 1 }, description: "生成名字必須包含的字" },
				excludeChars: { type: "array", items: { type: "string", minLength: 1, maxLength: 1 }, description: "生成名字排除的字" },
				desiredElements: { type: "array", items: { type: "string", enum: ["木", "火", "土", "金", "水"] }, description: "生成名字的五行排序偏好" },
				nameStyle: { type: "string", enum: ["auto", "feminine", "masculine", "neutral"], default: "auto", description: "命名風格排序；auto 參照 birthData.sex，未提供則用中性；不是性別判定。" },
				mode: { type: "string", enum: ["verify", "generate"] },
				question: { type: "string", maxLength: 1000, description: "補充問題" },
				profile: { type: "string", enum: ["taiwanKangxi", "modern"] },
				birthData: { type: "object", description: "選填八字資料；只計算必要五行摘要並傳入解讀，不傳出生日期本身", properties: { date: { type: "string", format: "date" }, sex: { type: "string", enum: ["男", "女"] }, time: { type: "string" }, shichen: { type: "string", enum: ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"] }, calendar: { type: "string", enum: ["solar", "lunar"] }, allowUnknownHour: { type: "boolean" } } }
			}, required: ["question", "mode"], oneOf: [
				{ properties: { mode: { const: "verify" } }, required: ["name"] },
				{ properties: { mode: { const: "generate" } }, required: ["surname"] }
			]
		}),
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
		ziwei_male_size: {
			name: "ziwei_male_size",
			description: "紫微斗數男生真實尺寸與體質雙核速測（子位出廠氣象＋疾厄宮實體肉身合參，解鎖公分區間與戰力封號）。",
			inputSchema: {
				type: "object",
				properties: {
					date: { type: "string", description: "出生日期 YYYY-MM-DD" },
					time: { type: "string", description: "出生時間 HH:mm" },
					shichen: { type: "string", enum: ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"], description: "出生時辰地支" },
					sex: { type: "string", enum: ["男", "女"], description: "性別" },
					calendar: { type: "string", enum: ["solar", "lunar"], description: "曆法" },
					leap: { type: "boolean", description: "農曆是否閏月" }
				},
				required: ["date"]
			},
			execute: async (args) => {
				const date = args?.date;
				if (!date) throw new Error("請提供出生日期 (date)");
				const payload = {
					date,
					time: args?.time || "12:00",
					shichen: args?.shichen,
					sex: args?.sex || "男",
					calendar: args?.calendar || "solar",
					leap: !!args?.leap
				};
				const res = await fetch("/api/ziwei/male-size", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(payload)
				});
				const data = await res.json();
				if (!data.success) throw new Error(data.error || "測算失敗");
				const summary = data.summary || JSON.stringify(data);
				if (typeof window !== "undefined") {
					if (!Array.isArray(window.conversationHistory)) window.conversationHistory = [];
					window.conversationHistory.push({ role: "user", content: "紫微男生真實尺寸速測" });
					window.conversationHistory.push({ role: "assistant", content: summary });
					window.lastSuiteResult = data;
				}
				return summary;
			}
		},
		ziwei_future_spouse: {
			name: "ziwei_future_spouse",
			description: "紫微斗數未來另一半正緣深度解析（夫妻宮主星＋吉煞四化，推導年齡差距區間、長相風格、性格脾氣與相遇契機）。",
			inputSchema: {
				type: "object",
				properties: {
					date: { type: "string", description: "出生日期 YYYY-MM-DD" },
					time: { type: "string", description: "出生時間 HH:mm" },
					shichen: { type: "string", enum: ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"], description: "出生時辰地支" },
					sex: { type: "string", enum: ["男", "女"], description: "命主性別（男看妻，女看夫）" },
					calendar: { type: "string", enum: ["solar", "lunar"], description: "曆法" },
					leap: { type: "boolean", description: "農曆是否閏月" }
				},
				required: ["date"]
			},
			execute: async (args) => {
				const date = args?.date;
				if (!date) throw new Error("請提供出生日期 (date)");
				const payload = {
					date,
					time: args?.time || "12:00",
					shichen: args?.shichen,
					sex: args?.sex || "男",
					calendar: args?.calendar || "solar",
					leap: !!args?.leap
				};
				const res = await fetch("/api/ziwei/spouse", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(payload)
				});
				const data = await res.json();
				if (!data.success) throw new Error(data.error || "測算失敗");
				const summary = data.summary || JSON.stringify(data.result || data.spouse || data);
				if (typeof window !== "undefined") {
					if (!Array.isArray(window.conversationHistory)) window.conversationHistory = [];
					window.conversationHistory.push({ role: "user", content: "紫微未來另一半正緣解析" });
					window.conversationHistory.push({ role: "assistant", content: summary });
					window.lastSuiteResult = data;
				}
				return summary;
			}
		},
		tarot_numerology: {
			name: "tarot_numerology",
			description: "計算生命數、生日數、生日數字九宮格、缺數反思提示、已形成的數字連線與大阿爾克那原型；只作文化反思，不作診斷或命運定論。",
			parameters: {
				type: "object",
				properties: {
					birthDate: { type: "string", description: "西元出生年月日（YYYY-MM-DD 或 YYYY/MM/DD）" },
					question: { type: "string", description: "想針對天賦特質詢問的事（可選）" }
				},
				required: ["birthDate"]
			},
			execute: async (args) => {
				const birthDate = args.birthDate || args.date;
				if (!birthDate) throw new Error("請提供出生年月日 (birthDate)");
				const payload = { birthDate, question: args.question || "" };
				const res = await fetch("/api/tarot/numerology", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(payload)
				});
				const data = await res.json();
				if (!data.success) throw new Error(data.error || "生命靈數計算失敗");
				const lines = data.digitGrid?.connections || [];
				const missing = data.digitGrid?.missingNumbers || [];
				const summary = `【生命數 ${data.lifeNumber}｜${data.lifeProfile?.title || data.soulCard?.name}】靈魂象徵牌：${data.soulCard?.name}（${data.soulCard?.nameEn}）。\n核心傾向：${data.lifeProfile?.essence || data.soulCard?.summary}\n生日數：${data.birthdayNumber?.number || "—"}（${data.birthdayNumber?.title || ""}）\n計算歷程：${data.formula}\n生日盤面空缺數：${missing.map((item) => item.number).join("、") || "無"}\n形成連線：${lines.map((line) => `${line.pattern} ${line.title}`).join("、") || "無"}\n自我提問：${data.lifeProfile?.reflection || "—"}\n提醒：生日九宮格是文化反思線索，不代表能力缺失或命運定論。`;
				if (typeof window !== "undefined") {
					if (!Array.isArray(window.conversationHistory)) window.conversationHistory = [];
					window.conversationHistory.push({ role: "user", content: "計算生命數、生日數與生日數字九宮格" });
					window.conversationHistory.push({ role: "assistant", content: summary });
					window.lastSuiteResult = data;
				}
				return summary;
			}
		},
		tarot_reading: createSuiteTool("tarot_reading", "塔羅牌陣抽牌與解讀（78張牌、6大牌陣與四維透鏡）。", "/api/tarot-question", {
			type: "object",
			properties: {
				question: { type: "string", description: "使用者的問題" },
				spread: { type: "string", enum: ["single", "three", "diamond", "moon", "horseshoe", "celtic"], description: "牌陣" },
				variant: { type: "string", enum: ["timeline", "situation", "relationship", "decision"], description: "三牌陣變體解讀維度" },
				time_factor: { type: "string", enum: ["morning", "afternoon", "night"], description: "時間能量因子加權" },
				timeFactor: { type: "string", enum: ["morning", "afternoon", "night"] },
				seed: { type: "string", description: "可選的可重現抽牌種子" },
				lang: { type: "string", enum: ["zh-tw", "zh-cn"], description: "回答語言" },
				conversationHistory: { type: "array", description: "可選的續問對話歷史" }
			},
			required: ["question"]
		}),
		fengshui_report: createSuiteTool("fengshui_report", "八宅、九運與流年飛星、形煞化解及協紀辨方擇日風水報告與行動建議。", "/api/fengshui-question", {
			type: "object",
			properties: {
				question: { type: "string", description: "使用者的空間或擇日問題" },
				mode: { type: "string", enum: ["yangzhai", "shaqi", "zeri", "evaluate-layout"], description: "風水模式" },
				facing: { type: "string", enum: ["南", "北", "東", "西", "東南", "西北", "東北", "西南", "壬山丙向", "子山午向", "癸山丁向", "丑山未向", "艮山坤向", "寅山申向", "甲山庚向", "卯山酉向", "乙山辛向", "辰山戌向", "巽山乾向", "巳山亥向", "丙山壬向", "午山子向", "丁山癸向", "未山丑向", "坤山艮向", "申山寅向", "庚山甲向", "酉山卯向", "辛山乙向", "戌山辰向", "乾山巽向", "亥山巳向"], description: "房屋朝向（陽宅模式，支援8大方位與24山精確坐向）" },
				moveInYear: { type: "integer", minimum: 1, maximum: 9999, description: "入住或建造年份（陽宅模式）" },
				residentYear: { type: "integer", minimum: 1, maximum: 9999, description: "主要居住者出生年（陽宅模式）" },
				sex: { type: "string", enum: ["男", "女"], description: "主要居住者性別" },
				year: { type: "integer", minimum: 1, maximum: 9999, description: "分析流年" },
				shaType: { type: "string", enum: ["天斬煞", "路沖煞", "槍煞", "壁刀煞", "反弓煞", "反弓水", "鐮刀煞", "穿心煞", "白虎煞", "孤陽煞", "獨陰煞", "探頭煞", "頂心煞", "火形煞", "穿堂煞", "門沖床", "樑壓床", "橫樑壓頂", "樑壓灶", "門沖灶", "水火相沖", "廁居中宮", "開門見灶", "開門見廁"], description: "形煞類型（形煞模式）" },
				matter: { type: "string", enum: ["入宅/喬遷", "開業/開市", "動土/修造", "嫁娶/結婚", "open", "renovate", "marry"], description: "擇日事項（擇日模式）" },
				zeriYear: { type: "integer", description: "擇日目標年份（擇日模式）" },
				zeriMonth: { type: "integer", minimum: 1, maximum: 12, description: "擇日目標月份（擇日模式）" },
				heading: { type: "number", description: "電子羅盤實測向首度數；服務端循環正規化至 [0, 360)" },
				northReference: { type: "string", enum: ["magnetic", "true"], description: "北基準：磁北或真北" },
				declination: { type: "number", description: "磁偏角（度數）" },
				headingSource: { type: "string", enum: ["sensor", "manual"], description: "向首度數來源" },
				layoutObjects: { type: "object", additionalProperties: false, properties: Object.fromEntries(["東南", "南", "西南", "東", "中", "西", "東北", "北", "西北"].map(p => [p, { type: "array", maxItems: 63, items: { type: "string", pattern: "^(space|door|window|opening|furniture|appliance|circulation|exterior|form)\\.[a-z_]+$" } }])), description: "九宮住宅物件標註；僅接受方向宮位 key 與 canonical object ID" },
				entryPath: { type: "array", maxItems: 9, items: { type: "string", enum: ["東南", "南", "西南", "東", "中", "西", "東北", "北", "西北"] }, description: "進門動線循跡宮位陣列（最後入路）" },
				pathQuality: { type: "string", enum: ["open", "obstructed", "unknown"], description: "動線通暢度" },
				lang: { type: "string", enum: ["zh-tw", "zh-cn"], description: "回答語言" },
				conversationHistory: { type: "array", description: "可選的續問對話歷史" }
			},
			required: ["question"]
		}),
		fengshui_layout_evaluation: createSuiteTool("fengshui_layout_evaluation", "純計算中州派九宮住宅格局評估，不呼叫 LLM。", "/api/fengshui/evaluate-layout", {
			type: "object",
			additionalProperties: false,
			properties: {
				layoutObjects: { type: "object", additionalProperties: false, minProperties: 1, properties: Object.fromEntries(["東南", "南", "西南", "東", "中", "西", "東北", "北", "西北"].map(p => [p, { type: "array", maxItems: 63, items: { type: "string", pattern: "^(space|door|window|opening|furniture|appliance|circulation|exterior|form)\\.[a-z_]+$" } }])) },
				facing: { type: "string", enum: ["南", "北", "東", "西", "東南", "西北", "東北", "西南", "壬山丙向", "子山午向", "癸山丁向", "丑山未向", "艮山坤向", "寅山申向", "甲山庚向", "卯山酉向", "乙山辛向", "辰山戌向", "巽山乾向", "巳山亥向", "丙山壬向", "午山子向", "丁山癸向", "未山丑向", "坤山艮向", "申山寅向", "庚山甲向", "酉山卯向", "辛山乙向", "戌山辰向", "乾山巽向", "亥山巳向"] },
				heading: { type: "number" },
				northReference: { type: "string", enum: ["magnetic", "true"] },
				declination: { type: "number" },
				headingSource: { type: "string", enum: ["sensor", "manual"] },
				entryPath: { type: "array", maxItems: 9, items: { type: "string", enum: ["東南", "南", "西南", "東", "中", "西", "東北", "北", "西北"] } },
				pathQuality: { type: "string", enum: ["open", "obstructed", "unknown"] },
				moveInYear: { type: "integer", minimum: 1, maximum: 9999 },
				year: { type: "integer", minimum: 1, maximum: 9999 }
			},
			required: ["layoutObjects"]
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
		answerbook_reading: createSuiteTool("answerbook_reading", "解答之書直接默念取得提醒，或輸入問題後取得解讀。", "/api/answerbook-question", {
			type: "object",
			properties: {
				mode: { type: "string", enum: ["direct", "question"], default: "direct", description: "direct 直接默念；question 輸入問題後取得解讀" },
				question: { type: "string", description: "問題模式使用的具體問題；直接模式可省略" },
				lang: { type: "string", enum: ["zh-tw", "zh-cn"], default: "zh-tw", description: "回答語言" },
				conversationHistory: { type: "array", description: "問題模式的續問對話歷史" }
			},
			required: []
		}),
		date_range_normalize: createSuiteTool("date_range_normalize", "標準化日期區間並解決午夜邊界問題（如 9/1~9/9 完整覆蓋至 9/9 23:59:59.999 或半開區間 < 9/10 00:00:00）。", "/api/time/range", {
			type: "object",
			properties: {
				startDate: { type: "string", description: "開始日期 (YYYY-MM-DD)" },
				endDate: { type: "string", description: "結束日期 (YYYY-MM-DD)" },
				timezone: { type: "string", description: "時區偏移 (如 +08:00)" },
				precision: { type: "string", enum: ["millisecond", "second"], default: "millisecond", description: "邊界精度" }
			},
			required: ["startDate", "endDate"]
		})
	});

	/**
	 * WebMCP Controller & Registration Manager
	 */
	let registeredTools = [];
	const abortControllers = [];

	function getDeclarativeToolNames() {
		if (typeof document === "undefined" || typeof document.querySelectorAll !== "function") {
			return new Set();
		}
		return new Set(
			Array.from(document.querySelectorAll("form[toolname]"))
				.map((form) => form.getAttribute("toolname"))
				.filter(Boolean),
		);
	}

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
				toolDefinitions.send_conversation_email,
			];
		} else if (pathname === "/fengshui") {
			toolsToRegister = [
				toolDefinitions.fengshui_report,
				toolDefinitions.fengshui_layout_evaluation,
				toolDefinitions.switch_theme,
				toolDefinitions.send_conversation_email,
			];
		} else if (pathname === "/ziwei" || pathname.startsWith("/ziwei/")) {
			toolsToRegister = [
				toolDefinitions.ziwei_chart_only,
				toolDefinitions.ziwei_chart,
				toolDefinitions.ziwei_male_size,
				toolDefinitions.ziwei_future_spouse,
				toolDefinitions.switch_theme,
				toolDefinitions.send_conversation_email,
			];
		} else if (pathname === "/name-analysis") {
			toolsToRegister = [toolDefinitions.name_analysis_verify, toolDefinitions.name_analysis_generate, toolDefinitions.name_analysis_question, toolDefinitions.switch_theme, toolDefinitions.send_conversation_email];
		} else if (pathname === "/tarot" || pathname.startsWith("/tarot/")) {
			toolsToRegister = [
				toolDefinitions.tarot_reading,
				toolDefinitions.tarot_numerology,
				toolDefinitions.switch_theme,
				toolDefinitions.send_conversation_email
			];
		} else if (["/bazi2", "/yinyuan", "/answerbook"].includes(pathname)) {
			const suiteTool = { "/bazi2": "bazi2_chart", "/yinyuan": "yinyuan_reading", "/answerbook": "answerbook_reading" }[pathname];
			toolsToRegister = [toolDefinitions[suiteTool], toolDefinitions.switch_theme, toolDefinitions.send_conversation_email];
		} else {
			// Default / or /custom (具備對話紀錄與 #emailConversationModal)
			toolsToRegister = [
				toolDefinitions.qimen_divination,
				toolDefinitions.qimen_question,
				toolDefinitions.qimen_custom_paipan,
				toolDefinitions.get_current_pan,
				toolDefinitions.switch_time_mode,
				toolDefinitions.switch_theme,
				toolDefinitions.send_conversation_email,
				toolDefinitions.meihua_qigua_time,
				toolDefinitions.meihua_qigua_numbers,
				toolDefinitions.meihua_qigua_text,
				toolDefinitions.meihua_divination,
			];
		}

		const declarativeToolNames = getDeclarativeToolNames();
		const declarativeTools = [];
		for (let i = 0; i < toolsToRegister.length; i++) {
			const tool = toolsToRegister[i];
			if (declarativeToolNames.has(tool.name)) {
				// Chrome registers forms with toolname declaratively. Registering the
				// same name imperatively causes InvalidStateError: Duplicate tool name.
				declarativeTools.push(tool.name);
				continue;
			}
			if (registeredTools.includes(tool.name)) continue;
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
			`[WebMCP] Successfully registered ${registeredTools.length} imperative tools; ` +
			`${declarativeTools.length} declarative form tools left to Chrome:`,
			{ imperative: registeredTools, declarative: declarativeTools },
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
		if (toolName === "fengshui_report") {
			if (values.zeriMatter) values.matter = values.zeriMatter;
			if (typeof window !== "undefined" && typeof window.getFengshuiLayoutPayload === "function") {
				const layoutData = window.getFengshuiLayoutPayload();
				if (layoutData) {
					if (typeof layoutData.heading === "number" && !isNaN(layoutData.heading)) values.heading = layoutData.heading;
					if (layoutData.northReference) values.northReference = layoutData.northReference;
					if (typeof layoutData.declination === "number") values.declination = layoutData.declination;
					if (layoutData.headingSource) values.headingSource = layoutData.headingSource;
					if (layoutData.layoutObjects && Object.keys(layoutData.layoutObjects).length > 0) values.layoutObjects = layoutData.layoutObjects;
					if (Array.isArray(layoutData.entryPath) && layoutData.entryPath.length > 0) values.entryPath = layoutData.entryPath;
					if (layoutData.pathQuality) values.pathQuality = layoutData.pathQuality;
				}
			}
			if (typeof values.layoutObjects === "string") {
				try { values.layoutObjects = JSON.parse(values.layoutObjects); } catch (_) {}
			}
			if (typeof values.entryPath === "string") {
				try { values.entryPath = JSON.parse(values.entryPath); } catch (_) {}
			}
			if (values.heading !== undefined && values.heading !== "") {
				values.heading = Number(values.heading);
			}
		}
		if (toolName === "yinyuan_reading") {
			const aliasGroups = {
				fortune: { fortuneName: "name", fortuneSex: "sex", fortuneStickNum: "stickNum", fortuneBirthDate: "birthDate", fortuneStatus: "status" },
				zodiac: { zodiacRelationStage: "stage" },
				"ziwei-marriage": { ziweiName: "name", ziweiSex: "sex", ziweiCalendar: "calendar", ziweiDate: "date", ziweiShichen: "shichen", ziweiStatus: "status" },
				"peach-blossom": { taohuaBirthDate: "birthDate", taohuaYear: "firstYear", taohuaSex: "sex", taohuaStatus: "status", taohuaScope: "scope" }
			};
			const aliases = aliasGroups[values.mode] || {};
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
					const responsePromise = Promise.resolve().then(() => {
						if (!tool) throw new Error(`找不到 WebMCP 工具：${toolName}`);
						return tool.execute(readDeclarativeForm(form));
					}).catch((error) => {
						showAgentFeedback(error.message || "工具執行失敗", "error");
						throw error;
					});
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
		resetForTesting: () => { registeredTools = []; },
		registerAllTools,
		showAgentFeedback,
	};
});
