'use strict';

var preAuth = require('./service/pre-auth');
var security = require('./service/security');
var account = require('./service/account');
var hairdresser = require('./service/hairdresser');
var blog = require('./service/blog');
var catalog = require('./service/catalog');
var blogCategory = require('./service/blogCategory');
var haircutCatalog = require('./service/haircutCatalog');
var admin = require('./service/admin/admin');
var adminUser = require('./service/admin/user');
var adminAccount = require('./service/admin/account');
var adminHairdresser = require('./service/admin/hairdresser');
var adminAdministrator = require('./service/admin/administrator');
var adminGroup = require('./service/admin/admin-group');
var adminStatus = require('./service/admin/status');
var adminCategory = require('./service/admin/category');
var adminBlog = require('./service/admin/blog');
var adminBlogCategory = require('./service/admin/blogCategory');
var adminCatalog = require('./service/admin/catalog');
var adminHaircutCategory = require('./service/admin/haircut-category');
var adminHomeGallery = require('./service/admin/homeGallery');
var adminHaircutStyle = require('./service/admin/haircut-style');

function useAngular(req, res, next){
  res.sendFile(require('path').join(__dirname, './client/dist/index.html'));
}

function apiEnsureAuthenticated(req, res, next){
  if(req.method != 'OPTIONS'){
    if(req.isAuthenticated()){
    return next();
    }
    res.set('X-Auth-Required', 'true');
    //no need to store the originalUrl in session: caller knows the return url
    //req.session.returnUrl = req.originalUrl;
    res.status(401).send({errors: ['authentication required']});
  }else{
    return next();
  }
  
}

function apiEnsureAccount(req, res, next){
  if(req.method != 'OPTIONS'){
    if(req.user.canPlayRoleOf('account')){
      return next();
   }
    res.status(401).send({errors: ['authorization required']});
  }else{
    return next();
  }
  
}
function apiEnsureHairdresser(req, res, next){
  if(req.method!='OPTIONS'){    
    if(req.user.canPlayRoleOf('hairdresser')){
      return next();
    }
    res.status(401).send({errors: ['authorization required']});
  }else{
    return next();
  }
}

function apiEnsureVerifiedAccount(req, res, next){
  if(req.method!='OPTIONS'){
    if(!req.app.config.requireAccountVerification){
      return next();
    }
    var test = req.user;
  
    req.user.isAccountVerified(function(err, flag){
      if(err){
        return next(err);
      }
      if(flag){
        return next();
      }else{
        return res.status(401).send({errors: ['verification required']});
      }
    });
  }else{
    return next();
  }
}

function apiEnsureVerifiedHairdresser(req, res,next){
  if(req.method!='OPTIONS'){
    if(!req.app.config.requireAccountVerification){
      return next();
    } 
    req.user.isHairdresserVerified(function(err, flag){
      if(err){
        return next(err);
      }
      if(flag){
        return next();
      }else{
        return res.status(401).send({errors: ['verification required']});
      }
    });
  }else{
    return next();
  }
}

function apiEnsureAdmin(req, res, next){
  if(req.method !='OPTIONS'){
      if(req.user.canPlayRoleOf('admin')){
      return next();
      }
      res.status(401).send({errors: ['authorization required']});
    }else{
      return next();
    }
  
}

exports = module.exports = function(app, passport) {
  //******** NEW JSON API ********
  app.get('/api/current-user', security.sendCurrentUser);
  app.post('/api/sendMessage', preAuth.sendMessage);
  app.post('/api/signup', security.signup);
  app.post('/api/login', security.login);
  app.post('/api/login/forgot', security.forgotPassword);
  app.put('/api/login/reset/:username/:token', security.resetPassword);
  app.get('/api/login/facebook/callback', security.loginFacebook);
  app.get('/api/login/google/callback', security.loginGoogle);
  app.post('/api/logout', security.logout);

  //-----authentication Account required api-----
  //app.all('/api/account*', apiEnsureAuthenticated);
  //app.all('/api/account*', apiEnsureAccount);
  app.get('/api/account/verification', apiEnsureAuthenticated,apiEnsureAccount, account.upsertVerification);
  app.post('/api/account/verification',  apiEnsureAuthenticated,apiEnsureAccount,account.resendVerification);
  app.get('/api/account/verification/:token/', account.verify);
  app.all('/api/account/settings*', apiEnsureAuthenticated,apiEnsureAccount, apiEnsureVerifiedAccount);
  app.get('/api/account/settings',  apiEnsureAuthenticated,apiEnsureAccount,account.getAccountDetails);
  app.put('/api/account/settings',  apiEnsureAuthenticated,apiEnsureAccount,account.update);
  app.put('/api/account/settings/identity',  apiEnsureAuthenticated,apiEnsureAccount,account.identity);
  app.put('/api/account/settings/password', apiEnsureAuthenticated,apiEnsureAccount, account.password);
  app.get('/api/account/settings/google/callback',  apiEnsureAuthenticated,apiEnsureAccount,account.connectGoogle);
  app.get('/api/account/settings/google/disconnect', apiEnsureAuthenticated,apiEnsureAccount, account.disconnectGoogle);
  app.get('/api/account/settings/facebook/callback',  apiEnsureAuthenticated,apiEnsureAccount,account.connectFacebook);
  app.get('/api/account/settings/facebook/disconnect', apiEnsureAuthenticated,apiEnsureAccount, account.disconnectFacebook);
  app.put('/api/account/upload', apiEnsureAuthenticated,apiEnsureAccount,account.upload);
  


//----------authentication Hairdresser required api ------------------

  //app.all('/api/hairdresser*', apiEnsureAuthenticated);
  //app.all('/api/hairdresser*', function(req,res,next){
  //  console.log('root hairdresser ensure ');
 //   next();
 // },apiEnsureHairdresser);
  app.get('/api/hairdresser/verification',apiEnsureAuthenticated, apiEnsureHairdresser,hairdresser.upsertVerification);
  app.post('/api/hairdresser/verification', apiEnsureAuthenticated, apiEnsureHairdresser,hairdresser.resendVerification);
  app.get('/api/hairdresser/verification/:token/', hairdresser.verify);
  app.put('/api/hairdresser/upload',apiEnsureAuthenticated, apiEnsureHairdresser,hairdresser.upload);
  app.all('/api/hairdresser/settings*',apiEnsureAuthenticated,apiEnsureHairdresser,apiEnsureVerifiedHairdresser);
  app.get('/api/hairdresser/settings', apiEnsureAuthenticated, apiEnsureHairdresser,hairdresser.getAccountDetails);
  app.put('/api/hairdresser/settings', apiEnsureAuthenticated, apiEnsureHairdresser,hairdresser.update);
  app.put('/api/hairdresser/settings/identity',apiEnsureAuthenticated, apiEnsureHairdresser, hairdresser.identity);
  app.put('/api/hairdresser/settings/password', apiEnsureAuthenticated, apiEnsureHairdresser,hairdresser.password);
  app.get('/api/hairdresser/settings/google/callback', apiEnsureAuthenticated, apiEnsureHairdresser,hairdresser.connectGoogle);
  app.get('/api/hairdresser/settings/google/disconnect',apiEnsureAuthenticated, apiEnsureHairdresser, hairdresser.disconnectGoogle);
  app.get('/api/hairdresser/settings/facebook/callback', apiEnsureAuthenticated, apiEnsureHairdresser,hairdresser.connectFacebook);
  app.get('/api/hairdresser/settings/facebook/disconnect',apiEnsureAuthenticated, apiEnsureHairdresser, hairdresser.disconnectFacebook);
  app.put('/api/hairdresser/upload/galery',apiEnsureAuthenticated, apiEnsureHairdresser,hairdresser.updateGaleryEntry);
  app.get('/api/hairdresser/galery/entries/:id',apiEnsureAuthenticated, apiEnsureHairdresser,hairdresser.findGaleryEntries);
  app.delete('/api/hairdresser/galery/entries/:id/:category',apiEnsureAuthenticated, apiEnsureHairdresser,hairdresser.deleteGaleryEntries);
  app.put('/api/hairdresser/setting/preference',apiEnsureAuthenticated, apiEnsureHairdresser,hairdresser.updatePrefrences);
  app.get('/api/public/hairdresser/:id',hairdresser.getHairdresserPublicDetails);
  app.get('/api/public/hairdressers',hairdresser.getLastGaleryEntries);
  app.get('/api/hairdresser/haircut/categories',hairdresser.getAvailabeHaircutCategories);
  app.get('/api/hairdresser/haircut/styles',hairdresser.getAvailabeHaircutStyles);
  app.get('/api/hairdresser/haircut/categories/:id', hairdresser.findHaircutCategoryById);
  app.get('/api/public/home/entries', hairdresser.getListOfSelectedEntries);


  

//---------- Public Blog api ------------------
 app.get("/api/blogs", blog.findBlogs);
 app.get("/api/blogs/:id",blog.read);
 app.get("/api/blogs/related/:id",blog.related);
 app.get("/api/blogs/author/:id",blog.author);

//---------- Public Catalog api ------------------
 app.get("/api/catalogs", catalog.findCatalogs);
 app.get("/api/catalogs/:id",catalog.read);


 //------- Public blog category api --------
 app.get("/api/blog-category", blogCategory.findBlogCategories);

//----- Public Haircut catalog api
app.get("/api/public/haircut/catalogs", haircutCatalog.read);

  //-----athorization required api-----
  app.all('/api/admin*', apiEnsureAuthenticated);
  app.all('/api/admin*', apiEnsureAdmin);
  app.get('/api/admin', admin.getStats);

  //admin > users
  app.get('/api/admin/users', adminUser.find);
  app.post('/api/admin/users/', adminUser.create);
  app.get('/api/admin/users/:id', adminUser.read);
  app.put('/api/admin/users/:id', adminUser.update);
  app.put('/api/admin/users/:id/password', adminUser.password);
  app.put('/api/admin/users/:id/role-admin', adminUser.linkAdmin);
  app.delete('/api/admin/users/:id/role-admin', adminUser.unlinkAdmin);
  app.put('/api/admin/users/:id/role-account', adminUser.linkAccount);
  app.delete('/api/admin/users/:id/role-account', adminUser.unlinkAccount);
  app.delete('/api/admin/users/:id', adminUser.delete);

  //admin > administrators
  app.get('/api/admin/administrators', adminAdministrator.find);
  app.post('/api/admin/administrators', adminAdministrator.create);
  app.get('/api/admin/administrators/:id', adminAdministrator.read);
  app.put('/api/admin/administrators/:id', adminAdministrator.update);
  app.put('/api/admin/administrators/:id/permissions', adminAdministrator.permissions);
  app.put('/api/admin/administrators/:id/groups', adminAdministrator.groups);
  app.put('/api/admin/administrators/:id/user', adminAdministrator.linkUser);
  app.delete('/api/admin/administrators/:id/user', adminAdministrator.unlinkUser);
  app.delete('/api/admin/administrators/:id', adminAdministrator.delete);

  //admin > admin groups
  app.get('/api/admin/admin-groups', adminGroup.find);
  app.post('/api/admin/admin-groups', adminGroup.create);
  app.get('/api/admin/admin-groups/:id', adminGroup.read);
  app.put('/api/admin/admin-groups/:id', adminGroup.update);
  app.put('/api/admin/admin-groups/:id/permissions', adminGroup.permissions);
  app.delete('/api/admin/admin-groups/:id', adminGroup.delete);

  //admin > accounts
  app.get('/api/admin/accounts', adminAccount.find);
  app.post('/api/admin/accounts', adminAccount.create);
  app.get('/api/admin/accounts/:id', adminAccount.read);
  app.put('/api/admin/accounts/:id', adminAccount.update);
  app.put('/api/admin/accounts/:id/user', adminAccount.linkUser);
  app.delete('/api/admin/accounts/:id/user', adminAccount.unlinkUser);
  app.post('/api/admin/accounts/:id/notes', adminAccount.newNote);
  app.post('/api/admin/accounts/:id/status', adminAccount.newStatus);
  app.delete('/api/admin/accounts/:id', adminAccount.delete);

  //admin > hairdressers 
  app.get('/api/admin/hairdressers', adminHairdresser.find);
  app.post('/api/admin/hairdressers', adminHairdresser.create);
  app.get('/api/admin/hairdressers/:id', adminHairdresser.read);
  app.put('/api/admin/hairdressers/:id', adminHairdresser.update);
  app.put('/api/admin/hairdressers/:id/user', adminHairdresser.linkUser);
  app.delete('/api/admin/hairdressers/:id/user', adminHairdresser.unlinkUser);
  app.post('/api/admin/hairdressers/:id/notes', adminHairdresser.newNote);
  app.post('/api/admin/hairdressers/:id/status', adminHairdresser.newStatus);
  app.delete('/api/admin/hairdressers/:id', adminHairdresser.delete);

  //admin > statuses
  app.get('/api/admin/statuses', adminStatus.find);
  app.post('/api/admin/statuses', adminStatus.create);
  app.get('/api/admin/statuses/:id', adminStatus.read);
  app.put('/api/admin/statuses/:id', adminStatus.update);
  app.delete('/api/admin/statuses/:id', adminStatus.delete);

  //admin > categories
  app.get('/api/admin/categories', adminCategory.find);
  app.post('/api/admin/categories', adminCategory.create);
  app.get('/api/admin/categories/:id', adminCategory.read);
  app.put('/api/admin/categories/:id', adminCategory.update);
  app.delete('/api/admin/categories/:id', adminCategory.delete);


  //admin > blogs
  app.get('/api/admin/blogs', adminBlog.find);
  app.post('/api/admin/blogs', adminBlog.create);
  app.get('/api/admin/blogs/:id', adminBlog.read);
  app.put('/api/admin/blogs/:id', adminBlog.update);
  app.delete('/api/admin/blogs/:id', adminBlog.delete);


  //admin > blog categories
  app.get('/api/admin/blog-category', adminBlogCategory.find);
  app.post('/api/admin/blog-category', adminBlogCategory.create);
  app.get('/api/admin/blog-category/:id', adminBlogCategory.read);
  app.put('/api/admin/blog-category/:id', adminBlogCategory.update);
  app.delete('/api/admin/blog-category/:id', adminBlogCategory.delete);


    //admin > catalogs
  app.get('/api/admin/catalogs', adminCatalog.find);
  app.post('/api/admin/catalogs', adminCatalog.create);
  app.get('/api/admin/catalogs/:id', adminCatalog.read);
  app.put('/api/admin/catalogs/:id', adminCatalog.update);
  app.delete('/api/admin/catalogs/:id', adminCatalog.delete);

  //admin > haircut categories  
  app.get('/api/admin/haircut/categories', adminHaircutCategory.find);
  app.post('/api/admin/haircut/categories', adminHaircutCategory.create);
  app.get('/api/admin/haircut/categories/:id', adminHaircutCategory.read);
  app.put('/api/admin/haircut/categories/:id', adminHaircutCategory.update);
  app.delete('/api/admin/haircut/categories/:id', adminHaircutCategory.delete);

  //admin > haircut styles     
  app.get('/api/admin/haircut/styles', adminHaircutStyle.find);
  app.post('/api/admin/haircut/styles', adminHaircutStyle.create);
  app.get('/api/admin/haircut/styles/:id', adminHaircutStyle.read);
  app.put('/api/admin/haircut/styles/:id', adminHaircutStyle.update);
  app.delete('/api/admin/haircut/styles/:id', adminHaircutStyle.delete);
 
  //admin > home gallery entries 
  app.get('/api/admin/home/gallery', adminHomeGallery.find);
  app.post('/api/admin/home/gallery', adminHomeGallery.create);
  app.get('/api/admin/home/gallery/:id', adminHomeGallery.read);
  app.put('/api/admin/home/gallery/:id', adminHomeGallery.update);
  app.delete('/api/admin/home/gallery/:id', adminHomeGallery.delete);

  //admin > search
  app.get('/api/admin/search', admin.search);

  //******** END OF NEW JSON API ********

  //******** Static routes handled by Angular ********
  //public
  app.get('/', useAngular);
  app.get('/about', useAngular);
  app.get('/contact', useAngular);

  //sign up
  app.get('/signup', useAngular);

  //social sign up no-longer needed as user can login with their social account directly
  //this eliminates one more step (collecting email) before user login

  //login/out
  app.get('/login', useAngular);
  app.get('/login/forgot', useAngular);
  app.get('/login/reset', useAngular);
  app.get('/login/reset/:email/:token', useAngular);

  //social login
  app.get('/login/facebook', passport.authenticate('facebook', { callbackURL: 'http://' + app.config.hostname + '/login/facebook/callback', scope: ['email'] }));
  app.get('/login/facebook/callback', useAngular);
  app.get('/login/google', passport.authenticate('google', { callbackURL: 'http://' + app.config.hostname + '/login/google/callback', scope: ['profile email'] }));
  app.get('/login/google/callback', useAngular);

  //account
  app.get('/account', useAngular);

  //account > verification
  app.get('/account/verification', useAngular);
  app.get('/account/verification/:token', useAngular);

  //account > settings
  app.get('/account/settings', useAngular);

  //account > settings > social
  app.get('/account/settings/facebook/', passport.authenticate('facebook', { callbackURL: 'http://' + app.config.hostname + '/account/settings/facebook/callback', scope: [ 'email' ]}));
  app.get('/account/settings/facebook/callback', useAngular);
  app.get('/account/settings/google/', passport.authenticate('google', { callbackURL: 'http://' + app.config.hostname + '/account/settings/google/callback', scope: ['profile email'] }));
  app.get('/account/settings/google/callback', useAngular);

  //admin
  app.get('/admin', useAngular);

  //admin > users
  app.get('/admin/users', useAngular);
  app.get('/admin/users/:id', useAngular);

  //admin > administrators
  app.get('/admin/administrators', useAngular);
  app.get('/admin/administrators/:id', useAngular);

  //admin > admin groups
  app.get('/admin/admin-groups', useAngular);
  app.get('/admin/admin-groups/:id', useAngular);

  //admin > accounts
  app.get('/admin/accounts', useAngular);
  app.get('/admin/accounts/:id', useAngular);

  //admin > hairdressers
  app.get('/admin/hairdressers', useAngular);
  app.get('/admin/hairdressers/:id', useAngular);

  //admin > statuses
  app.get('/admin/statuses', useAngular);
  app.get('/admin/statuses/:id', useAngular);

  //admin > categories
  app.get('/admin/categories', useAngular);
  app.get('/admin/categories/:id', useAngular);

  //other routes not found nor begin with /api is handled by Angular
  app.all(/^(?!\/api).*$/, useAngular);

  //******** End OF static routes ********
};
