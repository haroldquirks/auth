"use strict";

exports.ensureAuth = function*(next) {
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
  yield* next;
}
