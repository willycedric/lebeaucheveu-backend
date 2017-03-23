'use strict';

// public api
var blogCategory = {
  findBlogCategories: function (req, res, next) {
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

      req.app.db.models.BlogCategory.pagedFind({
        filters: filters,
        keys: 'name update_At description',
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
  }  
};
module.exports = blogCategory;