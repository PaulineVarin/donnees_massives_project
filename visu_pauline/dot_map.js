//https://www.youtube.com/watch?v=c0a02WHjgEs
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

d3.queue()
  .defer(d3.json, "https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson")  // dataGeo
  .defer(d3.json, "../traitements_mongoDB/fichiers_json/UX_Projet.wasabi_clean_map.json") // data
  .await(ready);

function ready(error, dataGeo, data) {

  const x = data

  //Récupération des continents
  var allContinent = d3.map(data, function(d){
    return(d._id.pays)
  }).keys()

  //Mise en place des couleurs pour les continents
  var color = d3.scaleOrdinal()
    .domain(allContinent)
    .range(d3.schemePaired);

    // Add a scale for bubble size
    var valueExtent = d3.extent(data, function(d) { return +d.nbAlbums; })
    var size = d3.scaleSqrt()
      .domain(valueExtent)  // What's in the data
      .range([ 1, 50])  // Size in pixel

  
  // Map and projection
  var projection = d3.geoNaturalEarth1()
  .fitSize([width, height], dataGeo);

  dataGeo.features.forEach(d => {
    var countgenre = data.filter( item => item._id.pays == d.properties.name)
    //traiter le cas ou le pays n'a pas de genre et voir pour la liaison à faire 
    Object.assign(d.properties, {"listeCountGenre": countgenre})
  });

  console.log(dataGeo.features)

  // Draw the map
    g
      .selectAll("path")
      .data(dataGeo.features)
      .enter().append("path")
          .attr("fill", "#808080")
          .attr("d", d3.geoPath()
              .projection(projection)
          )
          .style("stroke", "#fff") 

          console.log(dataGeo.features)
  // Add circles
    g
      .selectAll("circle")
      .data(dataGeo.features)
      .enter().append('circle')
      .attr('class', 'country-circle')
      .attr('cx', d=> projection(d3.geoCentroid(d))[0])
      .attr('cy', d=> projection(d3.geoCentroid(d))[1])
      .attr('r',function(d){ return size(+d.properties.listeCountGenre[0].nbAlbums)})
}

