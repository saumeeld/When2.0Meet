var express = require('express');
var bodyParser = require('body-parser');

var connect = require('./db/connect.js')
var Calendar = require('./db/models/Calendar.js');
var User = require('./db/models/User.js');

//create routes to make this more manageable
//use cookies so that they dont have to keep re-authorizing

connect.connectToDB(); //open connection to mongodb database

var app = express();
var port = 8000;

app.use(bodyParser.json());       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
})); 

var cookieParser = require('cookie-parser');
app.use(cookieParser());

app.set('view engine', 'ejs')

app.use(express.static('./views')); //serve static files

app.post('/signup', function (req, res){
	var email = req.body.email;
	var password = req.body.password;

	var newUser = new User({
		email: email,
		password: password,
		calendars: [],
	});

	newUser.save(function (err, data) {
		if (err) {
			console.log('Error' + err);
			return res.redirect('/signup');
		}
		else{
			console.log('Saved ', data );
			res.cookie('username', email);
			return res.render('login', {user: email});
		}
	});

});


app.post('/login', function (req, res){

	var email = req.body.email;
	var password = req.body.password;

	res.cookie('username', email);

	User.findOne( {'email': email,'password':password }, function(err, user) {
 		if (user) {
 	   		return res.render('login', {user: email});
   	    } else {
   	 		return res.send("Incorrect Information, go back and try again");
    	}
	});	
});

app.get('/manage', function (req, res){
	var user = req.cookies.username;

	User.findOne({
		'email': user
		}, function(err, user) {
 		if (user) {
 			console.log(user);

 			var calendars = user.calendars;
 			var titles = [];

 			for (var i = 0; i < calendars.length; i++){
 				Calendar.findOne({_id:calendars[i]}, function (err, calendar){
 					titles.push(calendar.Title);
 					if (titles.length === calendars.length){
 						return res.render('manage', {calendar_names: titles, calendar_ids: calendars});
 					}
 				});
 			}


   	    } else {
   	 		res.send("error page");
    	}
	});	


});



app.post('/setTimes', function (req, res) {
	console.log('here');

	User.findOne({
	'email': req.cookies.username
	}, function(err, user) {
		if (user) {
	   		console.log("found username");
	    } else {
	 		res.send("User does not exist");
	}
	});	

	
	var newCalendar = new Calendar({
		Title: req.body.event_title,
		participants: [{user: req.cookies.username , dates : []}],
	});

	newCalendar.available_dates = req.body.dates;



	console.log(newCalendar);

	newCalendar.save(function (err, calendar) {
		if (err) {
			console.log('Error' + err);
		}
		else {
			console.log('Saved ', calendar);

			User.findOneAndUpdate({
				'email': req.cookies.username},{$push: {calendars: calendar.id}}, {safe: true, upsert: true}, function(err, user) {
		 			if (err){
		 				console.log(err);
		 				console.log('ERROR:140');
		 				return res.send("error adding user to calendar");
		 			}
		 			else {
		 				return res.render('setTimes', {dates: req.body.dates, calendar_id:calendar.id, participants: {}});
		 			}
			});	
		}
	});

	console.log(req.body.dates);

	
});


app.get("/load_calendar/:calendar_id", function (req, res){
	var calendar_id = req.params.calendar_id;

	Calendar.findOne({_id:calendar_id}, function (err, calendar){
		var pdates = calendar.participants;
		var available_dates = calendar.available_dates;

		console.log(pdates);
		// return res.render('setTimes', {dates: available_dates, calendar_id:calendar.id, participants: pdates});
		return res.send("Under Construction");
	});
});

app.post('/add_participants', function (req, res) {

	function updateUser(){
		Calendar.findOne({_id:req.body.calendar_id}, function (err, calendar){
			if (err) {
				console.log("Database error");
				return;
			}
			else {
				User.findOneAndUpdate({email: req.body.participants}, {$push: {calendars: calendar.id}}, {safe: true, upsert: true}, function (err, user){
					if (err) {
						console.log("Database error");
						return;
					}
					else {
						return res.send(req.body.participants);
					}
				});
			}
		});
	};

	User.findOne({email:req.body.participants}, function (err, user){
		if (err){
			console.log("Database error");
			return;
		}
		else if (user === null){
			console.log("No such user found")
			return res.send("No such user found");
		}
		else {
			newParticipant = {user: req.body.participants, dates:[]};
			Calendar.findOneAndUpdate({_id: req.body.calendar_id},{$push: {participants: newParticipant}}, {safe: true, upsert: true}, function (err, calendar){
				if (err) {
					console.log("Database error when finding calendar");
				}
				else {

					updateUser();
				}
			});
			
		}

	});
});


app.post("/updateSelectedTime", function(req, res){

	var times = req.body.times;
	var id = req.body.calendar_id;
	var user = req.cookies.username;
	var formattedTime = [];

	for (var key in times){
		if (!times.hasOwnProperty(key)) continue;

		formattedTime.push({
			day: key,
			time: times[key]
		});
	}

	// Calendar.findOne({_id : id, 'participants.user':user}, function(err, calendar){
	// 	if (err){
	// 		console.log(err);
	// 		return res.send("No such calendar exists");
	// 	}
	// 	else {
	// 		console.log(calendar);
	// 		console.log("WORKED");
	// 	}
	// });


	function update(){
		Calendar.findOneAndUpdate({_id : id, 'participants.user':user}, {$pushAll: {'participants.$.selected_dates': formattedTime}}, {safe: true, upsert: true}, function(err, calendar){
			if (err){
				console.log(err);
				return res.send("No such calendar exists");
			}
			else {
				console.log("WORKED");
			}
		});
	};


	Calendar.findOneAndUpdate({_id : id, 'participants.user':user}, {$set: {'participants.$.selected_dates':[]}}, {safe: true, upsert: true}, function(err, calendar){
		if (err){
			console.log(err);
			return res.send("No such calendar exists");
		}
		else {
			update();
			console.log("DELETED");
		}
	});

});

app.listen(port, (err) => {
  if (err) {
    return console.log('something bad happened', err);
  }

  console.log(`server is listening on ${port}`);
});