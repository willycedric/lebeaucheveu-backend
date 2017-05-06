'use strict';
var helper = require('sendgrid').mail;
exports = module.exports = function(req, res, options) {
  /* options = {
    from: String,
    to: String,
    cc: String,
    bcc: String,
    text: String,
    textPath String,
    html: String,
    htmlPath: String,
    attachments: [String],
    success: Function,
    error: Function
  } */

  var renderText = function(callback) {
    res.render(options.textPath, options.locals, function(err, text) {
      if (err) {
        callback(err, null);
      }
      else {
        options.text = text;
        return callback(null, 'done');
      }
    });
  };

  var renderHtml = function(callback) {
    res.render(options.htmlPath, options.locals, function(err, html) {
      if (err) {
        callback(err, null);
      }
      else {
        options.html = html;
        return callback(null, 'done');
      }
    });
  };

  var renderers = [];
  if (options.textPath) {
    renderers.push(renderText);
  }

  if (options.htmlPath) {
    renderers.push(renderHtml);
  }

  require('async').parallel(
    renderers,
    function(err, results){
      if (err) {
        options.error('Email template render failed. '+ err);
        return;
      }

      var attachments = [];

      if (options.html) {
        attachments.push({ data: options.html, alternative: true });
      }

      if (options.attachments) {
        for (var i = 0 ; i < options.attachments.length ; i++) {
          attachments.push(options.attachments[i]);
        }
      }

      // var emailjs = require('emailjs/email');
      // var emailer = emailjs.server.connect( req.app.config.smtp.credentials );
      // emailer.send({
      //   from: options.from,
      //   to: options.to,
      //   'reply-to': options.replyTo || options.from,
      //   cc: options.cc,
      //   bcc: options.bcc,
      //   subject: options.subject,
      //   text: options.text,
      //   attachment: attachments
      // }, function(err, message) {
      //   if (err) {
      //     options.error('Email failed to send. '+ err);
      //     return;
      //   }
      //   else {
      //     options.success(message);
      //     return;
      //   }
      // });
      var from_email = new helper.Email('lebeaucheveu@market.com');
        var to_email = new helper.Email(options.to);
        var subject=options.subject;
        var content =new helper.Content('text/plain',options.text);
        var mail = new helper.Mail(from_email,subject,to_email,content);
        var sg = require('sendgrid')(req.app.config.sendgrid.key);
        var request = sg.emptyRequest({
          method:'POST',
          path:'/v3/mail/send',
          body:mail.toJSON(),
          'Content-Length':Buffer.byteLength(mail)
        });

        sg.API(request,function(err,response){      
          // console.log("statusCode ",response.statusCode);
          // console.log("body ",response.body);
          // console.log("headers ",response.headers);   
          if(err){
            options.error(err);
            return
          }else{
            options.success();
            return;
          }
         
        });
      }
  );
};
