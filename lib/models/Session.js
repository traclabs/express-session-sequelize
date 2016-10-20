module.exports = (sequelize, DataTypes) => {
	return sequelize.define('Session', {
		'session_id': {
			type: DataTypes.STRING(32),
			primaryKey: true,
		},
		expires: DataTypes.DATE,
		data: DataTypes.TEXT,
	});
};