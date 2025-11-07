//declare map var in global scope
var map;
//function to instantiate the Leaflet map
function createMap(){
    //create the map
    map = L.map('map', {
        center: [38, -97],
        zoom: 5
    
    });

    //add tile layer...replace project id and accessToken with your own
    L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
        attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, Imagery &copy; <a href="http://mapbox.com">Mapbox</a>',
        maxZoom: 18,
        id: 'dmgibbs/cm94wd6kw007601qtbeowhwhh',
        accessToken: 'pk.eyJ1IjoiZG1naWJicyIsImEiOiJjbTdlN2hxejMwYXBsMmtvZ25vcXAwY3g4In0.XBq_6BSCkFxo84-pCx_17w'
    }).addTo(map);

    //call getData function
    getData();
};


//calculate the radius of each proportional symbol
function calcPropRadius(attValue) {
    return Math.pow(attValue, 0.3) * 0.15 + 4;
}

//function to convert markers to circle markers
function pointToLayer(feature, latlng){
    //Determine which attribute to visualize with proportional symbols
    var attribute = "Recreati_2";

    //create marker options
    var options = {
        fillColor: "#f8c20fff",
        color: "#af4600ff",
        weight: 2,
        fillOpacity: 0.8,
    };

    //For each feature, determine its value for the selected attribute
    var attValue = Number(feature.properties[attribute]);

    //Give each feature's circle marker a radius based on its attribute value
    options.radius = calcPropRadius(attValue);

    //create circle marker layer
    var layer = L.circleMarker(latlng, options);

    //build popup content string
    var popupContent = "<p><b><h2>" + feature.properties.UNIT_NAME + "</h2></b>" + "</p><p><b>Park Type:  </b>" + feature.properties.UNIT_TYPE +"</p><p><b>Recreation Visits Total:  </b>" + feature.properties[attribute] + "</p>";

    //bind the popup to the circle marker
    layer.bindPopup(popupContent, {
        offset: new L.Point(0,-options.radius) 
    });

    //return the circle marker to the L.geoJson pointToLayer option
    return layer;
};


//Add circle markers for point features to the map
function createPropSymbols(data){
    //create a Leaflet GeoJSON layer and add it to the map
    L.geoJson(data, {
        pointToLayer: pointToLayer
    }).addTo(map);
};


//Step 2: Import GeoJSON data
function getData(){
    //load the data
    fetch("data/natparks.geojson")
        .then(function(response){
            return response.json();
        })
        .then(function(json){
            //call function to create proportional symbols
            createPropSymbols(json);
        })
};

document.addEventListener('DOMContentLoaded',createMap)