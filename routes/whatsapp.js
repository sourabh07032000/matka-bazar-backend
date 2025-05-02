const express = require('express');
const router = express.Router();
const axios = require('axios');
const MessagingResponse = require('twilio').twiml.MessagingResponse;

router.post('/whatsapp-webhook', async (req, res) => {
  const incomingMsg = req.body.Body?.trim();
  const from = req.body.From;

  // Basic validation
  if (!incomingMsg || !from || !from.includes('whatsapp')) {
    return res.status(400).send('Invalid request');
  }

  try {
    // OpenAI GPT API call with retry logic
    const getChatGPTResponse = async (message, retries = 2) => {
      try {
        const gptResponse = await axios.post(
          'https://api.openai.com/v1/chat/completions',
          {
            model: 'gpt-3.5-turbo',
            messages: [{ role: 'user', content: message }],
          },
          {
            headers: {
              Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
              'Content-Type': 'application/json',
            }
          }
        );
        return gptResponse.data.choices[0].message.content;
      } catch (error) {
        if (error.response?.status === 429 && retries > 0) {
          console.warn('Rate limit hit. Retrying in 5 seconds...');
          await new Promise(resolve => setTimeout(resolve, 5000));
          return getChatGPTResponse(message, retries - 1);
        }
        throw error;
      }
    };

    const reply = await getChatGPTResponse(incomingMsg);

    // Return reply using Twilio TwiML
    const twiml = new MessagingResponse();
    twiml.message(reply);
    res.writeHead(200, { 'Content-Type': 'text/xml' });
    res.end(twiml.toString());

  } catch (err) {
    console.error("Error in webhook:", err.message);
    const twiml = new MessagingResponse();
    twiml.message("Sorry, an error occurred. Please try again later.");
    res.writeHead(200, { 'Content-Type': 'text/xml' });
    res.end(twiml.toString());
  }
});

module.exports = router;
