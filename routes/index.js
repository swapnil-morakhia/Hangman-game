// Add all routing files to this file

const homeRoutes = require('./dashboard');
const userRoutes = require('./users');
const searchRoutes = require('./search');

const constructorMethod = (app) => {
	app.use('/', userRoutes);
	app.use('/dashboard', homeRoutes);
	app.use('/search', searchRoutes);

	app.use('*', (req, res) => {
		res.sendStatus(404);
	});
};

module.exports = constructorMethod;
