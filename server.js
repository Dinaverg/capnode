let path = require('path');
let express = require('express');
let zipcodes = require('zipcodes')
let cities = require('cities')
let cityPop = require('all-the-cities')
let fetch = require('node-fetch')
let mongoose = require('mongoose')
let morgan = require('morgan')
let passport = require('passport')

let {DATABASE_URL} = require('./config');
let userrouter = require('./userrouter');
let {router: authrouter, localStrategy, jwtStrategy } = require('./auth');

mongoose.Promise = global.Promise

let app = express();

app.use(morgan('common'))
app.use(express.static('public'));
/* app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
}); */

passport.use(localStrategy);
passport.use(jwtStrategy);

app.use('/users', userrouter)

app.get('/', function(req, res) {
  res.status(200)
})

app.get('/login', function(req, res) {
  res.status(200)
})

app.get('/search', function(req, res) {
  console.log(req.query.location)
  if (isNaN(req.query.location)) {
    //let result = cities.filter(city => {
    let result = cityPop.filter(city => {
      return city.name == req.query.location
    })
    let stateSet = new Set(result.map(x => x.adminCode))
    if (result.length == 1) {
      getRestaurants({
        latitude: result[0].latitude,
        longitude: result[0].longitude
      })
      console.log('one')
      //send to poi api
    } else if (result.length == 0) {
      console.log('two')
      res.status(400)
      //bad request, misspelled, no city exists
    } else if (stateSet.size == 1) {
      console.log('three')
      getRestaurants({
        latitude: result[0].latitude,
        longitude: result[0].longitude
      })
      //send to poi api
    } else {
      console.log('four')
      let maxPop = result.reduce(function(prev, current) {
        return (prev.population > current.population) ? prev : current
        //cities by population, maxpop sshould be an object      
      })
      //console.log(maxPop)
      getRestaurants({
        latitude: maxPop.lat,
        longitude: maxPop.lon
      })
      //send to poi api
    }
    console.log('berf')
    //cities
  } else {
    let place = zipcodes.lookup(req.query.location)
    console.log(place)
    getRestaurants({
      latitude: place.latitude,
      longitude: place.longitude
    }, res) 
        //res.set('user-key', '5bd03d09c51a0f6f196ea401d3ae98c1')
  }
})

function getRestaurants(obj, res) {
  console.log(JSON.stringify(obj))
  let url = `https://developers.zomato.com/api/v2.1/search?lat=${obj.latitude}&lon=${obj.longitude}`
  fetch(url, {
    headers: {
      "user-key": "5bd03d09c51a0f6f196ea401d3ae98c1"
    }
  })
  .then(response => response.json())
  .then(responseJson => showRestaurantData(responseJson, res))
  .catch(err => console.error(err))
}

function showRestaurantData(json, res) {
  console.log(json.restaurants[0].restaurant)
  let sum = []
  for (let i = 0; i < json.restaurants.length; i++) {
    sum.push({
      id: json.restaurants[i].restaurant.id,
      name: json.restaurants[i].restaurant.name,
      url: json.restaurants[i].restaurant.url,
      address: json.restaurants[i].restaurant.location.address,
      cuisines: json.restaurants[i].restaurant.cuisines,
      user_rating: json.restaurants[i].restaurant.user_rating.rating_text
    })
  }
  res.send(sum)
}

let server

function runServer() {
  const port = process.env.PORT || 8080;
  return new Promise((resolve, reject) => {
    mongoose.connect(DATABASE_URL, {useNewUrlParser: true}, err => {
      if (err) {
        return reject(err)
      }
    })
    server = app
    .listen(port, () => {
      console.log(`Your app is listening on port ${port}`);
      resolve(server);
    })
    .on("error", err => {
      reject(err);
    });
  });
}

function closeServer() {
  return new Promise((resolve, reject) => {
    console.log("Closing server");
    server.close(err => {
      if (err) {
        reject(err);
        return;
      }
      resolve();
    });
  });
}

if (require.main === module) {
  runServer().catch(err => console.error(err));
}

module.exports = {app, runServer, closeServer}