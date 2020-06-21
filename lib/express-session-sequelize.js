'use strict';

const path = require('path');

// sequelize operators
const Op = {
  eq: Symbol.for('eq'),
  ne: Symbol.for('ne'),
  gte: Symbol.for('gte'),
  gt: Symbol.for('gt'),
  lte: Symbol.for('lte'),
  lt: Symbol.for('lt'),
  not: Symbol.for('not'),
  is: Symbol.for('is'),
  in: Symbol.for('in'),
  notIn: Symbol.for('notIn'),
  like: Symbol.for('like'),
  notLike: Symbol.for('notLike'),
  iLike: Symbol.for('iLike'),
  notILike: Symbol.for('notILike'),
  startsWith: Symbol.for('startsWith'),
  endsWith: Symbol.for('endsWith'),
  substring: Symbol.for('substring'),
  regexp: Symbol.for('regexp'),
  notRegexp: Symbol.for('notRegexp'),
  iRegexp: Symbol.for('iRegexp'),
  notIRegexp: Symbol.for('notIRegexp'),
  between: Symbol.for('between'),
  notBetween: Symbol.for('notBetween'),
  overlap: Symbol.for('overlap'),
  contains: Symbol.for('contains'),
  contained: Symbol.for('contained'),
  adjacent: Symbol.for('adjacent'),
  strictLeft: Symbol.for('strictLeft'),
  strictRight: Symbol.for('strictRight'),
  noExtendRight: Symbol.for('noExtendRight'),
  noExtendLeft: Symbol.for('noExtendLeft'),
  and: Symbol.for('and'),
  or: Symbol.for('or'),
  any: Symbol.for('any'),
  all: Symbol.for('all'),
  values: Symbol.for('values'),
  col: Symbol.for('col'),
  placeholder: Symbol.for('placeholder'),
  join: Symbol.for('join')
};

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
			this.Session = require(path.join(__dirname, 'models', 'Session'))(options.db)
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

		getAll(callback) {
			const Session = this.Session;
			return Session
				.findAll()
				.then(sessions => sessions.map((session) => session.toJSON()))
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
			return this.Session.destroy({
				where: {
					expires: {
						[Op.lt]: new Date()
					}
				}
			});
		}
	};

	return SequelizeSessionStore;
};
