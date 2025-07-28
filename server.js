require('dotenv').config();
const express = require('express');
const { App, ExpressReceiver } = require('@slack/bolt');
const { Configuration, OpenAIApi } = require("openai");

// OpenAI Setup
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);
const model = process.env.OPENAI_CHAT_MODEL || "gpt-4";

// ExpressReceiver handles routes for Slack (including /slack/events)
const receiver = new ExpressReceiver({
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  endpoints: '/slack/events',
});

// Slack Bolt App
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  receiver,
});

// Slack Event Listener
app.event('app_mention', async ({ event, say }) => {
  const userPrompt = event.text.replace(/<@[^>]+>/, '').trim();

  const completion = await openai.createChatCompletion({
    model,
    messages: [
      { role: 'system', content: 'You are a witty, smart assistant for a used car dealership called Super Car Guys. Help with leads, follow-ups, and marketing advice.' },
      { role: 'user', content: userPrompt }
    ]
  });

  await say(completion.data.choices[0].message.content);
});

// Start the Express app
const PORT = process.env.PORT || 3000;
receiver.app.listen(PORT, () => {
  console.log(`⚡️ SCG GPT bot is running on port ${PORT}`);
});
