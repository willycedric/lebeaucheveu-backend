'use strict';
var _ = require('lodash');
// public api
var haircutCatalog = {
  read:function(req, res, next){   
     var outcome = {};
    req.app.db.models.HaircutCatalog.find( {},function(err, record) {
    if (err) {
        return next(err);
    }
    outcome.record = record.map(function(category){
        return category.name.toLowerCase();
    });
        res.status(200).json(outcome);
    });   
  }  
};
module.exports =haircutCatalog;