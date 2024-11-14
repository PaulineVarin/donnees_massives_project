import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
const jsonFilePath = '../traitements_mongoDB/fichiers_json/uxdonnees.bdd.json';

d3.json(jsonFilePath).then(data => {
    const CHART_DIMENSIONS = { width: 825, height: 530, margin: { top: 10, right: 10, bottom: 10, left: 10 } };
    let currentLevel = 'genre';
    const levelStack = [];
    const filterStates = {};

    const svg = d3.select("#chart")
        .append("svg")
        .attr("width", CHART_DIMENSIONS.width)
        .attr("height", CHART_DIMENSIONS.height)
        .style("font", "10px sans-serif");

    const tooltip = d3.select("body")
        .append("div")
        .style("position", "absolute")
        .style("background", "rgba(0, 0, 0, 0.7)")
        .style("color", "white")
        .style("padding", "10px")
        .style("border-radius", "5px")
        .style("visibility", "hidden")
        .style("font-size", "12px")
        .style("white-space", "pre-line");

    const yearSlider = document.getElementById('yearSlider');
    const selectedYearLabel = document.getElementById('selectedYear');
    const countryCheckboxes = d3.select("#countryCheckboxes");
    const genreCheckboxes = d3.select("#genreCheckboxes");

    noUiSlider.create(yearSlider, {
        start: [1950],
        connect: false,
        range: { 'min': 1950, 'max': 2025 },
        step: 1,
        format: { to: value => Math.round(value), from: value => Math.round(value) }
    });

    yearSlider.noUiSlider.on('update', function (values) {
        const selectedYear = values[0];
        updateSelectedYearLabel(selectedYear);
        applyFilters(selectedYear);
        updateChart();
    });

    function updateSelectedYearLabel(year) {
        if (year === 2025) {
            selectedYearLabel.textContent = "Années aberrantes";
            selectedYearLabel.style.color = "red";
        } else {
            selectedYearLabel.textContent = year;
            selectedYearLabel.style.color = "black";
        }
    }
    function applyFilters(year) {
        const filteredData = data.filter(d => d.year === String(year));

        // Récupérer les valeurs actuellement sélectionnées pour les cases à cocher pays et genres
        const selectedCountries = getSelectedCheckboxValues(countryCheckboxes);
        const selectedGenres = getSelectedCheckboxValues(genreCheckboxes);

        const uniqueCountries = [...new Set(filteredData.map(d => d.country_name).filter(Boolean))].sort();
        const uniqueGenres = [...new Set(filteredData.map(d => d.genrePrincipal).filter(Boolean))].sort();

        // Mettre à jour uniquement les options disponibles sans changer les sélections actuelles
        updateCheckboxOptions(countryCheckboxes, uniqueCountries, country => selectedCountries.includes(country));
        updateCheckboxOptions(genreCheckboxes, uniqueGenres, genre => selectedGenres.includes(genre));
    }

    function updateCheckboxOptions(container, options, isSelectedFunc) {
        container.selectAll("*").remove();
        options.forEach(option => {
            const checkbox = container.append("div").append("label");
            checkbox.append("input")
                .attr("type", "checkbox")
                .attr("value", option)
                .property("checked", isSelectedFunc(option))
                .on("change", updateChart);
            checkbox.append("span").text(option);
        });
    }

    function getSelectedCheckboxValues(container) {
        return container.selectAll("input:checked").nodes().map(d => d.value);
    }

    function isCountrySelected(country) {
        const selectedCountries = filterStates[currentLevel]?.countries;
        return selectedCountries ? selectedCountries.includes(country) : true;
    }

    function isGenreSelected(genre) {
        const selectedGenres = filterStates[currentLevel]?.genres;
        return selectedGenres ? selectedGenres.includes(genre) : true;
    }

    function saveCurrentFilterState(level) {
        const selectedCountries = getSelectedCheckboxValues(countryCheckboxes);
        const selectedGenres = getSelectedCheckboxValues(genreCheckboxes);
        filterStates[level] = { countries: selectedCountries, genres: selectedGenres };
    }

    function restoreFilterState(level) {
        if (filterStates[level]) {
            setCheckboxSelection(countryCheckboxes, filterStates[level].countries);
            setCheckboxSelection(genreCheckboxes, filterStates[level].genres);
        } else {
            selectAllCheckboxes(countryCheckboxes);
            selectAllCheckboxes(genreCheckboxes);
        }
    }

    function setCheckboxSelection(container, selections) {
        container.selectAll("input").property("checked", false);
        container.selectAll("input").each(function () {
            if (selections.includes(this.value)) d3.select(this).property("checked", true);
        });
    }

    function selectAllCheckboxes(container) {
        container.selectAll("input").property("checked", true);
    }

    function initializeInterface(year, genres, countries, level) {
        yearSlider.noUiSlider.set(year);
        selectedYearLabel.textContent = year;

        setCheckboxSelection(genreCheckboxes, genres);
        setCheckboxSelection(countryCheckboxes, countries);

        currentLevel = level;
        updateChart();
    }

    function loadInitialStateFromCache() {
        const storedYear = localStorage.getItem('selectedYear');
        const storedGenres = JSON.parse(localStorage.getItem('selectedGenres'));
        const storedCountries = JSON.parse(localStorage.getItem('selectedCountries'));
        const storedLevel = localStorage.getItem('selectedLevel');

        if (storedYear && storedGenres && storedCountries && storedLevel) {
            initializeInterface(parseInt(storedYear), storedGenres, storedCountries, storedLevel);
            clearLocalStorageCache();
        }
    }

    function clearLocalStorageCache() {
        localStorage.removeItem('selectedYear');
        localStorage.removeItem('selectedGenres');
        localStorage.removeItem('selectedCountries');
        localStorage.removeItem('selectedLevel');
    }

    const backButton = d3.select("#backButton").on("click", () => {
        if (currentLevel === 'artist') {
            currentLevel = 'country';
        } else if (currentLevel === 'country') {
            currentLevel = 'genre';
        }
        levelStack.pop();
        restoreFilterState(currentLevel);
        updateChart();
    });

    function updateChart() {
        const selectedYear = +yearSlider.noUiSlider.get();
        let filteredData = data.filter(d => d.year === String(selectedYear));

        const selectedCountries = getSelectedCheckboxValues(countryCheckboxes);
        const selectedGenres = getSelectedCheckboxValues(genreCheckboxes);

        if (selectedCountries.length > 0) {
            filteredData = filteredData.filter(d => selectedCountries.includes(d.country_name));
        }
        if (selectedGenres.length > 0) {
            filteredData = filteredData.filter(d => selectedGenres.includes(d.genrePrincipal));
        }

        const treeData = generateTreeData(filteredData);
        renderTreemap(treeData);
    }

    function generateTreeData(filteredData) {
        const rollupFunc = v => ({ totalSongs: d3.sum(v, d => d.songs.length) });
        const dataRollupMap = currentLevel === 'genre' ? d => d.genrePrincipal
            : currentLevel === 'country' ? d => d.country_name
                : d => d.artist;

        return Array.from(
            d3.rollup(filteredData, rollupFunc, dataRollupMap),
            ([key, { totalSongs }]) => ({ name: key, value: totalSongs })
        );
    }

    function renderTreemap(data) {
        svg.selectAll("*").remove();
        const root = d3.hierarchy({ values: data }, d => d.values).sum(d => d.value);

        d3.treemap()
            .size([CHART_DIMENSIONS.width - CHART_DIMENSIONS.margin.left - CHART_DIMENSIONS.margin.right,
                CHART_DIMENSIONS.height - CHART_DIMENSIONS.margin.top - CHART_DIMENSIONS.margin.bottom])
            .padding(2)
            .round(true)(root);

        renderNodes(root);
    }

    function renderNodes(root) {
        const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

        svg.append("g")
            .attr("transform", `translate(${CHART_DIMENSIONS.margin.left},${CHART_DIMENSIONS.margin.top})`)
            .selectAll("rect")
            .data(root.leaves())
            .join("rect")
            .attr("x", d => d.x0)
            .attr("y", d => d.y0)
            .attr("width", d => d.x1 - d.x0)
            .attr("height", d => d.y1 - d.y0)
            .attr("fill", d => colorScale(d.data.name))
            .attr("stroke", "white")
            .attr("stroke-width", 1)
            .style("cursor", "pointer")
            .on("click", handleNodeClick)
            .on("mouseover", handleNodeMouseOver)
            .on("mousemove", handleNodeMouseMove)
            .on("mouseout", handleNodeMouseOut);

        renderNodeText(root);
    }

    function renderNodeText(root) {
        svg.append("g")
            .attr("transform", `translate(${CHART_DIMENSIONS.margin.left},${CHART_DIMENSIONS.margin.top})`)
            .selectAll("text")
            .data(root.leaves())
            .join("text")
            .attr("x", d => d.x0 + 5)
            .attr("y", d => d.y0 + 20)
            .attr("fill", "white")
            .attr("font-size", "12px")
            .attr("font-weight", "bold")
            .text(d => (d.x1 - d.x0 > d.data.name.length * 8 && d.y1 - d.y0 > 20) ? d.data.name : "");
    }

    function handleNodeClick(event, d) {
        saveCurrentFilterState(currentLevel);
        currentLevel = currentLevel === 'genre' ? 'country' : 'artist';
        levelStack.push(currentLevel);
        filterStates[currentLevel] = null;
        updateChart();
    }

    function handleNodeMouseOver(event, d) {
        d3.select(this).attr("stroke", "#FFD700").attr("stroke-width", 3).attr("filter", "url(#drop-shadow)");
        tooltip.style("visibility", "visible")
            .html(`<strong>${currentLevel}:</strong> ${d.data.name}\n<strong>Total Songs:</strong> ${d.data.value}`);
    }

    function handleNodeMouseMove(event) {
        tooltip.style("top", `${event.pageY + 10}px`).style("left", `${event.pageX + 10}px`);
    }

    function handleNodeMouseOut() {
        d3.select(this).attr("stroke", "white").attr("stroke-width", 1).attr("filter", null);
        tooltip.style("visibility", "hidden");
    }

    yearSlider.noUiSlider.on('update', function(values) {
        const selectedYear = values[0];
        updateSelectedYearLabel(selectedYear);
        applyFilters(selectedYear);
        updateChart();
    });

    const defaultYear = localStorage.getItem("selectedYear") ? parseInt(localStorage.getItem("selectedYear"), 10) : 1950;
    yearSlider.noUiSlider.set(defaultYear);
    selectedYearLabel.textContent = defaultYear;
    loadInitialStateFromCache();
    updateChart();
});
