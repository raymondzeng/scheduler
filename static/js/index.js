var map;
var service;
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

    var pyrmont = new google.maps.LatLng(40.790278, -73.959722);

    map = new google.maps.Map(document.getElementById('map'), {
        center: pyrmont,
        zoom: 13,
        maxZoom: 18
    });
    
    var request = {
        location: pyrmont,
        radius: '500',
        query: 'restaurant'
    };
    service = new google.maps.places.PlacesService(map);
    service.textSearch(request, callback);
    
    var input = document.getElementById('searchTextField');
    
    searchBox = new google.maps.places.SearchBox(input);
    
    google.maps.event.addListener(searchBox, 'places_changed', onPlaceChanged);
});

function onPlaceChanged() {
    var place = searchBox.getPlaces();
    if (place[0].geometry) {
        map.panTo(place[0].geometry.location);
        var markerLetter = String.fromCharCode('A'.charCodeAt(0) + markers.length);
        var markerIcon = MARKER_PATH + markerLetter + '.png';
        
        // Use marker animation to drop the icons incrementally on the map.
        marker = new google.maps.Marker({
            position: place[0].geometry.location,
            animation: google.maps.Animation.DROP,
            icon: markerIcon
        });
        
        marker.place_id = place[0].place_id;
        marker.hours = place[0].opening_hours;
        marker.setMap(map);
        
        markers.push(marker);
        console.log(markers);
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

function callback(results, status) {
    if (status == google.maps.places.PlacesServiceStatus.OK) {
        for (var i = 0; i < results.length; i++) {
            var place = results[i];
            console.log(place.geometry.location.lat());
            //createMarker(results[i]);
        }
    }
}

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
