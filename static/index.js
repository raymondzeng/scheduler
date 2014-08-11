var map;
var placesService, directionsService;
var searchBox;
var waypoints = [];
var MARKER_PATH = 'https://maps.gstatic.com/intl/en_us/mapfiles/marker_green';
var MARKER_HOVER_PATH = 'https://maps.gstatic.com/intl/en_us/mapfiles/marker';
var MARKER_SELECTED_PATH = 'https://maps.gstatic.com/intl/en_us/mapfiles/marker_orange';
var directions = {};
var distances = {};
var hours = {};
var ids = [];
var deps = {};

var NYC_LATLNG = null;
var ZOOM_DEFAULT = 13;

var Task, TaskList, TaskView, AppView;
var Tasks, App;

$(function() {    
    Task = Backbone.Model.extend({
        defaults: function() {
            return {
                name: "No Name",
                address: "No Address",
                letter: "-",
                earliest: 0,
                duration: 60,
                latest: 2400,
                selected: false,
                dependencies: [],
                canAdd: true,
            };
        },
        
        toggle: function() {
            this.save({
                selected: !this.get("selected"),
                canAdd: !this.get("canAdd")
            });
        },
    });
    
    Dependency = Backbone.Model.extend({
        defaults: function() {
            return {
                letter: "-",
                name: "No Name"
            };
        }
    });
    
    DependencyView = Backbone.View.extend({
        tagName: "tr",
        template: _.template($("#dep-template").html()),
        
        initialize: function() {
            this.listenTo(this.model, 'change', this.render);
            this.listenTo(this.model, 'destroy', this.remove);
        },

        render: function() {
            this.$el.html(this.template(this.model.toJSON()));
            return this;
        }
    });
    
    TaskList = Backbone.Collection.extend({
        model: Task,
        localStorage: new Backbone.LocalStorage("tasks"),
        
        selected: function() {
            return this.where({selected: true});
        },
        
        deselectAll: function() {
            this.each(function(model) {
                model.save({
                    selected: false,
                    canAdd: true
                });
            });
        }
        
    });
    
    Tasks = new TaskList;

    TaskView = Backbone.View.extend({
        tagName: "tr",
        template: _.template($("#task-template").html()),
        
        events: {
            "click .task_str" : "toggleSelected",
            "click .delete_btn" : "clear",
            "click .dep_btn" : "addDeps"
        },
        
        initialize: function() {
            this.listenTo(this.model, 'change', this.render);
            this.listenTo(this.model, 'destroy', this.remove);
            var marker = this.model.get("marker");
            if (marker) 
                marker.setMap(map);
        },

        render: function() {
            this.$el.html(this.template(this.model.toJSON()));
            this.$el.children(".task_str").toggleClass('dep_selected', this.model.get('selected'));
            this.$el.children("td").children(".dep_btn").prop("disabled", !this.model.get("canAdd"));
            this.input = this.$('.edit');
            
            var taskView = this;
            
            var deps = this.model.get("dependencies");
            _.each(deps, function(depView) {
                taskView.$el.after(depView.render().el);
            });
            return this;
        },
        
        toggleSelected: function() {
            this.model.toggle();
        },
        
        addDeps: function() {
            var selected = Tasks.selected();
            var depViews = _.map(selected, function(v) {
                return new DependencyView({
                    model: new Dependency({
                        id: v.get("id"),
                        name: v.get("name"),
                        letter: v.get("letter")
                    })
                });
            });
            
            var new_deps = this.model.get("dependencies").concat(depViews);
            var deps_set = _.uniq(new_deps, function(item) {
                // unique deps have unique ids
                return item.model.get("id");
            });
            
            this.model.save({dependencies: deps_set});
            Tasks.deselectAll();
        },
        
        clear: function() {
            var marker = this.model.get("marker");
            if (marker) {
                waypoints = _.without(waypoints, marker);
                marker.setMap(null);
                zoomToFit();
            }
            this.model.destroy();
        }
    });

    AppView = Backbone.View.extend({
        
        el: $("#task_list"),
                
        initialize: function() {
            this.input = this.$("#searchTextField");
            
            this.listenTo(Tasks, 'add', this.addOne);
            Tasks.fetch();

            initGoogleMaps();
            google.maps.event.addListener(searchBox, 'places_changed', this.handleNewTask);
        },
        
        
        addOne: function(task) {
            var view = new TaskView({model: task});
            this.$("#list").append(view.render().el);
        },
        
        handleNewTask: function() {
            onPlaceChanged();
        }
    });
    
    App = new AppView;

    $("#searchTextField").focus();
    $('#searchTextField').keypress(function (e) {
        if (e.which == 13) {
            e.preventDefault();
        }
    });    
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
    searchBox.bindTo('bounds', map);

    // add a listener to when an item is selected from the list
  //  google.maps.event.addListener(searchBox, 'places_changed', onPlaceChanged);
    
    // create the directions display and attach it to the map
    directionsDisplay = new google.maps.DirectionsRenderer({
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
    // figure out when the place opens/closes, and default duration is 1 hour
    // user can later edit these
    var earliest, latest;
    
    if (hours == undefined) {
        earliest = 0;
        latest = 2400;
    } else {
        // Sun = 0, Sat = 6; same as Google Maps
        var todays_weekday = new Date().getDay();

        var close_open = hours.periods[todays_weekday];

        // TODO : somethings (Central Park) are open from 6am to 1am. deal with this
        earliest = close_open['open']['hours'] * 100 + close_open['open']['minutes'];
        latest = close_open['close']['hours'] * 100 + close_open['close']['minutes'];
    }
    
    return {
        earliest: earliest,
        latest: latest
    };
}

function onPlaceChanged() {
    var places = searchBox.getPlaces();
    if (places[0].geometry) {
        var place = places[0];
        if (_.find(waypoints, function(n) {return n.id == place.place_id;})) {
            console.log("already added");
            return;
        }

        map.panTo(place.geometry.location);
        
        var markerLetter = nextMarkerLetter();
        var markerIcon = iconPath(MARKER_PATH, markerLetter);
        marker = new google.maps.Marker({
            position: place.geometry.location,
            animation: google.maps.Animation.DROP,
            icon: markerIcon,
            id: place.place_id,
            path: MARKER_PATH,
            prev: MARKER_PATH,
            letter: markerLetter
        });
        
        var hour_range = resolveHours(place.opening_hours);

        Tasks.create({
            id: place.place_id,
            name: place.name,
            letter: markerLetter,
            address: place.formatted_address,
            earliest: hour_range.earliest,
            latest: hour_range.latest,
            marker: marker
        });

        // clicking on a marker selects the corresponding item in list
        google.maps.event.addListener(marker, 'click', function() {
            $("#tr_" + this.id + " .task_str").click();
        });

        // hovering over a marker temp. highlights the item in list
        google.maps.event.addListener(marker, 'mouseover', function() {
            $("#tr_" + this.id + " .task_str").prev().addClass("dep_hovered");
        });
        google.maps.event.addListener(marker, 'mouseout', function() {
            $("#tr_" + this.id + " .task_str").prev().removeClass("dep_hovered");
        });

        marker.setMap(map);
        waypoints.push(marker);
                
        zoomToFit();
    }
}

function zoomToFit() { 
    if (waypoints.length == 0) {
        console.log("hello");
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
    var bounds = new google.maps.LatLngBounds();
    // Go through each...
    for (var i = 0; i < waypoints.length; i++) {
        var marker = waypoints[i];
        // And increase the bounds to take this point
        bounds.extend(marker.position);
    }
    
    return bounds;
}



// UI 

// hours can be undefined; if it is, we actually want hours.periods
function add_item(id, name, addr, hours) {    
    // create the html <tr> element for this location
    var row_id = '<td>' + marker.letter + '</td>';
    var task_str = '<td class="task_str"><b>' + id + '</b> <address>' + addr + '</address></td>';
    var times = "<td class='time'><div class='edit_view'>" + earliest + "</div><input type='text' class='edit' value=" + earliest + " which='earliest'></td>"
        + "<td class='time'><div class='edit_view'>" + duration + "</div><input type='text' class='edit' value=" + duration + " which='duration'></td>"
        + "<td class='time'><div class='edit_view'>" + latest + "</div><input type='text' class='edit' value=" + latest + " which='latest'></td>";
    var deps_btn = '<td><input type="button" class="button dep_btn" value="+" disabled></td>';
    var x_btn = '<td><input type="button" class="button delete_btn" value="x"></td>';
    var html = '<tr id="tr_' + id + '">' + row_id + task_str + times + deps_btn + x_btn + '</tr>';
    
    // add that element to the table
    $("#list").append(html);
    

    // click listener for the text of the location that will select it
    // selected locations can be added as deps to other locations
    $("#tr_" + id + " .task_str").click(function() {
        var marker = find_marker(id);
        
        if ($(this).hasClass("dep_selected")) {
            $(this).removeClass("dep_selected");
            marker.path = MARKER_PATH;
            marker.prev = marker.path;
            marker.setIcon(iconPath(marker.path, marker.letter));
        } else {
            $(this).addClass("dep_selected");
            marker.path = MARKER_SELECTED_PATH;
            marker.prev = marker.path;
            marker.setIcon(iconPath(marker.path,  marker.letter));
        }
        
        toggle_dep_buttons();
    });
    
    // when you hover over a location's text, it will change the color
    // of the marker corresponding to it
    $("#tr_" + id + " .task_str").hover(function() {
        var marker = find_marker(id);
        marker.prev = marker.path;
        marker.path = MARKER_HOVER_PATH;
        marker.setIcon(iconPath(marker.path, marker.letter));
    }, function () {
        var marker = find_marker(id);
        marker.path = marker.prev;
        marker.setIcon(iconPath(marker.path, marker.letter));
    });
    
    // click listener for the 'x' buttons to remove this location 
    $("#tr_" + id + " .delete_btn").click(function() {
        var tr = $(this).parents("tr").remove();
        var marker = find_marker(id);
        marker.setMap(null);
        waypoints = _.without(waypoints, marker);
        zoomToFit();
    });
    
    // click listn. to add all selected locations to _this_ location as 
    // dependencies, meaning that those must be done before _this_
    $("#tr_" + id + " .dep_btn").click(function() {
        var selected = $(".dep_selected");
        var selected_ids = _.map(selected, function(el) {
            return $(el).parents("tr").attr("id").substring(3);
        });
                
        if (deps[id] == undefined) {
            deps[id] = selected_ids;
        } else {
            deps[id] = deps[id].concat(selected_ids);
        }
                
        selected.each(function() {
            $(this).removeClass("dep_selected");
        });
        
        var names = selected.map(function(idx, el) {
            return $(el).children("b").html();
        });
        
        var html = "";
        for (var i = 0; i < names.length; i++) {
            html += "<tr id='trd_" + selected_ids[i] + "' class='dependency'><td></td><td><div>" + names[i] + "</div></td><td></td><td></td><td></td><td></td>" + x_btn + "</tr>";
        }
        
        $("#tr_" + id).after(html);

        $(".dependency .delete_btn").click(function() {
            var dep_id = $(this).parents("tr").attr("id").substring(4);
            deps[id] = _.without(deps[id], dep_id);
            $(this).parents("tr").remove();
        });
        
        toggle_dep_buttons();
    });

    // double-click listn. that opens the input boxes to edit times
    $(".time").dblclick(function() {
        var edit_box = $(this).children(".edit");
        edit_box.css("display", "block");
        edit_box.focus();
        edit_box.select();
        $(this).children(".edit_view").hide();
    });
    
    // when an editing input box is open, if you unfocus the box, 
    // it will treat it as cancelling the edit and then close the box
    $(".time .edit").blur(function() {
        $(this).siblings(".edit_view").show();
        $(this).hide();
    });
    
    // save-on-enter mechanics for the edit input boxes
    $(".time .edit").keypress(function(e) {
        if (e.keyCode == 13) {
            $(this).siblings(".edit_view").html($(this).val());
            var loc_id = $(this).parents("tr").attr("id").substring(3);
            console.log(loc_id);
            var marker = find_marker(loc_id);
            $(this).blur();
        }
    });

    toggle_dep_buttons();
}

function toggle_dep_buttons() {
    // enable all dep btns that can have dependencies addded to depending 
    // on which ones are selected
    // (right now, only constraint is that you can't add itself as a dep)
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
    // return the marker in @waypoints with the given id
    // returns null if not found

    for (var i = 0; i < waypoints.length; i++) {
        if (waypoints[i].id == id) {
            return waypoints[i];
        }
    }
    return null;
}



// submit to server
function submitTasks() {
    console.log("submit");
    // each marker in waypoints should have properties 
    // 'id', 'hours', and 'position'
    
    // create list of task ids
    ids = waypoints.map(function(m) {
        return m.id
    });
    
    // create a dict of id : periods
    // periods is an array of opening periods covering seven days, starting from Sunday, in chronological order.
    // https://developers.google.com/maps/documentation/javascript/places#place_details_responses
    // periods can be undefined
    hours = {};
    for (var i = 0; i < waypoints.length; i++) {
        hours[waypoints[i].id] = allToMinutes(waypoints[i].hours);
    }

    // for every unique pair of nodes, if we don't already have the distance info,
    // call Google Maps API to get it
    // and when we have all distance info, submit all data (distance, hours, user_prefs) to server
    if (maybe_submit()) 
        return;

    for (var i = 0; i < waypoints.length; i++) {
        for (var j = i + 1; j < waypoints.length; j++) {
            var key = waypoints[i].id + "," + waypoints[j].id
            
            // already have the distance value for this pair
            if (distances[key] != undefined)
                continue

            var request = {
                origin: waypoints[i].position,
                destination: waypoints[j].position,
                travelMode: google.maps.TravelMode.DRIVING
            };
            
            directionsService.route(request, distanceCallback(i,j));
        }
    }
}

function distanceCallback(i, j) {
    return function(response, status) {
        if (status == google.maps.DirectionsStatus.OK) {
            
            var key = waypoints[i].id + "," + waypoints[j].id
            
            directions[key] = response;
            //directionsDisplay.setDirections(response);
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
    // where n is the number of waypoints
    if (_.size(distances) === choose(waypoints.length, 2)) {
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
                var sched = data["schedule"];
                var legs = [];
                for (var i = 0; i < sched.length - 1; i++) {
                    var leg = find_directions(sched[i], sched[i+1]);
                    legs.push(leg);
                }

                var combined = combine_directions(legs);

                directionsDisplay.setDirections(combined);
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

function allToMinutes(d) {
    // Input : {"earliest" : xxyy,
    //          "duration" : m,
    //          "latest"   : xxyy }
    //         
    //     xxyy is an int and xx represents the hour and yy the minutes
    //          on a 24-hour clock, so 22:30 is 10:30 PM
    //     m is an int and represents the minutes, so 185 is
    //       185 minutes, or 3 hours and 5 minutes        
    //
    //
    // Output : all keys in minutes, so really just converting xxyy to minutes

    var earliest = d["earliest"];
    var latest = d["latest"];
    
    // same as Math.floor but handles negatives correctly
    var e_hour = (earliest / 100) >> 0;
    var e_min = (earliest % 100);
    earliest = e_hour * 60 + e_min;
    
    var l_hour = (latest / 100) >> 0;
    var l_min = (latest % 100);
    latest = l_hour * 60 + l_min;
    
    return {
        "earliest" : earliest,
        "duration" : d["duration"],
        "latest" : latest
    };
}
