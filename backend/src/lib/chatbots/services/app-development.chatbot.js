export const service = "App Development";
export const openingMessage = "Hey! 📱 Ready to build your app? Let's figure out exactly what you need!";
export const questions = [
  {
    "key": "name",
    "patterns": [
      "name",
      "call you"
    ],
    "templates": [
      "Hey! 🚀 Let's build something amazing. What's your name?",
      "Hi there! Ready to create your website? What should I call you?"
    ],
    "suggestions": null
  },
  {
    "key": "company",
    "patterns": [
      "company",
      "project",
      "business"
    ],
    "templates": [
      "Nice to meet you, {name}! What's your company or project called?"
    ],
    "suggestions": null
  },
  {
    "key": "description",
    "patterns": [
      "building",
      "describe",
      "tell me",
      "about",
      "idea"
    ],
    "templates": [
      "Awesome! Tell me a bit about what you're building — what's the vision? 🚀",
      "Sounds exciting! What exactly are you looking to create?"
    ],
    "suggestions": null
  },
  {
    "key": "website_type",
    "patterns": [
      "type",
      "kind",
      "what website",
      "need"
    ],
    "templates": [
      "What kind of website do you need? (Select all that apply) 🌐"
    ],
    "suggestions": [
      "Landing Page",
      "Business Website",
      "Informational Website",
      "E-commerce",
      "Portfolio",
      "Web App",
      "Other"
    ],
    "multiSelect": true
  },
  {
    "key": "pages",
    "patterns": [
      "pages",
      "sections",
      "features"
    ],
    "templates": [
      "Every website includes: Home, About, Contact, Privacy Policy & Terms. What additional pages do you need? (Select all that apply)"
    ],
    "suggestions": [
      "Services",
      "Products",
      "Portfolio/Gallery",
      "Testimonials",
      "Blog",
      "FAQ",
      "Pricing",
      "Shop/Store",
      "Cart/Checkout",
      "Wishlist",
      "Order Tracking",
      "Reviews/Ratings",
      "Search",
      "Book Now",
      "Account/Login",
      "Admin Dashboard",
      "User Dashboard",
      "Analytics Dashboard",
      "Notifications",
      "Chat/Support Widget",
      "Help/Support",
      "Resources",
      "Events",
      "None"
    ],
    "multiSelect": true
  },
  {
    "key": "integrations",
    "patterns": [
      "integration",
      "payment",
      "api",
      "third-party"
    ],
    "templates": [
      "What integrations do you need? (Select all that apply) 🔌"
    ],
    "suggestions": [
      "Payment Gateway (Razorpay/Stripe)",
      "Email Service (Nodemailer/Resend)",
      "Delivery/Shipping Tracking",
      "None"
    ],
    "multiSelect": true
  },
  {
    "key": "design",
    "patterns": [
      "design",
      "look",
      "style",
      "wireframe"
    ],
    "templates": [
      "Do you have any designs or inspirations in mind? 🎨"
    ],
    "suggestions": [
      "I have designs",
      "Need design help",
      "Have some references",
      "Not sure yet"
    ]
  },
  {
    "key": "tech",
    "patterns": [
      "tech",
      "platform",
      "wordpress",
      "react"
    ],
    "templates": [
      "What technology stack would you prefer? (Select all that apply) 🛠️"
    ],
    "suggestions": [
      "WordPress",
      "Next.js",
      "React.js",
      "React.js + Node.js",
      "MERN Stack",
      "PERN Stack",
      "Shopify",
      "Shopify + Hydrogen (React)",
      "Laravel + Vue",
      "Django + React",
      "Frontend Only",
      "Backend Only",
      "No preference"
    ],
    "multiSelect": true
  },
  {
    "key": "deployment",
    "patterns": [
      "deploy",
      "hosting",
      "server",
      "cloud"
    ],
    "templates": [
      "Where would you like the website deployed/hosted? 🚀"
    ],
    "suggestions": [
      "Vercel",
      "Netlify",
      "AWS",
      "DigitalOcean",
      "Railway",
      "Render",
      "VPS/Custom Server",
      "Not sure yet"
    ],
    "multiSelect": true
  },
  {
    "key": "domain",
    "patterns": [
      "domain",
      "url",
      "website name"
    ],
    "templates": [
      "Do you have a domain name? 🌍"
    ],
    "suggestions": [
      "I already have domain",
      "I don't have domain"
    ]
  },
  {
    "key": "budget",
    "patterns": [
      "budget",
      "cost",
      "price",
      "spend"
    ],
    "templates": [
      "What's your budget for this project? 💰"
    ],
    "suggestions": [
      "Under ₹20,000",
      "₹20,000 - ₹50,000",
      "₹50,000 - ₹1,00,000",
      "₹1,00,000+"
    ]
  },
  {
    "key": "timeline",
    "patterns": [
      "timeline",
      "deadline",
      "when",
      "launch"
    ],
    "templates": [
      "When do you need the website ready? ⏰"
    ],
    "suggestions": [
      "1-2 weeks",
      "1 month",
      "2-3 months",
      "Flexible"
    ]
  }
];

const chatbot = { service, openingMessage, questions };
export default chatbot;
