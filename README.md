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

> **Status: Coming Soon** — Star this repo to get notified when the first release ships.

---

### Why this exists

The [Congress.gov API](https://api.congress.gov) is powerful but raw — no official SDK, inconsistent response shapes, pagination quirks, and rate limiting that'll bite you. This client handles all of that so you can focus on building.

### Planned features

```typescript
import { Congress } from '@capitoltrace/congress-api';

const congress = new Congress({ apiKey: 'your-key' });

// Get a bill
const bill = await congress.bill('118', 'hr', '1');

// Search members
const members = await congress.members({ chamber: 'senate', state: 'CA' });

// Get vote details
const vote = await congress.vote('118', 'senate', '1');

// List committees
const committees = await congress.committees({ chamber: 'house' });

// Auto-paginate
for await (const bill of congress.bills.list({ congress: 118 })) {
  console.log(bill.title);
}
```

### What you get

- **Full type safety** — Every endpoint returns typed responses, no `any`
- **Auto-pagination** — Async iterators for list endpoints, no manual `offset` management
- **Rate limit handling** — Built-in retry with backoff for 429 responses
- **Zero dependencies** — Uses native `fetch()` (Node 18+, Deno, Bun, browsers)
- **Tree-shakeable** — Import only what you need

### Endpoints covered

| Resource | Methods |
|:---------|:--------|
| 📜 Bills | `list`, `get`, `actions`, `cosponsors`, `subjects`, `text` |
| 👥 Members | `list`, `get`, `sponsoredLegislation`, `cosponsoredLegislation` |
| 🗳️ Votes | `list`, `get` (House + Senate roll calls) |
| 🏛️ Committees | `list`, `get`, `bills`, `reports`, `nominations` |
| 📋 Nominations | `list`, `get`, `actions`, `hearings` |
| 🤝 Treaties | `list`, `get`, `actions` |
| ✏️ Amendments | `list`, `get`, `actions`, `cosponsors` |
| 📰 Congressional Record | `list` daily issues |
| 📅 Congress | `list`, `get` session info |

### Installation

```bash
# npm
npm install @capitoltrace/congress-api

# yarn
yarn add @capitoltrace/congress-api

# pnpm
pnpm add @capitoltrace/congress-api
```

### Get your API key

Congress.gov API keys are **free** — [sign up here](https://api.congress.gov/sign-up/) (takes 30 seconds).

### Contributing

This is an open-source project by [Capitol Trace](https://github.com/CapitolTrace). PRs welcome — especially for:
- Additional endpoint coverage
- Better TypeScript types from real API responses
- Deno / Bun compatibility testing
- Documentation improvements

### License

MIT

---

<p align="center">
  <strong>Part of the <a href="https://github.com/CapitolTrace">Capitol Trace</a> ecosystem.</strong><br/>
  Built with data from <a href="https://api.congress.gov">api.congress.gov</a>
</p>
