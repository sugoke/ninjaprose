//Router.configure({
//    loadingTemplate: 'loading'
//});

Router.route('/', function () {
    if (Meteor.loggingIn()) {
        this.render('loading');
    } else {
        this.render('formTemplate');
    }
});

Router.route('/login', function() {
    if (Meteor.loggingIn()) {
        this.render('loading');
    } else {
        this.render('login');
    }
});

Router.route('/signup', function() {
    if (Meteor.loggingIn()) {
        this.render('loading');
    } else {
        this.render('signup');
    }
});
