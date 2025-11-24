import OpenAI from "openai";
import { env } from "../config/env.js";

// Helper function to get service details
const getServiceDetails = (service) => {
    const services = {
        "Development & Tech": "Starting at ₹20,000. Web/mobile apps, SaaS platforms, e-commerce solutions.",
        "Digital Marketing": "Starting at ₹10,000. SEO, PPC, social media, content marketing strategies.",
        "Video Services": "Starting at ₹7,500. Video editing, promotional content, animation.",
        "Creative & Design": "Starting at ₹3,500. Branding, UI/UX, graphics, motion design.",
        "Lead Generation": "Starting at ₹15,000. Targeted lists, outreach campaigns, funnel building.",
        "Writing & Content": "Starting at ₹2,000. SEO blogs, copywriting, technical writing.",
        "Customer Support": "Starting at ₹8,000. Multi-channel support, helpdesk setup, 24/7 options.",
        "Administrative Services": "Starting at ₹3,000. Virtual assistance, data management, scheduling.",
        "Audio Services": "Starting at ₹2,000. Voiceover, podcast production, mixing & mastering.",
        "Lifestyle & Personal": "Starting at ₹2,500. Coaching, fitness, personal styling."
    };
    return services[service] || "Custom pricing based on requirements.";
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

        // Construct messages array from history and current message
        const messages = [
            {
                role: "system",
                content: `You are a professional consultant for FreelanceHub helping clients with "${service}" projects.

**CRITICAL: Response Format Rules**
• Keep ALL responses SHORT (2-4 sentences max)
• Ask ONE focused question at a time
• Use bullet points for lists
• Be direct and conversational

**Service Info: ${service}**
${getServiceDetails(service)}

**Your Goal:**
Gather: 1) What they need, 2) Timeline, 3) Budget range

**After 3-4 exchanges, provide:**
📋 **Quick Proposal:**
• **What:** [1 line scope]
• **Timeline:** [estimate]
• **Budget:** [range from ₹X]
• **Next:** Book a consultation at FreelanceHub

Keep it SHORT and STRUCTURED. No long paragraphs.`,
            },
            ...history.map(msg => ({ role: msg.role, content: msg.content })),
            { role: "user", content: message }
        ];

        console.log("Sending request to OpenRouter...");
        let completion;
        try {
            completion = await openai.chat.completions.create({
                model: env.OPENROUTER_MODEL,
                messages: messages,
                max_tokens: 200, // Keep responses short and concise
            });
        } catch (error) {
            if (error.status === 429 && env.OPENROUTER_MODEL_FALLBACK) {
                console.warn(`Primary model ${env.OPENROUTER_MODEL} rate limited. Switching to fallback model ${env.OPENROUTER_MODEL_FALLBACK}...`);
                completion = await openai.chat.completions.create({
                    model: env.OPENROUTER_MODEL_FALLBACK,
                    messages: messages,
                    max_tokens: 200, // Keep responses short and concise
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
