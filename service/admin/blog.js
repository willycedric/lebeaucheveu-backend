'use strict';
// public api
var sanitize = require('sanitize-html');
var blog = {
  find: function (req, res, next) {
    var outcome = {};

    var getStatusOptions = function (callback) {
      req.app.db.models.Status.find({pivot: 'Blog'}, 'name').sort('name').exec(function (err, statuses) {
        if (err) {
          return callback(err, null);
        }

        outcome.statuses = statuses;
        return callback(null, 'done');
      });
    };

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

      req.app.db.models.Blog.pagedFind({
        filters: filters,
        keys: 'title userCreated update_At edited_By content category description isPublished summaryImageUrl',
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

      outcome.results.filters = req.query;
      res.status(200).json(outcome);
    };

    require('async').parallel([getStatusOptions, getResults], asyncFinally);
  },

  create: function(req, res, next){
    var workflow = req.app.utility.workflow(req, res);

    workflow.on('validate', function() {
      
      if (!req.body['title']) {
        workflow.outcome.errors.push('Please enter a title.');
        return workflow.emit('response');
      }

      if(!req.body['content']){
        workflow.outcome.errors.push('Please enter a content');
        return workflow.emit('response');
      }

      if(!req.body['category'] || req.body['category'].id==0){
        workflow.outcome.errors.push('Please chose a category');
        return workflow.emit('response');
      }
      if(!req.body['description']){
        workflow.outcome.errors.push('Please enter a description');
        return workflow.emit('response');
      }


      workflow.emit('createBlog');
    });

    workflow.on('createBlog', function() {
      //var title = req.body['title'].trim().split(/\s/);
      var fieldsToSet = {
        title:req.body.title,
        description:req.body.description,
        isPublished:req.body.isPublished,
        summaryImageUrl:req.body.summaryImageUrl,
        content:sanitize(req.body.content,{
          allowedTags: sanitize.defaults.allowedTags.concat([ 'h1','u','img' ])
        }),
        category:{
          id:req.body.category._id,
          name:req.body.category.name
        },
        userCreated: {
          id: req.user._id,
          name: req.user.username,
          time: new Date().toISOString()
        }
      };
      
      fieldsToSet.search =  fieldsToSet.description.split(" ");

      req.app.db.models.Blog.create(fieldsToSet, function(err, blog) {
        if (err) {
          return workflow.emit('exception', err);
        }

        workflow.outcome.record = blog;
        return workflow.emit('response');
      });
    });

    workflow.emit('validate');
  },

  read: function(req, res, next){
    var outcome = {};

    var getStatusOptions = function(callback) {
      req.app.db.models.Status.find({ pivot: 'Blog' }, 'name').sort('name').exec(function(err, statuses) {
        if (err) {
          return callback(err, null);
        }

        outcome.statuses = statuses;
        return callback(null, 'done');
      });
    };

    var getRecord = function(callback) {
      req.app.db.models.Blog.findById(req.params.id).exec(function(err, record) {
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

    require('async').parallel([getStatusOptions, getRecord], asyncFinally);
  },

  update: function(req, res, next){
    var workflow = req.app.utility.workflow(req, res);

    workflow.on('validate', function() {
      
      if (!req.body['title']) {
        workflow.outcome.errfor.title='Please enter a title.';
      }

      if(!req.body['content']){
        workflow.outcome.errfor.content='Please enter a content';
      }

      if(!req.body['category']){
        workflow.outcome.errfor.category='Please chose a category';
      }
      if(!req.body['description']){
        workflow.outcome.errfor.description='Please enter a description';
      }

      if(!req.body['isPublished']){
        workflow.outcome.errfor.isPublished='Please fill the publication state';
      }     

      if (workflow.hasErrors()) {
        return workflow.emit('response');
      }

      workflow.emit('patchBlog');
    });

    workflow.on('patchBlog', function() {
      
      var fieldsToSet = {
        category:{
          id:req.body.category._id,
          name:req.body.category.name
        },
        title:req.body.title,
        description:req.body.description,
        isPublished:req.body.isPublished,
        summaryImageUrl:req.body.summaryImageUrl,
        content:sanitize(req.body.content,{
          allowedTags: sanitize.defaults.allowedTags.concat([ 'h1','u','img'])
        }),
        edited_By: {
          id: req.user._id,
          name: req.user.username,
          time: new Date().toISOString()
        },
        update_At:new Date().toISOString()
      };      
      fieldsToSet.search =  fieldsToSet.title.split(" ");
     

      var options = { new: true };

      req.app.db.models.Blog.findByIdAndUpdate(req.params.id, fieldsToSet, options, function(err, blog) {
        if (err) {
          return workflow.emit('exception', err);
        }

        workflow.outcome.blog = blog;
        return workflow.emit('response');
      });
    });

    workflow.emit('validate');
  },
  delete: function(req, res, next){
    var workflow = req.app.utility.workflow(req, res);

    workflow.on('validate', function() {
      if (!req.user.roles.admin.isMemberOf('root')) {
        workflow.outcome.errors.push('You may not delete a blog.');
        return workflow.emit('response');
      }

      workflow.emit('deleteBlog');
    });

    workflow.on('deleteBlog', function(err) {
      req.app.db.models.Blog.findByIdAndRemove(req.params.id, function(err, blog) {
        if (err) {
          return workflow.emit('exception', err);
        }

        workflow.outcome.blog = blog;
        workflow.emit('response');
      });
    });

    workflow.emit('validate');
  }
};
module.exports = blog;