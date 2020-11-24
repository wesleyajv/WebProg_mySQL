var express = require('express'),
    http = require('http'),
    os = require('os'),
    redis = require('redis');
    bluebird = require('bluebird')

var app = express();
bluebird.promisifyAll(redis);
var client = redis.createClient('6379', 'redis');

function getCounterValue(){
    var counter = client.getAsync("counter").then(function(reply) {
                                                    return reply;
                                                });

    return Promise.all([counter]);
}

app.get('/', (req,res,next) => {

    client.setnx("counter", 0);
    res.send("<h1>Homepage Redis-Covid WebApp</h1><p>Welcome on the main page.</p><p>In order to add a redis record: localhost/add/:name/:idPositive/:dateTime/:description<br>(No need to specify an id, one is automatically provided thanks to a counter on RedisDB)</p><p>In order to delete a redis record: localhost/del/:id</p><p>In order to read a record: localhost/show/:id</p><p>In order to edit a record: localhost/edit/:id/:key/:newValue</p><p><b>Example : </b>localhost/add/Wesley/2/19-11-2020/Contact_made_at_the_restaurant</p>")
});


app.get('/add/:name/:idPositive/:dateTime/:description', (req,res,next) => {


  getCounterValue().then(function(results){
      var counter = results[0];

        client.hmset("person" + counter, {ID: counter, Name: req.params.name, PositivePersonID: req.params.idPositive, Date: req.params.dateTime, Description: req.params.description}, (error, reply) => {
          if(error){
            console.log(error);
           }
          }
        );

        client.incr('counter', function(err, counter) {
            if(err) return next(err);
            console.log("Counter incremented..");
          });

        res.send("<h1>New record has been added to RedisDB</h1><p>Person " + counter + " has correctly been added to RedisDB.</p><p><b>Name:</b> " + req.params.name + "</p><p><b>ID of the person</b> " + req.params.name + " has been in contact with: " + req.params.idPositive + "</p><p><b>Date:</b> " + req.params.dateTime + "</p><p><b>Description:</b> " + req.params.description + "</p>");

  });

});

app.get('/del/:id', (req,res,next) => {

  client.del("person" + req.params.id, (error, reply) => {
    if(error){
      console.log(error);
     }
    }
  );
  res.send("<h1>Record has been successfully deleted from RedisDB</h1><p>Record <b>person" + req.params.id + "</b> removed.</p>");
});

app.get('/show/:id', (req,res,next) => {

  client.hgetall("person" + req.params.id, (error, reply) => {
    if(error){
      console.log(error);
     } else {
       res.send(reply);
     }
    }
  );
});

app.get('/edit/:id/:key/:newValue', (req,res,next) => {

  client.hset("person" + req.params.id, req.params.key, req.params.newValue, (error, reply) => {
    if(error){
      console.log(error);
     }
    }
  );
   res.send("<h1>Record has been successfully been modified from RedisDB</h1><p>Record <b>person" + req.params.id + "</b> was edited.</p><p>Key changed: <b>" + req.params.key + "</b></p><p>New value: <b>" + req.params.newValue + "</b></p>");

});


http.createServer(app).listen(process.env.PORT || 8080, function() {
  console.log('Listening on port ' + (process.env.PORT || 8080));
});
