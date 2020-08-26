const API_ORIGIN = 'https://api.covid19api.com';
const GET_SUMMARY = `${API_ORIGIN}/summary`;

const BREAKPOINTS = {
    xs: 0,
    sm: 600,
    md: 960,
    lg: 1280,
    xl: 1920
};

const DEFAULT_OPTIONS = {
    responsive: false,
    width: 400,
    height: 300,
    margin: {
        top: 0,
        bottom: 0,
        left: 0,
        right: 0
    },
    valueLabelOffset: 0
};

function debounce(func, delayMilliseconds) {
    let timeout = null;
    return () => {
        if (timeout) {
            clearTimeout(timeout);
        }
        timeout = setTimeout(func, delayMilliseconds);
    };
}

async function getSummaryData() {
    let response = await fetch(GET_SUMMARY);

    if (!response.ok) {
        throw Error('Failed to fetch data');
    }

    return await response.json();
}

function drawBarChart(data, query, options) {
    let { width, height, margin, valueLabelOffset } = options;
    let chartWidth = width - margin.left - margin.right;
    let chartHeight = height - margin.top - margin.bottom;

    let svg = d3.select(query).append('svg').attr('width', width).attr('height', height);

    // Translate chart content so there's room for axis ticks and labels
    const chart = svg.append('g').attr('transform', `translate(${margin.left}, ${margin.top})`);

    let keys = data.map((elem) => elem.key);
    let values = data.map((elem) => elem.value);

    // Create axis scales (these basically set the 'content' of the axes)
    const xScale = d3
        .scaleLinear()
        .domain([Math.max(...values), 0])
        .range([chartWidth, 0]);

    const yScale = d3.scaleBand().domain(keys).range([chartHeight, 0]).padding(0.1);

    let valueFormatter = d3.format('.2s');
    let xAxis = d3.axisTop(xScale).tickFormat(valueFormatter);
    let yAxis = d3.axisLeft(yScale);
    let barWidth = yScale.bandwidth();

    if (width < BREAKPOINTS.sm) {
        xAxis.ticks(5);
    }

    // Draw axes representing the scales we created above
    chart.append('g').call(xAxis);
    chart.append('g').call(yAxis);

    // Draw horizontal bars
    chart
        .append('g')
        .selectAll()
        .data(data)
        .enter()
        .append('rect')
        .attr('y', (s) => yScale(s.key))
        .attr('width', (s) => xScale(s.value))
        .attr('height', yScale.bandwidth());

    // Add vertical grid lines
    chart
        .append('g')
        .attr('class', 'grid')
        .attr('transform', `translate(0, ${height})`)
        .call(d3.axisBottom().scale(xScale).tickSize(-height, 0, 0).tickFormat(''));

    // Add value labels
    chart
        .append('g')
        .selectAll()
        .data(data)
        .enter()
        .append('text')
        .attr('class', 'value-label')
        .text((s) => valueFormatter(s.value))
        .attr('y', (s) => yScale(s.key) + barWidth / 2)
        .attr('x', function (s) {
            // This must be done after this node's content is set (via .text)
            let offset = this.getComputedTextLength() / 2 + valueLabelOffset;
            let xpos = xScale(s.value);
            let x = xpos + offset;
            if (x > chartWidth) {
                this.classList.add('white');
                return xpos - offset;
            }
            return x;
        });
}

function barchart(data, query, options = {}) {
    let { responsive, width, height, margin } = options;

    margin = {
        top: margin.top || DEFAULT_OPTIONS.margin.top,
        bottom: margin.bottom || DEFAULT_OPTIONS.margin.bottom,
        left: margin.left || DEFAULT_OPTIONS.margin.left,
        right: margin.right || DEFAULT_OPTIONS.margin.right
    };

    width = width || DEFAULT_OPTIONS.width;
    height = height || DEFAULT_OPTIONS.height;

    const element = document.querySelector(query);

    const update = () => {
        if (responsive) {
            element.innerHTML = '';

            const bb = element.getBoundingClientRect();
            width = bb.width;
            height = bb.height || height;

            let currentOptions = {
                ...options,
                responsive,
                width,
                height,
                margin
            };

            drawBarChart(data, query, currentOptions);
        } else {
            let currentOptions = {
                ...options,
                responsive,
                width,
                height,
                margin
            };
            drawBarChart(data, query, currentOptions);
        }
    };

    if (responsive) {
        window.addEventListener('resize', debounce(update, 100));
    }

    update();
}

window.addEventListener('DOMContentLoaded', async () => {
    let summaryData = await getSummaryData();
    let data = [];
    console.log(summaryData);
    for (let elem of summaryData.Countries) {
        data.push({
            key: elem.CountryCode,
            value: elem.TotalConfirmed
        });
    }

    data.sort((a, b) => a.value - b.value);

    const options = {
        responsive: true,
        width: 1000,
        height: 3500,
        margin: {
            top: 30,
            bottom: 20,
            left: 30,
            right: 20
        },
        valueLabelOffset: 3
    };

    barchart(data, '#summary-chart', options);
});
