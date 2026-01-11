// ===== Network Navigator - D3.js Force Graph Visualization =====
// 多軸可視化拡張版

class NetworkNavigator {
    constructor() {
        this.svg = null;
        this.simulation = null;
        this.nodes = [];
        this.links = [];
        this.showLabels = true;
        this.currentFilter = 'all';
        this.currentView = 'network'; // network, scatter, timeline, heatmap
        this.nodeSizeMode = 'employees';
        this.zoom = null;
        this.g = null;

        this.init();
    }

    init() {
        this.setupSVG();
        this.setupFilters();
        this.buildNetworkData('all');
        this.createSimulation();
        this.render();
        this.setupEventListeners();
        this.updateLegend('all');
        this.updateStats();
    }

    setupSVG() {
        const container = document.getElementById('networkContainer');
        const width = container.clientWidth;
        const height = container.clientHeight;

        this.svg = d3.select('#networkSvg')
            .attr('width', width)
            .attr('height', height);

        // グロー効果のフィルター定義
        const defs = this.svg.append('defs');

        const glow = defs.append('filter')
            .attr('id', 'glow')
            .attr('x', '-50%')
            .attr('y', '-50%')
            .attr('width', '200%')
            .attr('height', '200%');

        glow.append('feGaussianBlur')
            .attr('stdDeviation', '3')
            .attr('result', 'coloredBlur');

        const feMerge = glow.append('feMerge');
        feMerge.append('feMergeNode').attr('in', 'coloredBlur');
        feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

        // 強いグロー
        const glowStrong = defs.append('filter')
            .attr('id', 'glow-strong')
            .attr('x', '-100%')
            .attr('y', '-100%')
            .attr('width', '300%')
            .attr('height', '300%');

        glowStrong.append('feGaussianBlur')
            .attr('stdDeviation', '6')
            .attr('result', 'coloredBlur');

        const feMerge2 = glowStrong.append('feMerge');
        feMerge2.append('feMergeNode').attr('in', 'coloredBlur');
        feMerge2.append('feMergeNode').attr('in', 'SourceGraphic');

        // グラデーション定義
        const gradient = defs.append('linearGradient')
            .attr('id', 'linkGradient')
            .attr('gradientUnits', 'userSpaceOnUse');

        gradient.append('stop')
            .attr('offset', '0%')
            .attr('stop-color', '#00d4ff')
            .attr('stop-opacity', 0.6);

        gradient.append('stop')
            .attr('offset', '100%')
            .attr('stop-color', '#7b2fff')
            .attr('stop-opacity', 0.6);

        // ズーム設定
        this.zoom = d3.zoom()
            .scaleExtent([0.3, 4])
            .on('zoom', (event) => {
                this.g.attr('transform', event.transform);
            });

        this.svg.call(this.zoom);
        this.g = this.svg.append('g');
    }

    setupFilters() {
        // SVGフィルター用の追加設定が必要な場合
    }

    buildNetworkData(filterType) {
        this.nodes = [];
        this.links = [];

        const organizations = window.detailedOrganizations || window.organizationsData;
        const vendors = window.majorVendors;
        const cats = window.categories;

        switch (filterType) {
            case 'scatter':
                this.buildScatterData(organizations);
                break;
            case 'timeline':
                this.buildTimelineData(organizations);
                break;
            case 'heatmap':
                this.buildHeatmapData(organizations);
                break;
            case 'culture':
                this.buildCultureNetwork(organizations);
                break;
            case 'vendorHub':
                this.buildVendorHubNetwork(organizations, vendors);
                break;
            case 'vendor':
                this.buildVendorNetwork(organizations, vendors);
                break;
            case 'category':
                this.buildCategoryNetwork(organizations, cats);
                break;
            case 'investment':
                this.buildInvestmentNetwork(organizations);
                break;
            case 'ai':
                this.buildAINetwork(organizations);
                break;
            case 'bidStyle':
                this.buildBidStyleNetwork(organizations);
                break;
            default:
                this.buildAllNetwork(organizations, vendors);
        }
    }

    // ========== 新しい可視化モード ==========

    // 年収×総資産 スキャッタープロット
    buildScatterData(organizations) {
        this.currentView = 'scatter';
        const container = document.getElementById('networkContainer');
        const width = container.clientWidth;
        const height = container.clientHeight;
        const margin = { top: 60, right: 80, bottom: 80, left: 100 };

        // スケールを計算
        const salaries = organizations.map(o => o.salary || 700);
        const assets = organizations.map(o => o.assets || 100);

        const xScale = d3.scaleLinear()
            .domain([d3.min(salaries) - 50, d3.max(salaries) + 50])
            .range([margin.left, width - margin.right]);

        const yScale = d3.scaleLog()
            .domain([100, d3.max(assets) * 1.2])
            .range([height - margin.bottom, margin.top]);

        const aiColors = {
            'あり': '#00ff88',
            '検討中': '#ffb800',
            'なし': '#8892a6'
        };

        organizations.forEach(org => {
            const x = xScale(org.salary || 750);
            const y = yScale(Math.max(100, org.assets || 100));
            const radius = Math.max(10, Math.min(60, Math.sqrt(org.employees) / 2));

            this.nodes.push({
                id: org.id,
                type: 'organization',
                category: org.category,
                data: org,
                x: x,
                y: y,
                fx: x,
                fy: y,
                radius: radius,
                color: aiColors[org.ai] || '#8892a6'
            });
        });

        // 軸情報を保存
        this.scatterScales = { xScale, yScale, margin };
    }

    // システム更改タイムライン
    buildTimelineData(organizations) {
        this.currentView = 'timeline';
        const container = document.getElementById('networkContainer');
        const width = container.clientWidth;
        const height = container.clientHeight;
        const margin = { top: 80, right: 60, bottom: 60, left: 120 };

        // 時間軸の定義（2024-2030）
        const xScale = d3.scaleLinear()
            .domain([2024, 2030])
            .range([margin.left, width - margin.right]);

        // 投資余力でY軸を分ける
        const investmentOrder = { '極めて高い': 0, '高': 1, '中': 2 };
        const yScale = d3.scaleBand()
            .domain(['極めて高い', '高', '中'])
            .range([margin.top, height - margin.bottom])
            .padding(0.3);

        const investColors = window.investmentLevels.reduce((acc, l) => {
            acc[l.id] = l.color;
            return acc;
        }, {});

        organizations.forEach((org, i) => {
            // システム更改時期からおおよその年を推定
            let year = 2025; // デフォルト
            const renewal = org.systemRenewal || '';
            if (renewal.includes('2024') || renewal.includes('完了')) year = 2024;
            else if (renewal.includes('2025')) year = 2025;
            else if (renewal.includes('2026') || renewal.includes('2027') || renewal.includes('2028')) year = 2027;
            else if (renewal.includes('進行中') || renewal.includes('刷新中')) year = 2026;
            else if (renewal.includes('R7')) year = 2025;
            else if (renewal.includes('R6')) year = 2024;
            else year = 2025 + (i % 4);

            const investment = org.investment || '中';
            const x = xScale(year) + (Math.random() - 0.5) * 60;
            const yBand = yScale(investment);
            const y = yBand + yScale.bandwidth() / 2 + (Math.random() - 0.5) * (yScale.bandwidth() * 0.6);

            const radius = Math.max(12, Math.min(50, Math.log10(org.assets + 1) * 8));

            this.nodes.push({
                id: org.id,
                type: 'organization',
                category: org.category,
                data: org,
                x: x,
                y: y,
                fx: x,
                fy: y,
                radius: radius,
                color: investColors[investment] || '#8892a6',
                year: year
            });
        });

        this.timelineScales = { xScale, yScale, margin };
    }

    // ヒートマップグリッド
    buildHeatmapData(organizations) {
        this.currentView = 'heatmap';
        const container = document.getElementById('networkContainer');
        const width = container.clientWidth;
        const height = container.clientHeight;
        const margin = { top: 80, right: 40, bottom: 40, left: 180 };

        const metrics = ['職員数', '年収', '総資産', '経常利益', '平均年齢'];
        const cellWidth = (width - margin.left - margin.right) / metrics.length;
        const cellHeight = Math.min(40, (height - margin.top - margin.bottom) / organizations.length);

        // 各指標の最大値を計算
        const maxValues = {
            '職員数': d3.max(organizations.map(o => o.employees)),
            '年収': d3.max(organizations.map(o => o.salary || 0)),
            '総資産': d3.max(organizations.map(o => o.assets)),
            '経常利益': d3.max(organizations.map(o => Math.abs(o.profit || 0))),
            '平均年齢': d3.max(organizations.map(o => o.age || 0))
        };

        organizations.forEach((org, row) => {
            metrics.forEach((metric, col) => {
                let value = 0;
                let normalizedValue = 0;

                switch (metric) {
                    case '職員数':
                        value = org.employees;
                        normalizedValue = Math.log10(value + 1) / Math.log10(maxValues['職員数'] + 1);
                        break;
                    case '年収':
                        value = org.salary || 0;
                        normalizedValue = (value - 600) / (maxValues['年収'] - 600);
                        break;
                    case '総資産':
                        value = org.assets;
                        normalizedValue = Math.log10(value + 1) / Math.log10(maxValues['総資産'] + 1);
                        break;
                    case '経常利益':
                        value = org.profit || 0;
                        normalizedValue = value > 0 ? Math.log10(value + 1) / Math.log10(maxValues['経常利益'] + 1) : 0;
                        break;
                    case '平均年齢':
                        value = org.age || 40;
                        normalizedValue = (value - 35) / (50 - 35);
                        break;
                }

                const x = margin.left + col * cellWidth + cellWidth / 2;
                const y = margin.top + row * cellHeight + cellHeight / 2;

                // 色を強度に応じて変える
                const hue = metric === '経常利益' && (org.profit || 0) < 0 ? 0 : 200; // 赤字は赤
                const saturation = 80;
                const lightness = 80 - normalizedValue * 50;

                this.nodes.push({
                    id: `${org.id}-${metric}`,
                    orgId: org.id,
                    type: 'heatmap-cell',
                    metric: metric,
                    value: value,
                    normalizedValue: normalizedValue,
                    data: org,
                    x: x,
                    y: y,
                    fx: x,
                    fy: y,
                    radius: Math.min(cellWidth, cellHeight) / 2 - 2,
                    width: cellWidth - 4,
                    height: cellHeight - 4,
                    color: `hsl(${hue}, ${saturation}%, ${lightness}%)`
                });
            });
        });

        this.heatmapConfig = { margin, metrics, cellWidth, cellHeight, organizations };
    }

    // 組織風土クラスター
    buildCultureNetwork(organizations) {
        this.currentView = 'network';
        const cultureCategories = window.cultureCategories || [];

        // 風土カテゴリをハブノードとして追加
        cultureCategories.forEach(cat => {
            this.nodes.push({
                id: cat.id,
                type: 'culture',
                radius: 35,
                color: cat.color
            });
        });

        organizations.forEach(org => {
            const cultureType = window.classifyCulture ? window.classifyCulture(org) : '堅実型';
            const cat = cultureCategories.find(c => c.id === cultureType);
            const radius = this.calculateRadius(org);

            this.nodes.push({
                id: org.id,
                type: 'organization',
                category: org.category,
                data: org,
                radius: radius,
                color: cat ? cat.color : '#8892a6',
                cultureType: cultureType
            });

            // 風土ハブへのリンク
            if (cat) {
                this.links.push({
                    source: cat.id,
                    target: org.id,
                    color: cat.color,
                    strength: 0.5
                });
            }

            // 共通ベンダーを持つ組織間のリンク
            organizations.forEach(otherOrg => {
                if (org.id !== otherOrg.id) {
                    const commonVendors = (org.vendors || []).filter(v =>
                        (otherOrg.vendors || []).includes(v)
                    );
                    if (commonVendors.length >= 2) {
                        const existingLink = this.links.find(l =>
                            (l.source === org.id && l.target === otherOrg.id) ||
                            (l.source === otherOrg.id && l.target === org.id)
                        );
                        if (!existingLink) {
                            this.links.push({
                                source: org.id,
                                target: otherOrg.id,
                                color: '#ffffff',
                                strength: 0.1,
                                opacity: 0.2
                            });
                        }
                    }
                }
            });
        });
    }

    // ベンダー中心性ネットワーク
    buildVendorHubNetwork(organizations, vendors) {
        this.currentView = 'network';
        const vendorColorMap = window.vendorColorMap || {};

        // 主要ベンダーの出現回数をカウント
        const vendorCounts = {};
        organizations.forEach(org => {
            (org.vendors || []).forEach(v => {
                vendorCounts[v] = (vendorCounts[v] || 0) + 1;
            });
        });

        // 出現回数が2以上のベンダーをハブとして追加
        const activeVendors = Object.entries(vendorCounts)
            .filter(([v, count]) => count >= 2)
            .sort((a, b) => b[1] - a[1]);

        activeVendors.forEach(([vendor, count]) => {
            this.nodes.push({
                id: vendor,
                type: 'vendor',
                radius: 20 + count * 2,
                color: vendorColorMap[vendor] || '#ffffff',
                count: count
            });
        });

        // 組織ノード追加
        organizations.forEach(org => {
            const primaryVendor = org.vendors ? org.vendors[0] : null;
            const radius = this.calculateRadius(org);

            this.nodes.push({
                id: org.id,
                type: 'organization',
                category: org.category,
                data: org,
                radius: radius,
                color: primaryVendor && vendorColorMap[primaryVendor] ?
                    vendorColorMap[primaryVendor] : '#8892a6'
            });

            // ベンダーとのリンク
            (org.vendors || []).forEach(vendor => {
                if (vendorCounts[vendor] >= 2) {
                    this.links.push({
                        source: vendor,
                        target: org.id,
                        color: vendorColorMap[vendor] || '#8892a6',
                        strength: 0.4
                    });
                }
            });
        });

        // 共通ベンダーを持つ組織間のリンク
        organizations.forEach((org, i) => {
            organizations.slice(i + 1).forEach(otherOrg => {
                const commonVendors = (org.vendors || []).filter(v =>
                    (otherOrg.vendors || []).includes(v) && vendorCounts[v] >= 2
                );
                if (commonVendors.length >= 1) {
                    this.links.push({
                        source: org.id,
                        target: otherOrg.id,
                        color: vendorColorMap[commonVendors[0]] || '#8892a6',
                        strength: 0.05 + commonVendors.length * 0.05,
                        opacity: 0.15 + commonVendors.length * 0.1,
                        width: commonVendors.length
                    });
                }
            });
        });
    }

    // 入札傾向別ネットワーク
    buildBidStyleNetwork(organizations) {
        this.currentView = 'network';
        const bidStyles = window.bidStyles || [];

        bidStyles.forEach(style => {
            this.nodes.push({
                id: style.id,
                type: 'bidStyle',
                radius: 30,
                color: style.color
            });
        });

        organizations.forEach(org => {
            const normalizedStyle = window.normalizeBidStyle ?
                window.normalizeBidStyle(org.bidStyle) : '一般競争入札';
            const style = bidStyles.find(s => s.id === normalizedStyle);
            const radius = this.calculateRadius(org);

            this.nodes.push({
                id: org.id,
                type: 'organization',
                category: org.category,
                data: org,
                radius: radius,
                color: style ? style.color : '#8892a6'
            });

            if (style) {
                this.links.push({
                    source: style.id,
                    target: org.id,
                    color: style.color,
                    strength: 0.5
                });
            }
        });
    }

    // ========== 既存の可視化モード ==========

    buildAllNetwork(organizations, vendors) {
        this.currentView = 'network';
        const vendorColorMap = window.vendorColorMap || {};

        // ベンダーを中央ノードとして追加
        const activeVendors = new Set();
        organizations.forEach(org => {
            (org.vendors || []).forEach(v => {
                if (vendors.includes(v)) {
                    activeVendors.add(v);
                }
            });
        });

        // ベンダーノード追加
        Array.from(activeVendors).forEach(vendor => {
            this.nodes.push({
                id: vendor,
                type: 'vendor',
                radius: 25,
                color: vendorColorMap[vendor] || '#ffffff'
            });
        });

        // 組織ノード追加
        organizations.forEach(org => {
            const cat = window.categories.find(c => c.id === org.category);
            const radius = this.calculateRadius(org);

            this.nodes.push({
                id: org.id,
                type: 'organization',
                category: org.category,
                data: org,
                radius: radius,
                color: cat ? cat.color : '#8892a6'
            });

            // ベンダーとのリンク
            (org.vendors || []).forEach(vendor => {
                if (activeVendors.has(vendor)) {
                    this.links.push({
                        source: vendor,
                        target: org.id,
                        color: vendorColorMap[vendor] || '#8892a6',
                        strength: 0.3
                    });
                }
            });
        });
    }

    buildVendorNetwork(organizations, vendors) {
        this.currentView = 'network';
        const vendorColorMap = window.vendorColorMap || {};

        const activeVendors = new Set();
        organizations.forEach(org => {
            (org.vendors || []).forEach(v => {
                if (vendors.includes(v)) {
                    activeVendors.add(v);
                }
            });
        });

        Array.from(activeVendors).forEach(vendor => {
            this.nodes.push({
                id: vendor,
                type: 'vendor',
                radius: 30,
                color: vendorColorMap[vendor] || '#ffffff'
            });
        });

        organizations.forEach(org => {
            const radius = this.calculateRadius(org);
            const primaryVendor = org.vendors ? org.vendors[0] : null;

            this.nodes.push({
                id: org.id,
                type: 'organization',
                category: org.category,
                data: org,
                radius: radius,
                color: vendorColorMap[primaryVendor] || '#8892a6'
            });

            (org.vendors || []).forEach(vendor => {
                if (activeVendors.has(vendor)) {
                    this.links.push({
                        source: vendor,
                        target: org.id,
                        color: vendorColorMap[vendor] || '#8892a6',
                        strength: 0.5
                    });
                }
            });
        });
    }

    buildCategoryNetwork(organizations, cats) {
        this.currentView = 'network';
        // カテゴリを中央ノードとして追加
        cats.forEach(cat => {
            this.nodes.push({
                id: cat.id,
                type: 'category',
                radius: 30,
                color: cat.color
            });
        });

        // 組織ノード追加
        organizations.forEach(org => {
            const cat = cats.find(c => c.id === org.category);
            const radius = this.calculateRadius(org);

            this.nodes.push({
                id: org.id,
                type: 'organization',
                category: org.category,
                data: org,
                radius: radius,
                color: cat ? cat.color : '#8892a6'
            });

            if (cat) {
                this.links.push({
                    source: cat.id,
                    target: org.id,
                    color: cat.color,
                    strength: 0.6
                });
            }
        });
    }

    buildInvestmentNetwork(organizations) {
        this.currentView = 'network';
        const levels = window.investmentLevels;

        levels.forEach(level => {
            this.nodes.push({
                id: level.id,
                type: 'investment',
                radius: 30,
                color: level.color
            });
        });

        organizations.forEach(org => {
            const level = levels.find(l => l.id === org.investment);
            const radius = this.calculateRadius(org);

            this.nodes.push({
                id: org.id,
                type: 'organization',
                category: org.category,
                data: org,
                radius: radius,
                color: level ? level.color : '#8892a6'
            });

            if (level) {
                this.links.push({
                    source: level.id,
                    target: org.id,
                    color: level.color,
                    strength: 0.5
                });
            }
        });
    }

    buildAINetwork(organizations) {
        this.currentView = 'network';
        const statuses = window.aiStatus;

        statuses.forEach(status => {
            this.nodes.push({
                id: status.id,
                type: 'aiStatus',
                radius: 30,
                color: status.color
            });
        });

        organizations.forEach(org => {
            const status = statuses.find(s => s.id === org.ai);
            const radius = this.calculateRadius(org);

            this.nodes.push({
                id: org.id,
                type: 'organization',
                category: org.category,
                data: org,
                radius: radius,
                color: status ? status.color : '#8892a6'
            });

            if (status) {
                this.links.push({
                    source: status.id,
                    target: org.id,
                    color: status.color,
                    strength: 0.5
                });
            }
        });
    }

    calculateRadius(org) {
        const employees = org.employees || 100;
        const assets = org.assets || 1000;

        const employeeScore = Math.sqrt(employees) / 10;
        const assetScore = Math.log10(assets + 1) * 2;

        switch (this.nodeSizeMode) {
            case 'employees':
                return Math.max(8, Math.min(35, Math.sqrt(employees) / 3));
            case 'assets':
                return Math.max(8, Math.min(50, Math.log10(assets + 1) * 6));
            case 'salary':
                const salary = org.salary || 750;
                return Math.max(8, Math.min(35, (salary - 600) / 15));
            default:
                const combined = (employeeScore + assetScore) / 2;
                return Math.max(10, Math.min(30, combined * 3));
        }
    }

    createSimulation() {
        const container = document.getElementById('networkContainer');
        const width = container.clientWidth;
        const height = container.clientHeight;

        // スキャッター・タイムライン・ヒートマップの場合はシミュレーション不要
        if (this.currentView !== 'network') {
            this.simulation = d3.forceSimulation(this.nodes)
                .force('collision', d3.forceCollide().radius(d => d.radius + 2))
                .alphaDecay(0.05);
            return;
        }

        this.simulation = d3.forceSimulation(this.nodes)
            .force('link', d3.forceLink(this.links)
                .id(d => d.id)
                .distance(d => {
                    if (d.source.type !== 'organization' || d.target.type !== 'organization') {
                        return 120;
                    }
                    return 80;
                })
                .strength(d => d.strength || 0.3))
            .force('charge', d3.forceManyBody()
                .strength(d => d.type === 'organization' ? -100 : -300))
            .force('center', d3.forceCenter(width / 2, height / 2))
            .force('collision', d3.forceCollide()
                .radius(d => d.radius + 5));
    }

    render() {
        // 軸の描画（スキャッター・タイムライン用）
        this.renderAxes();

        // リンクの描画
        const link = this.g.selectAll('.link')
            .data(this.links)
            .join('line')
            .attr('class', 'link')
            .attr('stroke', d => d.color)
            .attr('stroke-width', d => d.width || 1.5)
            .attr('stroke-opacity', d => d.opacity || 0.4);

        // ノードの描画
        if (this.currentView === 'heatmap') {
            // ヒートマップは矩形
            const node = this.g.selectAll('.node')
                .data(this.nodes)
                .join('rect')
                .attr('class', 'node heatmap-cell')
                .attr('x', d => d.x - d.width / 2)
                .attr('y', d => d.y - d.height / 2)
                .attr('width', d => d.width)
                .attr('height', d => d.height)
                .attr('rx', 4)
                .attr('fill', d => d.color)
                .attr('stroke', 'rgba(255,255,255,0.1)')
                .attr('stroke-width', 1)
                .on('click', (event, d) => this.showInfo(d))
                .on('mouseover', (event, d) => this.showTooltip(event, d))
                .on('mouseout', () => this.hideTooltip());
        } else {
            const node = this.g.selectAll('.node')
                .data(this.nodes)
                .join('circle')
                .attr('class', d => `node ${d.type === 'organization' ? '' : 'central-node'}`)
                .attr('r', d => d.radius)
                .attr('fill', d => d.color)
                .attr('filter', d => d.type !== 'organization' ? 'url(#glow-strong)' : 'url(#glow)')
                .call(this.drag())
                .on('click', (event, d) => this.showInfo(d))
                .on('mouseover', (event, d) => this.showTooltip(event, d))
                .on('mouseout', () => this.hideTooltip());
        }

        // ラベルの描画（ヒートマップ以外）
        if (this.currentView !== 'heatmap') {
            const label = this.g.selectAll('.node-label')
                .data(this.nodes.filter(d => d.type === 'organization'))
                .join('text')
                .attr('class', `node-label ${this.showLabels ? '' : 'hidden'}`)
                .text(d => d.id.length > 10 ? d.id.substring(0, 10) + '...' : d.id)
                .attr('dy', d => d.radius + 12);
        }

        // シミュレーションの更新
        this.simulation.on('tick', () => {
            link
                .attr('x1', d => d.source.x)
                .attr('y1', d => d.source.y)
                .attr('x2', d => d.target.x)
                .attr('y2', d => d.target.y);

            if (this.currentView === 'heatmap') {
                this.g.selectAll('.node')
                    .attr('x', d => d.x - d.width / 2)
                    .attr('y', d => d.y - d.height / 2);
            } else {
                this.g.selectAll('.node')
                    .attr('cx', d => d.x)
                    .attr('cy', d => d.y);

                this.g.selectAll('.node-label')
                    .attr('x', d => d.x)
                    .attr('y', d => d.y);
            }
        });
    }

    renderAxes() {
        // 既存の軸を削除
        this.g.selectAll('.axis').remove();
        this.g.selectAll('.axis-label').remove();
        this.g.selectAll('.grid-line').remove();

        if (this.currentView === 'scatter' && this.scatterScales) {
            const { xScale, yScale, margin } = this.scatterScales;
            const container = document.getElementById('networkContainer');
            const width = container.clientWidth;
            const height = container.clientHeight;

            // X軸
            const xAxis = d3.axisBottom(xScale).ticks(6).tickFormat(d => d + '万円');
            this.g.append('g')
                .attr('class', 'axis x-axis')
                .attr('transform', `translate(0, ${height - margin.bottom})`)
                .call(xAxis);

            // Y軸
            const yAxis = d3.axisLeft(yScale).ticks(5).tickFormat(d => {
                if (d >= 10000) return (d / 10000).toFixed(0) + '兆円';
                return d + '億円';
            });
            this.g.append('g')
                .attr('class', 'axis y-axis')
                .attr('transform', `translate(${margin.left}, 0)`)
                .call(yAxis);

            // 軸ラベル
            this.g.append('text')
                .attr('class', 'axis-label')
                .attr('x', width / 2)
                .attr('y', height - 20)
                .attr('text-anchor', 'middle')
                .attr('fill', '#00d4ff')
                .text('平均年収');

            this.g.append('text')
                .attr('class', 'axis-label')
                .attr('x', -height / 2)
                .attr('y', 30)
                .attr('transform', 'rotate(-90)')
                .attr('text-anchor', 'middle')
                .attr('fill', '#00d4ff')
                .text('総資産（対数スケール）');

        } else if (this.currentView === 'timeline' && this.timelineScales) {
            const { xScale, yScale, margin } = this.timelineScales;
            const container = document.getElementById('networkContainer');
            const width = container.clientWidth;
            const height = container.clientHeight;

            // X軸（年）
            const xAxis = d3.axisBottom(xScale).ticks(7).tickFormat(d => d + '年');
            this.g.append('g')
                .attr('class', 'axis x-axis')
                .attr('transform', `translate(0, ${height - margin.bottom})`)
                .call(xAxis);

            // Y軸バンド
            const yAxisLabels = ['極めて高い', '高', '中'];
            yAxisLabels.forEach(label => {
                const y = yScale(label) + yScale.bandwidth() / 2;
                this.g.append('text')
                    .attr('class', 'axis-label')
                    .attr('x', margin.left - 10)
                    .attr('y', y)
                    .attr('text-anchor', 'end')
                    .attr('dominant-baseline', 'middle')
                    .attr('fill', window.investmentLevels.find(l => l.id === label)?.color || '#fff')
                    .text(label);

                // グリッドライン
                this.g.append('line')
                    .attr('class', 'grid-line')
                    .attr('x1', margin.left)
                    .attr('x2', width - margin.right)
                    .attr('y1', yScale(label) + yScale.bandwidth())
                    .attr('y2', yScale(label) + yScale.bandwidth())
                    .attr('stroke', 'rgba(255,255,255,0.1)')
                    .attr('stroke-dasharray', '4,4');
            });

            // タイトル
            this.g.append('text')
                .attr('class', 'axis-label')
                .attr('x', width / 2)
                .attr('y', 40)
                .attr('text-anchor', 'middle')
                .attr('fill', '#00d4ff')
                .attr('font-size', '16px')
                .text('🔄 システム更改タイムライン');

        } else if (this.currentView === 'heatmap' && this.heatmapConfig) {
            const { margin, metrics, cellWidth, organizations } = this.heatmapConfig;

            // 列ヘッダー
            metrics.forEach((metric, i) => {
                this.g.append('text')
                    .attr('class', 'axis-label')
                    .attr('x', margin.left + i * cellWidth + cellWidth / 2)
                    .attr('y', margin.top - 20)
                    .attr('text-anchor', 'middle')
                    .attr('fill', '#00d4ff')
                    .attr('font-size', '12px')
                    .text(metric);
            });

            // 行ラベル
            organizations.forEach((org, i) => {
                const y = margin.top + i * this.heatmapConfig.cellHeight + this.heatmapConfig.cellHeight / 2;
                this.g.append('text')
                    .attr('class', 'axis-label')
                    .attr('x', margin.left - 10)
                    .attr('y', y)
                    .attr('text-anchor', 'end')
                    .attr('dominant-baseline', 'middle')
                    .attr('fill', '#fff')
                    .attr('font-size', '11px')
                    .text(org.id);
            });

            // タイトル
            this.g.append('text')
                .attr('class', 'axis-label')
                .attr('x', margin.left + (metrics.length * cellWidth) / 2)
                .attr('y', 30)
                .attr('text-anchor', 'middle')
                .attr('fill', '#00d4ff')
                .attr('font-size', '16px')
                .text('🔥 組織比較ヒートマップ');
        }
    }

    drag() {
        return d3.drag()
            .on('start', (event, d) => {
                if (!event.active) this.simulation.alphaTarget(0.3).restart();
                d.fx = d.x;
                d.fy = d.y;
            })
            .on('drag', (event, d) => {
                d.fx = event.x;
                d.fy = event.y;
            })
            .on('end', (event, d) => {
                if (!event.active) this.simulation.alphaTarget(0);
                // スキャッター・タイムラインでは位置を固定
                if (this.currentView !== 'network') {
                    return;
                }
                d.fx = null;
                d.fy = null;
            });
    }

    showInfo(d) {
        const panel = document.getElementById('panelContent');

        if (d.type === 'heatmap-cell') {
            const org = d.data;
            panel.innerHTML = `
                <div class="info-item">
                    <div class="info-label">法人名</div>
                    <div class="info-value highlight">${org.id}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">${d.metric}</div>
                    <div class="info-value">${this.formatValue(d.metric, d.value)}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">正規化スコア</div>
                    <div class="info-value">${(d.normalizedValue * 100).toFixed(1)}%</div>
                </div>
            `;
        } else if (d.type === 'organization' && d.data) {
            const org = d.data;
            const investmentBadge = org.investment === '極めて高い' ? 'badge-high' :
                org.investment === '高' ? 'badge-medium' : 'badge-low';
            const aiBadge = org.ai === 'あり' ? 'badge-high' :
                org.ai === '検討中' ? 'badge-medium' : 'badge-low';

            panel.innerHTML = `
                <div class="info-item">
                    <div class="info-label">法人名</div>
                    <div class="info-value highlight">${org.id}</div>
                </div>
                ${org.fullName ? `
                <div class="info-item">
                    <div class="info-label">正式名称</div>
                    <div class="info-value" style="font-size: 0.8rem">${org.fullName}</div>
                </div>` : ''}
                <div class="info-item">
                    <div class="info-label">法人種別</div>
                    <div class="info-value">${org.category}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">主要業務</div>
                    <div class="info-value">${org.business}</div>
                </div>
                <div class="info-grid">
                    <div class="info-item half">
                        <div class="info-label">職員数</div>
                        <div class="info-value">${org.employees?.toLocaleString() || '-'}名</div>
                    </div>
                    <div class="info-item half">
                        <div class="info-label">平均年齢</div>
                        <div class="info-value">${org.age || '-'}歳</div>
                    </div>
                    <div class="info-item half">
                        <div class="info-label">平均年収</div>
                        <div class="info-value">${org.salary || '-'}万円</div>
                    </div>
                    <div class="info-item half">
                        <div class="info-label">総資産</div>
                        <div class="info-value">${this.formatAssets(org.assets)}</div>
                    </div>
                </div>
                <div class="info-item">
                    <div class="info-label">経常利益</div>
                    <div class="info-value ${(org.profit || 0) < 0 ? 'text-red' : 'text-green'}">
                        ${org.profit !== undefined ? (org.profit >= 0 ? '+' : '') + org.profit.toLocaleString() + '億円' : '-'}
                        <span class="profit-status">${org.profitStatus || ''}</span>
                    </div>
                </div>
                <div class="info-item">
                    <div class="info-label">投資余力</div>
                    <div class="info-value"><span class="info-badge ${investmentBadge}">${org.investment}</span></div>
                </div>
                <div class="info-item">
                    <div class="info-label">AI活用</div>
                    <div class="info-value"><span class="info-badge ${aiBadge}">${org.ai}</span></div>
                </div>
                <div class="info-item">
                    <div class="info-label">主要ベンダー</div>
                    <div class="info-value">${(org.vendors || []).join(', ')}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">システム更改</div>
                    <div class="info-value">${org.systemRenewal || '-'}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">入札傾向</div>
                    <div class="info-value">${org.bidStyle || '-'}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">組織風土</div>
                    <div class="info-value">${org.culture || '-'}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">DX状況</div>
                    <div class="info-value">${org.dx || '-'}</div>
                </div>
                ${org.website ? `
                <div class="info-item">
                    <a href="${org.website}" target="_blank" class="website-link">🔗 公式サイト</a>
                </div>` : ''}
            `;
        } else {
            const connectedCount = this.links.filter(
                l => l.source.id === d.id || l.target.id === d.id
            ).length;

            panel.innerHTML = `
                <div class="info-item">
                    <div class="info-label">クラスター名</div>
                    <div class="info-value highlight">${d.id}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">タイプ</div>
                    <div class="info-value">${this.getTypeLabel(d.type)}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">接続組織数</div>
                    <div class="info-value">${connectedCount}組織</div>
                </div>
            `;
        }
    }

    formatAssets(assets) {
        if (!assets) return '-';
        if (assets >= 10000) {
            return (assets / 10000).toFixed(1) + '兆円';
        }
        return assets.toLocaleString() + '億円';
    }

    formatValue(metric, value) {
        switch (metric) {
            case '職員数': return value.toLocaleString() + '名';
            case '年収': return value + '万円';
            case '総資産': return this.formatAssets(value);
            case '経常利益': return value.toLocaleString() + '億円';
            case '平均年齢': return value + '歳';
            default: return value;
        }
    }

    getTypeLabel(type) {
        switch (type) {
            case 'vendor': return 'ITベンダー';
            case 'category': return '法人種別';
            case 'investment': return '投資余力';
            case 'aiStatus': return 'AI活用状況';
            case 'culture': return '組織風土';
            case 'bidStyle': return '入札傾向';
            default: return '組織';
        }
    }

    showTooltip(event, d) {
        const tooltip = document.getElementById('tooltip');

        if (d.type === 'heatmap-cell') {
            tooltip.innerHTML = `
                <div class="tooltip-title">${d.data.id}</div>
                <div class="tooltip-content">
                    ${d.metric}: ${this.formatValue(d.metric, d.value)}<br>
                    スコア: ${(d.normalizedValue * 100).toFixed(1)}%
                </div>
            `;
        } else if (d.type === 'organization' && d.data) {
            tooltip.innerHTML = `
                <div class="tooltip-title">${d.id}</div>
                <div class="tooltip-content">
                    職員数: ${d.data.employees?.toLocaleString() || '-'}名<br>
                    年収: ${d.data.salary || '-'}万円<br>
                    総資産: ${this.formatAssets(d.data.assets)}<br>
                    投資余力: ${d.data.investment}<br>
                    AI活用: ${d.data.ai}
                </div>
            `;
        } else {
            const connectedCount = this.links.filter(
                l => l.source.id === d.id || l.target.id === d.id
            ).length;
            tooltip.innerHTML = `
                <div class="tooltip-title">${d.id}</div>
                <div class="tooltip-content">接続: ${connectedCount}組織</div>
            `;
        }

        tooltip.style.left = (event.pageX + 15) + 'px';
        tooltip.style.top = (event.pageY - 10) + 'px';
        tooltip.classList.add('visible');
    }

    hideTooltip() {
        document.getElementById('tooltip').classList.remove('visible');
    }

    updateLegend(filterType) {
        const legendItems = document.getElementById('legendItems');
        let html = '';

        switch (filterType) {
            case 'scatter':
                window.aiStatus.forEach(status => {
                    html += `<div class="legend-item">
                        <span class="legend-color" style="background: ${status.color}; color: ${status.color}"></span>
                        <span>AI活用: ${status.id}</span>
                    </div>`;
                });
                html += `<div class="legend-item">
                    <span class="legend-info">●バブルサイズ = 職員数</span>
                </div>`;
                break;
            case 'timeline':
                window.investmentLevels.forEach(level => {
                    html += `<div class="legend-item">
                        <span class="legend-color" style="background: ${level.color}; color: ${level.color}"></span>
                        <span>${level.id}</span>
                    </div>`;
                });
                html += `<div class="legend-item">
                    <span class="legend-info">●バブルサイズ = 総資産</span>
                </div>`;
                break;
            case 'heatmap':
                html += `<div class="legend-item">
                    <span class="legend-color" style="background: hsl(200, 80%, 30%)"></span>
                    <span>高スコア</span>
                </div>`;
                html += `<div class="legend-item">
                    <span class="legend-color" style="background: hsl(200, 80%, 80%)"></span>
                    <span>低スコア</span>
                </div>`;
                html += `<div class="legend-item">
                    <span class="legend-color" style="background: hsl(0, 80%, 50%)"></span>
                    <span>赤字</span>
                </div>`;
                break;
            case 'culture':
                (window.cultureCategories || []).forEach(cat => {
                    html += `<div class="legend-item">
                        <span class="legend-color" style="background: ${cat.color}; color: ${cat.color}"></span>
                        <span>${cat.id}</span>
                    </div>`;
                });
                break;
            case 'vendorHub':
            case 'vendor':
                const vendorColors = window.vendorColorMap || {};
                Object.entries(vendorColors).slice(0, 8).forEach(([name, color]) => {
                    html += `<div class="legend-item">
                        <span class="legend-color" style="background: ${color}; color: ${color}"></span>
                        <span>${name}</span>
                    </div>`;
                });
                break;
            case 'bidStyle':
                (window.bidStyles || []).forEach(style => {
                    html += `<div class="legend-item">
                        <span class="legend-color" style="background: ${style.color}; color: ${style.color}"></span>
                        <span>${style.id}</span>
                    </div>`;
                });
                break;
            case 'category':
                window.categories.forEach(cat => {
                    html += `<div class="legend-item">
                        <span class="legend-color" style="background: ${cat.color}; color: ${cat.color}"></span>
                        <span>${cat.id}</span>
                    </div>`;
                });
                break;
            case 'investment':
                window.investmentLevels.forEach(level => {
                    html += `<div class="legend-item">
                        <span class="legend-color" style="background: ${level.color}; color: ${level.color}"></span>
                        <span>${level.id}</span>
                    </div>`;
                });
                break;
            case 'ai':
                window.aiStatus.forEach(status => {
                    html += `<div class="legend-item">
                        <span class="legend-color" style="background: ${status.color}; color: ${status.color}"></span>
                        <span>AI活用: ${status.id}</span>
                    </div>`;
                });
                break;
            default:
                window.categories.forEach(cat => {
                    html += `<div class="legend-item">
                        <span class="legend-color" style="background: ${cat.color}; color: ${cat.color}"></span>
                        <span>${cat.id}</span>
                    </div>`;
                });
        }

        legendItems.innerHTML = html;
    }

    updateStats() {
        const orgNodes = this.nodes.filter(n => n.type === 'organization' || n.type === 'heatmap-cell').length;
        const clusterNodes = this.nodes.filter(n =>
            n.type !== 'organization' && n.type !== 'heatmap-cell'
        ).length;

        // ヒートマップの場合は組織数を正しく計算
        let displayOrgCount = orgNodes;
        if (this.currentView === 'heatmap' && this.heatmapConfig) {
            displayOrgCount = this.heatmapConfig.organizations.length;
        }

        document.getElementById('totalNodes').textContent = displayOrgCount;
        document.getElementById('totalLinks').textContent = this.links.length;
        document.getElementById('totalClusters').textContent = clusterNodes;
    }

    setupEventListeners() {
        // フィルター変更
        document.getElementById('filterType').addEventListener('change', (e) => {
            this.currentFilter = e.target.value;
            this.rebuild();
            this.updateLegend(e.target.value);
        });

        // ノードサイズ変更
        document.getElementById('nodeSize').addEventListener('change', (e) => {
            this.nodeSizeMode = e.target.value;
            this.rebuild();
        });

        // リセットボタン
        document.getElementById('resetZoom').addEventListener('click', () => {
            this.svg.transition()
                .duration(750)
                .call(this.zoom.transform, d3.zoomIdentity);
        });

        // ラベル表示切替
        document.getElementById('toggleLabels').addEventListener('click', () => {
            this.showLabels = !this.showLabels;
            this.g.selectAll('.node-label')
                .classed('hidden', !this.showLabels);
        });

        // 画像エクスポート
        document.getElementById('exportImage').addEventListener('click', () => {
            this.exportAsImage();
        });

        // ウィンドウリサイズ
        window.addEventListener('resize', () => {
            const container = document.getElementById('networkContainer');
            this.svg
                .attr('width', container.clientWidth)
                .attr('height', container.clientHeight);

            if (this.simulation) {
                this.simulation.force('center',
                    d3.forceCenter(container.clientWidth / 2, container.clientHeight / 2));
                this.simulation.alpha(0.3).restart();
            }
        });
    }

    exportAsImage() {
        const svgElement = document.getElementById('networkSvg');
        const container = document.getElementById('networkContainer');

        // SVGのクローンを作成
        const clonedSvg = svgElement.cloneNode(true);

        // 背景色を追加
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('width', '100%');
        rect.setAttribute('height', '100%');
        rect.setAttribute('fill', '#0a0e17');
        clonedSvg.insertBefore(rect, clonedSvg.firstChild);

        // スタイルを埋め込み
        const styleText = `
            .node-label { 
                font-family: 'Segoe UI', sans-serif; 
                font-size: 11px; 
                fill: #ffffff; 
                font-weight: 500;
            }
            .node-label.hidden { opacity: 0; }
            .link { stroke-opacity: 0.4; }
        `;
        const style = document.createElementNS('http://www.w3.org/2000/svg', 'style');
        style.textContent = styleText;
        clonedSvg.insertBefore(style, clonedSvg.firstChild);

        // SVGをシリアライズ
        const svgData = new XMLSerializer().serializeToString(clonedSvg);
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const svgUrl = URL.createObjectURL(svgBlob);

        // Canvas に描画
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();

        const width = container.clientWidth;
        const height = container.clientHeight;

        // 高解像度出力のためのスケール（2倍）
        const scale = 2;
        canvas.width = width * scale;
        canvas.height = height * scale;
        ctx.scale(scale, scale);

        img.onload = () => {
            // 背景を描画
            ctx.fillStyle = '#0a0e17';
            ctx.fillRect(0, 0, width, height);

            // SVGを描画
            ctx.drawImage(img, 0, 0, width, height);

            // PNGとしてダウンロード
            const pngUrl = canvas.toDataURL('image/png');
            const downloadLink = document.createElement('a');

            // ファイル名に日時を追加
            const now = new Date();
            const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
            const timeStr = now.toTimeString().slice(0, 5).replace(':', '');
            const filterName = this.currentFilter === 'financial' ? '金融機関' : this.currentFilter;

            downloadLink.href = pngUrl;
            downloadLink.download = `network_${filterName}_${dateStr}_${timeStr}.png`;
            downloadLink.click();

            // クリーンアップ
            URL.revokeObjectURL(svgUrl);
        };

        img.src = svgUrl;
    }

    rebuild() {
        // 既存の要素をクリア
        this.g.selectAll('*').remove();

        // シミュレーション停止
        if (this.simulation) {
            this.simulation.stop();
        }

        // 再構築
        this.buildNetworkData(this.currentFilter);
        this.createSimulation();
        this.render();
        this.updateStats();
    }
}

// 初期化
document.addEventListener('DOMContentLoaded', () => {
    new NetworkNavigator();
});
