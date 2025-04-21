// routes/paymentDetails.js
const express = require('express');
const router = express.Router();
const PaymentDetails = require('../models/PaymentDetails');

// Get active payment details
router.get('/payment-details', async (req, res) => {
  try {
    const details = await PaymentDetails.findOne({ isActive: true })
      .sort({ updatedAt: -1 });
    res.json(details);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new payment details
router.post('/payment-details', async (req, res) => {
  try {
    const newDetails = new PaymentDetails({
      qrImage: req.body.qrImage,
      upiId: req.body.upiId,
      paymentPhoneNumber: req.body.paymentPhoneNumber,
      bankDetails: {
        accountNumber: req.body.bankDetails.accountNumber,
        ifscCode: req.body.bankDetails.ifscCode,
        accountHolderName: req.body.bankDetails.accountHolderName,
        bankName: req.body.bankDetails.bankName
      },
      announcement: {
        message: req.body.announcement.message,
        isActive: req.body.announcement.isActive
      },
      contactEnquiry: {
        message: req.body.contactEnquiry.message,
        isActive: req.body.contactEnquiry.isActive
      },
      isActive: true
    });
    
    const savedDetails = await newDetails.save();
    res.json(savedDetails);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update payment details
router.put('/payment-details/:id', async (req, res) => {
   try {
    const updatedPaymentDetails = await PaymentDetails.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updatedPaymentDetails) {
      return res.status(404).json({ message: 'Market not found' });
    }
    res.status(200).json(updatedPaymentDetails);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update announcement only
router.put('/announcement/:id', async (req, res) => {
  try {
    const updatedDetails = await PaymentDetails.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          'announcement.message': req.body.message,
          'announcement.isActive': req.body.isActive,
          updatedAt: Date.now()
        }
      },
      { new: true }
    );
    res.json(updatedDetails);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get announcement only
router.get('/announcement', async (req, res) => {
  try {
    const details = await PaymentDetails.findOne(
      { isActive: true, 'announcement.isActive': true },
      { announcement: 1 }
    ).sort({ updatedAt: -1 });
    res.json(details?.announcement || {});
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete payment details (soft delete by setting isActive to false)
router.delete('/payment-details/:id', async (req, res) => {
  try {
    const updatedDetails = await PaymentDetails.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          isActive: false,
          updatedAt: Date.now()
        }
      },
      { new: true }
    );
    res.json(updatedDetails);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
