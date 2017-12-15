var mongoose = require('mongoose')

calendarSchema = mongoose.Schema({
	Title: String,
	available_dates: [String],
	participants:[{
		user: String,
		selected_dates: [{
			day: String,
			time: [String]
		}]
	}]

});

var Calendar = mongoose.model('Calendar', calendarSchema);


module.exports = Calendar;