'use strict';

var _ = require('lodash');
var async = require('async');
var moment = require('moment');
var ObjectID = require('mongodb').ObjectID;
// var googleMapsClient = require('@google/maps').createClient({
//   key:require('./../config').oauth.google.key
// });
exports.get = function(req, res, next) {
  req.app.db.models.Account.find({})
    .select('-password')
    .exec()
    .then(function(users){
      res.json(users);
    }, function(err){
      next(err);
    });
};
/**
 * [params description]
 * @param  {[type]}   req  [description]
 * @param  {[type]}   res  [description]
 * @param  {Function} next [description]
 * @param  {[type]}   id   [description]
 * @return {[type]}        [description]
 */
exports.params = function(req,res,next,id){
      req.app.db.models.Account.findById(id,function(err,hairdresser) {
        if(err){
          next(err);
        }
        else if (!hairdresser) {
          next(new Error('No project with that id'));
        } else {
          req.hairdresser = hairdresser;
          next();
        }
      });
};

/**
 * [getOne description]
 * @param  {[type]}   req  [description]
 * @param  {[type]}   res  [description]
 * @param  {Function} next [description]
 * @return {[type]}        [description]
 */
exports.getOne = function(req, res, next) {
  var user = new req.app.db.models.Account(req.user);
  //var user = req.user.toJson();
  res.json(user.toJson());
};


/**
 * [updateCustomerPreference function allowing to update customer preferences]
 * @param  {[type]}   req  [description]
 * @param  {[type]}   res  [description]
 * @param  {Function} next [description]
 * @return {[type]}        [description]
 */
exports.updateCustomerPreference = function(req, res, next){
  var workflow = req.app.utility.workflow(req,res);
  //on iniy go and fetch the address relatives informations
  workflow.on('init', function(){
      req.app.utility.geocoder().geocode(req.body.location.address)
        .then(function(res) {
          console.log(res[0].longitude, res[0].latitude, res[0].formattedAddress.toString());
          workflow.outcome.longitude = res[0].longitude;
          workflow.outcome.latitude = res[0].latitude;
          workflow.outcome.formattedAddress =  res[0].formattedAddress;
          return workflow.emit('patchCustomer');
        })
        .catch(function(err) {
          return next(err);
        });
  });

  workflow.on('patchCustomer', function(){
      var  customerId = req.user.roles.account;  
      //check if the location has already been created  
      if(req.body.location.hasOwnProperty('_id')){
        var location = req.body.location;
        var query = {   
          _id: new ObjectID(customerId),
          locations:{
            $elemMatch:{
              _id: new ObjectID(location._id)
            }
          }
        };

        req.app.db.models.Account.update(query,{
          $set:{
            "locations.$.type":location.type==1?'main':'secondary',
            "locations.$.address":workflow.outcome.formattedAddress,
            "locations.$.longitude":workflow.outcome.longitude.toString(),
            "locations.$.latitude":workflow.outcome.latitude.toString()         
          }
        },{
          multi:false
        }, function(err,saved){
          if(err){
            return next(err);
          }else if(saved){
            res.status(202).json({sucess:true});
          }
        });
      }else{ //create a new location object
        var location = {
          type: req.body.location.type==1?'main':'secondary',
          address:workflow.outcome.formattedAddress,
          longitude:workflow.outcome.longitude,
          latitude:workflow.outcome.latitude          
        };
        req.app.db.models.Account.findById(customerId,function(err,customer){
          if(err)
            return next(err);        
            customer.locations.push(location); 
            //save the customer profile
            customer.save(function(err,saved){
              if(err){
                return next(err);
              }else if(saved){
                res.status(202).json({success:true});
              }
            });
        });    
      }
  });
  workflow.emit('init');      
};
    /**
     * [put description]
     * @param  {[type]}   req  [description]
     * @param  {[type]}   res  [description]
     * @param  {Function} next [description]
     * @return {[type]}        [description]
     */
    exports.updateUserProfile = function(req,res,next){
        var sender = req.user;
        var update = req.body.user;
        var workflow = req.app.utility.workflow(req, res);
        workflow.on('updateAccount', function(){
          req.app.db.models.Account.findById(req.user.roles.account, function(err,customer){
            if(err)
              return next(err);
              _.merge(customer, update.account);
              customer.save(function(err, saved) {
                if (err) {
                  next(err);
                } else {
                  workflow.outcome.account = saved;
                  workflow.emit("updateUser");
                }
              });
          });      
        });
        workflow.on('updateUser',function(){
          req.app.db.models.User.findById(req.user.id,function(err,user){
          if(err)
            return next(err);
            _.merge(user, update.user);
            user.save(function(err, saved) {
              if (err) {
                next(err);
              } else {
                workflow.outcome.user = user;
                return workflow.emit('response');
              }
            });
        }); 
      });
      workflow.emit("updateAccount");  
    };

    /**
     * [updateCustomerNotification Function allowing us to update a notifiaction state (read or not)]
     * @param  {[type]}   req  [description]
     * @param  {[type]}   res  [description]
     * @param  {Function} next [description]
     * @return {[type]}        [description]
     */
    exports.updateCustomerNotification = function(req, res, next){
      var message = req.body.message;
      var query= {
        _id:new ObjectID(req.user.roles.account),
        notifications:    {
          $elemMatch:{
            _id:new ObjectID(message._id)
          } 
        }
      };

      req.app.db.models.Account.update(query,{
        $set:{
          "notifications.$.read":true
        }
      },
        {
          multi:false
        },function(err,saved){
          if(err){
            return next(err);
          }else if (saved){
            res.status(202).json({success:true});
          }
        }
      );
    };


    /**
     * [updateAppointmentSchema Populate user appointment schema]
     * @param  {[type]}   req  [description]
     * @param  {[type]}   res  [description]
     * @param  {Function} next [description]
     * @return {[type]}        [description]
     */
    exports.updateAppointmentSchema = function (req, res, next){
          console.log(req.body);
          req.app.db.models.Account.findById(req.user.roles.account, function(err,customer){
            if(err)
              return next(err);
            customer.nextAppointment.push({
              _id:req.body.id,
              haidresserId:req.body.hairdresserId,
              selectedHour: req.body.selectedHour,
              hairdresserUsername: req.body.hairdresserUsername,
              dayOfWeek:req.body.dayOfWeek,
              createdAt:Date.now(),
              location:req.body.locationIndex
            });
              customer.save(function(err,saved){
              if(err){
                return next(err)
              }else{
                res.json({success:true});
              }
            });
          });   
    };
    //HERE CUSTOMER
    exports.updateAppointmentState=function (req, res, next){
      var workflow = req.app.utility.workflow(req, res);
      workflow.on('init', function(){
        req.app.db.models.User.findById(req.body.userId, function(err, user){
          if(err)
            return next(err);
            workflow.outcome.customerId = user.roles.account;
            return workflow.emit('patchAppointment');
            //res.json({success:true});
        });
      });
      workflow.on('patchAppointment', function(){
          var query = {
                    _id : new ObjectID(workflow.outcome.customerId), 
                    nextAppointment : {
                        $elemMatch : {
                            _id : new ObjectID(req.body.appointmentId)
                        }
                    }
                };
        req.app.db.models.Account.update(query, {
                    $set : {
                        "nextAppointment.$.appointmentState" : 0,//pending (confirmed by the hairdresser and displayed in the custommer booking list)
                        "nextAppointment.$.updateAt":Date.now()
                        }
                }, {
                    multi : false
                }, function(err, result){
                    if(err){
                        //res.status(500).json({error:"the appointment can't be save"});
                        next(new Error("It seems to have a problem with the appointment update process ",err));
                    }else if(result){
                        res.status(202).json({success:true});
                    }               
          });
      });
      workflow.emit('init');   
    };

    /**
     * [removeCustomerAppointmentAndNotify delete user appointment and send a notification to the user about with deletion details]
     * @param  {[type]}   req  [description]
     * @param  {[type]}   res  [description]
     * @param  {Function} next [description]
     * @return {[type]}        [description]
     */
    exports.removeCustomerAppointmentAndNotify = function(req,res, next){
      console.log("inside the removeCustomerAppointmentAndNotify's function");
      var appointmentId = req.query.appointmentId, 
          userId = req.query.customerId,
          workflow=req.app.utility.workflow(req,res);
        //Find the according user account on init
        workflow.on('init', function(){
          req.app.db.models.User.findById(userId, function(err,user){
              if(err)
                return next(err);
              //savind the user Id
              workflow.outcome.customerId = user.roles.account;
              return workflow.emit('denied');
          })
        });
        workflow.on('denied', function(){
          var customerId = workflow.outcome.customerId;
          req.app.db.models.Account.findById(customerId,function(err, user){
            if(err){
              return next(err);
            }else if(user){
              var currentAppointment=user.nextAppointment.id(appointmentId);
              if(user.nextAppointment.id(appointmentId) !== undefined){                
                var notification = 'Votre rendez-vous du '+(currentAppointment.dayOfWeek).toLocaleDateString()+' à '+currentAppointment.selectedHour+' a été refusé par '+currentAppointment.hairdresserUsername+'. Nous vons prions de prendre un autre rendez-vous. Merci pour votre compréhension.';
                user.notifications.push({message:notification});
                user.nextAppointment.id(appointmentId).remove();
                user.save(function(err,saved){
                  if(err){
                    return next(err);
                  }else{
                    res.status(202).json({success:true});
                  }
                });
              }
            }
          });
        });
        workflow.emit('init');
    };
    /**
     * [removeCustomerAppointmentWithReason function allowing to remove a cionfirmed user appointment with reasons]
     * @param  {[type]}   req  [description]
     * @param  {[type]}   res  [description]
     * @param  {Function} next [description]
     * @return {[type]}        [description]
     */
    exports.removeCustomerAppointmentWithReason = function(req,res, next){
      var appointmentId = req.query.appointmentId, 
          userId = req.query.customerId,
          hairdresserReason = req.query.reason,
          workflow= req.app.utility.workflow(req,res);
      //Find the according user account on init
      workflow.on('init', function(){
        req.app.db.models.User.findById(userId, function(err,user){
            if(err)
              return next(err);
            //savind the user Id
            workflow.outcome.customerId = user.roles.account;
            return workflow.emit('delete');
        })
      });
      workflow.on('delete', function(){
          var customerId = workflow.outcome.customerId;
          req.app.db.models.Account.findById(customerId,function(err, user){
            if(err){
              return next(err);
            }else if(user){
              if(user.nextAppointment.id(appointmentId) !== undefined){
                user.notifications.push({message:hairdresserReason});
                user.nextAppointment.id(appointmentId).remove();

                user.save(function(err,saved){
                  if(err){
                    return next(err);
                  }else{
                    res.status(202).json({success:true});
                  }
                });
              }
            }
          });
    });
    workflow.emit('init');
      
    };

    /**
     * [Function used to check if the username entered by the user willing to register is available]
     * @param  {[type]}   req  [req object]
     * @param  {[type]}   res  [res object]
     * @param  {Function} next [middleware error handler]
     * @return {Boolean}       [description]
     */
    exports.isAvailable = function (req, res, next){
        //var username = req.body.username;
        var isAvailable=true;
        req.app.db.models.Account.findOne({username:req.body.username},function(err, user){
            if (err){
              return next(err);
            }else if(user){
                
                res.json({isAvailable:!isAvailable})
            }else{
                res.json({isAvailable:isAvailable})
            }        

        });
    };
    /**
     * Retrieve all the hairdressers
     * @param  {[type]}   req  [description]
     * @param  {[type]}   res  [description]
     * @param  {Function} next [description]
     * @return {[type]}        [description]
     */

    exports.getAllHairdressers = function(req,res, next){
      var alreadyDisplayed = parseInt(req.query.alreadyDisplayed);
      var numberOfHairdresserPerQuery = 6;
      var query = req.app.db.models.Account.find({role:1});
      req.app.db.models.Account.count({role:1}, function(err, value){
          if(err){
            return next(err);
          }else if(value){
            if(alreadyDisplayed == 0){
                query.limit(numberOfHairdresserPerQuery)
            }else if(alreadyDisplayed<=value){
              query.skip(alreadyDisplayed);
              query.limit(numberOfHairdresserPerQuery);
            }
            query.exec(function(err,hairdressers){
                if(err){
                  return next(err);
                  }else if(hairdressers){
                    res.json(hairdressers.map(function(hairdresser){
                        return hairdresser.toJson();
                    }));
                  }
              });
            }
        });
      
    };

    exports.getUserById = function (req,res,next){
      req.app.db.models.Account.findById({_id: req.body.id}, function(err, user){
          if(err){
              return next(new Error("An ouccus when trying to get the user by it's Id from getUserById (err) =>", err));
          }else{
            res.status(202).json(user.toJson());
          }
      });
    };


    /**
     * [updateAppointmentState Function allowing to update a customer appointment state]
     * @param  {[type]}   req  [description]
     * @param  {[type]}   res  [description]
     * @param  {Function} next [description]
     * @return {[type]}        [description]
     */
    exports.customerUpdateAppointmentState = function(req,res, next){
      var customer = req.user;
      var query = {
        _id:new ObjectID(customer._id),
        nextAppointment:{
          $elemMatch:{
            _id:new ObjectID(req.body.id)//appointment id
          }
        }
      };

      req.app.db.models.Account.update(query,{
        $set:{
          "nextAppointment.$.appointmentState":req.body.state
        }
      },{
        multi:false
      }, function(err, saved){
          if(err){
            return next(err);
          }else if(saved){
            res.status(202).json({success:true});
          }
      });
    };

    /**
     * [updateAppointmentStateWithReason Function used to set an appointment state with reason]
     * @param  {[type]}   res  [description]
     * @param  {[type]}   req  [description]
     * @param  {Function} next [description]
     * @return {[type]}        [description]
     */
    exports.updateAppointmentStateWithReason = function(req, res, next){
      var hairdresser = req.user;
      async.waterfall([
        function(callback){
            req.app.db.models.User.findById(req.body.customerId, function(err, user){
                if(err)
                  return next(err);
                  callback(null,user);
            })
        },
        function(user,callback){
          req.app.db.models.Account.findById({_id:user.roles.account}, function(err, customer){
            if(err){
              return next(err);
            }else if(customer){
              customer.notifications.push({message:req.body.reason});
              customer.save(function(err, savedCustomer){
                  if(err){
                    return next(new Error( "save customer message on appointment deletion " + err));
                  }else if(savedCustomer){
                    callback(null,savedCustomer);
                  }
              })
              
            }
          })
        }, function(customer,callback){
            if(customer){
              var query = {
                _id:new ObjectID(customer._id),
                nextAppointment:{
                  $elemMatch:{
                    _id: new ObjectID(req.body.id)//appointment id
                  }
                }
              };
              req.app.db.models.Account.update(query, {
                $set:{
                  "nextAppointment.$.appointmentState":req.body.state //-2 --> canceled by the hairdresser
                }
              },{
                multi:false
              }, function(err,saved){
                  if(err){
                    return next(err);
                  }else if(saved){
                    callback(null,saved);
                  }
              });
            }
        },
        function(saved){
          res.status(202).json({success:true});
        }
      ]);

    };

    /**
     * [removeUserLocation function allowing to delete a user location]
     * @param  {[type]}   req  [description]
     * @param  {[type]}   res  [description]
     * @param  {Function} next [description]
     * @return {[type]}        [description]
     */
    exports.removeUserLocation = function(req, res, next){    
        var customerId = req.user.roles.account;
        req.app.db.models.Account.findById(customerId, function(err, account){
          if(err)
            return next(err);
          account.locations.remove(req.query.id);
          account.save(function(err, saved){
            if(err){
              return next(err);
            }else if(saved){
              res.sendStatus(202);
            }
          });
        });
    };