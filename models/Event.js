const mongoose = require(`mongoose`);

const eventSchema = mongoose.Schema({
    name: { type: String, required: true },
    location: { type: String, required: true },
    description: { type: String, required: true },
    date: { type: String, required: true, default: Date.now },
    time: { type: String, required: true },
});

module.exports.Event = mongoose.model(`Event`, eventSchema);
