'use strict';

exports = module.exports = function(app, mongoose) {
    var entryGallerySchema =  new mongoose.Schema({
        url:{
            type:String
        },
        createdAt:{
            type:Date,
            defautl:Date.now
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
        edited_By: {
        id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        name: { type: String, default: '' },
        time: { type: Date, default: Date.now }
        }      
    });  
    entryGallerySchema.plugin(require('./plugins/pagedFind'));
    entryGallerySchema.index({ 'userCreated.id': 1 });
    entryGallerySchema.index({ search: 1 });
    entryGallerySchema.set('autoIndex', (app.get('env') === 'development'));
    app.db.model('GalleryEntries', entryGallerySchema);
};