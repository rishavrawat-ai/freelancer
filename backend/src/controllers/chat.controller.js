import OpenAI from "openai";
import { env } from "../config/env.js";
import {
    DEFAULT_QUESTIONS,
    SERVICE_QUESTION_SETS
} from "../constants/serviceQuestions.js";

const MIN_WEBSITE_PRICE = 120000;
const MIN_WEBSITE_PRICE_DISPLAY = "INR 120,000";

const normalizeOrigin = (value = "") => value.trim().replace(/\/$/, "");
const parseOrigins = (value = "") =>
    value
        .split(",")
        .map(normalizeOrigin)
        .filter(Boolean);

const allowedOrigins = [
    ...parseOrigins(env.CORS_ORIGIN || ""),
    normalizeOrigin(env.LOCAL_CORS_ORIGIN || ""),
    normalizeOrigin(env.VERCEL_CORS_ORIGIN || "")
].filter(Boolean);

const defaultReferer =
    allowedOrigins[0] ||
    normalizeOrigin(process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "") ||
    "http://localhost:5173";

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
- No intros or preamble. Output only the next question (or brief confirmation + next question).
- Ask one question at a time in this order and keep answers short:
  1) What's your first name?
  2) What's your company or project name?
  3) Where are you based?
  4) What type of development or tech service are you looking for? (options: Website, Web App/SaaS, Mobile App, E-commerce, Other)
  5) Is this a new project or an existing one that needs updates?
  6) Describe the project briefly (what it does, who uses it, 2-3 sentences).
  7) What are the must-have features or pages? (bullet list ok)
  8) Do you already have a design, wireframe, or concept ready? (Yes/No/Partial)
  9) Would you like us to handle the UI/UX design? (Yes/No/Partial)
  10) Do you have a preferred tech stack or platform? (e.g., React, Next.js, Node, Laravel, WordPress, Other)
  11) Do you require integrations? (payment, auth, CRM/API, analytics)
  12) Will you need ongoing maintenance or support after launch?
  13) What's your estimated budget range? (remind the minimum ${MIN_WEBSITE_PRICE_DISPLAY})
  14) What's your desired project timeline? (options: 2-4 weeks, 1-2 months, 2-3 months, Flexible)
  15) Any SEO/analytics or marketing tools needed? (Yes/No/Maybe later)
  16) Any AI features, chatbots, or automation needed? (Yes/No/Interested)
  17) Any special requests or constraints?
  18) Provide links to previous projects, repos, or references (optional).
- Be concise (1-2 sentences), respond fast, and move to the next question.
- Do NOT stop; always ask the next question until all are answered or you deliver the proposal.`;

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

const getQuestionsForService = (service = "") =>
    SERVICE_QUESTION_SETS[service] || DEFAULT_QUESTIONS;

const buildSystemPrompt = (service) => {
    const servicePolicy = getWebsitePolicy(service);
    const counterQuestion = getCounterQuestion();
    const questions = getQuestionsForService(service);
    const questionLines = questions
        .map(
            (q, idx) =>
                `${idx + 1}) ${q.text}${q.suggestions ? ` (options: ${q.suggestions.join(", ")})` : ""}`
        )
        .join("\n");

    return `You are a professional consultant for FreelanceHub helping clients with "${service}" projects.

Response rules:
- Keep responses very short (1-2 sentences max)
- Ask one focused question at a time
- Use bullet points for lists
- Be direct, professional, and friendly
- Respond fast and move to the next question quickly.
- No intros or repeated greetings; output only the next question (or brief confirmation + next question).
- Keep a strict checklist: mark a question asked as "done" and never ask it again unless the answer was empty/unclear. If the user re-answers an earlier question, accept it and move to the next unanswered one—do not repeat it.
- Once all checklist items are answered (or the user declines), immediately generate the proposal from what you have and stop asking questions. Do NOT ask any further questions after that.
- If the user asks for suggestions, provide 3-5 concise, relevant options tailored to the service, then continue with the next unanswered checklist item.
- Ask the most important items first: 1) project summary, 2) budget (remind floor ${MIN_WEBSITE_PRICE_DISPLAY} if web), 3) timeline, 4) must-have features, 5) tech/design constraints.
- If an answer is blank, off-topic, contradictory, or clearly unrealistic (e.g., budget below floor, impossible timeline), ask for a correction briefly and give a 1-line example to guide them.
- If the budget is below ${MIN_WEBSITE_PRICE_DISPLAY} for a website, restate the minimum and ask them to confirm/adjust the budget or scope.
- Confirm unclear answers once, then continue to the next critical question.
- Do not repeat questions. Keep a mental checklist. Ask at most 10 questions total, then summarize and deliver the proposal and next steps.

Service Info: ${service}
${getServiceDetails(service)}   
${servicePolicy ? `\n${servicePolicy}\n` : ""}${counterQuestion}

Use this question order for this service (ask top-down, skip if already answered):
${questionLines}
If a suggestion list exists, surface 3-6 short options inline.
Keep phrasing concise and move fast.
${service === "Development & Tech" ? `\n${devTechFlow}\n` : ""}

Proposal instructions:
${proposalTemplate}

Your Goal:
- Gather: 1) what they need, 2) timeline, 3) budget range. Do NOT stop mid-flow; always ask the next required question.
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

        if (!message) {
            return res.status(400).json({ error: "Message is required" });
        }

        const apiKey = env.OPENROUTER_API_KEY?.trim();

        if (!apiKey) {
            console.error("API Key is missing");
            return res.status(500).json({
                error: "LLM API key not configured. Set OPENROUTER_API_KEY in backend/.env."
            });
        }

        const openai = new OpenAI({
            baseURL: "https://openrouter.ai/api/v1",
            apiKey: apiKey,
            defaultHeaders: {
                "HTTP-Referer": defaultReferer,
                "X-Title": "Freelancer Platform"
            }
        });

        const systemContent = buildSystemPrompt(service || "");
        const safeHistory = Array.isArray(history) ? history.slice(-20) : [];

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
                max_tokens: 320, // allow fuller replies without cutting off
                temperature: 0.2,
            });
        } catch (error) {
            if (error?.status === 429 && env.OPENROUTER_MODEL_FALLBACK) {
                console.warn(`Primary model ${env.OPENROUTER_MODEL} rate limited. Switching to fallback model ${env.OPENROUTER_MODEL_FALLBACK}...`);
                completion = await openai.chat.completions.create({
                    model: env.OPENROUTER_MODEL_FALLBACK,
                    messages: messages,
                    max_tokens: 320,
                    temperature: 0.2,
                });
            } else {
                console.error("Primary model failed with error:", error);
                throw error;
            }
        }

        const botResponse =
            completion?.choices?.[0]?.message?.content ||
            "I'm here—please share a bit more so I can prepare your quick proposal.";
        res.json({ response: botResponse });

    } catch (error) {
        console.error("Chat error:", error);
        if (error?.response) {
            console.error("OpenAI API Error Data:", error.response.data);
            console.error("OpenAI API Error Status:", error.response.status);
        }
        res.status(500).json({ error: "Unable to generate a response right now. Please try again." });
    }
};
