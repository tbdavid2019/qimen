(() => {
    'use strict';

    const page = document.body.dataset.suite;
    const form = document.getElementById('suiteForm');
    const visualBoard = document.getElementById('suiteVisualBoard');
    const aiSection = document.getElementById('suiteAiSection');
    const aiLoading = document.getElementById('suiteAiLoading');
    const conversationStream = document.getElementById('suiteConversation');
    const followUpForm = document.getElementById('suiteFollowUpForm');
    const followUpInput = document.getElementById('suiteFollowUpInput');
    const submitBtn = document.getElementById('suiteSubmitBtn');

    let lastResult = null;
    let conversationHistory = [];

    const escapeHtml = (str) => String(str || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

    const renderMarkdown = (text) => {
        if (window.MarkdownRenderer && typeof window.MarkdownRenderer.render === 'function') {
            return window.MarkdownRenderer.render(text);
        }
        return `<p>${escapeHtml(text).replace(/\n/g, '<br>')}</p>`;
    };

    const elementClass = (element) => {
        const map = { 木: 'element-wood', 火: 'element-fire', 土: 'element-earth', 金: 'element-metal', 水: 'element-water' };
        return map[element] || '';
    };

    // --- Visual Board Renderers ---

    function renderTarot(reading) {
        if (!reading || !reading.cards) return;
        const cardsHtml = reading.cards.map((card) => {
            const isUpright = card.orientation === '正位';
            return `
                <div class="tarot-card-item">
                    <span class="tarot-pos-badge">${escapeHtml(card.position)}</span>
                    <div class="tarot-card-name">${escapeHtml(card.name)}</div>
                    <span class="tarot-orientation ${isUpright ? 'upright' : 'reversed'}">${escapeHtml(card.orientation)}</span>
                    <div style="font-size:11px; margin-top:4px; color:var(--suite-text-muted);">屬${escapeHtml(card.element || '')} · ${escapeHtml(card.suit || '')}</div>
                    ${card.isMajor ? '<div class="tarot-major-tag">★ 大阿爾克那</div>' : ''}
                </div>
            `;
        }).join('');

        const relations = reading.relations || {};
        const elementCounts = relations.elementCounts || {};
        const combosHtml = (relations.matchedCombos || []).map((combo) => `
            <div style="font-size:12px; color:var(--suite-text); margin-bottom:4px;">✨ ${escapeHtml(combo)}</div>
        `).join('');

        const relationsHtml = `
            <div style="background:var(--suite-bg-card, rgba(255,255,255,0.03)); border:1px solid var(--suite-border); border-radius:8px; padding:12px; margin-top:14px;">
                <div style="font-size:13px; font-weight:700; color:var(--suite-primary); margin-bottom:8px;">🔮 牌間關係與能量分佈</div>
                <div style="font-size:12px; margin-bottom:6px; color:var(--suite-text-muted);">
                    大阿卡納佔比：<strong>${escapeHtml(relations.majorRatio || '0%')}</strong>（${escapeHtml(relations.majorTheme || '')}）
                </div>
                <div style="display:flex; gap:10px; flex-wrap:wrap; margin-bottom:8px;">
                    <span class="suite-tag">🔥 權杖/火: ${elementCounts.火 || 0}</span>
                    <span class="suite-tag">💧 聖杯/水: ${elementCounts.水 || 0}</span>
                    <span class="suite-tag">💨 寶劍/風: ${elementCounts.風 || 0}</span>
                    <span class="suite-tag">🪙 錢幣/土: ${elementCounts.土 || 0}</span>
                </div>
                ${combosHtml ? `<div style="margin-top:6px;">${combosHtml}</div>` : ''}
            </div>
        `;

        visualBoard.innerHTML = `
            <div class="suite-board-title">🔮 塔羅開牌結果（${escapeHtml(reading.spreadName || reading.spread)}）</div>
            <div style="font-size:12px; color:var(--suite-text-muted); margin-bottom:12px;">時辰因子：${escapeHtml(reading.timeFactor || '')} | 種子：${escapeHtml(reading.seed || '')}</div>
            <div class="tarot-cards-grid">${cardsHtml}</div>
            ${relationsHtml}
        `;
        visualBoard.hidden = false;
    }

    function renderBazi(chart) {
        if (!chart || !chart.fourPillars) return;
        const pillars = chart.fourPillars;
        const tableHtml = `
            <table class="bazi-pillars-table">
                <thead>
                    <tr>${pillars.map((p) => `<th class="bazi-pillar-head">${escapeHtml(p.label)}</th>`).join('')}</tr>
                </thead>
                <tbody>
                    <tr>${pillars.map((p) => `<td class="bazi-god-cell">${escapeHtml(p.tenGod || '日主')}</td>`).join('')}</tr>
                    <tr>${pillars.map((p) => `<td><span class="bazi-char-cell ${elementClass(p.element)}">${escapeHtml(p.stem)}</span><br><span class="bazi-element-pill">${escapeHtml(p.element)}</span></td>`).join('')}</tr>
                    <tr>${pillars.map((p) => `<td><span class="bazi-char-cell ${elementClass(p.branchElement)}">${escapeHtml(p.branch)}</span><br><span class="bazi-element-pill">${escapeHtml(p.branchElement)}</span></td>`).join('')}</tr>
                    <tr>${pillars.map((p) => `<td class="bazi-hidden-cell">${(p.hiddenStems || []).map((h) => `${escapeHtml(h.stem)} <small>(${escapeHtml(h.tenGod)})</small>`).join('<br>')}</td>`).join('')}</tr>
                    <tr>${pillars.map((p) => `<td style="font-size:11px; color:var(--suite-text-muted);">${escapeHtml(p.nayin || '')}<br><span style="color:var(--suite-primary);">${escapeHtml(p.changsheng || '')}</span></td>`).join('')}</tr>
                </tbody>
            </table>
        `;

        const strength = chart.strengthAnalysis || {};
        const geju = chart.geju || {};
        const diagnosisHtml = `
            <div style="background:var(--suite-bg-card, rgba(255,255,255,0.03)); border:1px solid var(--suite-border); border-radius:8px; padding:12px; margin:12px 0;">
                <div style="display:flex; justify-content:space-between; flex-wrap:wrap; gap:8px; margin-bottom:8px;">
                    <div>日主格局：<strong style="color:var(--suite-primary);">${escapeHtml(geju.name || '')}</strong></div>
                    <div>身強身弱：<strong style="color:var(--suite-primary);">${escapeHtml(strength.strength || '')}</strong>（${escapeHtml(strength.isDeLing || '')}）</div>
                </div>
                <div style="font-size:12px; color:var(--suite-text-muted); margin-bottom:4px;">
                    喜用神：<strong style="color:#22c55e;">${escapeHtml(strength.usefulGod || '順應五行生剋')}</strong>
                </div>
                <div style="font-size:12px; color:var(--suite-text-muted);">
                    忌神：<strong style="color:#ef4444;">${escapeHtml(strength.tabooGod || '過旺五行')}</strong>
                </div>
            </div>
        `;

        const counts = chart.fiveElements?.counts || {};
        const percentages = chart.fiveElements?.percentages || {};
        const elementsHtml = `
            <div class="five-elements-meter">
                <div style="font-size:12px; font-weight:700; margin-bottom:8px; color:var(--suite-text-muted);">
                    五行力量分佈（日主：<strong class="${elementClass(chart.dayMaster?.element)}">${escapeHtml(chart.dayMaster?.stem)}[${escapeHtml(chart.dayMaster?.element)}]</strong>）
                </div>
                <div class="five-elements-grid">
                    <div class="element-item element-wood">木 <span class="element-count-badge">${counts.木 || 0} (${percentages.木 || 0}%)</span></div>
                    <div class="element-item element-fire">火 <span class="element-count-badge">${counts.火 || 0} (${percentages.火 || 0}%)</span></div>
                    <div class="element-item element-earth">土 <span class="element-count-badge">${counts.土 || 0} (${percentages.土 || 0}%)</span></div>
                    <div class="element-item element-metal">金 <span class="element-count-badge">${counts.金 || 0} (${percentages.金 || 0}%)</span></div>
                    <div class="element-item element-water">水 <span class="element-count-badge">${counts.水 || 0} (${percentages.水 || 0}%)</span></div>
                </div>
            </div>
        `;

        const shenshaList = (chart.shensha || []).map((s) => `
            <span class="suite-tag ${s.type === '吉' ? 'auspicious' : s.type === '凶' ? 'inauspicious' : ''}" title="${escapeHtml(s.desc)}">
                ${escapeHtml(s.name)}
            </span>
        `).join(' ');

        const shenshaHtml = shenshaList ? `
            <div style="margin:12px 0;">
                <div style="font-size:12px; font-weight:700; margin-bottom:6px; color:var(--suite-text-muted);">命帶神煞</div>
                <div style="display:flex; flex-wrap:wrap; gap:6px;">${shenshaList}</div>
            </div>
        ` : '';

        const luckCyclesHtml = (chart.luckCycles || []).length > 0 ? `
            <div style="font-size:12px; font-weight:700; margin-bottom:6px; color:var(--suite-text-muted);">大運排盤</div>
            <div class="luck-cycles-scroller">
                ${chart.luckCycles.map((c) => `
                    <div class="luck-cycle-card">
                        <div class="luck-cycle-ganzhi">${escapeHtml(c.ganzhi)}</div>
                        <div class="luck-cycle-age">${escapeHtml(c.startAge)}~${escapeHtml(c.endAge)}歲</div>
                        <div style="font-size:10px; color:var(--suite-text-muted);">${escapeHtml(c.startYear)}~${escapeHtml(c.endYear)}</div>
                    </div>
                `).join('')}
            </div>
        ` : '';

        visualBoard.innerHTML = `
            <div class="suite-board-title">📜 四柱八字命盤（${escapeHtml(chart.profile?.solarDate || '')} · 農曆 ${escapeHtml(chart.profile?.lunar || '')}）</div>
            ${tableHtml}
            ${diagnosisHtml}
            ${elementsHtml}
            ${shenshaHtml}
            ${luckCyclesHtml}
        `;
        visualBoard.hidden = false;
    }

    function renderFengShui(report) {
        if (!report) return;

        if (report.mode === 'shaqi') {
            visualBoard.innerHTML = `
                <div class="suite-board-title">⚠️ 風水形煞診斷報告（${escapeHtml(report.shaName)}）</div>
                <div style="background:var(--suite-bg-card, rgba(255,255,255,0.03)); border:1px solid var(--suite-border); border-radius:8px; padding:16px;">
                    <div style="font-size:16px; font-weight:700; color:var(--suite-primary); margin-bottom:8px;">${escapeHtml(report.shaName)} · ${escapeHtml(report.type)}</div>
                    <p style="font-size:14px; margin-bottom:12px;">${escapeHtml(report.desc)}</p>
                    <div style="background:rgba(239, 68, 68, 0.1); border-left:4px solid #ef4444; padding:10px; border-radius:4px; font-size:13px;">
                        <strong>💡 化解之道：</strong>${escapeHtml(report.remedy)}
                    </div>
                </div>
            `;
            visualBoard.hidden = false;
            return;
        }

        if (report.mode === 'zeri') {
            const datesHtml = (report.auspiciousDates || []).map((d) => `
                <tr style="border-bottom:1px solid var(--suite-border);">
                    <td style="padding:8px; font-weight:700;">${escapeHtml(d.day)}</td>
                    <td style="padding:8px; color:var(--suite-primary);">${escapeHtml(d.stemBranch)}</td>
                    <td style="padding:8px;"><span class="suite-tag auspicious">${escapeHtml(d.jianXing)}</span></td>
                    <td style="padding:8px; font-size:12px;">${escapeHtml(d.gods)}</td>
                    <td style="padding:8px; font-size:12px; color:var(--suite-text-muted);">${escapeHtml(d.bestHours)}</td>
                </tr>
            `).join('');

            visualBoard.innerHTML = `
                <div class="suite-board-title">📅 傳統擇日吉時推薦（${escapeHtml(report.matter)} · ${escapeHtml(report.year)}年${escapeHtml(report.month)}月）</div>
                <div style="display:flex; gap:12px; flex-wrap:wrap; margin-bottom:12px; font-size:12px;">
                    <div style="background:rgba(239,68,68,0.1); padding:6px 10px; border-radius:4px; color:#ef4444;">⚠️ ${escapeHtml(report.suiPoWarning)}</div>
                    <div style="background:rgba(245,158,11,0.1); padding:6px 10px; border-radius:4px; color:#f59e0b;">⚠️ ${escapeHtml(report.sanShaWarning)}</div>
                </div>
                <table style="width:100%; border-collapse:collapse; font-size:13px; margin-top:8px;">
                    <thead>
                        <tr style="background:var(--suite-bg-card); border-bottom:2px solid var(--suite-border);">
                            <th style="padding:8px; text-align:left;">公曆吉日</th>
                            <th style="padding:8px; text-align:left;">日柱干支</th>
                            <th style="padding:8px; text-align:left;">建除十二神</th>
                            <th style="padding:8px; text-align:left;">吉神星曜</th>
                            <th style="padding:8px; text-align:left;">吉利時辰</th>
                        </tr>
                    </thead>
                    <tbody>${datesHtml}</tbody>
                </table>
            `;
            visualBoard.hidden = false;
            return;
        }

        // 陽宅分析
        const dir = report.eightMansions?.directions || {};
        const house = report.house || '';
        const annual = report.flyingStars?.annual || {};
        const base = report.flyingStars?.base || {};

        const layout = [
            { key: '東南', name: '東南 (巽)' }, { key: '南', name: '南 (離)' }, { key: '西南', name: '西南 (坤)' },
            { key: '東', name: '東 (震)' },     { key: '中', name: '中宮' },     { key: '西', name: '西 (兌)' },
            { key: '東北', name: '東北 (艮)' }, { key: '北', name: '北 (坎)' }, { key: '西北', name: '西北 (乾)' }
        ];

        const auspiciousStars = new Set(['生氣', '天醫', '延年', '伏位']);

        const gridHtml = layout.map((item) => {
            if (item.key === '中') {
                return `
                    <div class="fengshui-cell center-palace">
                        <div class="fengshui-dir-title">${item.name}</div>
                        <div style="font-size:13px; font-weight:700; margin:4px 0; color:var(--suite-primary);">${escapeHtml(house)}</div>
                        <div class="fengshui-flying-star">九運運星: ${base['中'] || 9}</div>
                        <div class="fengshui-flying-star" style="color:#ef4444;">流年飛星: ${annual['中'] || 1}</div>
                    </div>
                `;
            }
            const starRaw = dir[item.key] || '';
            const isAuspicious = starRaw.includes('吉');
            const starBadgeClass = isAuspicious ? 'auspicious' : 'inauspicious';

            return `
                <div class="fengshui-cell">
                    <div class="fengshui-dir-title">${item.name}</div>
                    <span class="fengshui-star-badge ${starBadgeClass}">${escapeHtml(starRaw)}</span>
                    <div class="fengshui-flying-star">運星: ${base[item.key] || '-'} | 流年: ${annual[item.key] || '-'}</div>
                </div>
            `;
        }).join('');

        const mingGuaName = report.resident?.mingGua?.name || '';
        visualBoard.innerHTML = `
            <div class="suite-board-title">🏡 八宅九星與流年飛星盤（${escapeHtml(house)} · 坐向：${escapeHtml(report.facing || '')}）</div>
            <div style="display:flex; justify-content:space-between; flex-wrap:wrap; gap:8px; font-size:13px; margin-bottom:12px; color:var(--suite-text-muted);">
                <div>居住者命卦：<strong>${escapeHtml(mingGuaName)}</strong></div>
                <div>九運格局：<strong style="color:var(--suite-primary);">${escapeHtml(report.pattern || '旺山旺向')}</strong></div>
            </div>
            <div style="font-size:12px; margin-bottom:10px; color:#ef4444;">
                ⚠️ ${escapeHtml(report.flyingStars?.wuhuangPosition || '')}
            </div>
            <div class="fengshui-grid">${gridHtml}</div>
        `;
        visualBoard.hidden = false;
    }

    function renderYinyuan(result, mode) {
        if (!result) return;
        let contentHtml = '';

        if (result.grade && result.poem) {
            // 1. 求月老靈籤 (100籤)
            contentHtml = `
                <div class="fortune-scroll">
                    <span class="fortune-scroll-badge">🏮 月老靈籤 第 ${escapeHtml(result.number || 1)} 籤 · ${escapeHtml(result.title || result.grade)}</span>
                    <div class="fortune-scroll-poem" style="white-space:pre-line; font-size:18px; line-height:1.8; margin:16px 0;">${escapeHtml(result.poem)}</div>
                    <div style="background:rgba(255,255,255,0.05); border-radius:6px; padding:10px; margin-bottom:10px; font-size:14px;">
                        <strong>【籤解】</strong> ${escapeHtml(result.explanation || '')}
                    </div>
                    <div style="background:rgba(255,255,255,0.05); border-radius:6px; padding:10px; margin-bottom:12px; font-size:14px;">
                        <strong>【姻緣解讀】</strong> ${escapeHtml(result.reading || '')}
                    </div>
                    <div style="font-size:12px; color:var(--suite-text-muted);">靈驗指數：<strong>${escapeHtml(result.spiritualIndex || '75%')}</strong> · ${escapeHtml(result.guidance || '')}</div>
                </div>
            `;
        } else if (result.relationship && result.sweetness) {
            // 2. 生肖配對
            contentHtml = `
                <div class="zodiac-match-box">
                    <div class="zodiac-pair-display">${escapeHtml(result.first?.zodiac || '')} ✕ ${escapeHtml(result.second?.zodiac || '')}</div>
                    <div style="font-size:16px; font-weight:700; color:var(--suite-primary); margin:8px 0;">${escapeHtml(result.relationship)}</div>
                    <div class="zodiac-score-bar">
                        <div class="zodiac-score-fill" style="width:${Math.min(result.score || 70, 100)}%;"></div>
                    </div>
                    <div style="font-size:13px; color:var(--suite-text-muted); margin-bottom:14px;">
                        緣分契合指數：<strong>${escapeHtml(result.score || 70)} 分</strong>
                    </div>
                    <div style="display:grid; grid-template-columns:repeat(3,1fr); gap:8px; margin-bottom:12px; text-align:center;">
                        <div style="background:rgba(236,72,153,0.1); padding:8px; border-radius:6px;">
                            <div style="font-size:11px; color:#ec4899;">甜蜜指數</div>
                            <div style="font-size:15px; font-weight:700;">${escapeHtml(result.sweetness)}</div>
                        </div>
                        <div style="background:rgba(239,68,68,0.1); padding:8px; border-radius:6px;">
                            <div style="font-size:11px; color:#ef4444;">吵架磨合</div>
                            <div style="font-size:15px; font-weight:700;">${escapeHtml(result.conflict)}</div>
                        </div>
                        <div style="background:rgba(34,197,94,0.1); padding:8px; border-radius:6px;">
                            <div style="font-size:11px; color:#22c55e;">長久指數</div>
                            <div style="font-size:15px; font-weight:700;">${escapeHtml(result.longevity)}</div>
                        </div>
                    </div>
                    <p style="font-size:13px; color:var(--suite-text); margin-bottom:8px;">${escapeHtml(result.detail || '')}</p>
                    <div style="font-size:12px; color:var(--suite-text-muted);">💡 <strong>月老化解建議：</strong>${escapeHtml(result.fixAdvice || '')}</div>
                </div>
            `;
        } else if (result.mainStar && result.spousePalace) {
            // 3. 紫微夫妻宮
            contentHtml = `
                <div class="zodiac-match-box">
                    <div style="font-size:18px; font-weight:700; color:var(--suite-primary); margin-bottom:6px;">
                        👑 夫妻宮主星：【${escapeHtml(result.mainStar)}】（${escapeHtml(result.spousePalace)}宮）
                    </div>
                    <div style="font-size:12px; margin-bottom:12px; color:var(--suite-text-muted);">四化星曜：<strong>${escapeHtml(result.fourTransformations || '化祿')}</strong></div>
                    <div style="background:rgba(255,255,255,0.03); border:1px solid var(--suite-border); border-radius:6px; padding:10px; margin-bottom:8px; font-size:13px;">
                        <strong>【配偶特質畫像】</strong> ${escapeHtml(result.trait || '')}
                    </div>
                    <div style="background:rgba(255,255,255,0.03); border:1px solid var(--suite-border); border-radius:6px; padding:10px; margin-bottom:8px; font-size:13px;">
                        <strong>【感情互動模式】</strong> ${escapeHtml(result.relationshipMode || '')}
                    </div>
                    <div style="background:rgba(255,255,255,0.03); border:1px solid var(--suite-border); border-radius:6px; padding:10px; margin-bottom:8px; font-size:13px;">
                        <strong>【感情核心課題】</strong> ${escapeHtml(result.challenge || '')}
                    </div>
                    <div style="font-size:13px; color:var(--suite-primary); margin-top:8px;">
                        💡 <strong>月老開示：</strong>${escapeHtml(result.advice || '')}
                    </div>
                </div>
            `;
        } else if (result.favorableDirection && result.bestMonths) {
            // 4. 桃花運勢
            const bestMonthsHtml = (result.bestMonths || []).map((m) => `<span class="suite-tag auspicious">${escapeHtml(m)}</span>`).join(' ');
            contentHtml = `
                <div class="zodiac-match-box">
                    <div style="font-size:18px; font-weight:700; margin-bottom:8px; color:var(--suite-primary);">🌸 ${escapeHtml(result.zodiac || '')}年 · 桃花運勢預報</div>
                    <div style="font-size:14px; margin-bottom:8px;">吉利桃花方位：<strong>${escapeHtml(result.favorableDirection)}</strong></div>
                    <div style="margin:10px 0;">
                        <div style="font-size:12px; color:var(--suite-text-muted); margin-bottom:4px;">最旺桃花月份：</div>
                        <div style="display:flex; flex-wrap:wrap; gap:6px;">${bestMonthsHtml}</div>
                    </div>
                    <div style="font-size:12px; color:#ef4444; margin-bottom:10px;">需安靜沉澱月份：<strong>${escapeHtml(result.cautionMonth || '')}</strong></div>
                    <div style="background:rgba(255,255,255,0.03); border-radius:6px; padding:10px; font-size:13px; margin-top:6px;">
                        <strong>💡 開運攻略：</strong>${escapeHtml(result.luckyTips || '')}
                    </div>
                </div>
            `;
        } else if (result.yearPillarMatch && result.dayPillarMatch) {
            // 5. 八字合婚
            contentHtml = `
                <div class="zodiac-match-box">
                    <div style="font-size:18px; font-weight:700; color:var(--suite-primary); margin-bottom:6px;">
                        📜 八字合婚評分：${escapeHtml(result.score || 75)} 分（${escapeHtml(result.grade || '佳偶天成')}）
                    </div>
                    <div class="zodiac-score-bar" style="margin-bottom:12px;">
                        <div class="zodiac-score-fill" style="width:${Math.min(result.score || 75, 100)}%;"></div>
                    </div>
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:12px;">
                        <div style="background:rgba(255,255,255,0.03); padding:10px; border-radius:6px; font-size:12px;">
                            <strong>${escapeHtml(result.first?.name || '甲方')}</strong>：日主 ${escapeHtml(result.first?.dayMaster?.stem || '')}[${escapeHtml(result.first?.dayMaster?.element || '')}] · 屬${escapeHtml(result.first?.yearZodiac || '')}
                        </div>
                        <div style="background:rgba(255,255,255,0.03); padding:10px; border-radius:6px; font-size:12px;">
                            <strong>${escapeHtml(result.second?.name || '乙方')}</strong>：日主 ${escapeHtml(result.second?.dayMaster?.stem || '')}[${escapeHtml(result.second?.dayMaster?.element || '')}] · 屬${escapeHtml(result.second?.yearZodiac || '')}
                        </div>
                    </div>
                    <div style="font-size:13px; margin-bottom:6px;">${escapeHtml(result.yearPillarMatch || '')}</div>
                    <div style="font-size:13px; margin-bottom:6px;">${escapeHtml(result.dayPillarMatch || '')}</div>
                    <div style="font-size:13px; color:var(--suite-primary);">五行互補度：<strong>${escapeHtml(result.complementScore || '80%')}</strong></div>
                </div>
            `;
        } else if (result.profile && result.timeWindows) {
            // 6. 紅線測算
            const p = result.profile || {};
            const tw = result.timeWindows || {};
            contentHtml = `
                <div class="zodiac-match-box">
                    <div style="font-size:18px; font-weight:700; color:var(--suite-primary); margin-bottom:10px;">
                        🧵 紅線測算 · 你的正緣畫像
                    </div>
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:12px; font-size:13px;">
                        <div style="background:rgba(255,255,255,0.03); padding:10px; border-radius:6px;">
                            <strong>性格特質：</strong>${escapeHtml(p.trait || '')}
                        </div>
                        <div style="background:rgba(255,255,255,0.03); padding:10px; border-radius:6px;">
                            <strong>外貌氣質：</strong>${escapeHtml(p.appearance || '')}
                        </div>
                        <div style="background:rgba(255,255,255,0.03); padding:10px; border-radius:6px;">
                            <strong>職業傾向：</strong>${escapeHtml(p.career || '')}
                        </div>
                        <div style="background:rgba(255,255,255,0.03); padding:10px; border-radius:6px;">
                            <strong>相遇場景：</strong>${escapeHtml(p.scenario || '')}
                        </div>
                    </div>
                    <div style="background:rgba(236,72,153,0.1); border-left:4px solid #ec4899; padding:10px; border-radius:4px; font-size:13px; margin-bottom:10px;">
                        <strong>📅 最近紅線時機：</strong>${escapeHtml(tw.nearestRedThread || '')}<br>
                        <strong>💍 最佳婚戀年份：</strong>${escapeHtml(tw.goldenMarriageYears || '')}
                    </div>
                    <div style="font-size:12px; color:var(--suite-text-muted);">💡 <strong>月老錦囊：</strong>${escapeHtml(result.advice || '')}</div>
                </div>
            `;
        }

        visualBoard.innerHTML = `
            <div class="suite-board-title">🏮 賽博月老測算盤面</div>
            ${contentHtml}
        `;
        visualBoard.hidden = false;
    }

    function renderVisual(data, payload) {
        if (page === 'tarot') renderTarot(data);
        else if (page === 'bazi2') renderBazi(data);
        else if (page === 'fengshui') renderFengShui(data);
        else if (page === 'yinyuan') renderYinyuan(data, payload?.mode);
    }

    // --- Message Stream Helper ---

    function appendMessage(role, content) {
        const bubble = document.createElement('div');
        bubble.className = `suite-message-bubble ${role}`;
        if (role === 'assistant') {
            bubble.innerHTML = renderMarkdown(content);
        } else {
            bubble.textContent = content;
        }
        conversationStream.appendChild(bubble);
        conversationStream.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    // --- Form Payload Builder ---

    const val = (name) => form.elements[name]?.value?.trim() || '';

    function buildPayload() {
        const question = val('question');
        if (page === 'tarot') {
            return {
                spread: form.elements['spread']?.value || 'three',
                variant: val('variant') || 'timeline',
                question
            };
        }
        if (page === 'bazi2') {
            return {
                name: val('name'),
                formerName: val('formerName'),
                calendar: val('calendar') || 'solar',
                date: val('date'),
                time: val('time') || '12:00',
                sex: val('sex') || '男',
                place: val('place'),
                question
            };
        }
        if (page === 'fengshui') {
            const mode = val('mode') || 'yangzhai';
            if (mode === 'shaqi') {
                return { mode, shaType: val('shaType'), question };
            }
            if (mode === 'zeri') {
                return {
                    mode,
                    matter: val('zeriMatter'),
                    year: Number(val('zeriYear')) || new Date().getFullYear(),
                    month: Number(val('zeriMonth')) || 5,
                    question
                };
            }
            return {
                mode,
                facing: val('facing') || '南',
                moveInYear: Number(val('moveInYear')) || 2024,
                residentYear: Number(val('residentYear')) || 1990,
                sex: val('sex') || '男',
                year: Number(val('year')) || new Date().getFullYear(),
                question
            };
        }
        if (page === 'yinyuan') {
            const mode = val('mode') || 'fortune';
            if (mode === 'fortune') {
                return {
                    mode,
                    name: val('fortuneName'),
                    sex: val('fortuneSex'),
                    stickNum: val('fortuneStickNum'),
                    birthDate: val('fortuneBirthDate'),
                    status: val('fortuneStatus'),
                    question
                };
            }
            if (mode === 'zodiac') {
                return {
                    mode,
                    firstZodiac: val('firstZodiac'),
                    firstYear: val('firstYear'),
                    secondZodiac: val('secondZodiac'),
                    secondYear: val('secondYear'),
                    stage: val('zodiacRelationStage'),
                    question
                };
            }
            if (mode === 'ziwei-marriage') {
                return {
                    mode,
                    name: val('ziweiName'),
                    sex: val('ziweiSex'),
                    calendar: val('ziweiCalendar'),
                    date: val('ziweiDate'),
                    time: val('ziweiShichen') || '12:00',
                    status: val('ziweiStatus'),
                    question
                };
            }
            if (mode === 'peach-blossom') {
                return {
                    mode,
                    birthDate: val('taohuaBirthDate'),
                    firstYear: val('taohuaYear') || (val('taohuaBirthDate') ? val('taohuaBirthDate').split('-')[0] : 1995),
                    sex: val('taohuaSex'),
                    status: val('taohuaStatus'),
                    scope: val('taohuaScope'),
                    question
                };
            }
            if (mode === 'bazi-match') {
                return {
                    mode,
                    first: {
                        name: val('bmName1'),
                        sex: val('bmSex1'),
                        calendar: val('bmCal1'),
                        date: val('bmDate1'),
                        time: val('bmTime1')
                    },
                    second: {
                        name: val('bmName2'),
                        sex: val('bmSex2'),
                        calendar: val('bmCal2'),
                        date: val('bmDate2'),
                        time: val('bmTime2')
                    },
                    stage: val('bmStage'),
                    question
                };
            }
            if (mode === 'red-thread') {
                return {
                    mode,
                    name: val('rtName'),
                    sex: val('rtSex'),
                    seekingSex: val('rtSeekingSex'),
                    calendar: val('rtCalendar'),
                    date: val('rtDate'),
                    time: val('rtShichen') || '09:00',
                    status: val('rtStatus'),
                    preference: val('rtPreference'),
                    question
                };
            }
            return { mode, question };
        }
        return { question };
    }

    // --- One-Click Main Flow ---

    const endpointMap = {
        tarot: '/api/tarot/reading',
        fengshui: '/api/fengshui/report',
        bazi2: '/api/bazi2/chart',
        yinyuan: '/api/yinyuan/reading'
    };

    form?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const payload = buildPayload();

        // Basic date validation for bazi2
        if (page === 'bazi2' && !payload.date) {
            alert('請選擇出生日期');
            return;
        }

        if (submitBtn) submitBtn.disabled = true;
        aiSection.hidden = false;
        aiLoading.hidden = false;
        conversationStream.innerHTML = '';
        conversationHistory = [];

        try {
            // Step 1: Run Calculation
            const calcRes = await fetch(endpointMap[page], {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const calcData = await calcRes.json();
            if (!calcData.success) throw new Error(calcData.error || '排盤計算失敗');

            lastResult = calcData.reading || calcData.report || calcData.chart || calcData.result;
            renderVisual(lastResult, payload);

            // Step 2: Auto Call AI Analysis
            const userQuestion = payload.question || '請為我進行全盤深度解讀與具體指引。';
            const aiRes = await fetch(`/api/${page}/llm-analysis`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    result: lastResult,
                    question: userQuestion,
                    conversationHistory: []
                })
            });

            const aiData = await aiRes.json();
            aiLoading.hidden = true;

            if (aiData.success && aiData.analysis) {
                conversationHistory.push({ role: 'user', content: userQuestion });
                conversationHistory.push({ role: 'assistant', content: aiData.analysis });
                appendMessage('assistant', aiData.analysis);
                if (followUpForm) followUpForm.hidden = false;
            } else {
                appendMessage('assistant', `⚠️ AI 解讀暫不可用：${aiData.error || '請稍後重試'}`);
            }
        } catch (err) {
            aiLoading.hidden = true;
            alert(`錯誤：${err.message}`);
        } finally {
            if (submitBtn) submitBtn.disabled = false;
        }
    });

    // --- Follow-up Questions Flow ---

    followUpForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const question = followUpInput.value.trim();
        if (!question || !lastResult) return;

        followUpInput.value = '';
        appendMessage('user', question);

        const typingBubble = document.createElement('div');
        typingBubble.className = 'suite-message-bubble assistant';
        typingBubble.innerHTML = '<span class="suite-spinner" style="width:16px; height:16px; vertical-align:middle; margin-right:6px;"></span> 大師思考中…';
        conversationStream.appendChild(typingBubble);

        try {
            const aiRes = await fetch(`/api/${page}/llm-analysis`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    result: lastResult,
                    question,
                    conversationHistory
                })
            });
            const aiData = await aiRes.json();
            conversationStream.removeChild(typingBubble);

            if (aiData.success && aiData.analysis) {
                conversationHistory.push({ role: 'user', content: question });
                conversationHistory.push({ role: 'assistant', content: aiData.analysis });
                appendMessage('assistant', aiData.analysis);
            } else {
                appendMessage('assistant', `⚠️ 解讀失敗：${aiData.error || '無法取得回應'}`);
            }
        } catch (err) {
            if (typingBubble.parentNode) conversationStream.removeChild(typingBubble);
            appendMessage('assistant', `⚠️ 網路異常：${err.message}`);
        }
    });

    // --- Dynamic Mode Switcher for Yinyuan ---
    if (page === 'yinyuan') {
        const modeSelect = form?.elements['mode'];
        const groupMap = {
            fortune: document.getElementById('groupFortune'),
            zodiac: document.getElementById('groupZodiac'),
            'ziwei-marriage': document.getElementById('groupZiwei'),
            'peach-blossom': document.getElementById('groupTaohua'),
            'bazi-match': document.getElementById('groupBaziMatch'),
            'red-thread': document.getElementById('groupRedThread')
        };

        const updateYinyuanFields = () => {
            const currentMode = modeSelect?.value || 'fortune';
            Object.entries(groupMap).forEach(([k, el]) => {
                if (el) el.style.display = k === currentMode ? 'block' : 'none';
            });
        };

        modeSelect?.addEventListener('change', updateYinyuanFields);
        updateYinyuanFields();

        const btnRandomStick = document.getElementById('btnRandomStick');
        btnRandomStick?.addEventListener('click', () => {
            const stickInput = document.getElementById('fortuneStickNum');
            if (stickInput) {
                stickInput.value = Math.floor(Math.random() * 100) + 1;
            }
        });
    }

    // --- Dynamic Mode Switcher for Fengshui ---
    if (page === 'fengshui') {
        const fsModeSelect = form?.elements['mode'];
        const fsGroupMap = {
            yangzhai: document.getElementById('fsGroupYangzhai'),
            shaqi: document.getElementById('fsGroupShaqi'),
            zeri: document.getElementById('fsGroupZeri')
        };

        const updateFengshuiFields = () => {
            const currentMode = fsModeSelect?.value || 'yangzhai';
            Object.entries(fsGroupMap).forEach(([k, el]) => {
                if (el) el.style.display = k === currentMode ? 'block' : 'none';
            });
        };

        fsModeSelect?.addEventListener('change', updateFengshuiFields);
        updateFengshuiFields();
    }
})();
