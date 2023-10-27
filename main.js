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
    updateDotPlot(vaccineHesData, "Vaccine Hesitency by County", "Social Vulnerability Index (SVI)", "Percent adults fully vaccinated against COVID-19 (as of 6/10/21)")
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

function fillDotColors(data) {
    var colorScale = d3.scaleSequential()
        .domain([
            d3.min(data, function (d) {
                return d["Estimated hesitant or unsure"];
        }), 
            d3.max(data, function (d) {
                return d["Estimated hesitant or unsure"];
        })]).interpolator(d3.interpolateViridis);
    svg.selectAll("circle")
        .style("fill", function (d) {
            {
                return colorScale(d["Estimated hesitant or unsure"]);
            }
        });
}

function lineOfBestFit(data) {
    
    var lineGen = d3.regressionLinear()
        .x(d => d["Social Vulnerability Index (SVI)"])
        .y(d => d["Percent adults fully vaccinated against COVID-19 (as of 6/10/21)"])
        .domain([0, 1]);

        var pointX1 = (chartWidth)*(lineGen(data)[0][0]);
        var pointX2 = (chartWidth+10)*(lineGen(data)[1][0]);

        var pointY1 = chartHeight*(lineGen(data)[1][1]);
        var pointY2 = chartHeight*(lineGen(data)[0][1]);

    chart.append("line")
            .attr("x1", pointX1)
            .attr("x2", pointX2)
            .attr("y1", pointY1)
            .attr("y2", pointY2)
            .attr("stroke", "darkslateblue")
            .attr("stroke-width", "2px")
            .attr("transform", `translate(10, 95)`);
}

function updateDotPlot(data, title = "", xTitle = "", yTitle = "") {

    //margin
    const margin = { top: 50, right: 50, bottom: 30, left: 60 };
    chartWidth = (width - margin.left) - margin.right;
    chartHeight = (height - margin.top) - margin.bottom;
    
    //define x and y scales
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

    //draw the dots
    svg.selectAll(".dot")
        .data(data)
        .enter()
        .append("circle")
            .attr("cx", function (d) { return (xScale(d["Social Vulnerability Index (SVI)"])+margin.left); } )
            .attr("cy", function (d) { return (yScale(d["Percent adults fully vaccinated against COVID-19 (as of 6/10/21)"])+margin.bottom); } )
            .attr("r", 1.5)
            .style("fill", "darkslateblue");

    //add x-axis
    chart.append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(10,${chartHeight})`)
        .call(d3.axisBottom(xScale))
        .selectAll("text");

    //add y-axis
    chart.append("g")
        .attr("class", "y-axis")
        .call(d3.axisLeft(yScale))
        .attr("transform", `translate(10, 0)`)
        .selectAll("text");
    
    //update axes
    chart.transition()
        .duration(1000)
        .select(".x-axis")
        .call(d3.axisBottom(xScale));
    
    chart.transition()
        .duration(1000)
        .select(".y-axis")
        .call(d3.axisLeft(yScale));

    //title
    if (title.length > 0) {
        svg.select("#chart-title")
            .transition()
            .duration(1000)
            .text(title)
            .style("font", "20px times");
    }

    //x-axis label
    svg.append("text")
        .attr("class", "x label")
        .attr("text-anchor", "end")
        .attr("x", 475)
        .attr("y", height - 10)
        .style("font", "15px times")
        .style("fill", "darkslateblue")
        .text(xTitle);
    
    //y-axis label
    svg.append("text")
        .attr("class", "y label")
        .attr("text-anchor", "end")
        .attr("y", 10)
        .attr("x", -50)
        .attr("dy", "1em")
        .attr("transform", "rotate(-90)")
        .style("font", "15px times")
        .style("fill", "darkslateblue")
        .text(yTitle);

    fillDotColors(vaccineHesData);
    lineOfBestFit(vaccineHesData);
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
}

initialize();