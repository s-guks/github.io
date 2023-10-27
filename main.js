let keyframes = [
    {
        activeVerse: 1,
        activeLines: [1, 2, 3],
        svgUpdate: drawScatterPlot
    },
    {
        activeVerse: 2,
        activeLines: [1, 2, 3]
    },
    {
        activeVerse: 3,
        activeLines: [1, 2]
    },
    {
        activeVerse: 4,
        activeLines: [1, 2]
    },
    {
        activeVerse: 5,
        activeLines: [1, 2, 3]
    },
    {
        activeVerse: 6,
        activeLines: [1, 2, 3]
    },
    {
        activeVerse: 7,
        activeLines: [1, 2, 3, 4, 5]
    },
    {
        activeVerse: 8,
        activeLines: [1, 2, 3]
    },
    {
        activeVerse: 9,
        activeLines: [1]
    }
]

let svg = d3.select("#svg");
let keyframeIndex = 0;

const width = 750;
const height = 500;

let chart;
let chartWidth;
let chartHeight;

let xScale;
let yScale;

let misinfoData;
let vaccineHesData;

document.getElementById("forward-button").addEventListener("click", forwardClicked);
document.getElementById("backward-button").addEventListener("click", backwardClicked);

async function loadData() {
    await d3.csv("covid-misinfo.csv").then(data => {
        misinfoData = data;
    });
    await d3.csv("vaccine-hes.csv").then(data => {
        vaccineHesData = data;
    });
}

function drawScatterPlot() {
    updateDotPlot(vaccineHesData, "Vaccine Hesitency by County")
}

function forwardClicked() {
    if (keyframeIndex < keyframes.length - 1) {
        keyframeIndex++;
        drawKeyframe(keyframeIndex);
    }
}

function backwardClicked() {
    if (keyframeIndex > 0) {
        keyframeIndex--;
        drawKeyframe(keyframeIndex);
      }
}

function drawKeyframe(kfi) {
    let kf = keyframes[kfi];
    resetActiveLines();
    updateActiveVerse(kf.activeVerse);
    for (line of kf.activeLines){
        updateActiveLine(kf.activeVerse, line);  
    }
    if (kf.svgUpdate) {
        kf.svgUpdate();
    }
}

function resetActiveLines() {
    d3.selectAll(".line").classed("active-line", false);
}

function updateActiveVerse(id) {
    d3.selectAll(".verse").classed("active-verse", false);
    d3.select("#verse"+id).classed("active-verse", true);

    scrollLeftColumnToActiveVerse(id);
}

function updateActiveLine(vid, lid) {
    let thisVerse = d3.select("#verse" + vid);
    thisVerse.select("#line" + lid).classed("active-line", true);
}

function scrollLeftColumnToActiveVerse(id) {

    var leftColumn = document.querySelector(".left-column-content");

    var activeVerse = document.getElementById("verse" + id);

    var verseRect = activeVerse.getBoundingClientRect();
    var leftColumnRect = leftColumn.getBoundingClientRect();

    var desiredScrollTop = verseRect.top + leftColumn.scrollTop - leftColumnRect.top - (leftColumnRect.height - verseRect.height) / 2;

    leftColumn.scrollTo({
        top: desiredScrollTop,
        behavior: 'smooth'
    })
}

function fillDotColors() {
    var colorScale = d3.scaleSequential().domain([0,1]).interpolator(d3.interpolateViridis);
    svg.selectAll("dot")
        .attr("fill", function (d) {
            {
                return colorScale(d["Estimated hesitant or unsure"]);
            }
        })
}

function updateDotPlot(data, title = "") {

    // Define the margin so that there is space around the vis for axes and labels
    const margin = { top: 50, right: 50, bottom: 30, left: 50 };
    let chartWidth = (width - margin.left) - margin.right;
    let chartHeight = (height - margin.top) - margin.bottom;
    
    xScale = d3.scaleLinear()
        .domain([d3.min(data, function (d) {
            return d["Social Vulnerability Index (SVI)"];
        }), d3.max(data, function (d) {
            return d["Social Vulnerability Index (SVI)"];
        })]).range([0, chartWidth+10]);
    yScale = d3.scaleLinear()
        .domain([d3.min(data, function (d) {
            return d["Percent adults fully vaccinated against COVID-19 (as of 6/10/21)"];
        }), d3.max(data, function (d) {
            return d["Percent adults fully vaccinated against COVID-19 (as of 6/10/21)"];
        })]).range([chartHeight, 10]);

    svg.selectAll("dot")
        .data(data)
        .enter()
        .append("circle")
            .attr("cx", function (d) { return (xScale(d["Social Vulnerability Index (SVI)"])+margin.left); } )
            .attr("cy", function (d) { return (yScale(d["Percent adults fully vaccinated against COVID-19 (as of 6/10/21)"])+margin.bottom); } )
            .attr("r", 1.5)
            .style("fill", "darkslateblue");

    // Add x-axis
    chart.append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0,${chartHeight})`)
        .call(d3.axisBottom(xScale))
        .selectAll("text");

    // Add y-axis
    chart.append("g")
        .attr("class", "y-axis")
        .call(d3.axisLeft(yScale))
        .selectAll("text");
    
    // Next let's update the axes so they are displayed correctly
    chart.transition()
        .duration(1000)
        .select(".x-axis")
        .call(d3.axisBottom(xScale));

    chart.transition()
        .duration(1000)
        .select(".y-axis")
        .call(d3.axisLeft(yScale));

    // And finally if a new title has been specified we will update the title too
    if (title.length > 0) {
        svg.select("#chart-title")
            .transition()
            .duration(1000)
            .text(title)
            .style("font", "20px");
    }
}

function initializeSVG() {
    svg.attr("width", width);
    svg.attr("height", height);

    svg.selectAll("*").remove();

    const margin = { top: 30, right: 30, bottom: 50, left: 50 };
    chartWidth = width - margin.left - margin.right;
    chartHeight = height - margin.top - margin.bottom;

    chart = svg.append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    
    xScale = d3.scaleBand()
        .domain([])
        .range([0, chartWidth])
        .padding(0.1);

    yScale = d3.scaleLinear()
        .domain([])
        .nice()
        .range([chartHeight, 0]);
    

    // Add title
    svg.append("text")
        .attr("id", "chart-title")
        .attr("x", width / 2)
        .attr("y", 30)
        .attr("text-anchor", "middle")
        .style("font", "20px times")
        .style("fill", "darkslateblue")
        .text("");
}

async function initialize() {
    await loadData();
    initializeSVG();
    drawKeyframe(keyframeIndex);
    fillDotColors();
}

initialize();