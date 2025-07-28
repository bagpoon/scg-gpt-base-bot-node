require('dotenv').config();
const express = require('express');
const { App } = require('@slack/bolt');
const { Configuration, OpenAIApi } = require("openai");

// OpenAI config
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);
const openaiChatModel = process.env.OPENAI_CHAT_MODEL || "gpt-4";

// Initialize Slack Bolt App
const app = new App({
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  token: process.env.SLACK_BOT_TOKEN,
});

// Create an Express app
const expressApp = express();
expressApp.use(express.json());

// ✅ Handle Slack's URL Verification Challenge
expressApp.post('/slack/events', (req, res) => {
  if (req.body.type === 'url_verification') {
    return res.status(200).send(req.body.challenge);
  }

  // Pass everything else to Bolt's handler
  app.receiver.requestListener(req, res);
});

// 🧠 Basic Slack Event Handler
app.event('app_mention', async ({ event, say }) => {
  const prompt = event.text.replace(/<@[^>]+>/, '').trim();

  const completion = await openai.createChatCompletion({
    model: openaiChatModel,
    messages: [
      { role: "system", content: "You are a witty, sharp, and friendly assistant for a used car dealership called Super Car Guys. Always keep things helpful and on-brand." },
      { role: "user", content: prompt }
    ]
  });

  await say(completion.data.choices[0].message.content);
});

// Start listening
(async () => {
  await app.start();
  const PORT = process.env.PORT || 3000;
  expressApp.listen(PORT, () => {
    console.log(`⚡️ SCG GPT bot is running on port ${PORT}`);
  });
})();
