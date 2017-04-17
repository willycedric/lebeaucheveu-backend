var NodeGeocoder = require('node-geocoder');
 var options={
   provider:'google',
   // Optional depending on the providers
  httpAdapter: 'https', // Default
  apiKey: require('./../../config').oauth.google.key, // for Mapquest, OpenCage, Google Premier
  formatter: null         // 'gpx', 'string', ...
 };
 var geocoder = NodeGeocoder(options);
 exports = module.exports = function(){
     return geocoder;
 };