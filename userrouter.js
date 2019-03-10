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
  
    // If the username and password aren't trimmed we give an error.  Users might
    // expect that these will work without trimming (i.e. they want the password
    // "foobar ", including the space at the end).  We need to reject such values
    // explicitly so the users know what's happening, rather than silently
    // trimming them and expecting the user to understand.
    // We'll silently trim the other fields, because they aren't credentials used
    // to log in, so it's less of a problem.
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
        console.log(count)
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
        console.log(hash)
        return User.create({
          username,
          password: hash,
          email,
          firstName,
          lastName
        });
      })
      .then(user => {
        console.log(user)
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
  console.log(req.query)
  let been = req.query.been
  console.log('146', been)
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
    console.log('174', been)
    User.findOneAndUpdate({username}, {$push: {beenTo: rest}})
    .then(saved => res.status(201).json({result: `${name} has been saved to "places you've been"`}))
    .catch(err => {
      console.error(err);
      res.status(500).json({error: 'Something went wrong'});
    });
  } else {
    console.log('182', been)
    User.findOneAndUpdate({username}, {$push: {toGoTo: rest}})
    .then(saved => res.status(201).json({result: `${name} has been saved to "places you want to go"`}))
    .catch(err => {
      console.error(err);
      res.status(500).json({error: 'Something went wrong'});
    });
  }
})

router.get('/feed', [jsonParser, jwtAuth], (req, res) => {
  //var q = models.Post.find({published: true}).sort({'date': -1}).limit(20);
/*   Restaurant
  .find()
  .sort({'saved': -1})
  .limit(20)
  .then(rest => {console.log(rest); return res.status(200).send(rest)}) */

  let auth = req.header('Authorization')
  let token = auth.split(' ')
  let decoded = jwt.verify(token[1], JWT_SECRET)
  let username = decoded.user.username

  User.aggregate([
    {$match: {username: {$ne: username}}},
    {$project: {'beenTo.saved': 1, 'username': 1}},
    {$unwind: '$beenTo'},
    //{$limit: 5},
    {$group: {_id: '$username', sav: {$push: '$beenTo.saved'}}},
    //{$sort: {'beenTo.saved': -1}}
    
  ])
  .then(users => {console.log(users); return res.status(200).json(users.map(
    function(user) {
      let data = []
      for (let i = 0; i < user.sav.length; i++) {
        console.log('borf')
        console.log(user.id)
        data.push(`${user._id} ${user.sav[i]}`)
      }
      return data
    }
    ))})
  //user._id
  //.then(users => {console.log(users); return res.status(200).json(users.map(user => ))})

/*   Instead of 
  `Model.aggregate({ $match }, {$skip })`, do 
  `Model.aggregate([{ $match }, { $skip }])` */
  
  /* User.aggregate([{$project:{'beenTo.saved': 1}}, {$unwind: '$beenTo'}, {$group: {_id: null, re: {$push: '$beenTo'}}}]) //, {$group: {_id:'a', res: {$push: 'a'}}}])
  .then(users => {console.log(users[0].re);  return res.status(200).send(users)})  */

  /* User.mapReduce(
    function() {emit(this.username, this.beenTo, this.toGoTo.saved);},
    function(key, values) {return values},
    {
      query: {$ne: {username}},
      out: "allsaved"
    }
  ) */
  //then(users => {console.log(users); return res.status(200).send(users)})

  //We want to show a feed of users -other- than the current user
  //User.where('username').ne(username).aggregate([{$unwind: '$beenTo $toGoTo'}]) //.select('username beenTo.saved toGoTo.saved')
  //.then(users => users.group())  //.sort({'saved': -1})  //select('beenTo toGoTo')
  //.then(users => {console.log(users); return res.status(200).send(users)})
})

/* User.find({'links.url':req.params.query}, function(err, foundUsers){
  // ---
}); */


// Never expose all your users like below in a prod application
  // we're just doing this so we have a quick way to see
  // if we're creating users. keep in mind, you can also
  // verify this in the Mongo shell.
router.get('/', (req, res) => {
  console.log('get users')
  User.find()
    .then(users => res.json(users.map(user => user.serialize())))
    .catch(err => res.status(500).json({message: 'Internal server error'}));
});

module.exports = router