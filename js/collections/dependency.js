define([
    'backbone',
    'backbone-localStorage',
    'models/dependency'
], function(Backbone, LocalStorage, Dependency) {
    var DependencyList = Backbone.Collection.extend({
        model: Dependency,
        localStorage: new LocalStorage("tasks-dependencies")
    });
    
    return DependencyList;
});
