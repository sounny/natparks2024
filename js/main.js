//declare map variable
var map;


//function to calculate the radius of each proportional symbol
function calcPropRadius(attValue) {
    return Math.pow(attValue, 0.3) * 0.15 + 4;
}


//Function to get a clean name for the attribute.
function getCleanName(attribute){
    const att_labels = {
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
    //Return the corresponding clean name or the original attribute if not found.
    return att_labels[attribute] || attribute;
}


//Popup content constructor function.
function PopupContent(properties, attribute){
    this.properties = properties;
    this.attribute = attribute;
    this.parkname = properties.UNIT_NAME;
    this.parktype = properties.UNIT_TYPE;
    this.recvisits = properties[attribute].toLocaleString();
    this.formatted = "<p><b><h2>" + this.parkname + "</h2></b>" +
        "</p><p><b>Park Type:  </b>" + this.parktype +
        "</p><p><b>Recreation Visits: </b>" + this.recvisits + "</p>";
}


//Function to convert markers to circle markers
function pointToLayer(feature, latlng, attributes){
    // Attribute to visualize with proportional symbols.
    var attribute = attributes[0];
    //Marker options
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
    var popupContent = new PopupContent(feature.properties, attribute);
    //bind the popup to the circle marker
    layer.bindPopup(popupContent.formatted, {
        offset: new L.Point(0,-options.radius) 
    });
    //Return the circle marker to the L.geoJson pointToLayer option
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


//Function to update the proportional symbols based on the selected attribute.
function updatePropSymbols(attribute){
    map.eachLayer(function(layer){
        if (layer.feature && layer.feature.properties[attribute]){
            //Get the properties for the feature
            var props = layer.feature.properties;
            // Calculate the new radius
            var radius = calcPropRadius(props[attribute]);
            layer.setRadius(radius);
            //Create new popup content
            var popupContent = new PopupContent(props, attribute);
            //Update popup content
            var popup = layer.getPopup();            
            popup.setContent(popupContent.formatted).update();
        };
    });
};


//Function to update the label for the current attribute
function updateLabel(attribute){
    document.querySelector("#attribute-label").innerHTML =
        "<h1>" + getCleanName(attribute) + "</h1>";
}


//Function to create the sequence controls.
function createSequenceControls(attributes){
    //create range input element (slider)
    var slider = "<input class='range-slider' type='range'></input>";
    document.querySelector("#forward").insertAdjacentHTML('beforebegin',slider);
    // Add images to buttons
    document.querySelector('#reverse').insertAdjacentHTML('beforeend',"<img src='img/reverse.png'>");
    document.querySelector('#forward').insertAdjacentHTML('beforeend',"<img src='img/forward.png'>");
    //Cache the slider and buttons
    var rangeslider = document.querySelector(".range-slider");
    var forwardBtn = document.querySelector("#forward");
    var reverseBtn = document.querySelector("#reverse");
    //Set slider attributes
    rangeslider.max = attributes.length - 1;
    rangeslider.min = 0;
    rangeslider.value = 0;
    rangeslider.step = 1;
    //Add event listeners for buttons
    document.querySelectorAll('.step').forEach(function(step){
        step.addEventListener("click", function(){
            //get the current index value
            var index = Number(rangeslider.value);
            //Update the index value based on button clicked
            if (step.id == 'forward'){
                index++;
                if (index > attributes.length - 1) index = 0;
            } else if (step.id == 'reverse'){
                index--;
                if (index < 0) index = attributes.length - 1;
            };
            //Update slider position
            rangeslider.value = index;
            // Call update functions
            updatePropSymbols(attributes[index]);
            updateLabel(attributes[index]);
        })
    })
};  


//  Process the data to extract the attributes.
function processData(data){
    //Initialize empty array to hold attributes
    var attributes = [];
    //List of months to check for in attribute names
    var months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];
    //Get the properties of the first feature in the dataset
    var properties = data.features[0].properties;
    //Extract the attributes
    for (var attribute in properties) {
        if (attribute.indexOf("Annual") > -1) {
            attributes.push(attribute);
        }
    }
    //Check for monthly attributes
    for (var attribute in properties) {
        // loop through the months array
        for (var i = 0; i < months.length; i++) {
            if (attribute.indexOf(months[i]) > -1) {
                attributes.push(attribute);
                break;
            }
        }
    }
    //Return the attributes array.
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


//function to instantiate the Leaflet map
function createMap(){
    //create the map
    map = L.map('map', {
        center: [38, -97],
        zoom: 5
    });
    //add OSM base tilelayer
    L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
        attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, Imagery &copy; <a href="http://mapbox.com">Mapbox</a>',
        maxZoom: 18,
        id: 'dmgibbs/cm94wd6kw007601qtbeowhwhh',
        accessToken: 'pk.eyJ1IjoiZG1naWJicyIsImEiOiJjbTdlN2hxejMwYXBsMmtvZ25vcXAwY3g4In0.XBq_6BSCkFxo84-pCx_17w'
    }).addTo(map);
    //call getData function
    getData();
};


//Call the createMap function when the DOM is loaded
document.addEventListener('DOMContentLoaded',createMap)