# Flipped: Spec

**Know your real profit from reselling** · #7 of 17 · Wave 1: Daily keepers · Used: Several times a week · Medium · Revenue potential: Medium · Money & Work · Source: New (Claude)

## One-liner

For Vinted, eBay and Depop sellers. Log what you paid, the fees, postage and what it sold for, and Flipped shows your real profit per item and per month, what's still unsold, and how close you are to the levels where platforms report sellers to HMRC.

## Problem / audience

- **Who it's for:** Casual and side-hustle resellers on Vinted, eBay, Depop and at car boot sales.
- **The problem it solves:** Sellers don't know their real profit after fees and postage, and aren't sure about tax reporting.
- **Example:** A seller logs 40 Vinted sales in a month, sees £310 real profit after postage, and spots five items that have sat unsold for 60 days.

## MVP features (ship with only these)

1. Log items: cost, platform, fees, postage, sale price
2. Profit per item and per month
3. Unsold stock with days listed
4. Reporting-threshold tracker (sales count and total; current rules to verify)
5. Monthly recap

## Not in MVP

- Export for self-assessment
- Fee presets per platform
- Bundle and job-lot tracking

## Monetisation

| Model | Detail |
|---|---|
| Free | Up to 30 items a month, with ads |
| Premium | £34.99/year (shown first) or £3.49/month: unlimited items, exports, platform presets, every Arcade game in the app |
| Arcade games | £0.99 each, kept forever, or every game in the app with Premium |
| KC All Access | £25 once (every Arcade game in every KC app, kept forever) plus £7.99/month or £79.99/year (Premium in every KC app). Needs a free KC account. |
| Ads | Light |

Prices are starting points; test before committing. **Portfolio premium promise:** free has ads; the moment you pay you get no ads, cloud backup and storage, and sync across your devices, plus this app's extras.

## Retention: The Progression Loop

| Stage | Design |
|---|---|
| Cue | 'Sold something?' prompt and month-end recap |
| Tiny win | Log a sale |
| Progress | Monthly profit and goal |
| Share | Monthly profit cards |
| Next step | Set next month's profit goal |
| Cadence | Several times a week |

Follow the portfolio guardrails: no guilt-trip notifications, no fake urgency, progress is
never wiped, at most one notification a day by default.

## Animation and tone: five signature animations

**Calm.** Gentle, kind humour and smooth motion: a stickman yawning after a shift, a fly escaping an empty pocket. No drama, nothing that adds stress.

- Item sold: 'ka-ching!' and the item flips through the air
- Profit goal hit: Kaos surfs a wave of parcels
- Unsold for 60 days: the dusty item sneezes
- Postage logged: the parcel waddles off to the post box
- Monthly recap: the bar chart grows like a plant


## AI

**None.** Not needed. Plain code does everything this app does. (Portfolio rule: plain code first, code does the maths,
cheapest model, shared budget cap, premium-gated.)

## Platform & data

- **Platform:** Expo app.
- **Data:** On the device only.
- **Backend:** None for the free version: everything lives on the phone. Premium backup and sync use the shared portfolio backend (see the master repo's HOSTING.md).
- **Stack:** shared portfolio foundation (Expo, PostHog, RevenueCat, AdMob, shared Progression Loop module).

## Growth engine

- **Content pillars:** Reselling tips; Real profit maths; Side-hustle tax basics
- **Shareable output:** Monthly profit cards

## Risks

Tax wording must stay general and be checked against current HMRC guidance. Platform fees change.

## Launch checklist

- [ ] Name checked on the App Store, Play Store and a trademark search
- [ ] MVP features done and tested
- [ ] Progression Loop wired (cue, tiny win, progress, milestone, next step)
- [ ] Privacy policy and terms
- [ ] Landing page
- [ ] Analytics wired (D1/D7/D30 retention)
- [ ] Payments / ads wired
- [ ] Added to the Growth & Maintenance Engine as an app config
