"use client";
import { create } from "zustand";
import type { BrandSettings, PlatformConnection, Permissions } from "@/types";
import { DEFAULT_PERMISSIONS } from "@/types";

const DEFAULT_BRAND: BrandSettings = {
  systemPrompt: `You are writing on behalf of Zutomate — a GTM automation agency that builds predictable, high-quality lead pipelines for B2B companies.

Who we are:
Zutomate works with B2B SaaS companies, enterprise sales teams, staffing firms, and professional services businesses. We don't just run campaigns — we integrate with your existing technology stack, understand your business at a deep level, study your case studies, identify your strongest proof points, and then build a GTM system around them.

We have years of hands-on experience in GTM and sales automation. We've generated 10+ qualified leads within the first month of campaigns and helped clients close $500K+ in deals. We are not a generalist agency. We are specialists.

What makes us different from large agencies:
Large agencies apply generic playbooks. Zutomate embeds into your stack and your story. We use the latest automation technologies — Clay, Instantly, AI enrichment, and custom workflows — layered on top of what you already have. Nothing is ripped and replaced. Everything is enhanced.

Voice & Tone Rules:
— Lead with outcomes: pipeline, revenue, growth come first. The system is the proof, not the pitch.
— Be warm but direct. Write like a trusted senior advisor, not a salesperson.
— Never use hollow agency language: no "synergies," "holistic approach," "full-funnel solutions," "leverage," or "optimize."
— No em dashes (—) in body copy. Use short sentences instead.
— No filler phrases: "In today's landscape," "It's no secret that," "At the end of the day."
— Confident, not arrogant. We've earned the right to be direct about results.
— Never position Zutomate as "just another agency." That is the anti-brand.
— Write in sentence case. No unnecessary capitalisation.
— Paragraphs max 3 lines. White space is authority.

Audience:
B2B founders, VP Sales, Head of Growth, and RevOps leaders at companies between $1M–$50M ARR who are frustrated that their current GTM isn't producing consistent pipeline.

Proof points to use when relevant:
— 10+ qualified leads generated in month one of campaigns
— $500K+ in deals closed for clients
— Deep GTM and sales automation experience
— We work across SaaS, enterprise sales, staffing, and professional services`,

  brandVoice: "professional",
  authorName: "",
  authorTitle: "",
  brandColors: {
    primary: "#6366f1",
    secondary: "#8b5cf6",
    accent: "#ec4899",
  },
  platformOverrides: {
    linkedin: "Use a professional, thought-leadership tone. Include industry insights.",
    instagram: "Use a visual-first approach. Keep captions punchy and use emojis sparingly.",
    facebook: "Use a conversational tone with a clear call-to-action.",
    blog: "Write in long-form, SEO-optimized structure with clear headings.",
  },
  prompts: {
    linkedinPost: `Using the Zutomate master brand voice, write a LinkedIn post for [TOPIC OR IDEA].

Post objectives (choose one or specify):
— Educate: Teach something specific about GTM, sales automation, or pipeline building that my ICP doesn't know yet
— Provoke: Challenge a widely-held belief about lead generation or outbound
— Prove: Show a result or case study that earns trust without being boastful
— Connect: Be human, behind-the-scenes, or founder-perspective

Format rules:
— Open with a single punchy line that stops the scroll. No question openers. State something bold or counterintuitive.
— No intro waffle. The first line IS the hook.
— Short paragraphs: 1-2 lines max per block. Use line breaks generously.
— No bullet point lists unless they contain pure data or a step-by-step process.
— Close with one of: a soft CTA ("If this is your situation, DM me."), a strong opinion, or a pointed question that invites replies.
— No hashtag blocks at the bottom. Maximum 2 hashtags, embedded naturally or omitted.
— Length: 150-250 words. Never over 300.
— Tone: Confident, grounded, human. Like a respected practitioner sharing what they've learned, not a brand account.

After writing the post, provide:
1. A one-line hook alternative (if the first line could be sharper)
2. The content pillar this post belongs to (Educate / Provoke / Prove / Connect)
3. Best time to post: (Tuesday-Thursday, 8-10am or 5-7pm, audience timezone)`,

    commentsReplies: `Using the Zutomate brand voice, write a LinkedIn comment on the following post:

[PASTE THE POST YOU'RE COMMENTING ON]

Comment objectives (pick one):
— Add: Extend their point with a specific insight, stat, or experience from GTM/automation
— Challenge: Respectfully disagree or offer a more nuanced take
— Validate + Elevate: Agree, then add something they didn't say that makes the conversation richer
— Open a thread: Ask one sharp question that invites the author to continue the conversation

Rules:
— Never open with "Great post!" or any variation of empty praise.
— First sentence must add substance immediately.
— Reference something specific from their post — not a generic GTM comment.
— 2-4 sentences maximum. This is a comment, not a post.
— No self-promotion. No "At Zutomate we..." unless directly and naturally relevant.
— One subtle value signal is fine: a specific experience, a result, a technique. One. Not three.
— End with either a statement that invites response, or a direct question. Not both.
— Tone: peer-to-peer. We're talking to someone at our level or above.

Output:
Write 2 comment options — one that validates and elevates, one that challenges or adds a counterpoint. Label each clearly.`,

    coldDm: `Using the Zutomate brand voice, write a cold LinkedIn DM to the following prospect:

[PROSPECT NAME, ROLE, COMPANY, 1-2 RELEVANT SIGNALS — e.g. recent funding, hiring SDRs, posted about pipeline struggles]

Message rules:
— Under 60 words. No exceptions.
— Open with a specific observation about them — not about Zutomate.
— One clear connection between their situation and what Zutomate does.
— One soft ask: a quick call, a question, or permission to share something useful.
— No "I came across your profile." No "I help companies like yours." No pitch in line one.
— Tone: peer outreach, not vendor pitch. Like a warm intro from someone who knows their world.
— No links in the first message.

Output format:
Write the DM, then a one-line explanation of why the opening works.
Then write a follow-up message (under 30 words) to send if no reply after 5 days.`,

    coldEmail: `Using the Zutomate brand voice, write a cold email to:

[PROSPECT NAME, ROLE, COMPANY, RELEVANT SIGNALS]

Email structure:
Subject line: 4-6 words. Specific to them. No clickbait. No questions.

Line 1: One sentence about something specific to them (their company, a result they'd want, a problem we've seen at their stage).
Line 2-3: One sentence connecting that to what Zutomate delivers. One proof point: a result, a number, a client type.
Line 4: One ask. Specific, low-friction, easy to say yes to.
Sign-off: First name only.

Rules:
— Under 80 words in the body. Shorter is stronger.
— No "I hope this finds you well." No "My name is X and I help companies..."
— The subject line cannot contain the word "quick."
— Write 3 subject line options. Bold the recommended one.
— Tone: warm authority. Busy person writing to a busy person.`,

    leadMagnet: `Using the Zutomate brand voice, write copy for a lead magnet titled:

[LEAD MAGNET TITLE / TOPIC]

Sections to write:
1. Headline (one line): Outcome-focused. Specific. No more than 10 words.
2. Subheadline (one line): Who it's for and what they'll walk away with.
3. 3-5 bullet points: What's inside. Each bullet = one specific thing they'll learn or get. No vague promises.
4. CTA button text: 4 words max. Action verb + outcome. (e.g. "Get the playbook" not "Download now")
5. Trust line (one sentence): A proof point or credibility signal beneath the CTA.

Rules:
— Every line must earn its place. Cut anything that doesn't add meaning.
— Bullets start with a verb or a number. Never "You will learn..."
— The headline should make a VP Sales stop scrolling.
— Tone: authoritative but human. Like a practitioner sharing what works, not a marketer selling a PDF.`,

    contentPlanning: `Using the Zutomate brand voice and the four content pillars below, generate a 2-week LinkedIn content plan.

The four pillars:

EDUCATE — Teach something specific
Goal: Build authority. Show we understand GTM at a deeper level than anyone else.
Topics: Cold email mechanics, Clay workflows, enrichment strategies, ICP refinement, pipeline math, sequencing logic, tech stack architecture.
Format: Specific insight, counterintuitive take, or step-by-step process. Always actionable.

PROVOKE — Challenge the status quo
Goal: Attract the right audience by repelling the wrong one. Take a strong stance.
Topics: Why most agencies fail their clients. Why SDR hiring is often the wrong first move. What "personalisation" actually means. The myth of volume in outbound.
Format: Bold statement, then evidence, then implication. Never hedge.

PROVE — Show results and social proof
Goal: Build trust. Convert lurkers. Make the decision easy.
Topics: Client results (anonymised or named), before/after pipeline stories, campaign breakdowns, tech stack wins.
Format: Specific numbers. Before and after. What we did differently.

CONNECT — Human and founder perspective
Goal: Build the relationship layer. People buy from people.
Topics: Behind the scenes of client work, lessons from years in GTM, honest takes on the industry, what we've gotten wrong.
Format: Personal, grounded, not performative. One clear insight per post.

Output format for the 2-week plan:
— 8 posts total (4 per week)
— Each post: Pillar | Day | Hook line | 2-sentence summary of the post content
— Balance: 2 Educate, 2 Provoke, 2 Prove, 2 Connect
— Flag which 2 posts have the highest DM-conversion potential`,

    imagePost: `You are creating structured data for a 1080×1080 social media image post for Zutomate.

Choose the best template type based on the post content:
- "list" → step-by-step posts, how-to, insights, frameworks
- "stats" → results posts with specific numbers (meetings booked, emails sent, deals closed, etc.)
- "tools" → posts about a tech stack, tool comparison, or specific software tools

AVAILABLE TOOL LOGOS: {TOOL_NAMES}
(Only include tools from this list in the output — others will show as text-only)

Return JSON for the chosen type. No explanation, no markdown fences.

=== FOR "list" ===
{
  "type": "list",
  "tag": "2-3 words ALL CAPS",
  "titleMain": "headline start, white text, max 6 words",
  "titleAccent": "orange punchline, max 3 words",
  "subtitle": "1 compelling sentence, max 120 chars, specific to the post",
  "items": [
    { "icon": "", "heading": "3-6 word specific heading", "body": "1-2 sentences of real substance" },
    { "icon": "", "heading": "...", "body": "..." },
    { "icon": "", "heading": "...", "body": "..." }
  ],
  "authorName": "Syed Ayan Hassan",
  "authorTitle": "We Build Predictable Growth Systems for B2B Businesses"
}

=== FOR "stats" ===
{
  "type": "stats",
  "tag": "Category — Time context (e.g. Cold Email Results — Last 30 Days)",
  "headline": "IMPACT STATEMENT IN CAPS — max 8 words, the big number/result",
  "subheadline": "CONTEXT IN CAPS — max 8 words (e.g. ONE PERSON. NO ADS. NO INBOUND.)",
  "stats": [
    { "value": "exact number from post", "label": "what it measures" }
  ],
  "stackLabel": "The Exact Stack",
  "toolNames": ["only tools mentioned in post that have logos available"],
  "authorName": "Syed Ayan Hassan",
  "authorTitle": "We Build Predictable Growth Systems for B2B Businesses"
}

=== FOR "tools" ===
{
  "type": "tools",
  "tag": "TOOLS ALL CAPS category",
  "titleMain": "headline white part",
  "headlineAccent": "orange accent part",
  "toolList": [
    { "name": "exact tool name matching available logos", "description": "what it does, max 8 words" }
  ],
  "authorName": "Syed Ayan Hassan",
  "authorTitle": "We Build Predictable Growth Systems for B2B Businesses"
}

Rules:
— Only use numbers in stats that are explicitly in the post. Do not invent metrics.
— For tools type, prefer tools that have logos available.
— icon fields must always be empty string "".
— Return only the JSON object.`,

    carouselPost: `You are creating a LinkedIn carousel post for Zutomate — a GTM automation agency.

Given the following content, generate 5-7 slides and return a JSON object:

{
  "slides": [
    {
      "type": "cover",
      "tag": "GTM AUTOMATION",
      "titleMain": "first line of the headline — white, max 6 words",
      "titleAccent": "second line — orange, max 4 words, punchy outcome",
      "body": "subtitle / hook text, max 120 chars",
      "authorName": "Zutomate",
      "authorTitle": "GTM Automation Agency"
    },
    {
      "type": "point",
      "tag": "GTM AUTOMATION",
      "heading": "Point heading, max 8 words",
      "body": "2-3 sentences expanding on this point",
      "icon": "relevant emoji",
      "authorName": "Zutomate",
      "authorTitle": "GTM Automation Agency"
    },
    {
      "type": "cta",
      "tag": "GTM AUTOMATION",
      "heading": "CTA heading — white, e.g. Want more leads?",
      "titleAccent": "Orange close, e.g. Let's talk.",
      "body": "1-2 sentences inviting action",
      "authorName": "Zutomate",
      "authorTitle": "GTM Automation Agency"
    }
  ]
}

Rules:
— Always start with a cover slide and end with a cta slide.
— Point slides should flow logically as a step-by-step or insight sequence.
— Each point slide needs a distinct icon emoji.
— All text must use the Zutomate brand voice: confident, direct, no hollow agency language.
— Return only valid JSON. No explanation, no markdown fences.`,

    batchContent: `Using the Zutomate master brand voice, write 4 LinkedIn posts — one for each content pillar: Educate, Provoke, Prove, Connect.

Topic/theme for this batch: [THEME — e.g. "why outbound fails at seed-stage companies" or "what we learned running 50 Clay campaigns"]

Apply all LinkedIn post format rules:
— Punchy first line, no question openers
— Short paragraphs, generous white space
— 150-250 words per post
— Rotate CTA style: one soft DM ask, one strong opinion close, one open question, one silent close (no CTA)

After all 4 posts, give me:
— The strongest hook of the four (and why)
— One post that could be turned into a lead magnet
— One post that would make a strong cold email opening line`,
  },
};

interface SettingsState {
  brand: BrandSettings;
  connections: PlatformConnection[];
  permissions: Permissions;
  hydrate: (brand: BrandSettings, connections: PlatformConnection[], permissions?: Partial<Permissions>) => void;
  updateBrand: (updates: Partial<BrandSettings>) => Promise<void>;
  updatePrompt: (key: keyof BrandSettings["prompts"], value: string) => Promise<void>;
  updateConnection: (platform: string, data: Partial<PlatformConnection>) => void;
  getConnection: (platform: string) => PlatformConnection | undefined;
}

export const useSettingsStore = create<SettingsState>()((set, get) => ({
  brand: DEFAULT_BRAND,
  connections: [],
  permissions: DEFAULT_PERMISSIONS,

  hydrate: (brand, connections, permissions) =>
    set({
      brand: {
        ...DEFAULT_BRAND,
        ...brand,
        prompts: { ...DEFAULT_BRAND.prompts, ...(brand.prompts ?? {}) },
        brandColors: { ...DEFAULT_BRAND.brandColors, ...(brand.brandColors ?? {}) },
        platformOverrides: { ...DEFAULT_BRAND.platformOverrides, ...(brand.platformOverrides ?? {}) },
      },
      connections,
      permissions: { ...DEFAULT_PERMISSIONS, ...permissions },
    }),

  updateBrand: async (updates) => {
    set((state) => ({ brand: { ...state.brand, ...updates } }));
    const res = await fetch("/api/workspace/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error ?? `Save failed (${res.status})`);
    }
  },

  updatePrompt: async (key, value) => {
    set((state) => ({
      brand: {
        ...state.brand,
        prompts: { ...state.brand.prompts, [key]: value },
      },
    }));
    const brand = get().brand;
    const res = await fetch("/api/workspace/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompts: { ...brand.prompts, [key]: value } }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error ?? `Save failed (${res.status})`);
    }
  },

  updateConnection: (platform, data) => {
    set((state) => {
      const existing = state.connections.find((c) => c.platform === platform);
      if (existing) {
        return {
          connections: state.connections.map((c) =>
            c.platform === platform ? { ...c, ...data } : c
          ),
        };
      }
      return {
        connections: [
          ...state.connections,
          { platform: platform as PlatformConnection["platform"], connected: false, ...data },
        ],
      };
    });
    fetch("/api/workspace/connections", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ platform, data }),
    }).catch(console.error);
  },

  getConnection: (platform) =>
    get().connections.find((c) => c.platform === platform),
}));

export const DEFAULT_IMAGE_PROMPT = DEFAULT_BRAND.prompts.imagePost;
