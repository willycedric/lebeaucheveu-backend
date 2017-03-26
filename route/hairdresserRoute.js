'use strict';
var router = require('express').Router();
var logger = require('../util/logger/index');
var controller = require('../controller/hairdresser');

module.exports = function(passport){
	router.param('id', controller.params);	
	router.post('/hairdresserAppointmentId', passport.authenticate('hairdresser-jwt'), controller.getAppointmentById);
	router.put('/hairdresserupdatebooking', passport.authenticate('hairdresser-jwt'), controller.hairdresserUpdateBooking)
	router.put('/updateappointmentstatewithreason', passport.authenticate('user-jwt'), controller.updateAppointmentStateWithReason)
	router.put('/updateappointmentstate', passport.authenticate('hairdresser-jwt'), controller.updateAppointmentState)	
	router.post('/findHairdressers', controller.findHairdressers);	
	router.get('/test', controller.getAWeek);
	router.post('/isAvailable',controller.isAvailable);	
	router.post('/isUsernameAvailable',controller.isUsernameAvailable);
    router.put('/hairdresserAppointment',passport.authenticate('user-jwt'),controller.updateAppointmentSchema);
    router.put('/lockedHairdressertimeslot',passport.authenticate('hairdresser-jwt'),controller.lockedHairdressertimeslot);
    router.delete('/hairdresserupdatebooking', passport.authenticate('hairdresser-jwt'), controller.hairdresserDeleteAppointment);
    router.delete('/hairdresserbooking', passport.authenticate('hairdresser-jwt'), controller.hairdresserDeleteBooking);
	router.route('/:id',passport.authenticate('hairdresser-jwt'))
		.get(controller.getOne)
		.put(controller.put);
		//.delete(controller.delete);
	return router;
};