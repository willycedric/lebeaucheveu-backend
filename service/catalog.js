'use strict';
var _ = require('lodash');
// public api
var catalog = {
  findCatalogs: function (req, res, next) {
    var outcome = {};  

    var getResults = function (callback) {      
      req.query.search = req.query.search ? req.query.search : '';
      req.query.status = req.query.status ? req.query.status : '';
      req.query.limit = req.query.limit ? parseInt(req.query.limit, null) : 6;
      req.query.page = req.query.page ? parseInt(req.query.page, null) : 1;
      req.query.sort = req.query.sort ? req.query.sort : '_id';

      var filters = {};
      if (req.query.search) {
        filters.search = new RegExp('^.*?' + req.query.search + '.*$', 'i');
      }

      if (req.query.status) {
        filters['status.id'] = req.query.status;
      }

      req.app.db.models.Catalog.pagedFind({
        filters: filters,
        keys: 'userCreated update_At edited_By contents name description isPublished ',
        limit: req.query.limit,
        page: req.query.page,
        sort: req.query.sort
      }, function (err, results) {
        if (err) {
          return callback(err, null);
        }

        /*_.remove(results.data, function(result){
            return result.isPublished === false;
        });*/
        

        outcome.results = results;
        
       
        return callback(null, 'done');
      });
    };
    var allCatalogs = function(callback){
        req.app.db.models.Catalog.find({}, function(err, catalogs){
          if(err){
            return callback(err,null);
          }
        outcome.catalogs =[];
        catalogs.forEach(function(catalog){
         outcome.catalogs.push(catalog.name);
        });
        return callback(null,'done');
        })
    };

    var asyncFinally = function (err, results) {
      if (err) {
        return next(err);
      }

      outcome.results.filters = req.query;
      res.status(200).json(outcome);
    };

    
    require('async').parallel([getResults,allCatalogs], asyncFinally);
  },

  read:function(req, res, next){
    var outcome = {};

    var getStatusOptions = function(callback) {
      req.app.db.models.Status.find({ pivot: 'Catalog' }, 'name').sort('name').exec(function(err, statuses) {
        if (err) {
          return callback(err, null);
        }
        outcome.statuses = statuses;
        return callback(null, 'done');
      });
    };

    var getRecord = function(callback) {
      req.app.db.models.Catalog.findById(req.params.id).exec(function(err, record) {
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
  }
  
};
module.exports = catalog;