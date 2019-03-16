let chai = require('chai')
let chaiHttp = require('chai-http')
let faker = require('faker')
let mongoose = require('mongoose')
let jwt = require('jsonwebtoken')
let zipcodes = require('zipcodes')
let random = require('random-world');
let supertestRequest = require('supertest')
let superagentRequest = require('superagent');

let expect = chai.expect

let {Restaurant, User} = require('../models')
let {app, runServer, closeServer} = require('../server');
//let config = require('../config');
let {TEST_DATABASE_URL} = require('../config');
let {JWT_SECRET} = require('../config');

chai.use(chaiHttp)

/* function seedUserData() {
    console.log('seeding User data')
    let seedData = []
    for (let i=0; i<1; i++) {
        seedData.push(generateUserData())
    }
    console.log(seedData)
    return User.insertMany(seedData)
} */

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
        ],
        toGoTo: [
            generateRestaurantData(),
            generateRestaurantData(),
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

let token = ''
let data = {}
describe('endpoints', function() {
    before(function() {
        return runServer(TEST_DATABASE_URL)
    })

    beforeEach(function() {
        this.timeout(10000)
        data.username = faker.internet.userName()
        data.password = faker.internet.password()
        return chai.request(app)
        .post('/users/signup')
        .set({
            //'Accept': 'application/json',
            'Content-Type': 'application/json'
        })
        .send(JSON.stringify({
            firstName: faker.name.firstName(),
            lastName: faker.name.lastName(),
            username: data.username,
            email: faker.internet.email(),
            password: data.password
        }))
        .then(function(res) {
            console.log('Yo!')
            expect(res).to.have.status(201)
            expect(res).to.be.json
            expect(res.body).to.be.an('object')
            expect(res.body).to.include.keys('name', 'username', 'beenTo', 'toGoTo')
            return res
        })
        .then(function() {
            return chai.request(app)
            .post('/auth/login')
            .send({
                username: data.username,
                password: data.password
            })
            .then(function(res) {
                //console.log('109', res)
                expect(res).to.have.status(200)
                expect(res).to.have.cookie('token')
                //console.log('132', res.body.authToken)
                token = res.body.authToken
                return token
            })
            .then(function(token) {
                let decoded = jwt.verify(token, JWT_SECRET)
                expect(decoded).to.exist
            })
            .catch(err => console.error(err))
        })
        .catch(err => console.error(err)) 
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

/*     describe('signup', function() {
        it('should add a user to the database', function() {
            let newUser = generateUserData()
            //console.log(newUser)
            return chai.request(app)
            .post('/users/signup').send(newUser)
            .then(function(res) {
                expect(res).to.have.status(201)
                expect(res).to.be.json
                expect(res.body).to.be.an('object')
                expect(res.body).to.include.keys('name', 'username', 'beenTo', 'toGoTo')
                expect(res.body.name).to.equal(`${newUser.lastName}`)
                expect(res.body.username).to.equal(newUser.username)
                expect(res.body.beenTo).to.equal(newUser.beenTo.length)
                expect(res.body.toGoTo).to.equal(newUser.toGoTo.length)
            })
        })
    }) */

/*     describe('login', function() {
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
                return res.cookie
            })
            .then(function(cookie) {
                console.log('153', cookie)
                //verify token
            })
        })
    }) */

    describe('refresh', function() {
        it('should give the user a new token', function() {
            return chai.request(app)
            .post('/auth/refresh')
            .set('Authorization', `Bearer ${token}`)
            .send({})
            .then(function(res) {
                expect(res).to.have.status(200)
                expect(res).to.be.json
                expect(res.body).to.be.an('object')
                expect(res.body).to.include.keys('authToken')
                //expect(res.body.authToken).to.not.equal(token)
                return res.body.authToken
            })
            .then(function(authToken) {
                let decoded = jwt.verify(authToken, JWT_SECRET)
                let oldToken = jwt.verify(token, JWT_SECRET)
                //console.log('218', decoded)
                expect(decoded).to.exist
                expect(decoded.exp).to.be.gte(oldToken.exp)
            })
        })
    })

    describe('search', function() {
        it('should give results when searching by city', function() {
            let res
            this.timeout(5000)
            let city = random.city('USA')
            return chai.request(app)
            .get(`/search?location=${city}`)
            .set('Authorization', `Bearer ${token}`)
            .then(function(_res) {
                res = _res
                expect(res).to.have.status(200)
                expect(res.body).to.be.an('array')
                expect(res.body).to.have.lengthOf.at.least(1)
                expect(res.body[0]).to.be.an('object')
                expect(res.body[0]).to.include.keys("id", "name", "address", "cuisines", "user_rating")
            })
        })
        it('should give results when searching by zipcode', function() {
            let res
            this.timeout(5000)
            let zipcode = zipcodes.random().zip
            while (zipcode.length !== 5) {
                zipcode = zipcodes.random().zip
            }
            console.log('249', zipcode.length)
            return chai.request(app)
            .get(`/search?location=${zipcode}`)
            .set('Authorization', `Bearer ${token}`)
            .then(function(_res) {
                res = _res
                expect(res).to.have.status(200)
                expect(res.body).to.be.an('array')
                expect(res.body).to.have.lengthOf.at.least(1)
                expect(res.body[0]).to.be.an('object')
                expect(res.body[0]).to.include.keys("id", "name", "address", "cuisines", "user_rating")
            })
        })
    })

    describe('save', function() {
        it('should create a new restaurant in the collection', function() {
            //let res
            let been = (Math.random() < 0.5)
            return chai.request(app)
            .post(`/users/save?been=${been}`)
            .set('Authorization', `Bearer ${token}`)
            .send({
                id: faker.random.number(),
                name: `${faker.name.firstName()}'s Eatery`,
                cuisines: faker.address.country(),
                address: faker.address.streetAddress(),
                rating: faker.commerce.productAdjective(),
            })
            .then(function(res) {
                expect(res).to.have.status(201)
                expect(res).to.be.json
                expect(res.body).to.be.an('object')
                expect(res.body).to.include.keys('result')
            })
        })
        it('should increase the user\'s arrays beenTo OR toGoTo by one', function() {
            let been = (Math.random() < 0.5)
            return chai.request(app)
            .post(`/users/save?been=${been}`)
            .set('Authorization', `Bearer ${token}`)
            .send({
                id: faker.random.number(),
                name: `${faker.name.firstName()}'s Eatery`,
                cuisines: faker.address.country(),
                address: faker.address.streetAddress(),
                rating: faker.commerce.productAdjective(),
            })
            .then(function() {
                return User.findOne({username: data.username})
            })
            .then(function(user) {
                expect(user.beenTo.length + user.toGoTo.length).to.equal(1)
            })
        })
    })

    describe('profile', function() {
        it('should return the loggedin profile\'s data', function() {
            return chai.request(app)
            .get('/users/profile')
            .set('Authorization', `Bearer ${token}`)
            .then(function(res) {
                expect(res).to.have.status(200)
            })
        })
    })

    describe('feed', function() {
        it('should return data from all other profiles', function() {
            return chai.request(app)
            .get('/users/feed')
            .set('Authorization', `Bearer ${token}`)
            .then(function(res) {
                expect(res).to.have.status(200)
            })
        })
    })  
})