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

exports.insertApp = function*(data) {
    const sql = `
        INSERT INTO apps (user_id, name, reward, time_limit)
        VALUES ($1, $2, $3, $4)
        RETURNING *
    `;

    return yield dbUtil.queryOne(sql, [
        data.user_id, data.name, data.reward, data.time]);
};

// get session by id
exports.getSessionById = function*(sessionId) {
    const sql = `;
        SELECT * 
        FROM sessions
        WHERE id = $1 and expired_at > NOW()
    `;

    return yield dbUtil.queryOne(sql, [sessionId]);
};

exports.getUserByUserId = function*(userId) {
    const sql = `
        SELECT *
        FROM users
        WHERE users.id = $1
    `;

    return yield dbUtil.queryOne(sql, [userId]);
};

exports.getAppsByUserId = function*(userId) {
    const sql = `
        SELECT *
        FROM apps
        WHERE user_id = $1
    `;

    return yield dbUtil.queryMany(sql, [userId]);
};

exports.getLastClaim = function*(data) {
    const sql = `
        SELECT *
        FROM faucet_claims
        WHERE user_id = $1
        AND app_id = $2
        ORDER BY claimed_at DESC
        LIMIT 1
    `;
    return yield dbUtil.queryOne(sql, [data.user_id, data.app_id]);
};

exports.getTokenByTokenId = function*(tokenId) {
    const sql = `
        SELECT *
        FROM token
        WHERE id = $1
    `;

    return yield dbUtil.queryOne(sql, [tokenId]);
};

exports.updateSessionByUserId = function*(userId) {
    const sql = `
        UPDATE sessions
        SET expired_at = NOW()
        WHERE user_id = $1
        AND expired_at > NOW()
        RETURNING *
    `;

    return yield dbUtil.queryOne(sql, [userId]);
};