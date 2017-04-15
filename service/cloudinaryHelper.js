//cloudinaryHelper.js
var cloudinary = require('cloudinary');
var config = require('../config');

cloudinary.config(config.cloudinary);

module.exports.upload = function(imgPath, callback){
  cloudinary.uploader.upload(imgPath, function(result) {
    //console.log('Cloudinary photo uploaded result:');
    //console.log(result);
    if(result){
      callback(null, result);
    }
    else {
      callback('Error uploading to cloudinary');
    }
  });
};
