const express = require('express');
const SlabRate = require('../models/SlabRate');
const router = express.Router();

// Create a new slab rate
router.post('/', async (req, res) => {
  try {
    const { marketId, slabName, rates } = req.body;
    const slabRate = new SlabRate({ marketId, slabName, rates });
    await slabRate.save();
    res.status(201).json({ success: true, message: 'Slab rate created successfully', slabRate });
  } catch (error) {
    console.error('Error creating slab rate:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});
// Get slabs for a specific market
router.get('/:marketId', async (req, res) => {
  try {
    const { marketId } = req.params;
    const slabs = await SlabRate.find({ marketId });
    res.status(200).json({ success: true, slabs });
  } catch (error) {
    console.error('Error fetching slabs:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});
// Fetch the assigned slab for a user
router.get('/:userId/slab', async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).populate('assignedSlab');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({ success: true, slab: user.assignedSlab });
  } catch (error) {
    console.error('Error fetching user slab:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});
// Get all slabs
router.get('/', async (req, res) => {
  try {
    const slabs = await SlabRate.find(); // Fetch all slabs from the database
    res.status(200).json({ success: true, slabs });
  } catch (error) {
    console.error('Error fetching slabs:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deletedSlab = await SlabRate.findByIdAndDelete(id);
    if (!deletedSlab) {
      return res.status(404).json({ success: false, message: 'Slab rate not found' });
    }
    res.status(200).json({ success: true, message: 'Slab rate deleted successfully' });
  } catch (error) {
    console.error('Error deleting slab rate:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});




module.exports = router;
