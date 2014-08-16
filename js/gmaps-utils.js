define([
    'jquery',
    'underscore',
    'gmaps',
    'tsp',
], function($, _, GoogleMaps, Tsp) {
    var map;
    var placesService, directionsService;
    var searchBox;
    var waypoints = [];
    var M_G = 'http://maps.gstatic.com/intl/en_us/mapfiles/marker_green';
    var M_R = 'http://maps.gstatic.com/intl/en_us/mapfiles/marker';
    var M_O = 'http://maps.gstatic.com/intl/en_us/mapfiles/marker_orange';
    var directions = {};
    var distances = {};
    var NYC_LATLNG = null;
    var ZOOM_DEFAULT = 13;
    
    function initGoogleMaps(tasks) {
        NYC_LATLNG = new GoogleMaps.LatLng(40.790278, -73.959722);
        
        // create the map element
        map = new GoogleMaps.Map(document.getElementById('map'), {
            center: NYC_LATLNG,
            zoom: ZOOM_DEFAULT,
            maxZoom: 18
        });
        
        // create the places and directions API interfacing objects
        placesService = new GoogleMaps.places.PlacesService(map);
        directionsService = new GoogleMaps.DirectionsService();

        // create the autocompleting text box
        var input = document.getElementById('searchTextField');
        searchBox = new GoogleMaps.places.SearchBox(input);
        searchBox.bindTo('bounds', map);

        // add a listener to when an item is selected from the list
        GoogleMaps.event.addListener(searchBox, 'places_changed', function() {
            onPlaceChanged(tasks);
        });
        
        // create the directions display and attach it to the map
        directionsDisplay = new GoogleMaps.DirectionsRenderer({
            suppressMarkers: true,
            preserveViewport: true
        });

        directionsDisplay.setMap(map);
    }

    function nextMarkerLetter() {
        if (waypoints.length != 0) {            
            var lastLetterCode = _.last(waypoints).letter.charCodeAt(0);
            var nextLetterCode = lastLetterCode;
            
            // we use '-' when we run out of letters
            if (lastLetterCode != 45) {
                nextLetterCode = lastLetterCode == 90 ? 0 : lastLetterCode + 1;
            }            
            return String.fromCharCode(nextLetterCode);
        } else {
            return "A";
        }
    }

    function resolveHours(hours) {
        // figure out when the place opens/closes, 
        // and default duration is 1 hour
        // user can later edit these
        var earliest, latest;
        
        if (hours == undefined) {
            earliest = 0;
            latest = 2400;
        } else {
            // Sun = 0, Sat = 6; same as Google Maps
            var todays_weekday = new Date().getDay();

            var close_open = hours.periods[todays_weekday];

            // TODO : some things (Central Park) are open from 6am to 1am. 
            // it breaks the guarantee that latest > earliest
            earliest = close_open['open']['hours'] * 100 
                + close_open['open']['minutes'];
            latest = close_open['close']['hours'] * 100 
                + close_open['close']['minutes'];
        }
        
        return {
            earliest: earliest,
            latest: latest
        };
    }

    function onPlaceChanged(tasks) {
        var places = searchBox.getPlaces();
        if (places && places[0].geometry) {
            var place = places[0];

            if (_.find(waypoints, function(n) {
                return n.id == place.place_id;
            })) {
                console.log("already added");
                return;
            }

            map.panTo(place.geometry.location);
            
            var markerLetter = nextMarkerLetter();
            var markerIcon = iconPath(M_G, markerLetter);
            marker = new GoogleMaps.Marker({
                position: place.geometry.location,
                animation: GoogleMaps.Animation.DROP,
                icon: markerIcon,
                id: place.place_id,
                path: M_G,
                prev: M_G,
                letter: markerLetter
            });
            
            var hour_range = resolveHours(place.opening_hours);

            tasks.create({
                id: place.place_id,
                name: place.name,
                letter: markerLetter,
                address: place.formatted_address,
                earliest: hour_range.earliest,
                latest: hour_range.latest,
                marker: marker
            });

            marker.setMap(map);
            waypoints.push(marker);
            
            zoomToFit();
        }
    }

    function zoomToFit() { 
        if (waypoints.length == 0) {
            map.panTo(NYC_LATLNG);
            map.setZoom(ZOOM_DEFAULT);
            return;
        }
        
        var bounds = smallestBound();

        // Fit these bounds to the map
        map.fitBounds(bounds);
    }

    function smallestBound() {    
        // Create a new viewpoint bound
        var bounds = new GoogleMaps.LatLngBounds();
        // Go through each...
        for (var i = 0; i < waypoints.length; i++) {
            var marker = waypoints[i];
            // And increase the bounds to take this point
            bounds.extend(marker.position);
        }
        
        return bounds;
    }

    function find_marker(id) {
        // return the marker in @waypoints with the given id
        // returns null if not found

        for (var i = 0; i < waypoints.length; i++) {
            if (waypoints[i].id == id) {
                return waypoints[i];
            }
        }
        return null;
    }

    function removeMarker(marker) {
        waypoints = _.without(waypoints, marker);
        marker.setMap(null);
        zoomToFit();
    }
    
    function solveTsp(Tasks) {
        console.log("submit");

        // create list of task ids
        ids = waypoints.map(function(m) {
            return m.id
        });
        
        // create a dict of id : periods
        // periods is an array of opening periods covering seven days, 
        // starting from Sunday, in chronological order.
        // https://developers.google.com/maps/documentation/javascript/places#place_details_responses
        // periods can be undefined
        hours = {};
        for (var i = 0; i < waypoints.length; i++) {
            hours[waypoints[i].id] = allToMinutes(Tasks.get(waypoints[i].id));
        }

        deps = {};
        Tasks.each(function(task) {
            deps[task.get("id")] = task.dependencies.map(function(dep) {
                return dep.get("id");
            });
        });

        // for every unique pair of nodes, if we don't already 
        // have the distance info, call Google Maps API to get it
        var reqs_to_get = [];
        for (var i = 0; i < waypoints.length; i++) {
            for (var j = i + 1; j < waypoints.length; j++) {
                var key = waypoints[i].id + "," + waypoints[j].id
                
                // already have the distance value for this pair
                if (distances[key] != undefined)
                    continue

                var to_get = {
                    key: key,
                    request: {
                        origin: waypoints[i].position,
                        destination: waypoints[j].position,
                        travelMode: GoogleMaps.TravelMode.WALKING
                    }
                };
                
                reqs_to_get.push(to_get);
            }
        }
        
        deferreds = [];
        _.each(reqs_to_get, function(to_get) {
            var def = $.Deferred();
            def.key = to_get.key;
            deferreds.push(calcDistance(to_get, def));
        });

        // once we have everything, solve 
        $.when.apply($, deferreds).done(function() {
            console.log("done solving");
            local_solve();
        });
    }

    function calcDistance(to_get, defer) {
        console.log("fetching dist");
        directionsService.route(to_get.request, function(response, status) {
            if (status == GoogleMaps.DirectionsStatus.OK) {    
                directions[defer.key] = response;
                distances[defer.key] =  response.routes[0].legs[0].distance.value;
                defer.resolve(response);
            } else {
                console.log(status);
                defer.reject(status);
            }
        });
        return defer;
    }

    function local_solve() {
        console.log("solving");
        var data = Tsp.findItinerary(hours, distances, deps);
        renderTSPRoute(data);
    }

    function renderTSPRoute(data) {
        console.log("got response");
        var sched = data["schedule"];
        if (!sched) {
            console.log("No solution.");
            return;
        }

        var legs = [];
        for (var i = 0; i < sched.length - 1; i++) {
            var leg = find_directions(sched[i], sched[i+1]);
            legs.push(leg);
        }

        var combined = combine_directions(legs);

        directionsDisplay.setDirections(combined);
    }
    
    function iconPath(prefix, letter) {
        return prefix 
            + (letter == "-" ? "" : letter) 
            + '.png';
    }

    function find_directions(f, s) {
        var maybe = directions[f + "," + s];
        if (maybe == undefined) 
            return directions[s + "," + f];
        return maybe
    }

    function combine_directions(legs) {
        var route = $.extend(true, {}, legs[0]);
        for (var i = 1; i < legs.length; i++) {
            route.routes[0].legs = route.routes[0].legs.concat(legs[i].routes[0].legs);
        }
        return route;
    }

    function allToMinutes(taskModel) {
        // Input : a Task model
        //
        //         model.get("earliest") -> xxyy
        //         model.get("duration") -> m
        //         model.get("latest") -> xxyy
        //         
        //     xxyy is an int and xx represents the hour and yy the minutes
        //     m is an int and represents the minutes
        //
        // Output : all keys in minutes, so really just converting xxyy to minutes

        var earliest = taskModel.get("earliest");
        var latest = taskModel.get("latest");
        
        // same as Math.floor but handles negatives correctly
        var e_hour = (earliest / 100) >> 0;
        var e_min = (earliest % 100);
        earliest = e_hour * 60 + e_min;
        
        var l_hour = (latest / 100) >> 0;
        var l_min = (latest % 100);
        latest = l_hour * 60 + l_min;
        
        return [earliest, taskModel.get("duration"), latest];
    }

    function resize() {
        GoogleMaps.event.trigger(map, 'resize');
        zoomToFit();
    }
    
    return {
        initGoogleMaps: initGoogleMaps,
        map: map,
        iconPath: iconPath,
        removeMarker: removeMarker,
        resize: resize,
        solveTsp: solveTsp,
        MARKER_PATH: M_G,
        MARKER_HOVER_PATH: M_R,
        MARKER_SELECTED_PATH: M_O,
        ZOOM_DEFAULT: ZOOM_DEFAULT,
        NYC_LATLNG: NYC_LATLNG
    };
});
