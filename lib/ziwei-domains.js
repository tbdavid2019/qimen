'use strict';

/**
 * 紫微斗數 13 大主題深度論斷分析引擎 (Ziwei 13-Domain Deep-Dive Analysis Engine)
 *
 * 涵蓋全盤完整 13 大維度：
 * 1. 命格總覽 (overview)
 * 2. 性格特質 (personality - 命宮)
 * 3. 感情婚姻 (love - 夫妻宮)
 * 4. 事業職業 (career - 官祿宮)
 * 5. 財富運勢 (wealth - 財帛宮)
 * 6. 健康狀況 (health - 疾厄宮)
 * 7. 兄弟合夥 (family - 兄弟宮)
 * 8. 子女緣分 (children - 子女宮)
 * 9. 遷移外出 (move - 遷移宮)
 * 10. 人際貴人 (friends - 僕役/交友宮)
 * 11. 田宅不動產 (home - 田宅宮)
 * 12. 精神福德 (spirit - 福德宮)
 * 13. 父母長輩 (parents - 父母宮)
 *
 * 演算法來源與溯源依據：
 * - 參考與移植開源專案 https://github.com/Renhuai123/ziwei-doushu (MIT License) 之 db-analysis / knowledge / InsightPanel 體系
 * - 依據經典古籍《紫微斗數全書》、《骨髓賦》、《太微賦》三合派正統口徑
 * - 融合倪海廈《天紀》三合派心法：「命宮為本，三方為用，人事努力與地理調整大於先天命運 (2/3 > 1/3)」
 */

const DOMAIN_KEYS = [
    'overview',
    'personality',
    'love',
    'career',
    'wealth',
    'health',
    'family',
    'children',
    'move',
    'friends',
    'home',
    'spirit',
    'parents'
];

const DOMAIN_CONFIG = {
    overview:    { label: '命格總覽', palaceName: '命宮', role: '自我、格局、一生總綱', icon: '🔮' },
    personality: { label: '性格特質', palaceName: '命宮', role: '內在秉性、處事風格、心理盲區', icon: '🧠' },
    love:        { label: '感情婚姻', palaceName: '夫妻宮', role: '婚戀緣分、正緣特徵、相處磨合', icon: '💍' },
    career:      { label: '事業職業', palaceName: '官祿宮', role: '職場定位、成就高度、合適行業', icon: '💼' },
    wealth:      { label: '財富運勢', palaceName: '財帛宮', role: '進財管道、理財方式、財庫得失', icon: '💰' },
    health:      { label: '健康狀況', palaceName: '疾厄宮', role: '體質強弱、五臟對應、預防養生', icon: '🌿' },
    family:      { label: '兄弟合夥', palaceName: '兄弟宮', role: '手足情誼、合夥做生意、借貸宜忌', icon: '🤝' },
    children:    { label: '子女緣分', palaceName: '子女宮', role: '後代福緣、屬下關係、親職溝通', icon: '👶' },
    move:        { label: '遷移外出', palaceName: '遷移宮', role: '外地發展、外出機遇、差旅環境', icon: '✈️' },
    friends:     { label: '人際貴人', palaceName: '僕役宮', role: '朋友圈層、貴人相助、小人防範', icon: '👥' },
    home:        { label: '田宅不動產', palaceName: '田宅宮', role: '不動產購置、家運基石、居家風水', icon: '🏡' },
    spirit:      { label: '精神福德', palaceName: '福德宮', role: '精神享受、心靈修為、晚年福份', icon: '🧘' },
    parents:     { label: '父母長輩', palaceName: '父母宮', role: '長輩庇蔭、上司關係、文書功名', icon: '📜' }
};

// 14 主星在各宮位的專業星情解讀庫
const STAR_PALACE_READINGS = {
    紫微: {
        nature: '帝座之星，五行屬己土，主尊貴、包容、威嚴、領導與掌控力。',
        palaces: {
            命宮: '天生帶有大將之風與領導氣質，重榮譽、愛體面，行事穩重有度，唯自尊心強烈，宜修謙遜以聚人心。',
            夫妻宮: '配偶氣度端正、能力出眾，多有獨立事業；感情中重視互相尊重，宜避免因強勢而產生對立。',
            官祿宮: '事業心極強，具備統籌全局之才能，適合從事高管、公職、大企業或自主創業，成就卓著。',
            財帛宮: '財源光明正大，善於從大型機構、品牌經營或高階管理中取財，正財豐隆，不喜投機冒險。',
            疾厄宮: '五行屬土，主脾胃、消化道與胸悶氣鬱；易因思慮過度或公事繁重引發自律神經與腸胃不適。',
            兄弟宮: '兄弟姊妹多有才幹自立，各自成器；相處時宜保持平等尊重，避免過度干涉彼此決策。',
            子女宮: '子女資質秀拔、聰穎好強，具備領袖天賦；管教方式宜採民主引導，忌高壓責備。',
            遷移宮: '出外多得貴人尊崇，在外發展場面宏大，易受長輩與主流社會肯定，外向發展吉利。',
            僕役宮: '部屬與合作者多能力出眾或有傲氣，需以德服人、建立完善制度，方能充分調動其長才。',
            田宅宮: '家境殷實穩固，能自置高檔不動產，居家環境注重氣派與品味，家庭根基深厚。',
            福德宮: '精神層次高雅，重尊嚴與心靈富足，凡事追求高品質生活，晚年福壽雙全、受人敬仰。',
            父母宮: '父母威嚴有威望，管教端正嚴格，深得長輩庇蔭與家族榮譽指引，長輩緣分良好。'
        }
    },
    天機: {
        nature: '南斗善星，五行屬乙木，主智慧、謀略、善變、企劃與神經系統。',
        palaces: {
            命宮: '心智靈活反應極快，善於分析策劃，好學多能，思慮縝密；唯心思過重時容易猶豫不決。',
            夫妻宮: '伴侶聰慧敏銳、知性好學，多屬同學、同事或志趣相投之同儕型關係；宜加強情感交流少講大道理。',
            官祿宮: '適合智慧財與腦力激盪之工作，如企劃、研發、顧問、學術、軟體資訊或專業技術，變動中見機遇。',
            財帛宮: '求財憑藉智力、技術與創意，財來財去流動性強，宜將流動資金轉為穩健資產以保財庫。',
            疾厄宮: '五行屬木，主神經衰弱、失眠多夢、肝膽虛火與下肢筋骨；宜注重日常睡眠與心靈沉澱。',
            兄弟宮: '兄弟多聰明多才，各自奔忙於專業領域，感情熱絡，常有知識與觀念之切磋交換。',
            子女宮: '子女好動聰明、學習力極快、好奇心旺盛；親職教育宜重實作與引導定性，因材施教。',
            遷移宮: '愈動愈發，出外求變求新皆能應對自如，適合差旅、海外留學或外地開闢市場。',
            僕役宮: '下屬多智囊型人才，善出謀劃策；唯人員流動較快，宜以彈性專案機制協同合作。',
            田宅宮: '居家多變更遷徙或喜經常調整擺設，住宅多鄰近交通便利之都市樞紐，不動產流動性高。',
            福德宮: '腦筋終日不停運轉，好探討哲學、宗教與命理玄學，精神生活豐富但需防思慮耗神。',
            父母宮: '與父母溝通管道順暢，長輩善於說理引導，思想交流頻繁，受家庭知性氛圍熏陶深。'
        }
    },
    太陽: {
        nature: '中天主星，五行屬丙火，主光明、博愛、事業、貴氣、散發與公眾聲望。',
        palaces: {
            命宮: '心胸寬廣、熱情直爽、光明磊落，具備強烈責任感與奉獻心；女命常代夫持家，男命具領袖擔當。',
            夫妻宮: '配偶熱心開朗、外向能幹，有事業抱負；夫妻相處宜各展所長，相敬相伴。',
            官祿宮: '聲譽遠揚，宜政界、大眾傳媒、文教、司法、外交或公眾福利機構，以名望帶動成就。',
            財帛宮: '由名得利，財富多來自大眾與公眾事業；開銷大方善施濟人，宜建立定期定額理財紀律。',
            疾厄宮: '五行屬火，主血壓、心血管系統、視力眼疾與頭部眩暈；宜維持心平氣和防急躁上火。',
            兄弟宮: '手足豪爽熱情，相處融洽互助；但因彼此皆有主見，合夥經營宜公私分明。',
            子女宮: '子女個性開朗外向、積極進取、富有公德心；長大後能自立自強、揚名立家。',
            遷移宮: '出外得眾人愛戴，聲名在外，善於廣結善緣，適合到遠方開闢新版圖。',
            僕役宮: '交友遍天下，對朋友兩肋插刀；需防被少數宵小藉名行私，宜保留防人之心。',
            田宅宮: '居家採光充足、通風開朗，家門常客盈門，祖業守成易有光彩，住家環境宜向陽。',
            福德宮: '為人樂觀熱情、好抱不平，精神生活充實開闊，樂於助人為快樂之本，心胸豁達。',
            父母宮: '父愛厚重如山，父親個性剛毅具威信，與長輩相處光明正大，深受家庭正道家風影響。'
        }
    },
    武曲: {
        nature: '北斗正財星，五行屬辛金，主剛毅、果斷、果決、金融、實業與務實開創。',
        palaces: {
            命宮: '性格堅毅不拔、處事果斷俐落、言出必行，重視效率與信用，帶有一夫當關之氣魄。',
            夫妻宮: '配偶精明務實、行事幹練；情感表達較少甜言蜜語多見實質行動，宜共同規劃財務穩固基礎。',
            官祿宮: '適合金融證券、會計審計、國防軍工、五金實業或製造開發，事業作風雷厲風行。',
            財帛宮: '正財星入財帛宮為得地大吉！求財手段高明、擅長資產運作與滾動利潤，實業致富根基深。',
            疾厄宮: '五行屬金，主呼吸系統、肺氣管、大腸消化與骨骼關節；換季時節宜防過敏咳喘。',
            兄弟宮: '手足各自獨立經商或打拼，彼此講究契約誠信，借貸合夥宜立白紙黑字以免傷和氣。',
            子女宮: '子女個性剛強有主見、執行力強，早熟自立；親職引導宜重柔和傾聽，少用強硬命令。',
            遷移宮: '出外果敢開創、商業嗅覺敏銳，能把握遠地市場脈動獲取厚利，外出利於求財。',
            僕役宮: '下屬多實幹型能手，團隊講究績效與數據，行事重規矩，以實際利益與發展願景凝聚人心。',
            田宅宮: '真正之積富大庫！善於置辦商用不動產與優質資產，守財聚庫能力極強。',
            福德宮: '終日奔波於實業與責任，重物質成就感；宜培養文雅休閒，適度放空釋放神經緊繃。',
            父母宮: '父母行事剛烈原則分明，培育子女重視實作能力與吃苦耐勞精神，家教嚴肅務實。'
        }
    },
    天同: {
        nature: '南斗福星，五行屬壬水，主溫和、享樂、協調、知足、善緣與白手起家。',
        palaces: {
            命宮: '溫文儒雅、性情和善、親和力極高，處事講究人情味，知足常樂，深具化解紛爭之福澤。',
            夫妻宮: '感情世界溫馨浪漫，配偶性格溫柔體貼、富有人情味，生活充滿小確幸，宜同甘共苦。',
            官祿宮: '宜生活服務、休閒觀光、餐飲娛樂、公關協調、社工文化等重視柔性互動之事業。',
            財帛宮: '白手起家，財源細水長流，多得貴人平順相助，求財不宜急躁投機，厚積方能薄發。',
            疾厄宮: '五行屬水，主膀胱、泌尿生殖系統、水腫代謝與耳部；平時宜多飲溫水維持排毒通暢。',
            兄弟宮: '兄弟姊妹和睦友善，手足之情甚密，互通有無，遭遇困難多能溫馨扶持。',
            子女宮: '子女乖巧貼心、性情柔順，與父母無代溝，注重家庭親情，孝順父母。',
            遷移宮: '出外廣結善緣、人見人愛，在外適應力極佳，常能化險為夷、受異鄉人熱情接待。',
            僕役宮: '團隊氣氛和樂，朋友多仁厚之輩，合作少勾心鬥角，得部屬忠心愛護。',
            田宅宮: '家庭氣氛溫暖祥和，住家環境清雅舒適，能自購安樂之居，重居住生活品質。',
            福德宮: '福星入福德為正位！內心祥和安寧、懂得享受生活，精神少焦慮，晚運悠遊長壽。',
            父母宮: '父母慈祥仁厚，家庭呵護有加，家庭教育溫柔包容，深蒙父母深情滋養。'
        }
    },
    廉貞: {
        nature: '北斗次桃花星，五行屬丁火、陰土，主次桃花、公職、科技、自律、開創與狂熱。',
        palaces: {
            命宮: '性格鮮明有個性、自律極嚴，深具開拓熱忱與藝術美感，愛憎分明，行事兼具衝勁與戒律。',
            夫妻宮: '伴侶有強烈個人魅力與藝術氣質，感情熾熱；相處重在坦誠相見，切忌隱瞞猜忌。',
            官祿宮: '適合尖端科技、公職法制、精密工程、藝術創意或管理督導，能破除舊規開拓創新。',
            財帛宮: '競爭中取財，憑專業技術、智慧專利或新興市場獲利，忌鋌而走險與不良嗜好。',
            疾厄宮: '五行屬火土，主心火亢盛、血液循環、過敏皮膚與失眠浮躁；宜清心降火、規律作息。',
            兄弟宮: '手足各具風格專長，相處宜互相留有邊界與空間，互相欣賞而不相互綑綁。',
            子女宮: '子女富個性與才華，創造力突出；引導時需耐心溝通，避免剛性壓制激起逆反心。',
            遷移宮: '出外展現強烈個人風格，善於開拓陌生人脈，外地開拓往往能獨樹一幟。',
            僕役宮: '朋友交往重氣節與品味，能得具備獨特才華之夥伴共事，管理宜注重激勵與榮譽感。',
            田宅宮: '家運先破後立，自置新居注重前衛格調與設計感，能把住宅打理得極富個性。',
            福德宮: '精神追求執著深刻，對美學與理想有極高標準，宜透過藝術創作或沉潛修身調節心力。',
            父母宮: '父母管教嚴正有原則，家庭規矩森嚴，早年受長輩嚴格歷練，奠定日後自立基石。'
        }
    },
    天府: {
        nature: '南斗令星兼庫星，五行屬戊土，主穩重、保守、善守、厚道、統籌與財富蓄積。',
        palaces: {
            命宮: '雍容大度、穩重踏實，有包容四海之度量，行事謹慎周密，不喜冒險，善於守成與治理。',
            夫妻宮: '配偶溫厚賢淑、顧家持家，能成為內在穩定支柱；夫妻相伴相守，感情穩定持久。',
            官祿宮: '事業根基極穩，適合大型機構、銀行金融、行政運營、企劃治理，成就細水長流。',
            財帛宮: '財庫豐厚，善於資產配置與穩健積蓄，財源源遠流長，為一生衣食無憂之徵兆。',
            疾厄宮: '五行屬土，主脾胃消化、胃酸胃脹與體態豐腴；平時飲食宜清淡，防脾濕積滯。',
            兄弟宮: '兄弟手足有成，彼此感情淳厚，家族互信互助，常成事業與生活之重要支撐。',
            子女宮: '子女敦厚孝悌、品行端莊，長大後多成家立業守成有加，承繼家業良好。',
            遷移宮: '出外受人敬重，在外發展走穩健路線，常受大機構或德高望重之士庇護照拂。',
            僕役宮: '部屬穩定忠誠，團隊凝聚力高，得力助手多能長期跟隨，治理講求信義恩澤。',
            田宅宮: '田產大吉之位！祖業興隆、自置物業寬宏，能守成大筆房產，是真正之聚寶盆。',
            福德宮: '精神世界開朗大度，物質與精神雙豐收，少有內耗，晚年福祿雙全、安祥康樂。',
            父母宮: '父母德高望重、家底殷實，深受長輩慈愛呵護，家族名聲與資源傳承綿長。'
        }
    },
    太陰: {
        nature: '中天月曜，五行屬癸水，主柔順、細膩、清秀、不動產、財星與母性慈暉。',
        palaces: {
            命宮: '清秀溫柔、心思細膩敏銳、具藝術審美情趣，處事柔和有包容心，善於守財與守護。',
            夫妻宮: '男命得賢慧溫柔、美貌知心之妻；女命得細膩體貼、有文雅品味之夫，相敬如賓。',
            官祿宮: '宜房地產、金融資產、設計藝術、企劃文案、美容精品、心理諮商等精緻行業。',
            財帛宮: '財星入位！求財細水長流，善於積累儲蓄與置產收租，不喜暴起暴落之險財。',
            疾厄宮: '五行屬水，主內分泌、淋巴水飲、下焦寒濕與失眠多夢；宜保暖通陽、調暢情志。',
            兄弟宮: '姊妹緣分深厚，手足間細膩體貼，互相傾聽關懷，情感連結密不可分。',
            子女宮: '女兒緣分特別好，子女文雅清秀、多才多藝，注重親情交流，孝順父母。',
            遷移宮: '出外多得女性貴人相助，外在形象典雅親切，出外生活適應順遂，喜寧靜環境。',
            僕役宮: '朋友多細心知己，部屬多勤懇耐勞之士，團隊合作默契十足，少有暴烈衝突。',
            田宅宮: '太陰為田宅正曜！大吉大利，善於購置美觀之優質物業，家宅雅緻溫馨、家富宅安。',
            福德宮: '內心寧靜深邃，享受清幽雅致之精神生活，喜音樂文學美學，晚年福泰安康。',
            父母宮: '母愛深厚無私，深受母親或女性長輩疼愛指引，家庭關係溫情洋溢。'
        }
    },
    貪狼: {
        nature: '北斗第一星兼桃花星，五行屬甲木、癸水，主慾望、交際、多才多藝、長袖善舞。',
        palaces: {
            命宮: '聰敏靈活、才藝廣博、幽默風趣、極富魅力，慾望強烈且具開拓進取心，善於經營人際。',
            夫妻宮: '感情世界多姿多彩，配偶深具異性緣與才藝；宜晚婚或共同培育愛好以穩固情緣。',
            官祿宮: '宜公關傳播、外貿經商、演藝文娛、餐飲休閒、行銷策劃等需要強大交際力之領域。',
            財帛宮: '八方進財，擅抓商機，偏財運較旺；宜建立止盈機制，防因應酬揮霍流失財庫。',
            疾厄宮: '五行屬木水，主肝膽代謝、泌尿系統、生殖荷爾蒙與神經痛；作息需節制煙酒。',
            兄弟宮: '兄弟多才華橫溢、各有所好，相處氣氛輕鬆活躍，共同享受生活。',
            子女宮: '子女活潑好動、早慧機靈、社交力強；親職教育重在建立道德界線與規律日常。',
            遷移宮: '出外如魚得水，善於在各類場合廣結善緣，出外機遇遠勝於閉門造車。',
            僕役宮: '交友廣闊，三教九流無所不包；合作宜擇善而從，建立明確界線方能長久。',
            田宅宮: '居家注重氛圍情調與娛樂設施，物業換置較頻繁，善於透過房產流通取得收益。',
            福德宮: '好勝心與好奇心旺盛，熱愛嘗試新事物，晚年宜修養身心、寄情山水藝術以安神。',
            父母宮: '與父母相處開放如友，家庭思想前衛寬鬆，長輩多尊重其自由發展方向。'
        }
    },
    巨門: {
        nature: '北斗暗星，五行屬癸水、辛金，主口才、是非、深入鑽研、求真分析與專業權柄。',
        palaces: {
            命宮: '觀察入微、心思縝密、善於思辨、口才犀利，具備極強之研究與追根究底之精神。',
            夫妻宮: '配偶口齒伶俐、有主見愛辯論；感情中宜多讚美少挑剔，以理性溝通取代針鋒相對。',
            官祿宮: '適合以口才或專業技術謀生，如律師、教師、研究員、分析師、公關發言人、研發。',
            財帛宮: '憑嘴巴、專業技術或智慧專利求財，競爭中得利，求財宜實事求是防合同糾紛。',
            疾厄宮: '五行屬水金，主呼吸系統、食道咽喉、胃腸發炎與牙齒；多注意飲食衛生與口腔保健。',
            兄弟宮: '手足間直言不諱，相處時宜注意說話語氣，坦誠相待以避免無謂言語猜忌。',
            子女宮: '子女思維敏銳好辯，具備辯才潛力；宜多給予發言舞台，鼓勵其深入專業鑽研。',
            遷移宮: '出外憑真才實學與卓越溝通服人，適合到外地發表學術、授課或開展專業諮詢。',
            僕役宮: '朋友多智慧求真之人，交往重理念一致；防小人口角是非，宜嚴謹防範契約陷阱。',
            田宅宮: '家宅環境宜寧靜開闊，居家防與鄰里口角，產權文件過戶宜審慎校驗條款。',
            福德宮: '心思極重、防備心較強，易自尋煩惱；宜培養大度胸襟，學會凡事放鬆寬容。',
            父母宮: '父母行事認真嚴謹，時有直白說教；彼此理解出發點為愛，宜多作實質回報溝通。'
        }
    },
    天相: {
        nature: '南斗印星，五行屬壬水，主誠信、中正、協調、幕僚、儀態得體與正義感。',
        palaces: {
            命宮: '儀表端莊大方、重諾守信、為人熱心公道，善於協調糾紛，具備極高之幕僚統御才能。',
            夫妻宮: '配偶容貌端正、重禮貌重家庭，行事得體大方；婚姻相敬相助，家庭生活和順。',
            官祿宮: '宜高級幕僚、行政秘書、法務稽核、企劃管理、公關外交，執行力極佳深受倚重。',
            財帛宮: '財源平穩端正，多由正職薪酬、分紅、管理酬金而來，理財穩健講求透明合規。',
            疾厄宮: '五行屬水，主皮膚過敏、膀胱排尿、腎水循環；平時宜注重保濕與正常飲水排毒。',
            兄弟宮: '兄弟講求信義和睦，相處互敬互讓，手足在各自事業上多能守望相助。',
            子女宮: '子女品格端正、彬彬有禮、遵守家規，人見人愛，長大後多成社會中堅力量。',
            遷移宮: '出外深受各方信賴，外在形象大方正派，能順暢搭建跨界橋樑，外出吉星高照。',
            僕役宮: '得忠厚得力之部屬協助，朋友圈多正人君子，以信義立身聚攏忠誠夥伴。',
            田宅宮: '田產平穩置辦，住宅裝潢整潔優雅、風格端莊，鄰里關係融洽和善。',
            福德宮: '內心追求正義與秩序，精神安定不求非分，知書達禮，一生心靈踏實平靜。',
            父母宮: '父母正派體面、行事規矩，言傳身教深刻影響命主為人處世，家風端正。'
        }
    },
    天梁: {
        nature: '南斗蔭星兼老人星，五行屬戊土，主慈蔭、成熟、逢凶化吉、原則清高、醫藥法律。',
        palaces: {
            命宮: '老成持重、慈悲護幼、具長者之仁慈風範，原則性極強，遇難常能逢凶化吉呈祥。',
            夫妻宮: '伴侶多成熟穩健或心智年齡大於自己，深具責任感與照顧心；感情先磨合而後彌堅。',
            官祿宮: '宜醫藥衛生、法律司法、教育學術、監督審計、社會公益等講求良心與清譽之業。',
            財帛宮: '求財光明正大、不重橫財與非分之想，多由專業聲望與福報累積而來，財庫安穩。',
            疾厄宮: '五行屬土，主脾胃運化不足、胸脅氣悶、關節退化；平時宜注意保暖活血養生。',
            兄弟宮: '兄弟長幼有序，長者能照料弟妹，手足相處有禮節，遭遇考驗能攜手克服。',
            子女宮: '子女懂事孝順、早熟有禮，具備自主管理能力，未來能榮耀門楣、回饋家庭。',
            遷移宮: '出外常蒙長輩或權威人士提攜照料，出門在外逢險必化，善於化解外部突發難關。',
            僕役宮: '得年長經驗豐富之智囊扶持，部屬敬重服從，人際網絡重長遠情義。',
            田宅宮: '有承繼祖業或長輩贈產之福，住宅環境清幽端莊，利於家族長久安居。',
            福德宮: '福德之大吉星！樂善好施、精神高遠超脫，對名利淡泊豁達，晚年安詳康寧長壽。',
            父母宮: '父母慈愛福壽、長壽安泰，給予命主深厚無私之精神滋養，家族福澤深廣。'
        }
    },
    七殺: {
        nature: '南斗將星，五行屬辛金、丙火，主剛烈、殺伐、開創、衝鋒陷陣、大將之風。',
        palaces: {
            命宮: '剛毅果烈、獨當一面、勇往直前、膽略過人，不懼艱險，深具拓荒者之大氣魄。',
            夫妻宮: '配偶個性剛烈強悍、有極強主見；相處宜各自保留獨立空間，避免硬碰硬正面衝突。',
            官祿宮: '宜軍警國防、重工製造、外科醫療、高危攻堅、開創型企業主，能於逆境創奇蹟。',
            財帛宮: '敢於冒險求財，財運起伏較大，宜在開拓市場競爭中奪魁獲利，忌不計風險之孤注一擲。',
            疾厄宮: '五行屬金火，主外傷骨折、呼吸道急症、大腸發炎；平時行動交通宜穩重防意外。',
            兄弟宮: '手足各自獨立開創前程，相處少有依賴，在各自領域各顯神通。',
            子女宮: '子女個性倔強剛烈、行動力驚人；引導宜重體能鍛鍊與規則意識，啟發其領導才幹。',
            遷移宮: '出外大展鴻圖，適合遠方拓荒開闢全新戰場，外地機遇遠大於安逸守舊。',
            僕役宮: '部屬多猛將勇卒，團隊衝擊力極強；管理宜賞罰分明、令行禁止，建立鐵律。',
            田宅宮: '田產自立開拓，先破後成，能靠自身鋼鐵毅力購置全新家業，不依賴祖蔭。',
            福德宮: '性格勞碌不甘平凡，終日思考破局之道，精神緊繃；宜培養靜心定性之修持以固本。',
            父母宮: '長輩教養威嚴剛烈，早期鍛鍊其獨立意志，奠定日後堅忍不拔之生存能力。'
        }
    },
    破軍: {
        nature: '北斗耗星，五行屬癸水、辛金，主先破後成、變革、冒險、顛覆傳統、破舊立新。',
        palaces: {
            命宮: '勇於創新變革、不守舊規、果敢衝鋒，喜打破僵局開闢新局面，人生往往先破後立。',
            夫妻宮: '婚戀觀前衛自由，婚姻關係重在共同成長與新鮮感，相處宜尊重彼此獨立界線。',
            官祿宮: '適合新創科技、產業重構、改造工程、特殊技術、新興自媒體等顛覆性事業。',
            財帛宮: '大進大出，財運呈現浪潮起伏，宜在變革中把握翻盤機會，忌過度加槓桿投機。',
            疾厄宮: '五行屬水金，主腎水虧損、生殖泌尿、足部下肢外傷；平時宜防過勞傷精。',
            兄弟宮: '手足天各一方各自闖蕩，彼此各自獨立自主，互不干涉個人生活路線。',
            子女宮: '子女思維天馬行空、富有前衛創造力；親職引導宜包容其奇思妙想，給予試錯空間。',
            遷移宮: '出外多奇遇大變革，遠洋外邦反能激發全盤潛能，出外開拓勝過原地守舊。',
            僕役宮: '夥伴朋友更替較為頻繁，善於在變革中凝聚短期攻堅團隊，專案結束各奔前程。',
            田宅宮: '家宅常變動或拆遷改造，居家風格前衛多變，能靠自我打拼購置新潮物業。',
            福德宮: '內在不甘安逸，熱愛挑戰自我極限，精神世界跌宕起伏，宜透過身心覺察平衡心靈。',
            父母宮: '家庭環境多變革變遷，自幼培養出極強之獨立適應力，成長路線完全由自我主導。'
        }
    }
};

// 輔煞星在各宮位之作用修正語句
const AUX_INFLUENCES = {
    祿存: '得祿存加會，增添實質厚利與守財保障，能穩住陣腳化解凶煞。',
    天馬: '逢天馬催動，奔波走動頻繁，多在動態奔忙、出差遠行中尋得良機。',
    左輔: '得左輔照拂，助力深厚、貴人扶持，遇事有人分擔協作。',
    右弼: '得右弼加臨，多方策應、化解孤立，善於在溝通協調中成事。',
    天魁: '天魁陽貴人照臨，關鍵時刻常有長者、上司或政策直接明助。',
    天鉞: '天鉞陰貴人照拂，暗中得人搭橋牽線，潛移默化中逢凶化吉。',
    文昌: '文昌入宮，氣質文雅、利於功名文憑、文字合約與名譽提升。',
    文曲: '文曲入宮，才藝出眾、口才靈巧，利於文化傳播與人際吸引力。',
    擎羊: '帶擎羊剛烈之氣，做事衝勁十足但需防急躁衝動與硬性衝突。',
    陀羅: '帶陀羅暗滯之氣，進展多有拖延磨難，需具備持久耐心抗壓。',
    火星: '逢火星突發之勢，成事極快但脾氣急躁，需防暴起暴落。',
    鈴星: '逢鈴星暗火內灼，心思細密善謀略，需防內在焦慮積鬱。',
    地空: '逢地空空靈之氣，思維天馬行空不受束縛，利於哲思，物質需防損耗。',
    地劫: '逢地劫波動之氣，起伏較大，宜將精力專注於精神修養與專業深耕。'
};

// 生年四化在宮位之催化意義
const SIHUA_IN_PALACE = {
    祿: '【化祿】注入豐厚之緣分、財祿與生機，多得喜悅享受，做事順手。',
    權: '【化權】強化主導掌控與開拓企圖心，具備權柄與實權，利於爭取成果。',
    科: '【化科】帶來文雅名望、名聲清譽與貴人調停，利於考試考評與名望建立。',
    忌: '【化忌】形成心力凝聚之執念與考驗點，需付出額外磨練，是人生重要功課所在。'
};

// 正統古籍典籍引用金句庫
const CLASSICAL_QUOTES = {
    overview: '《紫微斗數全書》云：「命好身好限好，到老榮昌；命衰身衰限衰，一生貧賤。」命身為本，行運為舟，明道立心方能破局。',
    personality: '《太微賦》云：「善星多而惡星少，乃福壽之客；惡星聚而吉星疏，為奔波之人。」星性本無絕對吉凶，全在心性之駕馭。',
    love: '《骨髓賦》云：「夫妻宮吉星拱照，夫貴妻榮；煞星同度，多有齟齬。」相處之道在於以敬以和，先修己身後求佳偶。',
    career: '《太微賦》云：「官祿吉星照耀，文武雙全；若逢權貴，早遂青雲之志。」職場所在，在於專精一技以順應命盤格局。',
    wealth: '《紫微斗數全書》云：「財帛宮主星得地，源遠流長；庫存豐實，積金堆玉。」富不由求，乃德之聚也。',
    health: '《天紀》倪海廈先生云：「人事努力與地理合參，內調五臟外避邪風，疾厄宮乃知身命防患之先兆。」防病於未然。',
    family: '《骨髓賦》云：「兄弟同心，其利斷金；吉曜相扶，手足情深。」合作講求公義契約，方能長治久安。',
    children: '《紫微斗數全書》云：「子女宮吉星來會，麟兒鳳女，光耀門楣。」養兒在德，親職教育在於春風化雨。',
    move: '《太微賦》云：「遷移吉照，動中得福；出外如龍入海，任我騰躍。」天地廣闊，善用外出貴人氣象。',
    friends: '《骨髓賦》云：「僕役得力，眾擎易舉；若逢凶背，防奴欺主。」交友重在同道同德，以制度統御。',
    home: '《紫微斗數全書》云：「田宅為百福之基，財庫之歸宿。」家風端正，屋宅安泰，則全盤皆有所依。',
    spirit: '《太微賦》云：「福德清安，怡然自樂；福薄性燥，徒惹塵埃。」心安即是歸宿，厚德方能載物。',
    parents: '《骨髓賦》云：「父母宮吉照，祖蔭綿長，孝順仁愛，天賜純嘏。」百善孝為先，感恩長輩則福基穩固。'
};

function findPalace(chart, name) {
    if (!chart || !chart.palaces) return null;
    const cleanName = name.replace('宮', '');
    return chart.palaces.find((p) => p.name === name || p.name === cleanName || (name === '命宮' && p.isMing)) || null;
}

function getMajorStars(palace) {
    if (!palace || !palace.stars) return [];
    return palace.stars.filter((s) => s.type === 'major' || !s.type || STAR_PALACE_READINGS[s.name]);
}

/**
 * 針對空宮借對宮主星之判定
 */
function resolvePalaceStars(chart, palace) {
    if (!palace) return { major: [], isBorrowed: false, sourcePalaceName: '' };
    const major = getMajorStars(palace);
    if (major.length > 0) {
        return { major, isBorrowed: false, sourcePalaceName: palace.name };
    }
    // 空宮：借對宮
    const oppBranch = palace.aspects?.opposite;
    const oppPalace = chart.palaces.find((p) => p.branch === oppBranch);
    const oppMajor = oppPalace ? getMajorStars(oppPalace) : [];
    return {
        major: oppMajor,
        isBorrowed: true,
        sourcePalaceName: oppPalace ? oppPalace.name : ''
    };
}

/**
 * 組合主星與副星之深度論斷文本
 */
function composePalaceReading(topicKey, palaceName, starsResolved, palace, chart) {
    const { major, isBorrowed, sourcePalaceName } = starsResolved;
    const starNames = major.map((s) => s.name);
    const auxStars = (palace?.stars || []).filter((s) => s.type !== 'major' && s.name !== '天喜' && s.name !== '紅鸞');
    const sihuaStars = (palace?.stars || []).filter((s) => s.sihua);
    const shensha = palace?.shensha || {};

    let readingParagraphs = [];

    // 1. 主星解析
    if (!major.length) {
        readingParagraphs.push(`此宮為罕見之純陰純陽借位之局，宮內無十四主星坐守，氣息靈動虛空，受對宮【${sourcePalaceName || '對宮'}】及外在環境催化影響最為劇烈，宜隨機應變、靈活處事。`);
    } else {
        const starDescriptions = major.map((star) => {
            const starData = STAR_PALACE_READINGS[star.name];
            if (!starData) return `【${star.name}】（${star.brightness || '旺'}）坐守此宮，發揮其固有本星氣象。`;
            const palaceText = starData.palaces[palaceName] || starData.palaces.命宮 || '';
            const borrowNote = isBorrowed ? `（借對宮${sourcePalaceName}星力）` : '';
            return `【${star.name}】（${star.brightness || '旺'}）${borrowNote}：${starData.nature}在此宮位之具體呈現為：${palaceText}`;
        });
        readingParagraphs.push(starDescriptions.join('\n\n'));
    }

    // 2. 六吉六煞輔星加會
    const auxComments = auxStars.map((s) => AUX_INFLUENCES[s.name]).filter(Boolean);
    if (auxComments.length > 0) {
        readingParagraphs.push(`【吉煞會聚格局】本宮輔星會合呈現：${auxComments.join(' ')}`);
    }

    // 3. 四化催發
    const sihuaComments = sihuaStars.map((s) => {
        const hint = SIHUA_IN_PALACE[s.sihua];
        return hint ? `${s.name}${hint}` : null;
    }).filter(Boolean);
    if (sihuaComments.length > 0) {
        readingParagraphs.push(`【生年四化催發】${sihuaComments.join(' ')}`);
    }

    // 4. 十二神煞氣象
    if (shensha.jiangQian || shensha.suiQian || shensha.boshi) {
        readingParagraphs.push(`【神煞輔照】歲前【${shensha.suiQian || ''}】、將前【${shensha.jiangQian || ''}】、博士【${shensha.boshi || ''}】交會於此，增添行運之氣數基底。`);
    }

    return readingParagraphs.join('\n\n');
}

/**
 * 產生三方四正與大限聯動分析
 */
function composeSanfangAnalysis(palace, chart, topicKey) {
    if (!palace || !palace.aspects) return '宮位三方四正照會和諧，宜綜觀全局。';
    const oppBranch = palace.aspects.opposite;
    const trineBranches = palace.aspects.trine || [];

    const oppPalace = chart.palaces.find((p) => p.branch === oppBranch);
    const trinePalaces = trineBranches.map((b) => chart.palaces.find((p) => p.branch === b)).filter(Boolean);

    const oppStars = oppPalace ? getMajorStars(oppPalace).map((s) => s.name).join('、') || '吉煞輔曜' : '對宮';
    const trineDetails = trinePalaces.map((p) => `【${p.name}】（${getMajorStars(p).map((s) => s.name).join('、') || '吉曜'}）`).join('、');

    let relationContext = '';
    if (topicKey === 'career') {
        relationContext = '事業官祿必與財帛（求財實力）及命宮（核心天賦）三合共鳴，並受遷移宮之對外空間衝照。';
    } else if (topicKey === 'wealth') {
        relationContext = '財帛之源必依託官祿（事業格局）之地位支撐與命宮（心性魄力）之開闔，三方會照決定聚財體量。';
    } else if (topicKey === 'love') {
        relationContext = '夫妻宮直接與官祿宮相對衝照，事業工作之壓力容易直接投射於感情之中；配合福德宮之心靈狀態，共同主導婚姻穩定度。';
    } else if (topicKey === 'health') {
        relationContext = '疾厄宮與父母宮直接對照，先天遺傳基因與後天心理環境密不可分，配合田宅宮之家居風水相輔相成。';
    } else {
        relationContext = '三合為用、對宮為照，宮位間之氣機相互呼應，體現人生全息共鳴。';
    }

    return `對宮【${oppPalace ? oppPalace.name : '對宮'}】（坐守${oppStars}）直面衝照，三合會聚${trineDetails}。${relationContext}`;
}

/**
 * 產生具體理性實踐建議
 */
function composePracticalAdvice(topicKey, starsResolved, palace) {
    const starNames = starsResolved.major.map((s) => s.name);
    const hasSihuaJi = (palace?.stars || []).some((s) => s.sihua === '忌');
    const hasLucky = (palace?.stars || []).some((s) => ['左輔', '右弼', '天魁', '天鉞', '文昌', '文曲', '祿存'].includes(s.name));
    const hasSha = (palace?.stars || []).some((s) => ['擎羊', '陀羅', '火星', '鈴星', '地空', '地劫'].includes(s.name));

    let advice = '';

    switch (topicKey) {
        case 'overview':
            advice = '將命盤視為人生的「天然使用說明書」，知曉自己的天賦偏向與性格盲區。順天應人，在優勢領域深耕建立壁壘，在薄弱宮位設立防護線；命好須勤修，運滯更宜靜心沉澱。';
            break;
        case 'personality':
            advice = '看見即是療癒。察覺自己處事時的慣性反應（如過剛、過敏、猶豫或焦慮），在觸發情緒時建立 3 秒暫停機制，用理性覆蓋衝動，實現從「被性格驅使」到「做性格主人」的轉變。';
            break;
        case 'love':
            advice = hasSihuaJi
                ? '感情宮位逢化忌考驗，切忌將生活或事業上的焦慮全盤投射於伴侶身上。建立定期的無干擾溝通時間，明確彼此界線與期待，用理性對話化解誤會。'
                : '感情相處重在「互為鏡鑑、各自獨立」。不強求伴侶成為完美投射，多以欣賞與分工取代批判，以共同之長期生活目標穩固關係。';
            break;
        case 'career':
            advice = '在職業發展中專注於打造「不可替代的專長」。若主星屬開創型（七殺、破軍、廉貞、貪狼）宜大膽開拓新戰場；若屬穩健型（天府、天相、天梁、紫微）宜深耕組織與治理；若屬智謀型（天機、巨門）宜強化策劃研發。';
            break;
        case 'wealth':
            advice = hasSha
                ? '求財路徑中偶有波動耗損，嚴禁參與高槓桿衝動投機或無抵押借貸。落實「強制儲蓄＋優質資產轉化」策略，厚植現金流底氣。'
                : '財星穩定，宜專注本業積累本金，並搭配長期穩健之資產配置。記住「財富隨功德與專業而至」，利他方能利己。';
            break;
        case 'health':
            advice = '健康是人生的第一槓桿。結合五行生剋規律，生活作息定時、飲食清淡、避免長期熬夜損耗陰陽。定期進行針對性健檢，以養生預防代替事後補救。';
            break;
        case 'family':
            advice = '手足朋友關係宜講究「情義在心、利益分明」。若有合夥經商或借貸事項，務必簽訂清晰契約，切勿因面子隱忍而埋下日後爭端隱患。';
            break;
        case 'children':
            advice = '親職教育重在身教勝於言教。尊重子女之天生個性與獨立意志，多給予探索世界的空間與容錯率，建立朋友般的互信夥伴關係。';
            break;
        case 'move':
            advice = '出外發展與遠行差旅重在「廣結善緣、隨機應變」。到異鄉或陌生環境宜尊重當地規則與文化，提前做好行程備案與安全防範。';
            break;
        case 'friends':
            advice = '建立清晰的人脈過濾網。「近朱者赤，近墨者黑」，多與品格正直、專業互補之良友同行；對消耗心力或缺乏信用之人保持禮貌距離。';
            break;
        case 'home':
            advice = '田宅為安身立命之所。購置物業宜重地段採光與居家通風，居家環境保持整潔明亮以聚吉氣；家庭成員間多營造溫馨包容之避風港氛圍。';
            break;
        case 'spirit':
            advice = '「身安不如心安，屋寬不如心寬」。每天保留 15-30 分鐘與自己獨處對話，透過閱讀、散步、冥想或藝術嗜好沉澱精神雜念，保持身心通透。';
            break;
        case 'parents':
            advice = '父母長輩乃生命之根脈源泉。多以同理心體諒長輩之時代局限，定期問候關心其身心健康；言行孝悌，感恩傳承，福報自然源源不絕。';
            break;
        default:
            advice = '傳統智慧，理性解讀；照見當下，指引行動。';
    }

    return advice;
}

/**
 * 產生一呼一應的核心定調句子
 */
function composeDingdiao(topicKey, starsResolved, palace, chart) {
    const starNames = starsResolved.major.map((s) => s.name);
    const starStr = starNames.length ? starNames.join('、') : '空宮借對宮';
    const cfg = DOMAIN_CONFIG[topicKey] || { label: '專題' };

    switch (topicKey) {
        case 'overview':
            return `【${chart?.bureau || '本命局'}】命坐【${chart?.mingPalaceBranch || '命宮'}】，主星【${starStr}】立極，成${(chart?.patterns || []).map((p) => p.name).slice(0, 2).join('、') || '本命正位'}大局。`;
        case 'personality':
            return `命宮【${starStr}】獨具氣象，內在秉性明晰，行事風格鮮明，是一生立身處世之核心魂魄。`;
        case 'love':
            return `夫妻宮【${starStr}】坐守，情感緣分深邃，正緣特徵鮮明，重視心靈默契與人生目標之相互契合。`;
        case 'career':
            return `官祿宮【${starStr}】鼎立，職場事業方向明確，利於發揮專才打造不可替代之專業地位。`;
        case 'wealth':
            return `財帛宮【${starStr}】生財有道，正偏財路徑明朗，求財善於運籌，財庫蓄積有法可循。`;
        case 'health':
            return `疾厄宮【${starStr}】對應五臟六腑氣化強弱，體質根底清楚，重在順應時節調和身心陰陽。`;
        case 'family':
            return `兄弟宮【${starStr}】照臨，手足同氣連枝，合夥相處講求信義與制度，相輔相成。`;
        case 'children':
            return `子女宮【${starStr}】生生不息，晚輩緣分深厚，親職溝通貴在以德化人、循循善誘。`;
        case 'move':
            return `遷移宮【${starStr}】動中得福，出外空間廣闊，善用遠方機遇與外來貴人拓展格局。`;
        case 'friends':
            return `僕役宮【${starStr}】交遊廣泛，人脈圈層分明，得力助手與知己良友乃事業騰飛之羽翼。`;
        case 'home':
            return `田宅宮【${starStr}】安宅聚庫，不動產根基穩健，家運昌隆乃一生奮鬥之堅實後盾。`;
        case 'spirit':
            return `福德宮【${starStr}】心境通達，精神境界品味高雅，心安理得方享長久富貴悠遊之樂。`;
        case 'parents':
            return `父母宮【${starStr}】恩澤深重，長輩庇蔭與上司緣分良善，尊道重孝能續家族福德綿延。`;
        default:
            return `【${cfg.label}】宮位配置明晰，吉凶互見，端在修為駕馭。`;
    }
}

/**
 * 命格總覽 (overview) 專門合成邏輯
 */
function buildOverviewDomain(chart) {
    const mingPalace = findPalace(chart, '命宮');
    const starsResolved = resolvePalaceStars(chart, mingPalace);
    const starNames = starsResolved.major.map((s) => s.name).join('、') || '借宮星曜';
    const bureau = chart?.bureau || '五行局';
    const mingBranch = chart?.mingPalaceBranch || mingPalace?.branch || '子';
    const shenBranch = chart?.shenPalaceBranch || '午';
    const mingzhu = chart?.mingzhu || '命主';
    const shenzhu = chart?.shenzhu || '身主';
    const patterns = chart?.patterns || [];
    const sihua = chart?.sihua || {};

    const dingdiao = `【${bureau}】命宮位於【${mingBranch}】，身宮位於【${shenBranch}】，主星【${starNames}】定綱，命主【${mingzhu}】身主【${shenzhu}】。`;

    const patternLines = patterns.length
        ? patterns.map((p) => `★【${p.name}】（${p.level === 'excellent' ? '吉格' : p.level === 'good' ? '富貴格' : '課題格'}）：${p.desc || ''}`).join('\n')
        : '本盤星象組合平順無極端衝撞，星曜各安其位，端看後天大限引發與修持造化。';

    const sihuaLine = `生年四化：【祿入${sihua.lu || '星'}】主福澤財源、【權入${sihua.quan || '星'}】主開拓實權、【科入${sihua.ke || '星'}】主名聲清譽、【忌入${sihua.ji || '星'}】主心力歸聚與一生課題。`;

    const coreAnalysis = `【骨架格局】命主生於${chart?.lunar?.ganzhi || '庚干'}，納音定局為【${bureau}】，命宮居於【${mingBranch}】。身宮落於【${shenBranch}】，代表一生前半生受命宮主星特質主導，後半生或遇重大決策時身宮星曜將扮演關鍵角色。\n\n【名性格局】\n${patternLines}\n\n【四化導向】\n${sihuaLine}\n\n【全盤氣象】命身同參，三方四正交相輝映。命宮代表先天出廠設定與性格底色，三方四正（財帛、官祿、遷移）構建施展舞台。整體格局穩固，潛能宏大。`;

    const sanfangAnalysis = composeSanfangAnalysis(mingPalace, chart, 'overview');
    const practicalAdvice = composePracticalAdvice('overview', starsResolved, mingPalace);
    const classicQuote = CLASSICAL_QUOTES.overview;

    return {
        key: 'overview',
        label: DOMAIN_CONFIG.overview.label,
        palaceName: '全盤命格',
        palaceBranch: mingBranch,
        majorStars: starsResolved.major,
        isBorrowed: starsResolved.isBorrowed,
        sihuaList: [],
        shensha: mingPalace?.shensha || {},
        dingdiao,
        coreAnalysis,
        sanfangAnalysis,
        practicalAdvice,
        classicQuote
    };
}

/**
 * 產生單一主題深度解析
 */
function generateSingleDomain(chart, topicKey) {
    if (!DOMAIN_CONFIG[topicKey]) {
        throw new Error(`不支援的紫微分析主題：${topicKey}。支援清單：${DOMAIN_KEYS.join(', ')}`);
    }

    if (topicKey === 'overview') {
        return buildOverviewDomain(chart);
    }

    const cfg = DOMAIN_CONFIG[topicKey];
    const targetPalaceName = cfg.palaceName;
    const palace = findPalace(chart, targetPalaceName);

    if (!palace) {
        throw new Error(`命盤中找不到對應宮位【${targetPalaceName}】`);
    }

    const starsResolved = resolvePalaceStars(chart, palace);
    const dingdiao = composeDingdiao(topicKey, starsResolved, palace, chart);
    const coreAnalysis = composePalaceReading(topicKey, targetPalaceName, starsResolved, palace, chart);
    const sanfangAnalysis = composeSanfangAnalysis(palace, chart, topicKey);
    const practicalAdvice = composePracticalAdvice(topicKey, starsResolved, palace);
    const classicQuote = CLASSICAL_QUOTES[topicKey] || CLASSICAL_QUOTES.personality;

    return {
        key: topicKey,
        label: cfg.label,
        palaceName: palace.name,
        palaceBranch: palace.branch,
        ganzhi: palace.ganzhi,
        dayun: palace.dayun,
        majorStars: starsResolved.major,
        isBorrowed: starsResolved.isBorrowed,
        sihuaList: (palace.stars || []).map((s) => s.sihua).filter(Boolean),
        shensha: palace.shensha || {},
        dingdiao,
        coreAnalysis,
        sanfangAnalysis,
        practicalAdvice,
        classicQuote
    };
}

/**
 * 產生全盤完整 13 大主題深度解析清單
 */
function generateAllDomains(chart) {
    const domains = {};
    for (const key of DOMAIN_KEYS) {
        domains[key] = generateSingleDomain(chart, key);
    }
    return domains;
}

module.exports = {
    DOMAIN_KEYS,
    DOMAIN_CONFIG,
    generateSingleDomain,
    generateAllDomains
};
