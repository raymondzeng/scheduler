define([
    'jquery',
    'underscore',
    'backbone',
    'text!templates/task.html',
    'views/dependency',
    'models/Task'
], function ($, _, Backbone, taskTemplate, DependencyView, Task) {
    var TaskView = Backbone.View.extend({
        tagName: "tr",
        template: _.template(taskTemplate),

        events: {
            "click .task_str"   : "toggleSelected",
            "click .delete_btn" : "clear",
            "click .dep_btn"    : "addDeps",
            "dblclick .time"    : "editTime",
            "blur .edit"        : "close",
            "keypress .edit"    : "updateOnEnter"
        },
        
        initialize: function() {
            this.depViews = [];
            this.listenTo(this.model, 'change', this.render);
            this.listenTo(this.model, 'destroy', this.remove);

            var marker = this.model.get("marker");
            if (marker) 
                marker.setMap(map);
            
            _.bindAll(this, 'render');
            this.model.dependencies.bind('reset', this.render);
            this.model.dependencies.bind('add', this.render);
            this.model.dependencies.bind('remove', this.render);
        },

        render: function() {
            this.$el.html(this.template(this.model.toJSON()));
            this.displaySelected();
            this.$el.children("td").children(".dep_btn").prop("disabled", !this.model.get("canAdd"));
            
            _.each(this.depViews, function(view) {
                view.remove();
            });

            var depCollection = this.model.dependencies;
            
            var taskView = this;
            depCollection.each(function(model) {
                var depView = new DependencyView({
                    model: model
                });
                taskView.depViews = taskView.depViews.concat([depView]);
                taskView.$el.after(depView.render().el);
            });

            return this;
        },
        
        toggleSelected: function() {
            this.model.toggle();
        },
        
        addDeps: function() {
            var Tasks = this.collection;
            var selected = Tasks.selected();
            var taskView = this;
            var depViews = _.each(selected, function(v) {
                taskView.model.dependencies.create({
                    id: v.get("id"),
                    name: v.get("name"),
                    letter: v.get("letter")
                });
            });
            
            Tasks.deselectAll();
        },
        
        editTime: function(e) {
            var edit_box = $(e.target).siblings(".edit");
            edit_box.css("display", "block").focus().select();
            $(e.target).hide();
        },
        
        close: function(e) {
            $(e.target).siblings(".edit_view").show();
            $(e.target).hide();
        },

        updateOnEnter: function(e) {
            if (e.keyCode != 13) return;
            var which = $(e.target).attr("which");
            var dict = {};
            dict[which] = $(e.target).val();
            this.model.save(dict);
        },
        
        clear: function() {
            var marker = this.model.get("marker");
            if (marker) {
                waypoints = _.without(waypoints, marker);
                marker.setMap(null);
                zoomToFit();
            }
            
            this.model.dependencies.each(function(model) {
                model.destroy();
            });
            
            this.model.destroy();
        },
        
        displaySelected: function() {
            var marker = this.model.get("marker");
            if (this.model.get("selected")) {
                this.$el.children(".task_str").addClass("dep_selected");
                // marker.path = MARKER_SELECTED_PATH;
                // marker.prev = marker.path;
                // marker.setIcon(iconPath(marker.path,  marker.letter));
            } else {
                this.$el.children(".task_str").removeClass("dep_selected");
                // marker.path = MARKER_PATH;
                // marker.prev = marker.path;
                // marker.setIcon(iconPath(marker.path, marker.letter));
            }
        }
    });
    
    return TaskView;
});
