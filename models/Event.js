const mongoose = require(`mongoose`);

const eventSchema = mongoose.Schema({
	name: String,
	location: String,
	description: String,
	date: Number,
	time: Number,
});

module.exports.Event = mongoose.model(`Event`, eventSchema);
