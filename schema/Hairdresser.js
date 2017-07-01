'use strict';
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
exports = module.exports = function(app, mongoose) {
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

//Hairdresser appointmentSchema;
var HairdresserAppointmentSchema = new Schema({   
  slotTime:{ //appointment hours (in the hairdresser's opening hour list)
    type:String
  },
  //Used to check is the slot is already taken
  slotType:{ 
    type:Number,
    default:1 //1 --> Free, 0 --> already taken, -1 -->locked by the hairdresser
  },
  //describe the appointment progression
  slotState:{
    type:Number,
    default:0,//0 -> empty,-1 -> pending, 1 -> done,-2 --> cancel by the hairdresser, -3 --> cancel by the customer
    min:-3,
    max:1
  },
  dayOfWeek:{
    type:Date
  },
relatedCustomers:{
type:String //related customer username
},
createdAt:{ //appointment creatioon date
  type:Date
},
updateAt:{ //appointment update date
  type:Date
},
location:{
  type:String
}
});

var galeryEnter = new Schema({
  url:{
    type:String,
    default:""
  },
  createdAt:{
    type:Date,
    default:Date.now
  },
  category:{type: mongoose.Schema.Types.ObjectId, ref: 'HaircutCatalog' },
  published:{
    type:Boolean,
    default:true
  }
});
var bookingSchema = new Schema({
  customerId:{
    type:Schema.Types.ObjectId
  },
  customerLastname :{
    type:String
  },
  customerFirstname:{
    type:String
  },
  appointmentDate:{
    type:Date
  },
  appointmentHour:{
    type:String
  },
  appointmentLocation:{
    type:String
  },
  appointmentState:{
    type:Number,
    Max:1,
    Min:-3
  }
});
  var hairdresserSchema = new Schema({
    user: {
      id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      name: { type: String, default: '' }
    },
    isVerified: { type: String, default: '' },
    verificationToken: { type: String, default: '' },
    token: { type: String, default: '' },
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
    search: [String],
    nextbookings:[bookingSchema],
    appointments:[HairdresserAppointmentSchema],
    notifications:[NotificationSchema],
   listOfPerformance:[String],
    profile_picture:{
      type:String,
      default:""
    },
    lastconnection:{
     type:Date,
     default:Date.now
   },
   description:{
    type:String,
  lowercase:true,
  },
  categories:[mongoose.modelSchemas.HaircutCatalog],
  paiementInfo:{
    number:Number,
    cvc:Number,
    exp_month:Number,
    exp_year:Number,
  },
  gallery_pictures:[galeryEnter],
  customer_type:{
    type:Number,
    min:0,
  max:2,
  default:1
},
resetPasswordToken:String,
resetPasswordExpires:Date,
activityArea:[mongoose.modelSchemas.Area], //Array of area covered by the hairdresser
rating:{
  type:Number,//0 --> Both men and women , 1 --> Women only, 2 --> Men only
  default:1
}
});
  
  hairdresserSchema.plugin(require('./plugins/pagedFind')); 
  hairdresserSchema.index({ user: 1 });
  hairdresserSchema.index({ 'status.id': 1 });
  hairdresserSchema.index({ search: 1 });
  hairdresserSchema.set('autoIndex', (app.get('env') === 'development'));
  app.db.model('Hairdresser', hairdresserSchema);
};
