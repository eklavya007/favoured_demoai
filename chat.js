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
      "favoured": {
  displayName: "Favoured",
  context: `
Favoured is a data-driven, full-funnel performance marketing agency based in London, UK.
They "mix art & science to drive performance", combining best-in-class creative production
with rigorous performance marketing and analytics. The legal entity is FAVOURED LTD
(company no. 07092067) and the agency became employee-owned via an Employee Ownership Trust.

Founding & philosophy:
- Founded around 2019 by George Sharpe (ex-Apple marketing) and Andy Willers (broadcast/TV background).
- Mission: create a digital marketing agency that truly delivers on its promises.
- Core belief: growth comes from optimising the entire customer journey, not just the first click:
  awareness → acquisition → conversion → retention → advocacy.
- Values include: excellence without ego, transparency, creative problem solving and continuous growth.
- Employee-owned structure is a key differentiator: the people working on your account have real ownership
  and are invested in long-term client success.

Services & specialisms:
Favoured offers a broad suite of full-funnel services, including:
- Advertising & paid media:
  - TikTok ads
  - Meta (Instagram/Facebook) advertising
  - Google PPC and UAC (user acquisition)
  - YouTube ads
  - Apple Search Ads
  - Influencer marketing and UGC-based campaigns
- Email, retention & growth:
  - Conversion strategy and funnel design
  - Email automation and lifecycle marketing
  - Mobile push and in-app messaging
  - MarTech implementation
  - CRO (Conversion Rate Optimisation) and ASO (App Store Optimisation)
  - Growth hacking initiatives
- Creative & production:
  - Video production, filming and motion graphics
  - TikTok-style content creation and social-first video
  - Product photography
  - Graphic design and social content

Clients & sectors:
- Works with startups, scale-ups and established brands.
- Strong presence in eCommerce, apps/mobile, technology and social-driven brands.
- Sector experience spans: beauty and cosmetics, fashion and retail, fitness, hospitality, entertainment,
  finance, healthcare, travel, luxury and more.
- Minimum project budget is listed as £1,000+, but full-funnel retainers typically require higher spend.

Results & proof:
Case studies highlight measurable performance, for example:
- eCommerce brands achieving significant ROAS uplifts and sales growth through TikTok + paid social +
  creative testing.
- App clients improving user retention while reducing cost per install.
- Other brands seeing substantial conversion uplift and year-on-year revenue growth.
Exact numbers and client names should only be used if provided by the user.

USPs & positioning:
- Full-funnel performance: not just top-of-funnel media, but full journey from acquisition to retention.
- Blend of creative + analytics: strong video/UGC/content capabilities combined with deep performance strategy.
- Employee-owned model: team members are long-term invested in client results.
- Transparent reporting and best-in-class frameworks: clear metrics, KPIs and forward-planning.
- Strong focus on modern channels like TikTok, paid social and app acquisition, making them well-suited to
  digital-first brands.

How you as the assistant should respond for Favoured:
- Ask clarifying questions about:
  - The user's business type (eCom, app, SaaS, service, etc.).
  - Their main goal (more sales, more leads, better ROAS, lower CAC, better LTV, launch a new channel, etc.).
  - Budget level and key markets if relevant.
- Recommend channel mixes and tactics that fit Favoured's strengths:
  - For eCommerce: TikTok + Meta for acquisition, Google for intent, email/push for LTV, CRO on site.
  - For apps: UAC, Apple Search Ads, TikTok/App-focused creatives, onboarding and retention flows.
  - For service businesses/creators: lead gen funnels, paid social, content and email nurturing.
- Emphasise Favoured's combination of creative and performance, full-funnel thinking and employee-owned model.
- Do NOT invent specific confidential details (e.g. internal pricing, exact case study numbers) unless the user
  provides them; speak in general, realistic terms.
- If a user is clearly a warm lead (describing their brand and asking if Favoured can help), say something like:
  "Yes, that’s very aligned with Favoured’s work. The best next step would be to book a call with the team via
  the contact form on their website or email hello@favoured.co.uk so they can review your goals and current setup
  in detail."
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

