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
            const investmentBadge = org.investment === '極めて高い' ? 'badge-high' : 'badge-medium';
            const aiBadge = org.ai === 'あり' ? 'badge-high' : 'badge-medium';

            panel.innerHTML = `
                <div class="info-item">
                    <div class="info-label">法人名</div>
                    <div class="info-value highlight">${org.id}</div>
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
