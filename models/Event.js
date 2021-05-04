const mongoose = require(`mongoose`);

const eventSchema = mongoose.Schema({
	name: String,
	location: String,
	information: String,
	date: Number,
	time: Number,
});

module.exports.Event = mongoose.model(`Event`, eventSchema);
