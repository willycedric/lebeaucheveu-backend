'use strict';
exports = module.exports = function(app, mongoose) {
  var areaSchema = new mongoose.Schema({
    formatted_address:{
    type:String
  },
  location:{
    type:[Number]
  },
  longitude:{
      type:Number
  },
  latitude:{
      type:Number
  },
  locality:{
    type:String
  },
  administrative_level_2:{ //department name
    type:String
  },
  administrative_level_1:{//region name
    type:String
  },
  postal_code:{
    type:String
  },
  country:{
    type:String
  },
  createdAt:{
    type:Date,
    default:Date.now
  },
  status:{
    type:Boolean,
    default:true
  }
});
areaSchema.index({location: '2dsphere'});
app.db.model('Area', areaSchema);
};