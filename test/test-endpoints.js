let chai = require('chai')
let chaiHttp = require('chai-http')
let faker = require('faker')
let mongoose = require('mongoose')
let jwt = require('jsonwebtoken');

let expect = chai.expect

let {Restaurant, User} = require('../models')
let {app, runServer, closeServer} = require('../server');
let config = require('../config');
//let {TEST_DATABASE_URL} = require('../config');

chai.use(chaiHttp)

function seedUserData() {
    console.log('seeding User data')
    let seedData = []
    for (let i=0; i<10; i++) {
        seedData.push(generateUserData())
    }
    return User.insertMany(seedData)
}

function generateUserData() {
    return {
        firstNane: faker.name.firstName(),
        lastName: faker.name.lastName(),
        username: faker.internet.userName(),
        email: faker.internet.email(),
        password: faker.internet.password(),
        beenTo: [ 
            generateRestaurantData(),
            generateRestaurantData(),
            generateRestaurantData(),
            generateRestaurantData(),
            generateRestaurantData()
        ],
        toGoTo: [
            generateRestaurantData(),
            generateRestaurantData(),
            generateRestaurantData(),
            generateRestaurantData(),
            generateRestaurantData()
        ]
    }
}

function generateRestaurantData() {
    return {
        address: faker.address.streetAddress(),
        cuisines: faker.address.country(),
        name: faker.company.companyName(),
        rating: faker.commerce.productAdjective(),
        restId: faker.random.number(),
        saved: faker.date.recent()
    }
}

function tearDownDb() {
    console.log('deleting db')
    return mongoose.connection.dropDatabase()
}

describe('endpoints', function() {
    before(function() {
        return runServer(config.TEST_DATABASE_URL)
    })

    beforeEach(function() {
        return seedUserData()
    })

    afterEach(function() {
        return tearDownDb()
    })

    after(function() {
        return closeServer()
    })
    
    describe('/', function() {
        it('should return a 200 status', function() {
            let res
            return chai.request(app)
            .get('/')
            .then(function(_res) {
                res = _res
                expect(res).to.have.status(200)
            })
        })
    })

    describe('signup', function() {
        it('should add a user to the database', function() {
            let newUser = generateUserData()
            console.log(newUser)
            return chai.request(app)
            .post('/signup').send(newUser)
            .then(function(res) {
                expect(res).to.have.status(201)
                expect(res).to.be.json
                expect(res.body).to.be.an('object')
                expect(res.body).to.include.keys('name', 'username', 'beenTo', 'toGoTo')
                expect(res.body.name).to.equal(`${newUser.firstNane} ${newUser.lastName}`)
                expect(res.body.username).to.equal(newUser.username)
                expect(res.body.beenTo).to.equal(newUser.beenTo.length)
                expect(res.body.toGoTo).to.equal(newUser.toGoTo.length)
            })
        })
    })

    describe('login', function() {
        it('should return a json web token', function() {
            User.findOne()
            .then(function(user) {
                return chai.request(app)
                .post('/auth/login')
                .send({
                    username: user.username,
                    password: user.password
                })
            })
            .then(function(res) {
                expect(res).to.have.status(200)
                expect(res).to.have.cookie('token')
            })
            .then(function() {
                //verify token
            })
        })
    })

    describe('refresh', function() {
        it('should give the user a new token', function() {
            return chai.request(app)
            .post('/auth/refresh')
            .set('Authorization', `Bearer ${token}`)
        })
    })

    describe('search', function() {
        it('should give results when searching by city', function() {
            f
        })
        it('should give results when searching by zipcode', function() {

        })
    })

    describe('save', function() {
        it('should create a new restaurant in the collection', function() {

        })
        it('should increase the user\'s arrays beenTo OR toGoTo by one', function() {

        })
    })

    describe('profile', function() {
        it('should return the loggedin profile\'s data', function() {

        })
    })

    describe('feed', function() {
        it('should return data from all other profiles', function() {

        })
    })
})