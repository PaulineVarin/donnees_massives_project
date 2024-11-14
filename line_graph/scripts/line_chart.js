import * as d3 from "https://cdn.jsdelivr.net/npm/d3@6/+esm";

const COLLECTION_PATH = '../traitements_mongoDB/fichiers_json/uxdonnees.bdd.json';
const CURRENT_YEAR = 2025;
const INITIAL_YEAR_START = 1950;

let selectedCountry = "Tous les pays";
let selectedGenre = "Tous les genres";
let yearStart = INITIAL_YEAR_START;
let yearEnd = CURRENT_YEAR;

d3.json(COLLECTION_PATH).then(data => {
    const uniqueCountries = getUniqueValues(data, "country_name");
    const uniqueGenres = getUniqueValues(data, "genrePrincipal");

    populateDropdown("#countryFilter", uniqueCountries);
    populateDropdown("#genreFilter", uniqueGenres);

    setupEventListeners();
    initializeSlider();
    initializeFiltersFromLocalStorage();
    updateChart();

    function getUniqueValues(data, field) {
        return Array.from(new Set(data.map(d => d[field]))).sort();
    }

    function populateDropdown(selector, options) {
        const selectElement = d3.select(selector);
        options.forEach(option => {
            selectElement.append("option").text(option).attr("value", option);
        });
    }

    function setupEventListeners() {
        d3.select("#countryFilter").on("change", () => {
            selectedCountry = d3.select("#countryFilter").node().value;
            updateChart();
        });

        d3.select("#genreFilter").on("change", () => {
            selectedGenre = d3.select("#genreFilter").node().value;
            updateChart();
        });

        document.getElementById("resetButton").addEventListener("click", resetFilters);
    }

    function initializeSlider() {
        const slider = document.getElementById('yearRangeSlider');
        noUiSlider.create(slider, {
            start: [INITIAL_YEAR_START, CURRENT_YEAR],
            connect: true,
            range: { 'min': INITIAL_YEAR_START, 'max': CURRENT_YEAR },
            step: 1,
            format: { to: value => Math.round(value), from: value => Math.round(value) }
        });

        slider.noUiSlider.on('update', (values) => {
            [yearStart, yearEnd] = values.map(v => parseInt(v, 10));
            displayYearRange(values);
        });
        slider.noUiSlider.on('change', updateChart);

        displayYearRange(slider.noUiSlider.get());
    }

    function displayYearRange(values) {
        document.getElementById('yearRangeLabel').textContent = `${values[0]} - ${values[1]}`;
    }

    function initializeFiltersFromLocalStorage() {
        const storedGenre = localStorage.getItem("genre");
        const storedCountry = localStorage.getItem("country");

        selectedGenre = storedGenre || "Tous les genres";
        selectedCountry = storedCountry || "Tous les pays";

        document.getElementById("countryFilter").value = selectedCountry;
        document.getElementById("genreFilter").value = selectedGenre;

        localStorage.removeItem("genre");
        localStorage.removeItem("country");
    }

    function updateChart() {
        const filteredData = filterData(data);
        const processedData = aggregateYearCounts(filteredData);
        renderLineChart(processedData);
    }

    function filterData(data) {
        return data.filter(d => {
            const albumYear = +d.year;
            return (selectedCountry === "Tous les pays" || d.country_name === selectedCountry) &&
                (selectedGenre === "Tous les genres" || d.genrePrincipal === selectedGenre) &&
                albumYear >= yearStart && albumYear <= yearEnd;
        });
    }

    function aggregateYearCounts(data) {
        const yearCounts = data.reduce((acc, album) => {
            acc[+album.year] = (acc[+album.year] || 0) + 1;
            return acc;
        }, {});
        return Object.entries(yearCounts)
            .map(([year, count]) => ({ year: +year, count }))
            .sort((a, b) => a.year - b.year);
    }

    function renderLineChart(data) {
        d3.select("#chart").selectAll("*").remove();

        const margin = { top: 20, right: 20, bottom: 50, left: 70 };
        const width = 800 - margin.left - margin.right;
        const height = 400 - margin.top - margin.bottom;

        const svg = d3.select("#chart")
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        const xScale = d3.scaleLinear()
            .domain([yearStart, yearEnd])
            .range([0, width]);

        const yScale = d3.scaleLinear()
            .domain([0, d3.max(data, d => d.count)])
            .range([height, 0]);

        svg.append("g").attr("transform", `translate(0,${height})`).call(d3.axisBottom(xScale).tickFormat(d3.format("d")));
        svg.append("g").call(d3.axisLeft(yScale));

        svg.append("text")
            .attr("x", width / 2)
            .attr("y", height + margin.bottom - 10)
            .attr("text-anchor", "middle")
            .text("Année");

        svg.append("text")
            .attr("transform", "rotate(-90)")
            .attr("x", -height / 2)
            .attr("y", -margin.left + 20)
            .attr("text-anchor", "middle")
            .text("Nombre d'albums");

        const lineGenerator = d3.line()
            .x(d => xScale(d.year))
            .y(d => yScale(d.count))
            .curve(d3.curveMonotoneX);

        const path = svg.append("path")
            .datum(data)
            .attr("fill", "none")
            .attr("stroke", "#007BFF")
            .attr("stroke-width", 2)
            .attr("d", lineGenerator);

        const totalLength = path.node().getTotalLength();
        path.attr("stroke-dasharray", `${totalLength} ${totalLength}`)
            .attr("stroke-dashoffset", totalLength)
            .transition()
            .duration(2000)
            .ease(d3.easeCubicInOut)
            .attr("stroke-dashoffset", 0);

        highlightAberrantData(svg, data, xScale, yScale);
        addDataPoints(svg, data, xScale, yScale);
    }

    function highlightAberrantData(svg, data, xScale, yScale) {
        const aberrantData = data.find(d => d.year === CURRENT_YEAR);
        if (aberrantData) {
            svg.append("circle")
                .attr("cx", xScale(aberrantData.year))
                .attr("cy", yScale(aberrantData.count))
                .attr("r", 6)
                .attr("fill", "red");

            svg.append("text")
                .attr("x", xScale(aberrantData.year) - 120)
                .attr("y", yScale(aberrantData.count) - 10)
                .attr("fill", "red")
                .style("font-size", "12px")
                .style("font-weight", "bold")
                .text("Années aberrantes");
        }
    }

    function addDataPoints(svg, data, xScale, yScale) {
        const tooltip = createTooltip();

        svg.selectAll("circle")
            .data(data)
            .enter()
            .append("circle")
            .attr("cx", d => xScale(d.year))
            .attr("cy", d => yScale(d.count))
            .attr("r", 4)
            .attr("fill", "#007BFF")
            .attr("stroke", "#fff")
            .attr("stroke-width", 1.5)
            .style("cursor", "pointer")
            .on("mouseover", function(event, d) {
                d3.select(this).transition().duration(200).attr("r", 8);
                tooltip.style("display", "block")
                    .html(`<strong>Year:</strong> ${d.year}<br><strong>Albums:</strong> ${d.count}`)
                    .style("left", `${event.pageX + 10}px`)
                    .style("top", `${event.pageY - 20}px`);
            })
            .on("mousemove", event => tooltip.style("left", `${event.pageX + 10}px`).style("top", `${event.pageY - 20}px`))
            .on("mouseout", function() {
                d3.select(this).transition().duration(200).attr("r", 4);
                tooltip.style("display", "none");
            })
            .on("click", (event, d) => redirectToTreemap(d.year, selectedCountry, selectedGenre, "artist"));
    }

    function createTooltip() {
        return d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("position", "absolute")
            .style("display", "none")
            .style("background-color", "rgba(0, 0, 0, 0.8)")
            .style("color", "white")
            .style("padding", "8px")
            .style("border-radius", "4px")
            .style("font-size", "12px")
            .style("pointer-events", "none");
    }

    function redirectToTreemap(year, country, genre, level) {
        localStorage.setItem("selectedYear", year);
        localStorage.setItem("selectedCountries", JSON.stringify([country]));
        localStorage.setItem("selectedGenres", JSON.stringify([genre]));
        localStorage.setItem("selectedLevel", level);
        window.location.href = "../treemap/index.html";
    }

    function resetFilters() {
        selectedCountry = "Tous les pays";
        selectedGenre = "Tous les genres";
        yearStart = INITIAL_YEAR_START;
        yearEnd = CURRENT_YEAR;
        document.getElementById("countryFilter").value = "Tous les pays";
        document.getElementById("genreFilter").value = "Tous les genres";
        document.getElementById("yearRangeSlider").noUiSlider.set([yearStart, yearEnd]);
        updateChart();
    }
});
