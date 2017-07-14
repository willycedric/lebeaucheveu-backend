'use strict';

exports = module.exports = function(app, mongoose) {
    var haircutPriceSchema =  new mongoose.Schema({
        min:{
            type:Number,
            required:true
        },
        max:{
            type:Number,
            required:true
        }
    });  
    var haircutStyleSchema =  new mongoose.Schema({
        name:{
            type:String
        },
        categoryName:{
            type:String
        },
        state:{
            type:Boolean,
            default:true
        },
        haircutCategory:{
             type: Number, ref: 'HaircutCatalog'           
         },
        userCreated: {
            id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            name: { type: String, default: '' },
            time: { type: Date, default: Date.now }
        },
        price:haircutPriceSchema,
        edited_By: {
        id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        name: { type: String, default: '' },
        time: { type: Date, default: Date.now }
        }      
    });  
    haircutStyleSchema.plugin(require('./plugins/pagedFind'));
    haircutStyleSchema.index({ 'userCreated.id': 1 });    
    haircutStyleSchema.set('autoIndex', (app.get('env') === 'development'));
    app.db.model('HaircutStyle', haircutStyleSchema);
};