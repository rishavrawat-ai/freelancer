import OpenAI from "openai";
import { env } from "../config/env.js";
import fs from "fs";
import path from "path";
import {
  DEFAULT_QUESTIONS,
  SERVICE_QUESTION_SETS,
} from "../constants/serviceQuestions.js";
import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../utils/async-handler.js";
import { AppError } from "../utils/app-error.js";
import {
  ensureConversation,
  createConversation as createInMemoryConversation,
  getConversation,
  listMessages,
  addMessage,
} from "../lib/chat-store.js";

const MIN_WEBSITE_PRICE = 10000;
const MIN_WEBSITE_PRICE_DISPLAY = "INR 10,000";
const MAX_COMPLETION_TOKENS = 900;
// Stack-specific minimum viable budgets (in INR) to steer users toward realistic options.
const STACK_BUDGET_FLOORS = {
  "React/Next.js": 60000,
  "Node.js": 60000,
  Laravel: 40000,
  WordPress: 15000,
  "Web Application/SaaS": 75000,
  "E-Commerce Platform": 75000,
};

const normalizeOrigin = (value = "") => value.trim().replace(/\/$/, "");
const parseOrigins = (value = "") =>
  value.split(",").map(normalizeOrigin).filter(Boolean);

const allowedOrigins = [
  ...parseOrigins(env.CORS_ORIGIN || ""),
  normalizeOrigin(env.LOCAL_CORS_ORIGIN || ""),
  normalizeOrigin(env.VERCEL_CORS_ORIGIN || ""),
].filter(Boolean);

const defaultReferer =
  allowedOrigins[0] ||
  normalizeOrigin(
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : ""
  ) ||
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
      : message.createdAt,
});

const toHistoryMessage = (message) => ({
  role: message.role === "assistant" ? "assistant" : "user",
  content: message.content,
});

const getServiceDetails = (service) => {
  const services = {
    "Development & Tech":
      "Websites, mobile apps, SaaS platforms, and e-commerce solutions.",
    "Digital Marketing":
      "SEO, PPC, social media management, and content marketing strategies.",
    "Video Services":
      "Video editing, promotional content, CGI, UGC, and animation.",
    "Creative & Design": "Branding, UI/UX, graphics, and motion design.",
    "Lead Generation":
      "Targeted lists, outreach campaigns, and funnel building.",
    "Writing & Content":
      "SEO blogs, copywriting, technical writing, and scripts.",
    "Customer Support":
      "Multi-channel support, helpdesk setup, and 24/7 options.",
    "Administrative Services":
      "Virtual assistance, data management, and scheduling.",
    "Audio Services": "Voiceover, podcast production, mixing & mastering.",
    "Lifestyle & Personal":
      "Coaching, fitness, personal styling, and wellness.",
  };
  return services[service] || "Custom services based on your requirements.";
};

const needsWebsitePolicy = (service = "") =>
  service.toLowerCase().includes("web");

const getWebsitePolicy = (service) =>
  needsWebsitePolicy(service)
    ? `Website projects policy:
- Hosting and domain must be purchased and owned by the client (Hostinger/domain handled on the client side).
- Minimum website project price: ${MIN_WEBSITE_PRICE_DISPLAY}. If budget is lower, propose a reduced scope or phased delivery.`
    : "";

const formatStackBudgetFloors = () =>
  Object.entries(STACK_BUDGET_FLOORS)
    .map(([stack, amount]) => `${stack}: INR ${amount.toLocaleString("en-IN")}`)
    .join(" | ");

// Ensure proposals always include the closing tag so the UI can parse them,
// even if the model truncates the response.
const normalizeProposalTags = (content = "") => {
  if (
    !content.includes("[PROPOSAL_DATA]") ||
    content.includes("[/PROPOSAL_DATA]")
  ) {
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
  7) What are the essential features or pages required? Tailor this to their project type (e-commerce: product catalog/cart/checkout; SaaS: auth/dashboard; 3D site: 3D models/interactions). Output options as [MULTI_SELECT: ...] with only relevant items.
  8) Do you have existing designs, wireframes, or concepts ready? (options: Yes (Full Designs), Partial Designs, Wireframes Only, No (I need design services))
  9) Would you like us to handle the UI/UX design? (options: Yes (Full Design), UI Polish Only, No (I have designs))
  10) Do you have a preferred technology stack or platform? (Output options as [MULTI_SELECT: React/Next.js | Node.js | PHP/Laravel | WordPress | Python/Django | No Preference])
  11) Do you require any specific integrations? (Output options as [MULTI_SELECT: Stripe/PayPal | Google Maps | Social Login | CRM | Analytics | None])
  12) Will you require ongoing maintenance or support after the launch? (options: Yes (Monthly), Yes (Ad-hoc), No (Handover only))
  13) What is your estimated budget? Ask for one INR amount (numbers only). If their budget is below what their chosen stack typically needs, suggest a cheaper stack or phased approach with a one-line reason before moving on.
 14) What is your target go-live date or timeframe? Keep it simple and plain text (e.g., "by May 30" or "within 6 weeks"). (options: 2-4 weeks, 1-2 months, 2-3 months, Flexible)
  15) Do you require SEO, analytics, or marketing tools? (Output options as [MULTI_SELECT: Basic SEO | Full Marketing | Analytics Setup | None])
  16) Are there any AI features, chatbots, or automation requirements? (Output options as [MULTI_SELECT: AI Chatbot | Content Gen | Data Analysis | None])
  17) Do you have any special requests or constraints? (options: NDA Required, Fast Turnaround, Specific Timezone, None)
  18) Please provide links to previous projects, repositories, or references (optional). (options: I have links, No references)
- Be concise (1-2 sentences), respond promptly, and proceed to the next question.
- Do NOT loop or restart; once key items (summary, features/pages, stack/platform, budget, timeline) are answered, move to proposal generation.`;

const proposalTemplate = `When you have enough answers, generate a proposal in this exact structure. If any field or section is missing info, omit that line/section entirely (do NOT write placeholders like "Not provided" or leave bracket tokens like [Portfolio]). If there are no portfolio links or special requests, drop those sections.
[PROPOSAL_DATA]
PROJECT PROPOSAL
Project Title: [Service]
Prepared for: [Name] - [Company/Project]
Selected Tech Stack: [Tech Stack]
Recommended Package & Estimate: [Recommended Package & Estimate]

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

const summarizeContext = (messages = []) => {
  if (!messages.length) return "";
  const recent = messages.slice(-16);
  const lines = recent.map((msg) => {
    const prefix = msg.role === "assistant" ? "Q" : "A";
    return `${prefix}: ${msg.content}`;
  });
  return `Recent context (last ${recent.length} turns):\n${lines.join("\n")}`;
};

const buildSystemPrompt = (service) => {
  const servicePolicy = getWebsitePolicy(service);
  const counterQuestion = getCounterQuestion();
  const questions = getQuestionsForService(service);
  const instructions = getInstructions();
  const questionLines = questions
    .map((q, idx) => `${idx + 1}) ${q.text}`)
    .join("\n");

  return `You are a professional consultant for FreelanceHub helping clients with "${service}" projects.

Response rules:
- Maintain a strictly professional, direct, and concise tone.
- Do NOT use buzzwords, slang, or overly enthusiastic language.
- Keep responses very short (1-2 sentences max).
- Ask ONE focused question at a time.
- Track answers in a simple section map (name, company/project, summary, service type, features/pages, design readiness, tech stack, integrations, budget, timeline, references). If the user says "change/update <section>", jump to that section, ask for the new value, and continue from there without restarting the flow.
- If the user asks what can be changed, list the editable sections in one line like: "You can update: name, company, summary, features, design, stack, integrations, budget, timeline, references."
- Output plain text only—no JSON, XML, tool-call syntax, or angle-bracket tokens. Never echo system markers like "<|start|>" or "[call]".
- Keep an internal checklist of questions already asked/answered from the conversation history. If an item was asked before, skip it—do NOT restart or repeat it.
- Once the essentials are answered (who: name/company, what: summary + must-have features/pages, how: tech stack/platform, budget, timeline), generate the proposal instead of looping back to earlier questions.
- CRITICAL: Do NOT repeat questions. Check the history. If a question was already asked and the user answered (even briefly), accept it and move to the next one.
- Do NOT preface with "We need to ask next question" or repeat the same question text twice.
- Before asking, compare against your last 2 assistant messages—if it is the same question, skip ahead to the next unanswered item.
- If the user replies with anything after a question (even a short answer or "already shared"), treat it as answered and move on; do not re-ask.
- CRITICAL: Output suggestions for the CURRENT question if applicable.
- Do NOT use markdown bolding (like **text**) in your responses.
- If the question instructions say "Output options as [MULTI_SELECT: ...]", you MUST use that exact format.
- Otherwise, for single-choice questions, format suggestions like this:
  \`[SUGGESTIONS: Option 1 | Option 2 | Option 3]\`
- Tailor suggestions to the current service/subtype and prior answers; omit irrelevant options (e.g., show catalog/checkout for e-commerce, dashboard/auth for SaaS, design assets for design requests).
- Never embed option lists directly inside the question text; use the \`[SUGGESTIONS: ...]\` or \`[MULTI_SELECT: ...]\` line so the UI can render clickable chips.
- If the user selects an option, treat it as their answer and move to the next question immediately.
- When generating the proposal, YOU MUST wrap it in \`[PROPOSAL_DATA]...[/PROPOSAL_DATA]\` tags.
- "Recommended Package & Estimate" must be a scoped, realistic option (e.g., "WordPress e-commerce with custom theme + checkout - INR 60,000"). Do NOT simply restate the user's budget as the estimate; if budget is low, propose a phased or lighter-stack option with its own estimated range.

Context & Logic:
- **Context Awareness**: Reference the user's previous answers in your questions to show understanding (e.g., "Since you need a dashboard, what specific metrics...?").
- **Compatibility Check**: If the user requests incompatible technologies (e.g., "Shopify + 3D" or "WordPress + React Native" without a headless setup), politely flag the potential conflict or complexity in your response before asking the next question.
- **Budget vs Stack Guardrails**: If the user's budget is below the realistic floor for their chosen stack/type (${formatStackBudgetFloors()}), do NOT proceed as-is. Acknowledge the gap politely, then offer two options in a professional tone: 1) increase the budget to the realistic floor for that stack, or 2) move to a clearly named lighter stack/phased MVP within their budget (e.g., "WordPress + custom theme (INR 45,000)" or "Bubble MVP (INR 50,000)"). Ask it like: "Given your budget of INR X, the typical floor for [stack] is INR Y. Would you prefer to align the budget to INR Y or switch to [suggested option] that fits INR X?" Keep it concise and respectful, and always include the proposed alternative tech stack name with an estimated cost.

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
- Gather: 1) what they need, 2) timeline, 3) budget amount.
- Do NOT stop mid-flow; always ask the next required question.
- If a website budget is under ${MIN_WEBSITE_PRICE_DISPLAY}, restate the minimum and suggest a smaller scope or phased plan.

After 3-4 exchanges, or when you have enough info, generate the FULL PROPOSAL using the [PROPOSAL_DATA] template.
Ensure the "Scope of Work" and "Features & Services" sections are detailed and specific to the user's requests.
Do NOT generate a partial "Quick Proposal".
Keep it short and structured.`;
};

export const generateChatReply = async ({
  message,
  service,
  history,
  contextHint = "",
}) => {
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
      "X-Title": "Freelancer Platform",
    },
  });

  const systemContent = buildSystemPrompt(service || "");
  const safeHistory = Array.isArray(history) ? history.slice(-50) : [];

  const messages = [
    { role: "system", content: systemContent },
    ...(contextHint ? [{ role: "system", content: contextHint }] : []),
    ...safeHistory.map((msg) => ({
      role: msg.role === "assistant" ? "assistant" : "user",
      content: msg.content,
    })),
    { role: "user", content: message },
  ];

  let completion;
  try {
    completion = await openai.chat.completions.create({
      model: env.OPENROUTER_MODEL,
      messages,
      max_tokens: MAX_COMPLETION_TOKENS,
      temperature: 0.2,
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
        temperature: 0.2,
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
    const safeHistory = Array.isArray(history) ? history : [];
    const botResponse = await generateChatReply({
      message,
      service,
      history: safeHistory,
      contextHint: summarizeContext(safeHistory),
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
      error: "Unable to generate a response right now. Please try again.",
    });
  }
};

// List conversations for the authenticated user (from DB) with latest message.
export const listUserConversations = asyncHandler(async (req, res) => {
  const userId = req.user?.sub;
  if (!userId) {
    throw new AppError("Unauthorized", 401);
  }

  // Gather proposals for projects owned by this user (accepted) to derive project-specific chat threads.
  const proposals = await prisma.proposal.findMany({
    where: {
      project: { ownerId: userId },
      freelancerId: { not: userId },
      status: { in: ["ACCEPTED"] }, // ProposalStatus enum values
    },
    include: { freelancer: true, project: true },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  // Build a lookup of serviceKey -> meta from proposals
  const serviceMeta = new Map();
  const serviceKeys = [];
  for (const proposal of proposals) {
    const projectId = proposal.project?.id;
    if (!projectId) continue;
    
    const ownerId = proposal.project?.ownerId;
    const freelancerId = proposal.freelancerId;
    
    // Use consistent key format: CHAT:CLIENT_ID:FREELANCER_ID
    const serviceKey = `CHAT:${ownerId}:${freelancerId}`;
    
    serviceKeys.push(serviceKey);
    serviceMeta.set(serviceKey, {
      freelancerName:
        proposal.freelancer?.fullName ||
        proposal.freelancer?.name ||
        proposal.freelancer?.email ||
        "Freelancer",
      projectTitle: proposal.project?.title || "Project Chat",
    });
  }

  // Pull conversations that match the project+freelancer service keys.
  const conversations = serviceKeys.length
    ? await prisma.chatConversation.findMany({
        where: { service: { in: serviceKeys } },
        orderBy: { updatedAt: "desc" },
        include: {
          messages: {
            orderBy: { createdAt: "desc" },
            take: 1,
          },
          _count: {
            select: { messages: true },
          },
        },
      })
    : [];

  // Ensure a conversation exists for each service key.
  const byService = new Map();

  // Helper to determine which conversation is "better"
  const isBetterConversation = (current, candidate) => {
    const currentHasMessages =
      current.messages.length > 0 || (current._count?.messages || 0) > 0;
    const candidateHasMessages =
      candidate.messages.length > 0 || (candidate._count?.messages || 0) > 0;

    if (candidateHasMessages && !currentHasMessages) return true;
    if (!candidateHasMessages && currentHasMessages) return false;

    // If both have messages or both don't, prefer the newer one (updatedAt)
    return new Date(candidate.updatedAt) > new Date(current.updatedAt);
  };

  for (const convo of conversations) {
    if (convo.service) {
      if (!byService.has(convo.service)) {
        byService.set(convo.service, convo);
      } else {
        const current = byService.get(convo.service);
        if (isBetterConversation(current, convo)) {
          byService.set(convo.service, convo);
        }
      }
    }
  }

  for (const key of serviceKeys) {
    if (!byService.has(key)) {
      // Create if missing. Note: createdById is just for record keeping,
      // it doesn't restrict who can see it (that's done by service key logic).
      const convo = await prisma.chatConversation.create({
        data: { service: key, createdById: userId },
      });
      byService.set(key, { ...convo, messages: [] });
    }
  }

  // Build response sorted by updatedAt desc.
  const data = Array.from(byService.values())
    .sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0))
    .map((conversation) => {
      const meta = serviceMeta.get(conversation.service) || {};
      return {
        id: conversation.id,
        service: conversation.service,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
        createdById: conversation.createdById,
        freelancerName: meta.freelancerName || "Freelancer",
        projectTitle:
          meta.projectTitle || conversation.service || "Conversation",
        lastMessage: conversation.messages?.[0]
          ? serializeMessage(conversation.messages[0])
          : null,
      };
    });

  res.json({ data });
});

export const createConversation = asyncHandler(async (req, res) => {
  const createdById = req.user?.sub || null;
  const serviceKey = normalizeService(req.body?.service);
  const ephemeral =
    req.body?.mode === "assistant" || req.body?.ephemeral === true;

  if (!ephemeral && !createdById) {
    throw new AppError("Authentication required", 401);
  }

  if (ephemeral) {
    const conversation = createInMemoryConversation({
      service: serviceKey,
      createdById,
    });
    res.status(201).json({ data: conversation });
    return;
  }

  // Always start a fresh persisted conversation to avoid reusing old threads on refresh.
  // For client/freelancer chat we should keep one thread per service + creator
  // so history stays intact across refreshes.
  let conversation = null;

  if (serviceKey) {
    const candidates = await prisma.chatConversation.findMany({
      where: { service: serviceKey },
      include: {
        _count: { select: { messages: true } },
      },
      orderBy: { updatedAt: "desc" },
    });

    // Pick the one with messages, or the newest one
    conversation = candidates.find((c) => c._count.messages > 0) || candidates[0];
  }

  if (!conversation) {
    conversation = await prisma.chatConversation.create({
      data: {
        service: serviceKey,
        createdById,
      },
    });
  }

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
        messages,
      },
    });
    return;
  }

  if (!req.user?.sub) {
    throw new AppError("Authentication required", 401);
  }

  const conversation = await prisma.chatConversation.findUnique({
    where: { id: conversationId },
  });

  if (!conversation) {
    throw new AppError("Conversation not found", 404);
  }

  const messages = await prisma.chatMessage.findMany({
    where: { conversationId },
    orderBy: { createdAt: "asc" },
    take: 100,
  });

  res.json({
    data: {
      conversation,
      messages,
    },
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
    history: clientHistory,
  } = req.body || {};

  if (!content) {
    throw new AppError("Message content is required", 400);
  }

  const serviceKey = normalizeService(service);
  const useEphemeral =
    !skipAssistant ||
    req.body?.mode === "assistant" ||
    req.body?.ephemeral === true;

  if (!useEphemeral && !req.user?.sub) {
    throw new AppError("Authentication required", 401);
  }

  // Assistant chat path: keep everything in memory/local only.
  if (useEphemeral) {
    const conversation = ensureConversation({
      id: conversationId,
      service: serviceKey,
      createdById: senderId || null,
    });

    const userMessage = addMessage({
      conversationId: conversation.id,
      senderId: senderId || null,
      senderName: senderName || null,
      senderRole: senderRole || null,
      role: "user",
      content,
    });

    let assistantMessage = null;

    if (!skipAssistant) {
      const dbHistory = Array.isArray(clientHistory)
        ? clientHistory.map(toHistoryMessage)
        : listMessages(conversation.id, 40).map(toHistoryMessage);
      const contextHint = summarizeContext(dbHistory);

      try {
        const assistantReply = await generateChatReply({
          message: content,
          service: service || conversation.service || "",
          history: dbHistory,
          contextHint,
        });

        assistantMessage = addMessage({
          conversationId: conversation.id,
          senderName: "Assistant",
          senderRole: "assistant",
          role: "assistant",
          content: assistantReply,
        });
      } catch (error) {
        console.error("Assistant generation failed (HTTP):", error);
      }
    }

    res.status(201).json({
      data: {
        message: serializeMessage(userMessage),
        assistant: assistantMessage ? serializeMessage(assistantMessage) : null,
      },
    });
    return;
  }

  // Persisted chat path (client & freelancer conversations)
  let conversation = null;

  if (conversationId) {
    conversation = await prisma.chatConversation.findUnique({
      where: { id: conversationId },
    });
  }

  if (!conversation) {
    if (serviceKey) {
      const candidates = await prisma.chatConversation.findMany({
        where: { service: serviceKey },
        include: {
          _count: { select: { messages: true } }
        },
        orderBy: { updatedAt: "desc" }
      });
      // Pick the one with messages, or the newest one
      conversation = candidates.find(c => c._count.messages > 0) || candidates[0];
    }
  }

  // If still no conversation was found, create a new one.
  if (!conversation) {
    conversation = await prisma.chatConversation.create({
      data: {
        service: serviceKey,
        createdById: senderId || null,
      },
    });
  }

  const userMessage = await prisma.chatMessage.create({
    data: {
      conversationId: conversation.id,
      senderId: senderId || null,
      senderName: senderName || null,
      senderRole: senderRole || null,
      role: "user",
      content,
    },
  });

  let assistantMessage = null;

  if (!skipAssistant) {
    const recentMessages = await prisma.chatMessage.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: "asc" },
      take: 50,
    });

    const dbHistory = recentMessages.map(toHistoryMessage);
    const contextHint = summarizeContext(dbHistory);

    try {
      const assistantReply = await generateChatReply({
        message: content,
        service: serviceKey || conversation.service || "",
        history: dbHistory,
        contextHint,
      });

      assistantMessage = await prisma.chatMessage.create({
        data: {
          conversationId: conversation.id,
          senderName: "Assistant",
          senderRole: "assistant",
          role: "assistant",
          content: assistantReply,
        },
      });
    } catch (error) {
      console.error("Assistant generation failed (persistent):", error);
    }
  }

  res.status(201).json({
    data: {
      message: serializeMessage(userMessage),
      assistant: assistantMessage ? serializeMessage(assistantMessage) : null,
    },
  });
});
