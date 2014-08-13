require.config({
    paths: {
        'underscore': 'http://cdnjs.cloudflare.com/ajax/libs/underscore.js/1.6.0/underscore-min',
        'jquery': 'http://ajax.googleapis.com/ajax/libs/jquery/1.11.1/jquery.min',
        'backbone': 'http://cdnjs.cloudflare.com/ajax/libs/backbone.js/1.1.2/backbone-min',
        'backbone-localStorage': 'http://cdnjs.cloudflare.com/ajax/libs/backbone-localstorage.js/1.1.9/backbone.localStorage-min',
        
        'gmaps' : 'lib/gmaps',
        'templates' : '../templates'
    },

    shim: {
        'underscore' : {
            exports: '_'
        }, 
        'backbone': {
            deps: ['jquery', 'underscore'],
            exports: 'Backbone'
        },
        'backbone-localStorage': {
            deps: ['backbone'],
            exports: ['LocalStorage']
        },
    }
});

require(['views/app'], function(AppView) {
    var App = new AppView;
    App.initialize();
});
    
