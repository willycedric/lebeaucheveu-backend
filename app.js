'use strict';

//dependencies
var config = require('./config'),
    express = require('express'),
    cookieParser = require('cookie-parser'),
    bodyParser = require('body-parser'),
    session = require('express-session'),
    mongoStore = require('connect-mongo')(session),
    http = require('http'),
    path = require('path'),
    passport = require('passport'),
    mongoose = require('mongoose'),    
    helmet = require('helmet'),
    csrf = require('csurf');
    mongoose.Promise = require('bluebird'); //custom mongoose promise librairy 
var api = require('./route/api')(passport);
var imageHelper = require('./service/imageHelper');
//create express app
var app = express();

//keep reference to config
app.config = config;
var debug = require('debug')('expressdebug:server');
//setup the web server
app.server = http.createServer(app);

//setup mongoose
app.db = mongoose.createConnection(config.mongodb.uri);
app.db.on('error', console.error.bind(console, 'mongoose connection error: '));
app.db.once('open', function () {
  //and... we have a data store
});

//config data models
require('./models')(app, mongoose);

//settings
app.disable('x-powered-by');
app.set('port', config.port);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

//middleware

app.use(require('morgan')('dev'));
app.use(require('compression')());
app.use(require('serve-static')(path.join(__dirname, 'client/dist')));
app.use(require('method-override')());


app.use(bodyParser.urlencoded({limit: "50MB", extended: true, parameterLimit:50000}));
app.use(bodyParser.text());                                    
app.use(bodyParser.json({ type: 'application/json',limit:'50MB'}));
app.use(cookieParser(config.cryptoKey));
app.use(session({
  resave: true,
  saveUninitialized: true,
  secret: config.cryptoKey,
  store: new mongoStore({ url: config.mongodb.uri })
}));
app.use(passport.initialize());
app.use(passport.session());
//app.use(csrf({ cookie: { signed: true } }));

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", app.config.front.url);
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
  res.header("Access-Control-Allow-Methods", "GET, POST, DELETE,PUT");
  res.header("Access-Control-Allow-Credentials", "true"); 
  next();

});

//response locals
app.use(function(req, res, next) {
  //res.cookie('_csrfToken', req.csrfToken());
  res.locals.user = {};
  res.locals.user.defaultReturnUrl = req.user && req.user.defaultReturnUrl();
  res.locals.user.username = req.user && req.user.username;
  next();
});

//global locals
app.locals.projectName = app.config.projectName;
app.locals.copyrightYear = new Date().getFullYear();
app.locals.copyrightName = app.config.companyName;
app.locals.cacheBreaker = 'br34k-01';

//setup passport
require('./passport')(app, passport);

//setup routes
require('./routes')(app, passport);
app.use('/api',api);
//custom (friendly) error handler
app.use(require('./service/http').http500);

//setup utilities
app.utility = {};
app.utility.sendmail = require('./util/sendmail');
app.utility.slugify = require('./util/slugify');
app.utility.workflow = require('./util/workflow');
app.utility.geocoder = require('./util/geocoder');
app.utility.distance = require('./util/distance');
app.utility.boundary = require('./util/boundary');
app.utility.sendActivationMail = require('./util/sendActivationMail');
app.utility.accountActivation = require('./util/accountActivation');
app.debug = debug;
//listen up
app.server.listen(app.config.port, function(){
  app.debug("and... we're live on port ",app.config.port);
});
