const express = require('express');
const exphbs = require('express-handlebars');
const Handlebars = require('handlebars');
const session = require('express-session');
const configRoutes = require('./routes');

// ----------- Initialize App -----------
const app = express();


// ----------- Set up Static Folders -----------
// Set Static Public Folder
const static = express.static(__dirname + '/public');
app.use('/public', static);

// Include Bootstrap from node_modules (You don't want to expose the whole node_modules folder)
const bootstrap = express.static(__dirname + '/node_modules/bootstrap');
app.use('/bootstrap', bootstrap);

// Include jQuery from node_modules
const jquery = express.static(__dirname + '/node_modules/jquery');
app.use('/jquery', jquery);


// ----------- Middleware to Recognize JSON in Requests -----------
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// ----------- View Engine Setup: Handlebars (extension .hbs instead of .handlebars) -----------
app.engine('hbs', exphbs({ extname: 'hbs', defaultLayout: 'main', layoutsDir: __dirname + '/views/layouts', partialsDir: ['views/partials/']}));
app.set('view engine', 'hbs');


// Handlebars Helpers
Handlebars.registerHelper("contains", (arr, val) => {

    if (!Array.isArray(arr)) {
        arr = [arr]
    }
    if (arr.indexOf(val) >= 0) {
        return true;
    }

    return false;
});

Handlebars.registerHelper("containsWinner", (user, val) => {

    if (user === undefined) return false;

    let gamesWonIds = user.gamesWonIDs
    if (gamesWonIds.indexOf(val) >= 0) {
        return true;
    }

    return false;
});

Handlebars.registerHelper('isdefined', function (value) {
    return value !== undefined;
});

Handlebars.registerHelper("increment", function(value, options)
{
    return parseInt(value) + 1;
});


// ----------- Express Session Middleware -----------
app.use(session({
    name: 'AuthCookie',
    secret: 'This is the secret used for encrypting cookies! Do not disclose this to anyone!.',
    resave: false,
    saveUninitialized: true
}))


// ----------- Custom Middleware -----------

// Logging requests to console
app.use(async (req, res, next) => {
    let { method, originalUrl } = req;
    let timeStamp = new Date().toUTCString();
    let auth = '(Non-Authenticated User)';
    if (req.session.user) auth = '(Authenticated User)';

    console.log(`[${timeStamp}]: ${method} ${originalUrl} ${auth}`)

    next();
});

// Must authenticate to get to dashboard
app.use('/dashboard', (req, res, next) => {
    if (!req.session.user) {
        return res.status(403).render('error', {
            title: 'Error',
            layout: 'navnolinks',
            error: 'The user is not logged in'
        });
    } else {
        next();
    }
});


// ----------- Configure Routing from ./routes -----------
configRoutes(app);

app.listen(3000, () => {
    console.log("Server running.");
    console.log('Routes will be running on http://localhost:3000');
});
