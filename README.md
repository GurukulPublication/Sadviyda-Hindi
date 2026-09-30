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

Grades: 9–10 "Written in Hindi" · 7.5–8.9 "Almost there" · 6–7.4 "Needs polish" ·
below 6 "Reads like a translation".

**To change any of this, edit one file: `src/config/scoring.ts`.** The deductions,
weights, grade labels, target line, colours and the tips shown on the article page
all live there, and the whole dashboard follows automatically.

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
`meaning-drift` or `Term consistency`. **After parsing you always get a review
table** where you can correct the parameter, change the status, edit any text,
add a missed flag or delete a wrong one. Nothing is saved until you click
**Save Report**. If a PDF cannot be read at all, the same table opens blank so
you can type the report in by hand.

---

## The pages

- **Home — Progress Garden (`/`)**: a row of animated diyas, one per article
  (flame size and brightness follow the score); four stat cards; the score
  journey, parameter radar and flags-by-parameter charts; "your common mistakes"
  with repeat offenders and re-flag count; and milestone badges.
- **Articles (`/articles`)**: searchable, sortable cards. Click one for the full
  report card, with the four parameter scores, what went well, what to work on,
  every flag grouped by parameter, and Edit / Delete / Export buttons.
- **Add Report (`/add`)**: drag and drop the PDF, review, save.

The ⚙ button in the top bar opens settings: export a JSON backup, import one,
load or remove demo data, set the language filter (All / Hindi / Gujarati), or
clear everything.

---

## Folder structure

```
index.html                  the page shell and Google Fonts
src/
  main.tsx                  starts React
  App.tsx                   top navigation and the three routes
  index.css                 Tailwind plus the card/button/diya styles
  types.ts                  what a Report and a Flag are
  config/
    scoring.ts              ALL deductions, weights, grades, colours, tips
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
    Diya.tsx                the animated oil lamp
    Charts.tsx              the three Recharts charts
    FlagTable.tsx           the editable review table
    SettingsDrawer.tsx      settings, backup, demo data
    StatCard.tsx            a stat card
    ScoreInfo.tsx           "How is this calculated?" popover
  pages/
    Home.tsx                Progress Garden
    Articles.tsx            list view
    ArticleDetail.tsx       single report card
    AddReport.tsx           upload -> review -> save
scripts/
  make-sample-pdf.mjs       generates a test PDF from the template
```

---

## Backing up

The dashboard lives in your browser's storage. Clearing browser data for the site
would delete it, so use **Settings → Export all data** now and then and keep the
JSON file somewhere safe. **Import** adds those reports back.
