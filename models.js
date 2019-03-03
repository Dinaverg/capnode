let bcrypt = require('bcryptjs')
let mongoose = require("mongoose")

mongoose.Promise = global.Promise

let restaurantSchema = mongoose.Schema({
    address: 'string',
    cuisines: 'string',
    name: 'string',
    rating: 'string',
    restId: 'string',
    saved: {type: 'date', default: Date.now()}
})

let userSchema = mongoose.Schema({
    firstName: {type: 'string', default: ''},
    lastName: {type: 'string', default: ''},
    username: {
        type: 'string',
        required: true,
        unique: true
    },
    email: 'string',
    password: {
        type: 'string',
        required: true
    },
    JWT: 'string',
    beenTo: [restaurantSchema],
    toGoTo: [restaurantSchema]
})

userSchema.virtual("fullName").get(function() {
    console.log(this)
  return `${this.firstName} ${this.lastName}`.trim()
})

userSchema.methods.serialize = function() {
    return {
      name: this.fullName,
      beenTo: this.beenTo.length,
      toGoTo: this.toGoTo.length
    }
  }

userSchema.methods.validatePassword = function(password) {
    return bcrypt.compare(password, this.password);
};
  
userSchema.statics.hashPassword = function(password) {
    return bcrypt.hash(password, 10);
}

let Restaurant = mongoose.model('Restaurant', restaurantSchema)
let User = mongoose.model('User', userSchema)

module.exports = {Restaurant, User}