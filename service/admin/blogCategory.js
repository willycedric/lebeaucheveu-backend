'use strict';
// public api
var blogCategory = {
  find: function (req, res, next) {
    req.query.pivot = req.query.pivot ? req.query.pivot : '';
    req.query.name = req.query.name ? req.query.name : '';
    req.query.limit = req.query.limit ? parseInt(req.query.limit, null) : 20;
    req.query.page = req.query.page ? parseInt(req.query.page, null) : 1;
    req.query.sort = req.query.sort ? req.query.sort : '_id';

    var filters = {};
    if (req.query.pivot) {
      filters.pivot = new RegExp('^.*?' + req.query.pivot + '.*$', 'i');
    }
    if (req.query.name) {
      filters.name = new RegExp('^.*?' + req.query.name + '.*$', 'i');
    }

    req.app.db.models.BlogCategory.pagedFind({
      filters: filters,
      keys: 'userCreated name description created_At update_At update_by',
      limit: req.query.limit,
      page: req.query.page,
      sort: req.query.sort
    }, function (err, results) {
      if (err) {
        return next(err);
      }

      results.filters = req.query;
      res.status(200).json(results);
    });
  },

  read: function (req, res, next) {
    req.app.db.models.BlogCategory.findById(req.params.id).exec(function (err, blogCategory) {
      if (err) {
        return next(err);
      }
      res.status(200).json(blogCategory);
    });
  },

  create: function (req, res, next) {
    var workflow = req.app.utility.workflow(req, res);

    workflow.on('validate', function () {
      if (!req.user.roles.admin.isMemberOf('root')) {
        workflow.outcome.errors.push('You may not create categories.');
        return workflow.emit('response');
      }

      if (!req.body.name) {
        workflow.outcome.errors.push('A name is required.');
        return workflow.emit('response');
      }

      if (!req.body.description) {
        workflow.outcome.errors.push('A description is required.');
        return workflow.emit('response');
      }

      workflow.emit('duplicateBlogCategoryCheck');
    });

    workflow.on('duplicateBlogCategoryCheck', function () {
      req.app.db.models.BlogCategory.find({name:req.body.name}).exec(function (err, blogCategory) {
        if (err) {
          return workflow.emit('exception', err);
        }

        if (blogCategory.length!=0) {          
          workflow.outcome.errors.push('That blogCategory+name is already taken.');
          return workflow.emit('response');
        }

        workflow.emit('createBlogCategory');
      });
    });

    workflow.on('createBlogCategory', function () {
      var fieldsToSet = {
        description: req.body.description,
        name: req.body.name,
        userCreated: {
          id: req.user._id,
          name: req.user.username,
          time: new Date().toISOString()
        }        
      };
      fieldsToSet.search =  fieldsToSet.description.split(" ");
      req.app.db.models.BlogCategory.create(fieldsToSet, function (err, blogCategory) {
        if (err) {
          return workflow.emit('exception', err);
        }

        workflow.outcome.record = blogCategory;
        return workflow.emit('response');
      });
    });

    workflow.emit('validate');
  },

  update: function (req, res, next) {
    var workflow = req.app.utility.workflow(req, res);

    workflow.on('validate', function () {
      if (!req.user.roles.admin.isMemberOf('root')) {
        workflow.outcome.errors.push('You may not update categories.');
        return workflow.emit('response');
      }

      if (!req.body.name) {
        workflow.outcome.errfor.name = 'required';
        return workflow.emit('response');
      }

      if (!req.body.description) {
        workflow.outcome.errfor.description = 'required';
        return workflow.emit('response');
      }

      workflow.emit('duplicateBlogCategoryCheck');
    });

    workflow.on('duplicateBlogCategoryCheck', function () {
      req.app.db.models.BlogCategory.findById(req.params.id).exec(function (err, blogCategory) {
        if (err) {
          return workflow.emit('exception', err);
        }
        
        if (blogCategory && blogCategory._id !=req.params.id) {
          workflow.outcome.errors.push('The blogCategory '+'"'+req.body.name+'"'+' is already taken.');
          return workflow.emit('response');
        }

        workflow.emit('patchBlogCategory');
      });
    });


    workflow.on('patchBlogCategory', function () {
      var fieldsToSet = {
        name: req.body.name,
        description: req.body.description,
        update_by:{
          id: req.user._id,
          name: req.user.username,
          time: new Date().toISOString()
        },
         update_At:new Date().toISOString()
      };
      fieldsToSet.search =  fieldsToSet.description.split(" ");
      var options = { new: true };

      req.app.db.models.BlogCategory.findByIdAndUpdate(req.params.id, fieldsToSet, options, function (err, blogCategory) {
        if (err) {
          return workflow.emit('exception', err);
        }

        workflow.outcome.blogCategory = blogCategory;
        return workflow.emit('response');
      });
    });

    workflow.emit('validate');
  },

  delete: function (req, res, next) {
    var workflow = req.app.utility.workflow(req, res);

    workflow.on('validate', function () {
      if (!req.user.roles.admin.isMemberOf('root')) {
        workflow.outcome.errors.push('You may not delete categories.');
        return workflow.emit('response');
      }

      workflow.emit('deleteBlogCategory');
    });

    workflow.on('deleteBlogCategory', function (err) {
      req.app.db.models.BlogCategory.findByIdAndRemove(req.params.id, function (err, blogCategory) {
        if (err) {
          return workflow.emit('exception', err);
        }
        workflow.emit('response');
      });
    });

    workflow.emit('validate');
  }

};
module.exports = blogCategory;
