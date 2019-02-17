let chai = require('chai')
let chaiHttp = require('chai-http')

let expect = chai.expect

let {app, runServer, closeServer} = require('../server');

chai.use(chaiHttp)

describe('http', function() {
    before(function() {
        return runServer()
    })

    after(function() {
        return closeServer()
    })
    
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