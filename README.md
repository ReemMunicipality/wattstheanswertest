# Mission Clean Energy

An educational web-based trivia game about sustainability and renewable energy, developed for REEM (Ras Al Khaimah Municipality).

## About the Game

Players answer 20 questions to climb a prize ladder and earn virtual "Reem Coins." The game features:

- **21-level prize ladder** (0 to 1,000,000 Reem Coins)
- **3 difficulty zones:** Easy, Medium, Hard
- **3 lifelines:** Elimination, Add Time (+30s), Skip Question
- **30-second timer** per question
- **Supabase leaderboard** (top 15 scores)
- **Certificate generation** at game end
- **5-game question cooldown** to prevent repetition

## Project Structure

```
MissionCleanEnergy/
├── index.html              # Main game page
├── script.js               # Game logic and Firebase integration
├── style.css               # All styling
├── questions.csv           # Question database (edit this to add/remove questions)
├── certificate.html        # Standard certificate template
├── certificate_winner.html # Grand prize winner certificate
├── CHANGELOG.md            # Development history
├── README.md               # This file
└── assets/
    ├── correct.mp3         # Sound effects
    ├── wrong.mp3
    ├── click.mp3
    ├── reem-logo.png       # Logos
    └── rak-logo.png
```

## Changes Made

### Bug Fixes

1. **Fixed empty answer boxes for True/False questions**
   - Questions with only 2 options (True/False) were displaying extra empty boxes
   - Updated `script.js` to properly trim and filter empty option values from the CSV
   - Now questions display the correct number of answer options (2 for True/False, 4 for multiple choice)

### Technical Details

- **Frontend:** HTML5, CSS3, JavaScript (ES6+)
- **Backend:** Supabase (PostgreSQL database for leaderboard)
- **Question Source:** `questions.csv` file (202 questions)
- **Libraries:** SheetJS (for CSV parsing), Supabase JS Client, Google Fonts

---

## How to Update Questions

### Step 1: Edit the CSV File

1. Open `questions.csv` in Microsoft Excel or any spreadsheet software
2. The CSV has the following columns:

| Column | Description | Example |
|--------|-------------|---------|
| Difficulty | EASY, MEDIUM, or HARD | EASY |
| Question | The question text | What does PV stand for? |
| Option A | First answer option | Present Value |
| Option B | Second answer option | Photovoltaic |
| Option C | Third answer option (leave empty for True/False) | Power Voltage |
| Option D | Fourth answer option (leave empty for True/False) | Panel Voltage |
| Correct Answer | A, B, C, or D | B |
| Fun Fact | Shown after answering | The photovoltaic effect... |
| Batch | Optional grouping | Batch 1 |

3. **To add a question:** Add a new row at the bottom
4. **To remove a question:** Delete the entire row
5. **To edit a question:** Modify the cells directly
6. **For True/False questions:** Leave Option C and Option D empty

### Step 2: Save the File

- Save as CSV (not Excel format)
- Keep the filename as `questions.csv`

### Step 3: Push Changes to GitHub

Open a terminal (Command Prompt, PowerShell, or WSL) and navigate to the project folder:

```bash
cd "path/to/MissionCleanEnergy"
```

#### First Time Setup (Authentication)

If you haven't logged in to GitHub before, authenticate using GitHub CLI:

```bash
gh auth login
```

Follow the prompts:
1. Select `GitHub.com`
2. Select `HTTPS`
3. Select `Login with a web browser`
4. Copy the code shown and press Enter
5. A browser window will open - paste the code and authorize

#### Push Your Changes

After editing the CSV, run these commands:

```bash
# Check what files changed
git status

# Add all changes
git add .

# Commit with a message describing what you changed
git commit -m "Added new questions"

# Push to GitHub
git push
```

### Step 4: Automatic Deployment

Once you push to GitHub:
- **Vercel automatically detects the changes**
- **Deploys the updated version within 1-2 minutes**
- **No manual deployment needed**

You can check the deployment status at your Vercel dashboard.

---

## How to Run Locally

Since the game uses ES6 modules, you need a local web server:

### Option 1: Python

```bash
cd MissionCleanEnergy
python -m http.server 8000
```

Then open http://localhost:8000 in your browser.

### Option 2: Node.js

```bash
npx serve
```

### Option 3: VS Code

1. Install the "Live Server" extension
2. Right-click `index.html` → "Open with Live Server"

---

## Storage

| Data | Storage Location | Notes |
|------|------------------|-------|
| Questions | `questions.csv` (local file) | Edit to add/remove questions |
| Leaderboard | Supabase (PostgreSQL) | Shared across all users |
| Question cooldowns | Browser localStorage | Prevents question repeats for 5 games |

### Supabase Configuration

The leaderboard is stored in Supabase. The configuration is in `script.js`:

```javascript
const SUPABASE_URL = 'https://foovsizagoilfwoocoxo.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
```

To access the Supabase dashboard: https://supabase.com/dashboard/project/foovsizagoilfwoocoxo

---

## Deployment

The game is deployed on Vercel and automatically updates when changes are pushed to GitHub.

**Repository:** https://github.com/ReemMunicipality/MissionCleanEnergy

---

## Credits

### Original Development Team
- Adam Ghafur
- Anas Msimir
- Hoor Khleifat
- Syed Arhaan Ahmed

### Technical Updates & Documentation
**Anas Msimir** - Bug fixes, code improvements, and documentation

---

## Support

For questions or issues, contact the REEM team at RAK Municipality.
