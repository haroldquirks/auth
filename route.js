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

router.post("/api/claim", function*() {
	// response object
	let response = {}
	response["success"] = true;
	response["error"] = {};

	// set response to json
	this.type = "json";

	// validate data and try/catch for handling thrown errors during validation
	try {
		// validate app id
		this.validateBody("appid")
	    .required("App is required")
	    .isString()
	    .checkPred(s => s.length > 0, "App is required")
	    .check(yield db.getAppByAppId(this.vals.appid), "App is invalid.")

	    // validate user id
		this.validateBody("userid")
	    .required("User is required")
	    .isString()
	    .check(yield db.getUserByUserId(this.vals.userid), 'User is invalid');

	    // validate token
		this.validateBody("tokenid")
	    .isString("Token is required")
	    .isString()
	    .check(yield db.getTokenByTokenId(this.vals.tokenid), 'Token is invalid');

	    const app_id = this.vals.appid;
	    const user_id = this.vals.userid;

	    // get validated data and put into data object
		let data = {}
		data["app_id"] = app_id;
		data["user_id"] = user_id;

		// get app by app id
		const app = yield db.getAppByAppId(app_id);

		// get last claim time with app id and user id
		const claim = yield db.getLastClaim(data);
		
		// if claim is not defined check the time last claim
		if(claim) {
			// convert to unix epoch timestamp equivalent to time() in php
			// lastclaim time + dispense time
			const lastClaim = Math.floor(new Date(claim.claimed_at).getTime()/1000) + app.time_limit;
			const now = Math.floor(new Date().getTime()/1000);

			// if true user is not yet allowed to claim
			if(lastClaim > now) {
				throw Error("Not yet available to claim.");
			} 
		} 
		// user not have claimed yet and is available to claim to be generic than putting it in every else above
		let faucetData = {};
		faucetData["user_id"] = user_id;
		faucetData["app_id"] = app_id;
		faucetData["amount"] = app.reward
		yield db.insertFaucetClaim(faucetData);
	} catch(err) {
		response["success"] = false;
		response["error"]["message"] = err.message;
		this.body = response;
		return;
	}
	
	this.body = response;
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

	// validate data and try/catch for handling thrown errors during validation
	try {
		this.validateBody("appid")
	    .required("App is required")
	    .isString()
	    .checkPred(s => s.length > 0, "App is required")
	    .check(yield db.getAppByAppId(this.vals.appid), "App is invalid.")

	    // validate user id
		this.validateBody("userid")
	    .required("User is required")
	    .isString()
	    .check(yield db.getUserByUserId(this.vals.userid), 'User is invalid');

	    // validate token
		this.validateBody("tokenid")
	    .isString("Token is required")
	    .isString()
	    .check(yield db.getTokenByTokenId(this.vals.tokenid), 'Token is invalid');
	} catch(err) {
		this.body = err.message;
		return;
	}

    const app_id = this.vals.appid;
    const user_id = this.vals.userid;

    // get validated data and put into data object
	let data = {}
	data["app_id"] = app_id;
	data["user_id"] = user_id;

	// get last claim time with app id and user id
	const claim = yield db.getLastClaim(data);

	// get app by app id
	const app = yield db.getAppByAppId(app_id);

	const intervalTime = app.time_limit;
	const time = belt.secondsToTime(intervalTime);
	let remClaimTime = 0;
	if(claim) {
		let lastClaimDate = claim.claimed_at;
		const currDate = new Date();
		lastClaimDate.setSeconds(lastClaimDate.getSeconds() + intervalTime);
		remClaimTime = Math.floor(( (lastClaimDate.getTime() - currDate.getTime()) /1000));
	}
	
	console.log(remClaimTime);

	yield this.render('widget', {
	    ctx: this,
	    intervalTime: intervalTime,
	    remClaimTime: remClaimTime
	});
});

module.exports = router;
