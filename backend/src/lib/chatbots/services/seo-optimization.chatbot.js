export const service = "SEO Optimization";
export const openingMessage = "Hi! 🔍 Ready to rank higher on Google? Let's boost your visibility!";
export const questions = [
  {
    "key": "name",
    "patterns": [
      "name",
      "call you"
    ],
    "templates": [
      "Hey! 🔍 Ready to rank higher on Google? What's your name?"
    ],
    "suggestions": null
  },
  {
    "key": "website",
    "patterns": [
      "website",
      "url",
      "site"
    ],
    "templates": [
      "Nice to meet you, {name}! What's your website URL?"
    ],
    "suggestions": null
  },
  {
    "key": "goals",
    "patterns": [
      "goal",
      "achieve",
      "want",
      "need"
    ],
    "templates": [
      "What's your main goal with SEO? 🎯"
    ],
    "suggestions": [
      "Rank higher",
      "More traffic",
      "More leads",
      "Brand visibility"
    ]
  },
  {
    "key": "keywords",
    "patterns": [
      "keyword",
      "search",
      "term",
      "rank for"
    ],
    "templates": [
      "Any specific keywords you want to rank for?"
    ],
    "suggestions": null
  },
  {
    "key": "competitors",
    "patterns": [
      "competitor",
      "competition",
      "similar"
    ],
    "templates": [
      "Who are your main competitors?"
    ],
    "suggestions": null
  },
  {
    "key": "budget",
    "patterns": [
      "budget",
      "cost",
      "spend"
    ],
    "templates": [
      "What's your monthly budget for SEO? 💰"
    ],
    "suggestions": [
      "Under ₹10,000/mo",
      "₹10,000 - ₹25,000/mo",
      "₹25,000 - ₹50,000/mo",
      "₹50,000+/mo"
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
      "When would you like to start? ⏰"
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
