//https://www.youtube.com/watch?v=c0a02WHjgEs
var genreAGarder = "Latin"

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
    
svg.call(zoom)


//Tooltip definition
var Tooltip = d3.select("#my_dataviz")
.append("div")
.attr("class", "tooltip")
.style("opacity", 1)
.style("background-color", "white")
.style("border", "solid")
.style("border-width", "2px")
.style("border-radius", "5px")
.style("padding", "5px")
.attr('style', 'position: absolute;');

//Mouse Action definition
var mouseover = function(d) {
  Tooltip.style("opacity", 1)
}
var mousemove = function(d) {
  Tooltip
    .html(d.properties.listeCountGenre[0]._id.pays + "<br>" + "Nombre d'albums: "+ "<br>" + d.properties.listeCountGenre[0].nbAlbums)
    .style("left", (30+ "px"))
    .style("top", (30 + "px"))
}
var mouseleave = function(d) {
  Tooltip.style("opacity", 0)
}

var mouseclick = function(d) {
  console.log("Hello " + d.properties.listeCountGenre[0]._id.pays)
}


//Chargement des donnees pour la carte et wasabi
d3.queue()
  .defer(d3.json, "https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson")  // dataGeo
  .defer(d3.json, "../traitements_mongoDB/fichiers_json/UX_Projet.wasabi_clean_map.json") // data
  .await(ready);

function ready(error, dataGeo, data) {
  //Filtrage des donnees
  data = data.filter(item => item._id.genreP == genreAGarder)

  // Mise en place du calcul de la taille des bulles
  var valueExtent = d3.extent(data, function(d) { return +d.nbAlbums; })
  var size = d3.scaleSqrt()
    .domain(valueExtent)  // What's in the data
    .range([0, 50])  // Size in pixel

  
  //Mise en place de la carte
  var projection = d3.geoNaturalEarth1()
  .fitSize([width, height], dataGeo)

  //Liaison entre dataGeo et data sur le nom de pays
  //voir pour la liaison à faire car code sur 2 dans mongo et sur geo sur 3
  dataGeo.features.forEach(d => {
    var listGenresWithCount = data.filter( item => item._id.pays == d.properties.name)
    if(listGenresWithCount.length == 0) {
      elem = {"nbAlbums" : 0}
      listGenresWithCount.push(elem)
    }

    //Rajout d'une liste contenant un objet avec le nombre d'albums pour le pays
    Object.assign(d.properties, {"listeCountGenre": listGenresWithCount})
  });

  console.log(dataGeo.features)

  // Affichage de la carte
    g
      .selectAll("path")
      .data(dataGeo.features)
      .enter().append("path")
        .attr("fill", "#808080")
        .attr("d", d3.geoPath()
            .projection(projection)
        )
      .style("stroke", "#fff") 

  // Affichage des cercles
    g
      .selectAll('circle')
      .data(dataGeo.features)
      .enter()
      .append('circle')
        .attr('class', 'circle')
        .attr('cx', d=> projection(d3.geoCentroid(d))[0])
        .attr('cy', d=> projection(d3.geoCentroid(d))[1])
        .attr('r',function(d){ return size(+d.properties.listeCountGenre[0].nbAlbums)})
        .attr('fill-opacity', 0.2)
        .style("fill", "red")
      .on("mouseover", mouseover)
      .on("mousemove", mousemove)
      .on("mouseleave", mouseleave)
      .on("click",mouseclick)
}

