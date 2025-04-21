const express = require('express');
const router = express.Router();
const MarketHistory = require('../models/MarketHistory'); // Adjust the path as per your project structure

// POST: Create a new marketHistory entry
router.post('/', async (req, res) => {
  try {
    const marketHistory = new MarketHistory(req.body);
    const savedMarketHistory = await marketHistory.save();
    res.status(201).json(savedMarketHistory);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// GET: Fetch all marketHistory entries
router.get('/', async (req, res) => {
  try {
    const marketHistorys = await MarketHistory.find();
    res.status(200).json(marketHistorys);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET: Fetch a marketHistory entry by ID
router.get('/:id', async (req, res) => {
  try {
    const marketHistory = await MarketHistory.findById(req.params.id);
    if (!marketHistory) {
      return res.status(404).json({ message: 'MarketHistory not found' });
    }
    res.status(200).json(marketHistory);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT: Update a marketHistory entry by ID
router.put('/:id', async (req, res) => {
  try {
    const updatedMarketHistory = await MarketHistory.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updatedMarketHistory) {
      return res.status(404).json({ message: 'MarketHistory not found' });
    }

    // Check for changes in aankdo_open or aankdo_close and send notifications
    const { aankdo_open, aankdo_close } = req.body;
    if (aankdo_open || aankdo_close) {
      const notificationTitle = `${updatedMarketHistory.market_name} MarketHistory Update`;
      const notificationBody = `Aankdo Open: ${aankdo_open || updatedMarketHistory.aankdo_open}, Aankdo Close: ${aankdo_close || updatedMarketHistory.aankdo_close}`;

      const message = {
        notification: {
          title: notificationTitle,
          body: notificationBody,
        },
        topic: 'allUsers',
      };

      await admin.messaging().send(message);
    }

    res.status(200).json(updatedMarketHistory);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE: Delete a marketHistory entry by ID
router.delete('/:id', async (req, res) => {
  try {
    const deletedMarketHistory = await MarketHistory.findByIdAndDelete(req.params.id);
    if (!deletedMarketHistory) {
      return res.status(404).json({ message: 'MarketHistory not found' });
    }
    res.status(200).json({ message: 'MarketHistory deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT: Update new_result or old_result
router.put('/api/marketHistory/:id', async (req, res) => {
  const { id } = req.params;
  const { new_result, old_result } = req.body;

  // Prepare the fields to update
  const updateFields = {};
  if (new_result) updateFields.new_result = new_result;
  if (old_result) updateFields.old_result = old_result;

  try {
    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({ message: 'No data provided to update' });
    }

    const updatedMarketHistory = await MarketHistory.findByIdAndUpdate(
      id,
      updateFields,
      { new: true }
    );

    if (!updatedMarketHistory) {
      return res.status(404).json({ message: 'MarketHistory not found' });
    }

    res.status(200).json({
      message: 'MarketHistory data updated successfully',
      data: updatedMarketHistory,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;


