var map;
var placesService, directionsService;
var searchBox;
var markers = [];
var MARKER_PATH = 'https://maps.gstatic.com/intl/en_us/mapfiles/marker_green';

$(document).ready(function() {
    $("#searchTextField").focus();
    $('#searchTextField').keypress(function (e) {
        if (e.which == 13) {
            add_item($(this).val());
            e.preventDefault();
        }
    });
    
    $("#add_btn").click(function() {
        add_item($("#searchTextField").val());
    });

    initGoogleMaps();
});



// Google Maps

function initGoogleMaps() {
    var NYC_LATLNG = new google.maps.LatLng(40.790278, -73.959722);

    // create the map element
    map = new google.maps.Map(document.getElementById('map'), {
        center: NYC_LATLNG,
        zoom: 13,
        maxZoom: 18
    });
    
    // create the places and directions API interfacing objects
    placesService = new google.maps.places.PlacesService(map);
    directionsService = new google.maps.DirectionsService();

    // create the autocompleting text box
    var input = document.getElementById('searchTextField');
    searchBox = new google.maps.places.SearchBox(input);
    // add a listener to when an item is selected from the list
    google.maps.event.addListener(searchBox, 'places_changed', onPlaceChanged);
    
    // create the directions display and attach it to the map
    directionsDisplay = new google.maps.DirectionsRenderer();
    directionsDisplay.setMap(map);

    // var request = {
    //     origin: "soho",
    //     destination: "Times Sq",
    //     travelMode: google.maps.TravelMode.TRANSIT
    // };
    // directionsService.route(request, function(response, status) {
    //     if (status == google.maps.DirectionsStatus.OK) {
    //         directionsDisplay.setDirections(response);
    //         console.log(response.routes[0].legs[0].distance);
    //     }
    // });
}

function onPlaceChanged() {
    var place = searchBox.getPlaces();
    if (place[0].geometry) {
        $("#searchTextField").val("");

        map.panTo(place[0].geometry.location);
        var markerLetter = String.fromCharCode('A'.charCodeAt(0) + markers.length);
        var markerIcon = MARKER_PATH + markerLetter + '.png';
        
        // Use marker animation to drop the icons incrementally on the map.
        marker = new google.maps.Marker({
            position: place[0].geometry.location,
            animation: google.maps.Animation.DROP,
            icon: markerIcon
        });
        
        // marker.position is a LatLng obj
        marker.place_id = place[0].place_id;
        marker.hours = place[0].opening_hours;
        marker.address = place[0].formatted_address;
        
        // if opening_hours is not undefined, we actually just want periods
        if (marker.hours) 
            marker.hours = marker.hours.periods;
        
        marker.setMap(map);
        
        markers.push(marker);
        zoomToFit();


        // If the user clicks a hotel marker, show the details of that hotel
        // in an info window.
       // markers[i].placeResult = results[i];
       // google.maps.event.addListener(markers[i], 'click', showInfoWindow);
       // setTimeout(dropMarker(i), i * 100);
       // addResult(results[i], i);
    }
}

function zoomToFit() {
    // Create a new viewpoint bound
    var bounds = new google.maps.LatLngBounds();
    // Go through each...
    for (var i = 0; i < markers.length; i++) {
        var marker = markers[i];
        // And increase the bounds to take this point
        bounds.extend(marker.position);
    }
    // Fit these bounds to the map
    map.fitBounds(bounds);
}



// UI 

function add_item(str) {
    $("#input_box").val("");
    task_str = '<span class="task_str">' + str + '</span>';

    btn = '<input type="button" class="button" value="X">';
    html = $("<li>" + task_str + "</li>");
        
    $("#list").append(html);
    
    add_click_listeners();
}

function add_click_listeners() {
    $(".task_str").click(function() {
        if ($(this).hasClass("clicked"))
            $(this).removeClass("clicked");
        else
            $(this).addClass("clicked");
    });
    
    $("input[value='X']").click(function() {
        console.log("x");
    });
}


distances = {};

// submit to server
function submitTasks() {
    // each marker in markers should have properties 
    // 'place_id', 'hours', and 'position'
    
    // create a dict of place_id : periods
    // periods is an array of opening periods covering seven days, starting from Sunday, in chronological order.
    // https://developers.google.com/maps/documentation/javascript/places#place_details_responses
    // periods can be undefined
    hours = {};
    for (var i = 0; i < markers.length; i++) {
        hours[markers[i].place_id] = markers[i].hours;
    }

    // generate a dictioanry where the key is the JSONified list of two Latlng objects and the value is the distance object
    var distances = {};
    for (var i = 0; i < markers.length; i++) {
        for (var j = i + 1; j < markers.length; j++) {
            var request = {
                origin: markers[i].position,
                destination: markers[j].position,
                travelMode: google.maps.TravelMode.DRIVING
            };
            
            directionsService.route(request, distanceCallback(i,j));
        }
    }
}

function distanceCallback(i, j) {
    return function(response, status) {
        if (status == google.maps.DirectionsStatus.OK) {
            var key_obj = {
                "from" : markers[i].place_id,
                "to" : markers[j].place_id
            };
            
            var key = JSON.stringify(key_obj);
            
            var distance = response.routes[0].legs[0].distance;
            distances[key] = distance;
            
            // there will always be n choose 2 unordered pairs of nodes
            // where n is the number of markers
            // because math
            if (_.size(distances) === choose(markers.length, 2)) {
                console.log(distances);
                $.ajax({
                    type : "POST",
                    url : "/submit",
                    data: JSON.stringify({
                        "distances" : distances,
                        "hours" : hours
                        }),
                    contentType: 'application/json; charset=UTF-8',
                    success: function(data) {
                        console.log(data);
                    }
                });
                
            }
        } else { // status is not OK
            console.log(status);
        }
    };
}



// Utils
function choose(n, k) {
    return fact(n) / (fact(k) * fact(n - k));
}

function fact(n) {
    return (n<2) ? 1 : n * fact(n-1);
}


