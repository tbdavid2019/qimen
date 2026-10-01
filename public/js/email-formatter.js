/**
 * 333 一句提醒·照見當下 - 前端命理郵件格式化模組 (Browser & Node.js Universal)
 */
(function (root, factory) {
    if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.DivinationEmailFormatter = factory();
    }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    'use strict';

    function isRawJsonPayload(content) {
        if (!content || typeof content !== 'string') return false;
        const trimmed = content.trim();
        if (trimmed.startsWith('```json') || trimmed.startsWith('```JSON')) return true;
        if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
            try {
                JSON.parse(trimmed);
                return true;
            } catch (_) {
                return false;
            }
        }
        if (/```json\s*\{/i.test(trimmed)) return true;
        return false;
    }

    function extractJsonObject(content) {
        if (!content) return null;
        if (typeof content === 'object') return content;
        const trimmed = String(content).trim();
        try { return JSON.parse(trimmed); } catch (_) {}
        const codeBlockMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
        if (codeBlockMatch && codeBlockMatch[1]) {
            try { return JSON.parse(codeBlockMatch[1].trim()); } catch (_) {}
        }
        const firstBrace = trimmed.indexOf('{');
        const lastBrace = trimmed.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace > firstBrace) {
            try { return JSON.parse(trimmed.slice(firstBrace, lastBrace + 1)); } catch (_) {}
        }
        return null;
    }

    function formatGloss(def) {
        if (!def) return '';
        const entries = String(def).split(/[；;]/u).map(e => e.trim()).filter(Boolean);
        const result = [];
        for (const entry of entries) {
            let clean = entry.replace(/^（[^）]*）/u, '').trim();
            if (!clean) continue;
            clean = clean.split(/[：:]/u)[0].split(/[，,。]/u)[0].trim();
            if (!clean || clean.length < 2 || /^(姓|又同|同上)$/u.test(clean)) continue;
            if (!result.includes(clean)) result.push(clean.slice(0, 24));
            if (result.length >= 2) break;
        }
        return result.length ? result.join('；') : String(def).slice(0, 30);
    }

    function formatNameAnalysisReport(data, meta) {
        const root = data.result || data;
        const isGenerate = Array.isArray(root.candidates) && root.candidates.length > 0;
        const lines = [];

        if (isGenerate) {
            const surname = root.surname || '—';
            const styleLabel = root.nameStyle?.label || '中性通用風格';
            lines.push(`## 👶 【${surname}】姓取名候選推薦報告\n`);
            lines.push(`> 依據康熙字典筆畫與傳統三才五格數理，為您精心整理的命名候選方案（風格偏好：${styleLabel}）：\n`);

            const limit = Math.min(root.candidates.length, 10);
            for (let i = 0; i < limit; i++) {
                const cand = root.candidates[i];
                const name = cand.name || `${surname}${cand.givenName || ''}`;
                const analysis = cand.analysis || {};
                const chars = analysis.characters || [];
                const grid = analysis.fiveGrid?.values || {};
                const talents = analysis.fiveGrid?.talents;

                lines.push(`### 候選 ${String(i + 1).padStart(2, '0')}：${name}`);
                
                if (chars.length > 0) {
                    const charDetails = chars.map(c => {
                        const py = c.pinyin ? ` · ${c.pinyin}` : '';
                        const elem = c.element || c.wx || '';
                        const elemStr = elem ? ` · ${elem}行` : '';
                        const stroke = c.stroke != null ? ` · ${c.stroke} 畫` : (c.kx != null ? ` · ${c.kx} 畫` : '');
                        const gloss = formatGloss(c.definition || c.def);
                        return `  - **${c.char}**（${c.char === surname ? '姓氏' : '名字'}${py}${elemStr}${stroke}）：${gloss || '字典收錄字'}`;
                    }).join('\n');
                    lines.push(`- **逐字字典解析**：\n${charDetails}`);
                }

                if (grid.heaven || grid.person || grid.total) {
                    const h = grid.heaven ? `天格 ${grid.heaven.number}（${grid.heaven.classification || ''}・${grid.heaven.element || ''}）` : '';
                    const p = grid.person ? `人格 ${grid.person.number}（${grid.person.classification || ''}・${grid.person.element || ''}）` : '';
                    const d = grid.earth ? `地格 ${grid.earth.number}（${grid.earth.classification || ''}・${grid.earth.element || ''}）` : '';
                    const o = grid.outer ? `外格 ${grid.outer.number}（${grid.outer.classification || ''}・${grid.outer.element || ''}）` : '';
                    const t = grid.total ? `總格 ${grid.total.number}（${grid.total.classification || ''}・${grid.total.element || ''}）` : '';
                    const gridList = [h, p, d, o, t].filter(Boolean).join(' ｜ ');
                    lines.push(`- **五格數理格局**：${gridList}`);
                }

                if (talents) {
                    const hp = talents.heavenPerson ? `${talents.heavenPerson.elements?.join(' → ')}（${talents.heavenPerson.relation}）` : '';
                    const pe = talents.personEarth ? `${talents.personEarth.elements?.join(' → ')}（${talents.personEarth.relation}）` : '';
                    lines.push(`- **三才配置**：天人【${hp}】 ｜ 人地【${pe}】`);
                }

                lines.push('');
            }

            if (root.baziLens?.summary) {
                const bazi = root.baziLens.summary;
                lines.push(`### 🏛️ 生辰八字五行參考`);
                lines.push(`- **排盤命格**：日主【${bazi.dayMaster?.stem || ''}${bazi.dayMaster?.element || ''}行】（${bazi.strength || '均衡'}）`);
                if (root.baziLens.usefulElements?.length) {
                    lines.push(`- **喜用五行建議**：${root.baziLens.usefulElements.join('、')}`);
                }
                lines.push('');
            }

            lines.push(`### 💡 命理命名心法指引`);
            lines.push(`> 傳統五格與三才數理為古典統計文化參考，取名核心更在於父母長輩寄寓的美好祝願與字義品格。順口、字義明亮、無不良諧音的名字，即是最好的吉運開局。`);
        } else {
            const name = root.name || '姓名';
            const chars = root.characters || [];
            const grid = root.fiveGrid?.values || {};
            const talents = root.fiveGrid?.talents;

            lines.push(`## 📜 【${name}】姓名學完整分析評估報告\n`);
            
            if (chars.length > 0) {
                lines.push(`### 逐字字形、筆畫與字典義`);
                chars.forEach((c, idx) => {
                    const role = idx === 0 ? '姓氏' : '名字';
                    const py = c.pinyin ? ` · 讀音 ${c.pinyin}` : '';
                    const elem = c.element || c.wx || '';
                    const elemStr = elem ? ` · 五行屬${elem}` : '';
                    const stroke = c.stroke != null ? ` · 康熙 ${c.stroke} 畫` : '';
                    const gloss = formatGloss(c.definition || c.def);
                    lines.push(`- **${c.char}**（${role}${py}${elemStr}${stroke}）：${gloss || '字典收錄字'}`);
                });
                lines.push('');
            }

            if (root.fiveGrid?.available && (grid.heaven || grid.person || grid.total)) {
                lines.push(`### 三才五格數理格局評估`);
                lines.push(`| 宮位 | 數理 | 五行 | 吉凶評價 | 象徵影響領域 |`);
                lines.push(`| :--- | :---: | :---: | :---: | :--- |`);
                if (grid.heaven) lines.push(`| 天格 | ${grid.heaven.number} | ${grid.heaven.element}行 | ${grid.heaven.classification || '平'} | 祖德根基、長輩與上級關聯 |`);
                if (grid.person) lines.push(`| 人格 | ${grid.person.number} | ${grid.person.element}行 | ${grid.person.classification || '平'} | 性格主運、內在才智與核心能力 |`);
                if (grid.earth) lines.push(`| 地格 | ${grid.earth.number} | ${grid.earth.element}行 | ${grid.earth.classification || '平'} | 中年前運、家庭手足與下屬緣分 |`);
                if (grid.outer) lines.push(`| 外格 | ${grid.outer.number} | ${grid.outer.element}行 | ${grid.outer.classification || '平'} | 社交人際、外在環境與貴人運 |`);
                if (grid.total) lines.push(`| 總格 | ${grid.total.number} | ${grid.total.element}行 | ${grid.total.classification || '平'} | 晚年成就、一生綜合實力總匯 |`);
                lines.push('');

                if (talents) {
                    const hp = talents.heavenPerson ? `${talents.heavenPerson.elements?.join(' → ')}（${talents.heavenPerson.relation}）` : '';
                    const pe = talents.personEarth ? `${talents.personEarth.elements?.join(' → ')}（${talents.personEarth.relation}）` : '';
                    lines.push(`- **三才氣場配置**：天人【${hp}】 ｜ 人地【${pe}】`);
                }
                lines.push('');
            }

            if (root.baziLens?.summary) {
                const bazi = root.baziLens.summary;
                lines.push(`### 🏛️ 生辰八字五行調和`);
                lines.push(`- **生辰日主**：【${bazi.dayMaster?.stem || ''}${bazi.dayMaster?.element || ''}行】（${bazi.strength || '均衡'}）`);
                if (bazi.usefulGod) lines.push(`- **喜用神參考**：${bazi.usefulGod}`);
                lines.push('');
            }

            if (root.interpretation) {
                lines.push(`### 💡 綜合評定啟示`);
                lines.push(`> ${root.interpretation}`);
            } else {
                lines.push(`### 💡 照見當下·一句提醒`);
                lines.push(`> 姓名如衣裳，品格如身軀；優良的數理格局能帶來良性的心理暗示，而真正的福報與運勢，源自於您日日夜夜踏實的努力與善行。`);
            }
        }

        return lines.join('\n');
    }

    function formatTarotReport(data) {
        const root = data.result || data;
        const lines = [];

        if (root.lifeNumber || root.lifePathNumber || root.soulCard) {
            const num = root.lifeNumber || root.lifePathNumber || '—';
            const profile = root.lifeProfile || {};
            lines.push(`## 🌟 塔羅生命靈數與靈魂象徵牌報告\n`);
            if (root.birthDate) lines.push(`- **出生日期**：${root.birthDate}`);
            lines.push(`- **生命靈數**：**${num} 號人**${profile.title ? `（${profile.title}）` : ''}\n`);

            if (profile.essence) {
                lines.push(`### 靈魂特質核心解析`);
                lines.push(`> ${profile.essence}\n`);
                if (profile.strength) lines.push(`- **天賦優勢**：${profile.strength}`);
                if (profile.overuse) lines.push(`- **盲點與挑戰**：${profile.overuse}`);
                if (profile.relationships) lines.push(`- **情感互動指引**：${profile.relationships}`);
                if (profile.work) lines.push(`- **事業發揮舞台**：${profile.work}`);
                lines.push('');
            }

            if (root.soulCard) {
                const sc = root.soulCard;
                lines.push(`### 🔮 靈魂象徵牌：【${sc.name || sc.card || ''}】${sc.name_en ? ` (${sc.name_en})` : ''}`);
                if (sc.keywords?.length) lines.push(`- **關鍵象徵**：${sc.keywords.join(' · ')}`);
                if (sc.meaning || sc.traits) lines.push(`- **心靈啟示**：${sc.meaning || sc.traits}`);
                lines.push('');
            }

            if (root.personalityCard && root.personalityCard.name !== root.soulCard?.name) {
                const pc = root.personalityCard;
                lines.push(`### 🎭 個性象徵牌：【${pc.name || pc.card || ''}】`);
                if (pc.meaning) lines.push(`- **顯化特質**：${pc.meaning}`);
                lines.push('');
            }

            lines.push(`### 💡 靈數實踐提醒`);
            lines.push(`> 每一個生命靈數都是一段獨特的靈魂旅程。知曉自己的天賦是為了更自由地創造，照見自己的盲點是為了更溫柔地包容。`);
            return lines.join('\n');
        }

        const spreadName = root.spreadName || root.spread_name || root.spread || '塔羅占卜';
        lines.push(`## 🃏 韋特塔羅占卜解析報告\n`);
        lines.push(`- **占卜牌陣**：${spreadName}`);
        if (root.question) lines.push(`- **占問事由**：${root.question}`);
        if (root.timeFactor) lines.push(`- **時辰能量**：${root.timeFactor}`);
        lines.push('');

        const cards = root.cards || [];
        if (cards.length > 0) {
            lines.push(`### 抽牌結果詳解\n`);
            cards.forEach((c, idx) => {
                const pos = c.position || c.pos || `位置 ${idx + 1}`;
                const name = c.name || c.card_tw || c.card || '塔羅牌';
                const reversed = c.isReversed || c.reversed;
                const state = reversed ? '逆位 (Reversed)' : '正位 (Upright)';
                const elem = c.element ? ` · ${c.element}行` : '';
                const kw = c.keywords?.length ? ` · 關鍵字：${c.keywords.join('、')}` : '';

                lines.push(`#### ${idx + 1}. 【${pos}】${name}（${state}）`);
                if (elem || kw) lines.push(`- **屬性象徵**：${elem}${kw}`);
                if (c.meaning || c.desc) lines.push(`- **牌意解讀**：${c.meaning || c.desc}`);
                lines.push('');
            });
        }

        lines.push(`### 💡 塔羅啟示·一句提醒`);
        lines.push(`> 塔羅呈現的是當前能量流向的投影，未來的劇本掌握在您當下的思維與行動中。順境當乘風而起，逆境宜內省自強。`);
        return lines.join('\n');
    }

    function formatZiweiReport(data) {
        const root = data.chart || data.result || data;
        const lines = [];

        lines.push(`## 🌌 紫微斗數命盤解析報告\n`);
        
        const input = root.normalized_input || root;
        if (input.date || input.solarDate) {
            lines.push(`- **生辰資料**：${input.date || input.solarDate} ${input.time || ''}（${input.gender || input.sex || '陽造'}）`);
        }
        if (root.lunar?.text || root.lunarDate) lines.push(`- **農曆日期**：${root.lunar?.text || root.lunarDate}`);
        if (root.bureau) lines.push(`- **命盤局數**：${root.bureau}`);
        if (root.mingPalaceBranch || root.mingGong) lines.push(`- **命宮地支**：【${root.mingPalaceBranch || root.mingGong}宮】 ｜ **身宮地支**：【${root.shenPalaceBranch || root.shenGong || ''}宮】`);
        if (root.mingzhu) lines.push(`- **命主星**：${root.mingzhu} ｜ **身主星**：${root.shenzhu || ''}`);
        lines.push('');

        if (root.futureSpouse) {
            const sp = root.futureSpouse;
            lines.push(`### 💕 正緣畫像與夫妻宮解析（未來另一半）`);
            if (sp.palace) lines.push(`- **夫妻宮位**：坐【${sp.palace}宮】（${sp.ganzhi || ''}）`);
            if (sp.majorStars?.length) lines.push(`- **宮位主星**：${sp.majorStars.join('、')}`);
            if (sp.auxStars?.length) lines.push(`- **吉凶輔星**：${sp.auxStars.join('、')}`);
            if (sp.targetGender) lines.push(`- **伴侶畫像**：${sp.targetGender}`);
            if (sp.ageGap?.desc) lines.push(`- **年齡差觀察**：${sp.ageGap.tier}（${sp.ageGap.desc}）`);
            if (sp.appearance?.desc) lines.push(`- **外型氣質特徵**：${sp.appearance.desc}`);
            if (sp.personality?.desc) lines.push(`- **性格與行事風格**：${sp.personality.desc}`);
            if (sp.meetingContext?.desc) lines.push(`- **相遇時機與情境**：${sp.meetingContext.desc}`);
            if (sp.advice) lines.push(`- **相處與經營指引**：${sp.advice}`);
            lines.push('');
        }

        if (root.maleSize && root.maleSize.tier) {
            const ms = root.maleSize;
            lines.push(`### ⚡ 男性體能與尺寸命理速測（趣味文化合參）`);
            lines.push(`- **綜合規格格局**：【${ms.title || ms.tier}】（推估範圍：${ms.cmRange || ''}）`);
            if (ms.appearance) lines.push(`- **形相特徵**：${ms.appearance}`);
            if (ms.physique) lines.push(`- **體質機能**：${ms.physique}`);
            if (ms.endurance) lines.push(`- **續航實力**：${ms.endurance}`);
            if (ms.disclaimer) lines.push(`- **文化備註**：${ms.disclaimer}`);
            lines.push('');
        }

        if (Array.isArray(root.palaces) && root.palaces.length > 0) {
            lines.push(`### 十二宮星曜配置概覽`);
            const palaceBriefs = root.palaces.map(p => {
                const stars = (p.majorStars || p.stars || []).map(s => typeof s === 'string' ? s : s.name).join('、') || '無主星（借對宮）';
                return `| ${p.name || p.palaceName}（${p.branch || p.earthlyBranch}） | ${stars} |`;
            });
            lines.push(`| 宮位 | 主星配置 |`);
            lines.push(`| :--- | :--- |`);
            lines.push(palaceBriefs.join('\n'));
            lines.push('');
        }

        lines.push(`### 💡 紫微啟迪·照見當下`);
        lines.push(`> 星曜在天，人事在地。命盤展現的是氣稟的偏向與生命課題，知命是為了順勢而為、借力打力，把握自我人生的真正主導權。`);
        return lines.join('\n');
    }

    function formatMeihuaReport(data) {
        const root = data.data || data.result || data;
        const lines = [];

        lines.push(`## 🌸 梅花易數卦象解析報告\n`);
        
        if (root.bengua) {
            const bg = root.bengua;
            const hg = root.hugua;
            const bng = root.biangua;
            lines.push(`### 核心三卦卦象`);
            lines.push(`- **本卦**：【${bg.name || ''}】（${bg.upperGua || ''}上${bg.lowerGua || ''}下）`);
            if (hg) lines.push(`- **互卦**：【${hg.name || ''}】（過程發展機巧）`);
            if (bng) lines.push(`- **變卦**：【${bng.name || ''}】（最終轉化結果）`);
            if (root.dongYao != null) lines.push(`- **動爻**：第 ${root.dongYao} 爻動`);
            lines.push('');
        }

        if (root.tiYong) {
            const ty = root.tiYong;
            lines.push(`### 體用生剋斷語`);
            lines.push(`- **體卦（我方主體）**：${ty.tiGua || ''}（${ty.tiWuXing || ''}行）`);
            lines.push(`- **用卦（事端外物）**：${ty.yongGua || ''}（${ty.yongWuXing || ''}行）`);
            if (ty.relation) lines.push(`- **生剋關係**：【${ty.relation}】`);
            if (ty.judgment) lines.push(`- **吉凶斷語**：${ty.judgment}`);
            lines.push('');
        }

        lines.push(`### 💡 易經啟發·一句提醒`);
        lines.push(`> 易窮則變，變則通，通則久。卦象映照事物變化的萌芽，因勢利導、守正不阿，即能逢凶化吉。`);
        return lines.join('\n');
    }

    function formatBaziReport(data) {
        const root = data.chart || data.result || data;
        const lines = [];

        lines.push(`## 🏛️ 生辰八字命理格局報告\n`);

        if (root.bazi || root.fourPillars) {
            const b = root.bazi || root.fourPillars;
            lines.push(`### 四柱八字排盤`);
            lines.push(`- **年柱**：${b.year || ''} ｜ **月柱**：${b.month || ''}`);
            lines.push(`- **日柱**：${b.day || ''} ｜ **時柱**：${b.hour || ''}`);
            lines.push('');
        }

        if (root.dayMaster) {
            lines.push(`### 日主元神與強弱`);
            lines.push(`- **日主**：【${root.dayMaster}】（${root.strength || '氣場穩定'}）`);
            if (root.usefulGod) lines.push(`- **喜用神建議**：${root.usefulGod}`);
            if (root.tabooGod) lines.push(`- **忌神注意**：${root.tabooGod}`);
            if (root.pattern) lines.push(`- **命格格局**：${root.pattern}`);
            lines.push('');
        }

        lines.push(`### 💡 八字智言·照見當下`);
        lines.push(`> 五行順逆乃天地常態，日主強弱皆有發揮舞台。識得自身稟賦，順應時節進退，方能成就安身立命之境。`);
        return lines.join('\n');
    }

    function formatFengshuiReport(data) {
        const root = data.report || data.result || data;
        const lines = [];

        lines.push(`## 🏡 易經玄空風水佈局評估報告\n`);

        if (root.period || root.mountain) {
            lines.push(`- **當前元運**：下元【第 ${root.period || 9} 運】`);
            lines.push(`- **座向山向**：【${root.mountain || ''}】（坐${root.sitting || ''}向${root.facing || ''}）`);
            lines.push('');
        }

        if (Array.isArray(root.recommendations) && root.recommendations.length > 0) {
            lines.push(`### 空間調理實體建議`);
            root.recommendations.forEach((r, idx) => {
                lines.push(`- **建議 ${idx + 1}**：${typeof r === 'string' ? r : r.text || r.advice || JSON.stringify(r)}`);
            });
            lines.push('');
        }

        lines.push(`### 💡 風水智慧·一句提醒`);
        lines.push(`> 人因宅而立，宅因人而存。風水之妙在於藏風聚氣、明堂寬廣；內心清淨、環境整潔，便是最上等的風水寶地。`);
        return lines.join('\n');
    }

    function formatYinyuanReport(data) {
        const root = data.result || data;
        const lines = [];

        lines.push(`## 🌹 月老靈籤·姻緣解析報告\n`);

        if (root.stickNumber || root.title) {
            lines.push(`### 求得靈籤：第 ${root.stickNumber || ''} 籤【${root.sign || '吉'}】${root.title ? ` - ${root.title}` : ''}\n`);
            if (root.poem) {
                lines.push(`#### 籤詩原文`);
                lines.push(`> ${root.poem.replace(/\n+/g, '\n> ')}\n`);
            }
            if (root.explanation) {
                lines.push(`#### 詩意聖解`);
                lines.push(`${root.explanation}\n`);
            }
            if (root.marriage) {
                lines.push(`- **婚姻緣分**：${root.marriage}`);
            }
            lines.push('');
        }

        if (root.zodiacMatch || (root.zodiac1 && root.zodiac2)) {
            const zm = root.zodiacMatch || root;
            lines.push(`### 💖 生肖配對合參`);
            lines.push(`- **配對雙方**：生肖【${zm.zodiac1}】 與 生肖【${zm.zodiac2}】`);
            if (zm.score != null) lines.push(`- **契合指數**：${zm.score} 分`);
            if (zm.compatibility) lines.push(`- **合婚斷語**：${zm.compatibility}`);
            if (zm.description) lines.push(`- **相處建議**：${zm.description}`);
            lines.push('');
        }

        lines.push(`### 💡 月老叮嚀·照見當下`);
        lines.push(`> 姻緣天注定，相守在人為。善待眼前人，多一分真誠體貼，少一分計較執念，紅線自然緊密長久。`);
        return lines.join('\n');
    }

    function formatAnswerbookReport(data, meta) {
        const root = data.reading || data.result || data;
        const lines = [];

        lines.push(`## 📖 解答之書·當下啟示\n`);

        if (meta?.question || root.question) {
            lines.push(`- **心中所想**：${meta?.question || root.question}\n`);
        }

        const answer = root.answer || root.quote || '傾聽您內心的聲音';
        lines.push(`### 翻開的答案`);
        lines.push(`> ### 「${answer}」\n`);

        if (root.quote && root.quote !== answer) {
            lines.push(`- **靈性箴言**：${root.quote}`);
        }

        lines.push(`### 💡 一句提醒·照見當下`);
        lines.push(`> 答案從來不是外界給予的定數，而是您心靈深處早己知曉的篤定。帶著這份提醒，堅定地邁向下一步吧。`);
        return lines.join('\n');
    }

    function formatLiuyaoReport(data, meta = {}) {
        const root = data.result || data.data || data;
        const ben = root.benGua || {};
        const zhi = root.zhiGua || {};
        const ganzhi = root.ganzhi || {};
        const yong = root.yongshen || {};
        const zhuxi = root.zhuxiRule || {};
        const lines = [];

        lines.push(`## 🪙 六爻神卦 · 京房納甲全息排盤報告\n`);
        if (meta.question || root.question) {
            lines.push(`- **占問事項**：${meta.question || root.question}`);
        }
        if (root.category) {
            lines.push(`- **占問分類**：${root.category}`);
        }
        if (root.datetime) {
            lines.push(`- **占卦時間**：${root.datetime}（農曆：${root.lunarText || '—'}）`);
        }
        if (ganzhi.year) {
            lines.push(`- **四柱干支**：${ganzhi.year}年 ${ganzhi.month}月 ${ganzhi.day}日 ${ganzhi.time}時 ｜ 月建：${ganzhi.monthBranch || '—'} ｜ 日辰：${ganzhi.dayBranch || '—'} ｜ 旬空：${ganzhi.xunKong || '—'}`);
        }

        lines.push(`\n### 📜 卦象格局`);
        lines.push(`- **本卦**：【${ben.name || '—'}】（${ben.palace || ''}宮·屬${ben.palaceElement || ''}·${ben.type || ''}） ｜ 世爻：第${ben.shi || 0}爻 ｜ 應爻：第${ben.ying || 0}爻`);
        if (zhi.name && zhi.name !== ben.name) {
            lines.push(`- **之卦**：【${zhi.name || '—'}】（${zhi.palace || ''}宮·${zhi.type || ''}） ｜ 世爻：第${zhi.shi || 0}爻 ｜ 應爻：第${zhi.ying || 0}爻`);
        }

        if (yong.name || yong.target) {
            lines.push(`\n### 🎯 專題用神鎖定`);
            lines.push(`- **用神設定**：${yong.name || ''}（以【${yong.target || ''}】為用神）`);
            if (yong.summary) {
                lines.push(`- **狀態解析**：${yong.summary}`);
            }
        }

        if (zhuxi.mainRule) {
            lines.push(`\n### 📖 朱熹《易學啟蒙》考變占主斷`);
            lines.push(`- **動爻條目**：發動 ${zhuxi.movingCount || 0} 爻（${(zhuxi.movingLines || []).map(m => `第${m}爻`).join('、') || '無動爻'}）`);
            lines.push(`- **主斷法則**：${zhuxi.mainRule}`);
            if (zhuxi.explanation) {
                lines.push(`- **斷法心法**：${zhuxi.explanation}`);
            }
        }

        lines.push(`\n### 💡 一句提醒·照見當下`);
        lines.push(`> 易為君子謀，吉凶在動靜之間。審視用神生剋與世應向背，照見當下事態，以智慧與理性指引行動。`);

        return lines.join('\n');
    }

    function formatFallbackReport(serviceName, data) {
        const lines = [];
        lines.push(`## 🔮 ${serviceName || '命理諮詢'}成果報告\n`);
        if (typeof data === 'object' && data !== null) {
            const entries = Object.entries(data).filter(([k]) => !['success', 'discord', 'webhook', 'token'].includes(k));
            for (const [k, v] of entries) {
                if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
                    lines.push(`- **${k}**：${v}`);
                } else if (Array.isArray(v)) {
                    lines.push(`- **${k}**：共 ${v.length} 項內容`);
                } else if (typeof v === 'object' && v !== null) {
                    lines.push(`- **${k}**：`);
                    for (const [subK, subV] of Object.entries(v).slice(0, 5)) {
                        if (typeof subV !== 'object') lines.push(`  - ${subK}：${subV}`);
                    }
                }
            }
        } else {
            lines.push(String(data));
        }
        lines.push(`\n> 傳統智慧，理性解讀；照見當下，指引行動。`);
        return lines.join('\n');
    }

    function formatHumanReadableReport(serviceName, data, options = {}) {
        const obj = extractJsonObject(data);
        if (!obj) return typeof data === 'string' ? data : '';

        const s = String(serviceName || '').toLowerCase();
        let md = '';

        if (s.includes('姓名') || s.includes('name')) {
            md = formatNameAnalysisReport(obj, options);
        } else if (s.includes('塔羅') || s.includes('tarot') || s.includes('靈數') || s.includes('numerology')) {
            md = formatTarotReport(obj, options);
        } else if (s.includes('紫微') || s.includes('ziwei')) {
            md = formatZiweiReport(obj, options);
        } else if (s.includes('梅花') || s.includes('meihua')) {
            md = formatMeihuaReport(obj, options);
        } else if (s.includes('八字') || s.includes('bazi')) {
            md = formatBaziReport(obj, options);
        } else if (s.includes('風水') || s.includes('fengshui')) {
            md = formatFengshuiReport(obj, options);
        } else if (s.includes('姻緣') || s.includes('yinyuan') || s.includes('月老')) {
            md = formatYinyuanReport(obj, options);
        } else if (s.includes('解答之書') || s.includes('answerbook')) {
            md = formatAnswerbookReport(obj, options);
        } else if (s.includes('六爻') || s.includes('liuyao')) {
            md = formatLiuyaoReport(obj, options);
        } else {
            md = formatFallbackReport(serviceName, obj);
        }

        if (options.supplement) {
            const suppText = typeof options.supplement === 'string' 
                ? options.supplement 
                : (options.supplement.analysis || JSON.stringify(options.supplement));
            if (suppText && !md.includes(suppText)) {
                md += `\n\n---\n\n### 🔮 大師深度解讀\n\n${suppText}`;
            }
        }

        return md;
    }

    function formatChartSummary(serviceName, data, fallbackSummary = '') {
        const obj = extractJsonObject(data);
        const dateStr = new Date().toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' });

        if (!obj) {
            if (fallbackSummary && !fallbackSummary.includes('/api/')) return fallbackSummary;
            return `諮詢日期：${dateStr}`;
        }

        const root = obj.result || obj.chart || obj.report || obj.data || obj;
        const s = String(serviceName || '').toLowerCase();

        if (s.includes('姓名') || s.includes('name')) {
            if (root.candidates) {
                return `姓氏：${root.surname || '—'} ｜ 推薦長度：${root.givenNameLength || 2} 字 ｜ 風格：${root.nameStyle?.label || '通用'} ｜ 口徑：康熙字典筆畫`;
            }
            if (root.name) {
                return `姓名：${root.name} ｜ 姓氏：${root.surname || '—'} ｜ 筆畫口徑：康熙字典筆畫`;
            }
        }

        if (s.includes('塔羅') || s.includes('tarot')) {
            if (root.lifeNumber || root.lifePathNumber) {
                return `出生日期：${root.birthDate || dateStr} ｜ 生命靈數：${root.lifeNumber || root.lifePathNumber} 號人 ｜ 靈魂牌：${root.soulCard?.name || ''}`;
            }
            return `牌陣：${root.spreadName || root.spread_name || '塔羅占卜'} ｜ 諮詢日期：${dateStr}${root.question ? ` ｜ 事由：${root.question}` : ''}`;
        }

        if (s.includes('紫微') || s.includes('ziwei')) {
            const input = root.normalized_input || root;
            return `生辰：${input.date || dateStr} ${input.time || ''} ｜ 局數：${root.bureau || '木三局'} ｜ 命宮：${root.mingPalaceBranch || root.mingGong || ''}宮`;
        }

        if (s.includes('梅花') || s.includes('meihua')) {
            return `本卦：${root.bengua?.name || '起卦'} ｜ 變卦：${root.biangua?.name || ''} ｜ 體用：${root.tiYong?.relation || '體用合參'}`;
        }

        if (s.includes('六爻') || s.includes('liuyao')) {
            const ben = root.benGua?.name || '六爻卦';
            const zhi = root.zhiGua?.name ? `之【${root.zhiGua.name}】` : '';
            const cat = root.category ? ` · ${root.category}` : '';
            return `【${ben}】${zhi}${cat} ｜ 諮詢日期：${dateStr}`;
        }

        if (s.includes('八字') || s.includes('bazi')) {
            const b = root.bazi || root.fourPillars || {};
            return `八字：${b.year || ''} ${b.month || ''} ${b.day || ''} ${b.hour || ''} ｜ 日主：${root.dayMaster || ''}`;
        }

        if (s.includes('風水') || s.includes('fengshui')) {
            return `元運：下元九運 ｜ 座向：${root.mountain || '宅向佈局'}`;
        }

        if (s.includes('姻緣') || s.includes('yinyuan')) {
            return `月老靈籤：第 ${root.stickNumber || 1} 籤【${root.sign || '吉'}】 ｜ 諮詢日期：${dateStr}`;
        }

        if (s.includes('解答之書') || s.includes('answerbook')) {
            return `解答之書 ｜ 當下啟示 ｜ 諮詢日期：${dateStr}`;
        }

        return `333 命理諮詢 ｜ 諮詢日期：${dateStr}`;
    }

    function formatSubject(serviceName, data, fallbackSubject = '') {
        const obj = extractJsonObject(data);
        const dateStr = new Date().toLocaleDateString('zh-TW');

        if (!obj) {
            if (fallbackSubject && !fallbackSubject.includes('/api/')) return fallbackSubject;
            return `【333 一句提醒·照見當下】您的${serviceName || '命理'}諮詢結果（${dateStr}）`;
        }

        const root = obj.result || obj.chart || obj.report || obj.data || obj;
        const s = String(serviceName || '').toLowerCase();

        if (s.includes('六爻') || s.includes('liuyao')) {
            const ben = root.benGua?.name || '六爻神卦';
            const cat = root.category ? `【${root.category}】` : '';
            return `【333】六爻神卦${cat}排盤解讀報告（${ben}）`;
        }

        if (s.includes('姓名') || s.includes('name')) {
            if (root.candidates) {
                return `【333】${root.surname || ''}姓 · 取名候選推薦報告（共 ${root.candidates.length} 組精選）`;
            }
            if (root.name) {
                return `【333】${root.name} · 姓名學完整分析評估報告`;
            }
        }

        if (s.includes('塔羅') || s.includes('tarot')) {
            if (root.lifeNumber || root.lifePathNumber) {
                return `【333】您的塔羅生命靈數與靈魂象徵牌報告（${root.lifeNumber || root.lifePathNumber} 號人）`;
            }
            return `【333】韋特塔羅 · ${root.spreadName || root.spread_name || '占卜'}結果詳解`;
        }

        if (s.includes('紫微') || s.includes('ziwei')) {
            return `【333】紫微斗數命盤解析與未來正緣畫像報告`;
        }

        if (s.includes('梅花') || s.includes('meihua')) {
            return `【333】梅花易數 · ${root.bengua?.name || ''}卦象解析與行動指引`;
        }

        if (s.includes('八字') || s.includes('bazi')) {
            return `【333】生辰八字命理格局與五行調和報告`;
        }

        if (s.includes('風水') || s.includes('fengshui')) {
            return `【333】易經玄空風水佈局與九宮調理評估報告`;
        }

        if (s.includes('姻緣') || s.includes('yinyuan')) {
            return `【333】月老靈籤 · 第 ${root.stickNumber || ''} 籤姻緣指引報告`;
        }

        if (s.includes('解答之書') || s.includes('answerbook')) {
            return `【333】解答之書 · 照見當下的啟示與指引`;
        }

        return `【333 一句提醒·照見當下】您的${serviceName || '命理'}諮詢結果（${dateStr}）`;
    }

    return {
        isRawJsonPayload,
        extractJsonObject,
        formatHumanReadableReport,
        formatChartSummary,
        formatSubject
    };
});
