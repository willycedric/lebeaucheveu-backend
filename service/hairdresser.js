'use strict';
var _ = require('lodash');
var getCallbackUrl = function(hostname, provider){
  return 'http://' + hostname + '/hairdresser/settings/' + provider + '/callback';
};

var sendVerificationEmail = function(req, res, options) {
  req.app.utility.sendmail(req, res, {
    from: req.app.config.smtp.from.name +' <'+ req.app.config.smtp.from.address +'>',
    to: options.email,
    subject: 'Verify Your '+ req.app.config.projectName +' Hairdresser',
    textPath: 'hairdresser/verification/email-text',
    htmlPath: 'hairdresser/verification/email-html',
    locals: {
      verifyURL: req.protocol +'://'+ req.headers.host +'/hairdresser/verification/' + options.verificationToken,
      projectName: req.app.config.projectName
    },
    success: function() {
      options.onSuccess();
    },
    error: function(err) {
      options.onError(err);
    }
  });
};

var disconnectSocial = function(provider, req, res, next){
  provider = provider.toLowerCase();
  var outcome = {};
  var fieldsToSet = {};
  fieldsToSet[provider] = { id: undefined };
  req.app.db.models.User.findByIdAndUpdate(req.user.id, fieldsToSet, function (err, user) {
    if (err) {
      outcome.errors = ['error disconnecting user from their '+ provider + ' hairdresser'];
      outcome.success = false;
      return res.status(200).json(outcome);
    }
    outcome.success = true;
    return res.status(200).json(outcome);
  });
};

var connectSocial = function(provider, req, res, next){
  provider = provider.toLowerCase();
  var workflow = req.app.utility.workflow(req, res);
  workflow.on('loginSocial', function(){
    req._passport.instance.authenticate(provider, { callbackURL: getCallbackUrl(req.app.config.hostname, provider) }, function(err, user, info) {
      if(err){
        return workflow.emit('exception', err);
      }
      if (!info || !info.profile) {
        workflow.outcome.errors.push(provider + '  user not found');
        return workflow.emit('response');
      }

      workflow.profile = info.profile;
      return workflow.emit('findUser');
    })(req, res, next);
  });

  workflow.on('findUser', function(){
    var option = { _id: { $ne: req.user.id } };
    option[provider +'.id'] = workflow.profile.id;
    req.app.db.models.User.findOne(option, function(err, user) {
      if (err) {
        return workflow.emit('exception', err);
      }

      if (user) {
        //found another existing user already connects to provider
        workflow.outcome.errors.push('Another user has already connected with that '+ provider +' hairdresser.');
        return workflow.emit('response');
      }
      else {
        return workflow.emit('linkUser');
      }
    });
  });

  workflow.on('linkUser', function(){
    var fieldsToSet = {};
    fieldsToSet[provider] = {
      id: workflow.profile.id,
      profile: workflow.profile
    };

    req.app.db.models.User.findByIdAndUpdate(req.user.id, fieldsToSet, function(err, user) {
      if (err) {
        return workflow.emit('exception', err);
      }
      return workflow.emit('response');
    });
  });

  workflow.emit('loginSocial');
};

// public api
var hairdresser = {
  getAccountDetails: function(req, res, next){
    var outcome = {};

    var getAccountData = function(callback) {      
      req.app.db.models.Hairdresser.findById(req.user.roles.hairdresser.id, 'name nextbookings appointments notifications listOfPerformance profile_picture lastconnection description categories paiementInfo gallery_pictures customer_type activityArea  phone zip')
      .exec(function(err, hairdresser) {
        if (err) {
          return callback(err, null);
        }

        outcome.hairdresser = hairdresser;
        callback(null, 'done');
      });
    };

    var getUserData = function(callback) {
      req.app.db.models.User.findById(req.user.id, 'username email twitter.id github.id facebook.id google.id tumblr.id').exec(function(err, user) {
        if (err) {
          callback(err, null);
        }

        outcome.user = user;
        return callback(null, 'done');
      });
    };

    var asyncFinally = function(err, results) {
      if (err) {
        return next(err);
      }
      res.status(200).json(outcome);

      //res.render('hairdresser/settings/index', {
      //  data: {
      //    hairdresser: escape(JSON.stringify(outcome.hairdresser)),
      //    user: escape(JSON.stringify(outcome.user))
      //  },
      //  oauthMessage: oauthMessage,
      //  oauthTwitter: !!req.app.config.oauth.twitter.key,
      //  oauthTwitterActive: outcome.user.twitter ? !!outcome.user.twitter.id : false,
      //  oauthGitHub: !!req.app.config.oauth.github.key,
      //  oauthGitHubActive: outcome.user.github ? !!outcome.user.github.id : false,
      //  oauthFacebook: !!req.app.config.oauth.facebook.key,
      //  oauthFacebookActive: outcome.user.facebook ? !!outcome.user.facebook.id : false,
      //  oauthGoogle: !!req.app.config.oauth.google.key,
      //  oauthGoogleActive: outcome.user.google ? !!outcome.user.google.id : false,
      //  oauthTumblr: !!req.app.config.oauth.tumblr.key,
      //  oauthTumblrActive: outcome.user.tumblr ? !!outcome.user.tumblr.id : false
      //});
    };

    require('async').parallel([getAccountData, getUserData], asyncFinally);
  },
  update: function(req, res, next){
    var workflow = req.app.utility.workflow(req, res);

    workflow.on('validate', function() {
      if (!req.body.first) {
        workflow.outcome.errfor.first = 'required';
      }

      if (!req.body.last) {
        workflow.outcome.errfor.last = 'required';
      }

      if (workflow.hasErrors()) {
        return workflow.emit('response');
      }

      workflow.emit('patchAccount');
    });

    workflow.on('patchAccount', function() {
      var fieldsToSet = {
        name: {
          first: req.body.first,
          middle: req.body.middle,
          last: req.body.last,
          full: req.body.first +' '+ req.body.last
        },
        company: req.body.company,
        phone: req.body.phone,
        zip: req.body.zip,
        search: [
          req.body.first,
          req.body.middle,
          req.body.last,
          req.body.company,
          req.body.phone,
          req.body.zip
        ]
      };
      var options = { select: 'name company phone zip' };

      req.app.db.models.Hairdresser.findByIdAndUpdate(req.user.roles.hairdresser.id, fieldsToSet, options, function(err, hairdresser) {
        if (err) {
          return workflow.emit('exception', err);
        }

        workflow.outcome.hairdresser = hairdresser;
        return workflow.emit('response');
      });
    });

    workflow.emit('validate');
  },
  identity: function(req, res, next){
    var workflow = req.app.utility.workflow(req, res);

    workflow.on('validate', function() {
      if (!req.body.username) {
        workflow.outcome.errfor.username = 'required';
      }
      else if (!/^[a-zA-Z0-9\-\_]+$/.test(req.body.username)) {
        workflow.outcome.errfor.username = 'only use letters, numbers, \'-\', \'_\'';
      }

      if (!req.body.email) {
        workflow.outcome.errfor.email = 'required';
      }
      else if (!/^[a-zA-Z0-9\-\_\.\+]+@[a-zA-Z0-9\-\_\.]+\.[a-zA-Z0-9\-\_]+$/.test(req.body.email)) {
        workflow.outcome.errfor.email = 'invalid email format';
      }

      if (workflow.hasErrors()) {
        return workflow.emit('response');
      }

      workflow.emit('duplicateUsernameCheck');
    });

    workflow.on('duplicateUsernameCheck', function() {
      req.app.db.models.User.findOne({ username: req.body.username, _id: { $ne: req.user.id } }, function(err, user) {
        if (err) {
          return workflow.emit('exception', err);
        }

        if (user) {
          workflow.outcome.errfor.username = 'username already taken';
          return workflow.emit('response');
        }

        workflow.emit('duplicateEmailCheck');
      });
    });

    workflow.on('duplicateEmailCheck', function() {
      req.app.db.models.User.findOne({ email: req.body.email.toLowerCase(), _id: { $ne: req.user.id } }, function(err, user) {
        if (err) {
          return workflow.emit('exception', err);
        }

        if (user) {
          workflow.outcome.errfor.email = 'email already taken';
          return workflow.emit('response');
        }

        workflow.emit('patchUser');
      });
    });

    workflow.on('patchUser', function() {
      var fieldsToSet = {
        username: req.body.username,
        email: req.body.email.toLowerCase(),
        search: [
          req.body.username,
          req.body.email
        ]
      };
      var options = { select: 'username email twitter.id github.id facebook.id google.id' };

      req.app.db.models.User.findByIdAndUpdate(req.user.id, fieldsToSet, options, function(err, user) {
        if (err) {
          return workflow.emit('exception', err);
        }

        workflow.emit('patchAdmin', user);
      });
    });

    workflow.on('patchAdmin', function(user) {
      if (user.roles.admin) {
        var fieldsToSet = {
          user: {
            id: req.user.id,
            name: user.username
          }
        };
        req.app.db.models.Admin.findByIdAndUpdate(user.roles.admin, fieldsToSet, function(err, admin) {
          if (err) {
            return workflow.emit('exception', err);
          }

          workflow.emit('patchAccount', user);
        });
      }
      else {
        workflow.emit('patchAccount', user);
      }
    });

    workflow.on('patchAccount', function(user) {
      if (user.roles.hairdresser) {
        var fieldsToSet = {
          user: {
            id: req.user.id,
            name: user.username
          }
        };
        req.app.db.models.Hairdresser.findByIdAndUpdate(user.roles.hairdresser, fieldsToSet, function(err, hairdresser) {
          if (err) {
            return workflow.emit('exception', err);
          }

          workflow.emit('populateRoles', user);
        });
      }
      else {
        workflow.emit('populateRoles', user);
      }
    });

    workflow.on('populateRoles', function(user) {
      user.populate('roles.admin roles.hairdresser', 'name.full', function(err, populatedUser) {
        if (err) {
          return workflow.emit('exception', err);
        }

        workflow.outcome.user = populatedUser;
        workflow.emit('response');
      });
    });

    workflow.emit('validate');
  },
  password: function(req, res, next){
    var workflow = req.app.utility.workflow(req, res);

    workflow.on('validate', function() {
      if (!req.body.newPassword) {
        workflow.outcome.errfor.newPassword = 'required';
      }

      if (!req.body.confirm) {
        workflow.outcome.errfor.confirm = 'required';
      }

      if (req.body.newPassword !== req.body.confirm) {
        workflow.outcome.errors.push('Passwords do not match.');
      }

      if (workflow.hasErrors()) {
        return workflow.emit('response');
      }

      workflow.emit('patchUser');
    });

    workflow.on('patchUser', function() {
      req.app.db.models.User.encryptPassword(req.body.newPassword, function(err, hash) {
        if (err) {
          return workflow.emit('exception', err);
        }

        var fieldsToSet = { password: hash };
        req.app.db.models.User.findByIdAndUpdate(req.user.id, fieldsToSet, function(err, user) {
          if (err) {
            return workflow.emit('exception', err);
          }

          user.populate('roles.admin roles.hairdresser', 'name.full', function(err, user) {
            if (err) {
              return workflow.emit('exception', err);
            }

            workflow.outcome.newPassword = '';
            workflow.outcome.confirm = '';
            workflow.emit('response');
          });
        });
      });
    });

    workflow.emit('validate');
  },
  upsertVerification: function(req, res, next){
    var workflow = req.app.utility.workflow(req, res);

    workflow.on('generateTokenOrSkip', function() {
      if (req.user.roles.hairdresser.isVerified === 'yes') {
        workflow.outcome.errors.push('hairdresser already verified');
        return workflow.emit('response');
      }
      if (req.user.roles.hairdresser.verificationToken !== '') {
        //token generated already
        return workflow.emit('response');
      }

      workflow.emit('generateToken');
    });

    workflow.on('generateToken', function() {
      var crypto = require('crypto');
      crypto.randomBytes(21, function(err, buf) {
        if (err) {
          return next(err);
        }

        var token = buf.toString('hex');
        req.app.db.models.User.encryptPassword(token, function(err, hash) {
          if (err) {
            return next(err);
          }

          workflow.emit('patchAccount', token, hash);
        });
      });
    });

    workflow.on('patchAccount', function(token, hash) {
      var fieldsToSet = { verificationToken: hash };
      req.app.db.models.Hairdresser.findByIdAndUpdate(req.user.roles.hairdresser.id, fieldsToSet, function(err, hairdresser) {
        if (err) {
          return workflow.emit('exception', err);
        }

        sendVerificationEmail(req, res, {
          email: req.user.email,
          verificationToken: token,
          onSuccess: function() {
            return workflow.emit('response');
          },
          onError: function(err) {
            return next(err);
          }
        });
      });
    });

    workflow.emit('generateTokenOrSkip');
  },
  resendVerification: function(req, res, next){
    var workflow = req.app.utility.workflow(req, res);

    if (req.user.roles.hairdresser.isVerified === 'yes') {
      workflow.outcome.errors.push('hairdresser already verified');
      return workflow.emit('response');
    }

    workflow.on('validate', function() {
      if (!req.body.email) {
        workflow.outcome.errfor.email = 'required';
      }
      else if (!/^[a-zA-Z0-9\-\_\.\+]+@[a-zA-Z0-9\-\_\.]+\.[a-zA-Z0-9\-\_]+$/.test(req.body.email)) {
        workflow.outcome.errfor.email = 'invalid email format';
      }

      if (workflow.hasErrors()) {
        return workflow.emit('response');
      }

      workflow.emit('duplicateEmailCheck');
    });

    workflow.on('duplicateEmailCheck', function() {
      req.app.db.models.User.findOne({ email: req.body.email.toLowerCase(), _id: { $ne: req.user.id } }, function(err, user) {
        if (err) {
          return workflow.emit('exception', err);
        }

        if (user) {
          workflow.outcome.errfor.email = 'email already taken';
          return workflow.emit('response');
        }

        workflow.emit('patchUser');
      });
    });

    workflow.on('patchUser', function() {
      var fieldsToSet = { email: req.body.email.toLowerCase() };
      var options = { new: true };
      req.app.db.models.User.findByIdAndUpdate(req.user.id, fieldsToSet, options, function(err, user) {
        if (err) {
          return workflow.emit('exception', err);
        }

        workflow.user = user;
        workflow.emit('generateToken');
      });
    });

    workflow.on('generateToken', function() {
      var crypto = require('crypto');
      crypto.randomBytes(21, function(err, buf) {
        if (err) {
          return next(err);
        }

        var token = buf.toString('hex');
        req.app.db.models.User.encryptPassword(token, function(err, hash) {
          if (err) {
            return next(err);
          }

          workflow.emit('patchAccount', token, hash);
        });
      });
    });

    workflow.on('patchAccount', function(token, hash) {
      var fieldsToSet = { verificationToken: hash };
      req.app.db.models.Hairdresser.findByIdAndUpdate(req.user.roles.hairdresser.id, fieldsToSet, function(err, hairdresser) {
        if (err) {
          return workflow.emit('exception', err);
        }

        sendVerificationEmail(req, res, {
          email: workflow.user.email,
          verificationToken: token,
          onSuccess: function() {
            workflow.emit('response');
          },
          onError: function(err) {
            workflow.outcome.errors.push('Error Sending: '+ err);
            workflow.emit('response');
          }
        });
      });
    });

    workflow.emit('validate');
  },
  verify: function(req, res, next){
    var outcome = {};
    req.app.db.models.User.validatePassword(req.params.token, req.user.roles.hairdresser.verificationToken, function(err, isValid) {
      if (!isValid) {
        outcome.errors = ['invalid verification token'];
        outcome.success = false;
        return res.status(200).json(outcome);
      }

      var fieldsToSet = { isVerified: 'yes', verificationToken: '' };
      req.app.db.models.Hairdresser.findByIdAndUpdate(req.user.roles.hairdresser._id, fieldsToSet, function(err, hairdresser) {
        if (err) {
          return next(err);
        }
        outcome.success = true;
        outcome.user = {
          id: req.user._id,
          email: req.user.email,
          admin: !!(req.user.roles && req.user.roles.admin),
          isVerified: true
        };
        return res.status(200).json(outcome);
      });
    });
  },

  disconnectGoogle: function (req, res, next) {
    return disconnectSocial('google', req, res, next);
  },

  disconnectFacebook: function(req, res, next){
    return disconnectSocial('facebook', req, res, next);
  },

  connectGoogle: function(req, res, next){
    return connectSocial('google', req, res, next);
  },

  connectFacebook: function(req, res, next){
    return connectSocial('facebook', req, res, next);
  },
  upload:function(req,res,next){
  req.app.db.models.Hairdresser.findById(req.user.roles.hairdresser._id, function(err,hairdresser){
    if(hairdresser && req.body.photo){
      require('./imageHelper').uploadBase64Image('./upload/'+req.user.roles.hairdresser._id.toString()+"_profile.jpg",req.body.photo,function(err,result){
        if(err)
          res.sendStatus(400,err);
        else{
          hairdresser.profile_picture = result.secure_url;
          hairdresser.save(function(err){
            if(err)
              return next(err);
            else
              res.json(result.secure_url);
          });
        }
      });
    }
  });
  },
  updateGaleryEntry:function(req,res,next){
    req.app.db.models.Hairdresser.findById(req.user.roles.hairdresser._id, function(err,hairdresser){
    if(hairdresser){
      switch(req.body.type){
        case "url":
        {
            if(req.body.url && req.body.categoryId){
              var galeryEntry ={
                url:req.body.url,
                category:req.body.categoryId
              }
              hairdresser.gallery_pictures.push(galeryEntry);
              hairdresser.save(function(err,saved){
                if(err)
                  return next(err);
                else
                  res.json(saved.gallery_pictures);
              });
            }else{
              throw new Error("The picture url or categoryId is missing.");
            }
        }
        break;
        case "file":
        {
          if(req.body.photo && req.body.categoryId){
              require('./imageHelper').uploadBase64Image('./upload/'+req.user.roles.hairdresser._id.toString()+"_profile.jpg",req.body.photo,function(err,result){
            if(err)
              res.sendStatus(400,err);
            else{
                  var galeryEntry = {
                    url :result.secure_url,
                    category:req.body.categoryId
                  };
                  hairdresser.gallery_pictures.push(galeryEntry);
                  hairdresser.save(function(err,saved){
                    if(err)
                      return next(err);
                    else{                        
                        res.json(saved.gallery_pictures);
                    }                    
                  });
              }
              
            });
            }else{
              throw new Error("The picture file or categoryId is missing.");
            }
        }
        break;
        default:
        throw new Error("The type"+req.body.type+" is not handle by this function.");
      }
    }
  });
  },
  findGaleryEntries:function(req,res,next){  
    var galeryEntries = [];
    req.user.roles.hairdresser.gallery_pictures.forEach(function(entry,index){
      if(entry.published && entry.category==req.params.id){
        galeryEntries.push(entry);
      }
    });
    res.json(galeryEntries);

  },
  deleteGaleryEntries:function(req,res,next){
    var hairdresser=req.user.roles.hairdresser;
    hairdresser.gallery_pictures.id(req.params.id).published=false;
    hairdresser.save(function(err,saved){
      if(err)
        return next(err);
        res.sendStatus(200);
    });
  },

  updatePrefrences:function(req,res,next){
    //get the hairdresser account from the request object
   var hairdresser = req.user.roles.hairdresser;
   //update hairdresser list of performance
  req.body.user.hairdresser.listOfPerformance.forEach(function(elt,ind){
      if(hairdresser.listOfPerformance.indexOf(elt)==-1){
        hairdresser.listOfPerformance.push(elt);
      }
  });

  //update the categories subdocuments
  if(true){//TODO find a way to know if categories udapte are needed
    hairdresser.categories=[];//delete all the previous categories
    req.body.user.hairdresser.categories.forEach(function(elt, index){
      if(hairdresser.categories.indexOf(elt)==-1){
        console.log('category name',elt);
          var data = {
            name: elt
          }
          hairdresser.categories.push(data);
      }
    });
  }else{
    //TODO notify the hairdresser that the maximum numbers of categories allowed is reached
    //res.json({success:true});
  }  
  //update hairdresser customer type
  hairdresser.customer_type = req.body.user.hairdresser.customer_type;
  //save the hairdresser account
  hairdresser.save(function(err,saved){
    if(err)
      return next(err);
      res.json({data:{hairdresser:saved}});
  })

  //  res.sendStatus(202);
  },
  getHairdresserPublicDetails:function(req,res,next){  
  
  req.app.db.models.Hairdresser.findById(req.params.id, function(err, hairdresser){
      if(err){       
         return next(err);
      }       
        var hairdresserPublicInformations={};
        hairdresserPublicInformations.profile_picture = hairdresser.profile_picture;
        hairdresserPublicInformations.gallery_pictures = hairdresser.gallery_pictures;
        hairdresserPublicInformations.name = hairdresser.user.name;
        hairdresserPublicInformations.appointments = hairdresser.appointments; 
        hairdresserPublicInformations.customer_type=hairdresser.customer_type; 
        hairdresserPublicInformations.categories= hairdresser.categories; 
        hairdresserPublicInformations.description = hairdresser.description;   
        res.json(hairdresserPublicInformations);
  });
}

};
module.exports = hairdresser;