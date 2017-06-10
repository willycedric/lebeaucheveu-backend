'use strict';
// public api
var sanitize = require('sanitize-html');
var homeGallery = {
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

      req.app.db.models.GalleryEntries.pagedFind({
        filters: filters,
        keys: 'url state',
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
    workflow.receivedContent = [];
    // workflow.on('validate', function() {
      
    //   if (!req.body['title']) {
    //     workflow.outcome.errors.push('Please enter a title.');
    //     return workflow.emit('response');
    //   }

    //   if(!req.body['content']){
    //     workflow.outcome.errors.push('Please enter a content');
    //     return workflow.emit('response');
    //   }

    //   if(!req.body['category'] || req.body['category'].id==0){
    //     workflow.outcome.errors.push('Please chose a category');
    //     return workflow.emit('response');
    //   }
    //   if(!req.body['description']){
    //     workflow.outcome.errors.push('Please enter a description');
    //     return workflow.emit('response');
    //   }


    //   workflow.emit('createBlog');
    // });

    workflow.on('createBlog', function() {    
      req.body.map(function(url){
            var fieldsToSet = {
                url:url,       
                state:true,      
                userCreated: {
                id: req.user._id,
                name: req.user.username,
                time: new Date().toISOString()
                }
            };
            req.app.db.models.GalleryEntries.create(fieldsToSet, function(err, entry) {
                if (err) {
                return workflow.emit('exception', err);
                }
            workflow.receivedContent.push(entry);                
            });
        });
        return workflow.emit('response');
        
    });
    workflow.emit('createBlog');
  },

  read: function(req, res, next){
    var outcome = {};


    var getRecord = function(callback) {
      req.app.db.models.GalleryEntries.findById(req.params.id).exec(function(err, record) {
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
        state:false,
        edited_By: {
          id: req.user._id,
          name: req.user.username,
          time: new Date().toISOString()
        },
        update_At:new Date().toISOString()
      };      
      var options = { new: true };
      req.app.db.models.GalleryEntries.findByIdAndUpdate(req.params.id, fieldsToSet, options, function(err, entry) {
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
      req.app.db.models.GalleryEntries.findByIdAndRemove(req.params.id, function(err, record) {
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
module.exports = homeGallery;