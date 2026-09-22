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
    window.conversationHistory = conversationHistory;

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
                    <div style="font-size: var(--type-caption); margin-top:4px; color:var(--suite-text-muted);">屬${escapeHtml(card.element || '')} · ${escapeHtml(card.suit || '')}</div>
                    ${card.isMajor ? '<div class="tarot-major-tag">★ 大阿爾克那</div>' : ''}
                </div>
            `;
        }).join('');

        const relations = reading.relations || {};
        const elementCounts = relations.elementCounts || {};
        const combosHtml = (relations.matchedCombos || []).map((combo) => `
            <div style="font-size: var(--type-meta); color:var(--suite-text); margin-bottom:4px;">✨ ${escapeHtml(combo)}</div>
        `).join('');

        const relationsHtml = `
            <div style="background:var(--suite-bg-card, rgba(255,255,255,0.03)); border:1px solid var(--suite-border); border-radius:8px; padding:12px; margin-top:14px;">
                <div style="font-size: var(--type-label); font-weight:700; color:var(--suite-primary); margin-bottom:8px;">🔮 牌間關係與能量分佈</div>
                <div style="font-size: var(--type-meta); margin-bottom:6px; color:var(--suite-text-muted);">
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
            <div style="font-size: var(--type-meta); color:var(--suite-text-muted); margin-bottom:12px;">時辰因子：${escapeHtml(reading.timeFactor || '')} | 種子：${escapeHtml(reading.seed || '')}</div>
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
                    <tr>${pillars.map((p) => `<td style="font-size: var(--type-caption); color:var(--suite-text-muted);">${escapeHtml(p.nayin || '')}<br><span style="color:var(--suite-primary);">${escapeHtml(p.changsheng || '')}</span></td>`).join('')}</tr>
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
                <div style="font-size: var(--type-meta); color:var(--suite-text-muted); margin-bottom:4px;">
                    喜用神：<strong style="color:#22c55e;">${escapeHtml(strength.usefulGod || '順應五行生剋')}</strong>
                </div>
                <div style="font-size: var(--type-meta); color:var(--suite-text-muted);">
                    忌神：<strong style="color:#ef4444;">${escapeHtml(strength.tabooGod || '過旺五行')}</strong>
                </div>
            </div>
        `;

        const counts = chart.fiveElements?.counts || {};
        const percentages = chart.fiveElements?.percentages || {};
        const elementsHtml = `
            <div class="five-elements-meter">
                <div style="font-size: var(--type-meta); font-weight:700; margin-bottom:8px; color:var(--suite-text-muted);">
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
                <div style="font-size: var(--type-meta); font-weight:700; margin-bottom:6px; color:var(--suite-text-muted);">命帶神煞</div>
                <div style="display:flex; flex-wrap:wrap; gap:6px;">${shenshaList}</div>
            </div>
        ` : '';

        const luckCyclesHtml = (chart.luckCycles || []).length > 0 ? `
            <div style="font-size: var(--type-meta); font-weight:700; margin-bottom:6px; color:var(--suite-text-muted);">大運排盤</div>
            <div class="luck-cycles-scroller">
                ${chart.luckCycles.map((c) => `
                    <div class="luck-cycle-card">
                        <div class="luck-cycle-ganzhi">${escapeHtml(c.ganzhi)}</div>
                        <div class="luck-cycle-age">${escapeHtml(c.startAge)}~${escapeHtml(c.endAge)}歲</div>
                        <div style="font-size: var(--type-micro); color:var(--suite-text-muted);">${escapeHtml(c.startYear)}~${escapeHtml(c.endYear)}</div>
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
                    <div style="font-size: var(--type-label); font-weight:700; color:var(--suite-primary); margin-bottom:8px;">${escapeHtml(report.shaName)} · ${escapeHtml(report.type)}</div>
                    <p style="font-size: var(--type-reading); margin-bottom:12px;">${escapeHtml(report.desc)}</p>
                    <div style="background:rgba(239, 68, 68, 0.1); border-left:4px solid #ef4444; padding:10px; border-radius:4px; font-size: var(--type-label);">
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
                    <td style="padding:8px; font-size: var(--type-meta);">${escapeHtml(d.gods)}</td>
                    <td style="padding:8px; font-size: var(--type-meta); color:var(--suite-text-muted);">${escapeHtml(d.bestHours)}</td>
                </tr>
            `).join('');

            visualBoard.innerHTML = `
                <div class="suite-board-title">📅 傳統擇日吉時推薦（${escapeHtml(report.matter)} · ${escapeHtml(report.year)}年${escapeHtml(report.month)}月）</div>
                <div style="display:flex; gap:12px; flex-wrap:wrap; margin-bottom:12px; font-size: var(--type-meta);">
                    <div style="background:rgba(239,68,68,0.1); padding:6px 10px; border-radius:4px; color:#ef4444;">⚠️ ${escapeHtml(report.suiPoWarning)}</div>
                    <div style="background:rgba(245,158,11,0.1); padding:6px 10px; border-radius:4px; color:#f59e0b;">⚠️ ${escapeHtml(report.sanShaWarning)}</div>
                </div>
                <table style="width:100%; border-collapse:collapse; font-size: var(--type-label); margin-top:8px;">
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

        const FENGSHUI_CATALOG_LABELS = {
            "space.entryway": "玄關", "space.living_room": "客廳", "space.dining_room": "餐廳", "space.master_bedroom": "主臥室",
            "space.second_bedroom": "次臥室", "space.children_room": "兒童房", "space.elder_room": "長輩房", "space.study": "書房",
            "space.studio": "工作室", "space.kitchen": "廚房", "space.bathroom": "浴室", "space.toilet": "廁所",
            "space.storage": "儲藏室", "space.dressing_room": "更衣室", "space.other_room": "其他房間",
            "door.main": "大門", "door.secondary": "次要門", "window.standard": "窗戶", "door.balcony": "陽台", "opening.lightwell": "天井",
            "furniture.bed": "睡床", "furniture.sofa": "沙發", "furniture.desk": "書桌", "furniture.dining_table": "餐桌",
            "furniture.shrine": "神位/佛堂", "furniture.tv_cabinet": "電視櫃", "furniture.coffee_table": "茶几",
            "furniture.vanity": "梳妝台", "furniture.wardrobe": "衣櫃", "furniture.shelf": "收納架", "furniture.plant": "綠植盆栽",
            "appliance.stove": "瓦斯爐/灶", "appliance.refrigerator": "冰箱", "appliance.sink": "水槽", "appliance.washing_machine": "洗衣機",
            "appliance.water_heater": "熱水器", "appliance.air_conditioner": "冷氣機", "appliance.microwave": "微波爐/烤箱",
            "appliance.water_dispenser": "飲水機", "appliance.aquarium": "魚缸/水景", "appliance.audio": "音響", "appliance.air_purifier": "空氣清淨機",
            "circulation.entry": "主玄關走道", "circulation.hallway": "室內長廊", "circulation.stairs": "樓梯", "circulation.elevator": "電梯",
            "exterior.mingtang": "明堂/開闊地", "exterior.road_rush": "路沖", "exterior.sky_cut": "天斬煞", "exterior.reverse_bow": "反弓水/路",
            "exterior.wall_knife": "高樓壁刀", "exterior.park": "公園綠地",
            "form.beam_press": "樑壓頂", "form.missing_corner": "缺角", "form.convex_corner": "凸角", "form.through_house": "穿堂格局",
            "form.door_to_door": "門對門", "form.door_to_window": "門對窗", "form.stairs_rush_door": "梯沖門", "form.dark_room": "暗室",
            "form.large_window": "大窗採光", "form.high_ceiling": "挑高", "form.sloped_roof": "斜頂"
        };

        const gridHtml = layout.map((item) => {
            if (item.key === '中') {
                const palaceItems = (report.palaceDetails || []).find(p => p.direction === '中' || p.direction === '中宮')?.layoutObjects || [];
                const tagsHtml = palaceItems.length > 0 ? `
                    <div class="fs-cell-tags-box">
                        ${palaceItems.map(id => `<span class="fs-cell-tag">${escapeHtml(FENGSHUI_CATALOG_LABELS[id] || id)}</span>`).join('')}
                    </div>
                ` : '';
                return `
                    <div class="fengshui-cell center-palace">
                        <div class="fengshui-dir-title">${item.name}</div>
                        <div style="font-size: var(--type-label); font-weight:700; margin:4px 0; color:var(--suite-primary);">${escapeHtml(house)}</div>
                        <div class="fengshui-flying-star">九運運星: ${base['中'] || 9}</div>
                        <div class="fengshui-flying-star" style="color:#ef4444;">流年飛星: ${annual['中'] || 1}</div>
                        ${tagsHtml}
                    </div>
                `;
            }
            const starRaw = dir[item.key] || '';
            const isAuspicious = starRaw.includes('吉');
            const starBadgeClass = isAuspicious ? 'auspicious' : 'inauspicious';

            const mountainStars = report.flyingStars?.mountain || {};
            const facingStars = report.flyingStars?.facing || {};
            const mStar = mountainStars[item.key];
            const fStar = facingStars[item.key];
            const hasXkStars = mStar !== undefined && fStar !== undefined;
            const palaceItems = (report.palaceDetails || []).find(p => p.direction === item.key)?.layoutObjects || [];
            const tagsHtml = palaceItems.length > 0 ? `
                <div class="fs-cell-tags-box">
                    ${palaceItems.map(id => `<span class="fs-cell-tag">${escapeHtml(FENGSHUI_CATALOG_LABELS[id] || id)}</span>`).join('')}
                </div>
            ` : '';

            return `
                <div class="fengshui-cell">
                    <div class="fengshui-dir-title">${item.name}</div>
                    <span class="fengshui-star-badge ${starBadgeClass}">${escapeHtml(starRaw)}</span>
                    <div class="fengshui-flying-star">運星: ${base[item.key] || '-'} | 流年: ${annual[item.key] || '-'}</div>
                    ${hasXkStars ? `<div class="fengshui-flying-star" style="color:var(--suite-primary); font-weight:600;">山星: ${mStar} · 向星: ${fStar}</div>` : ''}
                    ${tagsHtml}
                </div>
            `;
        }).join('');

        const mingGuaName = report.resident?.mingGua?.name || '';

        let orientationHtml = '';
        if (report.orientation) {
            const chartQual = report.chartQualification || {};
            const qualBadgeClass = chartQual.chartType === 'void'
                ? 'badge-void'
                : (chartQual.chartType === 'candidate' ? 'badge-candidate' : (chartQual.chartType === 'substitute' ? 'badge-sub' : 'badge-pure'));
            orientationHtml = `
                <div class="fs-orientation-info-row">
                    <span class="fs-info-pill">🧭 羅盤向首：<strong>${escapeHtml(report.orientation.heading)}°</strong></span>
                    <span class="fs-info-pill">⛰️ 坐山向首：<strong>${escapeHtml(report.orientation.sittingMountain)}山${escapeHtml(report.orientation.facingMountain)}向</strong></span>
                    <span class="compass-badge ${qualBadgeClass}">${escapeHtml(chartQual.chartDesc || '正向下卦')}</span>
                    ${chartQual.warning ? `<div class="compass-tilt-alert" style="margin-top:6px;">⚠️ ${escapeHtml(chartQual.warning)}</div>` : ''}
                </div>
            `;
        }

        let layoutEvaluationHtml = '';
        if (report.layoutEvaluation) {
            const ev = report.layoutEvaluation;
            const findingsHtml = (ev.findings || []).map(f => {
                const fLevelClass = f.severity === 'warning' ? 'level-warning' : (f.severity === 'negative' ? 'level-bad' : 'level-good');
                return `
                    <div class="fs-finding-item ${fLevelClass}">
                        <div class="fs-finding-title">${escapeHtml(f.title)} (${escapeHtml(f.palace)}宮)</div>
                        <div class="fs-finding-desc">${escapeHtml((f.evidence || []).join('；'))}</div>
                        <div class="fs-finding-rec">💡 佈局建議：${escapeHtml(f.action || '')}</div>
                        ${f.reference ? `<div class="fs-finding-ref" style="font-size:11px; opacity:0.75; margin-top:4px;">📖 考據出處：${escapeHtml(f.reference)}</div>` : ''}
                    </div>
                `;
            }).join('');

            const actionsHtml = (ev.actions || []).length > 0 ? `
                <div class="fs-actions-list">
                    <div style="font-weight:700; margin-bottom:6px; font-size:13px;">📋 優先行動指引（依急迫性排序）：</div>
                        ${ev.actions.map((action, index) => `
                        <div class="fs-action-item">
                            <span class="fs-action-priority">P${index + 1}</span>
                            <div>${escapeHtml(action)}</div>
                        </div>
                    `).join('')}
                </div>
            ` : '';

            const quotesHtml = (ev.quotesCited || []).length > 0 ? `
                <div class="fs-quotes-list">
                    <div style="font-weight:700; margin-bottom:6px; font-size:13px;">📜 經典引證</div>
                    ${(ev.quotesCited || []).map(quote => `
                        <div class="fs-quote-cite">${escapeHtml(quote.source || '')}：「${escapeHtml(quote.text || '')}」<br>
                            <span style="opacity:0.85;">義理：${escapeHtml(quote.interpretation || '')}</span>
                            ${quote.reference ? `<br><span style="font-size:11px; opacity:0.75;">📖 出處：${escapeHtml(quote.reference)}</span>` : ''}
                        </div>
                    `).join('')}
                </div>
            ` : '';

            const missingHtml = (ev.missingData || []).length > 0 ? `
                <div class="fs-missing-box">
                    <strong>ℹ️ 資料不足誠實標註（未標註之住宅項目，堪輿系統不妄作推斷）：</strong>
                    <ul style="margin:4px 0 0 16px; padding:0;">
                        ${ev.missingData.map(m => `<li>${escapeHtml(typeof m === 'string' ? m : `${m.item || ''}：${m.note || ''}`)}</li>`).join('')}
                    </ul>
                </div>
            ` : '';

            layoutEvaluationHtml = `
                <div class="fs-eval-card">
                    <div class="fs-eval-header">
                        <div class="fs-eval-title">🎯 中州派玄空室內格局評估</div>
                    </div>
                    ${findingsHtml || '<div class="text-muted" style="font-size:12px;">目前尚未在九宮中放置關鍵住宅物件。</div>'}
                    ${actionsHtml}
                    ${quotesHtml}
                    ${missingHtml}
                </div>
            `;
        }

        visualBoard.innerHTML = `
            <div class="suite-board-title">🏡 八宅九星與玄空飛星盤（${escapeHtml(house)} · 坐向：${escapeHtml(report.facing || '')}）</div>
            ${orientationHtml}
            <div style="display:flex; justify-content:space-between; flex-wrap:wrap; gap:8px; font-size: var(--type-label); margin-bottom:12px; color:var(--suite-text-muted);">
                <div>居住者命卦：<strong>${escapeHtml(mingGuaName)}</strong></div>
                <div>九運格局：<strong style="color:var(--suite-primary);">${escapeHtml(report.pattern || '旺山旺向')}</strong></div>
            </div>
            <div style="font-size: var(--type-meta); margin-bottom:10px; color:#ef4444;">
                ⚠️ ${escapeHtml(report.flyingStars?.wuhuangPosition || '')}
            </div>
            <div class="fengshui-grid">${gridHtml}</div>
            ${layoutEvaluationHtml}
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
                    <div class="fortune-scroll-poem" style="white-space:pre-line; font-size: var(--type-display); line-height:1.8; margin:16px 0;">${escapeHtml(result.poem)}</div>
                    <div style="background:rgba(255,255,255,0.05); border-radius:6px; padding:10px; margin-bottom:10px; font-size: var(--type-reading);">
                        <strong>【籤解】</strong> ${escapeHtml(result.explanation || '')}
                    </div>
                    <div style="background:rgba(255,255,255,0.05); border-radius:6px; padding:10px; margin-bottom:12px; font-size: var(--type-reading);">
                        <strong>【姻緣解讀】</strong> ${escapeHtml(result.reading || '')}
                    </div>
                    <div style="font-size: var(--type-meta); color:var(--suite-text-muted);">靈驗指數：<strong>${escapeHtml(result.spiritualIndex || '75%')}</strong> · ${escapeHtml(result.guidance || '')}</div>
                </div>
            `;
        } else if (result.relationship && result.sweetness) {
            // 2. 生肖配對
            contentHtml = `
                <div class="zodiac-match-box">
                    <div class="zodiac-pair-display">${escapeHtml(result.first?.zodiac || '')} ✕ ${escapeHtml(result.second?.zodiac || '')}</div>
                    <div style="font-size: var(--type-label); font-weight:700; color:var(--suite-primary); margin:8px 0;">${escapeHtml(result.relationship)}</div>
                    <div class="zodiac-score-bar">
                        <div class="zodiac-score-fill" style="width:${Math.min(result.score || 70, 100)}%;"></div>
                    </div>
                    <div style="font-size: var(--type-label); color:var(--suite-text-muted); margin-bottom:14px;">
                        緣分契合指數：<strong>${escapeHtml(result.score || 70)} 分</strong>
                    </div>
                    <div style="display:grid; grid-template-columns:repeat(3,1fr); gap:8px; margin-bottom:12px; text-align:center;">
                        <div style="background:rgba(236,72,153,0.1); padding:8px; border-radius:6px;">
                            <div style="font-size: var(--type-caption); color:#ec4899;">甜蜜指數</div>
                            <div style="font-size: var(--type-label); font-weight:700;">${escapeHtml(result.sweetness)}</div>
                        </div>
                        <div style="background:rgba(239,68,68,0.1); padding:8px; border-radius:6px;">
                            <div style="font-size: var(--type-caption); color:#ef4444;">吵架磨合</div>
                            <div style="font-size: var(--type-label); font-weight:700;">${escapeHtml(result.conflict)}</div>
                        </div>
                        <div style="background:rgba(34,197,94,0.1); padding:8px; border-radius:6px;">
                            <div style="font-size: var(--type-caption); color:#22c55e;">長久指數</div>
                            <div style="font-size: var(--type-label); font-weight:700;">${escapeHtml(result.longevity)}</div>
                        </div>
                    </div>
                    <p style="font-size: var(--type-label); color:var(--suite-text); margin-bottom:8px;">${escapeHtml(result.detail || '')}</p>
                    <div style="font-size: var(--type-meta); color:var(--suite-text-muted);">💡 <strong>月老化解建議：</strong>${escapeHtml(result.fixAdvice || '')}</div>
                </div>
            `;
        } else if (result.mainStar && result.spousePalace) {
            // 3. 紫微夫妻宮
            contentHtml = `
                <div class="zodiac-match-box">
                    <div style="font-size: var(--type-display); font-weight:700; color:var(--suite-primary); margin-bottom:6px;">
                        👑 夫妻宮主星：【${escapeHtml(result.mainStar)}】（${escapeHtml(result.spousePalace)}宮）
                    </div>
                    <div style="font-size: var(--type-meta); margin-bottom:12px; color:var(--suite-text-muted);">四化星曜：<strong>${escapeHtml(result.fourTransformations || '化祿')}</strong></div>
                    <div style="background:rgba(255,255,255,0.03); border:1px solid var(--suite-border); border-radius:6px; padding:10px; margin-bottom:8px; font-size: var(--type-label);">
                        <strong>【配偶特質畫像】</strong> ${escapeHtml(result.trait || '')}
                    </div>
                    <div style="background:rgba(255,255,255,0.03); border:1px solid var(--suite-border); border-radius:6px; padding:10px; margin-bottom:8px; font-size: var(--type-label);">
                        <strong>【感情互動模式】</strong> ${escapeHtml(result.relationshipMode || '')}
                    </div>
                    <div style="background:rgba(255,255,255,0.03); border:1px solid var(--suite-border); border-radius:6px; padding:10px; margin-bottom:8px; font-size: var(--type-label);">
                        <strong>【感情核心課題】</strong> ${escapeHtml(result.challenge || '')}
                    </div>
                    <div style="font-size: var(--type-label); color:var(--suite-primary); margin-top:8px;">
                        💡 <strong>月老開示：</strong>${escapeHtml(result.advice || '')}
                    </div>
                </div>
            `;
        } else if (result.peachDirection || result.favorableDirection) {
            // 4. 桃花運勢
            const pDir = result.peachDirection || result.favorableDirection;
            const peakMonthsHtml = (result.peakMonths || result.bestMonths || []).map((m) => `<span class="suite-tag auspicious">${escapeHtml(m)}</span>`).join(' ');
            const monthlyFlowHtml = (result.monthlyFlow || []).map((m) => `
                <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.03); border:1px solid var(--suite-border); border-radius:6px; padding:6px 10px; margin-bottom:4px; font-size: var(--type-meta);">
                    <span style="font-weight:700; color:var(--suite-text);">${escapeHtml(m.month)}</span>
                    <span style="color:var(--suite-text-muted);">${escapeHtml(m.theme)}</span>
                    <span class="suite-tag ${m.score >= 88 ? 'auspicious' : ''}">${escapeHtml(m.score)}分</span>
                </div>
            `).join('');

            contentHtml = `
                <div class="zodiac-match-box">
                    <div style="font-size: var(--type-display); font-weight:700; margin-bottom:8px; color:var(--suite-primary);">🌸 ${escapeHtml(result.zodiac || '')}年生人 · 2026丙午年桃花運勢預報</div>
                    <div style="font-size: var(--type-reading); margin-bottom:8px;">正緣桃花方位：<strong>${escapeHtml(pDir)}</strong>（${escapeHtml(result.peachDesc || '')}）</div>
                    <div style="margin:10px 0;">
                        <div style="font-size: var(--type-meta); color:var(--suite-text-muted); margin-bottom:4px;">最佳結緣高峰月份：</div>
                        <div style="display:flex; flex-wrap:wrap; gap:6px;">${peakMonthsHtml}</div>
                    </div>
                    ${monthlyFlowHtml ? `
                        <div style="margin:12px 0;">
                            <div style="font-size: var(--type-meta); font-weight:700; color:var(--suite-text-muted); margin-bottom:6px;">12個月桃花起伏曲線</div>
                            <div style="max-height:160px; overflow-y:auto; padding-right:4px;">${monthlyFlowHtml}</div>
                        </div>
                    ` : ''}
                    <div style="background:rgba(255,255,255,0.03); border-radius:6px; padding:10px; font-size: var(--type-label); margin-top:6px;">
                        <strong>💡 開運攻略：</strong>${escapeHtml(result.advice || result.luckyTips || '')}
                    </div>
                </div>
            `;
        } else if (result.yearPillarMatch && result.dayPillarMatch) {
            // 5. 八字合婚
            contentHtml = `
                <div class="zodiac-match-box">
                    <div style="font-size: var(--type-display); font-weight:700; color:var(--suite-primary); margin-bottom:6px;">
                        📜 八字合婚評分：${escapeHtml(result.score || 75)} 分（${escapeHtml(result.grade || '佳偶天成')}）
                    </div>
                    <div class="zodiac-score-bar" style="margin-bottom:12px;">
                        <div class="zodiac-score-fill" style="width:${Math.min(result.score || 75, 100)}%;"></div>
                    </div>
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:12px;">
                        <div style="background:rgba(255,255,255,0.03); padding:10px; border-radius:6px; font-size: var(--type-meta);">
                            <strong>${escapeHtml(result.first?.name || '甲方')}</strong>：日主 ${escapeHtml(result.first?.dayMaster?.stem || '')}[${escapeHtml(result.first?.dayMaster?.element || '')}] · 屬${escapeHtml(result.first?.yearZodiac || '')}
                        </div>
                        <div style="background:rgba(255,255,255,0.03); padding:10px; border-radius:6px; font-size: var(--type-meta);">
                            <strong>${escapeHtml(result.second?.name || '乙方')}</strong>：日主 ${escapeHtml(result.second?.dayMaster?.stem || '')}[${escapeHtml(result.second?.dayMaster?.element || '')}] · 屬${escapeHtml(result.second?.yearZodiac || '')}
                        </div>
                    </div>
                    <div style="font-size: var(--type-label); margin-bottom:6px;">${escapeHtml(result.yearPillarMatch || '')}</div>
                    <div style="font-size: var(--type-label); margin-bottom:6px;">${escapeHtml(result.dayPillarMatch || '')}</div>
                    <div style="font-size: var(--type-label); color:var(--suite-primary);">五行互補度：<strong>${escapeHtml(result.complementScore || '80%')}</strong></div>
                </div>
            `;
        } else if (result.profile && (result.timeWindows || result.oracle)) {
            // 6. 紅線測算
            const p = result.profile || {};
            const oracle = result.oracle || {};
            const timeWindowsList = Array.isArray(result.timeWindows) ? result.timeWindows : [];
            const timeWindowsHtml = timeWindowsList.map((tw) => `
                <div style="background:rgba(236,72,153,0.08); border-left:3px solid #ec4899; padding:8px 10px; border-radius:4px; margin-bottom:6px; font-size: var(--type-meta);">
                    <strong>📅 ${escapeHtml(tw.period)}</strong>（${escapeHtml(tw.trigger)}）：${escapeHtml(tw.advice)}
                </div>
            `).join('');

            contentHtml = `
                <div class="zodiac-match-box">
                    <div style="font-size: var(--type-display); font-weight:700; color:var(--suite-primary); margin-bottom:10px;">
                        🧵 紅線測算 · 你的正緣畫像與黃金時空
                    </div>
                    ${oracle.poem ? `
                        <div style="background:rgba(255,255,255,0.03); border:1px solid var(--suite-border); border-radius:6px; padding:10px; margin-bottom:12px; font-size: var(--type-label); text-align:center;">
                            <div style="color:#ec4899; font-weight:700; margin-bottom:4px;">🏮 月老籤詩神諭【第${escapeHtml(oracle.stickNumber || 1)}籤 · ${escapeHtml(oracle.type || '上吉')}】</div>
                            <div style="font-size: var(--type-label); font-weight:700; color:var(--suite-text); margin-bottom:4px;">${escapeHtml(oracle.poem)}</div>
                            <div style="font-size: var(--type-meta); color:var(--suite-text-muted);">${escapeHtml(oracle.explanation || '')}</div>
                        </div>
                    ` : ''}
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:12px; font-size: var(--type-label);">
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
                    ${timeWindowsHtml ? `
                        <div style="margin-bottom:10px;">
                            <div style="font-size: var(--type-meta); font-weight:700; color:var(--suite-text-muted); margin-bottom:6px;">三大黃金良緣時空窗口</div>
                            ${timeWindowsHtml}
                        </div>
                    ` : ''}
                    <div style="font-size: var(--type-meta); color:var(--suite-text-muted); margin-top:8px;">💡 <strong>月老錦囊：</strong>${escapeHtml(result.advice || '')}</div>
                </div>
            `;
        }

        visualBoard.innerHTML = `
            <div class="suite-board-title">🏮 月老測算盤面</div>
            ${contentHtml}
        `;
        visualBoard.hidden = false;
    }

    function renderZiwei(chart) {
        if (!chart || !chart.palaces) return;

        const maleSizeCard = document.getElementById('maleSizeResultCard');
        if (maleSizeCard) maleSizeCard.hidden = true;
        const spouseCard = document.getElementById('spouseResultCard');
        if (spouseCard) spouseCard.hidden = true;

        const branchPalaceMap = {};
        chart.palaces.forEach((p) => {
            branchPalaceMap[p.branch] = p;
        });

        const centerHtml = `
            <div class="ziwei-center-info">
                <div style="font-size: var(--type-label); font-weight:700; color:var(--suite-primary); margin-bottom:6px;">紫微斗數命盤</div>
                <div style="font-size: var(--type-label); margin-bottom:4px;"><strong>${escapeHtml(chart.bureau)}</strong> · ${escapeHtml(chart.lunar?.ganzhi || '')}</div>
                <div style="font-size: var(--type-meta); color:var(--suite-text-muted); margin-bottom:6px;">
                    命宮【${escapeHtml(chart.mingPalaceBranch)}】· 身宮【${escapeHtml(chart.shenPalaceBranch)}】
                </div>
                <div style="font-size: var(--type-meta); margin-bottom:6px;">
                    命主：<strong>${escapeHtml(chart.mingzhu)}</strong> | 身主：<strong>${escapeHtml(chart.shenzhu)}</strong>
                </div>
                <div style="display:flex; gap:4px; justify-content:center; flex-wrap:wrap; margin-top:4px;">
                    <span class="ziwei-sihua-badge lu">祿: ${escapeHtml(chart.sihua?.lu)}</span>
                    <span class="ziwei-sihua-badge quan">權: ${escapeHtml(chart.sihua?.quan)}</span>
                    <span class="ziwei-sihua-badge ke">科: ${escapeHtml(chart.sihua?.ke)}</span>
                    <span class="ziwei-sihua-badge ji">忌: ${escapeHtml(chart.sihua?.ji)}</span>
                </div>
                ${(chart.patterns || []).length > 0 ? `
                    <div style="margin-top:8px; font-size: var(--type-caption); color:var(--suite-accent);">
                        ★ 格局：${chart.patterns.map((p) => escapeHtml(p.name)).join('、')}
                    </div>
                ` : ''}
            </div>
        `;

        function renderPalaceCell(branch) {
            const p = branchPalaceMap[branch];
            if (!p) return `<div class="ziwei-palace-cell"></div>`;

            const starsHtml = (p.stars || []).map((s) => {
                let cls = 'major';
                if (s.type === 'lucky') cls = 'lucky';
                else if (s.type === 'bad') cls = 'bad';
                else if (s.type === 'peach') cls = 'peach';

                const sihuaBadge = s.sihua
                    ? `<span class="ziwei-sihua-badge ${s.sihua === '祿' ? 'lu' : s.sihua === '權' ? 'quan' : s.sihua === '科' ? 'ke' : 'ji'}">${escapeHtml(s.sihua)}</span>`
                    : '';

                const brightnessSpan = s.brightness
                    ? `<span class="ziwei-brightness">${escapeHtml(s.brightness)}</span>`
                    : '';

                return `
                    <div class="ziwei-star-item ${cls}">
                        ${escapeHtml(s.name)} ${brightnessSpan} ${sihuaBadge}
                    </div>
                `;
            }).join('');

            return `
                <div class="ziwei-palace-cell ${p.isMing ? 'is-ming' : ''} ${p.isShen ? 'is-shen' : ''}">
                    <div class="ziwei-cell-header">
                        <span class="ziwei-palace-name">${escapeHtml(p.name)}${p.isMing ? ' (命)' : ''}${p.isShen ? ' (身)' : ''}</span>
                        <span class="ziwei-palace-ganzhi">${escapeHtml(p.ganzhi)}</span>
                    </div>
                    <div class="ziwei-cell-stars">${starsHtml || '<span style="font-size: var(--type-caption); color:var(--suite-text-muted);">無主星 (借對宮)</span>'}</div>
                    <div class="ziwei-cell-footer">
                        <span>大限 ${escapeHtml(p.dayun)}</span>
                        <span>對: ${escapeHtml(p.aspects?.opposite || '')}</span>
                    </div>
                </div>
            `;
        }

        const row1 = ['巳', '午', '未', '申'].map(renderPalaceCell).join('');
        const row2 = `${renderPalaceCell('辰')}${centerHtml}${renderPalaceCell('酉')}`;
        const row3 = `${renderPalaceCell('卯')}${renderPalaceCell('戌')}`;
        const row4 = ['寅', '丑', '子', '亥'].map(renderPalaceCell).join('');

        const patternsHtml = (chart.patterns || []).map((pat) => `
            <div style="background:var(--suite-bg); border:1px solid var(--suite-border); border-radius:8px; padding:10px; margin-bottom:8px;">
                <div style="font-weight:700; color:var(--suite-primary); font-size: var(--type-label); margin-bottom:4px;">✨ ${escapeHtml(pat.name)}（${escapeHtml(pat.type)}）</div>
                <div style="font-size: var(--type-meta); color:var(--suite-text-muted);">${escapeHtml(pat.desc)}</div>
            </div>
        `).join('');

        const maleSizeHtml = chart.maleSize ? `
            <div style="background:linear-gradient(135deg, rgba(217,119,87,0.08) 0%, rgba(245,158,11,0.05) 100%); border:1px solid rgba(217,119,87,0.25); border-radius:12px; padding:16px; margin-top:20px;">
                <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
                    <div>
                        <span style="font-size:var(--type-label); font-weight:800; color:#ea580c;">⚡ 趣味解碼：男生出廠體魄與真實尺寸</span>
                        <div style="font-size:var(--type-meta); color:var(--suite-text-muted); margin-top:2px;">雙核合參（子位出廠氣象＋疾厄宮實體肉身）</div>
                    </div>
                    <span class="male-size-title-tag">【${escapeHtml(chart.maleSize.tier)} · ${escapeHtml(chart.maleSize.cmRange)}】${escapeHtml(chart.maleSize.title)}</span>
                </div>
                <div style="margin-top:10px; font-size:var(--type-label); line-height:1.6; color:var(--suite-text);">
                    ${escapeHtml(chart.maleSize.summary)}
                </div>
            </div>
        ` : '';

        visualBoard.innerHTML = `
            <div class="suite-board-title">🔮 紫微斗數十二宮命盤（${escapeHtml(chart.normalized_input?.date || '')} ${escapeHtml(chart.normalized_input?.time || '')} · ${escapeHtml(chart.normalized_input?.sex || '')}）</div>
            <div class="ziwei-board-grid">
                ${row1}
                ${row2}
                ${row3}
                ${row4}
            </div>
            ${patternsHtml ? `<div style="margin-top:16px;"><div style="font-size: var(--type-reading); font-weight:700; margin-bottom:8px; color:var(--suite-text);">🌟 命盤特殊格局剖析</div>${patternsHtml}</div>` : ''}
            ${maleSizeHtml}
        `;
        visualBoard.hidden = false;
    }

    function renderMaleSizeCard(data) {
        const maleSizeCard = document.getElementById('maleSizeResultCard');
        if (!maleSizeCard || !data) return;

        if (data.isApplicable === false) {
            maleSizeCard.innerHTML = `
                <div class="male-size-hero">
                    <div style="font-size: var(--type-label); font-weight: 700; color: var(--suite-primary); margin-bottom: 4px;">
                        ⚡ 紫微雙核出廠規格 · 測算提示
                    </div>
                    <div class="male-size-cm-badge" style="color: var(--suite-warning, #f59e0b);">
                        【女性命盤不適用】
                    </div>
                    <div style="margin-top: 8px; color: var(--suite-text-muted);">
                        ${escapeHtml(data.appearance || '男生真實尺寸評估僅適用於男性命盤。')}
                    </div>
                </div>
                <div class="male-size-advice-box" style="margin-top: 16px;">
                    <strong>💡 333 一句提醒·照見當下：</strong><br>
                    ${escapeHtml(data.advice || '本功能為男性生理機能與尺寸測算，若需測算請切換性別為「男」。')}
                </div>
            `;
            return;
        }

        maleSizeCard.innerHTML = `
            <div class="male-size-hero">
                <div style="font-size: var(--type-label); font-weight: 700; color: var(--suite-primary); margin-bottom: 4px;">
                    ⚡ 紫微雙核出廠規格 · 男生真實尺寸速測結果
                </div>
                <div class="male-size-cm-badge">
                    【${escapeHtml(data.tier || '大/中杯')} · ${escapeHtml(data.cmRange || '11 - 15 cm')}】
                </div>
                <div>
                    <span class="male-size-title-tag">🏷️ 出廠戰力封號：${escapeHtml(data.title || '實戰長青型')}</span>
                    ${data.enduranceScore ? `<span class="male-size-title-tag" style="margin-left: 6px;">⚡ 耐力指數：${escapeHtml(data.enduranceScore)} / 100</span>` : ''}
                </div>
            </div>

            <div class="male-size-grid">
                <div class="male-size-item">
                    <div class="male-size-item-header">
                        <span>🏷️</span> 出廠外觀（子位星曜）
                    </div>
                    <div class="male-size-item-body">
                        <strong>坐星：</strong>${escapeHtml(data.ziStars || '無主星')}<br>
                        ${escapeHtml(data.appearance || '')}
                    </div>
                </div>
                <div class="male-size-item">
                    <div class="male-size-item-header">
                        <span>🩸</span> 實體肉身（疾厄宮星曜）
                    </div>
                    <div class="male-size-item-body">
                        <strong>坐星：</strong>${escapeHtml(data.jieStars || '無主星')}（${escapeHtml(data.jiePalace || '')}宮）<br>
                        ${escapeHtml(data.physique || '')}
                    </div>
                </div>
                <div class="male-size-item" style="grid-column: 1 / -1;">
                    <div class="male-size-item-header">
                        <span>⚔️</span> 實戰耐力與戰鬥風格
                    </div>
                    <div class="male-size-item-body">
                        ${data.enduranceScore ? `<strong>耐力評分：${escapeHtml(data.enduranceScore)} 分</strong><br>` : ''}
                        ${escapeHtml(data.endurance || '')}
                    </div>
                </div>
            </div>

            <div class="male-size-advice-box">
                <strong>💡 333 一句提醒·照見當下：</strong><br>
                ${escapeHtml(data.advice || '')}
            </div>

            ${data.disclaimer ? `
                <div style="font-size: var(--type-caption); color: var(--suite-text-muted); text-align: center; margin-top: 12px;">
                    🛡️ ${escapeHtml(data.disclaimer)}
                </div>
            ` : ''}

            <div class="text-center mt-3">
                <button type="button" id="btnUnlockFullZiwei" class="btn suite-btn-primary btn-lg">
                    👉 想看我的人生大運與完整格局？一鍵解鎖完整紫微命盤
                </button>
            </div>
        `;

        const unlockBtn = document.getElementById('btnUnlockFullZiwei');
        if (unlockBtn) {
            unlockBtn.addEventListener('click', () => {
                const btnChart = document.getElementById('btnModeChart');
                if (btnChart) btnChart.click();
                if (form) form.dispatchEvent(new Event('submit'));
            });
        }
    }

    function renderSpouseCard(data) {
        const spouseCard = document.getElementById('spouseResultCard');
        if (!spouseCard) return;

        const ageGap = data.ageGap || {};
        const appearance = data.appearance || {};
        const personality = data.personality || {};
        const meeting = data.meetingScenario || {};
        const tagsHtml = (personality.tags || []).map((t) => `<span class="spouse-tag-pill">${escapeHtml(t)}</span>`).join('');

        spouseCard.innerHTML = `
            <div class="spouse-hero">
                <div style="font-size: var(--type-label); font-weight: 700; color: #db2777; margin-bottom: 4px;">
                    💍 正統紫微夫妻宮 · 未來另一半深度解析
                </div>
                <div class="spouse-age-badge">
                    【${escapeHtml(ageGap.tier || '同齡或差距不大')}】
                </div>
                <div style="margin-top: 6px;">
                    <span class="spouse-tag-pill">🔮 夫妻宮位於【${escapeHtml(data.ganzhi || '')}宮】</span>
                    <span class="spouse-tag-pill">⭐ 主星：${escapeHtml((data.majorStars || []).join('、') || '無主星')}</span>
                    ${data.isBorrowed ? '<span class="spouse-tag-pill" style="color: #ea580c;">(借對宮官祿)</span>' : ''}
                    <span class="spouse-tag-pill">🧠 心智年齡：${escapeHtml(ageGap.psychologicalAge || '默契協調型')}</span>
                </div>
            </div>

            <div class="spouse-grid">
                <div class="spouse-item">
                    <div class="spouse-item-header">
                        <span>⏳</span> 年齡差距推定與心智成熟度
                    </div>
                    <div class="spouse-item-body">
                        <strong>年齡評級：</strong>${escapeHtml(ageGap.tier || '')}<br>
                        ${escapeHtml(ageGap.desc || '')}
                    </div>
                </div>

                <div class="spouse-item">
                    <div class="spouse-item-header">
                        <span>✨</span> 外貌氣質與體態風采
                    </div>
                    <div class="spouse-item-body">
                        <strong>風格標籤：</strong>${escapeHtml(appearance.style || '')}<br>
                        <strong>外貌特徵：</strong>${escapeHtml(appearance.features || '')}<br>
                        <strong>氣場氛圍：</strong>${escapeHtml(appearance.aura || '')}
                    </div>
                </div>

                <div class="spouse-item">
                    <div class="spouse-item-header">
                        <span>💖</span> 性格脾氣與磨合要點
                    </div>
                    <div class="spouse-item-body">
                        <div style="margin-bottom: 8px;">${tagsHtml}</div>
                        <strong>優勢特質：</strong>${escapeHtml(personality.strengths || '')}<br>
                        <strong>相處地雷：</strong>${escapeHtml(personality.weaknesses || '')}
                    </div>
                </div>

                <div class="spouse-item">
                    <div class="spouse-item-header">
                        <span>🌟</span> 相遇機緣與結緣場合
                    </div>
                    <div class="spouse-item-body">
                        <strong>相遇場景：</strong>${escapeHtml(meeting.places || '')}<br>
                        <strong>感情磨合：</strong>${escapeHtml(meeting.shaAdvice || '')}
                    </div>
                </div>
            </div>

            <div class="spouse-advice-box">
                <strong>💡 333 一句提醒·照見當下（月老感情錦囊）：</strong><br>
                ${escapeHtml(data.relationshipAdvice || data.summary || '')}
            </div>

            <div class="text-center mt-3">
                <button type="button" id="btnUnlockFullZiweiSpouse" class="btn suite-btn-primary btn-lg">
                    👉 想看我的人生大運與完整格局？一鍵解鎖完整紫微命盤
                </button>
            </div>

            <div style="font-size: var(--type-caption); color: var(--suite-text-muted); text-align: center; margin-top: 12px;">
                🏮 本測算依據正統三合派紫微斗數夫妻宮安星訣與星性推導，願傳統智慧照見當下，助你明心見性、攜手良緣。
            </div>
        `;

        const unlockBtnSpouse = document.getElementById('btnUnlockFullZiweiSpouse');
        if (unlockBtnSpouse) {
            unlockBtnSpouse.addEventListener('click', () => {
                const btnChart = document.getElementById('btnModeChart');
                if (btnChart) btnChart.click();
                if (form) form.dispatchEvent(new Event('submit'));
            });
        }
    }

    function renderVisual(data, payload) {
        if (page === 'ziwei') renderZiwei(data);
        else if (page === 'tarot') renderTarot(data);
        else if (page === 'bazi2') renderBazi(data);
        else if (page === 'fengshui') renderFengShui(data);
        else if (page === 'yinyuan') renderYinyuan(data, payload?.mode);
    }

    // --- Message Stream Helper ---

    function copyTextToClipboard(text, btn) {
        if (!text) return;
        function showSuccess() {
            if (btn) {
                const orig = btn.innerHTML;
                btn.innerHTML = '<i data-lucide="check" style="color:#10b981;"></i> 已複製！';
                if (window.lucide && typeof window.lucide.createIcons === 'function') {
                    window.lucide.createIcons();
                }
                setTimeout(() => {
                    btn.innerHTML = orig;
                    if (window.lucide && typeof window.lucide.createIcons === 'function') {
                        window.lucide.createIcons();
                    }
                }, 2000);
            }
        }
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(text).then(showSuccess).catch(() => {
                fallbackCopy(text);
                showSuccess();
            });
        } else {
            fallbackCopy(text);
            showSuccess();
        }
    }

    function fallbackCopy(text) {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
            document.execCommand('copy');
        } catch (err) {
            console.error('Fallback copy failed', err);
        }
        document.body.removeChild(textArea);
    }

    function appendMessage(role, content) {
        const bubble = document.createElement('div');
        bubble.className = `suite-message-bubble ${role}`;
        if (role === 'assistant') {
            const header = document.createElement('div');
            header.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; border-bottom: 1px solid var(--suite-border, rgba(0,0,0,0.06)); padding-bottom: 6px;';
            header.innerHTML = `
                <span style="font-size: var(--type-label); font-weight: 600; color: var(--suite-primary, #CC6B49); display: inline-flex; align-items: center; gap: 4px;">
                    <i data-lucide="sparkles"></i> 解讀指引
                </span>
                <button type="button" class="suite-copy-btn suite-copy-top" style="background: var(--suite-card, #fff); border: 1px solid var(--suite-border, #E8E0D6); border-radius: 6px; padding: 2px 10px; font-size: var(--type-meta); font-weight: 500; cursor: pointer; color: var(--suite-primary, #CC6B49); display: inline-flex; align-items: center; gap: 4px;" title="複製內容">
                    <i data-lucide="copy"></i> 複製內容
                </button>
            `;
            const copyBtnTop = header.querySelector('.suite-copy-top');
            copyBtnTop.addEventListener('click', () => {
                copyTextToClipboard(content, copyBtnTop);
            });

            const contentDiv = document.createElement('div');
            contentDiv.innerHTML = renderMarkdown(content);

            const footer = document.createElement('div');
            footer.style.cssText = 'display: flex; justify-content: flex-end; margin-top: 8px; border-top: 1px solid var(--suite-border, rgba(0,0,0,0.04)); padding-top: 6px;';
            footer.innerHTML = `
                <button type="button" class="suite-copy-btn suite-copy-bottom" style="background: var(--suite-card, #fff); border: 1px solid var(--suite-border, #E8E0D6); border-radius: 6px; padding: 3px 12px; font-size: var(--type-meta); font-weight: 500; cursor: pointer; color: var(--suite-primary, #CC6B49); display: inline-flex; align-items: center; gap: 4px;" title="複製內容">
                    <i data-lucide="copy"></i> 複製內容
                </button>
            `;
            const copyBtnBottom = footer.querySelector('.suite-copy-bottom');
            copyBtnBottom.addEventListener('click', () => {
                copyTextToClipboard(content, copyBtnBottom);
            });

            bubble.appendChild(header);
            bubble.appendChild(contentDiv);
            bubble.appendChild(footer);
        } else {
            bubble.textContent = content;
        }
        conversationStream.appendChild(bubble);
        if (window.lucide && typeof window.lucide.createIcons === 'function') {
            window.lucide.createIcons();
        }
        conversationStream.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    // --- Form Payload Builder ---

    const val = (name) => {
        const field = form.elements[name];
        if (field && typeof field.value !== 'undefined') return field.value.trim();
        const radio = form.querySelector(`input[name="${name}"]:checked`);
        if (radio) return radio.value.trim();
        const el = document.getElementById(name);
        return el ? el.value.trim() : '';
    };

    document.addEventListener('change', (e) => {
        if (e.target && e.target.type === 'radio' && e.target.closest('.gender-pill-group')) {
            const group = e.target.closest('.gender-pill-group');
            group.querySelectorAll('.gender-pill').forEach(pill => {
                const input = pill.querySelector('input[type="radio"]');
                if (input && input.checked) {
                    pill.classList.add('active');
                } else {
                    pill.classList.remove('active');
                }
            });
        }
    });

    function buildPayload() {
        const question = val('question');
        if (page === 'ziwei') {
            return {
                mode: val('mode') || 'chart',
                name: val('name'),
                calendar: val('calendar') || 'solar',
                date: val('date'),
                time: val('time') || '12:00',
                shichen: val('shichen') || '午',
                sex: val('sex') || '男',
                leap: val('leap') === 'true' || val('leap') === true,
                question
            };
        }
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
            const payload = {
                mode,
                facing: val('facing') || '南',
                moveInYear: Number(val('moveInYear')) || 2024,
                residentYear: Number(val('residentYear')) || 1990,
                sex: val('sex') || '男',
                year: Number(val('year')) || new Date().getFullYear(),
                question
            };
            if (typeof window.getFengshuiLayoutPayload === 'function') {
                const layoutData = window.getFengshuiLayoutPayload();
                if (layoutData) {
                    if (typeof layoutData.heading === 'number' && !isNaN(layoutData.heading)) {
                        payload.heading = layoutData.heading;
                    }
                    if (layoutData.northReference) payload.northReference = layoutData.northReference;
                    if (typeof layoutData.declination === 'number') payload.declination = layoutData.declination;
                    if (layoutData.headingSource) payload.headingSource = layoutData.headingSource;
                    if (layoutData.layoutObjects && typeof layoutData.layoutObjects === 'object') {
                        payload.layoutObjects = layoutData.layoutObjects;
                    }
                    if (Array.isArray(layoutData.entryPath) && layoutData.entryPath.length > 0) {
                        payload.entryPath = layoutData.entryPath;
                    }
                    if (layoutData.pathQuality) payload.pathQuality = layoutData.pathQuality;
                }
            }
            return payload;
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
        ziwei: '/api/ziwei/chart',
        tarot: '/api/tarot/reading',
        fengshui: '/api/fengshui/report',
        bazi2: '/api/bazi2/chart',
        yinyuan: '/api/yinyuan/reading'
    };

    form?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const payload = buildPayload();

        // Basic date validation for bazi2 and ziwei
        if ((page === 'bazi2' || page === 'ziwei') && !payload.date) {
            alert('請選擇出生日期');
            return;
        }

        // Fast-Pass for Ziwei Future Spouse (0.1s Deterministic)
        if (page === 'ziwei' && payload.mode === 'spouse') {
            if (submitBtn) submitBtn.disabled = true;
            try {
                const calcRes = await fetch('/api/ziwei/spouse', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                const calcData = await calcRes.json();
                if (!calcData.success) throw new Error(calcData.error || '未來另一半推算失敗');

                const spouseCard = document.getElementById('spouseResultCard');
                renderSpouseCard(calcData.result || calcData.spouse || calcData);
                if (spouseCard) {
                    spouseCard.hidden = false;
                    spouseCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
                if (visualBoard) visualBoard.hidden = true;
                if (aiSection) aiSection.hidden = true;
                const maleSizeCard = document.getElementById('maleSizeResultCard');
                if (maleSizeCard) maleSizeCard.hidden = true;
            } catch (err) {
                alert(`錯誤：${err.message}`);
            } finally {
                if (submitBtn) submitBtn.disabled = false;
            }
            return;
        }

        // Fast-Pass for Ziwei Male Size (0.1s Deterministic)
        if (page === 'ziwei' && payload.mode === 'male-size') {
            if (submitBtn) submitBtn.disabled = true;
            try {
                const calcRes = await fetch('/api/ziwei/male-size', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                const calcData = await calcRes.json();
                if (!calcData.success) throw new Error(calcData.error || '測算失敗');

                const maleSizeCard = document.getElementById('maleSizeResultCard');
                renderMaleSizeCard(calcData.result || calcData);
                if (maleSizeCard) {
                    maleSizeCard.hidden = false;
                    maleSizeCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
                if (visualBoard) visualBoard.hidden = true;
                if (aiSection) aiSection.hidden = true;
                const spouseCard = document.getElementById('spouseResultCard');
                if (spouseCard) spouseCard.hidden = true;
            } catch (err) {
                alert(`錯誤：${err.message}`);
            } finally {
                if (submitBtn) submitBtn.disabled = false;
            }
            return;
        }

        if (submitBtn) submitBtn.disabled = true;
        aiSection.hidden = false;
        aiLoading.hidden = false;
        conversationStream.innerHTML = '';
        conversationHistory = [];
        window.conversationHistory = conversationHistory;

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

            // Step 2: 自動取得解讀
            const userQuestion = payload.question || '請為我進行全盤解讀與具體指引。';
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
                window.conversationHistory = conversationHistory;
                appendMessage('assistant', aiData.analysis);
                if (followUpForm) followUpForm.hidden = false;
            } else {
                appendMessage('assistant', `⚠️ 解讀暫不可用：${aiData.error || '請稍後重試'}`);
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
        typingBubble.innerHTML = '<span class="suite-spinner" style="width:16px; height:16px; vertical-align:middle; margin-right:6px;"></span> 整理解讀中…';
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
                window.conversationHistory = conversationHistory;
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
        const modeSelect = form?.elements?.['mode'];
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
        const fsModeSelect = form?.elements?.['mode'];
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

    // --- Dynamic Mode Switcher for Ziwei Fast-Pass & Canonical Routes ---
    if (page === 'ziwei') {
        const btnModeChart = document.getElementById('btnModeChart');
        const btnModeSpouse = document.getElementById('btnModeSpouse');
        const btnModeMaleSize = document.getElementById('btnModeMaleSize');
        const ziweiModeInput = document.getElementById('ziweiMode');
        const spouseBanner = document.getElementById('spouseBanner');
        const maleSizeBanner = document.getElementById('maleSizeBanner');
        const ziweiQuestionGroup = document.getElementById('ziweiQuestionGroup');
        const spouseResultCard = document.getElementById('spouseResultCard');
        const maleSizeResultCard = document.getElementById('maleSizeResultCard');

        function setZiweiMode(mode, updateUrl = true) {
            btnModeChart?.classList.toggle('active', mode === 'chart');
            btnModeSpouse?.classList.toggle('active', mode === 'spouse');
            btnModeMaleSize?.classList.toggle('active', mode === 'male-size');

            if (ziweiModeInput) ziweiModeInput.value = mode;

            if (mode === 'spouse') {
                if (spouseBanner) spouseBanner.style.display = 'block';
                if (maleSizeBanner) maleSizeBanner.style.display = 'none';
                if (ziweiQuestionGroup) ziweiQuestionGroup.style.display = 'none';
                if (submitBtn) submitBtn.textContent = '💍 3秒解鎖未來另一半';
                if (visualBoard) visualBoard.hidden = true;
                if (aiSection) aiSection.hidden = true;
                if (maleSizeResultCard) maleSizeResultCard.hidden = true;
                if (updateUrl && window.history?.pushState && location.pathname !== '/ziwei/spouse') {
                    window.history.pushState({ mode: 'spouse' }, '', '/ziwei/spouse');
                }
            } else if (mode === 'male-size') {
                if (maleSizeBanner) maleSizeBanner.style.display = 'block';
                if (spouseBanner) spouseBanner.style.display = 'none';
                if (ziweiQuestionGroup) ziweiQuestionGroup.style.display = 'none';
                if (submitBtn) submitBtn.textContent = '⚡ 3秒立即速測男生真實尺寸';
                if (visualBoard) visualBoard.hidden = true;
                if (aiSection) aiSection.hidden = true;
                if (spouseResultCard) spouseResultCard.hidden = true;

                // Ensure male radio is checked and active for male size test
                const maleRadio = form?.querySelector('input[name="sex"][value="男"]');
                const femaleRadio = form?.querySelector('input[name="sex"][value="女"]');
                if (maleRadio && !maleRadio.checked) {
                    maleRadio.checked = true;
                    maleRadio.closest('.gender-pill')?.classList.add('active');
                    femaleRadio?.closest('.gender-pill')?.classList.remove('active');
                }
                if (updateUrl && window.history?.pushState && location.pathname !== '/ziwei/male-size') {
                    window.history.pushState({ mode: 'male-size' }, '', '/ziwei/male-size');
                }
            } else {
                // Default: chart
                if (spouseBanner) spouseBanner.style.display = 'none';
                if (maleSizeBanner) maleSizeBanner.style.display = 'none';
                if (ziweiQuestionGroup) ziweiQuestionGroup.style.display = '';
                if (submitBtn) submitBtn.textContent = '✨ 排盤並查看命理解讀';
                if (spouseResultCard) spouseResultCard.hidden = true;
                if (maleSizeResultCard) maleSizeResultCard.hidden = true;
                if (updateUrl && window.history?.pushState && location.pathname !== '/ziwei') {
                    window.history.pushState({ mode: 'chart' }, '', '/ziwei');
                }
            }
        }

        btnModeChart?.addEventListener('click', () => setZiweiMode('chart', true));
        btnModeSpouse?.addEventListener('click', () => setZiweiMode('spouse', true));
        btnModeMaleSize?.addEventListener('click', () => setZiweiMode('male-size', true));

        // Support browser Back/Forward (popstate)
        window.addEventListener('popstate', (e) => {
            const path = window.location.pathname;
            if (path === '/ziwei/spouse' || e.state?.mode === 'spouse') {
                setZiweiMode('spouse', false);
            } else if (path === '/ziwei/male-size' || e.state?.mode === 'male-size') {
                setZiweiMode('male-size', false);
            } else {
                setZiweiMode('chart', false);
            }
        });

        // Initialize mode based on current URL path or query params
        const urlParams = new URLSearchParams(window.location.search);
        const queryMode = urlParams.get('mode');
        const currentPath = window.location.pathname;

        if (currentPath === '/ziwei/spouse' || queryMode === 'spouse' || ziweiModeInput?.value === 'spouse') {
            setZiweiMode('spouse', false);
        } else if (currentPath === '/ziwei/male-size' || queryMode === 'male-size' || ziweiModeInput?.value === 'male-size') {
            setZiweiMode('male-size', false);
        } else {
            setZiweiMode('chart', false);
        }

        // Pre-fill fields from query params if available (e.g. from Yinyuan cross-link)
        if (urlParams.get('date')) {
            const dateInput = document.getElementById('ziweiDate');
            if (dateInput) dateInput.value = urlParams.get('date');
        }
        if (urlParams.get('time')) {
            const timeInput = document.getElementById('ziweiTime');
            if (timeInput) timeInput.value = urlParams.get('time');
        }
        if (urlParams.get('sex')) {
            const sexVal = urlParams.get('sex');
            const targetRadio = form?.querySelector(`input[name="sex"][value="${sexVal}"]`);
            if (targetRadio) {
                targetRadio.checked = true;
                form.querySelectorAll('.gender-pill').forEach((p) => p.classList.remove('active'));
                targetRadio.closest('.gender-pill')?.classList.add('active');
            }
        }

        // Two-way sync between shichen select and time picker
        const ziweiShichenSelect = document.getElementById('ziweiShichen');
        const ziweiTimeInput = document.getElementById('ziweiTime');
        const shichenToTime = {
            子: '00:00', 丑: '02:00', 寅: '04:00', 卯: '06:00',
            辰: '08:00', 巳: '10:00', 午: '12:00', 未: '14:00',
            申: '16:00', 酉: '18:00', 戌: '20:00', 亥: '22:00'
        };
        const hourToShichen = ['子', '丑', '丑', '寅', '寅', '卯', '卯', '辰', '辰', '巳', '巳', '午', '午', '未', '未', '申', '申', '酉', '酉', '戌', '戌', '亥', '亥', '子'];

        ziweiShichenSelect?.addEventListener('change', () => {
            const val = ziweiShichenSelect.value;
            if (shichenToTime[val] && ziweiTimeInput) {
                ziweiTimeInput.value = shichenToTime[val];
            }
        });

        ziweiTimeInput?.addEventListener('change', () => {
            if (ziweiTimeInput.value && ziweiShichenSelect) {
                const hour = parseInt(ziweiTimeInput.value.split(':')[0], 10);
                if (!isNaN(hour) && hourToShichen[hour]) {
                    ziweiShichenSelect.value = hourToShichen[hour];
                }
            }
        });

        if (window.lucide && typeof window.lucide.createIcons === 'function') {
            window.lucide.createIcons();
        }
    }
})();
