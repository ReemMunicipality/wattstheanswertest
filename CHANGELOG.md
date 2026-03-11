# Watt's The Answer - Development Changelog

## Game Overview
**Watt's The Answer** (formerly "Mission Clean Energy") is an educational trivia game about sustainability and renewable energy where players answer questions to climb a prize ladder and earn Points.

---

## ORIGINAL FEATURES (Pre-existing)

### Core Gameplay
- 15-question format with game over on wrong answer
- Money ladder with prize levels
- 30-second timer per question
- Question categories: EASY, MEDIUM, HARD, EXTREME
- Firebase leaderboard integration
- Certificate generation for winners

### Lifelines (Original)
- 50/50 Elimination (removed 2 wrong answers)
- Audience Insight (simulated audience voting)
- Phone a Friend (30-second countdown)

### UI/UX
- Start screen with game options
- Leaderboard display
- Help/More Info modal
- Result modal after each answer
- Certificate modal at game end

---

## BUG FIXES

### Critical Bugs Fixed
1. **50/50 Lifeline Crash** - Was hardcoded to remove 2 options, crashed on True/False questions
2. **Audience Insight Broken** - Hardcoded 4-option percentages failed on 2-option questions
3. **Duplicate Questions** - Removed 3 duplicate questions from HARD/EXTREME pools
4. **Checkpoint Visual Bug** - Checkpoint styling was applied to wrong levels

### Security Fixes
1. **Input Sanitization** - Added sanitization for player name input to prevent XSS

### Code Quality Fixes
1. **Sound Playback Promises** - Added proper error handling for audio playback
2. **Dead Code Removal** - Removed unused variables and commented code
3. **Inline JavaScript** - Moved inline JS from HTML to script.js

---

## IMPROVEMENTS

### Accessibility (WCAG Compliance)
- Added ARIA labels throughout the game
- Added keyboard navigation (A/B/C/D or 1/2/3/4 keys for answers)
- Added focus styles for keyboard navigation
- Added screen reader support with role attributes
- Added `.visually-hidden` class for screen reader text

### Sound System
- Added sound toggle button (Sound: ON/OFF)
- Created `playSound()` helper function with error handling
- Sound preference persists during gameplay

### Question System
- Added Excel/CSV question loading from `questions.csv`
- Added SheetJS library for spreadsheet parsing
- Fallback to default questions if file load fails
- Added "Batch" column to distinguish question sources

---

## NEW FEATURES

### Game Logic Overhaul
1. **20-Question Format** - Players answer all 20 questions regardless of right/wrong
2. **Level-Based Difficulty** - Question difficulty based on current prize level:
   - Levels 0-7: EASY questions
   - Levels 8-14: MEDIUM questions
   - Levels 15-20: HARD questions
3. **No Penalty for Wrong Answers** - Wrong answers keep player at same level (no falling)
4. **5-Game Question Cooldown** - Questions won't repeat for 5 games (localStorage)
5. **Difficulty Pool Consolidation** - EXTREME merged into HARD

### New Prize Ladder (21 levels)
| Level | Prize | Zone |
|-------|-------|------|
| 0 | 0 Points | EASY |
| 1 | 100 Points | EASY |
| 2 | 200 Points | EASY |
| 3 | 500 Points | EASY |
| 4 | 1,000 Points | EASY |
| 5 | 2,000 Points | EASY |
| 6 | 4,000 Points | EASY |
| 7 | 6,000 Points | EASY |
| 8 | 8,000 Points (Milestone) | MEDIUM |
| 9 | 10,000 Points | MEDIUM |
| 10 | 15,000 Points | MEDIUM |
| 11 | 25,000 Points | MEDIUM |
| 12 | 50,000 Points | MEDIUM |
| 13 | 75,000 Points | MEDIUM |
| 14 | 100,000 Points | MEDIUM |
| 15 | 150,000 Points (Milestone) | HARD |
| 16 | 250,000 Points | HARD |
| 17 | 500,000 Points | HARD |
| 18 | 750,000 Points | HARD |
| 19 | 900,000 Points | HARD |
| 20 | 1,000,000 Points | HARD |

### New Lifelines
1. **Elimination** - Removes 1 wrong answer (changed from 2)
2. **Add Time** - Adds 30 extra seconds to timer
3. **Skip Question** - Skips current question (consumes 1 of 20, no penalty)

### Visual Enhancements
1. **Color-Coded Money Ladder**
   - Green border/background for EASY zone (levels 0-7)
   - Orange border/background for MEDIUM zone (levels 8-14)
   - Red border/background for HARD zone (levels 15-20)

2. **Difficulty Level Indicator**
   - Green badge for EASY
   - Orange badge for MEDIUM
   - Red pulsing badge for HARD
   - Icons: ⭐ EASY, ⭐⭐ MEDIUM, ⭐⭐⭐ HARD

3. **Dynamic Background**
   - Subtle green gradient for EASY
   - Orange gradient for MEDIUM
   - Red gradient for HARD

4. **Progress Bar**
   - Shows "Question X / 20"
   - Color changes with difficulty zone
   - Smooth animation

5. **Zone Transition Animations**
   - Pop-up notification when entering new difficulty zone
   - Shows "EASY MODE", "MEDIUM MODE", or "HARD MODE"
   - Celebration animation effect

### Branding Changes
- Game renamed from "Watt's the Answer?" to "Watt's The Answer"
- Currency renamed from "RC" to "Points"
- Updated all certificates and help text

---

## REMOVED FEATURES

1. **Audience Insight Lifeline** - Replaced with "Add Time"
2. **Phone a Friend Lifeline** - Replaced with "Skip Question"
3. **Playing Alone/With Audience Toggle** - Removed (was non-functional)
4. **Game Over on Wrong Answer** - Now continues through all 20 questions
5. **Prize Level Drop on Wrong Answer** - Now stays at same level

---

## FILE STRUCTURE

```
Watt's The Answer/
├── index.html          # Main game HTML
├── style.css           # All styling (1100+ lines)
├── script.js           # Game logic (1600+ lines)
├── questions.csv       # Question bank with Batch column
├── certificate.html    # Standard certificate template
├── certificate_winner.html  # Winner certificate template
├── development_report.tex   # LaTeX documentation
├── CHANGELOG.md        # This file
└── assets/
    ├── correct.mp3     # Correct answer sound
    ├── wrong.mp3       # Wrong answer sound
    ├── click.mp3       # Button click sound
    └── logo.png        # Favicon
```

---

## QUESTION BANK

| Batch | Source | Questions |
|-------|--------|-----------|
| Original | Default in script.js | 77 |
| Batch 1 | batch 1.docx | 101 |
| Batch 2 | batch 2.docx | 24 |
| **Total** | | **202** |

**Note:** Correct answers in Batch 1 & 2 are placeholders and need manual verification.

---

## TECHNICAL DETAILS

### Dependencies
- SheetJS (xlsx.full.min.js) - For CSV/Excel parsing
- Firebase - For leaderboard storage
- Google Fonts (Poppins) - Typography
- html2canvas - For certificate generation

### Browser Requirements
- Modern browser with ES6 module support
- LocalStorage for question cooldown system
- Audio playback support

### Running the Game
Requires a local web server due to ES6 modules and fetch API:
```bash
cd "Watt's The Answer"
python3 -m http.server 8000
# Open http://localhost:8000
```

---

## CONTRIBUTORS
- Adam Ghafur
- Anas Msimir
- Hoor Khleifat
- Syed Arhaan Ahmed

---

*Last Updated: January 2026*
