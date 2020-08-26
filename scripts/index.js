const API_ORIGIN = 'https://api.covid19api.com';
const GET_SUMMARY = `${API_ORIGIN}/summary`;

const chartContainer = d3.select('svg');

async function getSummaryData() {
    let response = await fetch(GET_SUMMARY);

    if (!response.ok) {
        throw Error('Failed to fetch data');
    }

    let data = await response.json();

    return data;
}

function barchart(data, container) {
    const margin = {
        top: 30,
        bottom: 20,
        left: 200,
        right: 20
    };

    const width = 1000 - margin.left - margin.right;
    const height = 5000 - margin.top - margin.bottom;

    // Translate chart content so there's room for axis labels
    const chart = container.append('g').attr('transform', `translate(${margin.left}, ${margin.top})`);

    let keys = data.map((elem) => elem.key);
    let values = data.map((elem) => elem.value);

    // Create axis scales (these basically set the 'content' of the axes)
    const xScale = d3
        .scaleLinear()
        .domain([Math.max(...values), 0])
        .range([width, 0]);

    const yScale = d3.scaleBand().domain(keys).range([height, 0]).padding(0.1);

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
    console.log(summaryData);

    let data = [];

    for (let elem of summaryData.Countries) {
        data.push({
            key: elem.Country,
            value: elem.TotalConfirmed
        });
    }

    barchart(data, chartContainer);
});
