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
function pointToLayer(feature, latlng, attributes){
    //Determine which attribute to visualize with proportional symbols
    var attribute = attributes[0];

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
    var popupContent = "<p><b><h2>" + feature.properties.UNIT_NAME + "</h2></b>" + "</p><p><b>Park Type:  </b>" + feature.properties.UNIT_TYPE +"</p><p><b>Recreation Visits: </b>" + feature.properties[attribute] + "</p>";

    //bind the popup to the circle marker
    layer.bindPopup(popupContent, {
        offset: new L.Point(0,-options.radius) 
    });

    console.log(attributes);
    //return the circle marker to the L.geoJson pointToLayer option
    return layer;
};


//Add circle markers for point features to the map
function createPropSymbols(data, attributes){
    //create a Leaflet GeoJSON layer and add it to the map
    L.geoJson(data, {
        pointToLayer: function(feature, latlng){
            return pointToLayer(feature, latlng, attributes);
        }
    }).addTo(map);
};

function updatePropSymbols(attribute){
    map.eachLayer(function(layer){
        if (layer.feature && layer.feature.properties[attribute]){

            var props = layer.feature.properties;

            var radius = calcPropRadius(props[attribute]);
            layer.setRadius(radius);

            var popupContent = "<p><b><h2>" + props.UNIT_NAME + "</h2></b>" +
                "</p><p><b>Park Type:  </b>" + props.UNIT_TYPE +
                "</p><p><b>Recreation Visits: </b>" + props[attribute] + "</p>";

            popup = layer.getPopup();            
            popup.setContent(popupContent).update();
        };
    });
};


function getCleanName(attribute){
    const map = {
        "AnnualTota": "Annual Total",
        "JanuaryRec": "January",
        "FebruaryRe": "February",
        "MarchRecre": "March",
        "AprilRecre": "April",
        "MayRecreat": "May",
        "JuneRecrea": "June",
        "JulyRecrea": "July",
        "AugustRecr": "August",
        "SeptemberR": "September",
        "OctoberRec": "October",
        "NovemberRe": "November",
        "DecemberRe": "December"
    };

    return map[attribute] || attribute;
}

function updateLabel(attribute){
    document.querySelector("#attribute-label").innerHTML =
        "<h1>" + getCleanName(attribute) + "</h1>";
}

function createSequenceControls(attributes){
    //create range input element (slider)
    var slider = "<input class='range-slider' type='range'></input>";
    document.querySelector("#forward").insertAdjacentHTML('beforebegin',slider);

    //set slider attributes
    document.querySelector(".range-slider").max = 12;
    document.querySelector(".range-slider").min = 0;
    document.querySelector(".range-slider").value = 0;
    document.querySelector(".range-slider").step = 1;

    document.querySelector('#reverse').insertAdjacentHTML('beforeend',"<img src='img/reverse.png'>")
    document.querySelector('#forward').insertAdjacentHTML('beforeend',"<img src='img/forward.png'>")

    document.querySelectorAll('.step').forEach(function(step){
        step.addEventListener("click", function(){

            var index = Number(document.querySelector('.range-slider').value);

            if (step.id == 'forward'){
                index++;
                index = index > 12 ? 0 : index;
            } else if (step.id == 'reverse'){
                index--;
                index = index < 0 ? 12 : index;
            };

            document.querySelector('.range-slider').value = index;
            updatePropSymbols(attributes[index]);
            updateLabel(attributes[index]);
        })
    })

};  


function processData(data){
    var attributes = [];

    var months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    var properties = data.features[0].properties;

    for (var attribute in properties) {
        if (attribute.indexOf("Annual") > -1) {
            attributes.push(attribute);
        }
    }

    for (var attribute in properties) {
        for (var i = 0; i < months.length; i++) {
            if (attribute.indexOf(months[i]) > -1) {
                attributes.push(attribute);
                break;
            }
        }
    }

    console.log(attributes);
    return attributes;
};


//Step 2: Import GeoJSON data
function getData(){
    //load the data
    fetch("data/natparks.geojson")
        .then(function(response){
            return response.json();
        })
        .then(function(json){
            //create an attributes array
            var attributes = processData(json);
            //call function to create proportional symbols
            createPropSymbols(json, attributes);
            //call the function to create the slider.
            createSequenceControls(attributes);
            //calls the uipdate label function.
            updateLabel(attributes[0]);
        })
};

document.addEventListener('DOMContentLoaded',createMap)