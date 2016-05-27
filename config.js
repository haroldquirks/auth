"use strict";
// Ensure require("dotenv").config() is run before this module is required

exports.PORT = Number.parseInt(process.env.PORT, 10) || 3000;
exports.DATABASE_URL = process.env.DATABASE_URL || "postgres://harold:Anonymous21@localhost:5432/auth";
exports.KICKBOX_KEY = "0f88821e4913b5f075d72b4b1490c48abfcffb40813c5c7c8d72c7ecf135fe64";