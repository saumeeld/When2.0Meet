var express = require('express');
var bodyParser = require('body-parser');
var app = express();
var port = 8000;

app.use(bodyParser.json());       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
})); 

app.use(express.json());       // to support JSON-encoded bodies
app.use(express.urlencoded()); // to support URL-encoded bodies

app.use(express.static('./'));

app.post('/login', function (req, res){
	var email = req.body.email;
	var password = req.body.password;
	console.log(email);
	console.log(password);
});

app.listen(port, (err) => {
  if (err) {
    return console.log('something bad happened', err);
  }

  console.log(`server is listening on ${port}`);
});