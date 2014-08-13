define([
    'backbone',
    'collections/dependency',
], function (Backbone, DependencyList) {
    var Task = Backbone.Model.extend({
        defaults: function() {
            return {
                id: -1,
                name: "No Name",
                address: "No Address",
                letter: "-",
                earliest: 0,
                duration: 60,
                latest: 2400,
                selected: false,
                canAdd: true,
            };
        },
        
        initialize: function() {
            this.dependencies = new DependencyList;
        },
        
        toggle: function() {
            this.save({
                selected: !this.get("selected"),
                canAdd: !this.get("canAdd")
            });
        },
    });
   
    return Task;
});
