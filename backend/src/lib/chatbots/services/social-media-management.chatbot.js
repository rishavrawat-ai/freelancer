export const service = "Social Media Management";
export const openingMessage = "Hey! 📱 Let's grow your social presence! Tell me about your goals.";
export const questions = [
  {
    "key": "name",
    "patterns": [
      "name",
      "call you"
    ],
    "templates": [
      "Hey! 📱 Let's grow your social presence! What's your name?"
    ],
    "suggestions": null
  },
  {
    "key": "brand",
    "patterns": [
      "brand",
      "business",
      "company"
    ],
    "templates": [
      "Nice, {name}! What's your brand or business called?"
    ],
    "suggestions": null
  },
  {
    "key": "platforms",
    "patterns": [
      "platform",
      "social",
      "channel"
    ],
    "templates": [
      "Which platforms do you want to focus on? 📲"
    ],
    "suggestions": [
      "Instagram",
      "Facebook",
      "LinkedIn",
      "Twitter/X",
      "TikTok",
      "All of them"
    ]
  },
  {
    "key": "goals",
    "patterns": [
      "goal",
      "achieve",
      "want"
    ],
    "templates": [
      "What's your main goal with social media?"
    ],
    "suggestions": [
      "More followers",
      "Engagement",
      "Brand awareness",
      "Sales/Leads"
    ]
  },
  {
    "key": "content",
    "patterns": [
      "content",
      "posts",
      "create"
    ],
    "templates": [
      "Do you need help with content creation too?"
    ],
    "suggestions": [
      "Yes, full content",
      "Just scheduling",
      "Strategy only",
      "All of it"
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
      "What's your monthly budget? 💰"
    ],
    "suggestions": [
      "Under ₹15,000/mo",
      "₹15,000 - ₹30,000/mo",
      "₹30,000 - ₹50,000/mo",
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
      "When do you want to kick this off? ⏰"
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
