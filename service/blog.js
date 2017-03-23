'use strict';
var _ = require('lodash');
// public api
var blog = {
  findBlogs: function (req, res, next) {
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
      req.query.limit = req.query.limit ? parseInt(req.query.limit, null) : 3;
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

        _.remove(results.data, function(result){
            return result.isPublished === false;
        });

        //filter by authors
        if(req.query.author){      
          _.remove(results.data, function(result){             
             return req.query.author != result.userCreated.name;
          });
        }

        //filter by categories
        if(req.query.category){
          _.remove(results.data, function(result){
            return req.query.category != result.category.name;
          });
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

  read:function(req, res, next){
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
  related:function(req,res, next){
    var outcome = {};
    req.app.db.models.Blog.find({'category.id':req.params.id}).exec(function(err,blogs){
        if(err){
          return next(err);
        }
        outcome.results = blogs;
        res.status(200).json(outcome);
    });
  },
  author:function(req,res, next){
    var outcome = {};
    req.app.db.models.Blog.find({'userCreated.id':req.params.id}).exec(function(err,blogs){
        if(err){
          return next(err);
        }
        outcome.results = blogs;
        res.status(200).json(outcome);
    });
  }
  
};
module.exports = blog;