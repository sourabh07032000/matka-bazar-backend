const express = require('express');
const router = express.Router();
const User = require('../models/User');
const mongoose = require('mongoose');
const SlabRate = require("../models/SlabRate");


// POST: User route (Create)
router.post('/login', async(req, res)=>{
  try {
    const { mobileNumber, password } = req.body;

    if (!mobileNumber || !password) {
      return res.status(400).json({ message: 'Mobile number and password are required.' });
    }

    // Check if user exists
    const user = await User.findOne({ mobileNumber });
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Verify password

    if (user.password != password) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    

    // Respond with success
    return res.status(200).json(user);

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error.' });
  }

  
})
router.post('/', async (req, res) => {
  const { username, mobileNumber, password, mPin } = req.body;
  // Check if username contains only letters (extra validation before saving)
  

  // Validation
  if (!username || !mobileNumber || !password || !mPin) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Create new user
    const user = new User({  username, mobileNumber, password, mPin });
    await user.save();
    res.status(201).json({ message: 'User registered successfully', user });
  } 
  
  catch (error) {
    console.error('User Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET: Retrieve all users (Read)
router.get('/', async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET: Retrieve all users with optional pagination for transactionRequest

router.get('/filtered', async (req, res) => {
  const { page = 1, limit = 10, transactionPage = 1, transactionLimit = 5 } = req.query;

  try {
    // Create query conditions dynamically based on filters
const query = {
  'transactionRequest': {
    $elemMatch: { status: "Pending" } // Matches any user where at least one transactionRequest has "Pending" status
  }
};



    // Fetch users with pagination
    const users = await User.find(query)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    // Add paginated transaction requests for each user
    const paginatedUsers = users.map((user) => {
      const transactions = user.transactionRequest.length>0 ? user.transactionRequest : [];
      // const paginatedTransactions = transactions.slice(
      //   (transactionPage - 1) * transactionLimit,
      //   transactionPage * transactionLimit
      // );

      return {
        ...user.toObject()
      };
    });

    res.status(200).json(paginatedUsers);
  } catch (error) {
    console.error('Error in /filtered route:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});



// GET: Retrieve a single user by ID
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


// DELETE: Remove a user by ID
router.delete('/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT: Update user information
// Update the main PUT route to handle bankDetails properly
router.put('/:id', async (req, res) => {
  try {
    console.log('Update request body:', req.body); // Debug log

    // If updating bank details
    if (req.body.bankDetails) {
      const updatedUser = await User.findByIdAndUpdate(
        req.params.id,
        { 
          $set: { 
            bankDetails: {
              ...req.body.bankDetails,
              submittedAt: new Date()
            }
          } 
        },
        { new: true }
      );
      
      if (!updatedUser) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      console.log('Updated user with bank details:', updatedUser); // Debug log
      return res.json(updatedUser);
    }

    // For other updates
    const { username, mobileNumber, password, mPin, wallet, transactionRequest, betDetails, withdrawalRequest, isDeposit, isWithdrawal } = req.body;
    
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { username, mobileNumber, password, mPin, wallet, transactionRequest, betDetails, withdrawalRequest, isDeposit, isWithdrawal },
      { new: true, runValidators: true }
    );
    
    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ message: 'User updated successfully', user: updatedUser });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add a specific route for bank details approval
router.put('/:id/bankDetails/approve', async (req, res) => {
  try {
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          'bankDetails.isApproved': true,
          'bankDetails.approvedAt': new Date()
        }
      },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(updatedUser);
  } catch (error) {
    console.error('Error approving bank details:', error);
    res.status(500).json({ message: 'Error approving bank details' });
  }
});

// Add a specific route for bank details rejection
router.put('/:id/bankDetails/reject', async (req, res) => {
  try {
    const { reason } = req.body;
    
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          'bankDetails.isApproved': false,
          'bankDetails.rejectedAt': new Date(),
          'bankDetails.rejectionReason': reason
        }
      },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(updatedUser);
  } catch (error) {
    console.error('Error rejecting bank details:', error);
    res.status(500).json({ message: 'Error rejecting bank details' });
  }
});

// Add a route to check bank details status
router.get('/:id/bankDetails/status', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      hasDetails: !!user.bankDetails,
      isApproved: user.bankDetails?.isApproved || false,
      details: user.bankDetails || null
    });
  } catch (error) {
    console.error('Error checking bank details status:', error);
    res.status(500).json({ message: 'Error checking bank details status' });
  }
});

// PUT: Update user's transactionRequest array
router.put('/:id/transactionRequest', async (req, res) => {
  const { transactionRequest } = req.body;

  if (!Array.isArray(transactionRequest)) {
    return res.status(400).json({ message: 'transactionRequest must be an array' });
  }

  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update the transactionRequest array (replace or merge, depending on requirements)
    user.transactionRequest = transactionRequest;
    await user.save();

    res.status(200).json({ message: 'Transaction requests updated successfully', user });
  } catch (error) {
    console.error('Error updating transaction requests:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT: Update user's withdrawalRequest array
router.put('/:id/withdrawalRequest', async (req, res) => {
  const { withdrawalRequest } = req.body;

  if (!Array.isArray(withdrawalRequest)) {
    return res.status(400).json({ message: 'withdrawalRequest must be an array' });
  }

  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update the withdrawalRequest array (replace or merge, depending on requirements)
    user.withdrawalRequest = withdrawalRequest;
    await user.save();

    res.status(200).json({ message: 'Transaction requests updated successfully', user });
  } catch (error) {
    console.error('Error updating transaction requests:', error);
    res.status(500).json({ message: 'Server error' });
  }
});
// PUT: Update user's bet details array
router.put('/:id/betDetails', async (req, res) => {
  const { betDetails } = req.body;

  if (!Array.isArray(betDetails)) {
    return res.status(400).json({ message: 'betDetails must be an array' });
  }

  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update the betDetails array (replace or merge, depending on requirements)
    user.betDetails = betDetails;
    await user.save();

    res.status(200).json({ message: 'Transaction requests updated successfully', user });
  } catch (error) {
    console.error('Error updating transaction requests:', error);
    res.status(500).json({ message: 'Server error' });
  }
});
// Add this new route for checking UTR existence
router.get('/check-utr/:utrNumber', async (req, res) => {
  try {
    const { utrNumber } = req.params;
    
    // Find any user with this UTR number in their transaction requests
    const userWithUTR = await User.findOne({
      'transactionRequest.utrNumber': utrNumber
    });

    res.json({ exists: !!userWithUTR });
  } catch (error) {
    console.error('Error checking UTR:', error);
    res.status(500).json({ message: 'Server error' });
  }
});
// routes/user.js
router.put('/:id/bankDetails', async (req, res) => {
  try {
    const { bankDetails } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: { bankDetails } },
      { new: true }
    );
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error updating bank details' });
  }
});
// Update your existing transaction request route
router.put('/:id/transactionRequest', async (req, res) => {
  const { transactionRequest } = req.body;

  if (!Array.isArray(transactionRequest)) {
    return res.status(400).json({ message: 'transactionRequest must be an array' });
  }

  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if the new transaction has a UTR number
    const newTransaction = transactionRequest[transactionRequest.length - 1];
    if (newTransaction && newTransaction.utrNumber) {
      // Check if UTR already exists in any user's transactions
      const existingUTR = await User.findOne({
        'transactionRequest.utrNumber': newTransaction.utrNumber
      });

      if (existingUTR) {
        return res.status(400).json({ message: 'UTR number already exists' });
      }
    }

    // Update the transactionRequest array
    user.transactionRequest = transactionRequest;
    await user.save();

    res.status(200).json({ message: 'Transaction requests updated successfully', user });
  } catch (error) {
    console.error('Error updating transaction requests:', error);
    res.status(500).json({ message: 'Server error' });
  }
});
// Assign a slab to a user
// Assign a slab to a user
router.put('/:userId/assign-slab', async (req, res) => {
  const { slabId } = req.body;
  const { userId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(slabId) || !mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ success: false, message: 'Invalid ID format' });
  }

  try {
    const slab = await SlabRate.findById(slabId);
    if (!slab) {
      return res.status(404).json({ success: false, message: 'Slab not found' });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: { assignedSlabDetails: [slab] } },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({ success: true, message: 'Slab assigned successfully', data: updatedUser });
  } catch (error) {
    console.error('Error assigning slab:', error);
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
});



module.exports = router;
