/**
 * 奇門遁甲格局與用神分析引擎 (Mainline Qimen Geju & Yongshen Engine)
 * 依據 mainline-cn-v1 正統規範實作十干克應、三遁吉格、凶格、門迫入墓擊刑與專題用神定位
 */

// 十天干克應格局對照表 (天盤干 + 地盤干)
const SHI_GAN_KE_YING = {
    '甲-甲': { name: '伏吟格', type: '凶', desc: '天盤地盤皆為旬首甲，凡事宜靜不宜動，阻滯重重。' },
    '乙-乙': { name: '日奇伏吟', type: '中', desc: '不宜求名求利，只宜安分守己，靜候時機。' },
    '乙-丙': { name: '奇儀順遂', type: '吉', desc: '吉星升遷，凶星受挫，利於求職、面試與晉升。' },
    '乙-丁': { name: '奇儀相佐', type: '吉', desc: '文書官司吉利，百事可為，得貴人提攜。' },
    '乙-戊': { name: '陰害陽門', type: '平', desc: '利於隱密行事，不利公開競爭，防小人口舌。' },
    '乙-己': { name: '日奇入霧', type: '凶', desc: '被土所迷，方向不明，容易陷入糾葛。' },
    '乙-庚': { name: '日奇被刑', type: '凶', desc: '爭訟財產，夫妻反目，易有阻礙與合約糾紛。' },
    '乙-辛': { name: '青龍逃走', type: '大凶', desc: '奴僕拐帶，財物損耗，測婚不利，防合作破裂。' },
    '乙-壬': { name: '日奇入地', type: '凶', desc: '尊卑悖亂，官訟是非，謀事難成。' },
    '乙-癸': { name: '日奇華蓋', type: '平', desc: '宜隱遁避災，修身養性，不宜大舉擴張。' },

    '丙-乙': { name: '日月並行', type: '吉', desc: '公謀私幹皆吉，利於合作與簽約。' },
    '丙-丙': { name: '月奇悖師', type: '凶', desc: '文書遺失，脾氣暴躁，易引發無謂爭執。' },
    '丙-丁': { name: '月奇朱雀', type: '吉', desc: '貴人文顯，文書大吉，常有喜訊傳來。' },
    '丙-戊': { name: '飛鳥跌穴', type: '大吉', desc: '百事吉利，不勞而獲，事業投資大獲成功。' },
    '丙-己': { name: '火悖入刑', type: '凶', desc: '囚人受杖，文書失序，防暗中使絆。' },
    '丙-庚': { name: '熒入太白', type: '大凶', desc: '門戶破敗，盜賊侵擾，主客易位，不宜冒進。' },
    '丙-辛': { name: '日月相會', type: '吉', desc: '謀事成就，求財有利，得異性或夥伴相助。' },
    '丙-壬': { name: '火入天羅', type: '凶', desc: '為客不利，是非相纏，易起波瀾。' },
    '丙-癸': { name: '月奇華蓋', type: '凶', desc: '吉門尚可，凶門招禍，防小人暗中算計。' },

    '丁-乙': { name: '玉女伏地', type: '吉', desc: '宜伏匿隱蔽，修整籌備，利於私下運作。' },
    '丁-丙': { name: '星隨月轉', type: '吉', desc: '貴人升遷，利於求名、考學與職務調動。' },
    '丁-丁': { name: '星奇重疊', type: '吉', desc: '文書即至，喜事臨門，消息靈通。' },
    '丁-戊': { name: '青龍得光', type: '大吉', desc: '官升財旺，求名利皆遂，大展宏圖。' },
    '丁-己': { name: '火入勾陳', type: '凶', desc: '奸私仇隙，事多牽連，文書有阻。' },
    '丁-庚': { name: '星奇受阻', type: '凶', desc: '文書阻隔，行者受阻，謀求不易。' },
    '丁-辛': { name: '朱雀入獄', type: '凶', desc: '罪人受刑，求官失位，文書容易出紕漏。' },
    '丁-壬': { name: '星奇相合', type: '吉', desc: '貴人提攜，合婚大吉，利於談判合作。' },
    '丁-癸': { name: '朱雀投江', type: '大凶', desc: '文書音信沉溺，口舌是非，病訟凶險。' },

    '戊-乙': { name: '青龍合靈', type: '吉', desc: '門吉事吉，門凶事凶，宜抓緊時機。' },
    '戊-丙': { name: '青龍返首', type: '大吉', desc: '百事俱吉，若逢吉門得令，求官求財無往不利。' },
    '戊-丁': { name: '青龍耀明', type: '大吉', desc: '宜謁貴求名，招財進寶，凡謀皆通。' },
    '戊-戊': { name: '伏吟天庭', type: '凶', desc: '凡事閉塞，只宜守舊，妄動招災。' },
    '戊-己': { name: '貴人入獄', type: '凶', desc: '公私皆不利，凡事受制於人。' },
    '戊-庚': { name: '值符飛宮', type: '凶', desc: '吉事成凶，凶事更凶，求謀換位。' },
    '戊-辛': { name: '青龍折足', type: '凶', desc: '吉門尚可，凶門招災，防破財傷身。' },
    '戊-壬': { name: '青龍入天牢', type: '凶', desc: '凡事多阻，進退維谷，防官非牽連。' },
    '戊-癸': { name: '青龍華蓋', type: '吉', desc: '吉門招福，門凶多乖，利於修行與幕後策劃。' },

    '己-乙': { name: '墓神逢星', type: '凶', desc: '地戶逢星，求謀難遂，暗藏阻力。' },
    '己-丙': { name: '火悖地戶', type: '凶', desc: '男人冤枉，女人私奔，易生是非糾紛。' },
    '己-丁': { name: '朱雀入墓', type: '凶', desc: '公文詞訟受阻，音訊難達，曲直難明。' },
    '己-戊': { name: '犬逢青龍', type: '吉', desc: '門吉光顯，門凶受累，利於謀劃求進。' },
    '己-己': { name: '地戶逢鬼', type: '凶', desc: '病者必凶，百事不遂，宜靜守避災。' },
    '己-庚': { name: '利格反名', type: '凶', desc: '詞訟先動者不利，宜守不宜攻。' },
    '己-辛': { name: '遊魂入墓', type: '凶', desc: '易招陰邪小人，神魂顛倒，防受騙上當。' },
    '己-壬': { name: '地網高張', type: '凶', desc: '奸盜走失，是非相纏，出行受阻。' },
    '己-癸': { name: '地刑玄武', type: '凶', desc: '詞訟逃亡，病厄牽連，防暗箭中傷。' },

    '庚-乙': { name: '太白相合', type: '吉', desc: '謀事有成，夫妻情深，唯防進展偏慢。' },
    '庚-丙': { name: '太白入熒', type: '凶', desc: '賊必來侵，防盜防詐，占事主客易位。' },
    '庚-丁': { name: '亭亭之格', type: '凶', desc: '因私通而起官非，美人計與感情糾葛。' },
    '庚-戊': { name: '天乙伏宮', type: '大凶', desc: '百事不可謀，主位受損，宜靜守自保。' },
    '庚-己': { name: '官符刑格', type: '凶', desc: '官訟破財，是非糾纏，求謀多阻。' },
    '庚-庚': { name: '戰格/太白同宮', type: '凶', desc: '兄弟反目，官災重重，行事激烈宜節制。' },
    '庚-辛': { name: '白虎干格', type: '凶', desc: '遠行車折，求財大虧，防突發意外。' },
    '庚-壬': { name: '小格/遠行格', type: '凶', desc: '遠行迷失，音信阻隔，官訟不利。' },
    '庚-癸': { name: '大格', type: '凶', desc: '求謀多阻，百事難成，行船防溺。' },

    '辛-乙': { name: '白虎猖狂', type: '大凶', desc: '家破人亡，遠行防災，求謀失利，婚姻不利。' },
    '辛-丙': { name: '干合悖師', type: '平', desc: '門吉尚可，門凶事乖，防因合作起爭端。' },
    '辛-丁': { name: '獄神得奇', type: '吉', desc: '囚人逢赦，求謀轉順，絕處逢生。' },
    '辛-戊': { name: '困龍被傷', type: '凶', desc: '官司破財，屈而不伸，宜低調耐守。' },
    '辛-己': { name: '入獄自刑', type: '凶', desc: '奴僕背主，訟訴難伸，自尋煩惱。' },
    '辛-庚': { name: '白虎出力', type: '凶', desc: '刀刃相見，強行謀求必招損害。' },
    '辛-辛': { name: '伏吟天庭', type: '凶', desc: '公廢私辦，事多窒礙，進退兩難。' },
    '辛-壬': { name: '凶蛇入獄', type: '凶', desc: '兩男爭女，詞訟不休，易生矛盾。' },
    '辛-癸': { name: '天牢華蓋', type: '凶', desc: '日月失明，誤入歧途，宜及時抽身。' },

    '壬-乙': { name: '小蛇化龍', type: '吉', desc: '男人發達，女人產喜，求謀漸入佳境。' },
    '壬-丙': { name: '水蛇入火', type: '凶', desc: '官災刑禁，絡繹不絕，急躁壞事。' },
    '壬-丁': { name: '干合蛇刑', type: '平', desc: '文書牽連，貴人反目，利於吉門化解。' },
    '壬-戊': { name: '小蛇化龍', type: '吉', desc: '財帛豐盈，謀事順利，事業獲助。' },
    '壬-己': { name: '反吟蛇刑', type: '凶', desc: '大禍臨頭，官訟難免，宜速尋解脫。' },
    '壬-庚': { name: '太白擒蛇', type: '吉', desc: '刑獄公平，立判邪正，邪不勝正。' },
    '壬-辛': { name: '騰蛇相纏', type: '凶', desc: '縱得吉門亦不能安，糾纏不休。' },
    '壬-壬': { name: '天獄自刑', type: '凶', desc: '外人侵侮，凡事淹留，易生波折。' },
    '壬-癸': { name: '幼女奸淫', type: '凶', desc: '家醜外揚，門庭不睦，防感情欺騙。' },

    '癸-乙': { name: '華蓋逢星', type: '吉', desc: '貴人祿位，常人平安，利於考學文藝。' },
    '癸-丙': { name: '華蓋悖師', type: '凶', desc: '貴賤不利，上人見喜，小人遭殃。' },
    '癸-丁': { name: '騰蛇夭矯', type: '大凶', desc: '文書官司，火焚口舌，火盜交加。' },
    '癸-戊': { name: '天乙會合', type: '吉', desc: '吉門財喜，婚姻成就，利於合作。' },
    '癸-己': { name: '華蓋地戶', type: '凶', desc: '男女音信隔絕，占病大凶，宜防隱疾。' },
    '癸-庚': { name: '太白重刑', type: '凶', desc: '吉門尚可，凶門主災，防法律風險。' },
    '癸-辛': { name: '網蓋天牢', type: '凶', desc: '官司敗訴，疾病難癒，陷入困境。' },
    '癸-壬': { name: '復見騰蛇', type: '凶', desc: '嫁娶重婚，後夫無子，事多反覆。' },
    '癸-癸': { name: '天網四張', type: '凶', desc: '行路迷茫，病訟危殆，只宜退守。' }
};

// 三遁神格判定
function detectDunGe(gongNum, tianGan, diGan, menName, shenName) {
    const list = [];
    if (tianGan === '丙' && (diGan === '丁' || diGan === '戊') && menName === '生門') list.push({ name: '天遁', type: '大吉', desc: '得天時之助，大展宏圖，乘勢而上。' });
    if (tianGan === '乙' && diGan === '己' && (menName === '開門' || shenName === '九地')) list.push({ name: '地遁', type: '大吉', desc: '得地利之助，深謀遠慮，基礎穩固。' });
    if (tianGan === '丁' && menName === '休門' && shenName === '太陰') list.push({ name: '人遁', type: '大吉', desc: '得人和之助，貴人暗助，溝通和合。' });
    if (tianGan === '丙' && menName === '生門' && shenName === '九天') list.push({ name: '神遁', type: '大吉', desc: '威名遠播，勢如破竹，吉星高照。' });
    if (tianGan === '乙' && menName === '杜門' && shenName === '九地') list.push({ name: '鬼遁', type: '吉', desc: '暗中運作，避開耳目，出奇制勝。' });
    if (tianGan === '乙' && menName === '開門' && (gongNum === '4' || gongNum === '3')) list.push({ name: '風遁', type: '吉', desc: '順風推進，行事借力打力。' });
    if (tianGan === '乙' && diGan === '辛' && (gongNum === '4' || gongNum === '9')) list.push({ name: '雲遁', type: '吉', desc: '遮蔽隱蔽，利於暗度陳倉。' });
    if (tianGan === '乙' && diGan === '癸' && gongNum === '1') list.push({ name: '龍遁', type: '吉', desc: '潛龍騰淵，利於水路與遠程佈局。' });
    if (tianGan === '辛' && diGan === '乙' && gongNum === '8') list.push({ name: '虎遁', type: '吉', desc: '虎踞山林，利於防守與坐鎮後方。' });
    return list;
}

// 門迫判定（門克宮為門迫）
const MEN_ELEMENT = { 休門: '水', 生門: '土', 傷門: '木', 杜門: '木', 景門: '火', 死門: '土', 驚門: '金', 開門: '金' };
const GONG_ELEMENT = { '1': '水', '2': '土', '3': '木', '4': '木', '5': '土', '6': '金', '7': '金', '8': '土', '9': '火' };
const KE_MAP = { 木: '土', 土: '水', 水: '火', 火: '金', 金: '木' };

function isMenPo(menName, gongNum) {
    const menE = MEN_ELEMENT[menName];
    const gongE = GONG_ELEMENT[gongNum];
    return menE && gongE && KE_MAP[menE] === gongE;
}

// 宮迫判定（宮克門為宮迫）
function isGongPo(menName, gongNum) {
    const menE = MEN_ELEMENT[menName];
    const gongE = GONG_ELEMENT[gongNum];
    return menE && gongE && KE_MAP[gongE] === menE;
}

/**
 * 全面分析奇門遁甲九宮格局
 */
function analyzeQimenGeju(qimenData = {}) {
    const baMen = qimenData.baMen || {};
    const jiuXing = qimenData.jiuXing || {};
    const baShen = qimenData.baShen || {};
    const diPan = qimenData.diPan || {};
    const sanQiLiuYi = qimenData.sanQiLiuYi || qimenData.luoGongGan || {};

    const gongResults = {};
    const allPatterns = [];

    for (let i = 1; i <= 9; i++) {
        const gongKey = String(i);
        const tianGan = sanQiLiuYi[gongKey] || '';
        const diGan = diPan[gongKey] || '';
        const menName = baMen[gongKey] || '';
        const xingName = jiuXing[gongKey] || '';
        const shenName = baShen[gongKey] || '';

        const pairKey = `${tianGan}-${diGan}`;
        const ganPattern = SHI_GAN_KE_YING[pairKey] || null;
        const dunPatterns = detectDunGe(gongKey, tianGan, diGan, menName, shenName);
        const menPo = menName ? isMenPo(menName, gongKey) : false;
        const gongPo = menName ? isGongPo(menName, gongKey) : false;

        const currentPatterns = [];
        if (ganPattern) currentPatterns.push(ganPattern);
        dunPatterns.forEach(d => currentPatterns.push(d));
        if (menPo) currentPatterns.push({ name: '門迫', type: '凶', desc: `【${menName}】克【第${gongKey}宮】，行事耗力受阻，吉事減半凶事加倍。` });
        if (gongPo) currentPatterns.push({ name: '宮迫', type: '凶', desc: `【第${gongKey}宮】克【${menName}】，受制於環境壓力。` });

        gongResults[gongKey] = {
            gongNum: gongKey,
            tianGan,
            diGan,
            menName,
            xingName,
            shenName,
            patterns: currentPatterns,
            menPo,
            gongPo
        };

        currentPatterns.forEach(p => {
            allPatterns.push({
                gong: gongKey,
                ...p
            });
        });
    }

    return {
        gongResults,
        allPatterns,
        specialPatterns: allPatterns.filter(p => p.type === '大吉' || p.type === '大凶' || p.name.includes('遁'))
    };
}

/**
 * 依問事類別鎖定專題用神（對齊 FANzR-arch/Numerologist_skills 規範）
 */
function locateYongshen(qimenData = {}, category = '綜合') {
    const baMen = qimenData.baMen || {};
    const jiuXing = qimenData.jiuXing || {};
    const baShen = qimenData.baShen || {};
    const cat = String(category || '綜合').trim();

    let mainYongshenName = '值符 / 日干';
    let secondaryYongshenName = '開門 / 生門';
    let targetKey = 'zhifu';

    if (cat.includes('財') || cat.includes('投資') || cat.includes('商務')) {
        mainYongshenName = '生門 (主求財/利潤)';
        secondaryYongshenName = '甲子戊 (資本資金)';
        targetKey = 'cai';
    } else if (cat.includes('工作') || cat.includes('事業') || cat.includes('跳槽') || cat.includes('面試')) {
        mainYongshenName = '開門 (主工作事業)';
        secondaryYongshenName = '值符 (主管/平台支援)';
        targetKey = 'career';
    } else if (cat.includes('感情') || cat.includes('姻緣') || cat.includes('桃花') || cat.includes('婚')) {
        mainYongshenName = '六合 (婚姻感情)';
        secondaryYongshenName = '乙(女方) / 庚(男方)';
        targetKey = 'love';
    } else if (cat.includes('考') || cat.includes('學') || cat.includes('證照')) {
        mainYongshenName = '景門 (主考卷成績)';
        secondaryYongshenName = '天輔星 (文曲名聲)';
        targetKey = 'study';
    } else if (cat.includes('病') || cat.includes('健康') || cat.includes('醫')) {
        mainYongshenName = '天芮星 (主病灶)';
        secondaryYongshenName = '死門 / 日干';
        targetKey = 'health';
    } else if (cat.includes('行') || cat.includes('方位') || cat.includes('出差')) {
        mainYongshenName = '目標方位宮位';
        secondaryYongshenName = '開門 / 生門 / 值符';
        targetKey = 'travel';
    } else if (cat.includes('訴訟') || cat.includes('官司') || cat.includes('合約')) {
        mainYongshenName = '驚門 / 開門 (法官/訴訟)';
        secondaryYongshenName = '天心星 (律師/醫者)';
        targetKey = 'law';
    }

    // 尋找主用神所在宮位
    let mainGongNum = String(qimenData.zhiFuGong || '1');

    for (let i = 1; i <= 9; i++) {
        const k = String(i);
        const m = baMen[k];
        const x = jiuXing[k];
        const s = baShen[k];
        if (targetKey === 'cai' && m === '生門') { mainGongNum = k; break; }
        if (targetKey === 'career' && m === '開門') { mainGongNum = k; break; }
        if (targetKey === 'love' && (s === '六合' || m === '休門')) { mainGongNum = k; break; }
        if (targetKey === 'study' && (m === '景門' || x === '天輔')) { mainGongNum = k; break; }
        if (targetKey === 'health' && (x === '天芮' || m === '死門')) { mainGongNum = k; break; }
    }

    const mainGongMen = baMen[mainGongNum] || '';
    const mainGongShen = baShen[mainGongNum] || '';

    // 主客動靜利弊判定
    let hostGuestAdvice = '宜客宜動：當前局勢積極主動出擊更佔優勢，搶佔先機。';
    if (mainGongMen === '休門' || mainGongMen === '生門' || mainGongShen === '太陰' || mainGongShen === '九地') {
        hostGuestAdvice = '宜主宜靜：當前局勢宜守不宜攻，靜待對手動態或局勢明朗化。';
    }

    return {
        category: cat,
        mainYongshen: mainYongshenName,
        secondaryYongshen: secondaryYongshenName,
        targetGong: mainGongNum,
        hostGuestDynamic: hostGuestAdvice,
        summary: `占問【${cat}】：主用神鎖定為【${mainYongshenName}】，落【第${mainGongNum}宮】。局勢動態：${hostGuestAdvice}`
    };
}

module.exports = {
    SHI_GAN_KE_YING,
    detectDunGe,
    isMenPo,
    isGongPo,
    analyzeQimenGeju,
    locateYongshen
};
