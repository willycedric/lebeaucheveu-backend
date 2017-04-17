'use strict';
var _ = require('lodash');
var async = require('async');
var moment = require('moment');
var ObjectID = require('mongodb').ObjectID;




/**
 * [params description]
 * @param  {[type]}   req  [description]
 * @param  {[type]}   res  [description]
 * @param  {Function} next [description]
 * @param  {[type]}   id   [description]
 * @return {[type]}        [description]
 */
exports.params = function(req,res,next,id){
  console.log('id ', id);
     req.app.db.models.Hairdresser.findById(id,function(err,hairdresser) {
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
  var hairdresser = new req.app.db.models.Hairdresser(req.hairdresser);
  //var hairdresser = req.hairdresser.toJson();
  res.json(hairdresser);
};


/**
 * [put description]
 * @param  {[type]}   req  [description]
 * @param  {[type]}   res  [description]
 * @param  {Function} next [description]
 * @return {[type]}        [description]
 */
exports.put = function(req, res, next) {
  //console.log(req.user.roles.hairdresser,req.body.user.req.user.roles.hairdresser);
  var workflow = req.app.utility.workflow(req,res);
    workflow.on('patchHairdresser', function(){ 
      var hairdresser = req.user.roles.hairdresser;      
      _.merge(hairdresser,req.body.user.hairdresser);
      hairdresser.save(function(err,saved){
          if(err)
            return next(err);
            workflow.outcome.hairdresser = saved;
              console.log('list of performance', saved.listOfPerformance);
            console.log("cover area", saved.activityArea);
            return workflow.emit('patchUser');
        });
    
    }); 
  workflow.on('patchUser', function(){
    req.app.db.models.User.findById(req.user.id, function(err, user){
      if(err)
        return next(err);        
        _.merge(user,req.body.user.user);
        user.save(function(err, saved){
          if(err)
            return next(err);
          workflow.outcome.user=saved;
          return workflow.emit('response');
        });
    });
  });
   workflow.emit("patchHairdresser");
};


exports.updatecategory = function(req,res,next){
  
  var hairdresser = req.user;
  var workflow = req.app.utility.workflow(req, res);
  workflow.on('validate', function() {
      if (!req.body.name) {
        workflow.outcome.errfor.name = 'required';
      }

      if(!req.body.state){
        workflow.outcome.errfor.state='required';
      }
      workflow.emit('patchCategory');
  });

  workflow.on('patchCategory', function(){
      var category = {};
      category.name = req.body.name;
      category.state= req.body.state;
      
      hairdresser.categories.push(category);
      hairdresser.save(function(err,hairdresser){
        if(err){
          return next(err);
        }
         workflow.outcome.hairdresser = hairdresser;
        return workflow.emit('response');
      });
  });
  workflow.emit('validate');
};
//HERE
/**
 * [updateAppointmentSchema description]
 * @param  {[type]}   req  [description]
 * @param  {[type]}   res  [description]
 * @param  {Function} next [description]
 * @return {[type]}        [description]
 */
exports.updateAppointmentSchema = function(req,res,next){
   //req.user contains customer information 
   console.log('account  -->', req.user._id);
   req.app.db.models.Hairdresser.findById(req.body.hairdresserId, function(err,hairdresser){
      if(err){
        return next(err);
      }else{
        var newAppointment = {
          slotTime:req.body.selectedHour,
          dayOfWeek:req.body.dayOfWeek,
          slotType:0, //temporally
          createdAt:Date.now(),
          relatedCustomers:{
            _id:req.user._id
          },
          location:req.body.location
        }; 
        //populate the hairdresser appointment array
        hairdresser.appointments.push(newAppointment);
        //update the hairdresser modal 
        hairdresser.save(function(err,saved){
          if(err){
            return next(err);
          }else{
            res.json(saved.appointments[saved.appointments.length-1]._id);
          }
        });
      }
   });
};

/**
 * [lockedHairdressertimeslot Allow an hairdresser to locked a date&time period]
 * @param  {[type]}   req  [description]
 * @param  {[type]}   res  [description]
 * @param  {Function} next [description]
 * @return {[type]}        [description]
 */
exports.lockedHairdressertimeslot = function(req,res,next){
  var hairdresser = req.user;
  var newDate = new Date();
  hairdresser.appointments.push({dayOfWeek:req.body.date,slotState:1,slotType:-1, createdAt:newDate});
  hairdresser.save(function(err,saved){
          if(err){
            return next(err);
          }else if(saved){
            res.status(202).json({success:true});
          }
        });
};


/**
 * [Function used to check if the hairdressername entered by the hairdresser willing to register is available]
 * @param  {[type]}   req  [req object]
 * @param  {[type]}   res  [res object]
 * @param  {Function} next [middleware error handler]
 * @return {Boolean}       [description]
 */
exports.isAvailable = function (req, res, next){
    //var hairdressername = req.body.hairdressername;
    var isAvailable=true;
    req.app.db.models.Hairdresser.findOne({username:req.body.username},function(err, hairdresser){
        if (err){
           return next(err);
         }else if(hairdresser){
         
            res.json({isAvailable:!isAvailable});
         }else{
            res.json({isAvailable:isAvailable});
         }        

    });
};

/**
 * [isUsernameAvailable description]
 * @param  {[type]}   req  [description]
 * @param  {[type]}   res  [description]
 * @param  {Function} next [description]
 * @return {Boolean}       [description]
 */
exports.isUsernameAvailable = function (req, res, next){
    //var hairdressername = req.body.hairdressername;
    var isAvailable=true;
    req.app.db.models.Hairdresser.findOne({username:req.body.username},function(err, hairdresser){
        if (err){
           return next(err);
         }else if(hairdresser){
          if(hairdresser.username === req.body.username){
             res.json({isAvailable:isAvailable});
          }else{
            res.json({isAvailable:!isAvailable});
          } 
            
         }else{
            res.json({isAvailable:isAvailable});
         }       
    });
};

/**
 * [getAWeek description]
 * @param  {[type]}   req  [description]
 * @param  {[type]}   res  [description]
 * @param  {Function} next [description]
 * @return {[type]}        [description]
 */
exports.getAWeek = function(req, res, next){
  var query = req.app.db.models.Hairdresser.find();
  query.skip(0).limit(1);
  query.exec(function(err, hairdresser){
    if(err){
      return next(err);
    }else if(hairdresser){
      res.json(hairdresser[0].customerAppointment.forEach(function(apt){
          //console.log(apt.dayOfWeek);
      }));
    }
  });
};

/**
 * [getAppointmentById Function allowing to get appointment by is Id]
 * @param  {[type]}   req  [description]
 * @param  {[type]}   res  [description]
 * @param  {Function} next [description]
 * @return {[type]}        [description]
 */
exports.getAppointmentById = function(req, res, next){
    req.app.db.models.Hairdresser.findById(req.user.roles.hairdresser, function(err, hairdresser){
        if(err)
          return next(err);
          var appointment = hairdresser.appointments.id(req.body.appointmentId);
        if(appointment){
          res.status(202).json(appointment);
        }else{
          res.status(404);
        }
    });    
};

/**
 * [hairdresserUpdateBooking description]
 * @param  {[type]}   req  [description]
 * @param  {[type]}   res  [description]
 * @param  {Function} next [description]
 * @return {[type]}        [description]
 */
exports.hairdresserUpdateBooking = function(req,res, next){
  
    var workflow = req.app.utility.workflow(req,res);
    workflow.on('init', function(){
        req.app.db.models.Hairdresser.findById(req.user.roles.hairdresser, function(err, record){
          if(err || record==null){
            return next(err);
          }                 
          workflow.outcome.hairdresser = record;
          workflow.outcome.appointmentLocation = record.appointments.id(req.body.id).location;
          return workflow.emit('patchBooking');
      });
    });

    workflow.on('patchBooking', function(){
      var hairdresser = workflow.outcome.hairdresser;
      var appointmentLocation = workflow.outcome.appointmentLocation;    
      var query = {
            _id : new ObjectID(req.user.roles.hairdresser), 
            appointments : {
                $elemMatch : {
                    _id : new ObjectID(req.body.id)
                }
            }
        };      
        hairdresser.nextbookings.push({_id:req.body.id,customerId:req.body.relatedCustomer._id,customerLastname:req.body.relatedCustomer.customerLastname, customerFirstname:req.body.relatedCustomer.customerFirstname, appointmentHour:req.body.time,
        appointmentDate:req.body.date,appointmentLocation:appointmentLocation,appointmentState:-1});
        hairdresser.save(function(err){
          if(err){
            return next(err);
          }else{
          // res.json({success:true});
          }          
        });     
      req.app.db.models.Hairdresser.update(query, {
                  $set : {
                      "appointments.$.slotState" : -1,
                      "appointments.$.updateAt":Date.now()
                      }
              }, {
                  multi : false
              }, function(err, result){
                  if(err){
                      //res.status(500).json({error:"the appointment can't be save"});
                      next(new Error("It seems to have a problem with the appointment registration process ",err));
                  }else if(result){
                      //res.status(200).json(result);
                  res.status(202).json({success:true});
                  workflow.outcome.success = true;
                    //workflow.emit("response");

                  }                
          });
    });
    workflow.emit('init');  
};
/**
 * [hairdresserDeleteAppointment remove an appointment based on it's id]
 * @param  {[type]}   req  [description]
 * @param  {[type]}   res  [description]
 * @param  {Function} next [description]
 * @return {[type]}        [description]
 */
exports.hairdresserDeleteAppointment = function(req,res,next){
  var hairdresserId = req.user.roles.hairdrsser,
  workflow= req.app.utility.workflow(req,res);
  workflow.on('init',function(){
    req.app.db.models.Hairdresser.findById(hairdresserId,function(err,hairdressr){
      if(err)
        return next(err);
      //storing the returned hairdresser account in the outcome object
      workflow.outcome.hairdresser= hairdresser;
    });
  });
  workflow.on('delete', function(){
    var hairdresser = workflow.outcome.hairdresser;  
    hairdresser.appointments.id(req.query.id).remove();
    hairdresser.save(function(err,saved){
      if(err){
        return next(err);
      }else{
        res.status(202).json({success:true});
      }
    });    
  }); 
  workflow.emit('init');
};
/**
 * [hairdresserDeleteBooking remove a booking based on it's id]
 * @param  {[type]}   req  [description]
 * @param  {[type]}   res  [description]
 * @param  {Function} next [description]
 * @return {[type]}        [description]
 */
exports.hairdresserDeleteBooking = function(req,res,next){
  var hairdresser = req.user;
  //update the appointment state to 1 --> done
  var query = {
    _id:new ObjectID(req.user.roles.hairdresser),
    appointments:{
      $elemMatch:{
        _id: new ObjectID(req.query.id)
      }
    }
  };
  req.app.db.models.Hairdresser.update(query,{
    $set:{
      "appointments.$.slotState":1
    }
  },{
    multi:false
  }, function(err,saved){
    if(err){
      return next(err);
    }
  });
  //remove the appointment of the nextbookings document
  req.app.db.models.hairdresser.findById(req.user.roles.hairdresser, function(err,hairdresser){
    if(err)
      return next(err);
      hairdresser.nextbookings.id(req.query.id).remove();
      hairdresser.save(function(err,saved){
        if(err){
          return next(err);
        }else{
          res.status(202).json({success:true});
        }
      });
  });  
};
/**
 * [findHairdressers return a list of hairdressers matching the search criteria]
 * @param  {[type]}   req  [description]
 * @param  {[type]}   res  [description]
 * @param  {Function} next [description]
 * @return {[type]}        [description]
 */
exports.findHairdressers =  function(req, res, next){
  console.log("Find hairdressers parameter ",req.body);
  if ( !String.prototype.includes ) {
  String.prototype.includes = function(search, start) {
    'use strict';
    if (typeof start !== 'number') {
      start = 0;
    } 

    if (start + search.length > this.length) {
      return false;
    } else {
      return this.indexOf(search,start) !== -1;
    }
  };
  }
  var location = req.body.location;
  var category = req.body.category;
  var haircut = req.body.haircut;
  console.log(req.body.location, req.body.category, req.body.haircut);
  var listOfAvailableCategories=['cheveux afro','cheveux lisses',"cheveux bouclés"];

  var listOfAvailableCurlyHaircuts = ["Vanilles",
                                      "Tresses (Braids)",
                                      "Crochet braids",
                                      "Tissages",
                                      "Locks ",
                                      "Coiffures sur cheveux naturels ",
                                      "Lissages (Brushing, Défrisage)",
                                      "Extensions de cheveux ",
                                      "Colorations",
                                      "Perruque / Lace wig",
                                      "Shampoing",
                                      "Nattes collées",
                                      "Cornrows",
                                      "Tresses enfants"];

  async.waterfall([
    function(callback){   //build list of hairdresser in the selected location
      //console.log('inside the first one');
        var listOfLocatedHairdressers=[];
        req.app.db.models.Hairdresser.find({}, function(err, hairdressers){
          if(err){
            return next (new Error('An error occured when tempting to find all hairdressers'));
          }else if(!hairdressers){
            console.error('no available hairdressers');
          }else{
              hairdressers.forEach(function(hairdresser){  //build the list of hairdresser in the selected area                
                  hairdresser.activityArea.forEach(function(area){
                      if(area.includes(location)){
                        listOfLocatedHairdressers.push(hairdresser);
                      }
                    });                   
              });
          
            callback(null,listOfLocatedHairdressers);
          }
        });
    
  },
  function(listOfLocatedHairdressers,callback){ //build list of hairdresser with the appropeiate category;
      var listOfLocatedAndCategorisedHairdressers=[];

      listOfLocatedHairdressers.forEach(function(hairdresser){
        hairdresser.categories.forEach(function(elt){         
          if(elt.name.toUpperCase() == listOfAvailableCategories[parseInt(category)].toUpperCase()){
            listOfLocatedAndCategorisedHairdressers.push(hairdresser);
            //console.log('here -->',hairdresser);
          }
        });
      });
      callback(null,listOfLocatedAndCategorisedHairdressers);
  },
  function(listOfLocatedAndCategorisedHairdressers,callback){ //build list of hairdressers who are able to perform the haircut selected
    var listOfSelectedHairdressers=[];
    listOfLocatedAndCategorisedHairdressers.forEach(function(hairdresser){      
      if(hairdresser.listOfPerformance.indexOf(listOfAvailableCurlyHaircuts[parseInt(haircut)])!=-1){
        listOfSelectedHairdressers.push(hairdresser);        
      }
    });
    callback(null,listOfSelectedHairdressers);
  },
  function(listOfSelectedHairdressers){
      res.json(listOfSelectedHairdressers.map(function(hairdresser){
        console.log(hairdresser.name);
        return hairdresser;
      }))
    }
  ]);  
}

/**
 * [updateAppointmentStateWithReason Function used to set an appointment state with reason]
 * @param  {[type]}   res  [description]
 * @param  {[type]}   req  [description]
 * @param  {Function} next [description]
 * @return {[type]}        [description]
 */
exports.updateAppointmentStateWithReason = function(req, res, next){
  var customer = req.user;
  async.waterfall([
    function(callback){
      req.app.db.models.Hairdresser.findById({_id:req.body.hairdresserId}, function(err, hairdresser){
        if(err){
          return next(err);
        }else if(hairdresser){
          hairdresser.notifications.push({message:req.body.reason});
          hairdresser.save(function(err, savedHairdresser){
              if(err){
                return next(new Error( "save hairdresser message on appointment deletion " + err));
              }else if(savedHairdresser){
                 callback(null,savedHairdresser);
              }
          });
         
        }
      })
    }, function(hairdresser,callback){
        if(hairdresser){
          var query = {
            _id: new ObjectID(req.user.roles.hairdresser),
            nextbookings:{
              $elemMatch:{
                _id:new ObjectID(req.body.id) //appointment id
              }
            }
          };
          req.app.db.models.Hairdresser.update(query, {
            $set:{
              "nextbookings.$.appointmentState":req.body.state
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
 * [updateAppointmentState function allowing to update an appointment state]
 * @param  {[type]}   req  [description]
 * @param  {[type]}   res  [description]
 * @param  {Function} next [description]
 * @return {[type]}        [description]
 */
exports.updateAppointmentState = function(req,res,next){
  var hairdresser= req.user;
  var query = {
            _id:req.user.roles.hairdresser,
            nextbookings:{
              $elemMatch:{
                _id:req.body.id //appointment id
              }
            },
            appointments:{
              $elemMatch:{
                 _id:req.body.id //appointment id
              }
            }
          };
          req.app.db.models.Hairdresser.update(query, {
            $set:{
              "nextbookings.$.appointmentState":req.body.state,
              "appointments.$.slotState":req.body.state
            }
          },{
            multi:false
          }, function(err,saved){
              if(err){
                return next(err);
              }else if(saved){
                res.status(202).json({success:true});
              }
          });
};
exports.findHaircutCatalog = function(req, res,next){
    var hairdresser =req.user.roles.hairdresser; 
    req.app.db.models.Hairdresser.findById(req.user.roles.hairdresser,function(err, hairdresser){
        if(err)
          return next(err);
        res.status(200).json(hairdresser.categories.id(req.params.id)); 
    });     
};