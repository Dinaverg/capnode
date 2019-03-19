let path = require('path');
let express = require('express');
let uuid = require('uuid/v4')
let exSession = require('express-session')
let zipcodes = require('zipcodes')
let cities = require('cities')
let cityPop = require('all-the-cities')
let fetch = require('node-fetch')
let mongoose = require('mongoose')
let morgan = require('morgan')
let passport = require('passport')
let cases = require('change-case')

let {DATABASE_URL, PORT} = require('./config');
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
//app.use(express.cookieParser())
/* app.use(exSession({
  genid: (req) => {
    console.log('Inside the session middleware')
    console.log(req.sessionID)
    return uuid() // use UUIDs for session IDs
  },
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true
})) */
//{ secret: 'iago', maxAge:null }))
//app.use(passport.initialize())
//app.use(passport.session())

passport.use(localStrategy);
passport.use(jwtStrategy);

/* passport.serializeUser((user, done) => {
  console.log(user)
  done(null, user.username)
}) */

app.use('/users', userrouter)
app.use('/auth', authrouter)

const jwtAuth = passport.authenticate('jwt', {session: false});

app.get('/', function(req, res) {
  res.status(200)
})

app.get('/search', jwtAuth, function(req, res) {
  console.log(req.query.location)
  let start = req.query.start
  if (isNaN(req.query.location)) {
    let result = cityPop.filter(city => {
      return city.name == cases.titleCase(req.query.location)
    })
    let stateSet = new Set(result.map(x => x.adminCode))
    if (result.length == 1) {
      getRestaurants({
        latitude: result[0].lat,
        longitude: result[0].lon
      }, res, start)
      console.log('one')
      //send to poi api
    } else if (result.length == 0) {
      console.log('two')
      res.status(400).send()
      //bad request, misspelled, no city exists, etc
    } else if (stateSet.size == 1) {
      console.log('three')
      getRestaurants({
        latitude: result[0].latitude,
        longitude: result[0].longitude
      }, res, start)
      //send to poi api
    } else {
      console.log('four')
      let maxPop = result.reduce(function(prev, current) {
        return (prev.population > current.population) ? prev : current
        //cities by population, maxpop sshould be an object      
      })
      getRestaurants({
        latitude: maxPop.lat,
        longitude: maxPop.lon
      }, res, start)
      //send to poi api
    }
    console.log('berf')
    //cities
  } else {
    let place = zipcodes.lookup(req.query.location)
    getRestaurants({
      latitude: place.latitude,
      longitude: place.longitude
    }, res, start) 
  }
})

function getRestaurants(obj, res, start=0) {
  let url = `https://developers.zomato.com/api/v2.1/search?lat=${obj.latitude}&lon=${obj.longitude}&start=${start}`
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
  let sum = []
  for (let i = 0; i < json.restaurants.length; i++) {
    sum.push({
      id: json.restaurants[i].restaurant.id,
      name: json.restaurants[i].restaurant.name,
      address: json.restaurants[i].restaurant.location.address,
      cuisines: json.restaurants[i].restaurant.cuisines,
      user_rating: json.restaurants[i].restaurant.user_rating.rating_text
    })
  }
  res.send(sum)
}

let server

function runServer(databaseUrl) {
  let port = process.env.PORT || 8080;
  mongoose.set('debug', true);
  return new Promise((resolve, reject) => {
    mongoose.connect(databaseUrl, {useNewUrlParser: true}, err => {
      if (err) {
        return reject(err)
      }
    })
    console.log(`connected to database at ${databaseUrl}`)
    server = app
    .listen(port, () => {
      console.log(`Your app is listening on port ${port}`);
      resolve(server);
    })
    .on("error", err => {
      console.log('error thrown')
      mongoose.disconnect()
      reject(err);
    });
  });
}

function closeServer() {
  return mongoose.disconnect().then(() => {
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
  })
}

if (require.main === module) {
  runServer(DATABASE_URL).catch(err => console.error(err));
}

module.exports = {app, runServer, closeServer}