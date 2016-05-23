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
    INSERT INTO sessions (id, user_id, ipaddress, expired_at)
    VALUES ($1, $2, $3::inet, NOW() + $4::interval)
    RETURNING *
  `;

  return yield dbUtil.queryOne(sql, [
    uuid.v4(), data.user_id, data.ipaddress, data.interval]);
};

// return boolean if session expires or not
exports.getSessionById = function*(sessionId) {
  const sql = `;
    SELECT * 
    FROM sessions
    WHERE id=$1 and expired_at >= NOW()
  `;

  return yield dbUtil.queryOne(sql, [sessionId]);
};