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

/**
 * Build conversation state from message history
 * @param {Array} history - Array of {role, content} messages
 * @param {string} service - Service name
 * @returns {Object} State with collectedData and currentStep
 */
export function buildConversationState(history, service) {
    const { questions } = getChatbot(service);

    const collectedData = {};

    // Simple approach: count assistant-user pairs to determine step
    // Each valid pair = one question answered
    let answeredCount = 0;

    // Patterns that indicate an assistant message is asking a question (not just chatting)
    const isQuestionMessage = (msg) => {
        const content = (msg || "").toLowerCase();

        // Exclude generic greetings even if they have "?"
        if (content.includes("how can i help") || content.includes("what can i help")) {
            return false;
        }

        // Must contain actual question indicators from our question templates
        return content.includes("what's your") ||
            content.includes("what is your") ||
            content.includes("what should i call") ||
            content.includes("company or project") ||
            content.includes("what exactly are you") ||
            content.includes("what's the vision") ||
            content.includes("do you have") ||
            content.includes("select all") ||
            content.includes("what kind") ||
            content.includes("what technology") ||
            content.includes("tell me") ||
            content.includes("where would") ||
            content.includes("when do you") ||
            content.includes("what integrations") ||
            content.includes("what additional") ||
            content.includes("designs or inspirations") ||
            content.includes("deployed/hosted") ||
            content.includes("domain name") ||
            content.includes("budget") ||
            content.includes("timeline") ||
            content.includes("website ready");
    };

    for (let i = 0; i < history.length - 1; i++) {
        const botMsg = history[i];
        const userMsg = history[i + 1];

        if (botMsg.role === "assistant" && userMsg?.role === "user") {
            const botContent = botMsg.content || "";
            const userAnswer = userMsg.content?.trim();

            // Skip if bot message was not a question (e.g., "How can I help you?")
            // Only count if it's an actual question from the flow
            if (!isQuestionMessage(botContent)) {
                continue;
            }

            // Skip greetings - don't count as answer to name question
            const isGreeting = /^(hi|hello|hey|hii|hiii|yo|sup|what's up|whats up)$/i.test(userAnswer);

            if (userAnswer && !isGreeting) {
                // Map answer to the question at this step
                const questionAtStep = questions[answeredCount];
                if (questionAtStep) {
                    collectedData[questionAtStep.key] = userAnswer;
                }
                answeredCount++;
            }
        }
    }

    // Current step is the next unanswered question
    const currentStep = answeredCount;

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
    const { collectedData, currentStep, questions } = state;
    const currentQuestion = questions[currentStep];

    console.log(`📝 processUserAnswer: currentStep=${currentStep}, currentQuestion=${currentQuestion?.key}, message="${message}"`);

    // Detect greetings - don't save as answer, just re-ask the question
    const isGreeting = /^(hi|hello|hey|hii|hiii|yo|sup|what's up|whats up)$/i.test(message.trim());

    if (isGreeting) {
        // Don't advance step for greetings
        return {
            ...state,
            collectedData,
            currentStep,  // Keep same step
            isComplete: false,
        };
    }

    // Direct timeline detection - if message looks like a timeline answer, store it
    const isTimelineAnswer = /^\s*(?:\d+[-\s]?\d*\s*)?(?:week|month|day)s?\s*$/i.test(message.trim()) ||
        /^flexible$/i.test(message.trim()) ||
        /^1-2 weeks$/i.test(message.trim()) ||
        /^1 month$/i.test(message.trim()) ||
        /^2-3 months$/i.test(message.trim());

    if (isTimelineAnswer && !collectedData.timeline) {
        console.log(`⏰ Direct timeline detection: storing "${message}" as timeline`);
        collectedData.timeline = message.trim();
    }

    if (currentQuestion && message.trim()) {
        // Handle skip
        if (message.toLowerCase().includes("skip") || message.toLowerCase() === "done") {
            collectedData[currentQuestion.key] = "[skipped]";
        } else {
            collectedData[currentQuestion.key] = message.trim();
        }
        console.log(`✅ Stored: ${currentQuestion.key} = "${message.trim()}"`);
    } else {
        console.log(`⚠️ currentQuestion is undefined or message empty`);
    }

    const newStep = currentStep + 1;
    const isComplete = newStep >= questions.length;

    console.log(`📊 After process: newStep=${newStep}, questionsLength=${questions.length}, isComplete=${isComplete}`);

    return {
        ...state,
        collectedData,
        currentStep: newStep,
        isComplete: isComplete,
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
    const templates = question.templates;

    // Pick random template for variety
    let text = templates[Math.floor(Math.random() * templates.length)];

    // Replace placeholders like {name} with actual values
    for (const [key, value] of Object.entries(collectedData)) {
        text = text.replace(new RegExp(`\\{${key}\\}`, "gi"), value);
    }

    // Add suggestions if available
    if (question.suggestions) {
        const tag = question.multiSelect ? "MULTI_SELECT" : "SUGGESTIONS";
        text += `\n[${tag}: ${question.suggestions.join(" | ")}]`;
    }

    return text;
}

/**
 * Check if we have enough info to generate proposal
 * @param {Object} state - Current conversation state
 * @returns {boolean}
 */
export function shouldGenerateProposal(state) {
    const { collectedData, isComplete, currentStep, questions } = state;

    console.log(`🔍 shouldGenerateProposal: isComplete=${isComplete}, currentStep=${currentStep}, questionsLength=${questions?.length}, collectedKeys=${Object.keys(collectedData).join(",")}`);

    // Primary check: all questions answered
    if (isComplete) {
        console.log("✅ Proposal: isComplete is true");
        return true;
    }

    // Secondary check: currentStep has passed the last question
    if (currentStep >= questions.length) {
        console.log("✅ Proposal: currentStep >= questions.length");
        return true;
    }

    // Direct check: if timeline is answered, we're done (Website Development has 12 questions, timeline is last)
    if (collectedData.timeline && collectedData.timeline !== "[skipped]") {
        console.log("✅ Proposal: timeline is answered");
        return true;
    }

    console.log(`❌ Proposal: Not ready - currentStep=${currentStep}, questionsLength=${questions?.length}`);
    return false;
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

