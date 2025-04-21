const mongoose = require('mongoose');

// Define the schema for signup including investment details
const UserSchema = new mongoose.Schema({
  username: { 
    type: String, 
    required: true, 
    unique: true,
    match: [/^[A-Za-z]+$/, "Username can only contain alphabetic characters"]

  },
  mobileNumber: { 
    type: String, 
    required: true, 
    unique: true 
  },
  password: { 
    type: String, 
    required: true
  },
  mPin: { 
    type: String, 
    required: true 
  },
  transactionRequest: Array,
  isDeposit: {
    type: Boolean,
    default: true
  },
  isWithdrawal: {
    type: Boolean,
    default: true
  },
  betDetails: Array,
  bankDetails: {
    accountNumber: String,
    ifscCode: String,
    accountHolderName: String,
    upiId: String,
    upiphoneNumber:String,
    isApproved: {
      type: String,
      default: "false"
    }
  }, // Added missing closing brace here
  withdrawalRequest: Array,
  wallet: {
    type: Number, 
    default: 10
  },
assignedSlabDetails: [
  {
    type: mongoose.Schema.Types.Mixed, // Allows flexibility to store the full slab object
  },
],
}, {
  timestamps: true
});

module.exports = mongoose.model('User', UserSchema);
