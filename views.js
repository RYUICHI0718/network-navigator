// ===== Multiple Visualization Views =====

class VisualizationViews {
    constructor() {
        this.currentView = 'network';
        this.currentFilter = 'all';
    }

    getFilteredData() {
        const data = window.organizationsData;
        if (this.currentFilter === 'financial') {
            const financialIds = window.financialInstitutions || [];
            return data.filter(org => financialIds.includes(org.id));
        }
        return data;
    }

    // ===== ツリーマップビュー =====
    renderTreemap(container) {
        const data = this.getFilteredData();
        const width = container.clientWidth;
        const height = container.clientHeight;

        // 既存のコンテンツをクリア
        d3.select(container).selectAll('*').remove();

        const svg = d3.select(container)
            .append('svg')
            .attr('width', width)
            .attr('height', height);

        // 階層データを作成
        const hierarchyData = {
            name: 'root',
            children: window.categories.map(cat => ({
                name: cat.id,
                color: cat.color,
                children: data
                    .filter(org => org.category === cat.id)
                    .map(org => ({
                        name: org.id,
                        value: org.assets,
                        data: org,
                        color: cat.color
                    }))
            })).filter(cat => cat.children.length > 0)
        };

        const root = d3.hierarchy(hierarchyData)
            .sum(d => d.value)
            .sort((a, b) => b.value - a.value);

        d3.treemap()
            .size([width, height])
            .padding(2)
            .paddingTop(20)(root);

        // カテゴリグループ
        const groups = svg.selectAll('.category-group')
            .data(root.children)
            .join('g')
            .attr('class', 'category-group');

        // カテゴリ背景
        groups.append('rect')
            .attr('x', d => d.x0)
            .attr('y', d => d.y0)
            .attr('width', d => d.x1 - d.x0)
            .attr('height', d => d.y1 - d.y0)
            .attr('fill', d => d.data.color)
            .attr('fill-opacity', 0.1)
            .attr('stroke', d => d.data.color)
            .attr('stroke-width', 2);

        // カテゴリラベル
        groups.append('text')
            .attr('x', d => d.x0 + 5)
            .attr('y', d => d.y0 + 15)
            .text(d => d.data.name)
            .attr('fill', '#ffffff')
            .attr('font-size', '12px')
            .attr('font-weight', 'bold');

        // 組織タイル
        const leaves = svg.selectAll('.leaf')
            .data(root.leaves())
            .join('g')
            .attr('class', 'leaf')
            .attr('transform', d => `translate(${d.x0},${d.y0})`);

        leaves.append('rect')
            .attr('width', d => Math.max(0, d.x1 - d.x0))
            .attr('height', d => Math.max(0, d.y1 - d.y0))
            .attr('fill', d => d.parent.data.color)
            .attr('fill-opacity', 0.7)
            .attr('stroke', '#0a0e17')
            .attr('stroke-width', 1)
            .attr('rx', 3)
            .style('cursor', 'pointer')
            .on('mouseover', (event, d) => this.showTooltip(event, d.data))
            .on('mouseout', () => this.hideTooltip())
            .on('click', (event, d) => this.showInfo(d.data));

        leaves.append('text')
            .attr('x', 4)
            .attr('y', 14)
            .text(d => {
                const w = d.x1 - d.x0;
                if (w < 40) return '';
                const name = d.data.name;
                const maxChars = Math.floor(w / 8);
                return name.length > maxChars ? name.substring(0, maxChars) + '…' : name;
            })
            .attr('fill', '#ffffff')
            .attr('font-size', '10px')
            .style('pointer-events', 'none');

        leaves.append('text')
            .attr('x', 4)
            .attr('y', 26)
            .text(d => {
                const w = d.x1 - d.x0;
                if (w < 50) return '';
                return d.data.data ? `${d.data.data.assets.toLocaleString()}億円` : '';
            })
            .attr('fill', 'rgba(255,255,255,0.7)')
            .attr('font-size', '9px')
            .style('pointer-events', 'none');
    }

    // ===== バブルチャートビュー =====
    renderBubbleChart(container) {
        const data = this.getFilteredData();
        const width = container.clientWidth;
        const height = container.clientHeight;

        d3.select(container).selectAll('*').remove();

        const svg = d3.select(container)
            .append('svg')
            .attr('width', width)
            .attr('height', height);

        // パックレイアウト用データ
        const hierarchyData = {
            name: 'root',
            children: window.categories.map(cat => ({
                name: cat.id,
                color: cat.color,
                children: data
                    .filter(org => org.category === cat.id)
                    .map(org => ({
                        name: org.id,
                        value: org.employees,
                        data: org,
                        color: cat.color
                    }))
            })).filter(cat => cat.children.length > 0)
        };

        const root = d3.hierarchy(hierarchyData)
            .sum(d => d.value)
            .sort((a, b) => b.value - a.value);

        d3.pack()
            .size([width - 20, height - 20])
            .padding(3)(root);

        // カテゴリの円
        svg.selectAll('.category-circle')
            .data(root.children)
            .join('circle')
            .attr('class', 'category-circle')
            .attr('cx', d => d.x + 10)
            .attr('cy', d => d.y + 10)
            .attr('r', d => d.r)
            .attr('fill', d => d.data.color)
            .attr('fill-opacity', 0.1)
            .attr('stroke', d => d.data.color)
            .attr('stroke-width', 2);

        // カテゴリラベル
        svg.selectAll('.category-label')
            .data(root.children)
            .join('text')
            .attr('class', 'category-label')
            .attr('x', d => d.x + 10)
            .attr('y', d => d.y - d.r + 25)
            .attr('text-anchor', 'middle')
            .text(d => d.data.name)
            .attr('fill', '#ffffff')
            .attr('font-size', '12px')
            .attr('font-weight', 'bold');

        // 組織バブル
        const bubbles = svg.selectAll('.bubble')
            .data(root.leaves())
            .join('g')
            .attr('class', 'bubble')
            .attr('transform', d => `translate(${d.x + 10},${d.y + 10})`);

        bubbles.append('circle')
            .attr('r', d => d.r)
            .attr('fill', d => d.parent.data.color)
            .attr('fill-opacity', 0.7)
            .attr('stroke', '#ffffff')
            .attr('stroke-width', 1)
            .style('cursor', 'pointer')
            .on('mouseover', (event, d) => this.showTooltip(event, d.data))
            .on('mouseout', () => this.hideTooltip())
            .on('click', (event, d) => this.showInfo(d.data));

        bubbles.append('text')
            .attr('text-anchor', 'middle')
            .attr('dy', '0.3em')
            .text(d => {
                if (d.r < 20) return '';
                const name = d.data.name;
                const maxChars = Math.floor(d.r / 5);
                return name.length > maxChars ? name.substring(0, maxChars) + '…' : name;
            })
            .attr('fill', '#ffffff')
            .attr('font-size', d => Math.min(11, d.r / 3) + 'px')
            .style('pointer-events', 'none');
    }

    // ===== 散布図ビュー =====
    renderScatterPlot(container) {
        const data = this.getFilteredData();
        const width = container.clientWidth;
        const height = container.clientHeight;
        const margin = { top: 40, right: 40, bottom: 60, left: 80 };

        d3.select(container).selectAll('*').remove();

        const svg = d3.select(container)
            .append('svg')
            .attr('width', width)
            .attr('height', height);

        const innerWidth = width - margin.left - margin.right;
        const innerHeight = height - margin.top - margin.bottom;

        const g = svg.append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        // スケール
        const xScale = d3.scaleLog()
            .domain([10, d3.max(data, d => d.employees) * 1.2])
            .range([0, innerWidth]);

        const yScale = d3.scaleLog()
            .domain([10, d3.max(data, d => d.assets) * 1.2])
            .range([innerHeight, 0]);

        const rScale = d3.scaleSqrt()
            .domain([0, d3.max(data, d => d.employees)])
            .range([5, 40]);

        // グリッド
        g.append('g')
            .attr('class', 'grid')
            .selectAll('line')
            .data(yScale.ticks(5))
            .join('line')
            .attr('x1', 0)
            .attr('x2', innerWidth)
            .attr('y1', d => yScale(d))
            .attr('y2', d => yScale(d))
            .attr('stroke', 'rgba(255,255,255,0.1)');

        g.append('g')
            .attr('class', 'grid')
            .selectAll('line')
            .data(xScale.ticks(5))
            .join('line')
            .attr('x1', d => xScale(d))
            .attr('x2', d => xScale(d))
            .attr('y1', 0)
            .attr('y2', innerHeight)
            .attr('stroke', 'rgba(255,255,255,0.1)');

        // X軸
        g.append('g')
            .attr('transform', `translate(0,${innerHeight})`)
            .call(d3.axisBottom(xScale).ticks(5).tickFormat(d3.format('.0s')))
            .selectAll('text, line, path')
            .attr('stroke', '#8892a6')
            .attr('fill', '#8892a6');

        g.append('text')
            .attr('x', innerWidth / 2)
            .attr('y', innerHeight + 45)
            .attr('text-anchor', 'middle')
            .attr('fill', '#ffffff')
            .text('職員数（人）');

        // Y軸
        g.append('g')
            .call(d3.axisLeft(yScale).ticks(5).tickFormat(d3.format('.0s')))
            .selectAll('text, line, path')
            .attr('stroke', '#8892a6')
            .attr('fill', '#8892a6');

        g.append('text')
            .attr('transform', 'rotate(-90)')
            .attr('x', -innerHeight / 2)
            .attr('y', -60)
            .attr('text-anchor', 'middle')
            .attr('fill', '#ffffff')
            .text('総資産（億円）');

        // データポイント
        const dots = g.selectAll('.dot')
            .data(data)
            .join('g')
            .attr('class', 'dot')
            .attr('transform', d => `translate(${xScale(d.employees)},${yScale(d.assets)})`);

        dots.append('circle')
            .attr('r', d => rScale(d.employees))
            .attr('fill', d => {
                const cat = window.categories.find(c => c.id === d.category);
                return cat ? cat.color : '#8892a6';
            })
            .attr('fill-opacity', 0.7)
            .attr('stroke', '#ffffff')
            .attr('stroke-width', 1)
            .style('cursor', 'pointer')
            .on('mouseover', (event, d) => this.showTooltip(event, { data: d, name: d.id }))
            .on('mouseout', () => this.hideTooltip())
            .on('click', (event, d) => this.showInfo({ data: d, name: d.id }));

        // 凡例
        const legend = svg.append('g')
            .attr('transform', `translate(${width - 150}, 20)`);

        window.categories.forEach((cat, i) => {
            const row = legend.append('g')
                .attr('transform', `translate(0, ${i * 20})`);

            row.append('circle')
                .attr('r', 6)
                .attr('fill', cat.color);

            row.append('text')
                .attr('x', 12)
                .attr('y', 4)
                .attr('fill', '#ffffff')
                .attr('font-size', '11px')
                .text(cat.id.length > 10 ? cat.id.substring(0, 10) + '…' : cat.id);
        });
    }

    // ===== ランキングビュー =====
    renderRanking(container) {
        const data = this.getFilteredData();

        d3.select(container).selectAll('*').remove();

        const wrapper = d3.select(container)
            .append('div')
            .attr('class', 'ranking-wrapper');

        // 資産ランキング
        const assetsRanking = [...data].sort((a, b) => b.assets - a.assets).slice(0, 10);
        this.createRankingTable(wrapper, '💰 総資産トップ10', assetsRanking, 'assets', '億円');

        // 職員数ランキング
        const employeesRanking = [...data].sort((a, b) => b.employees - a.employees).slice(0, 10);
        this.createRankingTable(wrapper, '👥 職員数トップ10', employeesRanking, 'employees', '名');
    }

    createRankingTable(wrapper, title, data, field, unit) {
        const section = wrapper.append('div')
            .attr('class', 'ranking-section');

        section.append('h3')
            .attr('class', 'ranking-title')
            .text(title);

        const table = section.append('table')
            .attr('class', 'ranking-table');

        const rows = table.selectAll('tr')
            .data(data)
            .join('tr')
            .attr('class', 'ranking-row')
            .on('click', (event, d) => this.showInfo({ data: d, name: d.id }));

        rows.append('td')
            .attr('class', 'ranking-rank')
            .text((d, i) => i + 1);

        rows.append('td')
            .attr('class', 'ranking-name')
            .text(d => d.id);

        rows.append('td')
            .attr('class', 'ranking-category')
            .text(d => d.category.substring(0, 6));

        rows.append('td')
            .attr('class', 'ranking-value')
            .html(d => `<span class="value-number">${d[field].toLocaleString()}</span><span class="value-unit">${unit}</span>`);

        // 投資余力バッジ
        rows.append('td')
            .attr('class', 'ranking-badge')
            .html(d => {
                const badgeClass = d.investment === '極めて高い' ? 'badge-high' : 'badge-medium';
                return `<span class="info-badge ${badgeClass}">${d.investment}</span>`;
            });
    }

    // ===== 5軸評価ビュー =====
    renderEvaluation(container) {
        const data = this.getFilteredData();

        d3.select(container).selectAll('*').remove();

        const wrapper = d3.select(container)
            .append('div')
            .attr('class', 'evaluation-wrapper');

        // ヘッダー説明
        const header = wrapper.append('div')
            .attr('class', 'evaluation-header');

        header.append('h3')
            .text('🎯 AI提案5軸評価ダッシュボード');

        header.append('p')
            .attr('class', 'evaluation-subtitle')
            .text('各組織のAI提案適性を5軸で評価。クリックでレーダーチャート表示');

        // 組織カード一覧
        const cardsContainer = wrapper.append('div')
            .attr('class', 'evaluation-cards');

        // スコア計算してソート
        const scoredData = data.map(org => ({
            ...org,
            scores: window.calculateEvaluationScores(org),
            evalRank: window.getEvaluationRank(window.calculateEvaluationScores(org).total)
        })).sort((a, b) => b.scores.total - a.scores.total);

        scoredData.forEach((org, index) => {
            const card = cardsContainer.append('div')
                .attr('class', `evaluation-card rank-${org.evalRank.rank}`)
                .style('animation-delay', `${index * 0.05}s`)
                .on('click', () => this.showEvaluationDetail(org));

            // ランクバッジ
            card.append('div')
                .attr('class', 'eval-rank-badge')
                .style('background', org.evalRank.color)
                .text(org.evalRank.rank);

            // 組織情報
            const info = card.append('div')
                .attr('class', 'eval-card-info');

            info.append('div')
                .attr('class', 'eval-org-name')
                .text(org.id);

            info.append('div')
                .attr('class', 'eval-org-category')
                .text(org.category);

            // スコアバー
            const scoreBar = card.append('div')
                .attr('class', 'eval-score-bar');

            const maxScore = 25;
            const percentage = (org.scores.total / maxScore) * 100;

            scoreBar.append('div')
                .attr('class', 'eval-score-fill')
                .style('width', `${percentage}%`)
                .style('background', `linear-gradient(90deg, ${org.evalRank.color}, ${org.evalRank.color}aa)`);

            scoreBar.append('span')
                .attr('class', 'eval-score-text')
                .text(`${org.scores.total}/25`);

            // ミニ軸スコア
            const miniAxes = card.append('div')
                .attr('class', 'eval-mini-axes');

            const axes = [
                { key: 'physical', label: '物理', color: '#00d4ff' },
                { key: 'urgency', label: '切迫', color: '#ff6b9d' },
                { key: 'nttAffinity', label: 'NTT', color: '#00ff88' },
                { key: 'itLiteracy', label: 'IT力', color: '#7b2fff' },
                { key: 'budget', label: '予算', color: '#ffb800' }
            ];

            axes.forEach(axis => {
                const axisDiv = miniAxes.append('div')
                    .attr('class', 'mini-axis');

                axisDiv.append('span')
                    .attr('class', 'mini-axis-label')
                    .text(axis.label);

                axisDiv.append('span')
                    .attr('class', 'mini-axis-value')
                    .style('color', org.scores[axis.key] >= 4 ? axis.color : '#8892a6')
                    .text(org.scores[axis.key]);
            });
        });

        // 凡例
        const legend = wrapper.append('div')
            .attr('class', 'evaluation-legend');

        const ranks = [
            { rank: 'S', label: '最優先 (20+)', color: '#ff6b9d' },
            { rank: 'A', label: '要攻略 (16-19)', color: '#00ff88' },
            { rank: 'B', label: '検討 (12-15)', color: '#00d4ff' },
            { rank: 'C', label: '様子見 (8-11)', color: '#ffb800' },
            { rank: 'D', label: '静観 (0-7)', color: '#8892a6' }
        ];

        ranks.forEach(r => {
            const item = legend.append('div')
                .attr('class', 'legend-item');

            item.append('span')
                .attr('class', 'eval-rank-mini')
                .style('background', r.color)
                .text(r.rank);

            item.append('span')
                .text(r.label);
        });
    }

    showEvaluationDetail(org) {
        const panel = document.getElementById('panelContent');
        const scores = org.scores;
        const evalRank = org.evalRank;

        // レーダーチャートのSVG生成
        const radarSize = 180;
        const centerX = radarSize / 2;
        const centerY = radarSize / 2;
        const radius = 70;

        const axes = [
            { key: 'physical', label: '物理適合' },
            { key: 'urgency', label: '切迫度' },
            { key: 'nttAffinity', label: 'NTT親和性' },
            { key: 'itLiteracy', label: '現場IT力' },
            { key: 'budget', label: '予算規模' }
        ];

        const angleSlice = (Math.PI * 2) / axes.length;

        // レーダーチャートのパス生成
        const radarPoints = axes.map((axis, i) => {
            const value = scores[axis.key] / 5;
            const angle = angleSlice * i - Math.PI / 2;
            return {
                x: centerX + radius * value * Math.cos(angle),
                y: centerY + radius * value * Math.sin(angle)
            };
        });

        const radarPath = radarPoints.map((p, i) =>
            `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`
        ).join(' ') + ' Z';

        // グリッド生成
        const gridLevels = [0.2, 0.4, 0.6, 0.8, 1.0];
        const gridPaths = gridLevels.map(level => {
            const points = axes.map((_, i) => {
                const angle = angleSlice * i - Math.PI / 2;
                return {
                    x: centerX + radius * level * Math.cos(angle),
                    y: centerY + radius * level * Math.sin(angle)
                };
            });
            return points.map((p, i) =>
                `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`
            ).join(' ') + ' Z';
        });

        // 軸ラベル位置
        const labelPoints = axes.map((axis, i) => {
            const angle = angleSlice * i - Math.PI / 2;
            return {
                x: centerX + (radius + 25) * Math.cos(angle),
                y: centerY + (radius + 25) * Math.sin(angle),
                label: axis.label,
                value: scores[axis.key]
            };
        });

        panel.innerHTML = `
            <div class="eval-detail-header">
                <div class="eval-rank-large" style="background: ${evalRank.color}">${evalRank.rank}</div>
                <div>
                    <div class="info-value highlight">${org.id}</div>
                    <div class="info-label">${evalRank.label} (${scores.total}/25点)</div>
                </div>
            </div>

            <div class="radar-chart-container">
                <svg width="${radarSize}" height="${radarSize}" class="radar-chart">
                    <!-- グリッド -->
                    ${gridPaths.map((path, i) => `
                        <path d="${path}" fill="none" stroke="rgba(255,255,255,${0.1 + i * 0.05})" stroke-width="1"/>
                    `).join('')}
                    
                    <!-- 軸線 -->
                    ${axes.map((_, i) => {
            const angle = angleSlice * i - Math.PI / 2;
            return `<line x1="${centerX}" y1="${centerY}" 
                                      x2="${centerX + radius * Math.cos(angle)}" 
                                      y2="${centerY + radius * Math.sin(angle)}" 
                                      stroke="rgba(255,255,255,0.2)" stroke-width="1"/>`;
        }).join('')}
                    
                    <!-- データエリア -->
                    <path d="${radarPath}" fill="${evalRank.color}" fill-opacity="0.3" 
                          stroke="${evalRank.color}" stroke-width="2"/>
                    
                    <!-- データポイント -->
                    ${radarPoints.map(p => `
                        <circle cx="${p.x}" cy="${p.y}" r="4" fill="${evalRank.color}"/>
                    `).join('')}
                </svg>
                
                <!-- 軸ラベル -->
                <div class="radar-labels">
                    ${labelPoints.map(p => `
                        <div class="radar-label" style="left: ${p.x}px; top: ${p.y}px;">
                            <span class="label-name">${p.label}</span>
                            <span class="label-value" style="color: ${p.value >= 4 ? evalRank.color : '#8892a6'}">${p.value}</span>
                        </div>
                    `).join('')}
                </div>
            </div>

            <div class="eval-detail-scores">
                <div class="score-row">
                    <span class="score-label">① 物理適合</span>
                    <div class="score-bar-small">
                        <div class="score-fill-small" style="width: ${scores.physical * 20}%; background: #00d4ff"></div>
                    </div>
                    <span class="score-value">${scores.physical}/5</span>
                </div>
                <div class="score-row">
                    <span class="score-label">② 切迫度</span>
                    <div class="score-bar-small">
                        <div class="score-fill-small" style="width: ${scores.urgency * 20}%; background: #ff6b9d"></div>
                    </div>
                    <span class="score-value">${scores.urgency}/5</span>
                </div>
                <div class="score-row">
                    <span class="score-label">③ NTT親和性</span>
                    <div class="score-bar-small">
                        <div class="score-fill-small" style="width: ${scores.nttAffinity * 20}%; background: #00ff88"></div>
                    </div>
                    <span class="score-value">${scores.nttAffinity}/5</span>
                </div>
                <div class="score-row">
                    <span class="score-label">④ 現場IT力</span>
                    <div class="score-bar-small">
                        <div class="score-fill-small" style="width: ${scores.itLiteracy * 20}%; background: #7b2fff"></div>
                    </div>
                    <span class="score-value">${scores.itLiteracy}/5</span>
                </div>
                <div class="score-row">
                    <span class="score-label">⑤ 予算規模</span>
                    <div class="score-bar-small">
                        <div class="score-fill-small" style="width: ${scores.budget * 20}%; background: #ffb800"></div>
                    </div>
                    <span class="score-value">${scores.budget}/5</span>
                </div>
            </div>

            <div class="info-item">
                <div class="info-label">主要業務</div>
                <div class="info-value">${org.business || '-'}</div>
            </div>
            <div class="info-item">
                <div class="info-label">AI活用</div>
                <div class="info-value"><span class="info-badge ${org.ai === 'あり' ? 'badge-high' : 'badge-medium'}">${org.ai}</span></div>
            </div>
            <div class="info-item">
                <div class="info-label">システム更改</div>
                <div class="info-value">${org.systemRenewal || '-'}</div>
            </div>
        `;
    }

    // ===== 統計分析ビュー =====
    renderStatistics(container) {
        const data = this.getFilteredData();
        d3.select(container).selectAll('*').remove();

        const wrapper = d3.select(container)
            .append('div')
            .attr('class', 'statistics-wrapper');

        // 変数定義
        const variables = [
            { key: 'employees', name: '職員数', unit: '人', format: d => d.toLocaleString() },
            { key: 'age', name: '平均年齢', unit: '歳', format: d => d.toFixed(1) },
            { key: 'salary', name: '年収', unit: '万円', format: d => d.toLocaleString() },
            { key: 'assets', name: '総資産', unit: '億円', format: d => d >= 10000 ? (d / 10000).toFixed(1) + '兆' : d.toLocaleString() },
            { key: 'profit', name: '利益', unit: '億円', format: d => d >= 10000 ? (d / 10000).toFixed(1) + '兆' : d.toLocaleString() }
        ];

        // ヘッダー
        wrapper.append('div')
            .attr('class', 'stats-header')
            .html('<h3>📊 統計分析ダッシュボード</h3><p class="stats-subtitle">16組織の定量データ統計サマリー</p>');

        // サマリーカード
        const cardsContainer = wrapper.append('div')
            .attr('class', 'stats-cards');

        variables.forEach(v => {
            const values = data.map(d => d[v.key]).filter(x => x != null && !isNaN(x));
            const stats = this.calculateStats(values);
            this.createStatCard(cardsContainer, v, stats);
        });

        // 詳細テーブル
        wrapper.append('div')
            .attr('class', 'stats-section-title')
            .text('📋 詳細統計量');

        this.createStatsTable(wrapper, data, variables);

        // ヒストグラムセクション
        wrapper.append('div')
            .attr('class', 'stats-section-title')
            .text('📈 分布（ヒストグラム）');

        const histContainer = wrapper.append('div')
            .attr('class', 'histogram-container');

        // 変数選択ドロップダウン
        const selector = histContainer.append('select')
            .attr('class', 'histogram-selector')
            .on('change', (event) => {
                const selectedVar = variables.find(v => v.key === event.target.value);
                const values = data.map(d => d[selectedVar.key]).filter(x => x != null && !isNaN(x));
                this.renderHistogram(histogramBody, values, selectedVar);
            });

        variables.forEach(v => {
            selector.append('option')
                .attr('value', v.key)
                .text(`${v.name}（${v.unit}）`);
        });

        const histogramBody = histContainer.append('div')
            .attr('class', 'histogram-body');

        // 初期ヒストグラム描画
        const initialVar = variables[0];
        const initialValues = data.map(d => d[initialVar.key]).filter(x => x != null && !isNaN(x));
        this.renderHistogram(histogramBody, initialValues, initialVar);

        // 相関行列セクション
        wrapper.append('div')
            .attr('class', 'stats-section-title')
            .text('🔗 相関行列');

        this.renderCorrelationMatrix(wrapper, data, variables);

        // カテゴリ別統計セクション
        wrapper.append('div')
            .attr('class', 'stats-section-title')
            .text('🏛️ 法人種別ごとの統計比較');

        this.renderCategoryStats(wrapper, data, variables);

        // PCA分析セクション
        wrapper.append('div')
            .attr('class', 'stats-section-title')
            .text('🔬 主成分分析（PCA）');

        this.renderPCA(wrapper, data, variables);
    }

    calculateStats(values) {
        const n = values.length;
        if (n === 0) return null;

        const sorted = [...values].sort((a, b) => a - b);
        const sum = values.reduce((a, b) => a + b, 0);
        const mean = sum / n;

        // 分散・標準偏差
        const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
        const variance = squaredDiffs.reduce((a, b) => a + b, 0) / n;
        const stdDev = Math.sqrt(variance);

        // 四分位数
        const q1 = sorted[Math.floor(n * 0.25)];
        const median = n % 2 === 0
            ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2
            : sorted[Math.floor(n / 2)];
        const q3 = sorted[Math.floor(n * 0.75)];
        const iqr = q3 - q1;

        // 歪度
        const cubedDiffs = values.map(v => Math.pow((v - mean) / stdDev, 3));
        const skewness = cubedDiffs.reduce((a, b) => a + b, 0) / n;

        // 尖度
        const fourthDiffs = values.map(v => Math.pow((v - mean) / stdDev, 4));
        const kurtosis = fourthDiffs.reduce((a, b) => a + b, 0) / n - 3;

        return {
            n,
            min: sorted[0],
            max: sorted[n - 1],
            range: sorted[n - 1] - sorted[0],
            sum,
            mean,
            median,
            variance,
            stdDev,
            q1,
            q3,
            iqr,
            skewness,
            kurtosis,
            cv: (stdDev / mean) * 100 // 変動係数
        };
    }

    createStatCard(container, variable, stats) {
        const card = container.append('div')
            .attr('class', 'stat-card');

        card.append('div')
            .attr('class', 'stat-card-header')
            .html(`<span class="stat-card-icon">${this.getVariableIcon(variable.key)}</span>${variable.name}`);

        const body = card.append('div')
            .attr('class', 'stat-card-body');

        body.append('div')
            .attr('class', 'stat-main-value')
            .html(`<span class="label">平均</span><span class="value">${variable.format(stats.mean)}</span><span class="unit">${variable.unit}</span>`);

        body.append('div')
            .attr('class', 'stat-sub-values')
            .html(`
                <div><span class="label">中央値</span><span class="value">${variable.format(stats.median)}</span></div>
                <div><span class="label">標準偏差</span><span class="value">${variable.format(stats.stdDev)}</span></div>
                <div><span class="label">最小</span><span class="value">${variable.format(stats.min)}</span></div>
                <div><span class="label">最大</span><span class="value">${variable.format(stats.max)}</span></div>
            `);
    }

    getVariableIcon(key) {
        const icons = {
            employees: '👥',
            age: '🎂',
            salary: '💰',
            assets: '🏛️',
            profit: '📈'
        };
        return icons[key] || '📊';
    }

    createStatsTable(container, data, variables) {
        const table = container.append('div')
            .attr('class', 'stats-table-wrapper')
            .append('table')
            .attr('class', 'stats-detail-table');

        // ヘッダー
        const headerRow = table.append('thead').append('tr');
        headerRow.append('th').text('統計量');
        variables.forEach(v => {
            headerRow.append('th').text(`${v.name}（${v.unit}）`);
        });

        // データ行
        const tbody = table.append('tbody');
        const statRows = [
            { label: '件数 (N)', key: 'n', format: d => d },
            { label: '平均', key: 'mean', format: (d, v) => v.format(d) },
            { label: '中央値', key: 'median', format: (d, v) => v.format(d) },
            { label: '標準偏差', key: 'stdDev', format: (d, v) => v.format(d) },
            { label: '分散', key: 'variance', format: d => d.toExponential(2) },
            { label: '最小値', key: 'min', format: (d, v) => v.format(d) },
            { label: '最大値', key: 'max', format: (d, v) => v.format(d) },
            { label: '範囲', key: 'range', format: (d, v) => v.format(d) },
            { label: '第1四分位 (Q1)', key: 'q1', format: (d, v) => v.format(d) },
            { label: '第3四分位 (Q3)', key: 'q3', format: (d, v) => v.format(d) },
            { label: '四分位範囲 (IQR)', key: 'iqr', format: (d, v) => v.format(d) },
            { label: '歪度', key: 'skewness', format: d => d.toFixed(3) },
            { label: '尖度', key: 'kurtosis', format: d => d.toFixed(3) },
            { label: '変動係数 (%)', key: 'cv', format: d => d.toFixed(1) + '%' }
        ];

        // 各変数の統計量を事前計算
        const allStats = {};
        variables.forEach(v => {
            const values = data.map(d => d[v.key]).filter(x => x != null && !isNaN(x));
            allStats[v.key] = this.calculateStats(values);
        });

        statRows.forEach(row => {
            const tr = tbody.append('tr');
            tr.append('td').attr('class', 'stat-label').text(row.label);
            variables.forEach(v => {
                const stats = allStats[v.key];
                const value = stats ? row.format(stats[row.key], v) : '-';
                tr.append('td').text(value);
            });
        });
    }

    renderHistogram(container, values, variable) {
        container.selectAll('*').remove();

        const width = 500;
        const height = 250;
        const margin = { top: 20, right: 30, bottom: 40, left: 50 };
        const innerWidth = width - margin.left - margin.right;
        const innerHeight = height - margin.top - margin.bottom;

        const svg = container.append('svg')
            .attr('width', width)
            .attr('height', height);

        const g = svg.append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        // ビンを作成
        const bins = d3.bin()
            .domain(d3.extent(values))
            .thresholds(8)(values);

        const x = d3.scaleLinear()
            .domain([bins[0].x0, bins[bins.length - 1].x1])
            .range([0, innerWidth]);

        const y = d3.scaleLinear()
            .domain([0, d3.max(bins, d => d.length)])
            .range([innerHeight, 0]);

        // バー
        g.selectAll('.bar')
            .data(bins)
            .join('rect')
            .attr('class', 'histogram-bar')
            .attr('x', d => x(d.x0) + 1)
            .attr('y', d => y(d.length))
            .attr('width', d => Math.max(0, x(d.x1) - x(d.x0) - 2))
            .attr('height', d => innerHeight - y(d.length))
            .attr('fill', '#00d4ff')
            .attr('fill-opacity', 0.7);

        // X軸
        g.append('g')
            .attr('transform', `translate(0,${innerHeight})`)
            .call(d3.axisBottom(x).ticks(6).tickFormat(d => variable.format(d)))
            .selectAll('text, line, path')
            .attr('stroke', '#8892a6')
            .attr('fill', '#8892a6');

        // Y軸
        g.append('g')
            .call(d3.axisLeft(y).ticks(5))
            .selectAll('text, line, path')
            .attr('stroke', '#8892a6')
            .attr('fill', '#8892a6');

        // 軸ラベル
        g.append('text')
            .attr('x', innerWidth / 2)
            .attr('y', innerHeight + 35)
            .attr('text-anchor', 'middle')
            .attr('fill', '#ffffff')
            .attr('font-size', '12px')
            .text(`${variable.name}（${variable.unit}）`);

        g.append('text')
            .attr('transform', 'rotate(-90)')
            .attr('x', -innerHeight / 2)
            .attr('y', -35)
            .attr('text-anchor', 'middle')
            .attr('fill', '#ffffff')
            .attr('font-size', '12px')
            .text('度数');

        // 統計情報表示
        const stats = this.calculateStats(values);
        const statsInfo = container.append('div')
            .attr('class', 'histogram-stats');

        statsInfo.html(`
            <span>μ = ${variable.format(stats.mean)}</span>
            <span>σ = ${variable.format(stats.stdDev)}</span>
            <span>Med = ${variable.format(stats.median)}</span>
            <span>歪度 = ${stats.skewness.toFixed(2)}</span>
        `);
    }

    renderCorrelationMatrix(container, data, variables) {
        const matrixContainer = container.append('div')
            .attr('class', 'correlation-container');

        // 相関係数を計算
        const correlations = {};
        variables.forEach(v1 => {
            correlations[v1.key] = {};
            variables.forEach(v2 => {
                correlations[v1.key][v2.key] = this.calculateCorrelation(
                    data.map(d => d[v1.key]),
                    data.map(d => d[v2.key])
                );
            });
        });

        // ヒートマップ
        const size = 60;
        const width = variables.length * size + 80;
        const height = variables.length * size + 80;

        const svg = matrixContainer.append('svg')
            .attr('width', width)
            .attr('height', height);

        const g = svg.append('g')
            .attr('transform', 'translate(80, 60)');

        // カラースケール
        const colorScale = d3.scaleLinear()
            .domain([-1, 0, 1])
            .range(['#ff6b9d', '#1a1f2e', '#00ff88']);

        // セル
        variables.forEach((v1, i) => {
            variables.forEach((v2, j) => {
                const corr = correlations[v1.key][v2.key];

                g.append('rect')
                    .attr('x', j * size)
                    .attr('y', i * size)
                    .attr('width', size - 2)
                    .attr('height', size - 2)
                    .attr('fill', colorScale(corr))
                    .attr('rx', 4);

                g.append('text')
                    .attr('x', j * size + size / 2)
                    .attr('y', i * size + size / 2)
                    .attr('text-anchor', 'middle')
                    .attr('dominant-baseline', 'middle')
                    .attr('fill', Math.abs(corr) > 0.5 ? '#ffffff' : '#8892a6')
                    .attr('font-size', '11px')
                    .attr('font-weight', 'bold')
                    .text(corr.toFixed(2));
            });
        });

        // 列ラベル
        variables.forEach((v, i) => {
            svg.append('text')
                .attr('x', 80 + i * size + size / 2)
                .attr('y', 40)
                .attr('text-anchor', 'middle')
                .attr('fill', '#ffffff')
                .attr('font-size', '11px')
                .text(v.name);
        });

        // 行ラベル
        variables.forEach((v, i) => {
            svg.append('text')
                .attr('x', 75)
                .attr('y', 60 + i * size + size / 2)
                .attr('text-anchor', 'end')
                .attr('dominant-baseline', 'middle')
                .attr('fill', '#ffffff')
                .attr('font-size', '11px')
                .text(v.name);
        });

        // 凡例
        const legendContainer = matrixContainer.append('div')
            .attr('class', 'correlation-legend');

        legendContainer.html(`
            <span class="corr-neg">-1.0</span>
            <div class="corr-gradient"></div>
            <span class="corr-pos">+1.0</span>
        `);
    }

    calculateCorrelation(x, y) {
        const n = x.length;
        const filtered = x.map((xi, i) => ({ x: xi, y: y[i] }))
            .filter(d => d.x != null && d.y != null && !isNaN(d.x) && !isNaN(d.y));

        if (filtered.length < 2) return 0;

        const xVals = filtered.map(d => d.x);
        const yVals = filtered.map(d => d.y);

        const xMean = xVals.reduce((a, b) => a + b, 0) / filtered.length;
        const yMean = yVals.reduce((a, b) => a + b, 0) / filtered.length;

        let num = 0, denX = 0, denY = 0;
        for (let i = 0; i < filtered.length; i++) {
            const dx = xVals[i] - xMean;
            const dy = yVals[i] - yMean;
            num += dx * dy;
            denX += dx * dx;
            denY += dy * dy;
        }

        const den = Math.sqrt(denX * denY);
        return den === 0 ? 0 : num / den;
    }

    renderCategoryStats(container, data, variables) {
        const categoryContainer = container.append('div')
            .attr('class', 'category-stats-container');

        // カテゴリの説明
        const categoryDescriptions = {
            '中期目標管理法人': '主務大臣が3〜5年の中期目標を設定し、自主的に業務運営を行う独立行政法人',
            '行政執行法人': '国の行政事務を確実に執行するため、大臣の強い関与のもとで年度目標を立てて業務を行う法人',
            '国立研究開発法人': '研究開発を主目的とし、長期的視点で成果の最大化を図る法人',
            '特殊会社': '政府が株式の過半を保有する株式会社形態の法人。民間的手法で公的役割を果たす',
            '特殊法人': '特別な法律に基づいて設立された公法人（日銀、年金機構など）'
        };

        // カテゴリ別にデータをグループ化
        const categories = window.categories || [];
        const categoryStats = {};

        categories.forEach(cat => {
            const catData = data.filter(d => d.category === cat.id);
            if (catData.length > 0) {
                categoryStats[cat.id] = {
                    color: cat.color,
                    count: catData.length,
                    stats: {}
                };
                variables.forEach(v => {
                    const values = catData.map(d => d[v.key]).filter(x => x != null && !isNaN(x));
                    if (values.length > 0) {
                        categoryStats[cat.id].stats[v.key] = {
                            mean: values.reduce((a, b) => a + b, 0) / values.length,
                            min: Math.min(...values),
                            max: Math.max(...values)
                        };
                    }
                });
            }
        });

        // カテゴリ説明カード
        const legendSection = categoryContainer.append('div')
            .attr('class', 'category-legend-section');

        legendSection.append('div')
            .attr('class', 'category-legend-title')
            .text('📖 法人種別の定義');

        const legendGrid = legendSection.append('div')
            .attr('class', 'category-legend-grid');

        Object.entries(categoryStats).forEach(([catId, catData]) => {
            const card = legendGrid.append('div')
                .attr('class', 'category-legend-card')
                .style('border-left-color', catData.color);

            card.append('div')
                .attr('class', 'category-legend-name')
                .html(`<span class="cat-dot" style="background:${catData.color}"></span>${catId} <span class="cat-count">(${catData.count}組織)</span>`);

            card.append('div')
                .attr('class', 'category-legend-desc')
                .text(categoryDescriptions[catId] || '');
        });

        // カテゴリ別比較チャート
        categoryContainer.append('div')
            .attr('class', 'category-chart-title')
            .text('📊 カテゴリ別平均値の比較');

        const chartWrapper = categoryContainer.append('div')
            .attr('class', 'category-chart-wrapper');

        // 変数選択
        const varSelector = chartWrapper.append('select')
            .attr('class', 'category-var-selector')
            .on('change', (event) => {
                const selectedVar = variables.find(v => v.key === event.target.value);
                this.updateCategoryChart(chartBody, categoryStats, selectedVar);
            });

        variables.forEach(v => {
            varSelector.append('option')
                .attr('value', v.key)
                .text(`${v.name}（${v.unit}）`);
        });

        const chartBody = chartWrapper.append('div')
            .attr('class', 'category-chart-body');

        // 初期チャート描画
        this.updateCategoryChart(chartBody, categoryStats, variables[0]);

        // カテゴリ別統計テーブル
        categoryContainer.append('div')
            .attr('class', 'category-table-title')
            .text('📋 カテゴリ別詳細統計');

        this.createCategoryTable(categoryContainer, categoryStats, variables);
    }

    updateCategoryChart(container, categoryStats, variable) {
        container.selectAll('*').remove();

        const catIds = Object.keys(categoryStats);
        const values = catIds.map(id => categoryStats[id].stats[variable.key]?.mean || 0);
        const maxVal = Math.max(...values);

        const chartBars = container.append('div')
            .attr('class', 'category-bars');

        catIds.forEach(catId => {
            const catData = categoryStats[catId];
            const value = catData.stats[variable.key]?.mean || 0;
            const percentage = maxVal > 0 ? (value / maxVal) * 100 : 0;

            const barRow = chartBars.append('div')
                .attr('class', 'category-bar-row');

            barRow.append('div')
                .attr('class', 'category-bar-label')
                .html(`<span class="cat-dot" style="background:${catData.color}"></span>${catId}`);

            const barContainer = barRow.append('div')
                .attr('class', 'category-bar-container');

            barContainer.append('div')
                .attr('class', 'category-bar-fill')
                .style('width', `${percentage}%`)
                .style('background', `linear-gradient(90deg, ${catData.color}, ${catData.color}88)`);

            barRow.append('div')
                .attr('class', 'category-bar-value')
                .text(variable.format(value));
        });
    }

    createCategoryTable(container, categoryStats, variables) {
        const tableWrapper = container.append('div')
            .attr('class', 'category-table-wrapper');

        const table = tableWrapper.append('table')
            .attr('class', 'category-detail-table');

        // ヘッダー
        const headerRow = table.append('thead').append('tr');
        headerRow.append('th').text('法人種別');
        headerRow.append('th').text('組織数');
        variables.forEach(v => {
            headerRow.append('th').text(`${v.name} (平均)`);
        });

        // データ行
        const tbody = table.append('tbody');
        Object.entries(categoryStats).forEach(([catId, catData]) => {
            const tr = tbody.append('tr');
            tr.append('td')
                .attr('class', 'cat-name-cell')
                .html(`<span class="cat-dot" style="background:${catData.color}"></span>${catId}`);
            tr.append('td').text(catData.count);

            variables.forEach(v => {
                const stat = catData.stats[v.key];
                tr.append('td').text(stat ? v.format(stat.mean) : '-');
            });
        });
    }

    // ===== PCA分析 =====
    renderPCA(container, data, variables) {
        const pcaContainer = container.append('div')
            .attr('class', 'pca-container');

        // PCAの説明
        pcaContainer.append('div')
            .attr('class', 'pca-description')
            .html(`
                <p>主成分分析（PCA）により、5つの定量変数を2次元に圧縮して組織の特徴を可視化します。</p>
                <p class="pca-note">近い位置にある組織は似た特徴を持っています。</p>
            `);

        // データの準備と標準化
        const validData = data.filter(d =>
            variables.every(v => d[v.key] != null && !isNaN(d[v.key]))
        );

        if (validData.length < 3) {
            pcaContainer.append('div')
                .attr('class', 'pca-error')
                .text('データが不足しています（3件以上必要）');
            return;
        }

        // 標準化
        const means = {};
        const stds = {};
        variables.forEach(v => {
            const values = validData.map(d => d[v.key]);
            means[v.key] = values.reduce((a, b) => a + b, 0) / values.length;
            const variance = values.reduce((a, x) => a + Math.pow(x - means[v.key], 2), 0) / values.length;
            stds[v.key] = Math.sqrt(variance);
        });

        const standardizedData = validData.map(d =>
            variables.map(v => (d[v.key] - means[v.key]) / (stds[v.key] || 1))
        );

        // 共分散行列の計算
        const n = standardizedData.length;
        const p = variables.length;
        const covMatrix = [];
        for (let i = 0; i < p; i++) {
            covMatrix[i] = [];
            for (let j = 0; j < p; j++) {
                let sum = 0;
                for (let k = 0; k < n; k++) {
                    sum += standardizedData[k][i] * standardizedData[k][j];
                }
                covMatrix[i][j] = sum / (n - 1);
            }
        }

        // べき乗法で最大固有値と固有ベクトルを取得
        const { eigenvalues, eigenvectors } = this.powerIteration(covMatrix, 2);

        // 主成分スコアの計算
        const pcScores = standardizedData.map((row, idx) => {
            const pc1 = row.reduce((sum, val, i) => sum + val * eigenvectors[0][i], 0);
            const pc2 = row.reduce((sum, val, i) => sum + val * eigenvectors[1][i], 0);
            return { org: validData[idx], pc1, pc2 };
        });

        // 寄与率の計算
        const totalVariance = eigenvalues.reduce((a, b) => a + b, 0);
        const explainedRatio = eigenvalues.map(e => (e / totalVariance * 100).toFixed(1));

        // 寄与率表示
        const varianceSection = pcaContainer.append('div')
            .attr('class', 'pca-variance-section');

        varianceSection.append('div')
            .attr('class', 'pca-variance-title')
            .text('📊 寄与率');

        const varianceBars = varianceSection.append('div')
            .attr('class', 'pca-variance-bars');

        eigenvalues.slice(0, 2).forEach((val, i) => {
            const ratio = explainedRatio[i];
            const bar = varianceBars.append('div')
                .attr('class', 'pca-variance-bar');

            bar.append('span')
                .attr('class', 'pca-pc-label')
                .text(`PC${i + 1}`);

            const barContainer = bar.append('div')
                .attr('class', 'pca-bar-container');

            barContainer.append('div')
                .attr('class', 'pca-bar-fill')
                .style('width', `${ratio}%`)
                .style('background', i === 0 ? '#00d4ff' : '#ff6b9d');

            bar.append('span')
                .attr('class', 'pca-variance-value')
                .text(`${ratio}%`);
        });

        varianceBars.append('div')
            .attr('class', 'pca-cumulative')
            .text(`累積寄与率: ${(parseFloat(explainedRatio[0]) + parseFloat(explainedRatio[1])).toFixed(1)}%`);

        // 散布図
        pcaContainer.append('div')
            .attr('class', 'pca-chart-title')
            .text('🎯 主成分プロット（PC1 vs PC2）');

        this.renderPCAScatterPlot(pcaContainer, pcScores, eigenvectors, variables, explainedRatio);

        // 因子負荷量
        pcaContainer.append('div')
            .attr('class', 'pca-loadings-title')
            .text('📐 因子負荷量');

        this.renderLoadingsTable(pcaContainer, eigenvectors, variables, eigenvalues);
    }

    powerIteration(matrix, numComponents) {
        const n = matrix.length;
        const eigenvalues = [];
        const eigenvectors = [];
        let workMatrix = matrix.map(row => [...row]);

        for (let comp = 0; comp < numComponents; comp++) {
            let vector = Array(n).fill(1).map(() => Math.random());
            let eigenvalue = 0;

            for (let iter = 0; iter < 100; iter++) {
                // 行列とベクトルの積
                const newVector = workMatrix.map(row =>
                    row.reduce((sum, val, i) => sum + val * vector[i], 0)
                );

                // ノルムで正規化
                const norm = Math.sqrt(newVector.reduce((sum, val) => sum + val * val, 0));
                vector = newVector.map(v => v / norm);
                eigenvalue = norm;
            }

            eigenvalues.push(eigenvalue);
            eigenvectors.push(vector);

            // デフレーション（次の固有値を求めるため）
            for (let i = 0; i < n; i++) {
                for (let j = 0; j < n; j++) {
                    workMatrix[i][j] -= eigenvalue * vector[i] * vector[j];
                }
            }
        }

        return { eigenvalues, eigenvectors };
    }

    renderPCAScatterPlot(container, pcScores, eigenvectors, variables, explainedRatio) {
        const width = 500;
        const height = 400;
        const margin = { top: 30, right: 30, bottom: 50, left: 60 };
        const innerWidth = width - margin.left - margin.right;
        const innerHeight = height - margin.top - margin.bottom;

        const chartWrapper = container.append('div')
            .attr('class', 'pca-chart-wrapper');

        const svg = chartWrapper.append('svg')
            .attr('width', width)
            .attr('height', height);

        const g = svg.append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        // スケール
        const xExtent = d3.extent(pcScores, d => d.pc1);
        const yExtent = d3.extent(pcScores, d => d.pc2);
        const xPadding = (xExtent[1] - xExtent[0]) * 0.15 || 1;
        const yPadding = (yExtent[1] - yExtent[0]) * 0.15 || 1;

        const xScale = d3.scaleLinear()
            .domain([xExtent[0] - xPadding, xExtent[1] + xPadding])
            .range([0, innerWidth]);

        const yScale = d3.scaleLinear()
            .domain([yExtent[0] - yPadding, yExtent[1] + yPadding])
            .range([innerHeight, 0]);

        // グリッド
        g.append('line')
            .attr('x1', xScale(0)).attr('x2', xScale(0))
            .attr('y1', 0).attr('y2', innerHeight)
            .attr('stroke', 'rgba(255,255,255,0.2)')
            .attr('stroke-dasharray', '4,4');

        g.append('line')
            .attr('x1', 0).attr('x2', innerWidth)
            .attr('y1', yScale(0)).attr('y2', yScale(0))
            .attr('stroke', 'rgba(255,255,255,0.2)')
            .attr('stroke-dasharray', '4,4');

        // X軸
        g.append('g')
            .attr('transform', `translate(0,${innerHeight})`)
            .call(d3.axisBottom(xScale).ticks(5))
            .selectAll('text, line, path')
            .attr('stroke', '#8892a6')
            .attr('fill', '#8892a6');

        g.append('text')
            .attr('x', innerWidth / 2)
            .attr('y', innerHeight + 40)
            .attr('text-anchor', 'middle')
            .attr('fill', '#ffffff')
            .attr('font-size', '12px')
            .text(`PC1 (${explainedRatio[0]}%)`);

        // Y軸
        g.append('g')
            .call(d3.axisLeft(yScale).ticks(5))
            .selectAll('text, line, path')
            .attr('stroke', '#8892a6')
            .attr('fill', '#8892a6');

        g.append('text')
            .attr('transform', 'rotate(-90)')
            .attr('x', -innerHeight / 2)
            .attr('y', -45)
            .attr('text-anchor', 'middle')
            .attr('fill', '#ffffff')
            .attr('font-size', '12px')
            .text(`PC2 (${explainedRatio[1]}%)`);

        // データポイント
        const points = g.selectAll('.pca-point')
            .data(pcScores)
            .join('g')
            .attr('class', 'pca-point')
            .attr('transform', d => `translate(${xScale(d.pc1)},${yScale(d.pc2)})`);

        points.append('circle')
            .attr('r', 8)
            .attr('fill', d => {
                const cat = window.categories.find(c => c.id === d.org.category);
                return cat ? cat.color : '#8892a6';
            })
            .attr('fill-opacity', 0.8)
            .attr('stroke', '#ffffff')
            .attr('stroke-width', 1.5)
            .style('cursor', 'pointer')
            .on('mouseover', (event, d) => this.showTooltip(event, { data: d.org, name: d.org.id }))
            .on('mouseout', () => this.hideTooltip());

        points.append('text')
            .attr('x', 10)
            .attr('y', 4)
            .attr('fill', '#ffffff')
            .attr('font-size', '9px')
            .text(d => d.org.id.substring(0, 6));

        // 凡例
        const legend = svg.append('g')
            .attr('transform', `translate(${width - 120}, 20)`);

        const cats = [...new Set(pcScores.map(d => d.org.category))];
        cats.forEach((cat, i) => {
            const catInfo = window.categories.find(c => c.id === cat);
            const row = legend.append('g')
                .attr('transform', `translate(0, ${i * 18})`);

            row.append('circle')
                .attr('r', 5)
                .attr('fill', catInfo?.color || '#8892a6');

            row.append('text')
                .attr('x', 10)
                .attr('y', 4)
                .attr('fill', '#ffffff')
                .attr('font-size', '9px')
                .text(cat.substring(0, 8));
        });
    }

    renderLoadingsTable(container, eigenvectors, variables, eigenvalues) {
        const tableWrapper = container.append('div')
            .attr('class', 'pca-loadings-wrapper');

        const table = tableWrapper.append('table')
            .attr('class', 'pca-loadings-table');

        // ヘッダー
        const headerRow = table.append('thead').append('tr');
        headerRow.append('th').text('変数');
        headerRow.append('th').text('PC1');
        headerRow.append('th').text('PC2');

        // データ行
        const tbody = table.append('tbody');
        variables.forEach((v, i) => {
            const tr = tbody.append('tr');
            tr.append('td').attr('class', 'loading-var-name').text(v.name);

            eigenvectors.slice(0, 2).forEach((ev, pcIdx) => {
                const loading = ev[i];
                const absLoading = Math.abs(loading);
                const color = loading > 0 ? '#00ff88' : '#ff6b9d';
                const intensity = Math.min(absLoading * 2, 1);

                const td = tr.append('td')
                    .style('background', `rgba(${loading > 0 ? '0,255,136' : '255,107,157'}, ${intensity * 0.3})`)
                    .style('color', absLoading > 0.3 ? color : '#8892a6');

                td.text(loading.toFixed(3));
            });
        });

        // 解釈の補助
        const interpretation = container.append('div')
            .attr('class', 'pca-interpretation');

        interpretation.html(`
            <p><strong>PC1の解釈:</strong> 正の値が大きい変数ほど、PC1が高い組織で値が大きい傾向</p>
            <p><strong>PC2の解釈:</strong> 正の値が大きい変数ほど、PC2が高い組織で値が大きい傾向</p>
        `);
    }

    // ===== ユーティリティ =====
    showTooltip(event, d) {
        const tooltip = document.getElementById('tooltip');
        const orgData = d.data || d;

        tooltip.innerHTML = `
            <div class="tooltip-title">${d.name || orgData.id}</div>
            <div class="tooltip-content">
                職員数: ${orgData.employees?.toLocaleString() || '-'}名<br>
                総資産: ${orgData.assets?.toLocaleString() || '-'}億円<br>
                投資余力: ${orgData.investment || '-'}
            </div>
        `;

        tooltip.style.left = (event.pageX + 15) + 'px';
        tooltip.style.top = (event.pageY - 10) + 'px';
        tooltip.classList.add('visible');
    }

    hideTooltip() {
        document.getElementById('tooltip').classList.remove('visible');
    }

    showInfo(d) {
        const panel = document.getElementById('panelContent');
        const org = d.data || d;

        if (org.id) {
            const scores = window.calculateEvaluationScores(org);
            const evalRank = window.getEvaluationRank(scores.total);
            const investmentBadge = org.investment === '極めて高い' ? 'badge-high' : 'badge-medium';
            const aiBadge = org.ai === 'あり' ? 'badge-high' : 'badge-medium';

            panel.innerHTML = `
                <div class="eval-detail-header">
                    <div class="eval-rank-large" style="background: ${evalRank.color}">${evalRank.rank}</div>
                    <div>
                        <div class="info-value highlight">${org.id}</div>
                        <div class="info-label">${evalRank.label} (${scores.total}/25点)</div>
                    </div>
                </div>
                <div class="info-item">
                    <div class="info-label">法人種別</div>
                    <div class="info-value">${org.category}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">主要業務</div>
                    <div class="info-value">${org.business || '-'}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">職員数</div>
                    <div class="info-value">${org.employees?.toLocaleString()}名</div>
                </div>
                <div class="info-item">
                    <div class="info-label">総資産</div>
                    <div class="info-value">${org.assets?.toLocaleString()}億円</div>
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
                    <div class="info-value">${org.vendors?.join(', ') || '-'}</div>
                </div>
            `;
        }
    }
}

// グローバルインスタンス
window.visualizationViews = new VisualizationViews();

