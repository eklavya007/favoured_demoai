// api/chat.js

// ---------------------------------------------------------
// BASIC VERCEL EDGE FUNCTION SETUP
// ---------------------------------------------------------
export const config = {
  runtime: "edge",
};

export default async function handler(req) {
  try {
    // Allow only POST requests from the frontend
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        { status: 405, headers: { "Content-Type": "application/json" } }
      );
    }

    // Parse JSON body: we expect { message: "...", company: "..." }
    const body = await req.json();
    const userMessage = body.message || "";
    const rawCompany = body.company || "this company";

    if (!userMessage) {
      return new Response(
        JSON.stringify({ error: "No message provided" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // ---------------------------------------------------------
    // 1. NORMALISE COMPANY NAME FOR LOOKUP
    // ---------------------------------------------------------
    const normalised = rawCompany.trim().toLowerCase();

    // ---------------------------------------------------------
    // 2. COMPANY PROFILES (EDIT THIS PART ONLY)
    // ---------------------------------------------------------
    //
    // This object is where you add / edit companies.
    // Each key should be a LOWERCASE version of the company name.
    //
    // ✅ How to add a new company:
    //
    // 1. Copy the TEMPLATE block below.
    // 2. Replace "your new company" with the lowercase name.
    // 3. Replace displayName + context with what I generate for you.
    // 4. Redeploy on Vercel – done.
    //
    // If a company is NOT in this list, the bot falls back to a generic mode.
    //

    const companyProfiles = {
      // -----------------------------------------------------
      // EXAMPLE 1 – BANHAM SECURITY
      // -----------------------------------------------------
      "banham security": {
        displayName: "Banham Security",
        context: `
Banham Security is a long-established, family-run security company in the UK.
They specialise in: high-security locks, intruder alarms, CCTV, access control,
safes, and a 24/7 keyholding & alarm response service.

Typical customer questions:
- Home vs business security solutions
- Monitored vs bells-only alarms
- CCTV monitoring, "voice-off" deterrence
- Registered key system and key duplication
- Free security surveys and installation process

When answering:
- Emphasise trust, heritage and premium service.
- Guide people towards booking a free security survey.
- Explain options clearly without overselling.
        `
      },

      // -----------------------------------------------------
      // EXAMPLE 2 – FAVOURED
      // -----------------------------------------------------
      "favoured": {
        displayName: "Favoured",
        context: `
Favoured is a performance marketing agency based in the UK.
They specialise in: paid social, paid search, TikTok & UGC creative,
multi-channel campaigns, email & lifecycle marketing, and full-funnel growth.

Typical customer questions:
- How can you help my eCom/app/service business grow?
- TikTok strategy and UGC creatives
- ROAS, CAC, LTV improvements
- What channels should I use and why?
- How Favoured works with clients (process, strategy, reporting).

When answering:
- Focus on ROI, testing, creative strategy and channel mix.
- Suggest realistic performance marketing strategies.
- Encourage booking a call via website contact form for detailed proposals.
        `
      },

      // -----------------------------------------------------
      // TEMPLATE – COPY THIS FOR ANY NEW COMPANY
      // -----------------------------------------------------
      /*
      "your new company (lowercase)": {
        displayName: "Your New Company (Nice Name)",
        context: `
Short description:
- What they do
- Who they serve (B2B/B2C, niche, market)
- Key services / products

Typical customer questions:
- ...
- ...
- ...

When answering:
- Emphasise X (e.g. trust, speed, premium, low cost)
- Push users towards Y (e.g. book a call, fill enquiry form, start free trial)
- Avoid guessing things like exact prices or confidential details.
        `
      },
      */
    };

    // ---------------------------------------------------------
    // 3. PICK THE RIGHT PROFILE (OR FALL BACK TO GENERIC)
    // ---------------------------------------------------------
    const companyProfile =
      companyProfiles[normalised] ||
      companyProfiles[rawCompany.toLowerCase()] ||
      null;

    const effectiveName =
      companyProfile?.displayName || rawCompany;

    const extraContext =
      companyProfile?.context ||
      `
You are a demo AI assistant built for ${effectiveName}.
You don't have internal data, but you can suggest realistic AI automations
for their website, customer journey, support, and lead generation.
      `;

    // ---------------------------------------------------------
    // 4. SYSTEM PROMPT (YOU DON'T USUALLY NEED TO TOUCH THIS)
    // ---------------------------------------------------------
    const systemPrompt = `
You are an AI assistant built specifically for ${effectiveName}.

Your job:
- Answer questions as if you are an AI assistant designed for ${effectiveName}.
- Use the following company-specific context to ground your answers:
${extraContext}

General rules:
- If you don't know something specific (e.g., internal tools, prices, team details),
  say you don't know and suggest how AI or automation could help in that area instead.
- Always relate your suggestions back to ${effectiveName}'s type of business and likely needs.
- Ask 1–2 clarifying questions about the user's goals before going very deep.
- Keep answers concrete, practical, and focused on real business value.
    `;

    // ---------------------------------------------------------
    // 5. CALL OPENAI
    // ---------------------------------------------------------
    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
      }),
    });

    if (!openaiRes.ok) {
      const errorText = await openaiRes.text();
      console.error("OpenAI API error:", errorText);
      return new Response(
        JSON.stringify({ error: "OpenAI API error", details: errorText }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const data = await openaiRes.json();
    const reply =
      data.choices?.[0]?.message?.content ||
      "Sorry, I couldn't generate a response.";

    return new Response(
      JSON.stringify({ reply }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Server error:", err);
    return new Response(
      JSON.stringify({ error: "Server error", details: String(err) }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
