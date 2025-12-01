import OpenAI from "openai";
import { env } from "../config/env.js";
import fs from "fs";
import path from "path";
import {
    DEFAULT_QUESTIONS,
    SERVICE_QUESTION_SETS
} from "../constants/serviceQuestions.js";
import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../utils/async-handler.js";
import { AppError } from "../utils/app-error.js";
import {
    ensureConversation,
    createConversation as createInMemoryConversation,
    getConversation,
    listMessages,
    addMessage
} from "../lib/chat-store.js";

const MIN_WEBSITE_PRICE = 10000;
const MIN_WEBSITE_PRICE_DISPLAY = "INR 10,000";
const MAX_COMPLETION_TOKENS = 900;

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

const normalizeService = (service = "") => {
    const safe = (service || "").toString().trim();
    return safe.length ? safe : null;
};

const serializeMessage = (message) => ({
    ...message,
    createdAt:
        message.createdAt instanceof Date
            ? message.createdAt.toISOString()
            : message.createdAt
});

const toHistoryMessage = (message) => ({
    role: message.role === "assistant" ? "assistant" : "user",
    content: message.content
});

const getServiceDetails = (service) => {
    const services = {
        "Development & Tech": "Websites, mobile apps, SaaS platforms, and e-commerce solutions.",
        "Digital Marketing": "SEO, PPC, social media management, and content marketing strategies.",
        "Video Services": "Video editing, promotional content, CGI, UGC, and animation.",
        "Creative & Design": "Branding, UI/UX, graphics, and motion design.",
        "Lead Generation": "Targeted lists, outreach campaigns, and funnel building.",
        "Writing & Content": "SEO blogs, copywriting, technical writing, and scripts.",
        "Customer Support": "Multi-channel support, helpdesk setup, and 24/7 options.",
        "Administrative Services": "Virtual assistance, data management, and scheduling.",
        "Audio Services": "Voiceover, podcast production, mixing & mastering.",
        "Lifestyle & Personal": "Coaching, fitness, personal styling, and wellness."
    };
    return services[service] || "Custom services based on your requirements.";
};

const needsWebsitePolicy = (service = "") => service.toLowerCase().includes("web");

const getWebsitePolicy = (service) =>
    needsWebsitePolicy(service)
        ? `Website projects policy:
- Hosting and domain must be purchased and owned by the client (Hostinger/domain handled on the client side).
- Minimum website project price: ${MIN_WEBSITE_PRICE_DISPLAY}. If budget is lower, propose a reduced scope or phased delivery.`
        : "";

// Ensure proposals always include the closing tag so the UI can parse them,
// even if the model truncates the response.
const normalizeProposalTags = (content = "") => {
    if (!content.includes("[PROPOSAL_DATA]") || content.includes("[/PROPOSAL_DATA]")) {
        return content;
    }
    return `${content.trim()}\n[/PROPOSAL_DATA]`;
};

const getCounterQuestion = () => `Counter question (ask first):
- Ask: "To get started, please share 1) a brief project summary, 2) must-have features, 3) expected timeline."
- Offer suggestions:
  - Landing page + lead form; timeline 2-4 weeks
  - Business site (4-6 pages) + contact; timeline 1 month
  - E-commerce (catalog + checkout); timeline 1-2 months
  - Custom: I'll describe my needs`;

const devTechFlow = `Conversation format (Development & Tech):
- No intros or preamble. Output only the next question (or brief confirmation + next question).
- Ask one question at a time in this order and keep answers short:
  1) Could you please provide your first name?
  2) What is the name of your company or project?
  3) Where are you located? (options: North America, Europe, Asia, Remote/Global, Other)
  4) What specific type of development service do you require? (options: Website, Web Application/SaaS, Mobile Application, E-Commerce Platform, Custom Software)
  5) Is this a new project or an existing one that requires updates? (options: New Project, Existing (Update), Existing (Rewrite), Consultation)
  6) Please provide a brief summary of the project (what it does, target audience, 2-3 sentences).
  7) What are the essential features or pages required? (Output options as [MULTI_SELECT: User Auth | Payment Gateway | Admin Panel | Dashboard | Search | Messaging | File Upload])
  8) Do you have existing designs, wireframes, or concepts ready? (options: Yes (Full Designs), Partial Designs, Wireframes Only, No (I need design services))
  9) Would you like us to handle the UI/UX design? (options: Yes (Full Design), UI Polish Only, No (I have designs))
  10) Do you have a preferred technology stack or platform? (Output options as [MULTI_SELECT: React/Next.js | Node.js | PHP/Laravel | WordPress | Python/Django | No Preference])
  11) Do you require any specific integrations? (Output options as [MULTI_SELECT: Stripe/PayPal | Google Maps | Social Login | CRM | Analytics | None])
  12) Will you require ongoing maintenance or support after the launch? (options: Yes (Monthly), Yes (Ad-hoc), No (Handover only))
  13) What is your estimated budget range? (options: < $1k, $1k-$5k, $5k-$10k, $10k-$20k, $20k+)
  14) What is your desired timeline for completion? (options: 2-4 weeks, 1-2 months, 2-3 months, Flexible)
  15) Do you require SEO, analytics, or marketing tools? (Output options as [MULTI_SELECT: Basic SEO | Full Marketing | Analytics Setup | None])
  16) Are there any AI features, chatbots, or automation requirements? (Output options as [MULTI_SELECT: AI Chatbot | Content Gen | Data Analysis | None])
  17) Do you have any special requests or constraints? (options: NDA Required, Fast Turnaround, Specific Timezone, None)
  18) Please provide links to previous projects, repositories, or references (optional). (options: I have links, No references)
- Be concise (1-2 sentences), respond promptly, and proceed to the next question.
- Do NOT stop; always ask the next question until all are answered or you deliver the proposal.`;

const proposalTemplate = `When you have enough answers, generate a proposal in this exact structure (replace unknowns with "Not provided"):
[PROPOSAL_DATA]
PROJECT PROPOSAL
Project Title: [Service]

Prepared for: [Name] - [Company/Project]

Executive Summary
[Name] has requested [Service] services. Target delivery: [Timeline]. Budget: [Budget].

Scope of Work
Phase 1: Discovery & Planning - Requirements gathering, defining core features, and technical architecture setup. (Tech Stack: [Tech Stack])
Phase 2: UI/UX Design - Wireframing, mockup creation, and client review to finalize the user experience.
Phase 3: Development & Integration - Building the core software/website functionality (e.g., [Service Type]) and integrating necessary APIs.
Phase 4: Testing & Deployment - Comprehensive QA across target devices and final launch.

Features & Services Included
[List specific features and services discussed, e.g., User Auth, Dashboard, specific pages, etc.]

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
Generated from questionnaire answers - edit if you'd like to add more specifics before saving.
[/PROPOSAL_DATA]`;

const getQuestionsForService = (service = "") =>
    SERVICE_QUESTION_SETS[service] || DEFAULT_QUESTIONS;

const getInstructions = () => {
    try {
        const filePath = path.join(process.cwd(), "src", "data", "instructions.md");
        return fs.readFileSync(filePath, "utf-8");
    } catch (error) {
        console.error("Error reading instructions file:", error);
        return "";
    }
};

const buildSystemPrompt = (service) => {
    const servicePolicy = getWebsitePolicy(service);
    const counterQuestion = getCounterQuestion();
    const questions = getQuestionsForService(service);
    const instructions = getInstructions();
    const questionLines = questions
        .map(
            (q, idx) =>
                `${idx + 1}) ${q.text}${q.suggestions ? ` (options: ${q.suggestions.join(", ")})` : ""}`
        )
        .join("\n");

    return `You are a professional consultant for FreelanceHub helping clients with "${service}" projects.

Response rules:
- Maintain a strictly professional, direct, and concise tone.
- Do NOT use buzzwords, slang, or overly enthusiastic language.
- Keep responses very short (1-2 sentences max).
- Ask ONE focused question at a time.
- CRITICAL: Do NOT repeat questions. Check the history. If a question was already asked and the user answered (even briefly), accept it and move to the next one.
- CRITICAL: Output suggestions for the CURRENT question if applicable.
- Do NOT use markdown bolding (like **text**) in your responses.
- If the question instructions say "Output options as [MULTI_SELECT: ...]", you MUST use that exact format.
- Otherwise, for single-choice questions, format suggestions like this:
  \`[SUGGESTIONS: Option 1 | Option 2 | Option 3]\`
- If the user selects an option, treat it as their answer and move to the next question immediately.
- When generating the proposal, YOU MUST wrap it in \`[PROPOSAL_DATA]...[/PROPOSAL_DATA]\` tags.

Context & Logic:
- **Context Awareness**: Reference the user's previous answers in your questions to show understanding (e.g., "Since you need a dashboard, what specific metrics...?").
- **Compatibility Check**: If the user requests incompatible technologies (e.g., "Shopify + 3D" or "WordPress + React Native" without a headless setup), politely flag the potential conflict or complexity in your response before asking the next question.

Service Info: ${service}
${getServiceDetails(service)}   
${servicePolicy ? `\n${servicePolicy}\n` : ""}${counterQuestion}

OFFICIAL SERVICE INSTRUCTIONS AND PRICING (STRICTLY FOLLOW THESE):
${instructions}

Use this question order for this service (ask top-down, skip if already answered):
${questionLines}
If a suggestion list exists for the current question, surface 3-5 short options in the [SUGGESTIONS: ...] format.

Proposal instructions:
${proposalTemplate.replace(/\*\*/g, "")}

Your Goal:
- Gather: 1) what they need, 2) timeline, 3) budget range.
- Do NOT stop mid-flow; always ask the next required question.
- If a website budget is under ${MIN_WEBSITE_PRICE_DISPLAY}, restate the minimum and suggest a smaller scope or phased plan.

After 3-4 exchanges, or when you have enough info, generate the FULL PROPOSAL using the [PROPOSAL_DATA] template.
Ensure the "Scope of Work" and "Features & Services" sections are detailed and specific to the user's requests.
Do NOT generate a partial "Quick Proposal".
Keep it short and structured.`;
};

export const generateChatReply = async ({ message, service, history }) => {
    const apiKey = env.OPENROUTER_API_KEY?.trim();

    if (!apiKey) {
        throw new Error(
            "LLM API key not configured. Set OPENROUTER_API_KEY in backend/.env."
        );
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

    const messages = [
        { role: "system", content: systemContent },
        ...safeHistory.map((msg) => ({
            role: msg.role === "assistant" ? "assistant" : "user",
            content: msg.content
        })),
        { role: "user", content: message }
    ];

    let completion;
    try {
        completion = await openai.chat.completions.create({
            model: env.OPENROUTER_MODEL,
            messages,
            max_tokens: MAX_COMPLETION_TOKENS,
            temperature: 0.2
        });
    } catch (error) {
        if (error?.status === 429 && env.OPENROUTER_MODEL_FALLBACK) {
            console.warn(
                `Primary model ${env.OPENROUTER_MODEL} rate limited. Switching to fallback model ${env.OPENROUTER_MODEL_FALLBACK}...`
            );
            completion = await openai.chat.completions.create({
                model: env.OPENROUTER_MODEL_FALLBACK,
                messages,
                max_tokens: MAX_COMPLETION_TOKENS,
                temperature: 0.2
            });
        } else {
            console.error("Primary model failed with error:", error);
            throw error;
        }
    }

    const rawContent =
        completion?.choices?.[0]?.message?.content ||
        "I'm here-please share a bit more so I can prepare your quick proposal.";

    return normalizeProposalTags(rawContent);
};

export const chatController = async (req, res) => {
    try {
        const { message, service, history } = req.body;

        if (!message) {
            return res.status(400).json({ error: "Message is required" });
        }

        console.log("Sending request to OpenRouter...");
        const botResponse = await generateChatReply({
            message,
            service,
            history: Array.isArray(history) ? history : []
        });

        // Strip markdown bolding from the response
        const cleanResponse = botResponse.replace(/\*\*/g, "");

        res.json({ response: cleanResponse });
    } catch (error) {
        console.error("Chat error:", error);
        if (error?.response) {
            console.error("OpenAI API Error Data:", error.response.data);
            console.error("OpenAI API Error Status:", error.response.status);
        }
        res.status(500).json({
            error: "Unable to generate a response right now. Please try again."
        });
    }
};

export const createConversation = asyncHandler(async (req, res) => {
    const createdById = req.user?.sub || null;
    const serviceKey = normalizeService(req.body?.service);
    const forceNew = req.body?.forceNew === true;
    const ephemeral = req.body?.mode === "assistant" || req.body?.ephemeral === true;

    if (ephemeral) {
        const conversation = createInMemoryConversation({
            service: serviceKey,
            createdById
        });
        res.status(201).json({ data: conversation });
        return;
    }

    const existing = !forceNew && serviceKey
        ? await prisma.chatConversation.findFirst({
            where: { service: serviceKey },
            orderBy: { createdAt: "desc" }
        })
        : null;

    if (existing) {
        res.status(200).json({ data: existing });
        return;
    }

    const conversation = await prisma.chatConversation.create({
        data: {
            service: serviceKey,
            createdById
        }
    });

    res.status(201).json({ data: conversation });
});

export const getConversationMessages = asyncHandler(async (req, res) => {
    const conversationId = req.params?.id;

    // Prefer in-memory conversation if present (AI chat), otherwise fall back to DB.
    const memoryConversation = getConversation(conversationId);
    if (memoryConversation) {
        const messages = listMessages(conversationId, 100);
        res.json({
            data: {
                conversation: memoryConversation,
                messages
            }
        });
        return;
    }

    const conversation = await prisma.chatConversation.findUnique({
        where: { id: conversationId }
    });

    if (!conversation) {
        throw new AppError("Conversation not found", 404);
    }

    const messages = await prisma.chatMessage.findMany({
        where: { conversationId },
        orderBy: { createdAt: "asc" },
        take: 100
    });

    res.json({
        data: {
            conversation,
            messages
        }
    });
});

export const addConversationMessage = asyncHandler(async (req, res) => {
    const conversationId = req.params?.id;
    const {
        content,
        service,
        senderId,
        senderRole,
        senderName,
        skipAssistant = false,
        history: clientHistory
    } = req.body || {};

    if (!content) {
        throw new AppError("Message content is required", 400);
    }

    const serviceKey = normalizeService(service);
    const useEphemeral = !skipAssistant || req.body?.mode === "assistant" || req.body?.ephemeral === true;

    // Assistant chat path: keep everything in memory/local only.
    if (useEphemeral) {
        const conversation = ensureConversation({
            id: conversationId,
            service: serviceKey,
            createdById: senderId || null
        });

        const userMessage = addMessage({
            conversationId: conversation.id,
            senderId: senderId || null,
            senderName: senderName || null,
            senderRole: senderRole || null,
            role: "user",
            content
        });

        let assistantMessage = null;

        if (!skipAssistant) {
        const dbHistory = Array.isArray(clientHistory)
            ? clientHistory.map(toHistoryMessage)
            : listMessages(conversation.id, 20).map(toHistoryMessage);

        try {
            const assistantReply = await generateChatReply({
                message: content,
                service: service || conversation.service || "",
                history: dbHistory
            });

                assistantMessage = addMessage({
                    conversationId: conversation.id,
                    senderName: "Assistant",
                    senderRole: "assistant",
                    role: "assistant",
                    content: assistantReply
                });
            } catch (error) {
                console.error("Assistant generation failed (HTTP):", error);
            }
        }

        res.status(201).json({
            data: {
                message: serializeMessage(userMessage),
                assistant: assistantMessage ? serializeMessage(assistantMessage) : null
            }
        });
        return;
    }

    // Persisted chat path (client & freelancer conversations)
    let conversation = null;

    if (conversationId) {
        conversation = await prisma.chatConversation.findUnique({
            where: { id: conversationId }
        });
    }

    if (!conversation && serviceKey) {
        conversation = await prisma.chatConversation.findFirst({
            where: { service: serviceKey }
        });
    }

    if (!conversation) {
        conversation = await prisma.chatConversation.create({
            data: {
                service: serviceKey,
                createdById: senderId || null
            }
        });
    }

    const userMessage = await prisma.chatMessage.create({
        data: {
            conversationId: conversation.id,
            senderId: senderId || null,
            senderName: senderName || null,
            senderRole: senderRole || null,
            role: "user",
            content
        }
    });

    res.status(201).json({
        data: {
            message: serializeMessage(userMessage),
            assistant: null
        }
    });
});
