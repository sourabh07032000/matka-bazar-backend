const mongoose = require('mongoose');

// Define the schema for signup including investment details
const MarketHistorySchema = new mongoose.Schema({
      open_time_formatted : String,
      close_time_formatted : String,
      open_time : String,
      close_time : String,
      market_id : String,
      market_name : String,
      aankdo_date : String,
      aankdo_open : String,
      aankdo_close : String,
      figure_open : String,
      figure_close : String,
      jodi: String,
      aankdo_open_close_time: String,
      aankdo_close_close_time: String,
      market_on : {default: false, type: Boolean}

}, {
  timestamps: true
});

module.exports = mongoose.model('MarketHistory', MarketHistorySchema);
