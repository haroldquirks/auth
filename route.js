"use strict";

// 3rd party
const Router = require("koa-router");
const bouncer = require('koa-bouncer');
const mw = require('./middleware.js');
const db = require("./db");
const belt = require("./belt");

// initialize
const router = new Router();
//check auth
router.use(mw.ensureAuth);

router.post("/api/login", function*() {
	// response object
	let response = {}
	response["success"] = true;
	response["error"] = {};

	// set response to json
	this.type = "json";

	// validate data and try/catch for handling thrown errors during validation
	let user = null;
	try {
	 	// validate email
		this.validateBody("email")
	    .required("Email is required")
	    .isString()
	    .isEmail("Incorrect email format");

	    // validate email
		this.validateBody("password")
	    .required("Password is required")
	    .isString()
	    .checkPred(s => s.length > 0, "Password is required");

	    // get validated data
		let email = this.vals.email;
		let password = this.vals.password;

		// get user by email
		user = yield db.getUserByEmail(this.vals.email);

		// check if user exist
  		this.check(user, "Incorrect email and password");

  		// check if password match
  		this.check(yield belt.checkPassword(this.vals.password, user.password), "Incorrect email and password");
	} catch(err) {
		response["success"] = false;
		if (err instanceof bouncer.ValidationError) {
			response["error"]["message"] = err.message;
		} else {
			response["error"]["message"] = err;
			console.log(err);
		}
		this.body = response;
		return;
	}

	// expires any active sessions of user
	yield db.updateSessionByUserId(user.id);

	// Log them in
	const session = yield db.insertSession({
		user_id: user.id,
	    ipaddress: this.request.ip,
	    interval: "4 hours"
	});

	this.session.sessionId = session.id;
	
	this.body = response;
});


router.post("/api/register", function*() {
	// response object
	let response = {}
	response["success"] = true;
	response["error"] = {};

	// set response to json
	this.type = "json";

	// validate data and try/catch for handling thrown errors during validation
	let user = null;
	try {
		// validate name
		this.validateBody("name")
	    .required("Name is required")
	    .isString()
	    .checkPred(s => s.length > 0, "Name is required");

	    // validate email
		this.validateBody("email")
	    .required("Email is required")
	    .isString()
	    .isEmail("Incorrect email format")
	    .check(belt.validateEmail(), "Email is invalid.")
	    .checkNot(yield db.getUserByEmail(this.vals.email), 'Email is already taken');

	    // validate email
		this.validateBody("password")
	    .required("Password is required")
	    .isString()
	    .checkPred(s => s.length > 0, "Password is required");

	    // validate site
		this.validateBody("site")
	    .required("Site is required")
	    .isString()
	    .checkPred(s => s.length > 0, "Site is required");

	    // get validated data and put into data object
		let data = {}
		data["name"] = this.vals.name;
		data["email"] = this.vals.email;
		data["password"] = this.vals.password;
		data["site"] = this.vals.site;

		// create a user
		user = yield db.insertUser(data);
		// check if user exist
  		this.check(user, "Database error occured. Please try again.");
	} catch(err) {
		response["success"] = false;
		response["error"]["message"] = err.message;

		this.body = response;
		return;
	}

	// Log them in
	const session = yield db.insertSession({
		user_id: user.id,
	    ipaddress: this.request.ip,
	    interval: "4 hours"
	});

	this.session.sessionId = session.id;
	
	this.body = response;
});

router.post("/api/app", function*() {
	// response object
	let response = {}
	response["success"] = true;
	response["error"] = {};

	// set response to json
	this.type = "json";

	// validate data and try/catch for handling thrown errors during validation
	try {
		// validate name
		this.validateBody("name")
	    .required("App Name is required")
	    .isString()
	    .trim()
	    .checkPred(s => s.length > 0, "App Name is required");

	    // validate email
		this.validateBody("reward")
	    .required("Reward is required")
	    .isString()
	    .trim()
	    .isNumeric("Reward must be number only.")

	    // validate email
		this.validateBody("time")
	    .required("Timer is required")
	    .isString()
	    .trim()
	    .isNumeric("Timer must be number only")

	    // validate site
		this.validateBody("site")
	    .required("Site is required")
	    .isString()
	    .trim()
	    .checkPred(s => s.length > 0, "Site is required");

	    // get validated data and put into data object
		let data = {}
		data["name"] = this.vals.name;
		data["reward"] = this.vals.reward;
		data["time"] = this.vals.time;
		data["site"] = this.vals.site;
		data["user_id"] = this.currUser.id;

		// create app
		yield db.insertApp(data);
	} catch(err) {
		response["success"] = false;
		response["error"]["message"] = err.message;

		this.body = response;
		return;
	}
	
	this.body = response;
});

// Dashboard
router.get("/dashboard", function*() {
	const apps = yield db.getAppsByUserId(this.currUser.id);

	yield this.render('dashboard', {
	    ctx: this,
	    apps: apps
	});
});

router.get("/widget", function*() {
	const token = this.query.token;
	const referer = this.headers.referer;
	const dummyDomain = "localhost";

	if(referer != dummyDomain) {
		// response 404
		this.body = "404";
		return;
	}

	try {
		// check app token if exist
		app = yield db.getTokenByTokenId(token)

		if(!app) {
			// response 404
			this.body = "404";
			return;
		}
	} catch(err) {
		this.body = "Invalid token";
		return;
	}

	yield this.render('widget', {
	    ctx: this
	});
});

module.exports = router;
