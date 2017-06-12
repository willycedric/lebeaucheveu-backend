'use strict';
// public api
var sanitize = require('sanitize-html');
var haircutStyle = {
  find: function (req, res, next) {
    var outcome = {};
    var getResults = function (callback) {
      req.query.search = req.query.search ? req.query.search : '';
      req.query.status = req.query.status ? req.query.status : '';
      req.query.limit = req.query.limit ? parseInt(req.query.limit, null) : 20;
      req.query.page = req.query.page ? parseInt(req.query.page, null) : 1;
      req.query.sort = req.query.sort ? req.query.sort : '_id';

      var filters = {};
      if (req.query.search) {
        filters.search = new RegExp('^.*?' + req.query.search + '.*$', 'i');
      }

      if (req.query.status) {
        filters['status.id'] = req.query.status;
      }

      req.app.db.models.HaircutStyle.pagedFind({
        filters: filters,
        keys: 'name state userCreated createdAt',
        limit: req.query.limit,
        page: req.query.page,
        sort: req.query.sort
      }, function (err, results) {
        if (err) {
          return callback(err, null);
        }       
        
        outcome.results = results;
        return callback(null, 'done');
      });
    };

    var asyncFinally = function (err, results) {
      if (err) {
        return next(err);
      }      
      res.status(200).json(outcome);
    };

    require('async').parallel([getResults], asyncFinally);
  },

  create: function(req, res, next){
    var workflow = req.app.utility.workflow(req, res);
    console.log(JSON.stringify({name:req.body.name, state:req.body.state}, null, 7));
    workflow.on('createHaircutStyle', function() {       
            var fieldsToSet = {
                name:req.body.name,       
                state:req.body.state,      
                userCreated: {
                id: req.user._id,
                name: req.user.username,
                time: new Date().toISOString()
                }
            };
            req.app.db.models.HaircutStyle.create(fieldsToSet, function(err, entry) {
                if (err) {
                    return workflow.emit('exception', err);
                }
                console.log("New entry ", JSON.stringify(entry, null, 7));            
                return workflow.emit('response');
            });       
    });
    workflow.emit('createHaircutStyle');
  },

  read: function(req, res, next){
    var outcome = {};


    var getRecord = function(callback) {
      req.app.db.models.HaircutStyle.findById(req.params.id).exec(function(err, record) {
        if (err) {
          return callback(err, null);
        }

        outcome.record = record;
        return callback(null, 'done');
      });
    };

    var asyncFinally = function(err, results) {
      if (err) {
        return next(err);
      }

      res.status(200).json(outcome);
    };

    require('async').parallel([getRecord], asyncFinally);
  },

  update: function(req, res, next){
    var workflow = req.app.utility.workflow(req, res);
    workflow.on('patchGalleryEntry', function() {      
      var fieldsToSet = {
        name:req.body.name,
        state:req.body.state,
        edited_By: {
          id: req.user._id,
          name: req.user.username,
          time: new Date().toISOString()
        },
        update_At:new Date().toISOString()
      };      
      var options = { new: true };
      req.app.db.models.HaircutStyle.findByIdAndUpdate(req.params.id, fieldsToSet, options, function(err, entry) {
        if (err) {
          return workflow.emit('exception', err);
        }
        workflow.outcome.entry = entry;
        return workflow.emit('response');
      });
    });
    workflow.emit('patchGalleryEntry');
  },
  delete: function(req, res, next){
    var workflow = req.app.utility.workflow(req, res);
    workflow.on('validate', function() {
      if (!req.user.roles.admin.isMemberOf('root')) {
        workflow.outcome.errors.push('You may not delete a blog.');
        return workflow.emit('response');
      }
      workflow.emit('deleteEntry');
    });
    workflow.on('deleteEntry', function(err) {
      req.app.db.models.HaircutStyle.findByIdAndRemove(req.params.id, function(err, record) {
        if (err) {
          return workflow.emit('exception', err);
        }
        workflow.outcome.record = record;
        workflow.emit('response');
      });
    });
    workflow.emit('validate');
  }
};
module.exports = haircutStyle;