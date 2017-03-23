'use strict';

exports = module.exports = function(app, mongoose) {
  var BlogCategorySchema = new mongoose.Schema({
  	name:{
  		type:String,
  		default:''
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
    description:{
    	type:String,
    	default:''
    },
    created_At:{
    	type:Date,
    	default:Date.now()
    },
    update_At:{
    	type:Date,
    	default:Date.now()
    },
     search: [String]
  });
  BlogCategorySchema.plugin(require('./plugins/pagedFind'));
  BlogCategorySchema.index({ name: 1 });
  BlogCategorySchema.set('autoIndex', (app.get('env') === 'development'));
  app.db.model('BlogCategory', BlogCategorySchema);
};