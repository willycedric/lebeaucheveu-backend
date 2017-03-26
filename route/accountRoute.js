'use strict';
var logger = require('../util/logger/index');
var controller = require('./../controller/account');
var router = require('express').Router();

// setup boilerplate route just to satisfy a request
// for building

module.exports = function(passport){
	router.param('id',controller.params);	
	/*router.get("/auth/facebook/callback",passport.authenticate("facebook",{successRedirect:'/api/users/login',
failureRedirect:'/api/users/failure'}));*/	
	router.put('/hairdresserAppointment',passport.authenticate('user-jwt'),controller.updateAppointmentSchema);
	router.put('/updatecustomerpreference',passport.authenticate('user-jwt'), controller.updateCustomerPreference);
	router.get('/allthem',controller.get);
	router.put('/me', passport.authenticate('user-jwt'), controller.updateUserProfile);
	router.put('/updatecustomernotification',passport.authenticate('user-jwt'), controller.updateCustomerNotification);
	router.put('/hairdresserAppointmentUpdate',passport.authenticate('hairdresser-jwt'),controller.updateAppointmentState);
	router.put('/updateappointmentstate',passport.authenticate('user-jwt'),controller.customerUpdateAppointmentState);
	router.put('/updateappointmentstatewithreason',passport.authenticate('hairdresser-jwt'),controller.updateAppointmentStateWithReason);
	router.delete('/removeCustomerAppointmentAndNotify',passport.authenticate('hairdresser-jwt'),controller.removeCustomerAppointmentAndNotify);
	router.delete('/removeappointmentwithreason',passport.authenticate('hairdresser-jwt'),controller.removeCustomerAppointmentWithReason);
	router.delete('/deleteuserlocation',passport.authenticate('user-jwt'),controller.removeUserLocation);	
	router.post('/getUserById', passport.authenticate('hairdresser-jwt'), controller.getUserById);
	//router.post('/activate',controller.activateUserAccount);		
	router.post('/isAvailable',controller.isAvailable);
	/*router.route('/:id',passport.authenticate('user-jwt'))
		.get(controller.getOne)
		.put(controller.put)
		.delete(controller.delete);*/
	return  router;
};