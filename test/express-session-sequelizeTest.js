'use strict';
const path = require('path');
const fs = require('fs');

const expect = require('chai').expect;
const assert = require('chai').assert;
const Sequelize = require('sequelize');
const expressSession = require('express-session');

const expressSessionSequelize = require('../lib/express-session-sequelize');

const db = new Sequelize('test', 'test', 'test', {
	host: 'localhost',
	dialect: 'sqlite',
	storage: path.join(__dirname, 'test.sqlite'),
	logging: false,
});

describe('express-session-sequelize', () => {
	it('is defined', () => {
		assert.isDefined(expressSessionSequelize);
	});

	it('can be instanciated', () => {
		const SessionStore = expressSessionSequelize(expressSession.Store);
		assert.isDefined(SessionStore);
		const sessionStore = new SessionStore({db});
		assert.isDefined(sessionStore);
	});

	it('throws exception if no sequelize instance is passed in', () => {
		const SessionStore = expressSessionSequelize(expressSession.Store);
		expect(() => new SessionStore({})).to.throw('No sequelize instance passed in.');
	});

	it('throws exception if no options passed in', () => {
		const SessionStore = expressSessionSequelize(expressSession.Store);
		expect(() => new SessionStore()).to.throw('Options with valid sequelize instance required.');
	});

	describe('#get()', () => {
		const SessionStore = expressSessionSequelize(expressSession.Store);
		let sessionStore = null;

		beforeEach(() => {
			sessionStore = new SessionStore({db});
			return sessionStore.Session.findOrCreate({
				where: {
					'session_id': 'test777',
					data: JSON.stringify({expected: 'data'})
				}
			});
		});

		afterEach(() => {
			sessionStore = new SessionStore({db});
			return sessionStore.Session.destroy({
				where: {
					'session_id': 'test777',
				}
			});
		});

		it('is defined', () => {
			assert.isDefined(sessionStore.get);
		});

		it('gets session data from session model', done => {
			const expectedData = JSON.stringify({expected: 'data'});
			sessionStore.get('test777', (err, data) => {
				expect(err).to.be.null;
				expect(data).to.deep.equal({expected: 'data'});
				done();
			});
		});
	});

	describe('#getAll()', () => {
		const SessionStore = expressSessionSequelize(expressSession.Store);
		let sessionStore = null;

		beforeEach(() => {
			sessionStore = new SessionStore({db});
			return sessionStore.Session.findOrCreate({
				where: {
					'session_id': 'test777',
					data: JSON.stringify({expected: 'data'}),
				}
			});
		});

		afterEach(() => {
			sessionStore = new SessionStore({db});
			return sessionStore.Session.destroy({
				where: {
					'session_id': 'test777',
				}
			});
		});

		it('is defined', () => {
			assert.isDefined(sessionStore.getAll);
		});

		it('gets all sessions', () => {
			return sessionStore.getAll((err, sessions) => {
				expect(err).to.be.null;
				expect(sessions.length).to.equal(1);
			});
		});
	});

	describe('#set()', () => {
		const SessionStore = expressSessionSequelize(expressSession.Store);
		let sessionStore = null;

		beforeEach(() => {
			sessionStore = new SessionStore({db});
			return sessionStore.Session.destroy({
				where: {
					'session_id': 'test777',
				}
			});
		});

		afterEach(() => {
			sessionStore = new SessionStore({db});
			return sessionStore.Session.destroy({
				where: {
					'session_id': 'test777',
				}
			});
		});

		it('is defined', () => {
			assert.isDefined(sessionStore.set);
		});

		it('creates a session model from input data', () => {
			return sessionStore.set('test777', {}, () => {})
				.then(() => sessionStore.Session.findByPk('test777'))
				.then(session => expect(session).to.not.equal.null);
		});
	});

	describe('#destroy()', () => {
		const SessionStore = expressSessionSequelize(expressSession.Store);
		let sessionStore = null;

		beforeEach(() => {
			sessionStore = new SessionStore({db});
			return sessionStore.Session.findOrCreate({
				where: {
					'session_id': 'test777',
					data: JSON.stringify({expected: 'data'})
				}
			});
		});

		afterEach(() => {
			sessionStore = new SessionStore({db});
			return sessionStore.Session.destroy({
				where: {
					'session_id': 'test777',
				}
			});
		});

		it('is defined', () => {
			assert.isDefined(sessionStore.destroy);
		});

		it('removes session with matching session_id from database', () => {
			return sessionStore.destroy('test777', () => {})
				.then(() => sessionStore.Session.findByPk('test777'))
				.then(session => expect(session).to.equal.null);
		});
	});

	describe('#touch()', () => {
		const SessionStore = expressSessionSequelize(expressSession.Store);
		let sessionStore = null;

		beforeEach(() => {
			sessionStore = new SessionStore({db});
			return sessionStore.Session.findOrCreate({
				where: {
					'session_id': 'test777',
					data: JSON.stringify({expected: 'data'})
				}
			});
		});

		afterEach(() => {
			sessionStore = new SessionStore({db});
			return sessionStore.Session.destroy({
				where: {
					'session_id': 'test777',
				}
			});
		});

		it('is defined', () => {
			assert.isDefined(sessionStore.touch);
		});

		it('updates expiration date of session', () => {
			return sessionStore.touch('test777', {}, () => {})
				.then(() => sessionStore.Session.findByPk('test777'))
				.then(session => expect(session).to.have
					.property('expires').and.to.be.greaterThan(Date.now()));
		});
	});

	describe('#clearExpiredSessions()', () => {
		const SessionStore = expressSessionSequelize(expressSession.Store);
		let sessionStore = null;

		beforeEach(() => {
			sessionStore = new SessionStore({db});
			return sessionStore.Session.findOrCreate({
				where: {
					'session_id': 'test777',
					data: JSON.stringify({expected: 'data'}),
					expires: (new Date() - 1000),
				}
			});
		});

		afterEach(() => {
			sessionStore = new SessionStore({db});
			return sessionStore.Session.destroy({
				where: {
					'session_id': 'test777',
				}
			});
		});

		it('is defined', () => {
			assert.isDefined(sessionStore.clearExpiredSessions);
		});

		it('deletes expired sessions', () => {
			return sessionStore.clearExpiredSessions()
				.then(() => sessionStore.Session.findByPk('test777'))
				.then(session => expect(session).to.be.null);
		});
	});
});