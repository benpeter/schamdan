# CLAUDE.md — schamdan.de

## Project Overview

schamdan.de is a German restaurant website built on AEM Edge Delivery Services (EDS).

- **Repo:** `benpeter/schamdan`
- **Content source:** Google Drive (see `fstab.yaml`)
- **Language:** de-DE
- **Boilerplate:** aem-boilerplate v1.3.0 with `aem.js`

### Environments

| Environment | URL |
|-------------|-----|
| Production (live) | https://main--schamdan--benpeter.aem.live/ |
| Preview | https://main--schamdan--benpeter.aem.page/ |
| Local dev | http://localhost:3000 (via `aem up`) |

### Blocks

| Block | Type | Notes |
|-------|------|-------|
| hero | CSS-only | Auto-built from h1 + picture |
| header | JS + CSS | Nav with hamburger menu |
| footer | JS + CSS | Fetches /footer content |
| cards | JS + CSS | Grid layout with images |
| columns | JS + CSS | Flex layout |
| speisen | CSS-only | Menu grid layout (nr/name/desc/prices) |
| fragment | JS + CSS | Include content from /fragments/ paths |

### Skills

EDS skills are in `.skills/` (not `.claude/skills/`). Run `./.agents/discover-skills` to list them. Key skills:
- `code-review` — EDS code review in self-review mode
- `content-driven-development` — Required for all block/script development work

### Known Quirks

- `aem.js` `wrapTextNodes()` wraps bare text in `<p>` tags inside blocks. Blocks with tight grid layouts (like speisen) need `p { margin: 0; }` to prevent unwanted spacing.
- hero.js and speisen.js are empty files — these are CSS-only blocks.

---

## DA Migration Plan (Phase 2 & 3)

### Current State (after Phase 1)

Phase 1 (boilerplate catch-up) is complete and merged to main:
- `lib-franklin.js` → `aem.js` migration done
- All dependencies updated (ESLint 8.57.1, Stylelint 17.1.1, Node 20)
- Missing boilerplate files added (.editorconfig, fragment block, fonts.css)
- All tests pass, lint clean

### Phase 2: Code Review

#### Step 2.1: Run EDS Code Review Skill
```bash
# In the schamdan repo, use the code-review skill in self-review mode
# Read .skills/code-review/SKILL.md first, then follow its instructions
```
- Review all code against EDS best practices
- Check performance, accessibility, semantic HTML
- Fix any issues found

#### Step 2.2: Verify after fixes
- `npm run lint` passes
- `npm test` passes
- Preview site renders correctly: https://main--schamdan--benpeter.aem.live/

---

### Phase 3: DA Migration (Origin Swap)

This migrates the content source from Google Drive to Document Authoring (DA).

#### Step 3.1: Create new DA repository

1. Create a new repo `benpeter/da-schamdan` from current `schamdan` main
2. Install the **AEM Code Sync** GitHub App on the new repo
3. Verify the site loads at: `https://main--da-schamdan--benpeter.aem.live/`

```bash
# Option A: Fork from schamdan
gh repo create benpeter/da-schamdan --public --source=/Users/ben/github/schamdan --push

# Option B: Create fresh and push
mkdir /Users/ben/github/da-schamdan
cd /Users/ben/github/da-schamdan
git init
git remote add origin git@github.com:benpeter/da-schamdan.git
# Copy all files from schamdan (excluding .git)
rsync -av --exclude='.git' /Users/ben/github/schamdan/ .
git add . && git commit -m "Initial: forked from schamdan after boilerplate catch-up"
git push -u origin main
```

Then install GitHub App:
- Go to https://github.com/apps/aem-code-sync and install on `benpeter/da-schamdan`

#### Step 3.2: Set up DA organization

1. Log in to https://da.live with Adobe account
2. Go to https://da.live/start — use Site Creator to set up org and site
3. Choose an org name (e.g. `benpeter` or `schamdan`)
4. Configure permissions at `https://da.live/config#/{org}/`

#### Step 3.3: Import content from Google Drive

1. **Inventory existing content:**
   ```
   # Use AEM bulk status to list all pages
   # Check: https://main--schamdan--benpeter.aem.live/query-index.json
   ```

2. **Bulk import to DA:**
   - Use the DA bulk importer (available at da.live)
   - Import all pages: homepage, speisekarte, etc.
   - Import nav and footer documents
   - Import any media/images

3. **Preview and publish all imported content:**
   - Check each page at `https://da.live/#/{org}/da-schamdan/`
   - Preview each page to generate .html versions
   - Publish all pages

#### Step 3.4: Update fstab.yaml

Change the content source from Google Drive to DA:

```yaml
# Before (Google Drive):
mountpoints:
  /: https://drive.google.com/drive/folders/1HRTxktFCgeURcvG51itiCVutnMl_zyJx

# After (DA):
mountpoints:
  /: https://content.da.live/{org}/da-schamdan
```

#### Step 3.5: Add DA live preview support

Add the DA preview snippet to `scripts/scripts.js` in `loadEager()`:

```javascript
// In loadEager(), before decorateTemplateAndTheme():
const defined = (await import(`${import.meta.url.replace('scripts.js', 'dapreview.js')}`)).default;
if (defined) await defined;
```

Create `scripts/dapreview.js`:
```javascript
const defined = new URLSearchParams(window.location.search).get('dapreview');
export default defined ? import('https://da.live/scripts/dapreview.js') : undefined;
```

This enables live preview in the DA editor when editing content.

#### Step 3.6: Configure Sidekick

Update the Sidekick config so the "Edit" button opens DA instead of Google Drive.

Create/update `tools/sidekick/config.json`:
```json
{
  "project": "schamdan",
  "host": "schamdan.de",
  "editUrl": "https://da.live/edit#/{org}/da-schamdan{path}"
}
```

#### Step 3.7: Test & validate

Run these checks on the DA-backed site:

- [ ] **Smoke test:** Homepage loads at `https://main--da-schamdan--benpeter.aem.page/`
- [ ] **All pages:** Check every page renders correctly
- [ ] **All blocks:** hero, header, footer, cards, columns, speisen, fragment
- [ ] **Query index:** `https://main--da-schamdan--benpeter.aem.live/query-index.json` returns data
- [ ] **HTML differences:** DA has different HTML output than Google Drive:
  - Lists: items wrapped in `<p>` tags
  - Tables: `<tbody>` only (no `<thead>`)
  - Check if any CSS/JS depends on exact HTML structure
- [ ] **Navigation:** hamburger menu, all links work
- [ ] **Lighthouse:** Run on mobile + desktop, all scores green
- [ ] **PSI:** https://pagespeed.web.dev/ — check both mobile and desktop

#### Step 3.8: Go live

1. **Delta import:** Import any content created/changed since initial import
2. **DNS/CDN:** Switch the CDN origin for schamdan.de to the new DA-based repo
   - If using Cloudflare/custom CDN: update origin to `main--da-schamdan--benpeter.aem.live`
   - If using AEM push invalidation: update the configuration
3. **Validate production:** Check schamdan.de loads correctly
4. **Monitor:** Watch for 404s, broken links, missing content

---

## Verification Checklist

### After Phase 2 (Code Review)
- [ ] Code review skill checks all pass
- [ ] No blocking issues remaining
- [ ] Site renders correctly on preview

### After Phase 3 (DA Migration)
- [ ] Content visible at `https://da.live/#/{org}/da-schamdan`
- [ ] Preview works at `https://main--da-schamdan--benpeter.aem.page/`
- [ ] Live site at `https://main--da-schamdan--benpeter.aem.live/`
- [ ] All pages render correctly
- [ ] Query indexes return data
- [ ] Lighthouse scores green (mobile + desktop)
- [ ] schamdan.de serves from DA content source

---

## Quick Reference

```bash
# Local development
cd /Users/ben/github/schamdan
aem up

# Lint & test
npm run lint
npm test
npm run lint:fix  # auto-fix lint issues

# Preview URLs for branches
# https://{branch}--schamdan--benpeter.aem.page/
# https://{branch}--schamdan--benpeter.aem.live/
```
