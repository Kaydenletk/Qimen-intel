# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

QMDJ Engine (Qi Men Dun Jia / Kỳ Môn Độn Giáp) - A Vietnamese metaphysical analysis engine implementing the traditional Chinese divination system. The engine calculates rotating palace charts based on date/time inputs and provides topic-specific analysis (wealth, health, career, relationships, etc.).

## Commands

**Run the server:**

```bash
node server.js
# Access at http://localhost:3000
```

**Run specific test cases:**

```bash
node tests/case-2026-03-03-0500.mjs
node tests/case-2026-03-03-1605.mjs
node src/index.js  # Runs built-in demo
```

**Run all tests:**

```bash
for f in tests/*.mjs; do node "$f"; done
```

## Architecture

### Core Engine (`src/core/`)

The engine implements a 6-layer analysis system:

1. **tables.js** - Pure data constants: Stems (Thập Thiên Can), Branches (Thập Nhị Địa Chi), Nine Stars (Cửu Tinh), Eight Doors (Bát Môn), Eight Deities (Bát Thần), Palace metadata, and Solar Term definitions.

2. **calendar.js** - Solar term calculation using astronomical longitude.

3. **stems.js** - Day/Hour pillar calculations, Không Vong (Void) determination.

4. **flying.js** - The main palace rotation engine (Chuyển Bàn):
   - Earth Plate (Địa Bàn) stem distribution based on Cục number
   - Star rotation: Lead Star moves to Hour Stem palace
   - Door rotation: Count steps from Xun branch to Hour branch
   - Deity rotation: Yang=clockwise, Yin=counter-clockwise
   - Phục Âm/Phản Ngâm detection

5. **dungthan.js** - Topic analysis (Dụng Thần): Maps life topics to best palace + directional advice.

6. **insightEngine.js** - Combines chart data with topic results to generate insights.

### Topic-Specific Logic (`src/logic/dungThan/`)

Domain-specific analysis modules:

- `careerLogic.js`, `healthLogic.js`, `loveLogic.js`, `wealthLogic.js`, `generalLogic.js`
- `energyFlowLogic.js` - Energy flow summary generation
- `quickSummary.js` - Quick palace summaries
- `normalizeChart.js` - Standardizes chart data for analysis

### Entry Point (`src/index.js`)

Exports the `analyze(date, hour, topics?)` function that orchestrates all layers.

### Server (`server.js`)

HTTP server with endpoints:

- `GET /` - Main UI with Strategic Advisor, Kimon AI chatbox, and topic analysis
- `GET /api/analyze?date=YYYY-MM-DD&hour=HH&minute=MM` - JSON API for chart data
- `POST /api/kimon` - Kimon AI strategic advisor (Gemini-powered, requires GEMINI_API_KEY)

### Kimon AI Integration

Kimon AI is the main interactive feature on the homepage:

- Uses Gemini API with QMDJ knowledge (Bát Môn, Bát Thần, Cửu Tinh)
- Receives chart context (Môn, Thần, Tinh, Score, etc.) and user question
- Returns strategic advice in JSON format: `{ chienLuoc: {...}, tamLy: {...} }`
- Knowledge base defined in system prompt includes element meanings from `quickSummary.js`

### Deployment

Vercel serverless deployment via `api/index.js` with rewrites in `vercel.json`.

## Key Concepts (QMDJ Terminology)

- **Cục (Ju)** - Escape number (1-9) derived from solar term
- **Dương/Âm Độn** - Yang/Yin polarity affecting rotation direction
- **Trực Phù** - Lead Star/Deity that follows hour stem
- **Trực Sử** - Lead Door
- **Tuần Thủ** - Lead Stem (Giáp hides under Mậu/Kỷ/Canh/Tân/Nhâm/Quý based on Xun)
- **Không Vong** - Void branches calculated from Hour Pillar
- **Phục Âm** - Fu Yin (Lead star doesn't move)
- **Phản Ngâm** - Fan Yin (Stars in opposite positions)

## Test Case Format

Tests use snapshot assertions against reference charts. Each test file defines:

- DATE and HOUR constants
- Direction-based slot checking with `slotSnapshot()`
- Assertions for door, star, deity, stems per palace

## QMDJ Knowledge Base (`knowledge/`)

A comprehensive knowledge base extracted from **Joey Yap QMDJ Compendium** and **KMĐG (Đàm Liên)**. Consult these files for interpretation rules and meanings:

- `00-qmdj-chart-structure.md` - Chart layers, 9 Palaces, Tam Kỳ Lục Nghi
- `01-bat-mon-8-doors.md` - 8 Doors meanings, Door-Palace interactions
- `02-cuu-tinh-9-stars.md` - 9 Stars meanings, seasonal strength rules
- `03-bat-than-8-deities.md` - 8 Deities meanings, spiritual influence
- `04-cach-cuc-formations.md` - Stem formations (auspicious/inauspicious), Fu/Fan Yin
- `05-interpretation-rules.md` - Master rules: Dung Than, palace analysis, topic readings
- `06-thap-thien-can-10-stems.md` - 10 Stems roles, Five Elements interactions
