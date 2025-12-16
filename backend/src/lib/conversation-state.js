/**
 * Conversation State Machine for Chatbot
 * 
 * Deterministic state tracking to prevent:
 * - Context loss
 * - Question repetition
 * - Robotic tone
 */

import { CHATBOTS_BY_SERVICE, getChatbot } from "./chatbots/index.js";

export const SERVICE_QUESTIONS_MAP = Object.freeze(
    Object.fromEntries(
        Object.entries(CHATBOTS_BY_SERVICE).map(([service, chatbot]) => [
            service,
            chatbot.questions,
        ])
    )
);

const QUESTION_KEY_TAG_REGEX = /\[QUESTION_KEY:\s*([^\]]+)\]/i;

const normalizeText = (value = "") => (value || "").toString().trim();

const escapeRegExp = (value = "") =>
    value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const canonicalize = (value = "") =>
    normalizeText(value)
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");

const getSuggestionAliases = (value = "") => {
    const text = normalizeText(value);
    if (!text) return [];

    const aliases = new Set([text]);

    const withoutParens = text
        .replace(/\s*\([^)]*\)\s*/g, " ")
        .replace(/\s+/g, " ")
        .trim();
    if (withoutParens) aliases.add(withoutParens);

    const parenMatches = Array.from(text.matchAll(/\(([^)]+)\)/g));
    for (const match of parenMatches) {
        const inside = normalizeText(match[1]);
        if (!inside) continue;

        // Only treat parenthetical content as aliases when it contains explicit alternatives.
        // Example: "Payment Gateway (Razorpay/Stripe)" -> ["Razorpay", "Stripe"]
        // Avoid broad aliases like "(React)" which would match many unrelated options.
        if (/[\\/|,]/.test(inside)) {
            for (const part of inside.split(/[\\/|,]/)) {
                const cleaned = normalizeText(part);
                if (cleaned) aliases.add(cleaned);
            }
        }
    }

    for (const part of text.split(/[\\/|]/)) {
        const cleaned = normalizeText(part);
        if (cleaned) aliases.add(cleaned);
    }

    if (text.toLowerCase().endsWith(" yet")) {
        const noYet = text.slice(0, -4).trim();
        if (noYet) aliases.add(noYet);
    }

    for (const alias of Array.from(aliases)) {
        const withoutJs = alias
            .replace(/\.?\bjs\b/gi, "")
            .replace(/\s+/g, " ")
            .trim();
        // Avoid creating overly-generic aliases like "Next" from "Next.js".
        if (withoutJs && withoutJs !== alias && withoutJs.length >= 5) {
            aliases.add(withoutJs);
        }
    }

    return Array.from(aliases);
};

const matchSuggestionsInMessage = (question, rawMessage) => {
    const message = normalizeText(rawMessage);
    if (!message) return [];
    if (!Array.isArray(question?.suggestions) || question.suggestions.length === 0) {
        return [];
    }

    const messageLower = message.toLowerCase();
    const messageCanonical = canonicalize(messageLower);
    const tokens = (messageLower.match(/[a-z0-9]+/gi) || []).map((t) =>
        canonicalize(t.toLowerCase())
    );
    const tokenSet = new Set(tokens.filter(Boolean));
    // Add common bigrams to support inputs like "next js" -> "nextjs".
    for (let i = 0; i < tokens.length - 1; i++) {
        const bigram = `${tokens[i]}${tokens[i + 1]}`;
        if (bigram) tokenSet.add(bigram);
    }
    const matches = [];

    for (const option of question.suggestions) {
        const optionText = normalizeText(option);
        if (!optionText) continue;

        let isMatch = false;
        const aliases = getSuggestionAliases(optionText);
        for (const alias of aliases) {
            const aliasLower = normalizeText(alias).toLowerCase();
            const aliasCanonical = canonicalize(aliasLower);
            if (!aliasCanonical) continue;

            if (!aliasLower.includes(" ")) {
                // For single tokens, require whole-token matching to avoid false positives
                // like "help" matching "helps" or "search" matching "research".
                isMatch = tokenSet.has(aliasCanonical);
            } else {
                // For multi-word phrases, allow canonical containment.
                isMatch = messageCanonical.includes(aliasCanonical) || messageLower.includes(aliasLower);
            }

            if (isMatch) break;
        }

        if (isMatch) matches.push(optionText);
    }

    const unique = Array.from(new Set(matches));
    if (unique.length <= 1) return unique;

    // Prefer the most specific options when one match is a strict substring of another.
    const ranked = unique
        .map((optionText) => {
            const canon = canonicalize(optionText.toLowerCase());
            return { optionText, canon, len: canon.length };
        })
        .sort((a, b) => b.len - a.len);

    const kept = [];
    for (const item of ranked) {
        if (!item.canon || item.len <= 3) {
            kept.push(item);
            continue;
        }

        const isSub = kept.some(
            (keptItem) =>
                keptItem.canon &&
                keptItem.len > item.len &&
                keptItem.canon.includes(item.canon)
        );
        if (!isSub) kept.push(item);
    }

    return kept.map((item) => item.optionText);
};

const trimEntity = (value = "") => {
    let text = normalizeText(value);
    if (!text) return "";

    // Prefer the part before common separators.
    text = text.split(/\s+and\s+/i)[0];
    text = text.split(/\s+but\s+/i)[0];
    text = text.split(/\s+so\s+/i)[0];
    text = text.split(/\s+because\s+/i)[0];
    text = text.split(/[,.!\n]/)[0];

    return normalizeText(text).replace(/\s+/g, " ");
};

const extractOrganizationName = (value = "") => {
    const text = normalizeText(value);
    if (!text) return null;

    const patterns = [
        /\bfor\s+(?:my\s+)?(?:company|business|brand|project)\s+([a-z0-9][a-z0-9&._' -]{1,80})/i,
        /\bmy\s+(?:company|business|brand|project)\s*(?:name\s*)?(?:is|:|called|named)\s*([a-z0-9][a-z0-9&._' -]{1,80})/i,
        /\b(?:company|business|brand|project)\s*(?:name\s*)?(?:is|:|called|named)\s*([a-z0-9][a-z0-9&._' -]{1,80})/i,
    ];

    for (const pattern of patterns) {
        const match = text.match(pattern);
        if (!match) continue;
        const candidate = trimEntity(match[1]);
        if (candidate && candidate.length <= 60) return candidate;
    }

    // Common phrasing: "my project called Markify", "it's called Markify"
    if (
        /\b(?:called|named)\b/i.test(text) &&
        /\b(company|business|brand|project|app|website|platform|product|tool|manager|system|dashboard|store|marketplace|saas)\b/i.test(
            text
        )
    ) {
        const match = text.match(/\b(?:called|named)\s+([a-z0-9][a-z0-9&._' -]{1,80})/i);
        if (match) {
            const candidate = trimEntity(match[1]);
            if (candidate && candidate.length <= 60) return candidate;
        }
    }

    return null;
};

const getQuestionKeyFromAssistant = (value = "") => {
    const match = normalizeText(value).match(QUESTION_KEY_TAG_REGEX);
    return match ? match[1].trim() : null;
};

const withQuestionKeyTag = (text = "", key = "") => {
    if (!key) return text;
    if (QUESTION_KEY_TAG_REGEX.test(text)) return text;
    return `${text}\n[QUESTION_KEY: ${key}]`;
};

const isGreetingMessage = (value = "") => {
    const raw = normalizeText(value);
    if (!raw) return false;

    const text = raw
        .toLowerCase()
        .replace(/[!.,]+$/g, "")
        .trim();

    // Treat as a greeting only when the message is basically *just* a greeting.
    // Examples that should count: "hi", "hello!", "hey there"
    // Examples that should NOT count: "hi i need a website", "hello can you help with SEO?"
    if (text.length > 20) return false;

    return /^(hi|hello|hey|hii+|yo|sup|what'?s up|whats up)(\s+there)?$/.test(text);
};

const isSkipMessage = (value = "") => {
    const text = normalizeText(value).toLowerCase();
    return text === "skip" || text === "done" || text === "na" || text === "n/a" || text.includes("skip");
};

const extractBudget = (value = "") => {
    const text = normalizeText(value).replace(/\?/g, "");
    if (!text) return null;
    if (/^flexible$/i.test(text)) return "Flexible";

    let match = text.match(/(?:\u20B9|inr|rs\.?|rupees?)\s*([\d,]+(?:\.\d+)?)\b/i);
    if (match) return match[1].replace(/,/g, "");

    match = text.match(/\b(\d+(?:\.\d+)?)\s*(k)\b/i);
    if (match) return `${match[1]}k`;

    match = text.match(/\b(\d+(?:\.\d+)?)\s*(l)\b/i);
    if (match) return `${match[1]}L`;

    match = text.match(/\b(\d+(?:\.\d+)?)\s*lakh(s)?\b/i);
    if (match) return `${match[1]} lakh`;

    match = text.match(/\b(\d{4,})\b/);
    if (match && /(budget|cost|price|inr|\u20B9|rs|rupees?)/i.test(text)) return match[1];

    return null;
};

const extractTimeline = (value = "") => {
    const text = normalizeText(value).replace(/\?/g, "");
    if (!text) return null;
    if (/^flexible$/i.test(text)) return "Flexible";

    let match = text.match(/\b(\d+\s*-\s*\d+)\s*(day|week|month|year)s?\b/i);
    if (match) {
        const range = match[1].replace(/\s*/g, "");
        const unit = match[2].toLowerCase();
        return `${range} ${unit}s`;
    }

    match = text.match(/\b(\d+)\s*(day|week|month|year)s?\b/i);
    if (match) {
        const count = parseInt(match[1], 10);
        const unit = match[2].toLowerCase();
        return `${count} ${unit}${count === 1 ? "" : "s"}`;
    }

    if (/\b(asap|urgent|immediately)\b/i.test(text)) return text;
    if (/\bby\b/i.test(text)) return text;
    if (/\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)\b/i.test(text)) return text;

    return null;
};

const isBareBudgetAnswer = (value = "") => {
    const text = normalizeText(value)
        .replace(/\?/g, "")
        .toLowerCase();
    if (!text) return false;
    if (text === "flexible") return true;

    // Examples: "60000", "₹60,000", "INR 60000", "60k", "1 lakh", "Under ₹120,000"
    if (/^under\s+(?:\u20B9|inr|rs\.?|rupees?)?\s*\d[\d,]*(?:\.\d+)?\s*(?:k|l|lakh)?\s*$/i.test(text)) {
        return true;
    }

    return /^(?:(?:\u20B9|inr|rs\.?|rupees?)\s*)?\d[\d,]*(?:\.\d+)?\s*(?:k|l|lakh)?\s*$/.test(text);
};

const isBareTimelineAnswer = (value = "") => {
    const text = normalizeText(value)
        .replace(/\?/g, "")
        .toLowerCase();
    if (!text) return false;
    if (text === "flexible") return true;
    if (/^(asap|urgent|immediately|this week|next week|next month)$/i.test(text)) return true;
    if (/^\d+\s*-\s*\d+\s*(day|week|month|year)s?$/.test(text)) return true;
    return /^\d+\s*(day|week|month|year)s?$/.test(text);
};

const isUserQuestion = (value = "") => {
    const text = normalizeText(value);
    if (!text) return false;
    if (text.includes("?")) {
        const withoutMarks = text.replace(/\?/g, "");
        // Treat pure budget/timeline inputs as answers even if a user typed '?'. Otherwise it's a question.
        if (isBareBudgetAnswer(withoutMarks) || isBareTimelineAnswer(withoutMarks)) return false;
        return true;
    }
    return /^(can|could|would|should|do|does|is|are|will|may|what|why|how|when|where|which)\b/i.test(text);
};

const isLikelyName = (value = "") => {
    const text = normalizeText(value).replace(/\?/g, "");
    if (!text) return false;
    if (text.length > 40) return false;
    if (/\bhttps?:\/\//i.test(text) || /\bwww\./i.test(text)) return false;
    if (text.includes("@")) return false;
    if (/\d{2,}/.test(text)) return false;
    if (
        /(budget|timeline|website|web\s*app|app|project|need|want|build|looking|landing|page|portfolio|e-?commerce|ecommerce|shopify|wordpress|react|next|mern|pern|saas|dashboard)\b/i.test(
            text
        )
    ) {
        return false;
    }
    return /[a-zA-Z]/.test(text);
};

const extractName = (value = "") => {
    const text = normalizeText(value).replace(/\?/g, "");
    if (!text) return null;

    const explicitMatch = text.match(/\b(?:my\s+name\s+is|name\s+is)\s+(.+)$/i);
    if (explicitMatch) {
        const candidate = trimEntity(explicitMatch[1]);
        const limited = candidate.split(/\s+/).slice(0, 3).join(" ");
        return isLikelyName(limited) ? limited : null;
    }

    return isLikelyName(text) ? trimEntity(text) : null;
};

const extractExplicitName = (value = "") => {
    const text = normalizeText(value).replace(/\?/g, "");
    if (!text) return null;

    const explicitMatch = text.match(
        /\b(?:my\s+name\s+is|name\s+is|i\s+am|i'm|im|this\s+is)\s+(.+)$/i
    );
    if (!explicitMatch) return null;

    const candidate = trimEntity(explicitMatch[1]);
    const limited = candidate.split(/\s+/).slice(0, 3).join(" ");
    return isLikelyName(limited) ? limited : null;
};

const getCurrentStepFromCollected = (questions = [], collectedData = {}) => {
    for (let i = 0; i < questions.length; i++) {
        const key = questions[i]?.key;
        if (!key) continue;
        const value = collectedData[key];
        if (value === undefined || value === null || normalizeText(value) === "") {
            return i;
        }
    }
    return questions.length;
};

const extractKnownFieldsFromMessage = (questions = [], message = "", collectedData = {}) => {
    const text = normalizeText(message);
    if (!text || isGreetingMessage(text)) return {};

    const keys = new Set(questions.map((q) => q.key));
    const updates = {};

    if (keys.has("budget")) {
        const budget = extractBudget(text);
        if (budget) updates.budget = budget;
    }

    if (keys.has("timeline")) {
        const timeline = extractTimeline(text);
        if (timeline) updates.timeline = timeline;
    }

    if (keys.has("name") && !collectedData.name) {
        // Only extract a name out-of-sequence when it's explicitly stated, to avoid
        // misclassifying values like "portfolio" or "landing page" as a person's name.
        const name = extractExplicitName(text);
        if (name) updates.name = name;
    }

    const orgKey = keys.has("company")
        ? "company"
        : keys.has("business_name")
            ? "business_name"
            : keys.has("business")
                ? "business"
                : keys.has("brand")
                    ? "brand"
                    : keys.has("project")
                        ? "project"
                        : null;

    if (orgKey && !collectedData[orgKey]) {
        const org = extractOrganizationName(text);
        if (org) updates[orgKey] = org;
    }

    const descriptionKey =
        keys.has("description")
            ? "description"
            : keys.has("summary")
                ? "summary"
                : keys.has("vision")
                    ? "vision"
                    : null;

    if (descriptionKey && !collectedData[descriptionKey] && !isUserQuestion(text)) {
        const hasIntentVerb = /(need|looking|build|create|develop|want|require|make)\b/i.test(text);
        const hasIsA = /\b(?:it\s+is|it's|it’s|this\s+is)\b/i.test(text);
        const hasProjectNoun =
            /(website|web\s*app|app|platform|tool|manager|system|dashboard|store|marketplace|landing\s*page|e-?commerce|portfolio|saas|product)\b/i.test(
                text
            );

        const looksDescriptive =
            text.length >= 25 && (hasIntentVerb || (hasIsA && hasProjectNoun));
        if (looksDescriptive) {
            updates[descriptionKey] = text;
        }
    }

    return updates;
};

const extractAnswerForQuestion = (question, rawMessage) => {
    const message = normalizeText(rawMessage);
    if (!question || !message) return null;
    if (isGreetingMessage(message)) return null;
    if (isSkipMessage(message)) return "[skipped]";

    switch (question.key) {
        case "company":
        case "business":
        case "business_name":
        case "brand":
        case "project": {
            if (isUserQuestion(message)) return null;
            if (isBareBudgetAnswer(message) || isBareTimelineAnswer(message)) return null;
            const budget = extractBudget(message);
            if (budget && message.length <= 30) return null;
            const timeline = extractTimeline(message);
            if (timeline && message.length <= 30) return null;

            const org = extractOrganizationName(message);
            if (org) return org;
            return message.length <= 60 ? trimEntity(message) : null;
        }
        case "budget": {
            return extractBudget(message);
        }
        case "timeline": {
            return extractTimeline(message);
        }
        case "name": {
            return extractName(message);
        }
        default: {
            const suggestionMatches = matchSuggestionsInMessage(question, message);
            if (suggestionMatches.length) {
                return question.multiSelect
                    ? suggestionMatches.join(", ")
                    : suggestionMatches[0];
            }

            if (Array.isArray(question.suggestions) && question.suggestions.length) {
                // If this is a closed-set question and nothing matched, avoid incorrectly
                // capturing a long multi-field message as the answer.
                if (message.length > 80) return null;
            }

            if (isUserQuestion(message)) {
                const qIndex = message.indexOf("?");
                const beforeQuestion = qIndex >= 0 ? message.slice(0, qIndex).trim() : "";
                const cutAt = Math.max(
                    beforeQuestion.lastIndexOf("."),
                    beforeQuestion.lastIndexOf("!"),
                    beforeQuestion.lastIndexOf("\n")
                );
                const candidate = (cutAt > -1
                    ? beforeQuestion.slice(0, cutAt)
                    : beforeQuestion
                ).trim();

                if (!candidate) return null;
                if (isUserQuestion(candidate)) return null;
                if (isBareBudgetAnswer(candidate) || isBareTimelineAnswer(candidate)) return null;
                if (extractBudget(candidate) && candidate.length <= 30) return null;
                if (extractTimeline(candidate) && candidate.length <= 30) return null;

                return candidate;
            }

            // Avoid capturing pure budget/timeline answers for unrelated questions.
            if (isBareBudgetAnswer(message) || isBareTimelineAnswer(message)) return null;
            const budget = extractBudget(message);
            if (budget && message.length <= 30) return null;
            const timeline = extractTimeline(message);
            if (timeline && message.length <= 30) return null;

            return message;
        }
    }
};


/**
 * Build conversation state from message history
 * @param {Array} history - Array of {role, content} messages
 * @param {string} service - Service name
 * @returns {Object} State with collectedData and currentStep
 */
export function buildConversationState(history, service) {
    const { questions } = getChatbot(service);
    const safeHistory = Array.isArray(history) ? history : [];
    const collectedData = {};

    // Extract structured fields even if the user answered out-of-sequence.
    for (const msg of safeHistory) {
        if (msg?.role === "user") {
            Object.assign(
                collectedData,
                extractKnownFieldsFromMessage(questions, msg.content, collectedData)
            );
        }
    }

    // Map user replies to the exact question asked (tagged in assistant messages).
    for (let i = 0; i < safeHistory.length - 1; i++) {
        const botMsg = safeHistory[i];
        const userMsg = safeHistory[i + 1];
        if (botMsg?.role !== "assistant" || userMsg?.role !== "user") continue;

        const askedKey = getQuestionKeyFromAssistant(botMsg.content);
        if (!askedKey) continue;

        const question = questions.find((q) => q.key === askedKey);
        if (!question) continue;

        const answer = extractAnswerForQuestion(question, userMsg.content);
        if (answer !== null && answer !== undefined) {
            collectedData[question.key] = answer;
        }
    }

    const currentStep = getCurrentStepFromCollected(questions, collectedData);

    return {
        collectedData,
        currentStep,
        questions,
        service,
        isComplete: currentStep >= questions.length,
    };
}

/**
 * Process the user's current message and update state
 * @param {Object} state - Current conversation state
 * @param {string} message - User's message
 * @returns {Object} Updated state
 */
export function processUserAnswer(state, message) {
    const questions = Array.isArray(state?.questions) ? state.questions : [];
    const collectedData = { ...(state?.collectedData || {}) };
    const normalized = normalizeText(message);

    const activeStep = Number.isInteger(state?.currentStep)
        ? state.currentStep
        : getCurrentStepFromCollected(questions, collectedData);
    const activeQuestion = questions[activeStep];
    const activeKey = activeQuestion?.key || null;
    const beforeActiveValue = activeKey ? collectedData[activeKey] : undefined;

    const extracted = extractKnownFieldsFromMessage(questions, normalized, collectedData);
    Object.assign(collectedData, extracted);

    let answeredKey = null;

    if (activeQuestion?.key) {
        const afterActiveValue = collectedData[activeQuestion.key];
        const hadValueBefore =
            beforeActiveValue !== undefined &&
            beforeActiveValue !== null &&
            normalizeText(beforeActiveValue) !== "";
        const hasValueAfter =
            afterActiveValue !== undefined &&
            afterActiveValue !== null &&
            normalizeText(afterActiveValue) !== "";

        if (!hadValueBefore && hasValueAfter) {
            answeredKey = activeQuestion.key;
        } else if (!hasValueAfter) {
            const answer = extractAnswerForQuestion(activeQuestion, normalized);
            if (answer !== null && answer !== undefined) {
                collectedData[activeQuestion.key] = answer;
                answeredKey = activeQuestion.key;
            }
        }
    }

    const currentStep = getCurrentStepFromCollected(questions, collectedData);

    return {
        ...state,
        collectedData,
        currentStep,
        questions,
        isComplete: currentStep >= questions.length,
        meta: {
            answeredKey,
            wasQuestion: isUserQuestion(normalized),
        },
    };
}

/**
 * Get the next humanized question
 * @param {Object} state - Current conversation state
 * @returns {string} Next question with suggestions formatted
 */
export function getNextHumanizedQuestion(state) {
    const { collectedData, currentStep, questions } = state;

    if (currentStep >= questions.length) {
        return null; // Ready for proposal
    }

    const question = questions[currentStep];
    const templates = question.templates || [];

    // Pick random template for variety
    let text = templates.length
        ? templates[Math.floor(Math.random() * templates.length)]
        : "";

    // Replace placeholders like {name} with actual values
    for (const [key, value] of Object.entries(collectedData || {})) {
        text = text.replace(new RegExp(`\\{${key}\\}`, "gi"), value);
    }

    // Add suggestions if available
    if (question.suggestions) {
        const tag = question.multiSelect ? "MULTI_SELECT" : "SUGGESTIONS";
        text += `\n[${tag}: ${question.suggestions.join(" | ")}]`;
    }

    return withQuestionKeyTag(text, question.key);
}

/**
 * Check if we have enough info to generate proposal
 * @param {Object} state - Current conversation state
 * @returns {boolean}
 */
export function shouldGenerateProposal(state) {
    const questions = Array.isArray(state?.questions) ? state.questions : [];
    const collectedData = state?.collectedData || {};

    // Ready when every question has *some* value (including explicit skips).
    for (const q of questions) {
        if (!q?.key) continue;
        const val = collectedData[q.key];
        if (val === undefined || val === null || normalizeText(val) === "") {
            return false;
        }
    }
    return true;
}

/**
 * Generate proposal from collected state
 * @param {Object} state - Completed conversation state
 * @returns {string} Proposal in [PROPOSAL_DATA] format
 */
export function generateProposalFromState(state) {
    const { collectedData, service } = state;

    // Helper: detect if value looks like a budget (must have ₹ or currency indicators)
    const isBudget = (val) => /₹[\d,]+|₹\s*[\d,]+|under\s*₹|[\d,]+\s*(?:lakh|k\b)|inr\s*[\d,]+/i.test(val);

    // Helper: detect if value looks like a timeline
    const isTimeline = (val) => /^\s*(?:\d+[-\s]?\d*\s*)?(?:week|month|day)s?\s*$/i.test(val) || /^flexible$/i.test(val);

    // Helper: detect if value looks like tech stack
    const isTechStack = (val) => /\b(?:react(?:\.?js)?|next(?:\.?js)?|node(?:\.?js)?|wordpress|shopify|laravel|django|mern|pern|vue|frontend\s+only|backend\s+only)\b/i.test(val);

    // Helper: detect if value looks like deployment platform
    const isDeployment = (val) => /vercel|netlify|aws|digitalocean|railway|render|vps|server|heroku/i.test(val);

    // Helper: detect if value looks like domain answer
    const isDomain = (val) => /(?:have|need|don't).*domain|already have domain|i don't have/i.test(val);

    // Helper: detect if value looks like design answer
    const isDesign = (val) => /have design|need design|wireframe|figma|reference|not sure yet/i.test(val);

    // Helper: detect if value looks like website type
    const isWebsiteType = (val) => /landing\s*page|business\s*website|informational|e-commerce|portfolio|web\s*app|saas/i.test(val);

    // Helper: detect if value looks like pages
    const isPages = (val) => /services|products|gallery|testimonials|blog|faq|pricing|shop|store|cart|checkout|wishlist|order|reviews|ratings|search|book\s*now|account|login|dashboard|analytics|support|resources|events|notifications|chat|widget/i.test(val);

    // Helper: detect if value looks like integrations
    const isIntegration = (val) => /payment|razorpay|stripe|paypal|email|sendgrid|mailchimp|delivery|shipping|sms|analytics|social login|google|facebook|crm|marketing|cloud storage|video|chatbot|ai assistant/i.test(val);

    // Smart extraction - analyze ALL collected values and categorize them properly
    let clientName = "";
    let projectName = "";
    let projectDescription = "";
    let websiteType = "";
    let pages = "";
    let designStatus = "";
    let techStack = "";
    let deploymentPlatform = "";
    let domainStatus = "";
    let integrations = "";
    let budget = "";
    let timeline = "";

    // First pass: Get the obvious ones by key
    clientName = collectedData.name || "";
    budget =
        collectedData.budget && collectedData.budget !== "[skipped]"
            ? collectedData.budget
            : "";
    timeline =
        collectedData.timeline && collectedData.timeline !== "[skipped]"
            ? collectedData.timeline
            : "";

    // Second pass: Analyze each value by content
    for (const [key, value] of Object.entries(collectedData)) {
        if (!value || value === "[skipped]") continue;
        const val = value.toString().trim();

        // Skip if already assigned as name
        if (key === "name") continue;

        // Check patterns in order of specificity
        if (isBudget(val) && !budget) {
            budget = val;
        }
        else if (isTimeline(val) && !timeline) {
            timeline = val;
        }
        else if (isTechStack(val) && !techStack) {
            techStack = val;
        }
        else if (isDeployment(val) && !deploymentPlatform) {
            deploymentPlatform = val;
        }
        else if (isDomain(val) && !domainStatus) {
            domainStatus = val;
        }
        else if (isDesign(val) && !designStatus) {
            designStatus = val;
        }
        else if (isWebsiteType(val) && !websiteType) {
            websiteType = val;
        }
        else if (isPages(val) && !pages) {
            pages = val;
        }
        else if (isIntegration(val) && !integrations) {
            integrations = val;
        }
        // Long descriptive text - likely project description
        else if (val.length > 20 && !projectDescription && !isBudget(val) && !isTimeline(val)) {
            projectDescription = val;
        }
        // Short company/project name
        else if (key === "company" && val.length <= 20 && !projectName) {
            projectName = val;
        }
    }

    // Extract project name from description if it contains "called X" or "named X"
    if (projectDescription && !projectName) {
        const nameMatch = projectDescription.match(/(?:called|named|is)\s+([a-zA-Z0-9]+)/i);
        if (nameMatch) {
            projectName = nameMatch[1].trim();
            // Capitalize first letter
            projectName = projectName.charAt(0).toUpperCase() + projectName.slice(1);
        }
    }

    // Rewrite project description to be more professional
    let formattedDescription = projectDescription;
    if (projectDescription) {
        // Capitalize first letter and ensure proper ending
        formattedDescription = projectDescription.charAt(0).toUpperCase() + projectDescription.slice(1);
        if (!formattedDescription.endsWith('.')) {
            formattedDescription += '.';
        }
    }

    // Apply defaults for missing values
    clientName = clientName || "Client";
    projectName = projectName || "Custom Project";
    formattedDescription = formattedDescription || "Custom web development project as per client requirements.";
    websiteType = websiteType || "Custom Website";
    designStatus = designStatus || "Design assistance required";
    techStack = techStack || "To be recommended based on requirements";
    deploymentPlatform = deploymentPlatform || "To be discussed";
    budget = budget || "To be discussed";
    timeline = timeline || "Flexible";

    // Format domain status professionally
    let formattedDomain = "To be discussed";
    if (domainStatus) {
        const domainLower = domainStatus.toLowerCase();
        if (domainLower.includes("already have") || (domainLower.includes("have") && !domainLower.includes("don't"))) {
            formattedDomain = "✓ Client owns domain";
        } else if (domainLower.includes("don't") || domainLower.includes("need")) {
            formattedDomain = "Domain purchase required";
        }
    }

    // Format design status professionally
    let formattedDesign = "Design assistance required";
    if (designStatus) {
        const designLower = designStatus.toLowerCase();
        if (designLower.includes("i have") || designLower.includes("have design")) {
            formattedDesign = "✓ Client will provide designs";
        } else if (designLower.includes("need") || designLower.includes("help")) {
            formattedDesign = "Design to be created";
        } else if (designLower.includes("reference")) {
            formattedDesign = "Design from references";
        } else if (designLower.includes("not sure")) {
            formattedDesign = "Design consultation needed";
        }
    }

    // Format pages with default pages included
    const defaultPages = ["Home", "About", "Contact", "Privacy Policy", "Terms of Service"];
    let additionalPages = [];
    if (pages && pages !== "Standard pages") {
        additionalPages = pages.split(",").map(p => p.trim()).filter(p => p);
    }

    const formattedPages = `  • Default: ${defaultPages.join(", ")}${additionalPages.length > 0 ? "\n  • Additional: " + additionalPages.join(", ") : ""}`;

    return `[PROPOSAL_DATA]
PROJECT PROPOSAL

═══════════════════════════════════════
CLIENT DETAILS
═══════════════════════════════════════
Client Name: ${clientName}
Project Name: ${projectName}
Service: ${service || "Website Development"}

═══════════════════════════════════════
PROJECT OVERVIEW
═══════════════════════════════════════
${formattedDescription}

Website Type: ${websiteType.replace(/,\s*/g, ", ")}

Pages & Features:
${formattedPages}

═══════════════════════════════════════
TECHNICAL SPECIFICATIONS
═══════════════════════════════════════
Technology Stack: ${techStack.replace(/,\s*/g, ", ")}
Deployment: ${deploymentPlatform.replace(/,\s*/g, ", ")}
Domain: ${formattedDomain}
Design: ${formattedDesign}
Integrations: ${integrations ? integrations.replace(/,\s*/g, ", ") : "None specified"}

═══════════════════════════════════════
INVESTMENT & TIMELINE
═══════════════════════════════════════
Budget: ${budget}
Timeline: ${timeline}

═══════════════════════════════════════
NEXT STEPS
═══════════════════════════════════════
1. Review and confirm this proposal
2. Sign agreement and pay deposit (50%)
3. Kickoff meeting to begin work

To customize this proposal, use the Edit Proposal option.
[/PROPOSAL_DATA]`;
}

/**
 * Get opening message for a service
 * @param {string} service - Service name
 * @returns {string} Opening greeting
 */
export function getOpeningMessage(service) {
    return getChatbot(service).openingMessage;
}
