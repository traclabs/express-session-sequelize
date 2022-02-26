module.exports = (sequelize) => {
	const { Sequelize } = sequelize;

	return sequelize.define('Session', {
		'session_id': {
			type: Sequelize.DataTypes.STRING(32),
			primaryKey: true,
		},
		expires: Sequelize.DataTypes.DATE,
		data: Sequelize.DataTypes.TEXT,
	});
};
