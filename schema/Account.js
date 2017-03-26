

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

exports = module.exports = function(app, mongoose) {
  var appointmentSchema = new Schema({
  selectedHour:{
    type:String
  },
  dayOfWeek:{
    type:Date
  },
  haidresserId:{
    type:Schema.Types.ObjectId
  },
  hairdresserUsername:{
    type:String
  },
  //describe the appointment progression
  appointmentState:{
    type:Number,
    default:-1,//-1 -> empty,0 -> pending, 1 -> done,-2 --> cancel by the hairdresser, -3 --> cancel by the customer.
    min:-3,
    max:0
  },
  createdAt:{
    type:Date
  },
  updateAt:{
    type:Date
  },
  location:{
    type:String
  }
});

//User can have many locations
var locationSchema = new Schema({
  type:{
    type:String
  },
  address:{
    type:String
  },
  city:{
    type:String
  },
  zipcode:{
    type:String
  }
});

//Related users
var relatedSchema = new Schema({
  _id:{
    type:Schema.Types.ObjectId
  },
  name:{
    type:String
  },
  role:{
    type:String
  }

});

//products purchased by the user
var productSchema = new Schema ({
  _id:{
    type:Schema.Types.ObjectId,
  },
  purchasedAt:Date
})
//user notifications schema 
var NotificationSchema = new Schema ({
    title:{
      type:String,
      default:'Rendez vous supprimé'
    },
    message : {
      type:String
    },
    date : { type : Date, default : Date.now() },
    read:{type:Boolean, default:false}
});

var accountSchema = new Schema({
    user: {
      id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      name: { type: String, default: '' }
    },
    isVerified: { type: String, default: '' },
    verificationToken: { type: String, default: '' },
    name: {
      first: { type: String, default: '' },
      middle: { type: String, default: '' },
      last: { type: String, default: '' },
      full: { type: String, default: '' }
    },
    company: { type: String, default: '' },
    phone: { type: String, default: '' },
    zip: { type: String, default: '' },
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
    notes: [mongoose.modelSchemas.Note],
    userCreated: {
      id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      name: { type: String, default: '' },
      time: { type: Date, default: Date.now }
    },
    search: [String],
    lastconnection:{
    type:Date,
    default:Date.now
  },dateOfBirth:{
      type:Date
    },
    photoUrl:{
      type:String
    },
    locations:[locationSchema],
    nextAppointment:[appointmentSchema],
    notifications:[NotificationSchema]
  });
  accountSchema.plugin(require('./plugins/pagedFind'));
  accountSchema.index({ user: 1 });
  accountSchema.index({ 'status.id': 1 });
  accountSchema.index({ search: 1 });
  accountSchema.set('autoIndex', (app.get('env') === 'development'));
  app.db.model('Account', accountSchema);
};
