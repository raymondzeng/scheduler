var map;
var placesService, directionsService;
var searchBox;
var markers = [];
var MARKER_PATH = 'https://maps.gstatic.com/intl/en_us/mapfiles/marker_green';

var distances = {};
var hours = {};
var ids = [];
var deps = {};

var NYC_LATLNG = null;
var ZOOM_DEFAULT = 13;

$(document).ready(function() {
    $("#searchTextField").focus();
    $('#searchTextField').keypress(function (e) {
        if (e.which == 13) {
            e.preventDefault();
        }
    });    
    initGoogleMaps();
});



// Google Maps

function initGoogleMaps() {
    NYC_LATLNG = new google.maps.LatLng(40.790278, -73.959722);
    
    // create the map element
    map = new google.maps.Map(document.getElementById('map'), {
        center: NYC_LATLNG,
        zoom: ZOOM_DEFAULT,
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
        add_item(place[0].place_id, 
                 place[0].name, 
                 place[0].formatted_address,
                 place[0].opening_hours);

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
    if (markers.length == 0) {
        map.panTo(NYC_LATLNG);
        map.setZoom(ZOOM_DEFAULT);
        return;
    }
    
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

// hours can be undefined; if it is, we actually want hours.periods
function add_item(id, name, addr, hours) {
    var earliest, duration, latest;
    duration = 1;
    
    if (hours == undefined) {
        earliest = "0:00";
        latest = "24:00";
    } else {
        // Sun = 0, Sat = 6; same as Google Maps
        var todays_weekday = new Date().getDay();

        var close_open = hours.periods[todays_weekday];

        // TODO : somethings (Central Park) are open from 6am to 1am. deal with this
        earliest = close_open['open']['hours'] + ":" + (close_open['open']['minutes'] == 0 ? "00" : close_open['open']['minutes']);
        latest = close_open['close']['hours'] + ":" + (close_open['close']['minutes'] == 0 ? "00" : close_open['close']['minutes']);
    }
    
    var task_str = '<td class="task_str"><b>' + name + '</b> <address>' + addr + '</address></td>';
    var times = "<td class='time'>" + earliest 
        + "</td><td class='time'>" + duration 
        + "</td><td class='time'>" + latest + "</td>";
    var deps_btn = '<td><input type="button" class="button dep_btn" value="+" disabled></td>';
    var x_btn = '<td><input type="button" class="button delete_btn" value="x"></td>';
    var html = '<tr id="tr_' + id + '">' + task_str + times + deps_btn + x_btn + '</tr>';
    
    $("#list").append(html);
    
    $("#tr_" + id + " .task_str").click(function() {
        if ($(this).hasClass("dep_selected")) 
            $(this).removeClass("dep_selected");
        else 
            $(this).addClass("dep_selected");
        
        toggle_dep_buttons();
    });
    
    $("#tr_" + id + " .delete_btn").click(function() {
        var tr = $(this).parents("tr").remove();
        var marker = find_marker(id);
        marker.setMap(null);
        markers = _.without(markers, marker);
        zoomToFit();
    });
    
    $("#tr_" + id + " .dep_btn").click(function() {
        // TODO : cant add dep once already has some
        var selected = $(".dep_selected");
        var selected_ids = [];
        for (var i = 0; i < selected.length; i++) {
            selected_ids.push($(selected[i]).parents("tr").attr("id").substring(3));
        }
        
        if (deps[id] == undefined) {
            deps[id] = selected_ids;
        } else {
            deps[id].extend(selected_ids);
        }
                
        selected.each(function() {
            $(this).removeClass("dep_selected");
        });
        
        var names = selected.map(function(idx, el) {
            return $(el).children("b").html();
        });
        
        var html = "";
        for (var i = 0; i < names.length; i++) {
            html += "<tr class='dependency'><td><div>" + names[i] + "</div></td><td></td>" + x_btn + "</tr>";
        }
        
        $("#tr_" + id).after(html);

        toggle_dep_buttons();
    });

    toggle_dep_buttons();
}

function toggle_dep_buttons() {
    var selected = $(".dep_selected");
    if (selected.length == 0) {
        $(".dep_btn").each(function() {
            $(this).attr("disabled", "disabled");
        });
    } else {
        $(".dep_btn").each(function() {
            $(this).removeAttr("disabled");
        });
        
        // a location can't depend on itself so any selected location 
        // isn't a valid option to add deps to
        $(".dep_selected ~ td .dep_btn").each(function() {
            $(this).attr("disabled", "disabled");
        });
    }
}

function find_marker(id) {
    for (var i = 0; i < markers.length; i++) {
        if (markers[i].place_id == id) {
            return markers[i];
        }
    }
    return null;
}



// submit to server
function submitTasks() {
    // each marker in markers should have properties 
    // 'place_id', 'hours', and 'position'
    
    // create list of task ids
    ids = markers.map(function(m) {
        return m.place_id
    });
    
    // create a dict of place_id : periods
    // periods is an array of opening periods covering seven days, starting from Sunday, in chronological order.
    // https://developers.google.com/maps/documentation/javascript/places#place_details_responses
    // periods can be undefined
    hours = {};
    for (var i = 0; i < markers.length; i++) {
        hours[markers[i].place_id] = markers[i].hours;
    }

    // for every unique pair of nodes, if we don't already have the distance info,
    // call Google Maps API to get it
    // and when we have all distance info, submit all data (distance, hours, user_prefs) to server
    if (maybe_submit()) 
        return;

    for (var i = 0; i < markers.length; i++) {
        for (var j = i + 1; j < markers.length; j++) {
            var key = markers[i].place_id + "," + markers[j].place_id
            
            // already have the distance value for this pair
            if (distances[key] != undefined)
                continue

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
            
            var key = markers[i].place_id + "," + markers[j].place_id
            
            var distance = response.routes[0].legs[0].distance;
            distances[key] = distance;
            maybe_submit();
        } else { // status is not OK
            console.log(status);
        }
    };
}

function maybe_submit() {
    // there will always be (n choose 2) unordered pairs of nodes
    // where n is the number of markers
    if (_.size(distances) === choose(markers.length, 2)) {
        $.ajax({
            type : "POST",
            url : "/submit",
            data: JSON.stringify({
                "ids" : ids,
                "distances" : distances,
                "hours" : hours,
                "dependencies" : deps
            }),
            contentType: 'application/json; charset=UTF-8',
            success: function(data) {
                console.log(data);
            }
        });
        return true;
    } else {
        return false;
    }
}

// Utils
function choose(n, k) {
    return fact(n) / (fact(k) * fact(n - k));
}

function fact(n) {
   return (n<2) ? 1 : n * fact(n-1);
}


