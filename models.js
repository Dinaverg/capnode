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
    firstName: 'string',
    lastName: 'string',
    userName: {
        type: 'string',
        unique: true
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
let Restaurant = mongoose.model('Restaurant', restaurantSchema)
let User = mongoose.model('User', userSchema)

module.exports = {Restaurant, User}