// 企業データ - 関係性を含むネットワークデータ構造
// ユーザー提供の16法人データ + 既存データを統合

const detailedOrganizations = [
    {
        id: "郵貯簡保管理機構",
        fullName: "独立行政法人 郵便貯金簡易生命保険管理・郵便局ネットワーク支援機構",
        category: "中期目標管理法人",
        employees: 50,
        age: 49.9,
        salary: 884,
        genderRatio: "管理職女性0%",
        assets: 20700,
        profit: 189,
        profitStatus: "黒字",
        investment: "高",
        business: "承継した郵便貯金・簡保の管理、郵便局網の維持支援",
        culture: "堅実・確実性重視",
        challenge: "業務の大部分を外部委託しており、主体的なDX推進が困難",
        vendors: ["ゆうちょ銀行", "かんぽ生命"],
        systemRenewal: "独自システムなし",
        bidStyle: "一般競争入札",
        ai: "なし",
        dx: "委託先のかんぽ生命がAI/RPA導入済み",
        website: "https://www.yuchokampo.go.jp/"
    },
    {
        id: "勤退共",
        fullName: "独立行政法人 勤労者退職金共済機構",
        category: "中期目標管理法人",
        employees: 225,
        age: 40.4,
        salary: 766,
        genderRatio: "データなし",
        assets: 68600,
        profit: -1009,
        profitStatus: "赤字",
        investment: "高",
        business: "中小企業退職金共済制度の運営",
        culture: "堅実・確実性重視",
        challenge: "中退共システム再構築、運用環境の変化への対応",
        vendors: ["NTTデータ経営研究所", "日立製作所"],
        systemRenewal: "中退共システム再構築進行中",
        bidStyle: "一般競争入札・総合評価方式",
        ai: "検討中",
        dx: "システム再構築プロジェクト進行中",
        website: "https://www.taisyokukin.go.jp/"
    },
    {
        id: "GPIF",
        fullName: "年金積立金管理運用独立行政法人",
        category: "中期目標管理法人",
        employees: 200,
        age: 44.7,
        salary: 1047,
        genderRatio: "女性管理職比率向上中",
        assets: 2540000,
        profit: 450000,
        profitStatus: "黒字",
        investment: "極めて高い",
        business: "年金積立金の管理・運用",
        culture: "専門性重視、グローバル志向、先進的",
        challenge: "運用高度化、ESG投資推進、人材確保",
        vendors: ["ソニーCSL", "野村総研", "アクセンチュア"],
        systemRenewal: "継続的な高度化",
        bidStyle: "企画競争・総合評価方式",
        ai: "あり",
        dx: "ソニーCSLとAI研究パートナーシップ。ESGデータ分析にAI活用",
        website: "https://www.gpif.go.jp/"
    },
    {
        id: "農業者年金基金",
        fullName: "独立行政法人 農業者年金基金",
        category: "中期目標管理法人",
        employees: 58,
        age: 42.3,
        salary: 790,
        genderRatio: "女性管理職登用実績あり",
        assets: 5686,
        profit: -6.7,
        profitStatus: "赤字",
        investment: "中",
        business: "農業者向け年金の運営",
        culture: "堅実・確実性重視",
        challenge: "レガシーシステム刷新、加入者拡大",
        vendors: ["インテック", "日立システムズ"],
        systemRenewal: "R6-11年度で保守中",
        bidStyle: "価格競争中心",
        ai: "検討中",
        dx: "手続オンライン化、マイナンバー連携",
        website: "https://www.nounen.go.jp/"
    },
    {
        id: "農林漁業信用基金",
        fullName: "独立行政法人 農林漁業信用基金",
        category: "中期目標管理法人",
        employees: 86,
        age: 43.8,
        salary: 836,
        genderRatio: "データなし",
        assets: 2650,
        profit: -14,
        profitStatus: "赤字",
        investment: "中",
        business: "農林漁業者への信用保証・融資",
        culture: "堅実・確実性重視",
        challenge: "デジタル技術活用、業務効率化",
        vendors: ["日立社会情報サービス", "フォーカスシステムズ"],
        systemRenewal: "中期目標でデジタル化推進",
        bidStyle: "一般競争入札・随意契約",
        ai: "検討中",
        dx: "中期目標でデジタル技術活用が求められている",
        website: "https://www.jaffic.go.jp/"
    },
    {
        id: "住宅金融支援機構",
        fullName: "独立行政法人 住宅金融支援機構",
        category: "中期目標管理法人",
        employees: 950,
        age: 44.9,
        salary: 830,
        genderRatio: "女性管理職比率向上中",
        assets: 249000,
        profit: 1300,
        profitStatus: "黒字",
        investment: "極めて高い",
        business: "フラット35等の住宅ローン証券化支援",
        culture: "堅実・確実性重視、DX推進に積極的",
        challenge: "クラウド移行、AI審査高度化、業務効率化",
        vendors: ["NTTデータ", "日立製作所", "富士通"],
        systemRenewal: "2025-28年クラウド移行",
        bidStyle: "一般競争入札・総合評価方式",
        ai: "あり",
        dx: "AI審査モデル導入・運用中。デジタル戦略2035策定",
        website: "https://www.jhf.go.jp/"
    },
    {
        id: "国際交流基金",
        fullName: "独立行政法人 国際交流基金",
        category: "中期目標管理法人",
        employees: 300,
        age: 43.7,
        salary: 753,
        genderRatio: "女性管理職比率25%",
        assets: 1250,
        profit: -2,
        profitStatus: "赤字",
        investment: "中",
        business: "日本語教育、文化芸術交流、知的交流",
        culture: "国際性、専門性、公共性重視",
        challenge: "デジタル化推進、自主財源確保",
        vendors: ["アビームコンサルティング", "日本アクセス", "ARI"],
        systemRenewal: "R7にWebサイト再構築予定",
        bidStyle: "一般競争・企画競争",
        ai: "検討中",
        dx: "ARIと協業してJFF+サイト構築(2023年)",
        website: "https://www.jpf.go.jp/"
    },
    {
        id: "沖縄公庫",
        fullName: "沖縄振興開発金融公庫",
        category: "特殊会社",
        employees: 198,
        age: 42.9,
        salary: 888,
        genderRatio: "データなし",
        assets: 13000,
        profit: 20,
        profitStatus: "黒字",
        investment: "高",
        business: "沖縄県内の政策金融",
        culture: "地域密着、堅実",
        challenge: "デジタル化推進、データ分析基盤構築",
        vendors: ["菱管アウトソーシング", "東京センチュリー", "NEC"],
        systemRenewal: "データ分析基盤構築中",
        bidStyle: "一般競争入札",
        ai: "検討中",
        dx: "沖縄公庫コネクトでオンラインサービス提供",
        website: "https://www.okinawakouko.go.jp/"
    },
    {
        id: "日本公庫",
        fullName: "株式会社日本政策金融公庫",
        category: "特殊会社",
        employees: 7400,
        age: 42.3,
        salary: 824,
        genderRatio: "女性管理職比率向上中",
        assets: 295000,
        profit: 1100,
        profitStatus: "黒字",
        investment: "極めて高い",
        business: "中小企業・農林水産業者向け政策金融",
        culture: "堅実・確実性重視、DX推進に積極的",
        challenge: "中小融資システム・CRM刷新、業務効率化",
        vendors: ["NTTデータ", "ニーズウェル", "日立製作所"],
        systemRenewal: "2025年〜中小融資システム・CRM刷新",
        bidStyle: "一般競争入札・総合評価方式",
        ai: "あり",
        dx: "WinActor(RPA)導入済み。ニーズウェル社がRPAシナリオ作成支援",
        website: "https://www.jfc.go.jp/"
    },
    {
        id: "DBJ",
        fullName: "株式会社日本政策投資銀行",
        category: "特殊会社",
        employees: 1280,
        age: 36.7,
        salary: 1135,
        genderRatio: "女性管理職15.4%",
        assets: 215000,
        profit: 1134,
        profitStatus: "黒字",
        investment: "極めて高い",
        business: "投融資一体型の金融サービス",
        culture: "公共性と収益性の両立追求",
        challenge: "民営化、DX対応",
        vendors: ["DBJデジタルソリューションズ", "日立製作所"],
        systemRenewal: "IT子会社への随意契約",
        bidStyle: "IT子会社への随意契約",
        ai: "あり",
        dx: "次世代AIデータセンター構築に出資(2025年)",
        website: "https://www.dbj.jp/"
    },
    {
        id: "JBIC",
        fullName: "株式会社国際協力銀行",
        category: "特殊会社",
        employees: 857,
        age: 37.8,
        salary: 830,
        genderRatio: "データなし",
        assets: 193000,
        profit: -103,
        profitStatus: "赤字・一時的",
        investment: "高",
        business: "日本企業の海外事業展開支援、資源確保",
        culture: "国際性、専門性重視",
        challenge: "地政学リスク対応、DX推進",
        vendors: ["PwC Japan", "EY新日本"],
        systemRenewal: "基幹システムIT基盤更改実施済み",
        bidStyle: "一般競争入札・随意契約",
        ai: "検討中",
        dx: "第5期中期経営計画でRPA導入推進",
        website: "https://www.jbic.go.jp/"
    },
    {
        id: "私学事業団",
        fullName: "日本私立学校振興・共済事業団",
        category: "中期目標管理法人",
        employees: 500,
        age: 44.9,
        salary: 766,
        genderRatio: "データなし",
        assets: 57000,
        profit: 1900,
        profitStatus: "黒字",
        investment: "高",
        business: "私立学校への助成、共済事業",
        culture: "堅実・確実性重視",
        challenge: "DX推進、業務効率化",
        vendors: ["日立製作所", "NTTデータ", "富士通"],
        systemRenewal: "R7オンラインシステム構築",
        bidStyle: "一般競争入札",
        ai: "検討中",
        dx: "DX推進計画策定。オンラインシステム構築中",
        website: "https://www.shigaku.go.jp/"
    },
    {
        id: "日本年金機構",
        fullName: "日本年金機構",
        category: "特殊法人",
        employees: 12000,
        age: 42,
        salary: 600,
        genderRatio: "データなし",
        assets: 3200,
        profit: 0,
        profitStatus: "非営利",
        investment: "極めて高い",
        business: "公的年金運営",
        culture: "確実性・正確性重視",
        challenge: "レガシーシステム刷新、業務量増、セキュリティ強化",
        vendors: ["NTTデータ", "日立製作所", "富士通"],
        systemRenewal: "業務・システム刷新中(今後5-10年)",
        bidStyle: "大規模は随意契約",
        ai: "あり",
        dx: "生成AI導入(2025/11、富士通)。RPA導入済み",
        website: "https://www.nenkin.go.jp/"
    },
    {
        id: "NEXI",
        fullName: "株式会社日本貿易保険",
        category: "特殊会社",
        employees: 277,
        age: 40,
        salary: 844,
        genderRatio: "データなし",
        assets: 1694,
        profit: 300,
        profitStatus: "黒字",
        investment: "高",
        business: "貿易保険の引受",
        culture: "専門性重視、国際性",
        challenge: "DX推進、業務効率化",
        vendors: ["Salesforce", "Sansan", "IBM"],
        systemRenewal: "Salesforce/Sansan導入中(2025年)",
        bidStyle: "一般競争入札・随意契約",
        ai: "あり",
        dx: "社内AIチャットボット開発済み",
        website: "https://www.nexi.go.jp/"
    },
    {
        id: "商工中金",
        fullName: "株式会社商工組合中央金庫",
        category: "特殊会社",
        employees: 3600,
        age: 38.9,
        salary: 715,
        genderRatio: "女性管理職比率向上中",
        assets: 125000,
        profit: 430,
        profitStatus: "黒字",
        investment: "高",
        business: "中小企業向け金融",
        culture: "地域密着、堅実",
        challenge: "民営化、DX推進、業務効率化",
        vendors: ["NTTデータ", "日立製作所", "エクサウィザーズ"],
        systemRenewal: "勘定系システム刷新完了(2024年)",
        bidStyle: "随意契約中心",
        ai: "あり",
        dx: "エクサウィザーズとAI研修実施",
        website: "https://www.shokochukin.co.jp/"
    },
    {
        id: "日銀",
        fullName: "日本銀行",
        category: "特殊法人",
        employees: 4000,
        age: 43.4,
        salary: 854,
        genderRatio: "データなし",
        assets: 7550000,
        profit: 17000,
        profitStatus: "黒字",
        investment: "極めて高い",
        business: "金融政策、金融システム安定、決済システム運営",
        culture: "専門性・独立性・安定性重視、保守的",
        challenge: "金融政策正常化、デジタル通貨対応、システム近代化",
        vendors: ["日立製作所", "富士通", "NEC", "PwC"],
        systemRenewal: "基幹設備更新中(2025年〜)",
        bidStyle: "大手3社への随意契約中心",
        ai: "あり",
        dx: "生成AI導入(2025/6)。デジタル円パイロット中",
        website: "https://www.boj.or.jp/"
    }
];

// 主要ベンダーリスト（拡張版）
const majorVendors = [
    "NTTデータ", "日立製作所", "富士通", "NEC", "野村総研", "アクセンチュア",
    "日本IBM", "三菱電機", "アビームコンサルティング", "凸版印刷", "内田洋行", "インテック",
    "ソニーCSL", "PwC Japan", "EY新日本", "Salesforce", "IBM", "エクサウィザーズ",
    "ゆうちょ銀行", "かんぽ生命", "日立システムズ", "日立社会情報サービス"
];

// 法人種別
const categories = [
    { id: "中期目標管理法人", color: "#00d4ff" },
    { id: "行政執行法人", color: "#7b2fff" },
    { id: "国立研究開発法人", color: "#00ff88" },
    { id: "特殊会社", color: "#ff6b9d" },
    { id: "特殊法人", color: "#ffb800" }
];

// 投資余力
const investmentLevels = [
    { id: "極めて高い", color: "#ff6b9d", order: 1 },
    { id: "高", color: "#ffb800", order: 2 },
    { id: "中", color: "#00d4ff", order: 3 }
];

// AI活用状況
const aiStatus = [
    { id: "あり", color: "#00ff88" },
    { id: "検討中", color: "#ffb800" },
    { id: "なし", color: "#8892a6" }
];

// 組織風土カテゴリ
const cultureCategories = [
    { id: "堅実型", keywords: ["堅実", "確実性重視"], color: "#3498db" },
    { id: "先進型", keywords: ["先進的", "DX推進に積極的", "グローバル志向"], color: "#00ff88" },
    { id: "専門型", keywords: ["専門性重視", "独立性"], color: "#9b59b6" },
    { id: "国際型", keywords: ["国際性", "公共性"], color: "#e74c3c" },
    { id: "地域密着型", keywords: ["地域密着"], color: "#f39c12" }
];

// 入札傾向カテゴリ
const bidStyles = [
    { id: "一般競争入札", color: "#00ff88" },
    { id: "総合評価方式", color: "#00d4ff" },
    { id: "企画競争", color: "#7b2fff" },
    { id: "随意契約中心", color: "#ff6b9d" },
    { id: "価格競争中心", color: "#ffb800" }
];

// ベンダーカラーマップ
const vendorColorMap = {
    'NTTデータ': '#00d4ff',
    '日立製作所': '#ff6b9d',
    '富士通': '#00ff88',
    'NEC': '#ffb800',
    '野村総研': '#b084ff',
    'アクセンチュア': '#ff8c42',
    '日本IBM': '#00bcd4',
    'IBM': '#00bcd4',
    '三菱電機': '#e91e63',
    'アビームコンサルティング': '#8bc34a',
    'インテック': '#9c27b0',
    'ソニーCSL': '#2196f3',
    'PwC Japan': '#ff5722',
    'Salesforce': '#00a1e0',
    'エクサウィザーズ': '#673ab7'
};

// 組織風土を分類
function classifyCulture(org) {
    const culture = org.culture || "";
    for (const cat of cultureCategories) {
        for (const keyword of cat.keywords) {
            if (culture.includes(keyword)) {
                return cat.id;
            }
        }
    }
    return "堅実型";
}

// 入札傾向を正規化
function normalizeBidStyle(bidStyle) {
    if (!bidStyle) return "一般競争入札";
    if (bidStyle.includes("随意契約")) return "随意契約中心";
    if (bidStyle.includes("総合評価")) return "総合評価方式";
    if (bidStyle.includes("企画競争")) return "企画競争";
    if (bidStyle.includes("価格競争")) return "価格競争中心";
    return "一般競争入札";
}

// 5軸評価スコア計算（AI提案向け評価フレームワーク）
// 各項目: -5（撤退・静観）〜 +5（攻めるべき）

const evaluationAxes = [
    { id: 'physical', name: '物理適合', description: 'AIで本質的課題が解決できるか？' },
    { id: 'urgency', name: '切迫度', description: '今期中に導入する理由があるか？' },
    { id: 'nttAffinity', name: 'NTT親和性', description: 'NTTである必然性があるか？' },
    { id: 'itLiteracy', name: '現場IT力', description: '導入して定着するか？' },
    { id: 'budget', name: '予算規模', description: '営業で利益が出るか？' }
];

// 各組織の5軸スコアを計算
function calculateEvaluationScores(org) {
    const scores = {};

    // ① 物理適合: 金融・事務系は高い、物理作業中心は低い
    if (org.business?.includes('金融') || org.business?.includes('年金') ||
        org.business?.includes('審査') || org.business?.includes('保険') ||
        org.business?.includes('運用') || org.business?.includes('保証')) {
        scores.physical = 5;
    } else if (org.business?.includes('交流') || org.business?.includes('教育')) {
        scores.physical = 3;
    } else {
        scores.physical = 2;
    }

    // ② 切迫度: システム更改予定、法改正対応等
    if (org.systemRenewal?.includes('2025') || org.systemRenewal?.includes('刷新中') ||
        org.systemRenewal?.includes('再構築') || org.systemRenewal?.includes('更新中')) {
        scores.urgency = 5;
    } else if (org.systemRenewal?.includes('進行中') || org.systemRenewal?.includes('構築中')) {
        scores.urgency = 4;
    } else if (org.ai === 'なし' && org.investment !== '中') {
        scores.urgency = 3;
    } else {
        scores.urgency = 1;
    }

    // ③ NTT親和性: 機密情報、金融、官公庁はセキュリティ要件高い
    const nttVendors = ['NTTデータ', 'NTTデータ経営研究所'];
    const hasNttVendor = org.vendors?.some(v => nttVendors.some(nv => v.includes('NTT')));

    if (hasNttVendor) {
        scores.nttAffinity = 5;
    } else if (org.category === '特殊法人' || org.category === '中期目標管理法人') {
        if (org.business?.includes('年金') || org.business?.includes('金融')) {
            scores.nttAffinity = 5;
        } else {
            scores.nttAffinity = 4;
        }
    } else if (org.category === '特殊会社') {
        if (org.business?.includes('金融') || org.business?.includes('保険')) {
            scores.nttAffinity = 4;
        } else {
            scores.nttAffinity = 3;
        }
    } else {
        scores.nttAffinity = 2;
    }

    // ④ 現場IT力: 専門職・事務職中心、AI導入済みは高い
    if (org.ai === 'あり') {
        scores.itLiteracy = 5;
    } else if (org.ai === '検討中') {
        scores.itLiteracy = 3;
    } else {
        scores.itLiteracy = 1;
    }

    // 文化による調整
    if (org.culture?.includes('先進的') || org.culture?.includes('DX推進')) {
        scores.itLiteracy = Math.min(5, scores.itLiteracy + 1);
    }
    if (org.culture?.includes('保守的')) {
        scores.itLiteracy = Math.max(-3, scores.itLiteracy - 2);
    }

    // ⑤ 予算規模: 投資余力と利益状況
    if (org.investment === '極めて高い') {
        scores.budget = 5;
    } else if (org.investment === '高') {
        scores.budget = 4;
    } else if (org.investment === '中') {
        scores.budget = 2;
    } else {
        scores.budget = 0;
    }

    // 利益状況による調整
    if (org.profitStatus === '黒字' && org.profit > 500) {
        scores.budget = Math.min(5, scores.budget + 1);
    }

    // 総合スコア計算
    scores.total = scores.physical + scores.urgency + scores.nttAffinity +
        scores.itLiteracy + scores.budget;

    return scores;
}

// 評価ランク判定
function getEvaluationRank(totalScore) {
    if (totalScore >= 20) return { rank: 'S', label: '最優先', color: '#ff6b9d' };
    if (totalScore >= 16) return { rank: 'A', label: '要攻略', color: '#00ff88' };
    if (totalScore >= 12) return { rank: 'B', label: '検討', color: '#00d4ff' };
    if (totalScore >= 8) return { rank: 'C', label: '様子見', color: '#ffb800' };
    return { rank: 'D', label: '静観', color: '#8892a6' };
}

// データをエクスポート
window.detailedOrganizations = detailedOrganizations;
window.organizationsData = detailedOrganizations; // 互換性のため
window.majorVendors = majorVendors;
window.categories = categories;
window.investmentLevels = investmentLevels;
window.aiStatus = aiStatus;
window.cultureCategories = cultureCategories;
window.bidStyles = bidStyles;
window.vendorColorMap = vendorColorMap;
window.classifyCulture = classifyCulture;
window.normalizeBidStyle = normalizeBidStyle;
window.evaluationAxes = evaluationAxes;
window.calculateEvaluationScores = calculateEvaluationScores;
window.getEvaluationRank = getEvaluationRank;

