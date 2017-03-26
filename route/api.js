'use strict';
var router = require('express').Router();
// api router will mount other routers
// for all our resources


module.exports = function(passport){
	router.use('/account',require('./accountRoute')(passport));
	router.use('/hairdresser', require('./hairdresserRoute')(passport));
	return router;
};



