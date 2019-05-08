'use strict';

const path = require('path');

class SequelizeSessionStoreException extends Error {
	constructor(message) {
		super(message);
	}
};

module.exports = (Store) => {
	class SequelizeSessionStore extends Store {
		constructor(options) {
			if (!options) {
				throw new SequelizeSessionStoreException('Options with valid sequelize instance required.');
			}
			if (!options.db) {
				throw new SequelizeSessionStoreException('No sequelize instance passed in.');
			}

			const realOptions = {
				db: options.db,
				checkExpirationInterval: options.checkExpirationInterval || 15 * 60 * 1000,
				expiration: options.expiration || 24 * 60 * 60 * 1000,
			};

			super(realOptions);

			this.options = realOptions;
			this.Session = options.db.import(path.join(__dirname, 'models', 'Session'));
			this.Session.sync();
			this.startExpiringSessions();
		}

		get(sid, callback) {
			const Session = this.Session;
			return Session
				.findByPk(sid)
				.then(session => {
					if (session && session.data) {
						return JSON.parse(session.data);
					}

					return null;
				})
				.then(session => callback(null, session))
				.catch(err => callback(err, null));
		}

		set(sid, data, callback) {
			const Session = this.Session;
			const realData = data;
			let expires = new Date(Date.now() + this.options.expiration);

			if (data.cookie && data.cookie.expires) {
				expires = data.cookie.expires;
			}

			realData.expires = expires;

			return Session.findByPk(sid)
				.then(session => {
					if (session) {
						session.data = JSON.stringify(realData);
						session.expires = expires;

						return session.save();
					}

					return Session.create({
						'session_id': sid,
						data: JSON.stringify(realData),
						expires: expires,
					});
				})
				.then(session => session.data)
				.then(data => callback(null, data))
				.catch(err => callback(err, null));
		}

		destroy(sid, callback) {
			const Session = this.Session;
			return Session.findByPk(sid)
				.then(session => {
					if (session) {
						return session.destroy();
					}

					return null;
				})
				.then(() => callback(null))
				.catch(err => callback(err));
		}

		touch(sid, data, callback) {
			const Session = this.Session;
			let expires = new Date(Date.now() + this.options.expiration);

			if (data.cookie && data.cookie.expires) {
				expires = data.cookie.expires;
			}

			return Session.update({
				expires,
			}, {
				where: {
					'session_id': sid,
				},
			})
			.then(() => callback(null, null))
			.catch(err => callback(err, null));
		}

		startExpiringSessions() {
			this._expirationInterval = setInterval(this.clearExpiredSessions.bind(this),
      				this.options.checkExpirationInterval);
		}

		clearExpiredSessions() {
			this.Session.destroy({
				where: {
					expires: {
						lt: new Date()
					}
				}
			});
		}
	};

	return SequelizeSessionStore;
};