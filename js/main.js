//declare map variable
var map;
//array for storing data statistics
var dataStats = {};
//store park data globally for search and top 10
var parkData = null;
//store current attribute for Top 10 updates
var currentAttribute = null;

//function to calculate the radius of each proportional symbol
function calcPropRadius(attValue) {
    return Math.pow(attValue, 0.3) * 0.15 + 4;
}

function calcStats(data, attributes) {
    var allValues = [];

    data.features.forEach(function (feature) {
        attributes.forEach(function (att) {
            var v = Number(feature.properties[att]);
            if (!isNaN(v)) {
                allValues.push(v);
            }
        });
    });

    dataStats.min = Math.min(...allValues);
    dataStats.max = Math.max(...allValues);

    var sum = allValues.reduce((a, b) => a + b, 0);
    dataStats.mean = sum / allValues.length;
}


//Function to get a clean name for the attribute.
function getCleanName(attribute) {
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
function PopupContent(properties, attribute) {
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
function pointToLayer(feature, latlng, attributes) {
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
        offset: new L.Point(0, -options.radius)
    });
    //Return the circle marker to the L.geoJson pointToLayer option
    return layer;
};


//Add circle markers for point features to the map
function createPropSymbols(data, attributes) {
    //create a Leaflet GeoJSON layer and add it to the map
    L.geoJson(data, {
        pointToLayer: function (feature, latlng) {
            return pointToLayer(feature, latlng, attributes);
        }
    }).addTo(map);
};


//Function to update the proportional symbols based on the selected attribute.
function updatePropSymbols(attribute) {
    //update temporal legend
    document.querySelector("span.year").innerHTML =
        getCleanName("attributes");

    map.eachLayer(function (layer) {
        if (layer.feature && layer.feature.properties[attribute]) {
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
function createLegend(attributes) {
    var LegendControl = L.Control.extend({
        options: {
            position: 'bottomright'
        },
        onAdd: function () {
            var container = L.DomUtil.create('div', 'legend-control-container');

            container.innerHTML =
                '<p class="temporalLegend">Number of Recreational Visits <span class="year">Annual Total</span></p>';

            var svg = '<svg id="attribute-legend" width="200px" height="60px">';

            //array of circle names to base loop on
            var circles = ["max", "mean", "min"];

            // loop to add each circle and text to svg string  
            for (var i = 0; i < circles.length; i++) {

                var circleName = circles[i];

                //Step 3: assign the r and cy attributes  
                var radius = calcPropRadius(dataStats[circleName]);
                var cy = 59 - radius;

                //circle string  
                svg += '<circle class="legend-circle" id="' + circleName +
                    '" r="' + radius + '" cy="' + cy +
                    '" fill="#f8c20fff" fill-opacity="0.8" stroke="#af4600ff" cx="30"/>';

                // label position           
                var textY = i * 20 + 20;

                var formatted = Math.round(dataStats[circleName]).toLocaleString();

                svg += '<text id="' + circleName + '-text" x="90" y="' + textY + '">' +
                    formatted + '</text>';;
            }

            // close svg (IMPORTANT: OUTSIDE LOOP)
            svg += "</svg>";

            // insert once (IMPORTANT: OUTSIDE LOOP)
            container.insertAdjacentHTML('beforeend', svg);

            return container;
        }
    });

    map.addControl(new LegendControl());
}



//Create new sequence controls
function createSequenceControls(attributes) {
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
    document.querySelectorAll('.step').forEach(function (step) {
        step.addEventListener("click", function () {
            //get the current index value
            var index = Number(rangeslider.value);
            //Update the index value based on button clicked
            if (step.id == 'forward') {
                index++;
                if (index > attributes.length - 1) index = 0;
            } else if (step.id == 'reverse') {
                index--;
                if (index < 0) index = attributes.length - 1;
            };
            //Update slider position
            rangeslider.value = index;
            // Call update functions
            currentAttribute = attributes[index];
            updatePropSymbols(attributes[index]);

            document.querySelector("span.year").innerHTML =
                getCleanName(attributes[index]);

        })
    });
}

// Create the search and Top 10 control (positioned below zoom controls)
function createSearchControl() {
    var SearchControl = L.Control.extend({
        options: {
            position: 'topleft'
        },
        onAdd: function () {
            var container = L.DomUtil.create('div', 'search-control-container');

            // Create search input with toggle button
            container.insertAdjacentHTML('beforeend',
                '<div id="search-container">' +
                '<button id="search-toggle" title="Search Parks">' +
                '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><path fill="none" d="M0 0h24v24H0z"/><path d="M18.031 16.617l4.283 4.282-1.415 1.415-4.282-4.283A8.96 8.96 0 0 1 11 20c-4.968 0-9-4.032-9-9s4.032-9 9-9 9 4.032 9 9a8.96 8.96 0 0 1-1.969 5.617zm-2.006-.742A6.977 6.977 0 0 0 18 11c0-3.868-3.133-7-7-7-3.868 0-7 3.132-7 7 0 3.867 3.132 7 7 7a6.977 6.977 0 0 0 4.875-1.975l.15-.15z" fill="currentColor"/></svg>' +
                '</button>' +
                '<input type="text" id="park-search" placeholder="Search parks..." autocomplete="off">' +
                '<div id="search-results"></div>' +
                '</div>');

            // Create Top 10 button
            container.insertAdjacentHTML('beforeend',
                '<button class="top10-btn" id="top10-btn" title="Show Top 10 Parks">10</button>');

            // Disable map interactions when interacting with control
            L.DomEvent.disableClickPropagation(container);
            L.DomEvent.disableScrollPropagation(container);

            return container;
        }
    });

    map.addControl(new SearchControl());

    // Add search toggle event listener
    document.querySelector('#search-toggle').addEventListener('click', function () {
        var container = document.getElementById('search-container');
        var input = document.getElementById('park-search');
        container.classList.toggle('expanded');
        if (container.classList.contains('expanded')) {
            input.focus();
        } else {
            input.blur();
        }
    });

    // Add Top 10 button event listener
    document.querySelector('#top10-btn').addEventListener('click', function () {
        showTop10Modal();
    });
}


//  Process the data to extract the attributes.
function processData(data) {
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
function getData() {
    //load the data
    fetch("data/natparks.geojson")
        .then(function (response) {
            return response.json();
        })
        .then(function (json) {
            //store park data globally
            parkData = json;
            //create an attributes array
            var attributes = processData(json);
            //set initial attribute
            currentAttribute = attributes[0];
            //call function to create proportional symbols
            createPropSymbols(json, attributes);
            //call the function to create the slider.
            createSequenceControls(attributes);
            //calculate stats
            calcStats(json, attributes);
            //call legend function
            createLegend(attributes);
            //create search control on map
            createSearchControl();
            //initialize search functionality
            initializeSearch();
            //initialize modal functionality
            initializeModal();
        })
};


//function to instantiate the Leaflet map
function createMap() {
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


// Initialize search autocomplete
function initializeSearch() {
    var searchInput = document.getElementById('park-search');
    var searchResults = document.getElementById('search-results');
    var selectedIndex = -1;

    // Get all park names for autocomplete
    var parks = parkData.features.map(function (feature) {
        return {
            name: feature.properties.UNIT_NAME,
            type: feature.properties.UNIT_TYPE,
            coords: feature.geometry.coordinates
        };
    });

    // Sort parks alphabetically
    parks.sort(function (a, b) {
        return a.name.localeCompare(b.name);
    });

    // Search input event
    searchInput.addEventListener('input', function () {
        var query = this.value.toLowerCase().trim();
        selectedIndex = -1;

        if (query.length < 2) {
            searchResults.classList.remove('active');
            searchResults.innerHTML = '';
            return;
        }

        // Filter parks
        var matches = parks.filter(function (park) {
            return park.name.toLowerCase().includes(query);
        }).slice(0, 10); // Limit to 10 results

        if (matches.length === 0) {
            searchResults.classList.remove('active');
            searchResults.innerHTML = '';
            return;
        }

        // Build results HTML
        var html = matches.map(function (park, index) {
            return '<div class="search-result-item" data-index="' + index + '" data-lat="' + park.coords[1] + '" data-lng="' + park.coords[0] + '">' +
                '<div class="park-name">' + highlightMatch(park.name, query) + '</div>' +
                '<div class="park-type">' + park.type + '</div>' +
                '</div>';
        }).join('');

        searchResults.innerHTML = html;
        searchResults.classList.add('active');

        // Add click handlers to results
        searchResults.querySelectorAll('.search-result-item').forEach(function (item) {
            item.addEventListener('click', function () {
                var lat = parseFloat(this.dataset.lat);
                var lng = parseFloat(this.dataset.lng);
                selectPark(lat, lng, this.querySelector('.park-name').textContent);
            });
        });
    });

    // Keyboard navigation
    searchInput.addEventListener('keydown', function (e) {
        var items = searchResults.querySelectorAll('.search-result-item');

        if (items.length === 0) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            selectedIndex = Math.min(selectedIndex + 1, items.length - 1);
            updateSelection(items);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            selectedIndex = Math.max(selectedIndex - 1, 0);
            updateSelection(items);
        } else if (e.key === 'Enter' && selectedIndex >= 0) {
            e.preventDefault();
            items[selectedIndex].click();
        } else if (e.key === 'Escape') {
            searchResults.classList.remove('active');
            searchInput.blur();
        }
    });

    function updateSelection(items) {
        items.forEach(function (item, i) {
            item.classList.toggle('selected', i === selectedIndex);
        });
        if (selectedIndex >= 0) {
            items[selectedIndex].scrollIntoView({ block: 'nearest' });
        }
    }

    function highlightMatch(text, query) {
        var regex = new RegExp('(' + query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi');
        return text.replace(regex, '<strong style="color: #f8c20f;">$1</strong>');
    }

    function selectPark(lat, lng, name) {
        // Close search results
        searchResults.classList.remove('active');
        searchInput.value = name;

        // Fly to the park location
        map.flyTo([lat, lng], 10, {
            duration: 1.5
        });

        // Find and open the popup for this park
        setTimeout(function () {
            map.eachLayer(function (layer) {
                if (layer.feature && layer.feature.properties.UNIT_NAME === name) {
                    layer.openPopup();
                }
            });
        }, 1600);
    }

    // Close search results when clicking outside
    // Close search results and collapse bar when clicking outside
    document.addEventListener('click', function (e) {
        var container = document.getElementById('search-container');
        if (container && !container.contains(e.target)) {
            searchResults.classList.remove('active');
            container.classList.remove('expanded');
            searchInput.blur();
        }
    });
}

// Get Top 10 parks based on current attribute
function getTop10Parks() {
    if (!parkData || !currentAttribute) return [];

    var parksWithVisits = parkData.features.map(function (feature) {
        return {
            name: feature.properties.UNIT_NAME,
            type: feature.properties.UNIT_TYPE,
            visits: feature.properties[currentAttribute] || 0,
            coords: feature.geometry.coordinates
        };
    });

    // Sort by visits descending
    parksWithVisits.sort(function (a, b) {
        return b.visits - a.visits;
    });

    return parksWithVisits.slice(0, 10);
}

// Show Top 10 Modal
function showTop10Modal() {
    var modal = document.getElementById('top10-modal');
    var list = document.getElementById('top10-list');
    var periodLabel = document.querySelector('.modal-period');

    // Update period label
    periodLabel.textContent = getCleanName(currentAttribute);

    // Get top 10 parks
    var top10 = getTop10Parks();

    // Build list HTML
    var html = top10.map(function (park, index) {
        return '<li data-lat="' + park.coords[1] + '" data-lng="' + park.coords[0] + '" data-name="' + park.name + '">' +
            '<strong>' + park.name + '</strong>' +
            '<span class="park-visits">' + park.visits.toLocaleString() + ' visitors</span>' +
            '</li>';
    }).join('');

    list.innerHTML = html;

    // Add click handlers to list items
    list.querySelectorAll('li').forEach(function (item) {
        item.style.cursor = 'pointer';
        item.addEventListener('click', function () {
            var lat = parseFloat(this.dataset.lat);
            var lng = parseFloat(this.dataset.lng);
            var name = this.dataset.name;

            // Close modal
            modal.classList.remove('active');

            // Fly to park
            map.flyTo([lat, lng], 10, { duration: 1.5 });

            // Open popup
            setTimeout(function () {
                map.eachLayer(function (layer) {
                    if (layer.feature && layer.feature.properties.UNIT_NAME === name) {
                        layer.openPopup();
                    }
                });
            }, 1600);
        });
    });

    modal.classList.add('active');
}

// Initialize modal functionality
function initializeModal() {
    var modal = document.getElementById('top10-modal');
    var closeBtn = document.querySelector('.close-btn');

    // Close modal when clicking X
    closeBtn.addEventListener('click', function () {
        modal.classList.remove('active');
    });

    // Close modal when clicking outside
    modal.addEventListener('click', function (e) {
        if (e.target === modal) {
            modal.classList.remove('active');
        }
    });

    // Close modal with Escape key
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            modal.classList.remove('active');
        }
    });
}

//Call the createMap function when the DOM is loaded
document.addEventListener('DOMContentLoaded', createMap)