export const service = "Writing & Content";
export const openingMessage = "Hey! ✍️ Ready to create amazing content? Let's talk about what you need!";
export const questions = [
  {
    "key": "name",
    "patterns": [
      "name",
      "call you"
    ],
    "templates": [
      "Hey! ✍️ Ready to create amazing content? What's your name?"
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
      "Nice, {name}! What's your company or brand called?"
    ],
    "suggestions": null
  },
  {
    "key": "content_type",
    "patterns": [
      "type",
      "kind",
      "need",
      "content"
    ],
    "templates": [
      "What type of content do you need? 📝"
    ],
    "suggestions": [
      "Blog posts",
      "Website copy",
      "Social media",
      "Email campaigns",
      "Scripts",
      "Other"
    ]
  },
  {
    "key": "tone",
    "patterns": [
      "tone",
      "style",
      "voice",
      "sound"
    ],
    "templates": [
      "What tone should the content have?"
    ],
    "suggestions": [
      "Professional",
      "Friendly",
      "Persuasive",
      "Educational",
      "Fun/Casual"
    ]
  },
  {
    "key": "volume",
    "patterns": [
      "volume",
      "how much",
      "many",
      "pieces"
    ],
    "templates": [
      "How much content do you need?"
    ],
    "suggestions": [
      "1-5 pieces",
      "5-10 pieces",
      "10-20 pieces",
      "Ongoing monthly"
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
      "What's your budget for this? 💰"
    ],
    "suggestions": [
      "Under ₹5,000",
      "₹5,000 - ₹15,000",
      "₹15,000 - ₹30,000",
      "₹30,000+"
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
      "When do you need the content? ⏰"
    ],
    "suggestions": [
      "ASAP",
      "This week",
      "2 weeks",
      "Flexible"
    ]
  }
];

const chatbot = { service, openingMessage, questions };
export default chatbot;
