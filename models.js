let bcrypt = require('bcryptjs')
let mongoose = require("mongoose")

mongoose.Promise = global.Promise

let restaurantSchema = mongoose.Schema({
    address: 'string',
    cuisines: 'string',
    name: 'string',
    rating: 'string',
    restId: 'string'
})

let userSchema = mongoose.Schema({
    firstName: {type: String, default: 'X'},
    lastName: {type: String, default: 'X'},
    userName: {
        type: 'string',
        required: true,
        unique: true
    },
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
      name: this.fullname,
      beenTo: this.beenTo.length,
      toGoTo: this.toGoTo.length
    }
  }

userSchema.methods.validatePassword = function(password) {
    return bcrypt.compare(password, this.password);
};
  
UserSchema.statics.hashPassword = function(password) {
    return bcrypt.hash(password, 10);
}

let Restaurant = mongoose.model('Restaurant', restaurantSchema)
let User = mongoose.model('User', userSchema)

module.exports = {Restaurant, User}