var mongoose = require('mongoose')

calendarSchema = mongoose.Schema({
	Title: String,
	participants:[{
		user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
		dates: [{
			day: String,
			time: String
		}]
	}]

});

var Calendar = mongoose.model('Calendar', calendarSchema);


module.exports = Calendar;