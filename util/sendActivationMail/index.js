
var async = require('async'),
helper = require('sendgrid').mail;

/**
 * [forgot description]
 * @param  {[type]}   req  [description]
 * @param  {[type]}   res  [description]
 * @param  {Function} next [description]
 * @return {[type]}        [description]
 */
exports = module.exports = function(req,res,options,next){  
  async.waterfall([
      function(token, user, done){
        var from_email = new helper.Email('lebeaucheveu@market.com');
        var to_email = new helper.Email(options.email);
        var subject="Vérification de votre adresse mail";
        var content =new helper.Content('text/plain','Vous recevez cet email parce que vous venez de créer un nouveau compte sur '+req.app.config.projectName+' \n\n' +
          'Veuillez cliquer sur le lien ci-dessous pour activer votre compte:\n\n' +
           req.headers.origin + '/#/accountactivation/'+(!!(req.user.roles && req.user.roles.account))?'account':'hairdresser'+'/' + options.verificationToken + '\n\n' +
          'Si vous n\'êtes pas à l\'origine de cet émail, merci de l\'ignorer. \n');
        var mail = new helper.Mail(from_email,subject,to_email,content);
        var sg = require('sendgrid')(req.app.config.sendgrid.key);
        var request = sg.emptyRequest({
          method:'POST',
          path:'/v3/mail/send',
          body:mail.toJSON(),
          'Content-Length':Buffer.byteLength(mail)
        });

        sg.API(request,function(err,response){         
          if(err) options.onError(err);
          done(err,null);
          options.onSuccess();
        });
      }
    ], function(err){
        if(err) {
            return next(err);     
        }  
    });  
};