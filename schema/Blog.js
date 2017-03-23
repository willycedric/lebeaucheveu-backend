'use strict';

exports = module.exports = function(app, mongoose) {
  var blogSchema = new mongoose.Schema({
  	title:{
  		type:String,
  		default:''
  	},
  	userCreated: {
      id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      name: { type: String, default: '' },
      time: { type: Date, default: Date.now }
    },
    edited_By: {
      id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      name: { type: String, default: '' },
      time: { type: Date, default: Date.now }
    },
    content:{
    	type:String,
    	default:''
    },
    isPublished:{
      type:Boolean,
      default:false
    },
    search:[String],
    description:{
    	type:String,
    	default:''
    },
    status: {
      id: { type: String, ref: 'Status' },
      name: { type: String, default: '' },
      userCreated: {
        id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        name: { type: String, default: '' },
        time: { type: Date, default: Date.now }
      }
    },
    statusLog: [mongoose.modelSchemas.StatusLog],
    wordCount:{
    	type:Number,
    	default:0,
    	min:0
    },
    summaryImageUrl:{
      type:String,
      default:''
    },
    rating:{
    	type:Number,
    	default:0,
    	min:0
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
    },
    published_At:{
    	type:Date
    },
    category:{
    	  id: { type: mongoose.Schema.Types.ObjectId, ref: 'BlogCategory' },
        name: { type: String, default: '' }
    }

  });
  blogSchema.plugin(require('./plugins/pagedFind'));
  blogSchema.index({ author: 1 });
  blogSchema.index({ status: 1 });
  blogSchema.index({ 'category.id': 1 });
   blogSchema.index({ 'userCreated.id': 1 });
  blogSchema.index({ search: 1 });
  blogSchema.set('autoIndex', (app.get('env') === 'development'));
  app.db.model('Blog', blogSchema);
};