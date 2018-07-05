const express = require('express');
const MongoClient = require('mongodb').MongoClient;
const util = require('util');
const { from } = require('rxjs');
const { map, filter } = require('rxjs/operators');

var app = express();
var bodyParser = require('body-parser');

var port = 9090;
var router = express.Router();
var url = 'mongodb://localhost:27017/';
var app = express();

var currentLocation = [-91.9665342, 41.017654];
var nearme = [];
function nearMe(data) {
    nearme.push(data);
}

var connection = util.promisify(MongoClient.connect)(url, { useNewUrlParser: true });

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));

router.route('/locations')
    .get((req, resp) => {
        from(connection)
            .pipe(
                map(db => db.db('locationDB'))
            )
            .subscribe(
                (dbo) => {
                    console.log('locations DB coonection success');

                    dbo.collection('locations').find({
                        location: {
                            $near: { $geometry: { type: "Point", coordinates: currentLocation }, $maxDistance: 2000 }
                        }
                    }, (err, result) => {
                        if (err) throw err;

                        result.forEach(element => {
                            // add nearby locations
                            nearMe(element);
                        });
                        resp.json({ result: nearme });
                    })
                    //db.close();
                },
                (err) => { throw err },
                () => console.log('Request handled Gracefully and Done')
            );
    })
    .post((req, resp) => {
        var name = req.body.name;
        var catagory = req.body.catagory;
        var longtide = parseFloat(req.body.longtide);
        var latitude = parseFloat(req.body.latitude);
        var obj = {
            'name': name,
            'catagory': catagory,
            'location': {
                'type': 'Point',
                'coordinates': [longtide, latitude]
            }
        };
        from(connection)
            .pipe(
                map(db => db.db('locationDB'))
            )
            .subscribe(
                (dbo) => {
                        dbo.collection('locations').insertOne(obj, (err, result) => {
                        if (err) throw err;

                        resp.json({ message: 'location added successfully' });

                    })
                    //db.close();
                },
                (err) => { throw err },
                () => console.log('Request handled Gracefully and Done')
            );
    })

app.use('/api', router);
app.listen(port);
console.log('Server started on port: ' + port);