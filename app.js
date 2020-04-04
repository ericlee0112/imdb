const express = require('express');
const bodyParser = require('body-parser');
const exphb = require('express-handlebars');
const method = require('method-override');
const dotenv = require('dotenv');
const redis = require('redis');

dotenv.config();

const app = express();

// bodyParser to handle request data
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// set up handlebars, a handlebars file named main will be the default layout
app.engine('handlebars', exphb({ defaultLayout: 'main'}));
app.set('view engine', 'handlebars');

// set up to use delete method from forms which by default is not available
app.use(method('_method'));

app.listen(process.env.PORT, () => {
    console.log("server started at port: " + process.env.PORT);
});

// set up redis client
const client = redis.createClient(6379, 'localhost');

client.on('connect', function() {
    console.log('connected to redis');
})

/*  endpoints  */

app.get('/', function(req, res) {
    res.render('search')
});

app.get('/movie/add', function(req, res) {
    res.render('addfilm');
});

app.post('/movie/add', function(req,res) {
    let id = req.body.id;
    let movieName = req.body.movieName;
    let director = req.body.director;
    let yearOfRelease = req.body.yearOfRelease;
    let imdbLink = req.body.imdbLink;
    let myRating = req.body.myRating;

    client.hmset(id, [
        'movieName', movieName,
        'director', director,
        'yearOfRelease', yearOfRelease,
        'imdbLink', imdbLink,
        'myRating', myRating
    ], function(err, obj) {
        if(err) {
            console.log(err);
        } else {
            console.log(obj);
            res.redirect('/');
        }
    });

});

app.post('/movie/search', function(req, res) {
    let id = req.body.id;

    client.hgetall(id, function(err, obj) {
        if(!obj) {
            res.render('search', {
                error: 'Movie does not exist'
            });
        } else {
            obj.id = id;
            res.render('details', {
                movie: obj
            });
        }
    });
});

app.delete('/movie/delete/:id', function(req, res) {
    console.log(req.params.id);
    client.del(req.params.id);
    res.redirect('/');
})