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


//Create the legend control
function createLegend(attributes){
    var LegendControl = L.Control.extend({
        options: {
            position: 'bottomright'
        },
        onAdd: function () {
            var container = L.DomUtil.create('div', 'legend-control-container');
            //add temporal legend div to container
            container.innerHTML = `
                <div id="legend-attribute" style="font-weight:bold; font-size:16px;"></div>
            `;
            // Legend dynamic value
            container.insertAdjacentHTML(
                "beforeend",
                "<div id='legend-attribute' style='font-weight:bold;'></div>"
            );
            // Initialize with first attribute
            container.querySelector("#legend-attribute").textContent =
                getCleanName(attributes[0]);
            //return containter div
            return container;
        }
    });

    map.addControl(new LegendControl());
}


//Create new sequence controls
function createSequenceControls(attributes){   
    var SequenceControl = L.Control.extend({
        options: {
            position: 'bottomleft'
        },
            onAdd: function () {
            // create the control container div with a particular class name
            var container = L.DomUtil.create('div', 'sequence-control-container');
            //add elements to the container
            container.insertAdjacentHTML('beforeend', '<button class="step" id="reverse" title="Reverse"><img src="img/reverse.png"></button>'); 
            container.insertAdjacentHTML('beforeend', '<input class="range-slider" type="range">')
            container.insertAdjacentHTML('beforeend', '<button class="step" id="forward" title="Forward"><img src="img/forward.png"></button>');
            //disable any mouse event listeners for the container
            L.DomEvent.disableClickPropagation(container);
            //return the container div
            return container;
        }
    });
    //add the sequence control to the map
    map.addControl(new SequenceControl());  
    //add functionality to the sequence control elements
    var rangeslider = document.querySelector(".range-slider");
    var reverseBtn = document.querySelector("#reverse");
    var forwardBtn = document.querySelector("#forward");
    //Event listener for the range slider
    rangeslider.max = attributes.length - 1;
    rangeslider.min = 0; 
    rangeslider.value = 0; 
    rangeslider.step = 1;
    //Input event for the range slider
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

            document.querySelector("#legend-attribute").textContent = 
                getCleanName(attributes[index]);
        })
    })
}


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
            //call legend function
            createLegend(attributes);
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