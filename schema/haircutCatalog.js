'use strict';

exports = module.exports = function(app, mongoose) {
  var haircutCatalogSchema = new mongoose.Schema({
    name:{
    type:String,
    uppercase:true
  },
  createdAt:{
    type:Date,
    default:Date.now
  },
  state:{
    type:Boolean,
    default:false
  }
  });
  //haircutCatalogSchema.plugin(require('./plugins/pagedFind'));
  //haircutCatalogSchema.set('autoIndex', (app.get('env') === 'development'));
  app.db.model('HaircutCatalog', haircutCatalogSchema);
};
