export const service = "Lead Generation";
export const openingMessage = "Hello! 📈 Looking to grow your leads? I'll help you put together the perfect campaign!";
export const questions = [
  {
    "key": "name",
    "patterns": [
      "name",
      "call you"
    ],
    "templates": [
      "Hey! 📈 Ready to grow your leads? What's your name?",
      "Hi! Let's get you more customers. What should I call you?"
    ],
    "suggestions": null
  },
  {
    "key": "business",
    "patterns": [
      "business",
      "company",
      "do",
      "sell"
    ],
    "templates": [
      "Great, {name}! Tell me about your business - what do you offer?"
    ],
    "suggestions": null
  },
  {
    "key": "target",
    "patterns": [
      "target",
      "audience",
      "customer",
      "who"
    ],
    "templates": [
      "Who's your ideal customer? 🎯"
    ],
    "suggestions": null
  },
  {
    "key": "volume",
    "patterns": [
      "volume",
      "many",
      "leads",
      "number"
    ],
    "templates": [
      "How many leads per month are you looking for?"
    ],
    "suggestions": [
      "Under 100",
      "100-500",
      "500-1000",
      "1000+"
    ]
  },
  {
    "key": "channels",
    "patterns": [
      "channel",
      "method",
      "how",
      "source"
    ],
    "templates": [
      "Which channels work best for reaching your audience?"
    ],
    "suggestions": [
      "Email",
      "LinkedIn",
      "Cold Calling",
      "Ads",
      "Mix of all"
    ]
  },
  {
    "key": "budget",
    "patterns": [
      "budget",
      "cost",
      "spend"
    ],
    "templates": [
      "What's your budget for lead generation? 💰"
    ],
    "suggestions": [
      "Under ₹25,000",
      "₹25,000 - ₹50,000",
      "₹50,000 - ₹1,00,000",
      "₹1,00,000+"
    ]
  },
  {
    "key": "timeline",
    "patterns": [
      "timeline",
      "when",
      "start"
    ],
    "templates": [
      "When do you want to start the campaign? ⏰"
    ],
    "suggestions": [
      "Immediately",
      "This week",
      "Next month",
      "Flexible"
    ]
  }
];

const chatbot = { service, openingMessage, questions };
export default chatbot;
