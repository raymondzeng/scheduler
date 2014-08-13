define([
    'backbone',
    'backbone-localStorage',
    'models/task'
], function(Backbone, LocalStorage, Task) {
    var TaskList = Backbone.Collection.extend({
        model: Task,
        localStorage: new LocalStorage("tasks"),
        
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
    
    return TaskList;
});
