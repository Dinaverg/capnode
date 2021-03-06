let express = require('express')
let bodyparser = require('body-parser')
let passport = require('passport')
let jwt = require('jsonwebtoken')

let {Restaurant, User} = require('./models')
let {JWT_SECRET} = require('./config')

let router = express.Router()

let jsonParser = bodyparser.json()

router.post('/signup', jsonParser, (req, res) => {
    const requiredFields = ['username', 'password'];
    const missingField = requiredFields.find(field => !(field in req.body));
  
    if (missingField) {
      return res.status(422).json({
        code: 422,
        reason: 'ValidationError',
        message: 'Missing field',
        location: missingField
      });
    }
  
    const stringFields = ['username', 'password', 'firstName', 'lastName'];
    const nonStringField = stringFields.find(
      field => field in req.body && typeof req.body[field] !== 'string'
    );
  
    if (nonStringField) {
      return res.status(422).json({
        code: 422,
        reason: 'ValidationError',
        message: 'Incorrect field type: expected string',
        location: nonStringField
      });
    }

    const explicityTrimmedFields = ['username', 'password'];
    const nonTrimmedField = explicityTrimmedFields.find(
      field => req.body[field].trim() !== req.body[field]
    );
  
    if (nonTrimmedField) {
      return res.status(422).json({
        code: 422,
        reason: 'ValidationError',
        message: 'Cannot start or end with whitespace',
        location: nonTrimmedField
      });
    }
  
    const sizedFields = {
      username: {
        min: 1
      },
      password: {
        min: 6,
        max: 72
      }
    };
    const tooSmallField = Object.keys(sizedFields).find(
      field =>
        'min' in sizedFields[field] &&
              req.body[field].trim().length < sizedFields[field].min
    );
    const tooLargeField = Object.keys(sizedFields).find(
      field =>
        'max' in sizedFields[field] &&
              req.body[field].trim().length > sizedFields[field].max
    );
  
    if (tooSmallField || tooLargeField) {
      return res.status(422).json({
        code: 422,
        reason: 'ValidationError',
        message: tooSmallField
          ? `Must be at least ${sizedFields[tooSmallField]
            .min} characters long`
          : `Must be at most ${sizedFields[tooLargeField]
            .max} characters long`,
        location: tooSmallField || tooLargeField
      });
    }
  
    let {username, password, email, firstName = '', lastName = ''} = req.body;
    // Username and password come in pre-trimmed, otherwise we throw an error
    // before this
    firstName = firstName.trim();
    lastName = lastName.trim();
    console.log('here?')

    User.find({username})
      .countDocuments()
      .then(count => {
        //console.log(count)
        if (count > 0) {
          // There is an existing user with the same username
          return Promise.reject({
            code: 422,
            reason: 'ValidationError',
            message: 'Username already taken',
            location: 'username'
          });
        }
        // If there is no existing user, hash the password
        return User.hashPassword(password);
      })
      .then(hash => {
        console.log('119', hash)
        return User.create({
          username,
          password: hash,
          email,
          firstName,
          lastName
        });
      })
      .then(user => {
        console.log('129', user)
        return res.status(201).json(user.serialize());
      })
      .catch(err => {
        console.log(err)
        // Forward validation errors on to the client, otherwise give a 500
        // error because something unexpected has happened
        if (err.reason === 'ValidationError') {
          return res.status(err.code).json(err);
        }
        res.status(500).json({code: 500, message: 'Internal serverr error'});
      });
  });
  
let jwtAuth = passport.authenticate('jwt', {session: false});

router.post('/save', [jsonParser, jwtAuth], (req, res) => {
  console.log('146', req.body)
  let been = req.query.been
  //validate
  let requiredFields = ['name'];
  let missingField = requiredFields.find(field => !(field in req.body));
  if (missingField) {
    return res.status(422).json({
      code: 422,
      reason: 'ValidationError',
      message: 'Missing field',
      location: missingField
    });
  }

  let auth = req.header('Authorization')
  let token = auth.split(' ')
  let decoded = jwt.verify(token[1], JWT_SECRET)
  let username = decoded.user.username
  
  let {id, name, cuisines, address, rating} = req.body
  let rest = Restaurant.create({
    address,
    cuisines,
    name,
    rating,
    id
  })
  
  
  if (been == 'true') {
    console.log(been)
    User.findOneAndUpdate({username}, {$push: {beenTo: rest}})
    .then(saved => res.status(201).json({result: `${name} has been saved to "places you've been"`}))
    .catch(err => {
      console.error(err);
      res.status(500).json({error: 'Something went wrong'});
    });
  } else {
    console.log(been)
    User.findOneAndUpdate({username}, {$push: {toGoTo: rest}})
    .then(saved => res.status(201).json({result: `${name} has been saved to "places you want to go"`}))
    .catch(err => {
      console.error(err);
      res.status(500).json({error: 'Something went wrong'});
    });
  }
})

router.get('/feed', [jsonParser, jwtAuth], (req, res) => {
  let auth = req.header('Authorization')
  let token = auth.split(' ')
  let decoded = jwt.verify(token[1], JWT_SECRET)
  let username = decoded.user.username

  User.aggregate([
    {$match: {username: {$ne: username}}},
    //We want to show a feed of users -other- than the current user
    {$lookup: {
      from: "restaurants",
      localField: "beenTo.saved",
      foreignField: "saved",
      as: "savRest"
    }},
    {$project: {
      'savRest.saved': 1, 
      'savRest.name': 1, 
      'firstName': 1,
      'lastName': 1
    }},
    //{$limit: 5},
    //{$sort: {'beenTo.saved': -1}}
  ])
  .then(users => {
    let data = [];
    for (let j = 0; j < users.length; j++) {
      for (let i = 0; i < users[j].savRest.length; i++) {
        console.log(users[j].firstName)
        data.push({
          fullName: `${users[j].firstName} ${users[j].lastName}`,
          saved: users[j].savRest[i].saved,
          name: users[j].savRest[i].name
        })
      }
    }
    return res.status(200).json(data)
  })
  .catch(err => console.error(err))
})

router.get('/profile', jwtAuth, (req, res) => {
  let auth = req.header('Authorization')
  let token = auth.split(' ')
  let decoded = jwt.verify(token[1], JWT_SECRET)
  let username = decoded.user.username



  User.aggregate([
    {$match: {username: username}},
    {$lookup: {
      from: "restaurants",
      localField: "beenTo.saved",
      foreignField: "saved",
      as: "savRest"
    }},
    {$lookup: {
      from: "restaurants",
      localField: "toGoTo.saved",
      foreignField: "saved",
      as: "newRest"
    }},
    {$project: {
      'savRest.saved': 1, 
      'savRest.name': 1, 
      'newRest.saved': 1,
      'newRest.name': 1
    }}
  ])
  .then(user => {
    console.log(user[0]); 
    let data = []
    for (let i = 0; i < user[0].savRest.length; i++) {
      data.push({
        been: true,
        saved: user[0].savRest[i].saved,
        name: user[0].savRest[i].name
      })
    }
    for (let j = 0; j < user[0].newRest.length; j++) {
      let x = user[0].newRest[j]
      if (user[0].savRest.some(obj => obj.name == x.name)) {
        console.log('birf')
      } else {
        data.push({
          been: false,
          saved: user[0].newRest[j].saved,
          name: user[0].newRest[j].name
        })
      }
    }
    return res.status(200).json(data)
  })
  .catch(err => console.error(err))
})

router.put('/update', [jsonParser, jwtAuth], function(req, res) {
  let auth = req.header('Authorization')
  let token = auth.split(' ')
  let decoded = jwt.verify(token[1], JWT_SECRET)
  let username = decoded.user.username

  Restaurant.findOne({name: req.query.name})
  .then(function(rest) {
    return rest;
  })
  .then(function(rest) {
    User.findOneAndUpdate(
    {username: username},
    {$addToSet: {beenTo: rest}},
    {$pull: {toGoTo: rest}}
    )
  })
  .then(() => res.status(201).send('updated'))
})

router.delete('/delete', [jsonParser, jwtAuth], (req, res) => {
  let auth = req.header('Authorization')
  let token = auth.split(' ')
  let decoded = jwt.verify(token[1], JWT_SECRET)
  let username = decoded.user.username
  Restaurant.findOne({name: req.query.name})
  .then(function(rest) {
    return Restaurant.findByIdAndDelete(rest._id)
  })
  .then(() => res.status(204).send('deleted'))
})

module.exports = router