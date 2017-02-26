'use strict';

exports = module.exports = function(app, mongoose) {
  var BlogCategorySchema = new mongoose.Schema({
  	name:{
  		type:String,
  		default:''
  	},
  	author: {
      id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      name: { type: String, default: '' }
    },
    edited_By: {
      id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      name: { type: String, default: '' }
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
    edited_At:{
    	type:Date,
    	default:Date.now()
    }
  });
  BlogCategorySchema.plugin(require('./plugins/pagedFind'));
  BlogCategorySchema.index({ name: 1 });
  BlogCategorySchema.set('autoIndex', (app.get('env') === 'development'));
  app.db.model('BlogCategory', BlogCategorySchema);
};