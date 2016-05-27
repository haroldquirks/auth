"use strict";

// 3rd
const bcrypt = require("bcryptjs");
const config = require("./config");
const kickbox = require("kickbox");

// Returns hashed password value to be used in `users.digest` column
// String -> String
exports.hashPassword = function(password) {
  return new Promise(function(resolve, reject) {
    bcrypt.hash(password, 4, function(err, hash) {
      if (err) return reject(err);
      resolve(hash);
    });
  });
};

// Compares password plaintext against bcrypted digest
// String, String -> Bool
exports.checkPassword = function(password, digest) {
  return new Promise(function(resolve, reject) {
    bcrypt.compare(password, digest, function(err, result) {
      if (err) return reject(err);
      resolve(result);
    });
  });
};

exports.validateEmail = function(email) {
  var kb = kickbox.client(config.KICKBOX_KEY).kickbox();

  kb.verify(email, function (err, response) {
    console.log(response);
    if(!err) {
      const disposable = response.body.disposable;
      const accept_all = response.body.accept_all;
      const success = response.body.success;
      if(!disposable && !accept_all && success) {
        return true;
      }
    }
  });
  return false;
};