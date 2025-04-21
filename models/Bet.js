const mongoose = require("mongoose");

const BetSchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // ✅ Reference to User
    betNo: String,
    market_id: String,
    betTime: String,
    matkaBetNumber: String,
    betAmount: Number,
    status: { type: String, default: "Pending" },
    matchResult: Object,
    matkaBetType: {
        category: String,
        multiplier: Number
    }
});

const Bet = mongoose.model("Bet", BetSchema);
module.exports = Bet;
