/**
 * 韓式現代四柱命理引擎 (Korean Saju / K-Saju Engine)
 * 靈感融合 be-realdeveloper/saju (18장 평생사주 만세력 Skill) 與 imgompanda/drsaju-opensource (닥터사주)
 *
 * 核心功能：
 * 1. 日干 10 種靈魂原型 (10 Ilgan Soul Archetypes / 東方 MBTI)
 * 2. 身強身弱能量天秤 (Singang / Sinyak Quantified 0~100% Scale)
 * 3. 五行能量分佈與缺行開運法 (Missing Elements & Lifestyle Remedies)
 * 4. 四柱宮位論 (Gungwi-ron: 年柱幼年/根基、月柱青年/社會、日柱中年/真我配偶、時柱晚年/潛能)
 * 5. 韓系精選吉凶神煞 (Key Shensha in Korean Tradition: 貴人、桃花、驛馬、華蓋、白虎、魁罡、怨嗔)
 * 6. 平生四柱 18 章解析體系 (18-Chapter Lifetime Saju Blueprint)
 */

const { calculateBazi, STEM_ELEMENT, BRANCH_ELEMENT } = require('./bazi2');

// 10 日干靈魂原型字典 (Korean Saju Day Master Archetypes)
const ILGAN_ARCHETYPES = {
    '甲': {
        hangul: '갑목 (甲木)',
        title: '푸른 거목의 개척자',
        chineseTitle: '青色巨木的先鋒開拓者',
        element: '木',
        polarity: '陽',
        symbol: '參天大樹、棟樑之材',
        mbtiResonance: 'ENTJ / ENFJ',
        coreKeywords: ['領導魄力', '向上突破', '自尊心強', '正直不阿', '開拓先鋒'],
        strengths: '具有頂天立地的開創意志與領導魅力，目標明確，不懼艱難，凡事勇於衝鋒陷陣並照拂身邊團隊。',
        vulnerabilities: '性情過剛易折，遇挫折不善低頭妥協；自我要求與自尊心極高，容易承受過大精神壓力。',
        careerStyle: '創業先鋒、企業高階主管、政治倡議、獨立專案負責人、拓荒領域。',
        loveStyle: '渴望被尊重與崇拜，感情中主導性強，但對認定的伴侶忠誠專一、極具保護欲。'
    },
    '乙': {
        hangul: '을목 (乙木)',
        title: '유연한 담쟁이 꽃',
        chineseTitle: '柔韌靈活的蔓藤花草',
        element: '木',
        polarity: '陰',
        symbol: '春日花草、藤蔓蔓延、常春藤',
        mbtiResonance: 'ENFP / INFP',
        coreKeywords: ['柔韌堅定', '適應力超群', '人際親和', '借力使力', '靈活變通'],
        strengths: '外柔內剛，具有極強的環境適應力與野草般的生命力；善於人際溝通與資源借力，擅長在逆境中生存繁衍。',
        vulnerabilities: '有時優柔寡斷、依賴心較重；情緒敏感易受外界波動影響，需學會果敢獨當一面。',
        careerStyle: '公關外交、藝術設計、傳播行銷、教育諮商、社群運營、文化創意。',
        loveStyle: '感情細膩浪漫，善於體貼傾聽；重視心靈陪伴，渴望溫柔支持型伴侶。'
    },
    '丙': {
        hangul: '병화 (丙火)',
        title: '세상을 비추는 태양',
        chineseTitle: '普照萬物的熾熱烈日',
        element: '火',
        polarity: '陽',
        symbol: '空中烈日、萬丈光明、光芒萬丈',
        mbtiResonance: 'ESFP / ENTP',
        coreKeywords: ['熱情明亮', '慷慨大方', '感染力強', '直率磊落', '自信光芒'],
        strengths: '如太陽般無私普照，熱情洋溢、活力四射；不藏私心，具備強大的社交感染力與號召力。',
        vulnerabilities: '性情急躁、缺乏長久耐性；直來直往藏不住心事，有時過於高調容易引發誤解或三分鐘熱度。',
        careerStyle: '演藝娛樂、演說培訓、大眾傳播、市場行銷、品牌公關、創意策劃。',
        loveStyle: '愛憎分明、熱情主動；追求轟轟烈烈的浪漫，對伴侶大方慷慨，但需要被肯定與讚美。'
    },
    '丁': {
        hangul: '정화 (丁火)',
        title: '밤을 밝히는 등불',
        chineseTitle: '溫暖夜空的靜謐燈火',
        element: '火',
        polarity: '陰',
        symbol: '冬夜燭光、壁爐暖火、引航燈塔',
        mbtiResonance: 'INFJ / ISFJ',
        coreKeywords: ['溫暖治癒', '專注執著', '洞察入微', '深思熟慮', '照亮他人'],
        strengths: '外表文靜優雅，內心熱情持久；具備極強的專注力、同理心與犧牲奉獻精神，善於撫慰人心。',
        vulnerabilities: '多思多慮易內耗，受傷時容易鑽牛角尖；表面波瀾不驚，內心積壓過多情緒不易釋放。',
        careerStyle: '心理諮商、專業學者、深度研發、精細工藝、醫療護理、精神導師。',
        loveStyle: '細水長流的深情陪伴，願意為愛默默付出一切；重視靈魂默契，對不真誠之人防禦心極強。'
    },
    '戊': {
        hangul: '무토 (戊土)',
        title: '넓고 깊은 거대한 산',
        chineseTitle: '厚重深沉的崇山峻嶺',
        element: '土',
        polarity: '陽',
        symbol: '巍峨高山、厚重大地、萬物屏障',
        mbtiResonance: 'ISTJ / ESTJ',
        coreKeywords: ['沉穩穩重', '信譽第一', '胸襟宏闊', '堅定可靠', '不動如山'],
        strengths: '性格沉穩、講究信用，具有大地包容萬物的厚重胸襟；臨危不亂，是團隊中最值得信任的中流砥柱。',
        vulnerabilities: '行動節奏較慢，思想較保守不易接納激進變革；固執起來九頭牛拉不回，容易顯得木訥。',
        careerStyle: '不動產建築、金融信託、企業營運、政府公職、物流供應鏈、資產管理。',
        loveStyle: '樸實無華的可靠伴侶，不擅言辭承諾但用實際行動給予滿滿安全感，重視家庭責任。'
    },
    '己': {
        hangul: '기토 (己土)',
        title: '생명을 품는 기름진 들판',
        chineseTitle: '孕育生機的肥沃良田',
        element: '土',
        polarity: '陰',
        symbol: '滋潤泥土、豐饒田園、春耕大地',
        mbtiResonance: 'ISFP / ESFJ',
        coreKeywords: ['包容滋養', '親和順應', '多才多藝', '默默耕耘', '善解人意'],
        strengths: '極具包容心與適應力，不挑環境，善於滋養、栽培人事物；心思細密，能妥善協調多方利益。',
        vulnerabilities: '容易缺乏定見、隨波逐流；常為了成全他人而委屈妥協自己，內心易累積被動委屈。',
        careerStyle: '人力資源、幼兒教育、農業生技、社福公益、行政協調、文化出版。',
        loveStyle: '溫柔體貼如大地滋養，給予伴侶無限包容與生活照拂；渴望穩定踏實的細緻陪伴。'
    },
    '庚': {
        hangul: '경금 (庚金)',
        title: '강인하고 날카로운 원석·무쇠',
        chineseTitle: '威嚴果決的剛毅重劍',
        element: '金',
        polarity: '陽',
        symbol: '剛硬原礦、淬火利刃、將帥兵刃',
        mbtiResonance: 'ESTP / ENTJ',
        coreKeywords: ['果敢決斷', '正義重義', '雷厲風行', '是非分明', '大將之風'],
        strengths: '意志如鋼鐵般堅定，行事俐落乾脆、絕不拖泥帶水；崇尚公平正義，敢作敢當，天生具備破局斬將的威勢。',
        vulnerabilities: '講話過於直白刺人，缺乏情緒緩衝；過度好強容易樹敵，不善體察細膩的人情世故。',
        careerStyle: '法律檢察、軍警安保、外科醫療、企業重組破局、硬體工程、重工業科技。',
        loveStyle: '愛得乾脆俐落、極重承諾；不喜歡猜忌遊戲，對伴侶坦率真誠，護短有擔當。'
    },
    '辛': {
        hangul: '신금 (辛金)',
        title: '빛나는 보석과 섬세한 칼날',
        chineseTitle: '璀璨剔透的精緻美玉',
        element: '金',
        polarity: '陰',
        symbol: '晶瑩美玉、璀璨鑽石、精緻手術刀',
        mbtiResonance: 'INTJ / ISFP',
        coreKeywords: ['完美主義', '精緻高雅', '敏銳洞察', '自律自尊', '美感非凡'],
        strengths: '極度注重細節與美感，自我要求嚴格，追求極致境界；直覺敏銳、洞悉力強，氣質清雅出眾。',
        vulnerabilities: '過於挑剔完美主義容易苛求自己與他人；自尊心極高且脆弱，受傷後不易釋懷、容易記仇。',
        careerStyle: '珠寶精品、高階科研、金融風控、精密設計、高難度專科醫師、藝術鑑定。',
        loveStyle: '追求精神潔癖與靈魂契合；對伴侶品味與內涵要求極高，一旦愛上便傾心維護這段珍貴關係。'
    },
    '壬': {
        hangul: '임수 (壬水)',
        title: '자유롭게 흐르는 거대한 바다',
        chineseTitle: '奔騰自由的浩瀚汪洋',
        element: '水',
        polarity: '陽',
        symbol: '大江大海、滔滔奔流、萬流歸海',
        mbtiResonance: 'ENTP / INTP',
        coreKeywords: ['大智若愚', '格局深邃', '崇尚自由', '適應萬變', '富有遠見'],
        strengths: '智慧如海、深不可測，具有宏闊的戰略眼光與包容百川的氣度；不拘小節，能根據任何形勢快速調整策略。',
        vulnerabilities: '過於隨性自由不易受拘束，缺乏長久規律紀律；心思太深容易給人難以捉摸或城府深的距離感。',
        careerStyle: '全球跨國貿易、戰略投資、航運物流、哲學思辨、互聯網架構、高階智庫。',
        loveStyle: '喜歡靈活開明、無拘無束的感情；討厭被情緒勒索，渴望伴侶也是具備廣大視野的同行者。'
    },
    '癸': {
        hangul: '계수 (癸水)',
        title: '생명을 적시는 봄비·이슬',
        chineseTitle: '滋潤萬物的清柔雨露',
        element: '水',
        polarity: '陰',
        symbol: '甘霖春雨、清晨朝露、靜謐深泉',
        mbtiResonance: 'INFP / INFJ',
        coreKeywords: ['靈性直覺', '柔順潤澤', '洞察人心', '深沉潛能', '善感多情'],
        strengths: '心思細膩如微雨潤物無聲，具備極強的直覺、同理心與第六感；能悄悄滲透並化解最僵硬的矛盾與環境。',
        vulnerabilities: '多愁善感易陷入悲觀，意志力有時不夠堅韌；常因過度感知他人情緒而承受莫須有的心理負擔。',
        careerStyle: '心靈療癒、人文創作、心理諮商、玄學命理、影視編劇、藝術策劃。',
        loveStyle: '極度渴望深沉的靈魂相印，溫柔體貼、用情至深；需要伴侶給予安全堅定的情感守候。'
    }
};

// 缺失五行生活開運錦囊 (Lifestyle Remedies - 개운법)
const REMEDIES_TABLE = {
    '木': {
        element: '木',
        hangul: '목 (Wood)',
        title: '生發開拓與生機平衡錦囊',
        colors: ['翠綠色', '薄荷綠', '草木綠', '森林深綠', '自然大地色'],
        luckyDirections: ['東方', '東南方'],
        dietWellness: ['晨起空腹溫開水', '深綠色蔬菜（菠菜、花椰菜、甘藍）', '奇異果、綠茶', '酸味健康食材（適量檸檬水）助肝膽氣疏泄'],
        lifestyleHabits: [
            '每日早晨安排 15 分鐘戶外或公園森林散步，吸收清晨草木生氣',
            '書桌或居室擺放生機盎然的常綠盆栽（如龜背竹、虎尾蘭）',
            '多接觸紙質實體書籍閱讀，培養探索未知領域的新鮮好奇心',
            '睡前進行全身大肌群伸展運動，舒緩筋膜與筋骨緊繃'
        ],
        actionAdvice: '主動跨出舒適圈，嘗試開拓一項新技能或專案，讓內在活力蓬勃生長。'
    },
    '火': {
        element: '火',
        hangul: '화 (Fire)',
        title: '熱情光明與心神活力錦囊',
        colors: ['正紅色', '酒紅色', '暖橘色', '珊瑚粉', '暖金色'],
        luckyDirections: ['南方'],
        dietWellness: ['紅棗、枸杞、番茄、紅豆', '適度辛香溫性料理（生薑、肉桂）', '多喝溫熱飲品，避開過量生冷寒涼'],
        lifestyleHabits: [
            '每天中午前後多曬 15-20 分鐘自然陽光，補充體內陽氣',
            '居家或辦公空間採用高色溫暖黃色調燈光，點亮昏暗角落',
            '安排規律有氧運動（慢跑、跳繩、快走），讓身體自然微微發汗',
            '練習主動對身邊人微笑表達感謝，散發溫暖的正向人際氣場'
        ],
        actionAdvice: '不要壓抑熱情，積極表達內心真實感受，主動擔任熱場與激勵他人的光芒角色。'
    },
    '土': {
        element: '土',
        hangul: '토 (Earth)',
        title: '大地厚重與信賴穩定錦囊',
        colors: ['米黃色', '卡其色', '暖棕色', '駝色', '大地泥土色'],
        luckyDirections: ['中央', '西南方', '東北方'],
        dietWellness: ['黃色根莖類天然食材（地瓜、南瓜、山藥、馬鈴薯）', '小米粥、玉米、黃豆', '細嚼慢嚥保養脾胃消化系統'],
        lifestyleHabits: [
            '假日進行赤腳踩草地接地氣（Earthing），感受大地沉靜能量',
            '接觸陶藝、園藝植栽泥土，用雙手觸摸大自然的踏實質地',
            '嚴格建立誠信作風，說到做到，成為團體中言出必行的定海神針',
            '固定每日三餐與睡眠作息，建立高度規律的生活秩序感'
        ],
        actionAdvice: '以穩健為第一原則，不盲目追求快餐式捷徑，深耕專業，厚積而薄發。'
    },
    '金': {
        element: '金',
        hangul: '금 (Metal)',
        title: '剛毅果決與極簡自律錦囊',
        colors: ['純白色', '銀色', '淺灰色', '香檳白', '金屬冷光色'],
        luckyDirections: ['西方', '西北方'],
        dietWellness: ['白色潤肺食材（水梨、白蘿蔔、銀耳、百合、杏仁）', '注重呼吸道與皮膚保濕保養', '少食辛辣油膩烤炸物'],
        lifestyleHabits: [
            '定期對居住與工作空間進行徹底斷捨離，清除無用雜物與雜念',
            '隨身配戴簡約質感金屬手錶或銀飾，提醒自己講求原則與時間分秒',
            '學習在人際交往中樹立健康清晰的界線，敢於果斷說「不」',
            '制定每日明確清單（To-Do List），雷厲風行推進並逐項劃除'
        ],
        actionAdvice: '精雕細琢核心優勢，杜絕優柔寡斷與拖延，用清晰原則與高效執行力打造個人品牌。'
    },
    '水': {
        element: '水',
        hangul: '수 (Water)',
        title: '深邃智慧與靈活變通錦囊',
        colors: ['曜石黑', '深海藍', '海軍藍', '墨灰色', '藍黑色'],
        luckyDirections: ['北方'],
        dietWellness: ['黑色滋腎食材（黑芝麻、黑木耳、黑豆、海帶、黑米）', '保持充足優質飲水量', '注重腰部與下肢保暖'],
        lifestyleHabits: [
            '多親近江河湖海或參與水上活動（游泳、溫泉水療、海邊漫步）',
            '每天睡前保留 15 分鐘靜坐冥想，讓浮躁的心神像沉澱的池水般平靜',
            '多研讀哲學、歷史或心靈書籍，拓展超越表象的深層思維格局',
            '學會像流水般靈活順應形勢變化，以柔克剛，不與硬石正面衝突'
        ],
        actionAdvice: '培養深度傾聽與敏銳直覺，在多變環境中保持順勢而為的彈性，用無形智慧攻克難關。'
    }
};

// 四柱宮位論映射 (Gungwi-ron 4 Pillars Arena)
const GUNGWI_PILLARS = [
    {
        key: 'year',
        hangul: '연주 (年柱)',
        title: '조상과 초년운 (家族根基與幼年成長)',
        ageRange: '0 ~ 19 歲',
        role: '祖蔭背景 · 潛意識根基',
        description: '反映家族遺傳稟賦、成長原生家庭氛圍，以及幼年時期建立的安全感與潛意識性格底色。'
    },
    {
        key: 'month',
        hangul: '월주 (月柱)',
        title: '부모와 사회활동운 (父母因緣與社會青年)',
        ageRange: '20 ~ 39 歲',
        role: '職場環境 · 社會適應力',
        description: '反映青年期踏入社會的打拼歷程、職場事業定位、與父母主管長輩的相處，以及個人在社會環境中的核心競爭力。'
    },
    {
        key: 'day',
        hangul: '일주 (日柱)',
        title: '나와 배우자운 (真我本質與中年正緣)',
        ageRange: '40 ~ 59 歲',
        role: '真我靈魂 · 夫妻家庭宮',
        description: '日干為命主本質靈魂，日支為夫妻宮；反映中年時期心境定調、婚姻相處模式，以及最真實不可妥協的內心世界。'
    },
    {
        key: 'hour',
        hangul: '시주 (時柱)',
        title: '자식과 말년운 (子女歸宿與晚年潛能)',
        ageRange: '60 歲以上',
        role: '潛藏才能 · 晚年精神世界',
        description: '反映個人尚未完全發揮的隱藏天賦、晚年精神生活與健康歸宿，以及與子女晚輩的緣分深度。'
    }
];

// 平生四柱 18 章目錄結構 (18-Chapter Lifetime Saju Blueprint)
const SAJU_18_CHAPTERS = [
    { chapter: 1, title: '總評 (인생 총평)', desc: '四柱全局宏觀定調、命格格局核心特質與一生氣象' },
    { chapter: 2, title: '日干本質與靈魂性格 (일간과 성격 기질)', desc: '10 日干靈魂原型剖析、天賦性格優勢、隱藏盲點與處世風格' },
    { chapter: 3, title: '身強身弱能量天秤 (신강·신약 에너지 밸런스)', desc: '得令、得地、得勢 0~100 量化能量評分與抗壓自律能力' },
    { chapter: 4, title: '五行分佈與缺行開運法 (오행 균형과 개운법)', desc: '五行強弱雷達、缺失五行分析，專屬顏色、方位、飲食與習慣生活開運錦囊' },
    { chapter: 5, title: '十神結構與人生劇本 (십신 구조 분석)', desc: '正官/七殺/正財/偏財/食神/傷官/印星/比劫配置與主導人生課題' },
    { chapter: 6, title: '格局器量與成就天花板 (격국과 그릇)', desc: '生辰正格/變格定位、社會成就發揮潛力與自我突破關鍵' },
    { chapter: 7, title: '喜用神平生良藥 (용신 분석)', desc: '命局調候與通關良方、人生逢凶化吉的關鍵貴人與五行生機' },
    { chapter: 8, title: '大運人生四季曲線 (대운 인생그래프)', desc: '十年一大運之起伏轉折、早年/青年/中年/晚年之運勢盛衰周期' },
    { chapter: 9, title: '財運風格與資產積累 (재물운과 투자 성향)', desc: '正財穩定型 vs. 偏財開拓型、金錢態度、理財地雷與財庫聚散規律' },
    { chapter: 10, title: '職場適性與職涯發展 (직장·사업·커리어)', desc: '最契合的工作型態、體制內升遷 vs. 獨立創業、團隊協作角色' },
    { chapter: 11, title: '學業進修與考運智慧 (학업과 시험운)', desc: '學習專注模式、進修考證策略與終身學習契機' },
    { chapter: 12, title: '正緣婚戀與伴侶畫像 (애정·결혼·배우자운)', desc: '夫妻宮投射、理想伴侶外貌性格年齡特徵、相處磨合之道與正緣相遇節奏' },
    { chapter: 13, title: '體質特徵與五臟調養 (건강운과 신체 관리)', desc: '五行生剋對應之易損臟腑、亞健康警訊與日常養生保健方針' },
    { chapter: 14, title: '人際網絡與貴人緣分 (대인관계와 사회성)', desc: '社交風格、防小人策略、天乙/文昌貴人引路與人脈槓桿' },
    { chapter: 15, title: '四柱宮位四幕人生 (궁위론: 초년·청년·중년·말년)', desc: '年柱根基、月柱社會、日柱家庭、時柱歸宿分階段人生劇本' },
    { chapter: 16, title: '命中神煞與特殊能量 (주요 신살 풀이)', desc: '天乙、桃花、驛馬、華蓋、魁罡、白虎等神煞之吉凶實用轉化' },
    { chapter: 17, title: '當前歲運重點與近期節奏 (올해의 세운과 월별 흐름)', desc: '當前流年干支交應、機遇點、避坑警告與關鍵月令推演' },
    { chapter: 18, title: '照見當下核心建言與諮詢指引 (맞춤형 종합 조언 및 상담 모드)', desc: '直面內心困惑的一句核心提醒、具體行動決策與無限制深度追問' }
];

/**
 * 計算量化身強身弱能量天秤 (Singang / Sinyak Score 0~100)
 * 權重分配標準：
 * - 得令 (Deungryeong, 月令): 30%
 * - 得地 (Deungji, 日支通根): 30%
 * - 得勢 (Deungse, 其他天干地支印比生扶): 40%
 */
function calculateSingangScore(fourPillars, dayMasterStem) {
    if (!fourPillars || fourPillars.length < 4 || !dayMasterStem) {
        return { score: 50, level: '중화 (中和平衡)', description: '氣息均勻，身強身弱平衡' };
    }

    const selfElem = STEM_ELEMENT[dayMasterStem];
    const monthBranch = fourPillars[1]?.branch;
    const dayBranch = fourPillars[2]?.branch;

    // 1. 得令判斷 (Deungryeong - 30%)
    let deungryeongScore = 0;
    if (monthBranch) {
        const mbElem = BRANCH_ELEMENT[monthBranch];
        if (mbElem === selfElem) {
            deungryeongScore = 30; // 同氣得令
        } else {
            // 印星生扶
            const parentElem = { '木': '水', '火': '木', '土': '火', '金': '土', '水': '金' }[selfElem];
            if (mbElem === parentElem) deungryeongScore = 25;
            else if (['辰', '未', '戌', '丑'].includes(monthBranch) && selfElem === '金') deungryeongScore = 18;
            else deungryeongScore = 0;
        }
    }

    // 2. 得地判斷 (Deungji - 30%)
    let deungjiScore = 0;
    if (dayBranch) {
        const dbElem = BRANCH_ELEMENT[dayBranch];
        if (dbElem === selfElem) {
            deungjiScore = 30;
        } else {
            const parentElem = { '木': '水', '火': '木', '土': '火', '金': '土', '水': '金' }[selfElem];
            if (dbElem === parentElem) deungjiScore = 24;
            else deungjiScore = 6;
        }
    }

    // 3. 得勢判斷 (Deungse - 40%)
    // 統計年干、年支、月干、時干、時支之印星與比劫支持度
    const parentElem = { '木': '水', '火': '木', '土': '火', '金': '土', '水': '金' }[selfElem];
    let supportiveWeights = 0;
    const testPositions = [
        { elem: STEM_ELEMENT[fourPillars[0]?.stem], weight: 7 },
        { elem: BRANCH_ELEMENT[fourPillars[0]?.branch], weight: 7 },
        { elem: STEM_ELEMENT[fourPillars[1]?.stem], weight: 10 },
        { elem: STEM_ELEMENT[fourPillars[3]?.stem], weight: 8 },
        { elem: BRANCH_ELEMENT[fourPillars[3]?.branch], weight: 8 }
    ];

    testPositions.forEach(p => {
        if (p.elem === selfElem) supportiveWeights += p.weight;
        else if (p.elem === parentElem) supportiveWeights += Math.round(p.weight * 0.85);
    });

    const deungseScore = Math.min(40, supportiveWeights);
    const totalScore = Math.min(100, Math.max(10, deungryeongScore + deungjiScore + deungseScore));

    let level = '중화 (中和平衡)';
    let levelChinese = '中和平衡';
    let energyDesc = '八字內在五行能量平衡，隨大運流年靈活自適。';

    if (totalScore >= 65) {
        level = '극신강 (極身強)';
        levelChinese = '極身強 (能量極旺盛)';
        energyDesc = '自身精力充沛、自信強烈、抗壓爆發力極高；適宜透過承擔重責、事業開拓（食傷洩秀、官殺克制）來施展才華。';
    } else if (totalScore >= 53) {
        level = '신강 (身強)';
        levelChinese = '身強 (能量充沛)';
        energyDesc = '自我意識健全、意志堅定，具備擔當大財與大事業的穩定底氣，能自主破局開闢天地。';
    } else if (totalScore >= 47) {
        level = '중화 (中和平衡)';
        levelChinese = '中和平衡';
        energyDesc = '命局五行能量均衡，行事客觀冷靜、不易偏激，隨行運調節即可取得良好成果。';
    } else if (totalScore >= 36) {
        level = '신약 (身弱)';
        levelChinese = '身弱 (靈活敏銳)';
        energyDesc = '感受力細膩敏銳、具親和力與合作智慧；宜多借助貴人相助、團隊力量（印星生扶、比劫合作）共同成事。';
    } else {
        level = '극신약 (極身弱)';
        levelChinese = '極身弱 (柔和借力)';
        energyDesc = '生性溫柔順應、同理心極強；需重視精神充電與身體保養，避免過度燃燒自己，善於順勢借力他人平台。';
    }

    return {
        score: totalScore,
        level,
        levelChinese,
        details: {
            deungryeong: deungryeongScore,
            deungji: deungjiScore,
            deungse: deungseScore
        },
        description: energyDesc
    };
}

/**
 * 完整計算韓式四柱命理 (Korean Saju Full Suite Calculation)
 */
function calculateKoreanSaju(input = {}) {
    // 1. 調用正統萬歲曆與真太陽時八字底層
    const baziData = calculateBazi(input);

    const dayMasterStem = baziData.dayMaster?.stem || '甲';
    const archetype = ILGAN_ARCHETYPES[dayMasterStem] || ILGAN_ARCHETYPES['甲'];

    // 2. 身強身弱能量天秤 (0~100)
    const energyMeter = calculateSingangScore(baziData.fourPillars, dayMasterStem);

    // 3. 識別缺失與過多五行
    const fiveElements = baziData.fiveElements || { counts: {}, percentages: {} };
    const missingElements = [];
    const dominantElements = [];

    ['木', '火', '土', '金', '水'].forEach(elem => {
        const count = fiveElements.counts?.[elem] || 0;
        const pct = fiveElements.percentages?.[elem] || 0;
        if (count === 0) missingElements.push(elem);
        if (pct >= 35) dominantElements.push(elem);
    });

    // 4. 裝配專屬生活開運法 (Lifestyle Remedies)
    const remedies = missingElements.map(elem => REMEDIES_TABLE[elem]).filter(Boolean);
    // 若無缺失五行，則取喜用神五行之開運法
    const primaryRemedy = remedies[0] || REMEDIES_TABLE[baziData.strengthAnalysis?.usefulGod?.match(/[木火土金水]/)?.[0] || '木'];

    // 5. 韓系四柱宮位論映射
    const palaceBreakdown = GUNGWI_PILLARS.map((p, idx) => {
        const pillar = baziData.fourPillars[idx];
        return {
            ...p,
            pillarValue: pillar?.value || '—',
            stem: pillar?.stem || '—',
            branch: pillar?.branch || '—',
            tenGod: pillar?.tenGod || '—',
            changsheng: pillar?.changsheng || '—',
            nayin: pillar?.nayin || '—'
        };
    });

    // 6. 精選韓系焦點神煞 (귀인, 도화, 역마, 화개, 백호, 괴강, 원진)
    const allShensha = baziData.shensha || [];
    const highlightedShensha = allShensha.filter(s => {
        const name = s.name || '';
        return name.includes('天乙') || name.includes('文昌') || name.includes('桃花') ||
               name.includes('驛馬') || name.includes('華蓋') || name.includes('白虎') ||
               name.includes('魁罡') || name.includes('羊刃') || name.includes('怨嗔') ||
               name.includes('元辰');
    });

    return {
        ...baziData,
        mode: 'saju',
        profile: {
            ...(baziData.profile || {}),
            mode: 'saju'
        },
        koreanSaju: {
            title: '韓式現代四柱 (K-Saju · 18장 평생사주)',
            tagline: '正統萬歲曆與真太陽時驅動 · 東方 MBTI 靈魂原型與 18 章平生指南',
            archetype: {
                stem: dayMasterStem,
                ...archetype
            },
            energyMeter,
            fiveElementsBalance: {
                distribution: fiveElements,
                missingElements,
                dominantElements,
                primaryRemedy,
                allRemedies: remedies
            },
            palaceBreakdown,
            highlightedShensha,
            chapters: SAJU_18_CHAPTERS
        }
    };
}

module.exports = {
    calculateKoreanSaju,
    ILGAN_ARCHETYPES,
    REMEDIES_TABLE,
    GUNGWI_PILLARS,
    SAJU_18_CHAPTERS,
    calculateSingangScore
};
