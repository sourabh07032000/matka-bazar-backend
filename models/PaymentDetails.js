// models/paymentDetails.js
const mongoose = require('mongoose');

const PaymentDetailsSchema = new mongoose.Schema({
  qrImage: String,
  upiId: String,
 paymentPhoneNumber: String,
  bankDetails: {
    accountNumber: String,
    ifscCode: String,
    accountHolderName: String,
    bankName: String
  },
  announcement: {
    message: String,
    isActive: {
      type: Boolean,
      default: true
    }
  },
  contactEnquiry: {
    message: String,
    isActive: {
      type: Boolean,
      default: true
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('PaymentDetails', PaymentDetailsSchema);
