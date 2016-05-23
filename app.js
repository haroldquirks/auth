"use strict";

// 3rd party
const koa = require("koa");
const bouncer = require("koa-bouncer");
const session = require("koa-session");
const _ = require("lodash");

const config = require("./config");
const db = require("./db");

const app = koa();

// session key
app.keys = ["a dummy key"];
app.use(require("koa-body")({ multipart: true }));
app.use(session(app));
app.use(bouncer.middleware());

app.use(function*(next) {
	let urlList = [
		"/api/login",
		"/api/login/",
		"/api/register",
		"/api/register/"
	];

	// check if url target is on the urlList
	if(_.includes(urlList, this.path)) {
		let sessionId = this.session.sessionId || false;
		if(sessionId) {
			let session = yield db.getSessionById(sessionId);
			if(session) {
				let response = {
					"success": true
				}
				this.type = "json";
				this.body = response;
				return;
			} 
		}
	}

	yield next;
});

// routes
app.use(require("./route").routes());

// run server
app.listen(config.PORT, function() {
  console.log("Listening on port", config.PORT);
});