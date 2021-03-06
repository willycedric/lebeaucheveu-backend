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
  console.log("Update haidresser description");
  var workflow = req.app.utility.workflow(req,res);
    workflow.on('patchHairdresser', function(){ 
      var hairdresser = req.user.roles.hairdresser;  
      console.log("hairdresser",hairdresser);
      _.merge(hairdresser,req.body.user.hairdresser);
      hairdresser.save(function(err,saved){
          if(err)
            return next(err);
            workflow.outcome.hairdresser = saved;            
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

/**
 * Update hairdresser description
 */
exports.updateDescription = function(req,res,next){   
  req.app.db.models.Hairdresser.findById(req.user.roles.hairdresser, function(err,hairdresser){
      if(err)
        return next(err);
      if(req.body.description == ""|| req.body.description == undefined){
        //Do nothing
      }else{
        hairdresser.description = req.body.description;
      }        
      hairdresser.save(function(err, saved){
        if(err)
          return next(err);
          res.status(202).send();
      });
  });
};

exports.updateArea = function(req,res,next){   
  req.app.db.models.Hairdresser.findById(req.user.roles.hairdresser, function(err,hairdresser){
      if(err)
        return next(err);
      if(req.body.description == ""|| req.body.description == undefined){
        //Do nothing
      }else if(hairdresser.activityArea.indexOf(req.body.description)==-1){
        hairdresser.activityArea.push(req.body.description);
      }        
      hairdresser.save(function(err, saved){
        if(err)
          return next(err);
          res.status(202).send();
      });
  });
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
   req.app.db.models.Hairdresser.findById(req.body.hairdresserId, function(err,hairdresser){
      if(err){
        return next(err);
      }else{
        var newAppointment = {
          slotTime:req.body.selectedHour,
          dayOfWeek:req.body.dayOfWeek,
          slotType:0, //temporally
          createdAt:Date.now(),
          relatedCustomers:req.user.username,          
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
  req.app.db.models.Hairdresser.findById(req.user.roles.hairdresser, function(err, hairdresser){
    if(err)
      return next(err);
      hairdresser.appointments.push({dayOfWeek:req.body.date,slotState:1,slotType:-1, createdAt:newDate});
      hairdresser.save(function(err,saved){
              if(err){
                return next(err);
              }else if(saved){
                res.status(202).json({success:true});
              }
            });
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
  var hairdresserId = req.user.roles.hairdresser,
  workflow= req.app.utility.workflow(req,res);
  workflow.on('init',function(){
    req.app.db.models.Hairdresser.findById(hairdresserId,function(err,hairdresser){
      if(err)
        return next(err);
      //storing the returned hairdresser account in the outcome object
      workflow.outcome.hairdresser= hairdresser;
      return workflow.emit('delete');
    });
  });
  workflow.on('delete', function(){
    var hairdresser = workflow.outcome.hairdresser;  
    try{
      hairdresser.appointments.id(req.query.id).remove();
    }catch(err){
      return next(err);
    }    
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
 exports.findHairdressers  = function(req, res, next){
    //get the workflow utility
    var workflow = req.app.utility.workflow(req,res);
    //grab all the query parameters from the body
    var category = req.body.category,
    haircut = req.body.haircut,
    location = [req.body.longitude, req.body.latitude],
    location = req.body.location;
    var distanceMax =25;
    //get list of availables haircuts and haircuts categories
    var listOfAvailableCategories=['Cheveux Afro','Cheveux Lisses',"Cheveux Bouclés"];
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

   // console.log("body ",req.body);
    //init query paramerters
    workflow.on('init', function(){
         var temp = [];
         //query google api for longitude and latitude in case they are not provided by the front end query
         if(req.body.latitude == null || req.body.longitude == null){
          // console.log("in Here", req.body.location);
           req.app.utility.geocoder().geocode(req.body.location)
           .then(function(rep){
             // console.log("Google geocoder ", rep[0].latitude, rep[0].longitude);
              //open a generic mongoose query
              workflow.outcome.query = req.app.db.models.Hairdresser.find({});
              workflow.outcome.distance =5; //initial search perimeter in KM.
              workflow.outcome.temp=  [];
              workflow.outcome.resultNumbers={};//object containg the number of result by perimeter
              workflow.outcome.resultsByDistance = {
                five:[],
                ten:[],
                fifteen:[],
                twenty:[]
              };//store all the results based on the user selected perimeter
              workflow.outcome.longitude = rep[0].longitude;
              workflow.outcome.latitude= rep[0].latitude;
              workflow.outcome.temp.push(listOfAvailableCurlyHaircuts[haircut]);
              //set the default distance of 10KM
              return workflow.emit('query');
           });
         }else{
            //open a generic mongoose query
            workflow.outcome.query = req.app.db.models.Hairdresser.find({});
            workflow.outcome.distance =5; 
            workflow.outcome.temp=  [];
            workflow.outcome.temp.push(listOfAvailableCurlyHaircuts[haircut].toLocaleUpperCase());
             workflow.outcome.resultsByDistance = {
                five:[],
                ten:[],
                fifteen:[],
                twenty:[]
              };//store all the results based on the user selected perimeter
              workflow.outcome.resultNumbers={};//array containg the number of result by perimeter
            //set the default distance of 10KM
          return workflow.emit('query');
         }        
    });
    //compose the query
    workflow.on('query', function(){
       //query where the desired haircut's category match the one specified in the query
       // console.log("selected category ", listOfAvailableCategories[category]);
        workflow.outcome.query = workflow.outcome.query.where('categories.name').equals(listOfAvailableCategories[category].toUpperCase()); //TODO uppercase the category name
        //query where the  hairdressers who can performed the desired haircuts
        workflow.outcome.query = workflow.outcome.query.where('listOfPerformance.name').in(workflow.outcome.temp);
        // Using MongoDB's geospatial querying features. (Note how coordinates are set [long, lat]
        workflow.outcome.query = workflow.outcome.query.where('activityArea.location').near({center:{type:'Point', coordinates:[req.body.longitude==null?workflow.outcome.longitude:req.body.longitude, req.body.latitude==null?workflow.outcome.latitude:req.body.latitude]},
            //distance in meters
            maxDistance:workflow.outcome.distance*1000,spherical:true});
            return workflow.emit('exec');
      });
    //relaunch the query after increasing by 5KM until 20KM
    workflow.on('increase', function(){
        workflow.outcome.distance+=5;
      //  console.log("after distance increase", workflow.outcome.distance);
        if( workflow.outcome.distance >=distanceMax){
            return workflow.emit('exec');
        }else{
          console.log(workflow.outcome.distance);
          return workflow.emit('query');
        }
    });
    //return the matching hairdressers
    workflow.on('exec', function(){      
      workflow.outcome.query.exec(function(err, hairdressers){
      if(err)
        return next(err);
      if( workflow.outcome.distance <=distanceMax){
          if(workflow.outcome.distance == 5){
            workflow.outcome.resultsByDistance.five = hairdressers;
            workflow.outcome.resultNumbers.five=hairdressers.length;
          } 
          if(workflow.outcome.distance == 10){
            workflow.outcome.resultsByDistance.ten = hairdressers;
            workflow.outcome.resultNumbers.ten=hairdressers.length;
          }
          if(workflow.outcome.distance == 15){
            workflow.outcome.resultsByDistance.fifteen = hairdressers;
            workflow.outcome.resultNumbers.fifteen=hairdressers.length;
          }
          if(workflow.outcome.distance == 20){
            workflow.outcome.resultsByDistance.twenty = hairdressers;
            workflow.outcome.resultNumbers.twenty=hairdressers.length;
          }          
          hairdressers=[];//delete all the result for that perimeters.    
          return workflow.emit('increase');
      }else{
        workflow.emit('parseResult', workflow.outcome.resultsByDistance);
      }    
    });
  });

  workflow.on('parseResult',function(hairdressers){
    var structuredResults = [];
    for(var key in hairdressers){
      if(hairdressers[key].length >=1){
            hairdressers[key].forEach(function(hairdresser, index){
            var data={};  
            data.perimeter =key;
            data.profile_picture = hairdresser.profile_picture;
            data._id = hairdresser._id;
            data.appointments = hairdresser.appointments;
            data.customer_type = hairdresser.customer_type;
            data.username = hairdresser.user.name||"default";
            data.rating = hairdresser.rating;
            hairdresser.activityArea.forEach(function(area){
              var distance = req.app.utility.distance(req.body.longitude, req.body.latitude,area.longitude,area.latitude,'K');           
            if(distance<=req.app.utility.boundary(key)){
              data.location = area.formatted_address;
            }                   
          });
          var idList = structuredResults.map(function(data){
            return data.username;
          });
          if(idList.indexOf(data.username)<0){
            structuredResults.push(data);
          }
          
        });
      }
      
    } 
    
     res.json({structuredResults:structuredResults,resultNumbers:workflow.outcome.resultNumbers});  
  });
  workflow.emit('init');
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
/**
 * Populate the hairdresser's activityArea subdocument
 */
exports.populateCoverArea = function(req,res,next){
  var hairdresserId= req.user.roles.hairdresser;
  var workflow = req.app.utility.workflow(req,res);
  workflow.on('validate', function(){
     req.app.db.models.Hairdresser.findById(hairdresserId,function(err,hairdresser){
        if(err)
          return next(err);
          if(hairdresser.activityArea.length == 0){
            workflow.outcome.hairdresser = hairdresser;
            return workflow.emit('patchArea');
          }else{
            hairdresser.activityArea.forEach(function(area){
              if(area.hasOwnProperty("formatted_address")){
                if(area.formatted_address.toUpperCase() == req.body.description.formatted_address.toUpperCase()){
                  return res.status(202).json({success:true});
                }
              }              
            });
          }
          workflow.outcome.hairdresser = hairdresser;
          return workflow.emit('patchArea');       
      });
  });
  workflow.on('patchArea',function(){
    var hairdresser = workflow.outcome.hairdresser;
    hairdresser.activityArea.push(req.body.area);
    hairdresser.save(function(err,saved){
      if(err)
        return next(err);
      res.status(202).json({success:true});
    })
  });
  workflow.emit('validate'); 
};

exports.deleteArea = function(req, res, next){
  var hairdresserId= req.user.roles.hairdresser;
  req.app.db.models.Hairdresser.findById(hairdresserId, function(err,hairdresser){
      if(err)
        return next(err);
      try{
         hairdresser.activityArea.id(req.query.id).remove();
      }
      catch(err){
        return next(err);
      }finally{
         
      }
      hairdresser.save(function(err, saved){
        if(err)
          return next(err);
        res.status(202).json({success:true});
      });
  });
};