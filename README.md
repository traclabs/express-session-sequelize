# express-session-sequelize
Express session store using Sequelize to persist session data.

[![npm version](https://badge.fury.io/js/express-session-sequelize.svg)](https://badge.fury.io/js/express-session-sequelize)

## Usage
The session store must first be initialized by passing in `expressSession.Store`

```javascript
const expressSession = require('express-session');
const SessionStore = require('express-session-sequelize')(expressSession.Store);
```

Then the session store instance can be created by using `new SessionStore(options)`

```javascript
const express = require('express');
const cookieParser = require('cookie-parser');
const expressSession = require('express-session');
const SessionStore = require('express-session-sequelize')(expressSession.Store);

const Sequelize = require('sequelize');
const myDatabase = new Sequelize('database', 'username', 'password', {
	host: 'localhost',
	dialect: 'mysql',
});

const sequelizeSessionStore = new SessionStore({
	db: myDatabase,
});

const app = express();

app.use(cookieParser());
app.use(expressSession({
	secret: 'keep it secret, keep it safe.',
	store: sequelizeSessionStore,
	resave: false,
	saveUninitialized: false,
}));
```

## Options
Full list of options that can be passed in while instanciating the session store.

```javascript
const options = {
	db, // Valid Sequelize instance **required
	checkExpirationInterval, // How often expired sessions are purged in milliseconds.  (Default: 15 minutes)
	expiration, // How long until inactive sessions expire in milliseconds. (Default: 24 hours)
};
```

