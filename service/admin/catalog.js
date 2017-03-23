'use strict';
// public api
var catalog = {
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

    req.app.db.models.Catalog.pagedFind({
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
    req.app.db.models.Catalog.findById(req.params.id).exec(function (err, catalog) {
      if (err) {
        return next(err);
      }
      res.status(200).json(catalog);
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

      workflow.emit('duplicateCatalogCheck');
    });

    workflow.on('duplicateCatalogCheck', function () {
      req.app.db.models.Catalog.find({name:req.body.name}).exec(function (err, catalog) {
        if (err) {
          return workflow.emit('exception', err);
        }

        if (catalog.length!=0) {          
          workflow.outcome.errors.push('That catalog+name is already taken.');
          return workflow.emit('response');
        }

        workflow.emit('createCatalog');
      });
    });

    workflow.on('createCatalog', function () {
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
      fieldsToSet.search.push(fieldsToSet.description);
      fieldsToSet.search.push(fieldsToSet.description);
      req.app.db.models.Catalog.create(fieldsToSet, function (err, catalog) {
        if (err) {
          return workflow.emit('exception', err);
        }

        workflow.outcome.record = catalog;
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

      

      workflow.emit('duplicateCatalogCheck');
    });

    workflow.on('duplicateCatalogCheck', function () {
      req.app.db.models.Catalog.findById(req.params.id).exec(function (err, catalog) {
        if (err) {
          return workflow.emit('exception', err);
        }
        
        if (catalog && catalog._id !=req.params.id) {
          workflow.outcome.errors.push('The catalog '+'"'+req.body.name+'"'+' is already taken.');
          return workflow.emit('response');
        }

        if(req.body.content){
            req.body.content.userCreated = {
              id:req.user._id,
              name:req.user.username,
              time:new Date().toISOString()
            };
           catalog.contents.push(req.body.content);
           catalog.save(function(err, catalog){
              if(err)
                next(err);
               if(catalog){
                console.log(catalog);
                workflow.outcome.contents=catalog.contents;
               }
           });      
        }

        if(req.body.deletedId){
          catalog.contents.id(req.body.deletedId).remove();
          catalog.save(function(err, catalog){
              if(err)
                next(err);
               if(catalog){
                console.log(catalog);
                workflow.outcome.contents=catalog.contents;
               }
           });    
        }

        workflow.emit('patchCatalog');
      });
    });


    workflow.on('patchCatalog', function () {     
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
      fieldsToSet.search.push(fieldsToSet.description);
      fieldsToSet.search.push(fieldsToSet.name);

      var options = { new: true };

      req.app.db.models.Catalog.findByIdAndUpdate(req.params.id, fieldsToSet, options, function (err, catalog) {
        if (err) {
          return workflow.emit('exception', err);
        }

        workflow.outcome.catalog = catalog;
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

      workflow.emit('deleteCatalog');
    });

    workflow.on('deleteCatalog', function (err) {
      req.app.db.models.Catalog.findByIdAndRemove(req.params.id, function (err, catalog) {
        if (err) {
          return workflow.emit('exception', err);
        }
        workflow.emit('response');
      });
    });

    workflow.emit('validate');
  }

};
module.exports = catalog;
