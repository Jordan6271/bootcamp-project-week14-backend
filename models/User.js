const mongoose = require(`mongoose`);

const userSchema = mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    token: { type: String },
});

module.exports.User = mongoose.model(`User`, userSchema);
