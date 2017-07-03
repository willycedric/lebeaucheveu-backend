'use strict';

exports = module.exports = function(app, mongoose) {

  var entry = new mongoose.Schema({
  url:{
    type:String,
    default:""
  },
  createdAt:{
    type:Date,
    default:Date.now
  },
  published:{
    type:Boolean,
    default:true
  },
  hairdresserCreated: {
    id: { type: mongoose.Schema.Types.ObjectId, ref: 'Hairdresser' },
    name: { type: String, default: '' },
    profile_url:{type:String,default:''},
    time: { type: Date, default: Date.now }
  }
});
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
    default:true
  },
  userCreated: {
    id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name: { type: String, default: '' },
    time: { type: Date, default: Date.now }
  },
  update_by: {
      id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      name: { type: String, default: '' },
      time: { type: Date, default: Date.now }
    },
  entries:[entry]
  });
  haircutCatalogSchema.plugin(require('./plugins/pagedFind'));
  haircutCatalogSchema.set('autoIndex', (app.get('env') === 'development'));
  app.db.model('HaircutCatalog', haircutCatalogSchema);
};
