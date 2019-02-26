let path = require('path');
let express = require('express');
let zipcodes = require('zipcodes')
let cities = require('cities')
let cityPop = require('all-the-cities')
let fetch = require('node-fetch')

let app = express();

app.use(express.static('public'));
/* app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
}); */

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
      getCityId({
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
      getCityId({
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
      getCityId({
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
    getCityId({
      latitude: place.latitude,
      longitude: place.longitude
    })
  }
})

function getCityId(obj) {
  let url = `https://developers.zomato.com/api/v2.1/cities?lat=${obj.latitude}&lon=${obj.longitude}`
  fetch(url, {
    headers: {
      "user-key": "5bd03d09c51a0f6f196ea401d3ae98c1"
    }
  })
  .then(Response => getRestaurants(Response.body))
  .catch(console.log('double berf'))
  
}

function getRestaurants(obj) {
  console.log(obj)  //.location_suggestions[0].id
}


let server

function runServer() {
  const port = process.env.PORT || 8080;
  return new Promise((resolve, reject) => {
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