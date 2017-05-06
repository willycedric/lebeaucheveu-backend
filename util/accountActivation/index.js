
async = require('async'),
crypto = require('crypto'),
helper = require('sendgrid').mail;

/**
 * 
 * @param  {[type]}   req  [description]
 * @param  {[type]}   res  [description]
 * @param  {Function} next [description]
 * @return {[type]}        [description]
 */
exports = module.exports = function(Model, req, res,next){
    Model.findOne({verificationToken:req.body.token, resetPasswordExpires:{$gt:Date.now()}}, function(err,user){
      if(err) return next(err);
      else if(!user){
          res.json({error:'Account activation token is invalid or has expired.'});
      }else{
        if(user.accountstatus === 0){
          user.accountstatus =1; //set the user account to active and save the user 
          user.save(function(err,saved){
            if(err){
              return next(err);
            }else if(saved){
              res.status(202).json({success:true});
            }
          });
        }else{
          res.status(202).json({success:true});
        }        
      }
    });
};