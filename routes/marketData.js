const express = require('express');
const router = express.Router();
const Market = require('../models/Market'); // Adjust the path as per your project structure
const { sendMarketUpdateNotification } = require('../services/notificationService');

// POST: Create a new market entry
router.post('/', async (req, res) => {
  try {
    const market = new Market(req.body);
    const savedMarket = await market.save();
    res.status(201).json(savedMarket);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// GET: Fetch all market entries
router.get('/', async (req, res) => {
  try {
    const markets = await Market.find();
    res.status(200).json(markets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET: Fetch a market entry by ID
router.get('/:id', async (req, res) => {
  try {
    const market = await Market.findById(req.params.id);
    if (!market) {
      return res.status(404).json({ message: 'Market not found' });
    }
    res.status(200).json(market);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT: Update a market entry by ID
router.put('/:id', async (req, res) => {
  try {
    const updatedMarket = await Market.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updatedMarket) {
      return res.status(404).json({ message: 'Market not found' });
    }
    res.status(200).json(updatedMarket);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE: Delete a market entry by ID
router.delete('/:id', async (req, res) => {
  try {
    const deletedMarket = await Market.findByIdAndDelete(req.params.id);
    if (!deletedMarket) {
      return res.status(404).json({ message: 'Market not found' });
    }
    res.status(200).json({ message: 'Market deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT: Update market data (new_result or old_result) and trigger notification
router.put('/api/market-data/:id', async (req, res) => {
  const { id } = req.params;
  const { new_result, old_result, fcmTokens } = req.body;

  // Prepare the fields to update
  const updateFields = {};
  if (new_result) updateFields.new_result = new_result;
  if (old_result) updateFields.old_result = old_result;

  try {
    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({ message: 'No data provided to update' });
    }

    const updatedMarket = await Market.findByIdAndUpdate(id, updateFields, { new: true });

    if (!updatedMarket) {
      return res.status(404).json({ message: 'Market not found' });
    }

    // Trigger notifications
    if (fcmTokens && fcmTokens.length > 0) {
      try {
        await Promise.all(
          fcmTokens.map((token) =>
            sendMarketUpdateNotification(
              token,
              'Market Update',
              `Market data updated: ${new_result || old_result || 'No new data'}`
            )
          )
        );
      } catch (error) {
        console.error('Notification error:', error);
      }
    }

    res.status(200).json({
      message: 'Market data updated successfully',
      data: updatedMarket,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
