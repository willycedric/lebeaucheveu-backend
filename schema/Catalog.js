'use strict';

exports = module.exports = function(app, mongoose) {
  var contentSchema = new mongoose.Schema({
      url: String,
      isPublished: {
        type:Boolean,
        default:false
      },
      description:{
        type:String,
        default:''
      },
      userCreated: {
      id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      name: { type: String, default: '' },
      time: { type: Date, default: Date.now }
    }
  });
  var catalogSchema = new mongoose.Schema({
  	name:{
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
    isPublished:{
      type:Boolean,
      default:false
    },
    search:[String],
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
    published_At:{
    	type:Date
    },
    contents:[contentSchema]
    });
   catalogSchema.plugin(require('./plugins/pagedFind'));
   catalogSchema.index({ 'userCreated.id': 1 });
   catalogSchema.index({ search: 1 });
   catalogSchema.set('autoIndex', (app.get('env') === 'development'));
   app.db.model('Catalog', catalogSchema);
};