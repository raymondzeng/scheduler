define([
	'backbone'
], function (Backbone) {
    var Dependency = Backbone.Model.extend({
        defaults: function() {
            return {
                letter: "-",
                name: "No Name"
            };
        }
    });

    return Dependency;
});
   
