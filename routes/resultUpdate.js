const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Bet = require("../models/Bet");
const User = require("../models/User");

// Process Market Results API
router.post("/process-market-results", async (req, res) => {
  const { market_name, figure_open, figure_close, aankdo_open, aankdo_close, jodi } =
    req.body;
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Fetch all bets for the market in one query
    const pendingBets = await Bet.find({
      market_id: market_name,
      status: "Pending",
    }).session(session);

    let betUpdates = [];
    let walletUpdates = [];
    console.log(pendingBets);


    for (let bet of pendingBets) {
      let isWinner = false;
      let winningAmount = 0;
      let srMultiplier = 0;

      // Determine if the bet wins based on category and conditions
      if (
        bet.matkaBetType.category === "Single Digit" &&
        bet.betTime === "Open" &&
        bet.matkaBetNumber === figure_open
      ) {
        isWinner = true;
        winningAmount = bet.betAmount * bet.matkaBetType.multiplier;
      } else if (
        bet.matkaBetType.category === "Single Digit" &&
        bet.betTime === "Close" &&
        !figure_close.includes("X") && // Only process if close number is set
        bet.matkaBetNumber === figure_close
      ) {
        isWinner = true;
        winningAmount = bet.betAmount * bet.matkaBetType.multiplier;
      } else if (
        bet.matkaBetType.category === "Single Digit" &&
        bet.betTime === "Close" &&
        figure_close.includes("X") // Only process if close number is set
      ) {
        isWinner = "Pending";
        winningAmount = 0;
      } else if (
        bet.matkaBetType.category === "SP" &&
        bet.betTime === "Open" &&
        [...new Set(aankdo_open)].length == 3
      ) {
        const totalNumber =
          +aankdo_open[0] +
          +aankdo_open[1] +
          +aankdo_open[2];
        if (totalNumber.toString().at(-1) == bet.matkaBetNumber) {
          isWinner = true;
          winningAmount = bet.betAmount * bet.matkaBetType.multiplier;
        }
      } else if (
        bet.matkaBetType.category === "SP" &&
        bet.betTime === "Close" &&
        [...new Set(aankdo_close)].length == 3 &&
        !figure_close.includes("X") // Only process if close number is set
      ) {
        const totalNumber =
          +aankdo_close[0] +
          +aankdo_close[1] +
          +aankdo_close[2];
        if (totalNumber.toString().at(-1) == bet.matkaBetNumber) {
          isWinner = true;
          winningAmount = bet.betAmount * bet.matkaBetType.multiplier;
        }
      } else if (
        bet.matkaBetType.category === "SP" &&
        bet.betTime === "Close" &&
        figure_close.includes("X") // Only process if close number is set
      ) {
        isWinner = "Pending";
        winningAmount = 0;
      } else if (
        bet.matkaBetType.category === "DP" &&
        bet.betTime === "Open" &&
        [...new Set(aankdo_open)].length == 2
      ) {
        const totalNumber =
          +aankdo_open[0] +
          +aankdo_open[1] +
          +aankdo_open[2];
        if (totalNumber.toString().at(-1) == bet.matkaBetNumber) {
          isWinner = true;
          winningAmount = bet.betAmount * bet.matkaBetType.multiplier;
        }
      } else if (
        bet.matkaBetType.category === "DP" &&
        [...new Set(aankdo_close)].length == 2 &&
        bet.betTime === "Close" &&
        !figure_close.includes("X") // Only process if close number is set
      ) {
        const totalNumber =
          +aankdo_close[0] +
          +aankdo_close[1] +
          +aankdo_close[2];
        if (totalNumber.toString().at(-1) == bet.matkaBetNumber) {
          isWinner = true;
          winningAmount = bet.betAmount * bet.matkaBetType.multiplier;
        }
      } else if (
        bet.matkaBetType.category === "DP" &&
        bet.betTime === "Close" &&
        figure_close.includes("X") // Only process if close number is set
      ) {
        isWinner = "Pending";
        winningAmount = 0;
      } else if (
        bet.matkaBetType.category === "Jodi" &&
        bet.matkaBetNumber === jodi
      ) {
        isWinner = true;
        winningAmount = bet.betAmount * bet.matkaBetType.multiplier;
      } else if (
        bet.matkaBetType.category === "Jodi" &&
        jodi.includes("X") &&
        bet.matkaBetNumber.slice(0, 1) === jodi.slice(0, 1)
      ) {
        isWinner = "Pending";
        winningAmount = 0;
      } else if (
        bet.matkaBetType.category === "Single Pana" &&
        ((bet.betTime === "Open" &&
          bet.matkaBetNumber === aankdo_open) ||
          (bet.betTime === "Close" &&
            aankdo_close != "XXX" && // Only process if close number is set
            bet.matkaBetNumber === aankdo_close))
      ) {
        isWinner = true;
        winningAmount = bet.betAmount * bet.matkaBetType.multiplier;
      } else if (
        bet.matkaBetType.category === "Single Pana" &&
        bet.betTime === "Close" &&
        aankdo_close === "XXX" // Only process if close number is set
      ) {
        isWinner = "Pending";
        winningAmount = 0;
      } else if (
        bet.matkaBetType.category === "Cut" &&
        bet.betTime === "Open"
      ) {
        const mapping = {
          0: 5,
          1: 6,
          2: 7,
          3: 8,
          4: 9,
          5: 0,
          6: 1,
          7: 2,
          8: 3,
          9: 4,
        };
        // Generate all valid combinations from `aankdo_open`
        const digits = aankdo_open.split("").map(Number); // Convert open number to digits
        const generateCombinations = (digits) => {
          const options = digits.map((digit) => [digit, mapping[digit]]); // Map each digit to its "Cut" counterpart
          const cartesianProduct = options.reduce(
            (acc, curr) => acc.flatMap((a) => curr.map((c) => [...a, c])),
            [[]]
          );
          // Generate Cartesian product
          const validNumbers = new Set(
            cartesianProduct.map((combo) => {
              const nonZeroDigits = combo.filter((d) => d !== 0); // Exclude zero for sorting
              const zeroCount = combo.length - nonZeroDigits.length; // Count zeros

              // Sort non-zero digits in ascending order and append zeros at the end
              const sortedCombo = [
                ...nonZeroDigits.sort((a, b) => a - b),
                ...Array(zeroCount).fill(0),
              ];
              return sortedCombo.join(""); // Join digits into a string
            })
          );

          return Array.from(validNumbers); // Return unique combinations
        };
        const validCombinations = generateCombinations(digits);
        // Check if `bet.matkaBetNumber` matches any valid combination
        if (validCombinations.includes(bet.matkaBetNumber)) {
          if (validCombinations.length == 8) {
            srMultiplier = 150 / 8;
            winningAmount = bet.betAmount * srMultiplier;
          } else if (
            validCombinations.length == 6 &&
            [...new Set(aankdo_open)].length == 2
          ) {
            srMultiplier = 300 / 6;
            winningAmount = bet.betAmount * srMultiplier;
          } else if (
            validCombinations.length == 6 &&
            [...new Set(aankdo_open)].length == 3
          ) {
            srMultiplier = 150 / 6;
            winningAmount = bet.betAmount * srMultiplier;
          } else if (
            validCombinations.length == 4 &&
            [...new Set(aankdo_open)].length == 2
          ) {
            srMultiplier = 300 / 4;
            winningAmount = bet.betAmount * srMultiplier;
          } else if (
            validCombinations.length == 4 &&
            [...new Set(aankdo_open)].length == 1
          ) {
            srMultiplier = 900 / 4;
            winningAmount = bet.betAmount * srMultiplier;
          }
          isWinner = true;
        } else {
          isWinner = false;
          winningAmount = bet.betAmount * srMultiplier;
        }
      } else if (
        bet.matkaBetType.category === "Cut" &&
        bet.betTime === "Close" &&
        aankdo_close !== "XXX"
      ) {
        const mapping = {
          0: 5,
          1: 6,
          2: 7,
          3: 8,
          4: 9,
          5: 0,
          6: 1,
          7: 2,
          8: 3,
          9: 4,
        };

        // Generate all valid combinations from `aankdo_open`
        const digits = aankdo_close.split("").map(Number); // Convert open number to digits

        const generateCombinations = (digits) => {
          const options = digits.map((digit) => [digit, mapping[digit]]); // Map each digit to its "Cut" counterpart

          const cartesianProduct = options.reduce(
            (acc, curr) => acc.flatMap((a) => curr.map((c) => [...a, c])),
            [[]]
          ); // Generate Cartesian product

          const validNumbers = new Set(
            cartesianProduct.map((combo) => {
              const nonZeroDigits = combo.filter((d) => d !== 0); // Exclude zero for sorting
              const zeroCount = combo.length - nonZeroDigits.length; // Count zeros

              // Sort non-zero digits in ascending order and append zeros at the end
              const sortedCombo = [
                ...nonZeroDigits.sort((a, b) => a - b),
                ...Array(zeroCount).fill(0),
              ];

              return sortedCombo.join(""); // Join digits into a string
            })
          );

          return Array.from(validNumbers); // Return unique combinations
        };

        const validCombinations = generateCombinations(digits);

        // Check if `bet.matkaBetNumber` matches any valid combination
        if (validCombinations.includes(bet.matkaBetNumber)) {
          if (validCombinations.length == 8) {
            srMultiplier = 150 / 8;
            winningAmount = bet.betAmount * srMultiplier;
          } else if (
            validCombinations.length == 6 &&
            [...new Set(aankdo_close)].length == 2
          ) {
            srMultiplier = 300 / 6;
            winningAmount = bet.betAmount * srMultiplier;
          } else if (
            validCombinations.length == 6 &&
            [...new Set(aankdo_close)].length == 3
          ) {
            srMultiplier = 150 / 6;
            winningAmount = bet.betAmount * srMultiplier;
          } else if (
            validCombinations.length == 4 &&
            [...new Set(aankdo_close)].length == 2
          ) {
            srMultiplier = 300 / 4;
            winningAmount = bet.betAmount * srMultiplier;
          } else if (
            validCombinations.length == 4 &&
            [...new Set(aankdo_close)].length == 1
          ) {
            srMultiplier = 900 / 4;
            winningAmount = bet.betAmount * srMultiplier;
          }
          isWinner = true;
        } else {
          isWinner = false;
          winningAmount = 0
        }
      } else if (
        bet.matkaBetType.category === "Cut" &&
        bet.betTime === "Close" &&
        aankdo_close === "XXX"
      ) {
        isWinner = "Pending";
        winningAmount = 0;
      } else if (bet.matkaBetType.category === "SR" && bet.betTime === "Open") {
        let output = [...new Set(bet.matkaBetNumber)];
        let output2 = [...new Set(aankdo_open)];
        if (output.length === 2 && output2.length === 3) {
          for (let i of bet.matkaBetNumber) {
            if (aankdo_open.includes(i)) {
              isWinner = true;
            } else {
              isWinner = false;
              break;
            }
          }
          winningAmount = isWinner ? bet.betAmount * 15 : 0;
          srMultiplier = 15;
        } else if (output.length === 2 && output2.length === 2) {
          for (let i of bet.matkaBetNumber) {
            if (aankdo_open.includes(i)) {
              isWinner = true;
            } else {
              isWinner = false;
              break;
            }
          }
          winningAmount = isWinner ? bet.betAmount * 30 : 0;
          srMultiplier = 30;
        } else if (output.length === 1 && output2.length === 2) {
          if (aankdo_open.includes(bet.matkaBetNumber)) {
            isWinner = true;
          } else {
            isWinner = false;
          }
          winningAmount =  isWinner ? bet.betAmount * 30 : 0;;
          srMultiplier = 30;
        } else if (output.length === 1 && output2.length === 1) {
          if (aankdo_open.includes(bet.matkaBetNumber)) {
            isWinner = true;
          } else {
            isWinner = false;
          }
          winningAmount =  isWinner ? bet.betAmount * 90 : 0;
          srMultiplier = 90;
        
        }
      } else if (
        bet.matkaBetType.category === "SR" &&
        bet.betTime === "Close" &&
        aankdo_close !== "XXX"
      ) {
        let output = [...new Set(bet.matkaBetNumber)];
        let output2 = [...new Set(aankdo_close)];
        if (output.length === 2 && output2.length === 3) {
          for (let i of bet.matkaBetNumber) {
            if (aankdo_close.includes(i)) {
              isWinner = true;
            } else {
              isWinner = false;
              break;
            }
          }
          winningAmount =  isWinner ? bet.betAmount * 15 : 0;
          srMultiplier = 15;
        } else if (output.length === 2 && output2.length === 2) {
          for (let i of bet.matkaBetNumber) {
            if (aankdo_close.includes(i)) {
              isWinner = true;
            } else {
              isWinner = false;
              break;
            }
          }
          winningAmount =  isWinner ? bet.betAmount * 30 : 0;
          srMultiplier = 30;
        } else if (output.length === 1 && output2.length === 2) {
          if (aankdo_close.includes(bet.matkaBetNumber)) {
            isWinner = true;
          } else {
            isWinner = false;
          }
          winningAmount =isWinner ? bet.betAmount * 30 : 0;
          srMultiplier = 30;
        } else if (output.length === 1 && output2.length === 1) {
          if (aankdo_close.includes(bet.matkaBetNumber)) {
            isWinner = true;
          } else {
            isWinner = false;
          }
          winningAmount = isWinner ? bet.betAmount * 90 : 0;
          srMultiplier = 90;
        }
      } else if (
        bet.matkaBetType.category === "SR" &&
        bet.betTime === "Close" &&
        aankdo_close === "XXX"
      ) {
        isWinner = "Pending";
      } else if (
        bet.matkaBetType.category === "SP Motor" &&
        bet.betTime === "Open"
      ) {
        let output = [...new Set(aankdo_open)];
        if (output.length === 3) {
          for (let i of aankdo_open) {
            if (bet.matkaBetNumber.includes(i)) {
              isWinner = true;
            } else {
              isWinner = false;
              break;
            }
          }
        }
        winningAmount = isWinner ? bet.betAmount * bet.matkaBetType.multiplier : 0;
      } else if (
        bet.matkaBetType.category === "DP Motor" &&
        bet.betTime === "Open"
      ) {
        let output = [...new Set(aankdo_open)];

        if (output.length === 2) {
          for (let i of aankdo_open) {
            if (bet.matkaBetNumber.includes(i)) {
              isWinner = true;
            } else {
              isWinner = false;
              break;
            }
          }
        }
        winningAmount = isWinner ? bet.betAmount * bet.matkaBetType.multiplier : 0;
      } else if (
        bet.matkaBetType.category === "SP Motor" &&
        bet.betTime === "Close" &&
        aankdo_close != "XXX"
      ) {
        let output = [...new Set(aankdo_close)];

        if (output.length === 3) {
          for (let i of aankdo_close) {
            if (bet.matkaBetNumber.includes(i)) {
              isWinner = true;
            } else {
              isWinner = false;
              break;
            }
          }
        }
        winningAmount = isWinner ? bet.betAmount * bet.matkaBetType.multiplier : 0;
      } else if (
        bet.matkaBetType.category === "DP Motor" &&
        bet.betTime === "Close" &&
        aankdo_close != "XXX"
      ) {
        let output = [...new Set(aankdo_close)];
        if (output.length === 2) {
          for (let i of aankdo_close) {
            if (bet.matkaBetNumber.includes(i)) {
              isWinner = true;
            } else {
              isWinner = false;
              break;
            }
          }
        }
        winningAmount = isWinner ? bet.betAmount * bet.matkaBetType.multiplier : 0;
      } else if (
        (bet.matkaBetType.category === "SP Motor" ||
          bet.matkaBetType.category === "DP Motor") &&
        bet.betTime === "Close" &&
        aankdo_close === "XXX" // Only process if close number is set
      ) {
        isWinner = "Pending";
        winningAmount = 0;
      } else if (
        bet.matkaBetType.category === "Double Pana" &&
        ((bet.betTime === "Open" &&
          bet.matkaBetNumber === aankdo_open) ||
          (bet.betTime === "Close" &&
            aankdo_close != "XXX" && // Only process if close number is set
            bet.matkaBetNumber === aankdo_close))
      ) {
        isWinner = true;
        winningAmount = bet.betAmount * bet.matkaBetType.multiplier;
      } else if (
        bet.matkaBetType.category === "Double Pana" &&
        bet.betTime === "Close" &&
        aankdo_close === "XXX" // Only process if close number is set
      ) {
        isWinner = "Pending";
        winningAmount = 0;
      } else if (
        bet.matkaBetType.category === "Triple Pana" &&
        ((bet.betTime === "Open" &&
          bet.matkaBetNumber === aankdo_open) ||
          (bet.betTime === "Close" &&
            aankdo_close != "XXX" && // Only process if close number is set
            bet.matkaBetNumber === aankdo_close))
      ) {
        isWinner = true;
        winningAmount = bet.betAmount * bet.matkaBetType.multiplier;
      } else if (
        bet.matkaBetType.category === "Triple Pana" &&
        bet.betTime === "Close" &&
        aankdo_close === "XXX" // Only process if close number is set
      ) {
        isWinner = "Pending";
        winningAmount = 0;
      } else if (
        bet.matkaBetType.category === "Full Sangam" &&
        bet.matkaBetNumber.slice(0, 3) === aankdo_open &&
        bet.matkaBetNumber.slice(4, 7) === aankdo_close
      ) {
        isWinner = true;
        winningAmount = bet.betAmount * bet.matkaBetType.multiplier;
      } else if (
        bet.matkaBetType.category === "Full Sangam" &&
        aankdo_close.includes("X") &&
        bet.matkaBetNumber.slice(0, 3) === aankdo_close
      ) {
        isWinner = "Pending";
        winningAmount = 0;
      } else if (
        bet.matkaBetType.category === "Half Sangam" &&
        ((bet.betTime === "Open" &&
          bet.matkaBetNumber.slice(0, 1) === figure_open &&
          bet.matkaBetNumber.slice(2) === aankdo_close &&
          aankdo_close != "XXX") ||
          (bet.betTime === "Close" &&
            aankdo_close != "XXX" && // Only process if close number is set
            bet.matkaBetNumber.slice(0, 3) === aankdo_open &&
            bet.matkaBetNumber.slice(4) === figure_close))
      ) {
        isWinner = true;
        winningAmount = bet.betAmount * bet.matkaBetType.multiplier;
      } else if (
        bet.matkaBetType.category === "Half Sangam" &&
        ((bet.betTime === "Open" &&
          aankdo_close == "XXX" &&
          bet.matkaBetNumber.slice(0, 1) === figure_open) ||
          (bet.betTime === "Close" &&
            aankdo_close == "XXX" &&
            bet.matkaBetNumber.slice(0, 3) === aankdo_open))
      ) {
        isWinner = "Pending";
        winningAmount = 0;
      }

      // Update bet status
      betUpdates.push({
        updateOne: {
          filter: { _id: bet._id },
          update: {
            $set: {
              status:
                isWinner === true
                  ? "Won"
                  : isWinner === "Pending"
                  ? "Pending"
                  : "Lost",
              matchResult: {
                aankdo_close: aankdo_close,
                aankdo_open: aankdo_open,
                figure_close: figure_close,
                figure_open: figure_open
              },
              matkaBetType:{
                multiplier: bet.matkaBetType.category == "Cut" || bet.matkaBetType.category == "SR" ? srMultiplier : bet.matkaBetType.multiplier,
                category: bet.matkaBetType.category
              },
            },
          },
        },
      });

      // Update user's wallet if they won
      if (isWinner) {
        walletUpdates.push({
          updateOne: {
            filter: { _id: bet.user_id },
            update: { $inc: { wallet: winningAmount } },
          },
        });
      }


    
    }

    // Perform bulk updates
    if (betUpdates.length > 0) {
      await Bet.bulkWrite(betUpdates, { session });
    }

    if (walletUpdates.length > 0) {
      await User.bulkWrite(walletUpdates, { session });
      console.log(walletUpdates)
    }

    await session.commitTransaction();
    session.endSession();

    res.json({
      success: true,
      message: "Market results processed successfully!",
    });
  } catch (error) {
    console.error("Error processing results:", error);
    await session.abortTransaction();
    session.endSession();
    res
      .status(500)
      .json({ success: false, message: "Error processing results" });
  }
});

module.exports = router;
