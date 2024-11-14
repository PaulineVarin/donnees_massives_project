let rootData = null;


function createCheckboxes(data) {

  const sortedChildren = data.children.sort((a, b) => a.name.localeCompare(b.name));

  // Add checkboxes for each main genre
  const checkboxContainer = d3.select("#checkboxContainer");

  sortedChildren.forEach((child, index) => {
    const label = checkboxContainer.append("label")
            .attr("class", "checkbox-label");
    
    label.append("input")
            .attr("type", "checkbox")
            .attr("id", `checkbox${index}`)
            .attr("value", index)
            .property("checked", true);
    
    label.append("div")
            .attr("class", "checkbox-custom");
    
    label.append("span")
            .text(child.name);
    });
}
    

//Function to update the sunburst diagram with selected filters
function updateSunburst() {
  //Remove the previous graph
  d3.select("#chart").selectAll("*").remove();

  const selectedIndices = [];
  d3.selectAll("input[type=checkbox]").each(function() {
      if (this.checked) selectedIndices.push(+this.value);
  });

  const filteredData = {
    name: rootData.name,
    children: rootData.children.filter((_, i) => selectedIndices.includes(i))
  };

  document.getElementById("chart").appendChild(createSunburst(filteredData));
}

    

function createSunburst(data) {
  // Specify the chart’s colors and approximate radius (it will be adjusted at the end)
  const color = d3.scaleOrdinal(d3.quantize(d3.interpolateRainbow, data.children.length + 1));
  const radius = 550 / 2;
  const tooltip = d3.select("#tooltip");
  const format = d3.format(",d");

  // Prepare the layout
  const partition = data => d3.partition()
    .size([2 * Math.PI, radius])
  (d3.hierarchy(data)
    .sum(d => d.value)
    .sort((a, b) => b.value - a.value));

  const arc = d3.arc()
    .startAngle(d => d.x0)
    .endAngle(d => d.x1)
    .padAngle(d => Math.min((d.x1 - d.x0) / 2, 0.005))
    .padRadius(radius / 2)
    .innerRadius(d => d.y0)
    .outerRadius(d => d.y1 - 1);

  const root = partition(data);

  // Create the SVG container
  const svg = d3.create("svg")
            .attr("width", radius * 2)
            .attr("height", radius * 2);

  // Add an arc for each element, with a title for tooltips
  const arcs = svg.append("g")
        .attr("fill-opacity", 0.6)
        .selectAll("path")
        .data(root.descendants().filter(d => d.depth))
        .join("path")
        .attr("fill", d => { while (d.depth > 1) d = d.parent; return color(d.data.name); })
        .attr("d", arc)
        .on("mouseover", function(event, d) {
          tooltip.style("opacity", 0.5)
                .html(`<p>${d.data.name}</p><br><p>Valeur: ${format(d.value)}</p>`);
          d3.select(this)
            .transition()
            .duration(200)
            .attr("fill-opacity", 1)    
            .attr("transform", "scale(1.05)"); 
        })
        .on("mousemove", function(event, d) {
          tooltip.style("left", (event.pageX + 10) + "px")
                 .style("top", (event.pageY - 20) + "px")
                 .html(`<p>${d.data.name}</p><p>Nombre d'albums: ${format(d.value)}</p>`);
        })
        .on("mouseout", function(event, d) {
          tooltip.style("opacity", 0)
          d3.select(this)
            .transition()
            .duration(200)
            .attr("fill-opacity", 0.6)
            .attr("transform", "scale(1)"); 
        })
        .style("opacity", 0) 
        .transition()
        .duration(500)
        .style("opacity", 1)
        .attr("d", arc); 

  function decodeHtmlEntities(str) {
    const txt = document.createElement("textarea");
    txt.innerHTML = str;
    return txt.value;
  }

  // Add a label for each element
  svg.append("g")
      .attr("pointer-events", "none")
      .attr("text-anchor", "middle")
      .attr("font-size", 10)
      .attr("font-family", "sans-serif")
      .selectAll("text")
      .style("opacity", 0) 
      .data(root.descendants().filter(d => d.depth && (d.y0 + d.y1) / 2 * (d.x1 - d.x0) > 10))
      .join("text")
      .attr("transform", function(d) {
        const x = (d.x0 + d.x1) / 2 * 180 / Math.PI;
        const y = (d.y0 + d.y1) / 2;
        return `rotate(${x - 90}) translate(${y},0) rotate(${x < 180 ? 0 : 180})`;
      })
      .attr("dy", "0.35em")
      .transition()
      .duration(500)
      .style("opacity", 1)
      .text(d => decodeHtmlEntities(d.data.name));

  // The autoBox function adjusts the SVG’s viewBox to the dimensions of its contents
  return svg.attr("viewBox", autoBox).node();

}

function selectAll() {
  const checkboxes = d3.select("#checkboxContainer").selectAll("input[type=checkbox]");
  checkboxes.property("checked", true);
  updateSunburst();
}

function deselectAll() {
  const checkboxes = d3.select("#checkboxContainer").selectAll("input[type=checkbox]");
  checkboxes.property("checked", false);
  updateSunburst();
}
  

// Update the diagram when the checkbox is changed
document.addEventListener("DOMContentLoaded", function() {
  document.getElementById('selectAll').addEventListener('click', selectAll);
});

// Update the diagram when the checkbox is changed
document.addEventListener("DOMContentLoaded", function() {
  document.getElementById('deselectAll').addEventListener('click', deselectAll);
});

d3.json("hierarchie_genre.json").then(data => {
  rootData = Array.isArray(data) ? data[0] : data;

  createCheckboxes(rootData); 
  updateSunburst(); 

// Redraw diagram when checkboxes change
d3.select("#checkboxContainer").selectAll("input[type=checkbox]").on("change", updateSunburst);
}).catch(error => {
  console.error("Erreur lors du chargement des données:", error);
});


// AutoBox function to adjust SVG view
autoBox = function autoBox() {
  document.body.appendChild(this);
  const {x, y, width, height} = this.getBBox();
  document.body.removeChild(this);
  return [x, y, width, height];
}