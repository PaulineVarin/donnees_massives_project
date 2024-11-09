//SVG definition
var svg = d3.select("svg"),
    width = window.innerWidth -100 ,
    height =  window.innerHeight  - 50;

svg.attr('width', width).attr('height', height);
var g = svg.append("g");


//Zoom definition
function zoomed() {
  var transform = d3.event.transform; 
  g.style("stroke-width", 1.5 / transform.k + "px");
  g.attr("transform", transform);
}

var zoom = d3.zoom()
    .scaleExtent([1, 8]) // sclale min and max on the map
    .translateExtent([[0, 0], [width, height]]) //limit the zoom at the map
    .on("zoom", zoomed);

d3.select('#zoom-in').on('click', function() {
  // Smooth zooming
	zoom.scaleBy(svg.transition().duration(750), 1.3);
});

d3.select('#zoom-out').on('click', function() {
  // Ordinal zooming
  zoom.scaleBy(svg, 1 / 1.3);
});

svg.call(zoom);


// Load external data and boot
d3.json("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson", function(data){

    // Map and projection
    var projection = d3.geoNaturalEarth1()
    .fitSize([width, height], data);

    // Draw the map
      g
        .selectAll("path")
        .data(data.features)
        .enter().append("path")
            .attr("fill", "#808080")
            .attr("d", d3.geoPath()
                .projection(projection)
            )
            .style("stroke", "#fff") 
})