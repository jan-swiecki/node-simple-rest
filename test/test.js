var assert = require("assert");
var rest = require("../index.js");
var request = require("supertest");
var util = require('util');

var PORT = 3030;
var HOST = "localhost";
var SERVER_URL = "http://"+HOST+":"+PORT;

function req() {
	return request(SERVER_URL);
}

function randomInt(low, high) {
	return Math.floor(Math.random() * (high - low) + low);
}

describe('Array', function() {
	describe('#indexOf()', function () {
		it('should return -1 when the value is not present', function () {
			assert.equal(-1, [1,2,3].indexOf(5));
			assert.equal(-1, [1,2,3].indexOf(0));
		});
	});

	describe('#indexOf() 2', function () {
		it('should return -1 when the value is not present', function(done) {
			assert.equal(-1, [1,2,3].indexOf(5));
			assert.equal(-1, [1,2,3].indexOf(0));
			done();
		});
	});
});


describe('REST server', function(){
	//var Rest;
	before(function(done){
		//RestPromise.then(function(r){
		//	rest = r;
		//rest.injector.importPaths.push("../lib/");
		rest.port(PORT);
		rest.start();
		registerEndpoints(rest);
		done();
		//})
	});

	after(function(){
		rest.stop();
	});

	describe('GET /test', function(){
		it('respond with text/plain and content', function(done){
			request(rest.server)
				.get('/test')
				.expect('Content-Type', 'text/plain')
				.expect(200, 'return text/plain string', done);
		});
	});

	describe('GET /not-found', function(){
		it('respond with 404 status code', function(done){
			request(rest.server)
				.get('/not-found')
				.expect(404, done);
		});
	});

	describe('GET /not-found2', function(){
		it('respond with 404 status code', function(done){
			request(rest.server)
				.get('/not-found2')
				.expect(404, done);
		});
	});

	describe('GET /not-found3', function(){
		it('respond with 404 status code', function(done){
			request(rest.server)
				.get('/not-found3')
				.expect(404, done);
		});
	});

	describe('GET /user/:id/:property', function(){
		it('should wire path variables', function(done){
			var id = randomInt(0,10000);
			var property = randomInt(0,10000)+"xyz";
			request(rest.server)
				.get('/user/'+id+'/'+property)
				.expect('Content-Type', 'text/plain')
				.expect(200, id+", "+property, done);
		});
	});

	describe('GET /object', function(){
		it('should return object', function(done){
			req()
				.get('/object')
				.expect('Content-Type', 'application/json')
				.expect(200, {msg: "return as application/json"}, done);
		});
	});

	describe('GET /pdf', function(){
		it('should return application/pdf', function(done){
			req()
				.get('/pdf')
				.expect('Content-Type', 'application/pdf')
				.expect(200, done);
		});
	});

	describe('POST /post', function(){
		it('should return "why" with custom content type', function(done){
			req()
				.post('/post')
				.expect('Content-Type', 'non/existent')
				.expect(200, "why", done);
		});
	});

	describe('GET /file', function(){
		it('should download package json', function(done){
			// TODO
			done();
		});
	});

	describe('DELETE /file/:name', function(){
		it('should delete file', function(done){
			// TODO 404 and 200 (check status code for deleted content)
			done();
		});
	});

	describe('DELETE /fileAsync/:name', function(){
		it('should delete file', function(done){
			// TODO should do the same thing as DELETE /file/:name
			done();
		});
	});
});

// prepare error
function TestNotFoundError(message, extra) {
	Error.captureStackTrace(this, this.constructor);
	this.name = this.constructor.name;
	this.message = message;
	this.extra = extra;
};

util.inherits(TestNotFoundError, Error);

function registerEndpoints(rest){

	// Example
	// If you return string response gets Content-Type: text/plain automatically.
	rest.get("/test", function() {
		return "return text/plain string";
	});

	// Automatic variable name mapping (order of arguments in function doesn't matter)
	// e.g. /user/1/name --> 1, name
	rest.get("/user/:userId/:userProperty", function(userProperty, userId) {
		return userId+", "+userProperty;
	});

	// chaining
	rest
		// map TestNotFoundError error for 404 status
		.remapErrors(() => {
			return {
				TestNotFoundError: {status: 404, clazz: TestNotFoundError}
			}
		})
		// if you return simple object then the response
		// has Content-Type: application/json automatically
		.get("/object", function () {
			return {msg: "return as application/json"};
		})

		// automatic setting Content-Type via function name
		.get("/pdf", function asApplicationPdf() {
			return {msg: "return as application/pdf"};
		})

		// setting 404 status code
		.get("/not-found2", function returnsStatusCode() {
			return 404;
		})

		// throwing error with 404 status code
		.get("/not-found3", function() {
			throw new TestNotFoundError("Not found");
		})

		// POST
		.post("/post", function asNonExistent() {
			return "why"; // Content-Type: non/existent
		})

		// file download? no problem!
		.get("/file", function(File) {
			return File("package.json");
		})

		// auto-wire core module? not a problem!
		.delete("/file/:name", function returnsStatusCode(fs, name) {
			if(! fs.existsSync(name)) {
				return 404;
			} else {
				fs.unlinkSync(name);
				return 200;
			}
		})

		// asynchronous version of above
		// Note: if Promise is returned then framework automatically assumes
		//       asynchronous result and unpacks promise asynchronously.
		.delete("/fileAsync/:name", function returnsStatusCode(fs, name) {
			return new Promise(function(resolve, reject){
				fs.exists(name, function(exists) {

					setTimeout(function(){
						//log("Unlink "+name);
						if(! exists) {
							resolve(404);
						} else {
							fs.unlinkSync(name);
							resolve(200);
						}
					}, 1000);

				});
			});
		});
}
