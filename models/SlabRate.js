const mongoose = require('mongoose');

const SlabRateSchema = new mongoose.Schema({
  marketId: { 
    type: String, 
    required: true 
  },
  slabName: { 
    type: String, 
    required: true 
  },
  rates: [
    {
      category: { 
        type: String, 
        required: true 
      }, // e.g., Single Digit, Jodi
      multiplier: { 
        type: Number, 
        required: true 
      } // e.g., 10, 100
    }
  ]
}, {
  timestamps: true
});

module.exports = mongoose.model('SlabRate', SlabRateSchema);
