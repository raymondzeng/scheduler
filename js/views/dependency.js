define([
    'jquery',
    'underscore',
    'backbone',
    'text!templates/dependency.html',
    'models/dependency'
], function ($, _, Backbone, DependencyTemplate, Dependency) {
    var DependencyView = Backbone.View.extend({
        tagName: "tr",
        template: _.template(DependencyTemplate),
        
        events: {
            "click .delete_btn" : "clear"
        },
        
        initialize: function() {
            this.listenTo(this.model, 'change', this.render);
            this.listenTo(this.model, 'destroy', this.remove);
        },

        render: function() {
            this.$el.attr("class", "dependency");
            this.$el.html(this.template(this.model.toJSON()));
            return this;
        },

        clear: function() {
            this.model.destroy();
        }
    });
    
    return DependencyView;
});
