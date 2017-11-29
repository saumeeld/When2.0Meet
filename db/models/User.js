var mongoose = require('mongoose')

userSchema = mongoose.Schema({
	email: String,
	password: String,
	calendars: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Calendar' }]
});

var User = mongoose.model('User', userSchema);

module.exports = User;