# Sadvidya Translation Scorecard

A personal dashboard for scoring Flag Reports on Sadvidya Magazine translations.
Upload the Flag Report PDF, the dashboard reads it, scores the article out of 10
and shows how your translations improve over time.

**Everything runs in your browser.** No login, no server, no AI API. Your reports
are stored in this browser only (IndexedDB) and never leave your machine.

---

## Running it

You need [Node.js](https://nodejs.org) 18 or newer (this was built on Node 22).

```bash
npm install      # once, the first time
npm run dev      # start it; open the link it prints (usually http://localhost:5173)
```

To stop it, press `Ctrl + C` in the terminal.

### Putting it online later

```bash
npm run build    # creates a "dist" folder
npm run preview  # check the built version locally
```

The `dist` folder is a plain static site — upload it to Netlify, Vercel, GitHub
Pages or any web host. It uses `#`-style links so it works from any folder with
no server configuration. Note that data is stored per-browser: a hosted copy
starts empty and does not share data with your local copy (use the Export /
Import buttons in settings to move data between them).

### Other commands

```bash
npm test                 # run the scoring and parser tests
npm run make-sample-pdf  # writes samples/sample-flag-report.pdf for testing uploads
```

---

## How the score works

Each of the four parameters starts at 10. Each **FLAGGED** item deducts points.
**UNSURE** items are tracked but never cost anything.

| Parameter | Per flag | Weight |
|---|---|---|
| Meaning Drift | −2.0 | 35% |
| Voice & Conviction | −1.5 | 25% |
| Natural Phrasing | −1.0 | 25% |
| Term Consistency | −1.0 | 15% |

Parameter score = `max(0, 10 − flags × deduction)`.
Overall score = weighted average of the four, rounded to one decimal.
A clean report scores 10.0 everywhere.

Grades follow the flame scale: 9–10 "Radiant flame" · 7.5–8.9 "Bright and steady" ·
6–7.4 "Burning low" · below 6 "Needs more oil". (The original wording from the
brief is kept in a comment there if you prefer it.)

**Two files control everything you are likely to want to change:**

- `src/config/scoring.ts` — deductions, weights, grade labels, the target line,
  the tips, and the "parameter key" wording shown on the Home page.
- `src/config/theme.ts` — every colour and font in the dashboard, including the
  score-bar bands and the chart colours. `tailwind.config.ts` reads this file, so
  there is only ever one list of colours.

---

## The Flag Report format

Ask Claude to write reviews in exactly this format before saving as PDF. The
**Copy review template** button on the Add Report page puts it on your clipboard.

```
FLAG REPORT
Article: <title>
Date: <YYYY-MM-DD>
Language: Hindi
Status: FLAGGED   (or CLEAN)

--- FLAG 1 ---
Line: 4
Parameter: Natural Phrasing
Status: FLAGGED
Term: (optional)
English: <english line>
Hindi: <hindi line>
Reason: <one or two sentences>

--- FLAG 2 ---
...

SUMMARY
Meaning Drift: 1 | Natural Phrasing: 2 | Term Consistency: 0 | Voice & Conviction: 1 | Unsure: 1
```

The parser is forgiving about case, spacing and small variations such as
`meaning-drift` or `Term consistency`.

### Designed reports are read too

Reviews are not always written in the plain template. A designed report — the
kind with coloured flag boxes — is also understood:

```
FLAGGED — TONE LOSS F1 · Opening
ENGLISH                        HINDI
What if the friends closest…   जिन दोस्तों के साथ…
THE GAP          <what was lost>
WHY IT MATTERS   <why it matters>
```

For these the dashboard:

- reads the status (FLAGGED / UNSURE), the reference (`F1`) and the section
- maps review wording onto the four parameters — "TONE LOSS" counts as Voice &
  Conviction, "OMISSION" and "ADDITION" as Meaning Drift, "STRUCTURE" and
  "STIFF PHRASING" as Natural Phrasing. The full list is `PARAMETER_ALIASES`
  in `src/config/scoring.ts`
- keeps the English and the translation apart even though they sit side by side
  in two columns, deciding which is which by the script each one is written in
- leaves out the **CLEAN** highlights, which praise what went well rather than
  marking a problem, and tells you how many it skipped
- warns you to set the date, since these reports do not carry one

**After parsing you always get a review table** where you can correct the
parameter, change the status, edit any text, add a missed flag or delete a
wrong one. Nothing is saved until you click **Save Report**. If a PDF cannot be
read at all, the same table opens blank so you can type the report in by hand.

---

## The pages

- **Home — My Translation Journey (`/`)**: the Sadvidya masthead and your running
  average; a row of score bars on a dark panel, one per article, coloured green /
  yellow / orange by score (hover for the title, click to open it); four stat
  cards; the score-journey line with its 8.0 target; the four-parameter radar
  (all-time average against your latest article); the **parameter key**, which
  explains each parameter with a worked example; **flags per month**; and the
  eight milestone badges.
- **Articles (`/articles`)**: grouped by month, with search, a newest/oldest
  toggle and the language filter. Click one for the full report card — the four
  parameter scores, what went well, what to work on, every flag grouped by
  parameter, and Edit / Delete / Export buttons.
- **Add Report (`/add`)**: drag and drop the PDF, check the flags in the review
  table, save.

The ⚙ button in the top bar opens settings: export a JSON backup, import one,
load or remove demo data, set the language filter (All / Hindi / Gujarati), or
clear everything.

---

## Folder structure

```
index.html                  the page shell and Google Fonts
public/                     the Gurukul emblem, the SADVIDYA wordmark, favicon
src/
  main.tsx                  starts React
  App.tsx                   top navigation and the three routes
  index.css                 Tailwind plus the card/button/diya styles
  types.ts                  what a Report and a Flag are
  config/
    scoring.ts              ALL deductions, weights, grades, tips, parameter key
    theme.ts                ALL colours and fonts (Tailwind reads this too)
  db/
    db.ts                   IndexedDB storage via Dexie
  lib/
    scoring.ts              the scoring engine and lenient name matching
    scoring.test.ts         unit tests for the scoring rules
    parser.ts               Flag Report text -> Report object
    parser.test.ts          unit tests for the parser
    pdf.ts                  PDF -> text, in the browser, with pdfjs-dist
    stats.ts                averages, streaks, repeat offenders, re-flags
    badges.ts               milestone badges
    demo.ts                 the six demo articles
    template.ts             the review template the Copy button uses
  context/
    AppContext.tsx          shared report list and language filter
  components/
    ScoreBar.tsx            the score bar — one per article
    Diya.tsx                the little lamp inside a milestone badge
    Charts.tsx              the three Recharts charts
    FlagTable.tsx           the editable review table
    SettingsDrawer.tsx      settings, backup, demo data
    ScoreInfo.tsx           "How is this calculated?" popover
  pages/
    Home.tsx                Progress Garden
    Articles.tsx            list view
    ArticleDetail.tsx       single report card
    AddReport.tsx           upload -> review -> save
scripts/
  make-sample-pdf.mjs       generates a test PDF from the template
tailwind.config.ts          imports the palette from src/config/theme.ts
```

---

## Design

The dashboard follows the Sadvidya / Shree Swaminarayan Gurukul design: a warm
cream page, the Gurukul red as the primary accent, Poppins for headings and
numbers, Lora for prose, and Noto Sans Devanagari for Hindi and Gujarati.

Scores are shown as bars on the flame scale — green at 9+, yellow at 8+, orange
at 7+, and a burnt amber below that. Those bands live in `scoreColor()` in
`src/config/theme.ts`.

The emblem and wordmark in `public/` came from the design file and were scaled
down for the web (3.3 MB of original artwork down to about 300 KB).

---

## Backing up

The dashboard lives in your browser's storage. Clearing browser data for the site
would delete it, so use **Settings → Export all data** now and then and keep the
JSON file somewhere safe. **Import** adds those reports back.
