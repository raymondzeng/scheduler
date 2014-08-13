require.config({
    paths: {
        'underscore': '//cdnjs.cloudflare.com/ajax/libs/underscore.js/1.6.0/underscore-min',
        'jquery': '//ajax.googleapis.com/ajax/libs/jquery/1.11.1/jquery.min',
        'backbone': '//cdnjs.cloudflare.com/ajax/libs/backbone.js/1.1.2/backbone-min',
        'backbone-localStorage': '//cdnjs.cloudflare.com/ajax/libs/backbone-localstorage.js/1.1.9/backbone.localStorage-min'
    },

    shim: {
        'backbone': {
            deps: ['jquery', 'underscore'],
            exports: 'Backbone'
        },
        'PageableCollection': {
            deps: ['underscore', 'backbone'],
            exports: 'PageableCollection'
        }
    }
});
    
