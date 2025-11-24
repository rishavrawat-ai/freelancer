import OpenAI from "openai";
import { env } from "../config/env.js";

const MIN_WEBSITE_PRICE = 25000;
const MIN_WEBSITE_PRICE_DISPLAY = "INR 25,000";

// Helper function to get service details
const getServiceDetails = (service) => {
    const services = {
        "Development & Tech": "Starting at INR 120,000. Web/mobile apps, SaaS platforms, e-commerce solutions.",
        "Digital Marketing": "Starting at INR 110,000. SEO, PPC, social media, content marketing strategies.",
        "Video Services": "Starting at INR 17,500. Video editing, promotional content, animation.",
        "Creative & Design": "Starting at INR 13,500. Branding, UI/UX, graphics, motion design.",
        "Lead Generation": "Starting at INR 115,000. Targeted lists, outreach campaigns, funnel building.",
        "Writing & Content": "Starting at INR 12,000. SEO blogs, copywriting, technical writing.",
        "Customer Support": "Starting at INR 18,000. Multi-channel support, helpdesk setup, 24/7 options.",
        "Administrative Services": "Starting at INR 13,000. Virtual assistance, data management, scheduling.",
        "Audio Services": "Starting at INR 12,000. Voiceover, podcast production, mixing & mastering.",
        "Lifestyle & Personal": "Starting at INR 12,500. Coaching, fitness, personal styling."
    };
    return services[service] || "Custom pricing based on requirements.";
};

const needsWebsitePolicy = (service = "") => service.toLowerCase().includes("web");

const getWebsitePolicy = (service) => needsWebsitePolicy(service) ? `Website projects policy:
- Hosting and domain must be purchased and owned by the client (Hostinger/domain handled on the client side).
- Minimum website project price: ${MIN_WEBSITE_PRICE_DISPLAY}. If budget is lower, propose a reduced scope or phased delivery.` : "";

const getCounterQuestion = () => `Counter question (ask first):
- Ask: "To get started, please share 1) a brief project summary, 2) must-have features, 3) expected timeline."
- Offer suggestions:
  - Landing page + lead form; timeline 2-4 weeks
  - Business site (4-6 pages) + contact; timeline 1 month
  - E-commerce (catalog + checkout); timeline 1-2 months
  - Custom: I'll describe my needs`;

// Guided flow specifically for Development & Tech
const devTechFlow = `Conversation format (Development & Tech):
- Start with: "Hi! I'll help you create a proposal for your Development & Tech project. Let's start with a few questions."
- Ask one question at a time in this order and keep answers short:
  1) Hi there! What’s your first name?
  2) What’s your company or project name?
  3) Where are you based?
  4) What type of development or tech service are you looking for? (use their choice if given)
  5) Is this a new project or an existing one that needs updates?
  6) Please describe your project or idea in a few sentences.
  7) What are your main goals for this project?
  8) Do you already have a design, wireframe, or concept ready?
  9) Will you need ongoing maintenance or support after launch?
  10) Do you have a preferred tech stack or platform?
  11) Do you require any integrations?
  12) Would you like us to handle the UI/UX design as part of the project?
  13) What’s your estimated budget range for this project? (remind website floor if relevant)
  14) What’s your desired project timeline?
  15) Would you like SEO setup, analytics, or marketing tools included?
  16) Do you want to include AI features, chatbots, or automation in your project?
  17) Do you have any special request?
  18) Provide links to previous projects, repos, or case studies (optional).
- Be concise (1-2 sentences), respond fast, and move to the next question.`;

// Proposal template to generate once the questionnaire is answered
const proposalTemplate = `When you have enough answers, generate a proposal in this exact structure (replace unknowns with "Not provided"):
PROJECT PROPOSAL
Project Title: [Service]

Prepared for: [Name] — [Company/Project]

Executive Summary
[Name] has requested [Service] services. Target delivery: [Timeline]. Budget: [Budget].

Scope of Work
**Phase 1: Discovery & Planning** - Requirements gathering, defining core features, and technical architecture setup. (Tech Stack: [Tech Stack])
**Phase 2: UI/UX Design** - Wireframing, mockup creation, and client review to finalize the user experience.
**Phase 3: Development & Integration** - Building the core software/website functionality (e.g., [Service Type]) and integrating necessary APIs.
**Phase 4: Testing & Deployment** - Comprehensive QA across target devices and final launch.
Deliverables
Website Development Functional Beta/Staging link for review.
Final, clean, and commented Source Code Repository.
Technical documentation & deployment guide.
Timeline
[Timeline]

Budget & Estimate
Based on the provided budget ([Budget]), we'll prepare a detailed package and recommend the best options that fit this range.

Portfolio & Relevant Experience
Client-provided portfolio / references:
[Portfolio]

Special Requests / Notes
[Special Requests]

Next Steps
Confirm package & scope.
Sign proposal & pay deposit (deposit amount depends on chosen package).
Kickoff meeting to gather assets & finalize schedule.
Generated from questionnaire answers — edit if you'd like to add more specifics before saving.`;

const buildSystemPrompt = (service) => {
    const servicePolicy = getWebsitePolicy(service);
    const counterQuestion = getCounterQuestion();

    return `You are a professional consultant for FreelanceHub helping clients with "${service}" projects.

Response rules:
- Keep responses very short (1-2 sentences max)
- Ask one focused question at a time
- Use bullet points for lists
- Be direct, professional, and friendly
- Respond fast and move to the next question quickly.

Service Info: ${service}
${getServiceDetails(service)}
${servicePolicy ? `\n${servicePolicy}\n` : ""}${counterQuestion}
${service === "Development & Tech" ? `\n${devTechFlow}\n` : ""}

Proposal instructions:
${proposalTemplate}

Your Goal:
- Gather: 1) what they need, 2) timeline, 3) budget range
- If a website budget is under ${MIN_WEBSITE_PRICE_DISPLAY}, restate the minimum and suggest a smaller scope or phased plan.

After 3-4 exchanges, provide:
- Quick Proposal: 1 line scope
- Timeline: estimate
- Budget: range starting at your floor
- Next: Book a consultation at FreelanceHub

Keep it short and structured.`;
};

export const chatController = async (req, res) => {
    try {
        const { message, service, history } = req.body;

        console.log("Request received in chatController");
        console.log("Service:", service);
        console.log("Message:", message);

        if (!message) {
            return res.status(400).json({ error: "Message is required" });
        }

        const apiKey = process.env.OPENROUTER_API_KEY;
        console.log("API Key configured:", !!apiKey);

        if (!apiKey) {
            console.error("API Key is missing");
            return res.status(500).json({ error: "LLM API key not configured" });
        }

        const openai = new OpenAI({
            baseURL: "https://openrouter.ai/api/v1",
            apiKey: apiKey,
            defaultHeaders: {
                "HTTP-Referer": "http://localhost:5173", // Update with your actual site URL
                "X-Title": "Freelancer Platform", // Update with your actual site name
            },
        });

        const systemContent = buildSystemPrompt(service || "");
        const safeHistory = Array.isArray(history) ? history : [];

        // Construct messages array from history and current message
        const messages = [
            { role: "system", content: systemContent },
            ...safeHistory.map(msg => ({ role: msg.role, content: msg.content })),
            { role: "user", content: message }
        ];

        console.log("Sending request to OpenRouter...");
        let completion;
        try {
            completion = await openai.chat.completions.create({
                model: env.OPENROUTER_MODEL,
                messages: messages,
                max_tokens: 120, // Keep responses short and concise
                temperature: 0.2,
            });
        } catch (error) {
            if (error.status === 429 && env.OPENROUTER_MODEL_FALLBACK) {
                console.warn(`Primary model ${env.OPENROUTER_MODEL} rate limited. Switching to fallback model ${env.OPENROUTER_MODEL_FALLBACK}...`);
                completion = await openai.chat.completions.create({
                    model: env.OPENROUTER_MODEL_FALLBACK,
                    messages: messages,
                    max_tokens: 120,
                    temperature: 0.2,
                });
            } else {
                console.error("Primary model failed with error:", error);
                throw error;
            }
        }
        console.log("Received response from OpenRouter");

        const botResponse = completion.choices[0].message.content;
        res.json({ response: botResponse });

    } catch (error) {
        console.error("Chat error:", error);
        if (error.response) {
            console.error("OpenAI API Error Data:", error.response.data);
            console.error("OpenAI API Error Status:", error.response.status);
        }
        res.status(500).json({ error: "Internal server error" });
    }
};
