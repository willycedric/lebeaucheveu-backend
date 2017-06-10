'use strict';
// public api
var haircutCategory = {
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

    req.app.db.models.HaircutCatalog.pagedFind({
      filters: filters,
      keys: 'name state createdAt userCreated',
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
    req.app.db.models.HaircutCatalog.findById(req.params.id).exec(function (err, haircutCategory) {
      if (err) {
        return next(err);
      }
      res.status(200).json(haircutCategory);
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

      workflow.emit('duplicatehaircutCategoryCheck');
    });

    workflow.on('duplicatehaircutCategoryCheck', function () {
      req.app.db.models.HaircutCatalog.find({name:req.body.name}).exec(function (err, haircutCategory) {
        if (err) {
          return workflow.emit('exception', err);
        }

        if (haircutCategory.length!=0) {          
          workflow.outcome.errors.push('That haircut Category'+name +'is already taken.');
          return workflow.emit('response');
        }

        workflow.emit('createhaircutCategory');
      });
    });

    workflow.on('createhaircutCategory', function () {
      var fieldsToSet = {
        name: req.body.name,
        state: req.body.state==undefined?true:req.body.state,
        userCreated: {
          id: req.user._id,
          name: req.user.username,
          time: new Date().toISOString()
        }
      };
      fieldsToSet.search =  fieldsToSet.name;
      req.app.db.models.HaircutCatalog.create(fieldsToSet, function (err, haircutCategory) {
        if (err) {
          return workflow.emit('exception', err);
        }

        workflow.outcome.record = haircutCategory;
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
      

      workflow.emit('duplicatehaircutCategoryCheck');
    });

    workflow.on('duplicatehaircutCategoryCheck', function () {
      req.app.db.models.HaircutCatalog.findById(req.params.id).exec(function (err, haircutCategory) {
        if (err) {
          return workflow.emit('exception', err);
        }
        
        if (haircutCategory && haircutCategory._id !=req.params.id) {
          workflow.outcome.errors.push('The haircutCategory '+'"'+req.body.name+'"'+' is already taken.');
          return workflow.emit('response');
        }

        workflow.emit('patchhaircutCategory');
      });
    });


    workflow.on('patchhaircutCategory', function () {
      var fieldsToSet = {
        name: req.body.name,     
        update_by:{
          id: req.user._id,
          name: req.user.username,
          time: new Date().toISOString()
        },
         update_At:new Date().toISOString()
      };
      fieldsToSet.search =  fieldsToSet.name;
      var options = { new: true };

      req.app.db.models.HaircutCatalog.findByIdAndUpdate(req.params.id, fieldsToSet, options, function (err, haircutCategory) {
        if (err) {
          return workflow.emit('exception', err);
        }

        workflow.outcome.haircutCategory = haircutCategory;
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

      workflow.emit('deletehaircutCategory');
    });

    workflow.on('deletehaircutCategory', function (err) {
      req.app.db.models.HaircutCatalog.findByIdAndRemove(req.params.id, function (err, haircutCategory) {
        if (err) {
          return workflow.emit('exception', err);
        }
        workflow.emit('response');
      });
    });

    workflow.emit('validate');
  }

};
module.exports = haircutCategory;
