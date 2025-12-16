export const service = "Creative & Design";
export const openingMessage = "Hey! 🎨 Let's create something beautiful together. Tell me about your design needs!";
export const questions = [
  {
    "key": "name",
    "patterns": [
      "name",
      "call you"
    ],
    "templates": [
      "Hey! 🎨 Let's create something beautiful. What's your name?"
    ],
    "suggestions": null
  },
  {
    "key": "company",
    "patterns": [
      "company",
      "brand",
      "business"
    ],
    "templates": [
      "Nice to meet you, {name}! What's your company or brand called?"
    ],
    "suggestions": null
  },
  {
    "key": "design_type",
    "patterns": [
      "type",
      "need",
      "looking for",
      "want"
    ],
    "templates": [
      "What kind of design work do you need? ✨"
    ],
    "suggestions": [
      "Logo",
      "Branding",
      "Social Media Graphics",
      "UI/UX",
      "Print Design",
      "Other"
    ]
  },
  {
    "key": "style",
    "patterns": [
      "style",
      "look",
      "vibe",
      "aesthetic"
    ],
    "templates": [
      "What style or vibe are you going for?"
    ],
    "suggestions": [
      "Modern/Minimal",
      "Bold/Colorful",
      "Elegant/Luxury",
      "Playful/Fun",
      "Not sure yet"
    ]
  },
  {
    "key": "deliverables",
    "patterns": [
      "deliver",
      "files",
      "formats",
      "need"
    ],
    "templates": [
      "What deliverables do you need?"
    ],
    "suggestions": [
      "Logo files",
      "Social templates",
      "Brand guidelines",
      "Print-ready files",
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
      "What's your budget for this project? 💰"
    ],
    "suggestions": [
      "Under ₹10,000",
      "₹10,000 - ₹25,000",
      "₹25,000 - ₹50,000",
      "₹50,000+"
    ]
  },
  {
    "key": "timeline",
    "patterns": [
      "timeline",
      "when",
      "deadline"
    ],
    "templates": [
      "When do you need this done? ⏰"
    ],
    "suggestions": [
      "This week",
      "1-2 weeks",
      "1 month",
      "Flexible"
    ]
  }
];

const chatbot = { service, openingMessage, questions };
export default chatbot;
