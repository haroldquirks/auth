"use strict";

// 3rd
const uuid = require("uuid");
// 1st
const dbUtil = require("./util");
const belt = require("./belt");

// get user record by email
exports.getUserByEmail = function*(email) {
  const sql = `
    SELECT *
    FROM users
    WHERE email = $1
  `;

  return yield dbUtil.queryOne(sql, [email]);
};

// create new user
exports.insertUser = function*(data) {
  const passwordHash = yield belt.hashPassword(data.password);

  const sql = `
    INSERT INTO users (name, email, password, site)
    VALUES ($1, $2, $3, $4)
    RETURNING *
  `;

  return yield dbUtil.queryOne(sql, [data.name, data.email, passwordHash, data.site]);
};

// create user session
exports.insertSession = function*(data) {
  const sql = `
    INSERT INTO sessions (id, user_id, ipaddress)
    VALUES ($1, $2, $3::inet)
    RETURNING *
  `;

  return yield dbUtil.queryOne(sql, [
    uuid.v4(), data.user_id, data.ipaddress]);
};