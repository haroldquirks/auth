"use strict";

// 3rd party
const koa = require("koa");
const bouncer = require("koa-bouncer");
const nunjucksRender = require('koa-nunjucks-render');
const session = require("koa-session");


const config = require("./config");

const app = koa();

const nunjucksOptions = {
  	ext: '.html',
};

// session key
app.keys = ["secret-key"];
app.use(require("koa-body")({ multipart: true }));
app.use(session(app));
app.use(bouncer.middleware());
app.use(nunjucksRender('views', nunjucksOptions));

// routes
app.use(require("./route").routes());

// run server
app.listen(config.PORT, function() {
  console.log("Listening on port", config.PORT);
});
