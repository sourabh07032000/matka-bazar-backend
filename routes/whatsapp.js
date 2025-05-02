const express = require('express');
const router = express.Router()
const axios = require('axios');

router.post('/whatsapp-webhook', async (req, res) => {
    const incomingMsg = req.body.Body;
    const from = req.body.From;
  
    try {
      // ChatGPT API call
      const gptResponse = await axios.post('https://api.openai.com/v1/chat/completions', {
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: incomingMsg }]
      }, {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });
  
      const reply = gptResponse.data.choices[0].message.content;
  
      // Respond back to Twilio (WhatsApp)
      res.set('Content-Type', 'text/xml');
      res.send(`
        <Response>
          <Message>${reply}</Message>
        </Response>
      `);
  
    } catch (err) {
      console.error("Error:", err.message);
      res.send(`<Response><Message>Sorry, there was an error.</Message></Response>`);
    }
  });
  
  module.exports = router