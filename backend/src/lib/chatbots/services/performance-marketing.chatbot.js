export const service = "Performance Marketing";
export const openingMessage = "Hi! 🎯 Ready to run some high-converting ads? Let's get started!";
export const questions = [
  {
    "key": "name",
    "patterns": [
      "name",
      "call you"
    ],
    "templates": [
      "Hey! 🎯 Ready to run some high-converting ads? What's your name?"
    ],
    "suggestions": null
  },
  {
    "key": "business",
    "patterns": [
      "business",
      "company",
      "sell",
      "offer"
    ],
    "templates": [
      "Great, {name}! What does your business sell or offer?"
    ],
    "suggestions": null
  },
  {
    "key": "platforms",
    "patterns": [
      "platform",
      "where",
      "ads"
    ],
    "templates": [
      "Where do you want to run ads? 📊"
    ],
    "suggestions": [
      "Google Ads",
      "Meta (FB/IG)",
      "LinkedIn",
      "YouTube",
      "Multiple"
    ]
  },
  {
    "key": "goals",
    "patterns": [
      "goal",
      "achieve",
      "want",
      "objective"
    ],
    "templates": [
      "What's your main advertising goal?"
    ],
    "suggestions": [
      "More sales",
      "Lead generation",
      "Website traffic",
      "Brand awareness"
    ]
  },
  {
    "key": "budget",
    "patterns": [
      "budget",
      "cost",
      "spend",
      "ad spend"
    ],
    "templates": [
      "What's your monthly ad budget? 💰"
    ],
    "suggestions": [
      "Under ₹25,000/mo",
      "₹25,000 - ₹50,000/mo",
      "₹50,000 - ₹1,00,000/mo",
      "₹1,00,000+/mo"
    ]
  },
  {
    "key": "timeline",
    "patterns": [
      "timeline",
      "when",
      "start",
      "launch"
    ],
    "templates": [
      "When do you want to launch your campaigns? ⏰"
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
