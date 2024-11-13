//https://www.youtube.com/watch?v=c0a02WHjgEs
/*--------------------------------------------
DEFINITION DU SVG
--------------------------------------------*/
var svg = d3.select("svg"),
  width = window.innerWidth - 200 ,
  height =  window.innerHeight  - 150;

svg.attr("width", width).attr("height", height);
var g = svg.append("g");
/*--------------------------------------------
--------------------------------------------*/



/*--------------------------------------------
DEFINITION DU ZOOM
--------------------------------------------*/
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
/*--------------------------------------------
--------------------------------------------*/



/*--------------------------------------------
DEFINITION DU TOOLTIP
--------------------------------------------*/
var Tooltip = d3.select("#my_dataviz")
.append("div")
.attr("class", "tooltip")
.style("opacity", 0)
.style("background-color", "white")
.style("border", "solid")
.style("border-width", "2px")
.style("border-radius", "5px")
.style("padding", "5px")
.style("position", "absolute")
/*--------------------------------------------
--------------------------------------------*/



/*--------------------------------------------
DEFINITION DES MOUSE ACTION
--------------------------------------------*/
//TOOLTIP
var mouseover = function(d) {
  Tooltip.style("opacity", 1)
}
var mousemove = function(d) {
  Tooltip
  .html(d.properties.listeCountGenre[0]._id.pays + "<br>"+ d.properties.listeCountGenre[0].nbAlbums+ " albums "+ "<br>")
  .style("left", (d3.mouse(this)[0]) + "px")
  .style("top", (d3.mouse(this)[1]) + "px")
}
var mouseleave = function(d) {
  Tooltip.style("opacity", 0)
}

//BULLES
var mouseclick = function(d) {
  console.log("Hello " + d.properties.listeCountGenre[0]._id.pays + "  " + genreAGarder)
}
/*--------------------------------------------
--------------------------------------------*/



/*--------------------------------------------
DEFINITION DU FILTRE GENRE - DROP-DOWN
--------------------------------------------*/
var genreAGarder = "Pop"
document.getElementById("titre").innerHTML = "Répartition du genre " + genreAGarder+ " dans le monde"
var listeGenres = document.getElementById("genresAll")
var liste_valeurs_genre = new Array()

function defineDropDownGenre() {
  d3.json("../traitements_mongoDB/fichiers_json/UX_Projet.wasabi_clean_map.json", function (dataTemp) {
    var liste_temp = new Array()
    dataTemp.forEach(
      d => {
        liste_temp.push(d._id.genreP)
      } 
    )

    liste_valeurs_genre = Array.from(new Set(liste_temp))
    liste_valeurs_genre.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
    liste_valeurs_genre.forEach(
      d => {
        childElement = document.createElement("option")
        if (d ==genreAGarder) {
          childElement.setAttribute('selected', true)
        }
        childElement.value = d
        childElement.innerHTML = d
        listeGenres.appendChild(childElement)
      }
    )
  });
}

function launchDropDownGenre(){
  var element = document.getElementById("genresAll")
  var value = element.value;
  genreAGarder = value
  document.getElementById("titre").innerHTML = "Répartition du genre " + genreAGarder+ " dans le monde"
  
  //APPEL FONCTION POUR AFFICHAGE CARTE
  d3.queue()
  .defer(d3.json, "https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson")  // dataGeo
  .defer(d3.json, "../traitements_mongoDB/fichiers_json/UX_Projet.wasabi_clean_map.json") // data
  .await(ready);
}
/*--------------------------------------------
--------------------------------------------*/



/*--------------------------------------------
DEFINITION DU FILTRE PAYS - DROP-DOWN
--------------------------------------------*/
var paysAGarder = "All"
var listePays = document.getElementById("countryAll")
var liste_valeurs_pays = new Array()

function defineDropDownPays() {
  d3.json("../traitements_mongoDB/fichiers_json/UX_Projet.wasabi_clean_map.json", function (dataTemp) {
    var liste_temp = new Array()
    dataTemp.forEach(
      d => {
        liste_temp.push(d._id.pays)
      } 
    )

    childElement = document.createElement("option")
    childElement.value = "All"
    childElement.innerHTML = "All"
    childElement.setAttribute('selected', true)
    listePays.appendChild(childElement)
    

    liste_valeurs_pays = Array.from(new Set(liste_temp))
    liste_valeurs_pays.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
    liste_valeurs_pays.forEach(
      d => {
        childElement = document.createElement("option")
        childElement.value = d
        childElement.innerHTML = d
        listePays.appendChild(childElement)
      }
    )
    
  });
}

function launchDropDownPays(){
  console.log("drop down pays")
  var element = document.getElementById("countryAll")
  var value = element.value;
  paysAGarder = value

  //APPEL FONCTION POUR AFFICHAGE CARTE
  d3.queue()
  .defer(d3.json, "https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson")  // dataGeo
  .defer(d3.json, "../traitements_mongoDB/fichiers_json/UX_Projet.wasabi_clean_map.json") // data
  .await(ready);
}
/*--------------------------------------------
--------------------------------------------*/


/*--------------------------------------------
DEFINITION DU FILTRE ANNEE - SLICER
--------------------------------------------*/
var valueExtentYear = [0, 0]
var slider = document.getElementById("myRange");
var output = document.getElementById("valueYear");

function defineSclicer() {
  if (document.getElementById("yearAll").checked) {
    console.log("Je veux tout")
    d3.json("../traitements_mongoDB/fichiers_json/UX_Projet.wasabi_clean_map.json", function (dataTemp) { 
      valueExtentYear = d3.extent(dataTemp, function(d) { return +d._id.date; })
    }); 
  } else {
    console.log("Je veux uniquement de 1950 à 2024")
    valueExtentYear = [1950, 2024]
  }

  slider = document.getElementById("myRange");
  output = document.getElementById("valueYear");
  d3.queue()
  .defer(d3.json, "../traitements_mongoDB/fichiers_json/UX_Projet.wasabi_clean_map.json").await(launchSlicer)
}


function launchSlicer(error, dataJsonSlider) {
  //DEF MIN ET MAX
  document.getElementById("myRange").setAttribute("min", valueExtentYear[0])
  document.getElementById("myRange").setAttribute("max", valueExtentYear[1])
  min = Math.ceil(document.getElementById("myRange").getAttribute("min"))
  max = Math.floor(document.getElementById("myRange").getAttribute("max"))

  //AFFECTATION ANNEE ALEATOIRE SLIDER
  slider.value = Math.floor(Math.random() * (max - min + 1)) + min;
  output.innerHTML = slider.value; 

  //APPEL FONCTION POUR AFFICHAGE CARTE
  d3.queue()
  .defer(d3.json, "https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson")  // dataGeo
  .defer(d3.json, "../traitements_mongoDB/fichiers_json/UX_Projet.wasabi_clean_map.json") // data
  .await(ready);
}

//COMPORTEMENT SI UTILISATION SLICER
slider.oninput = function() {
  output.innerHTML = this.value;
  slider.value = this.value
  console.log("UPDATE CARTE SLICER")

  //APPEL FONCTION POUR AFFICHAGE CARTE
  d3.queue()
  .defer(d3.json, "https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson")  // dataGeo
  .defer(d3.json, "../traitements_mongoDB/fichiers_json/UX_Projet.wasabi_clean_map.json") // data
  .await(ready);
} 
/*--------------------------------------------
--------------------------------------------*/



/*--------------------------------------------
DEFINITION DE LA CARTE AVEC LA PRISE EN COMPTE DES FILTRES
--------------------------------------------*/
function ready(error, dataGeo, dataJsonReady) {
  console.log(genreAGarder)
  console.log(paysAGarder)
  console.log(slider.value)
  //FILTRAGE DONNEES EN FONCTION DES FILTRES
  if(paysAGarder == "All") {
    dataJsonReady = dataJsonReady.filter(item => item._id.genreP.toLowerCase() == genreAGarder.toLowerCase() && item._id.date == slider.value)
  } else {
    console.log("Filtrage pays")
    dataJsonReady = dataJsonReady.filter(item => item._id.genreP.toLowerCase() == genreAGarder.toLowerCase() && item._id.date == slider.value && item._id.pays.toLowerCase() == paysAGarder.toLowerCase())
  }

  dataJsonReady.forEach(
    d => {
      if(d._id.pays.toLowerCase() == "united states of america") {
        console.log("USA")
        d._id.pays = "USA"
      } 
      else if(d._id.pays.toLowerCase() == "korea (south)") {
        d._id.pays = "South Korea"
      }
      else if(d._id.pays.toLowerCase() == "russian federation") {
        d._id.pays = "Russia"
      }
    }
  )
  
  //LIAISON DONNEES GEO + WASABI
  dataGeo.features.forEach(d => {
    var listGenresWithCount = dataJsonReady.filter(item => item._id.pays.toLowerCase() == d.properties.name.toLowerCase())
    if(listGenresWithCount.length == 0) {
      elem = {"nbAlbums" : 0}
      listGenresWithCount.push(elem)
    }

    Object.assign(d.properties, {"listeCountGenre": listGenresWithCount})
  });

  console.log(dataGeo.features)

  //DEF CALCUL DES BULLES
  var valueExtent = d3.extent(dataJsonReady, function(d) { return +d.nbAlbums; })
  var size = d3.scaleSqrt()
    .domain(valueExtent)  // What's in the data
    .range([0, 50])  // Size in pixel

  
  //DEF CARTE DU MONDE
  var projection = d3.geoNaturalEarth1()
  .fitSize([width, height], dataGeo)

  //AFFICHAGE DE LA CARTE DU MONDE
  g
  .selectAll("path")
  .data(dataGeo.features)
  .enter().append("path")
  .attr("fill", "#808080")
  .attr("d", d3.geoPath()
    .projection(projection)
  )
  .style("stroke", "#fff") 
  .attr("width",width)
  .attr("heigth",height)

  
  //GESTION AFFICHAGE CERCLES
  g.selectAll("circle").remove()



  //CALCUL DES CENTRES + AFFICHAGE
  const getLargestPolygon = (geometry) => {
    // If it's a MultiPolygon, find the largest polygon
    if (geometry.type === "MultiPolygon") {
      let largestArea = 0;
      let largestPolygon = null;
      geometry.coordinates.forEach((polygon) => {
        const area = d3.geoArea({ type: "Polygon", coordinates: polygon });
        if (area > largestArea) {
          largestArea = area;
          largestPolygon = polygon;
        }
      });
      return { type: "Polygon", coordinates: largestPolygon };
    } else {
      // If it's already a Polygon, return it
      return geometry;
    }
  };


  g
  .selectAll("circle")
  .data(dataGeo.features)
  .enter()
  .append("circle")
    .attr("class", "circle")
    .attr("cx", d=> projection(d3.geoCentroid(getLargestPolygon(d.geometry)))[0])
    .attr("cy", d=> projection(d3.geoCentroid(getLargestPolygon(d.geometry)))[1])
    .attr("r",function(d){if (isNaN((size(+d.properties.listeCountGenre[0].nbAlbums)))) return 0;else if(paysAGarder != "All") return d.properties.listeCountGenre[0].nbAlbums  ;else return size(+d.properties.listeCountGenre[0].nbAlbums)})
    .attr("fill-opacity", 0.5)
    .style("fill", "blue")
  .on("mouseover", mouseover)
  .on("mousemove", mousemove)
  .on("mouseleave", mouseleave)
  .on("click",mouseclick)
}

/*--------------------------------------------
--------------------------------------------*/



/*--------------------------------------------
AJOUT DE LA LEGENDE
--------------------------------------------*/
var svgbis = d3.select("#circle").append("svg").attr("width", 100).attr("height", 100)
svgbis.append('circle')
  .attr('cx', 50)
  .attr('cy', 50)
  .attr('r', 25)
  .attr('stroke', 'black')
  .attr('fill', 'blue')
  .attr("fill-opacity", 0.5)
/*--------------------------------------------
--------------------------------------------*/



/*--------------------------------------------
MAIN
--------------------------------------------*/
defineSclicer()
defineDropDownGenre()
defineDropDownPays()