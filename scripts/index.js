const API_ORIGIN = 'https://api.covid19api.com';
const GET_SUMMARY = `${API_ORIGIN}/summary`;

const DEFAULT_OPTIONS = {
    responsive: false,
    width: 400,
    height: 300,
    margin: {
        top: 0,
        bottom: 0,
        left: 0,
        right: 0
    }
};

async function getSummaryData() {
    let response = await fetch(GET_SUMMARY);

    if (!response.ok) {
        throw Error('Failed to fetch data');
    }

    return await response.json();
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

    // if (responsive) {
    //     width = `calc(100% - ${margin.left + margin.right})`;
    //     height = `calc(100% - ${margin.top + margin.bottom})`;
    // }

    // The
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    let svg;

    if (responsive) {
        svg = d3.select(query).append('svg').attr('viewBox', `0 0 ${width} ${height}`);
    } else {
        svg = d3.select(query).append('svg').attr('width', width).attr('height', height);
    }

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

    // Draw axes representing the scales we created above
    chart.append('g').call(d3.axisLeft(yScale));
    chart.append('g').call(d3.axisTop(xScale));

    // Draw horizontal bars
    chart
        .selectAll()
        .data(data)
        .enter()
        .append('rect')
        .attr('y', (s) => yScale(s.key))
        .attr('width', (s) => xScale(s.value))
        .attr('height', yScale.bandwidth());
}

window.addEventListener('DOMContentLoaded', async () => {
    let summaryData = await getSummaryData();
    let data = [];

    for (let elem of summaryData.Countries) {
        data.push({
            key: elem.Country,
            value: elem.TotalConfirmed
        });
    }

    const options = {
        responsive: true,
        width: 1000,
        height: 3500,
        margin: {
            top: 30,
            bottom: 20,
            left: 200,
            right: 20
        }
    };

    barchart(data, '#summary-chart', options);
});
