const firebaseHelper = require('../src/utils/firebaseHelper');
const { logger } = require('../src/utils/logger');

const templates = [
  {
    name: 'Local Growth Outreach (Indian Business)',
    category: 'Indian Local Business',
    subject: 'Quick question about growing {{company}} online',
    body: `Hi {{name}},

I came across {{company}} — love what you're doing!

Quick question — are you getting enough customers online?

We're Abhi Services. We help local businesses like yours get more leads and automate daily tasks through:

→ Professional websites & mobile apps
→ WhatsApp & social automations
→ Online booking & CRM tools

No fluff. Just results.

Can we have a quick 15-minute chat this week?

Best,
{{sender_name}}
Abhi Services
abhi.services`,
    followup1: `Hi {{name}},

Quickly following up on my email from a few days ago. 

I know you are busy running {{company}}, but would love to see if you have 10 minutes for a brief chat this week to share some specific online growth ideas for your business.

Best,
{{sender_name}}
Abhi Services`
  },
  {
    name: 'Problem-First Hook (Indian Business)',
    category: 'Indian Local Business',
    subject: 'Your competitors are getting clients you\'re missing',
    body: `Hi {{name}},

Most people search on Google before visiting a business.
If you're not showing up — they go to your competitor.

At Abhi Services, we build fast, modern websites and apps that help local businesses in India get found, build trust, and convert visitors into paying customers.

We've helped businesses across {{city}} get a strong online presence — quickly and affordably.

15-minute call? I'll share a quick idea specifically for {{company}}.

{{sender_name}}
Abhi Services
abhi.services`,
    followup1: `Hi {{name}},

Just wanted to follow up and see if you had a moment to check my previous email. 

I'd love to show you a quick layout of how we can help {{company}} rank higher in {{city}} and attract more local clients. 

Let me know if you have 10 minutes next Tuesday!

Best,
{{sender_name}}
Abhi Services`
  },
  {
    name: 'Cold Intro (International Business)',
    category: 'Foreign / International',
    subject: 'Helping {{company}} build faster & leaner',
    body: `Hi {{name}},

I came across {{company}} and was genuinely impressed by what you're building.

We're Abhi Services — a full-stack IT team specializing in Web, Mobile Apps, SaaS Platforms, and AI Automations.

What we help with:
→ Launch products 2x faster
→ Scale with clean, maintainable code
→ Automate workflows without bloated costs

Open to a 20-min call this week to see if we're a fit?

Best,
{{sender_name}}
Abhi Services | abhi.services`,
    followup1: `Hi {{name}},

Following up on my last email. I know you're busy growing {{company}}, but would love to see if you have 10-15 minutes for a quick introductory chat next week.

Even if you don't have immediate dev needs, it's always great to connect with other founders/builders in the space.

Best,
{{sender_name}}
Abhi Services`
  },
  {
    name: 'Value Pitch (International Business)',
    category: 'Foreign / International',
    subject: 'A smarter way to build custom tech features',
    body: `Hi {{name}},

Noticed {{company}} is growing fast — congrats!

One thing I see a lot at this stage: teams get slowed down by dev bottlenecks or manual operations.

At Abhi Services, we specialize in solving exactly that — with custom web, app, dashboard, or automation solutions built for your stack.

No long retainers. No surprise bills. Just fast, quality execution.

Worth 20 minutes?

{{sender_name}}
Abhi Services | abhi.services`,
    followup1: `Hi {{name}},

Just following up on my value pitch from the other day. 

If {{company}} is facing any bandwidth limits or looking to accelerate your product roadmap, we're ready to jump in and assist with high-quality web or automation builds.

Let me know if you're open to a brief chat.

Best,
{{sender_name}}
Abhi Services`
  },
  {
    name: 'LinkedIn Connection Request Note',
    category: 'LinkedIn Outreach',
    subject: 'LinkedIn Connection Request',
    body: `Hi {{name}}, I noticed your work at {{company}} — really impressive what you're building!

I run Abhi Services — we help businesses with web, app, and AI solutions.

Would love to connect and stay in touch.

— {{sender_name}}`,
    followup1: `Thanks for connecting, {{name}}!

If you are ever exploring any tech builds or need a reliable dev partner for web apps, dashboards, or AI automations — happy to have a quick chat.

No pressure, just here if it's relevant!

— {{sender_name}} | abhi.services`
  },
  {
    name: 'White-Label / Dev Partnership',
    category: 'IT Company Owner',
    subject: 'White-label / dev partnership — Abhi Services',
    body: `Hey {{name}},

Fellow founder here — I'll skip the fluff.

If your team ever hits capacity or needs extra dev muscle, Abhi Services is open to white-label or subcontract partnerships.

We cover the full stack:
→ Web & Mobile Apps
→ UI/UX Design
→ SaaS & Admin Panels
→ AI Automations & Dashboards

Fast delivery. Clean handoffs. No drama.

We've worked with agencies before and know how to stay invisible when needed.

Worth a quick chat?

{{sender_name}}
Abhi Services
abhi.services`,
    followup1: `Hey {{name}},

Following up to see if you're open to a quick 10-minute partnership call. 

We have some dev capacity starting next week, and I'd love to share our portfolio and dev rates to see if we can support your agency/projects when you hit bandwidth limits.

Best,
{{sender_name}}
Abhi Services`
  },
  {
    name: 'Custom Solution Proposal',
    category: 'Client Winning Pitch',
    subject: 'Here\'s how we\'d build your project',
    body: `Hi {{name}},

Great talking with you. Here's exactly how we'd approach this:

🎯 Your Challenge:
[Briefly state their pain point — 1 to 2 lines]

⚙️ Our Solution:
[Describe custom web, app, or automation solution]

📅 Timeline: [X weeks]
💰 Investment: [Price range or let's discuss]

What you get with Abhi Services:
✓ Dedicated dev team throughout
✓ Weekly progress updates
✓ Clean code, fully handed over
✓ 30-day post-launch support

We've done this. We know how to deliver.

Ready to start? Just reply and we'll send the agreement today.

{{sender_name}}
Abhi Services
abhi.services`,
    followup1: `Hi {{name}},

Following up on the proposal I sent you. 

I'd love to get your thoughts on the timeline and scope. If you need to make any adjustments or have any questions about the tech stack, let me know and we can hop on a quick call.

Best,
{{sender_name}}
Abhi Services`
  },
  {
    name: 'Responding to a Project Post',
    category: 'Project Post Outreach',
    subject: 'Saw your post about project build — we can build this',
    body: `Hi {{name}},

Saw your post about your project idea — that's a solid vision.

We build exactly this kind of thing at Abhi Services.

Based on what you described, we'd approach it with custom tech options tailored to your design and requirements.

We'd handle everything from design to deployment — so you can focus on the product, not the build.

Can we jump on a free 15-minute consultation? No commitment, just clarity.

{{sender_name}}
Abhi Services
abhi.services`,
    followup1: `Hi {{name}},

Quick follow up regarding your project post. 

I know you are likely receiving a lot of pitches, but I'd love to show you a couple of similar projects we've shipped to give you confidence in our work. 

Let me know if you have 10 minutes for a brief Zoom session!

Best,
{{sender_name}}
Abhi Services`
  },
  {
    name: 'General AI Automation Outreach',
    category: 'AI Automation',
    subject: 'What if your manual tasks ran on autopilot?',
    body: `Hi {{name}},

How much time does your team spend on repetitive admin tasks?

We build AI automations at Abhi Services that handle all of that automatically — 24/7, zero manual effort.

What we automate:
→ Customer queries & follow-ups
→ Lead qualification & CRM updates
→ Reports, alerts & scheduled actions
→ Onboarding workflows

One well-built automation = hours saved every single week.

Interested in a 15-min live demo?

{{sender_name}}
Abhi Services
abhi.services`,
    followup1: `Hi {{name}},

Following up on my email about automating your manual tasks. 

I've put together a short video demo showing how we qualify and update leads automatically using AI. Would you be open to reviewing it or joining a live 10-minute demo this week?

Best,
{{sender_name}}
Abhi Services`
  },
  {
    name: 'AI-Powered Call Receiver',
    category: 'AI Automation',
    subject: 'Never miss a customer call again',
    body: `Hi {{name}},

How many calls does {{company}} miss daily?

Every missed call = a lost customer.

We built an AI-powered call receiver that:
✓ Answers calls 24/7 — even at 2am
✓ Understands customer queries naturally
✓ Books appointments automatically
✓ Sends you a full call summary instantly

No extra staff. No missed revenue.

Want to see it live? 15-minute demo, zero pressure.

{{sender_name}}
Abhi Services
abhi.services`,
    followup1: `Hi {{name}},

Just following up to see if you'd like a quick, live test of our AI call receiver. 

I can give you a custom number to call right now so you can experience exactly how the AI agent answers questions and books appointments. 

Let me know if you are up for a quick test!

Best,
{{sender_name}}
Abhi Services`
  },
  {
    name: 'WhatsApp E-commerce Automation',
    category: 'AI Automation',
    subject: 'Turn WhatsApp into your 24/7 sales machine',
    body: `Hi {{name}},

Your customers are on WhatsApp. Are you selling to them automatically?

Our WhatsApp AI for e-commerce handles:
✓ Instant replies to product queries
✓ Order confirmations & tracking updates
✓ Abandoned cart recovery messages
✓ Promotional broadcasts to customer segments
✓ COD confirmation & return requests

Set it up once. It sells and supports forever.

Works with Shopify, WooCommerce, and custom stores.

Free demo this week?

{{sender_name}}
Abhi Services
abhi.services`,
    followup1: `Hi {{name}},

Following up on the WhatsApp automation. 

I'd love to share a quick case study of a Shopify brand that increased their sales by 18% in 30 days just by automating abandoned cart recovery on WhatsApp. 

Let me know if you'd like to check it out!

Best,
{{sender_name}}
Abhi Services`
  }
];

async function seed() {
  logger.info('Starting template seeding...');
  try {
    for (const temp of templates) {
      const record = {
        ...temp,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      const result = await firebaseHelper.push('templates', record);
      logger.info(`Seeded template: ${temp.name} (ID: ${result.id})`);
    }
    logger.info('Templates seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    logger.error('Failed to seed templates:', error);
    process.exit(1);
  }
}

seed();
