<h1 align="center">🏛️ congress-api</h1>

<p align="center">
  <strong>TypeScript client for the Congress.gov API</strong><br/>
  <em>Bills, members, votes, committees, nominations — typed and simple.</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Zero_Dependencies-black?style=flat-square" alt="Zero deps" />
  <img src="https://img.shields.io/badge/Node_18+-339933?style=flat-square&logo=node.js&logoColor=white" alt="Node" />
  <img src="https://img.shields.io/badge/License-MIT-blue?style=flat-square" alt="MIT" />
</p>

---

> **Status: v0.2.0** — full endpoint coverage: bills, members, votes, committees, nominations, treaties, amendments, the Congressional Record, and congress sessions, all verified against the live API.

---

### Why this exists

The [Congress.gov API](https://api.congress.gov) is powerful but raw — no official SDK, inconsistent response shapes, pagination quirks, and rate limiting that'll bite you. This client handles all of that so you can focus on building.

### Quick start

```typescript
import { Congress } from '@capitoltrace/congress-api';

const congress = new Congress({ apiKey: process.env.CONGRESS_API_KEY! });

// Get a bill
const bill = await congress.bill(118, 'hr', 1);
console.log(bill.title); // "Lower Energy Costs Act"

// Search members
for await (const member of congress.members.list({ state: 'CA' })) {
  console.log(member.name);
}

// House roll call votes
const vote = await congress.vote(119, 1, 17);
console.log(vote.result); // "Passed"

// How every member voted
const positions = await congress.votes.memberVotes(119, 1, 17);
console.log(positions.results?.length); // 434

// Auto-paginate — no manual offset management
for await (const bill of congress.bills.list({ congress: 118, billType: 'hr' })) {
  console.log(bill.title);
}

// Committees, nominations, treaties, amendments too
const committee = await congress.committee('house', 'hspw00');
for await (const b of congress.committees.bills('house', 'hspw00')) {
  console.log(`${b.type} ${b.number} — ${b.relationshipType}`);
}

const current = await congress.congresses.current();
console.log(current.name); // "119th Congress"
```

### What you get

- **Full type safety** — Every endpoint returns typed responses, no `any`
- **Auto-pagination** — Async iterators follow `pagination.next` for you
- **Rate limit handling** — Built-in retry with exponential backoff for 429s and 5xx, honors `Retry-After` — but fails fast with `RateLimitError` if the server asks you to wait longer than `maxRetryDelayMs` (api.data.gov sends `Retry-After: 84868` when a daily quota runs out; sleeping a day inside a request helps no one)
- **Zero dependencies** — Uses native `fetch()` (Node 18+, Deno, Bun, browsers)
- **Tree-shakeable** — ESM + CJS dual build, `sideEffects: false`

### Error handling

```typescript
import { CongressApiError, RateLimitError } from '@capitoltrace/congress-api';

try {
  await congress.bill(118, 'hr', 999999);
} catch (err) {
  if (err instanceof RateLimitError) {
    console.log(`Rate limited — retry after ${err.retryAfterSeconds}s`);
  } else if (err instanceof CongressApiError) {
    console.log(`API error ${err.status}: ${err.message}`);
  }
}
```

### Endpoints

| Resource | Methods | Status |
|:---------|:--------|:-------|
| 📜 Bills | `list`, `get`, `actions`, `cosponsors`, `subjects`, `summaries`, `text`, `titles` | ✅ v0.1 |
| 👥 Members | `list`, `get`, `sponsoredLegislation`, `cosponsoredLegislation` | ✅ v0.1 |
| 🗳️ Votes | `list`, `get`, `memberVotes` — House roll calls¹ | ✅ v0.1 |
| 🏛️ Committees | `list`, `get`, `bills`, `reports`, `nominations` | ✅ v0.2 |
| 📋 Nominations | `list`, `get`, `actions`, `committees`, `hearings`, `nominees` | ✅ v0.2 |
| 🤝 Treaties | `list`, `get`, `actions`, `committees` | ✅ v0.2 |
| ✏️ Amendments | `list`, `get`, `actions`, `cosponsors`, `amendments`, `text` | ✅ v0.2 |
| 📰 Congressional Record | `issues` (classic), `daily` (modern) | ✅ v0.2 |
| 📅 Congress | `list`, `get`, `current` | ✅ v0.2 |

¹ Via Congress.gov's beta `house-vote` endpoints. Senate roll call votes are not yet published by the Congress.gov API — they'll be added here the day upstream ships them.

### Installation

```bash
# npm
npm install @capitoltrace/congress-api

# yarn
yarn add @capitoltrace/congress-api

# pnpm
pnpm add @capitoltrace/congress-api
```

Works in Deno and Supabase Edge Functions too:

```typescript
import { Congress } from 'npm:@capitoltrace/congress-api';
```

### Get your API key

Congress.gov API keys are **free** — [sign up here](https://api.congress.gov/sign-up/) (takes 30 seconds).

### Need enriched data?

This client gives you raw Congress.gov data with your own key. If you want cross-referenced intelligence — congressional stock trades, FEC filings, FARA registrations, AI-detected correlations, webhooks — that's the [Capitol Trace API](https://capitoltrace.com).

### Contributing

This is an open-source project by [Capitol Trace](https://github.com/CapitolTrace). PRs welcome — especially for:
- Additional endpoint coverage (see the planned rows above)
- Better TypeScript types from real API responses
- Deno / Bun compatibility testing
- Documentation improvements

```bash
npm install
npm test         # vitest, no API key needed — tests run against recorded fixtures
npm run build    # tsup → dist/
```

### License

MIT

---

<p align="center">
  <strong>Part of the <a href="https://github.com/CapitolTrace">Capitol Trace</a> ecosystem.</strong><br/>
  Built with data from <a href="https://api.congress.gov">api.congress.gov</a>
</p>
