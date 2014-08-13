define([
    'jquery',
    'backbone',
    'collections/task',
    'views/task',
    'gmaps-utils'
], function ($, Backbone, Tasks, TaskView, MapsUtils) {
    var AppView = Backbone.View.extend({
        el: $(document),
        
        initialize: function() {
            this.input = this.$("#searchTextField");
            this.tasks = new Tasks();
            this.listenTo(this.tasks, 'add', this.addOne);
            this.tasks.fetch();
            MapsUtils.initGoogleMaps(this.tasks);
            this.setupDomListeners();
        },
        
        addOne: function(task) {
            var view = new TaskView({model: task});
            this.$("#list").append(view.render().el);
        },
        
        setupDomListeners: function() {
            var thisApp = this;
            this.$('#searchTextField').keypress(function (e) {
                if (e.which == 13) {
                    e.preventDefault();
                }
            });    

            this.$("#go a").click(function() {
                thisApp.$("#landing").slideUp();
                thisApp.$("#app").show();
                google.maps.event.trigger(map, 'resize');
                thisApp.$("html").css("background", "white");
                thisApp.$("#searchTextField").focus();
            });
            
            this.$("#app a").click(function() {
                thisApp.$("#app").hide();
                thisApp.$("#landing").slideDown();
                thisApp.$("html").css("background", 'url("img/map.png")');
            });
        }
    });
    
    return AppView;
});
