const mongoose = require('mongoose');

const TokenSchema = new mongoose.Schema({
  fcmToken: {
    type: String,
    required: true,
    unique: true,
  },
}, { timestamps: true });

module.exports = mongoose.model('Token', TokenSchema);
