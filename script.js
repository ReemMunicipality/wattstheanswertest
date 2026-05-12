// Supabase SDK
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Supabase configuration
const SUPABASE_URL = 'https://foovsizagoilfwoocoxo.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZvb3ZzaXphZ29pbGZ3b29jb3hvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1MDA0ODMsImV4cCI6MjA4NTA3NjQ4M30.TqMejiVHrLYvock70HYxpo0lA5T84MgVxK5PCeQsoaY';

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- Background video controller (intro / loop / outro from a single file) ---
const videoController = (() => {
    const OUTRO_RATE = 30; // reverse playback framerate
    const OUTRO_STEP = 1 / OUTRO_RATE;
    let mode = 'intro'; // 'intro' | 'static' | 'outro' | 'idle'
    let outroRAF = null;
    let lastOutroTick = 0;
    let videoEl = null;

    function getVideo() {
        if (!videoEl) videoEl = document.getElementById('bgVideo');
        return videoEl;
    }

    function onTimeUpdate() {
        const v = getVideo();
        if (!v) return;
        if (mode === 'intro' && v.currentTime >= v.duration - 0.05) {
            // Intro finished → hold the final frame as a static backdrop
            mode = 'static';
            v.currentTime = v.duration - 0.05;
            v.pause();
        }
    }

    function outroStep(ts) {
        const v = getVideo();
        if (!v) return;
        if (!lastOutroTick) lastOutroTick = ts;
        const dt = (ts - lastOutroTick) / 1000;
        if (dt >= OUTRO_STEP) {
            v.currentTime = Math.max(0, v.currentTime - OUTRO_STEP);
            lastOutroTick = ts;
            if (v.currentTime <= 0.01) {
                mode = 'idle';
                v.pause();
                return;
            }
        }
        outroRAF = requestAnimationFrame(outroStep);
    }

    function playIntroThenLoop() {
        const v = getVideo();
        if (!v) return;
        if (outroRAF) cancelAnimationFrame(outroRAF);
        outroRAF = null;
        lastOutroTick = 0;
        mode = 'intro';
        v.currentTime = 0;
        v.play().catch(() => {});
    }

    function playOutro() {
        const v = getVideo();
        if (!v) return;
        mode = 'outro';
        v.pause();
        // Start from the final frame and reverse to 0
        v.currentTime = v.duration - 0.05;
        lastOutroTick = 0;
        if (outroRAF) cancelAnimationFrame(outroRAF);
        outroRAF = requestAnimationFrame(outroStep);
    }

    function pauseForGameplay() {
        const v = getVideo();
        if (!v) return;
        if (outroRAF) cancelAnimationFrame(outroRAF);
        outroRAF = null;
        mode = 'static';
        const snapToEnd = () => {
            v.currentTime = Math.max(0, v.duration - 0.05);
            v.pause();
        };
        if (isFinite(v.duration) && v.duration > 0) {
            snapToEnd();
        } else {
            v.addEventListener('loadedmetadata', snapToEnd, { once: true });
        }
    }

    // Bind timeupdate once DOM is ready
    document.addEventListener('DOMContentLoaded', () => {
        const v = getVideo();
        if (!v) return;
        v.addEventListener('timeupdate', onTimeUpdate);
        // Kick off intro explicitly (autoplay already does this, but ensures state)
        v.play().catch(() => {});
    });

    return { playIntroThenLoop, playOutro, pauseForGameplay };
})();

// --- Utility Functions ---

// Sanitize user input to prevent XSS attacks
function sanitizeInput(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// Safe sound playback (handles browser autoplay restrictions)
function playSound(audioElement) {
    if (audioElement && !isMuted) {
        audioElement.play().catch(e => {
            // Silently handle autoplay restrictions
            console.log('Audio playback was prevented:', e.message);
        });
    }
}

// Sound mute state
let isMuted = false;

// Question Bank - will be loaded from Excel/CSV, with fallback to defaults
let questionBank = {
    EASY: [],
    MEDIUM: [],
    HARD: [],
    EXTREME: []
};

// Flag to track if questions are loaded
let questionsLoaded = false;

// Function to load questions from Excel or CSV file
async function loadQuestionsFromFile() {
    const files = ['questions.xlsx', 'questions.csv'];

    for (const filename of files) {
        try {
            const response = await fetch(filename);
            if (!response.ok) continue;

            const data = await response.arrayBuffer();
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { raw: false });

            // Reset question bank
            questionBank = {
                EASY: [],
                MEDIUM: [],
                HARD: [],
                EXTREME: []
            };

            // Parse each row into question format
            jsonData.forEach(row => {
                const difficulty = (row['Difficulty'] || '').toUpperCase().trim();
                if (!questionBank[difficulty]) return; // Skip invalid difficulties

                // Build options array, filtering out empty options for True/False
                // Use ?? to handle null/undefined while preserving 0 as valid answer
                const options = [];
                const optA = (row['Option A'] ?? '').toString().trim();
                const optB = (row['Option B'] ?? '').toString().trim();
                const optC = (row['Option C'] ?? '').toString().trim();
                const optD = (row['Option D'] ?? '').toString().trim();

                if (optA !== '') options.push(optA);
                if (optB !== '') options.push(optB);
                if (optC !== '') options.push(optC);
                if (optD !== '') options.push(optD);

                // Parse correct answer - handle both letter (A,B,C,D) and number (0,1,2,3) formats
                let correctAnswer = row['Correct Answer'] || '0';
                if (typeof correctAnswer === 'string') {
                    correctAnswer = correctAnswer.trim().toUpperCase();
                    if (correctAnswer === 'A') correctAnswer = 0;
                    else if (correctAnswer === 'B') correctAnswer = 1;
                    else if (correctAnswer === 'C') correctAnswer = 2;
                    else if (correctAnswer === 'D') correctAnswer = 3;
                    else correctAnswer = parseInt(correctAnswer) || 0;
                }

                const question = {
                    question: row['Question'] || '',
                    options: options,
                    correct: correctAnswer,
                    fact: row['Fun Fact'] || ''
                };

                // Only add valid questions
                if (question.question && options.length >= 2) {
                    questionBank[difficulty].push(question);
                }
            });

            // Check if we loaded any questions
            const totalQuestions = Object.values(questionBank).reduce((sum, arr) => sum + arr.length, 0);
            if (totalQuestions > 0) {
                console.log(`Successfully loaded ${totalQuestions} questions from ${filename}`);
                questionsLoaded = true;
                return true;
            }
        } catch (error) {
            console.log(`Could not load ${filename}:`, error.message);
        }
    }

    // If we get here, fall back to default questions
    console.log('Loading default questions...');
    questionBank = JSON.parse(JSON.stringify(defaultQuestionBank));
    questionsLoaded = true;
    return false;
}

// Default Question Bank (fallback if Excel/CSV fails to load)
const defaultQuestionBank = {
    EASY: [
        {
            question: "In which emirate is the Mohammed bin Rashid Al Maktoum Solar Park located?",
            options: ["Abu Dhabi", "Dubai", "Sharjah", "Ras Al Khaimah"],
            correct: 1,
            fact: "The Mohammed bin Rashid Al Maktoum Solar Park is a key part of Dubai's Clean Energy Strategy."
        },
        {
            question: "What type of renewable energy does the Three Gorges Dam produce?",
            options: ["Solar", "Wind", "Geothermal", "Hydropower"],
            correct: 3,
            fact: "Hydropower is one of the oldest and largest sources of renewable energy, which uses the natural flow of moving water to generate electricity."
        },
        {
            question: "Where is the Hatta dam located?",
            options: ["Fujairah", "Al Ain", "Oman", "Dubai"],
            correct: 3,
            fact: "The Hatta Dam is a popular tourist destination known for its stunning mountain scenery and recreational activities like kayaking."
        },
        {
            question: "What does PV stand for in solar panels?",
            options: ["Present Value", "Photovoltaic", "Power Voltage", "Panel Voltage"],
            correct: 1,
            fact: "The photovoltaic effect is the process of converting light (photons) into electricity (voltage)."
        },
        {
            question: "Which of these biomes is not a part of UAE?",
            options: ["Marine", "Savannah woodland", "Mangroves and coastal areas", "Deserts"],
            correct: 1,
            fact: "The UAE's natural biomes are primarily deserts, marine ecosystems, and coastal areas rich with mangroves."
        },
        {
            question: "What is the term for the fuel produced by living things?",
            options: ["Organic Fuel", "Live Fuel", "Biofuel", "Environmental fuel"],
            correct: 2,
            fact: "Biofuels can be derived from plants, algae, or animal waste, making them a renewable alternative to fossil fuels."
        },
        {
            question: "When was the Dubai Metro officially launched?",
            options: ["2005", "2009", "2012", "2015"],
            correct: 1,
            fact: "Since its opening, the Dubai Metro has expanded by 38 km and has added 43 new stations since it first launched in 2009."
        },
        {
            question: "The Gansu Wind Farm uses offshore wind turbines.",
            options: ["True", "False"],
            correct: 1,
            fact: "The Gansu Wind Farm (also known as Jiuquan Wind Power Base) is the world's largest *onshore* wind farm."
        },
        {
            question: "On which river is the Three Gorges Dam built?",
            options: ["Mekong River", "Yellow River", "Yangtze River", "Pearl River"],
            correct: 2,
            fact: "The Yangtze River is one of the most prominent rivers in China with a length of 6300 km."
        },
        {
            question: "What does the Ghaf tree symbolize in Emirati culture?",
            options: ["Wealth and prosperity", "Endurance, stability, and hospitality", "Unity and dependency", "Peace, honesty, and purity"],
            correct: 1,
            fact: "Due to its ability to survive in the harsh desert climate, the Ghaf tree is a powerful symbol of resilience."
        },
        {
            question: "What is the most common native plant species in the UAE?",
            options: ["Date Palm", "Acacia", "Ghaf Tree", "Neem Tree"],
            correct: 2,
            fact: "The Ghaf tree is the national plant of the UAE, not the palm tree."
        },
        {
            question: "What is the name of the nuclear power plant located in UAE?",
            options: ["Bushehr Nuclear Power Plant", "Akkuyu Nuclear Power Plant", "Barakah Nuclear power plant", "Cattenom Nuclear Power Plant"],
            correct: 2,
            fact: "The Barakah Nuclear Energy Plant is the only nuclear power plant present in the UAE."
        },
        {
            question: "What type of villa is featured at the Anantara Mina Al Arab Resort for the first time in the emirate?",
            options: ["Lagoon-facing garden villas", "Treehouse canopy villas", "Coral reef pod villas", "Overwater villas"],
            correct: 3,
            fact: "The Anantara resort in Ras Al Khaimah was the first resort to build overwater villas as part of its accommodation in the emirate."
        },
        {
            question: "What makes the Anantara Mina Al Arab Resort's location environmentally unique?",
            options: ["Built within an artificial island chain", "Located in a reclaimed coastal area", "Built on a private peninsula surrounded by mangroves", "Built along a coral reef barrier"],
            correct: 2,
            fact: "The resort's unique location among natural mangroves provides a special habitat for wildlife and a serene guest experience."
        },
        {
            question: "Which of the following material is considered ecofriendly for construction?",
            options: ["Plastic foam", "Recycled steel", "Marble", "PVC"],
            correct: 1,
            fact: "Using recycled steel reduces the energy and resources needed to produce new steel from raw materials."
        },
        {
            question: "Which of these are not a threat to Green Covered Land?",
            options: ["Deforestation", "Climate Change", "Urbanization", "Natural Reserves"],
            correct: 3,
            fact: "Natural Reserves are protected areas established to conserve ecosystems and biodiversity."
        },
        {
            question: "Which of the following is an example of a renewable fuel source?",
            options: ["Coal", "Oil", "Biodiesel", "Kerosene"],
            correct: 2,
            fact: "Biodiesel is a renewable fuel typically made from vegetable oils, animal fats, or recycled restaurant grease."
        },
        {
            question: "What were the names of the 3 pavilions in Expo 2020 Dubai?",
            options: ["Innovation, Culture, Sustainability", "Opportunity, Mobility, Sustainability", "Energy, Climate, Discovery", "Exploration, Transport, Equity"],
            correct: 1,
            fact: "Each pavilion at Expo 2020 Dubai was dedicated to a core theme of the event."
        },
        {
            question: "Why do offshore wind farms generally produce more energy than onshore wind farms?",
            options: ["They are cheaper to build", "Offshore turbines are less efficient than onshore", "Wind is stronger and more consistent at sea", "They require fewer turbines to operate"],
            correct: 2,
            fact: "Sea surfaces are smoother than land, leading to less wind obstruction and higher, more reliable wind speeds."
        },
        {
            question: "Which type of wind farm typically has larger turbines — onshore or offshore?",
            options: ["Onshore", "Offshore"],
            correct: 1,
            fact: "Offshore turbines can be larger as they are not constrained by road and bridge transport limitations faced by onshore components."
        },
        {
            question: "Which of the following devices would not be found in a sustainable building?",
            options: ["Smart thermostat", "Solar panels", "Filament bulbs", "Rainwater harvesting system"],
            correct: 2,
            fact: "Filament bulbs are highly inefficient, converting most of their energy into heat rather than light, unlike modern LEDs."
        },
        {
            question: "What type of energy is usually generated from incinerating waste in WTE plants?",
            options: ["Toxic", "Geothermal", "Thermal", "Solar"],
            correct: 2,
            fact: "Waste-to-Energy (WTE) plants burn trash at high temperatures to produce steam, which then drives a turbine to generate thermal energy."
        },
        {
            question: "What is a key challenge with recycling in the UAE?",
            options: ["Recycling bins are emptied daily by hand", "Recyclables are often mixed or contaminated", "The UAE only recycles metal waste", "There are too many types of recycling bins"],
            correct: 1,
            fact: "Contamination from food or non-recyclable items can ruin an entire batch of materials, making it unusable for recycling."
        },
        {
            question: "Which of the following systems is NOT typically controlled by a BMS?",
            options: ["HVAC", "Lighting and appliances", "Tenant Billing Systems", "Security systems"],
            correct: 2,
            fact: "While a BMS controls operational systems, tenant billing is a financial function handled by separate management software."
        },
        {
            question: "What is the primary goal of the UAE’s Waste-to-Energy (WTE) strategy?",
            options: ["Power only industrial zones using waste energy", "Eliminate the need for recycling programs", "Divert 75% of waste from landfills", "Replace all fossil fuel power plants with WTE facilities"],
            correct: 2,
            fact: "This is a key target of the UAE's National Agenda, aimed at improving sustainability and reducing environmental impact."
        },
        {
            question: "Which of the following reasons may be why people use the metro?",
            options: ["It's not connected to any other transport options", "Have a variety of destination and a complex metro network", "The stations are not always close to where people live or work", "None of the above"],
            correct: 1,
            fact: "The Dubai Metro's extensive network connects key business, residential, and tourist areas across the city."
        }
    ],
    MEDIUM: [
        {
            question: "The Xinjiang Midong Solar Park in China currently generates more electricity annually than the Mohammed bin Rashid Al Maktoum Solar Park.",
            options: ["True", "False"],
            correct: 0,
            fact: "The Xinjiang Solar Park Produces almost 117% more electricity than Mohammed bin Rashid Solar Park."
        },
        {
            question: "Which of the following combines both Photovoltaic (PV) and Concentrated Solar Power (CSP)?",
            options: ["Xinjiang Midong Solar Park", "Ivanpah Solar Power Facility", "Mohammed bin Rashid Al Maktoum Solar Park", "Tengger Desert Solar Park"],
            correct: 2,
            fact: "The MBR Solar Park hosts both PV panels and the world's tallest solar power tower for its CSP operations."
        },
        {
            question: "Does Jiuquan Wind Power Base have MORE or LESS than 2000 wind turbines?",
            options: ["More", "Less"],
            correct: 0,
            fact: "The Jiuquan Wind Power Base, also known as Gansu Wind Farm, has over 7,000 turbines installed."
        },
        {
            question: "How tall are the turbines at the Dogger Bank Wind Farm?",
            options: ["200 meters", "260 meters", "150 meters", "320 meters"],
            correct: 1,
            fact: "At 260 meters, the turbines in the Dogger Bank wind farm are approximately the height of 3 Statues of Liberty."
        },
        {
            question: "In which country is the tallest dam located?",
            options: ["Canada", "USA", "China", "Iceland"],
            correct: 2,
            fact: "The Jinping-I Dam in China has a height of almost 305 m."
        },
        {
            question: "Which country uses the most renewable energy in the world?",
            options: ["Brazil", "France", "Iceland", "Norway"],
            correct: 2,
            fact: "In 2016, about 85% of Iceland's total energy produced came from renewable sources such as hydropower and geothermal."
        },
        {
            question: "Which country has the largest total forest area in the world?",
            options: ["Brazil", "Canada", "Russia", "Indonesia"],
            correct: 2,
            fact: "Although Suriname has the largest PERCENTAGE of land covered by forests, Russia has the most AREA covered by forests with an area of 8.15 million km²."
        },
        {
            question: "Which of the following is NOT a reason for high transportation emissions in the UAE?",
            options: ["Car-dependent lifestyle", "Extreme heat causing more A/C use", "High usage of electric vehicles", "Heavy freight movement by trucks"],
            correct: 2,
            fact: "High usage of electric vehicles would decrease transportation emissions, not increase them."
        },
        {
            question: "Which of the following is the first 3D printed lab in Dubai?",
            options: ["Dubai Future Labs", "DEWA Robotics Lab", "Mohammed Bin Rashid Space Centre Lab", "Future Food Lab"],
            correct: 1,
            fact: "The UAE also holds the title for the world's first 3D printed lab, located in the Mohammed bin Rashid Al Maktoum Solar Park."
        },
        {
            question: "Which country has the highest percentage of waste being incinerated?",
            options: ["China", "Sweden", "Japan", "Denmark"],
            correct: 2,
            fact: "Approximately 80% of Japan's treated waste is burned in waste-to-energy facilities."
        },
        {
            question: "What is UAE’s largest landfill site in terms of area?",
            options: ["Al Qusais landfill (Dubai)", "Al Dhafra landfill (Abu Dhabi)", "Al jazirah landfill (Ras Al Khaimah)", "Jebel Ali landfill (Dubai)"],
            correct: 1,
            fact: "The Al Dhafra landfill is one of the biggest engineered landfills in the world."
        },
        {
            question: "What LEED certification did the Anantara Mina Al Arab Resort achieve?",
            options: ["LEED Platinum", "LEED Gold", "LEED Silver", "Green Globe Certified"],
            correct: 1,
            fact: "LEED Gold is a high level of certification, indicating significant achievements in sustainable building design and operation."
        },
        {
            question: "How many rooms, suites, and pool villas are part of the Anantara Mina Al Arab Resort?",
            options: ["132", "157", "174", "203"],
            correct: 2,
            fact: "The resort offers a variety of luxury accommodations, including the emirate's first overwater villas."
        },
        {
            question: "Where is the largest onshore wind farm in the world located?",
            options: ["Germany", "United States", "India", "China"],
            correct: 3,
            fact: "The Jiuquan Wind Power Base in China covers an area of 39,000 km², which is almost the size of the entire country of Belgium."
        },
        {
            question: "Which renewable energy source has the highest average capacity factor (runs most consistently)?",
            options: ["Wind", "Solar", "Geothermal", "Hydroelectric"],
            correct: 2,
            fact: "Geothermal power plants can run consistently, day and night, making them a very reliable source of baseline energy."
        },
        {
            question: "Which of the following biomes has the highest biodiversity?",
            options: ["Taiga", "Temperate Forest", "Tropical Rainforest", "Savanna"],
            correct: 2,
            fact: "Tropical rainforests cover only a small part of the Earth but are home to more than half of the world's plant and animal species."
        },
        {
            question: "What percentage of Earth’s land is covered by forests?",
            options: ["31%", "28%", "35%", "45%"],
            correct: 0,
            fact: "According to the Food and Agriculture Organization (FAO), forests cover nearly one-third of the Earth's land surface."
        },
        {
            question: "Which country is considered the most sustainable in terms of transport?",
            options: ["Netherlands", "Denmark", "Germany", "France"],
            correct: 0,
            fact: "The Netherlands has almost 35,000 km of dedicated cycle paths separate from roads, and 100% of its national trains run on electricity."
        },
        {
            question: "Does the UAE have MORE or LESS than 300 km cycle lanes?",
            options: ["More", "Less"],
            correct: 0,
            fact: "The UAE has over 500 Km of cycling lanes, almost twice the distance from Ras Al Khaimah to Abu Dhabi."
        },
        {
            question: "Who are the two main partners in the Hafeet Rail joint venture?",
            options: ["Dubai Metro and Muscat Rail", "Oman Rail and Etihad Rail", "Abu Dhabi Ports and Omani Airlines", "RTA and Salalah Port Authority"],
            correct: 1,
            fact: "This collaboration between the national rail companies of Oman and the UAE is a major step in connecting the GCC by rail."
        },
        {
            question: "Which country was the first in the world to construct a building using 3D printing technology?",
            options: ["China", "Japan", "UAE", "USA"],
            correct: 2,
            fact: "The UAE holds the Guinness world record for the world’s first 3D printed commercial building which was named the Office of the future."
        },
        {
            question: "In which year did the Anantara Mina Al Arab Resort receive its LEED Gold certification?",
            options: ["2022", "2023", "2024", "2025"],
            correct: 1,
            fact: "The resort achieved this certification shortly after its opening, highlighting its commitment to sustainability from the start."
        },
        {
            question: "The Mohammed bin Rashid Al Maktoum Solar Park only uses photovoltaic solar panels.",
            options: ["True", "False"],
            correct: 1,
            fact: "The park is unique because it combines both photovoltaic (PV) and concentrated solar power (CSP) technologies."
        },
        {
            question: "Why does Sweden import waste from other countries?",
            options: ["To reduce plastic use", "To increase landfill storage", "To generate energy in WTE plants", "To recycle and export plastic"],
            correct: 2,
            fact: "Sweden sometimes does not produce enough domestic waste to meet the energy demands of its advanced waste-to-energy (WTE) plants."
        },
        {
            question: "Which of the following is the green building rating system used in Ras Al Khaimah?",
            options: ["LEED", "Estidama", "Al Sa’fat", "Barjeel"],
            correct: 3,
            fact: "Barjeel is specifically designed to suit the climate and building environment of Ras Al Khaimah."
        }
    ],
    HARD: [
        {
            question: "By what year was the Xinjiang Midong solar park operational?",
            options: ["2008", "2015", "2012", "2024"],
            correct: 2,
            fact: "The Ürümqi Solar Farm, a significant part of the Xinjiang park project, was constructed in 2012."
        },
        {
            question: "What is the planned capacity of the Mohammed bin Rashid Al Maktoum Solar Park by 2030?",
            options: ["3.5 GW", "4.5 GW", "5 GW", "6.5 GW"],
            correct: 2,
            fact: "This planned capacity can power up to 1.6 million homes."
        },
        {
            question: "How far off is Dogger Bank Wind Farm from land?",
            options: ["250 km", "300 km", "130 km", "40 km"],
            correct: 2,
            fact: "This distance is almost the equivalent of 3 full marathons."
        },
        {
            question: "The Three gorges dam has approximately 30 billion cubic meters of water.",
            options: ["True", "False"],
            correct: 1,
            fact: "The Three Gorges Dam holds approximately 39.3 billion cubic meters of water, and its immense mass has been reported to slow the Earth's rotation."
        },
        {
            question: "What makes Iceland ideal for hydroelectric energy production?",
            options: ["Low elevation and calm rivers", "High winds and long summers", "Glacial rivers and high precipitation", "Rich deposits of fossil fuels"],
            correct: 2,
            fact: "Iceland's unique terrain of volcanoes, hot springs, glaciers and mountains makes it perfect for renewable energy production."
        },
        {
            question: "What is one major difference between Photovoltaic (PV) and Concentrated Solar Power (CSP)?",
            options: ["PV requires turbines, CSP does not", "CSP converts sunlight directly into electricity", "PV uses solar panels, while CSP uses mirrors to concentrate sunlight", "Both PV and CSP use only batteries for storage"],
            correct: 2,
            fact: "PV panels create electricity directly from sunlight, while CSP systems use heat from concentrated sunlight to create steam and turn turbines."
        },
        {
            question: "Does Suriname have MORE or LESS than 100,000 square kilometers or green cover?",
            options: ["More", "Less"],
            correct: 0,
            fact: "As of 2022, Suriname had approximately 152,000 square kilometers of forest cover, more than twice the total land area of the UAE."
        },
        {
            question: "Which of the following is NOT a reason why green cover is important?",
            options: ["It absorbs carbon dioxide and helps fight climate change", "It increases soil erosion and water loss", "It provides habitats for wildlife and supports biodiversity", "It helps regulate temperature and improve air quality"],
            correct: 1,
            fact: "Green cover, particularly forests, helps *prevent* soil erosion by holding soil in place with its roots."
        },
        {
            question: "What percentage of the UAE’s land area is currently forested (natural or planted)?",
            options: ["3.8-4.5%", "2.4-3.2%", "6-7%", "5.3-6.4%"],
            correct: 0,
            fact: "This includes both natural mangroves and large-scale afforestation projects, like the planting of Ghaf and Date Palm trees."
        },
        {
            question: "What does the Hafeet Rail project connect?",
            options: ["Dubai to Abu Dhabi", "Sohar Port in Oman to Al Ain in the UAE", "Muscat to Ras Al Khaimah", "Sharjah to Salalah"],
            correct: 1,
            fact: "The Hafeet Rail is named after the iconic Jebel Hafeet mountain in Al Ain, through which the rail line also passes."
        },
        {
            question: "What is the expected passenger train speed on Hafeet Rail?",
            options: ["80 km/h", "100 km/h", "150 km/h", "200 km/h"],
            correct: 3,
            fact: "Traveling from Abu Dhabi (UAE) to Sohar (Oman) via the Hafeet Rail will take just 1 hour and 40 minutes."
        },
        {
            question: "What is the highest tier for LEED building standards?",
            options: ["LEED Gold", "LEED Platinum", "LEED Titanium", "LEED Diamond"],
            correct: 1,
            fact: "LEED Platinum is the highest level of certification, recognizing world-class leadership in sustainable building."
        },
        {
            question: "Which country produces the most cement?",
            options: ["China", "USA", "India", "Vietnam"],
            correct: 0,
            fact: "China produced 2.1 billion tons of cement in 2023. With that amount, you could build roughly 35,000 Empire State Buildings."
        },
        {
            question: "Which of the following is NOT a key benefit of 3D printed construction in the UAE?",
            options: ["Faster printing times", "Job displacement", "Reduced material waste", "Lower building costs"],
            correct: 1,
            fact: "While a potential consequence, job displacement is not considered a benefit of 3D printing; the benefits are speed, efficiency, and reduced waste."
        },
        {
            question: "Which country has the highest volume of waste being incinerated?",
            options: ["Japan", "China", "USA", "Denmark"],
            correct: 1,
            fact: "Due to its large population and advanced waste management infrastructure, China incinerates the highest total volume of waste globally."
        },
        {
            question: "What country dumps the most waste into landfills by percentage?",
            options: ["USA", "Israel", "United Kingdom", "Germany"],
            correct: 1,
            fact: "Israel relies heavily on landfills, making it one of the countries with the highest percentage of waste disposed of in this manner."
        },
        {
            question: "Which type of waste contributes the most to UAE landfill volume?",
            options: ["Medical waste", "Agricultural waste", "Construction and demolition waste", "Plastic bottles"],
            correct: 2,
            fact: "Rapid development and a booming construction sector mean that construction and demolition materials are a major component of waste in the UAE."
        },
        {
            question: "What aspect of the Anantara Mina Al Arab Resort helps reduce the urban heat island effect?",
            options: ["Use of light-colored pavement and green roofing", "Planting palm trees indoors", "Air-conditioned outdoor walkways", "Reflective mirrors placed on rooftops"],
            correct: 0,
            fact: "Light-colored surfaces reflect more sunlight and absorb less heat, while green roofs provide insulation and evaporative cooling."
        },
        {
            question: "How long did it take to print the world’s first 3D printed building?",
            options: ["3 years", "15 months", "17 days", "8 months"],
            correct: 2,
            fact: "Dubai's 'Office of the Future' only took 17 days to print with a massive 3D printer that was 20 feet high, 120 feet long, and 40 feet wide."
        },
        {
            question: "Which country launched the largest 3D printed school project in the GCC in 2025?",
            options: ["Saudi Arabia", "Qatar", "UAE", "Kuwait"],
            correct: 1,
            fact: "Each of the two schools in Qatar will cover 20,000 square meters, 40 times larger than any 3D-printed structure previously built."
        },
        {
            question: "What is a key reason why Japan relies heavily on waste incineration?",
            options: ["Cheap landfill space", "Lack of recycling policies", "Limited land availability", "Exporting waste is banned"],
            correct: 2,
            fact: "As a densely populated and mountainous country, Japan has very limited space for creating new landfills."
        },
        {
            question: "Which solar power plant has the largest land area?",
            options: ["Noor Abu Dhabi", "Mohammed bin Rashid Al Maktoum Solar Park", "Xinjiang Midong Solar Park", "Kamuthi Solar Power Project"],
            correct: 2,
            fact: "The Xinjiang solar park has an area of approximately 30 Expo 2020 sites combined."
        },
        {
            question: "Which WTE project aims to make its city the first “zero-waste-to-landfill” in the Middle East?",
            options: ["Al Dhafra", "Ras Al Khaimah EcoWaste", "Sharjah Waste-to-Energy Plant", "Dubai Waste to Energy plant"],
            correct: 2,
            fact: "The Sharjah plant is a landmark project in the UAE's efforts to divert waste from landfills."
        },
        {
            question: "Which country has the highest percentage of green cover in the world?",
            options: ["Brazil", "Canada", "Suriname", "Russia"],
            correct: 2,
            fact: "As of 2022, Suriname had a forest cover of 94.5%."
        },
        {
            question: "Which country emits the most CO₂ from transportation?",
            options: ["China", "USA", "India", "Germany"],
            correct: 1,
            fact: "The US produces 1.8 billion metric tons of CO₂/year from transportation as of 2021, that’s around 30% of all U.S. carbon emissions."
        },
        {
            question: "What country uses WTE (Waste to energy) system the most?",
            options: ["Norway", "Sweden", "UAE", "Japan"],
            correct: 1,
            fact: "Sweden uses 50% of its household waste to convert it to electricity and district heating."
        }
    ],
    EXTREME: [
        {
            question: "Which of the following cost components is typically the most expensive in the development of offshore wind farms?",
            options: ["Material production", "Site Surveying", "Transportation costs", "Installation Costs"],
            correct: 3,
            fact: "The complex logistics and specialized equipment required for offshore installation make it the costliest phase."
        },
        {
            question: "How much did it cost to build the Three Gorges Dam?",
            options: ["$10-12 billion", "$20-24 billion", "$30–33 billion", "$50-55 billion"],
            correct: 2,
            fact: "This amount of money could also build up to 25-30 modern Football/Soccer Stadiums."
        },
        {
            question: "In 2023, what percentage of the UAE’s total energy mix came from clean energy sources?",
            options: ["15.5%", "23.1%", "27.83%", "40%"],
            correct: 2,
            fact: "In 2023, around 20% of the UAE's energy output was generated from nuclear sources and the rest from solar and wind."
        },
        {
            question: "What is the largest operating nuclear power plant in the world?",
            options: ["Kashiwazaki-Kariwa nuclear power plant", "Barakah nuclear power plant", "Kori nuclear power plant", "Chernobyl nuclear power plant"],
            correct: 2,
            fact: "The Kori nuclear power plant has a capacity of 7489 MW, enough energy to supply entire cities like New York and Los Angeles."
        },
        {
            question: "What percentage of the UAE’s total carbon emissions comes from the transportation sector?",
            options: ["Less than 10%", "Around 15%", "About 25%", "Over 40%"],
            correct: 1,
            fact: "As of recent data, the transportation sector accounts for approximately 15% of the UAE’s total carbon emissions."
        },
        {
            question: "What is the estimated financing secured for the Hafeet Rail project as of mid-2024?",
            options: ["$3 billion", "$1.5 billion", "$2.5 billion", "$5 billion"],
            correct: 0,
            fact: "This amount of money is roughly equal to the cost of the Mars rover (Perseverance)."
        },
        {
            question: "What's the maximum passenger capacity of a train on the Hafeet Rail?",
            options: ["200-270 passengers", "300-320 passengers", "350–400 passengers", "500-540 passengers"],
            correct: 2,
            fact: "The Hafeet Rail has almost the same passenger capacity as an Airbus A350."
        },
        {
            question: "Which building holds the world record for the highest LEED score?",
            options: ["Taipei 101 (Taiwan)", "Change Initiative (UAE)", "The Edge (Amsterdam)", "Bullitt Center (USA)"],
            correct: 1,
            fact: "The Change Initiative in Dubai holds the world record with a LEED score of 107/110 and is considered the most sustainable retail building in the world."
        },
        {
            question: "Which GCC country unveiled the region’s first 3D printed mosque in 2024?",
            options: ["Saudi Arabia", "UAE", "Qatar", "Bahrain"],
            correct: 0,
            fact: "The Abdulaziz Abdullah Sharbatly Mosque in Jeddah is not only the first 3D-printed mosque in the GCC but also the first of its kind in the world."
        },
        {
            question: "How much of a building’s energy consumption can be reduced by using a Building Management System (BMS)?",
            options: ["Up to 10%", "Up to 20%", "Up to 30%", "Up to 40%"],
            correct: 2,
            fact: "A BMS can reduce a building's energy consumption by up to 30% by optimizing systems like HVAC and lighting."
        },
        {
            question: "Which sector is the largest contributor to carbon emissions in the UAE?",
            options: ["Industry", "Transport", "Electricity & water production", "Agriculture"],
            correct: 2,
            fact: "The electricity and water production sector accounts for about 32% of the UAE’s total greenhouse gas emissions."
        },
        {
            question: "Which country dumps the most waste into landfills by total volume?",
            options: ["China", "United States", "Israel", "India"],
            correct: 1,
            fact: "The USA sends approximately 135 million tons of waste to landfills annually, about the same weight as 270 Burj Khalifas."
        },
        {
            question: "Besides Passenger stations, what other type of infrastructure is Hafeet Rail designed to serve?",
            options: ["Regional airports and heliports", "Technology parks and logistics colleges", "Major ports and integrated freight hubs", "National museums and cultural centers"],
            correct: 2,
            fact: "Hafeet Rail is designed to serve 12+ passenger stations, 5 major ports, and 15 integrated freight hubs."
        },
        {
            question: "Which of these incineration plants is not planned to be built in the UAE?",
            options: ["Sharjah Waste-to-Energy Plant", "Dubai Waste-to-Energy Plant", "Abu Dhabi (Al Dhafra) Waste-to-Energy Project", "Fujairah incineration plant"],
            correct: 3,
            fact: "Once all the planned plants are operational, the UAE will have a predicted amount of 3 million tons incinerated annually."
        },
        {
            question: "What is the UAE's goal for electric vehicles by 2050?",
            options: ["45%", "23%", "50%", "20%"],
            correct: 2,
            fact: "If this goal is achieved, the UAE could have a predicted amount of 3 to 3.5 million electric cars on the road."
        },
        {
            question: "What is the expected power generation from the Dubai Waste Management Centre (DWMC)?",
            options: ["100 MW", "150 MW", "200 MW", "250 MW"],
            correct: 2,
            fact: "200 megawatts is enough electricity to power around 135,000 homes, that’s like providing energy for an entire city the size of Ajman."
        },
        {
            question: "What is a major driver of the UAE's WTE investments?",
            options: ["Rising electricity prices", "Limited recycling facilities", "Environmental challenges from landfill use", "Urban heat islands"],
            correct: 2,
            fact: "Investing in Waste-to-Energy helps address the environmental challenges of limited landfill space and the need for sustainable waste management."
        }
    ]
};

const moneyLadder = [
    { amount: "0 Points", value: 0 },                    // Level 0 - Starting point
    { amount: "100 Points", value: 100 },                // Q1 - EASY
    { amount: "200 Points", value: 200 },                // Q2 - EASY
    { amount: "500 Points", value: 500 },                // Q3 - EASY
    { amount: "1,000 Points", value: 1000 },             // Q4 - EASY
    { amount: "2,000 Points", value: 2000 },             // Q5 - EASY
    { amount: "4,000 Points", value: 4000 },             // Q6 - EASY
    { amount: "6,000 Points", value: 6000 },             // Q7 - EASY
    { amount: "8,000 Points", value: 8000, checkpoint: true },  // Q8 - EASY (Checkpoint)
    { amount: "10,000 Points", value: 10000 },           // Q9 - MEDIUM
    { amount: "15,000 Points", value: 15000 },           // Q10 - MEDIUM
    { amount: "25,000 Points", value: 25000 },           // Q11 - MEDIUM
    { amount: "50,000 Points", value: 50000 },           // Q12 - MEDIUM
    { amount: "75,000 Points", value: 75000 },           // Q13 - MEDIUM
    { amount: "100,000 Points", value: 100000 },         // Q14 - MEDIUM
    { amount: "150,000 Points", value: 150000, checkpoint: true }, // Q15 - MEDIUM (Checkpoint)
    { amount: "250,000 Points", value: 250000 },         // Q16 - HARD
    { amount: "500,000 Points", value: 500000 },         // Q17 - HARD
    { amount: "750,000 Points", value: 750000 },         // Q18 - HARD
    { amount: "900,000 Points", value: 900000 },         // Q19 - HARD
    { amount: "1,000,000 Points", value: 1000000 }       // Q20 - HARD (Grand Prize)
];

// Determine difficulty based on current prize level (not question number)
// Levels 0-7: EASY, Levels 8-14: MEDIUM, Levels 15-20: HARD
function getDifficultyForLevel(level) {
    if (level <= 7) return 'EASY';
    if (level <= 14) return 'MEDIUM';
    return 'HARD';
}

// Get difficulty icon
function getDifficultyIcon(difficulty) {
    switch(difficulty) {
        case 'EASY': return '⭐';
        case 'MEDIUM': return '⭐⭐';
        case 'HARD': return '⭐⭐⭐';
        default: return '⭐';
    }
}

// Update progress bar
function updateProgressBar() {
    const progress = (currentQuestionIndex / TOTAL_QUESTIONS) * 100;
    const difficulty = getDifficultyForLevel(currentMoneyIndex).toLowerCase();

    if (progressBar) {
        progressBar.style.width = progress + '%';
        progressBar.className = 'progress-bar ' + difficulty;
    }

    if (progressText) {
        progressText.textContent = `${currentQuestionIndex + 1}`;
    }

    // Update 20-dot progress mask (legacy element — may be absent)
    const dots = document.getElementById('progressDots');
    if (dots) {
        dots.style.setProperty('--current', currentQuestionIndex + 1);
    }

    // Update the in-card Points pill from the prize ladder
    const idx = currentMoneyIndex;
    const pointsPill = document.getElementById('pointsPill');
    if (pointsPill && moneyLadder[idx]) {
        pointsPill.textContent = moneyLadder[idx].amount;
        pointsPill.classList.toggle('earned', moneyLadder[idx].value > 0);
    }

    // Update the 3-zone level row (8 easy + 7 medium + 6 hard dots)
    updateLevelRow(idx);
}

function updateLevelRow(idx) {
    const zones = [
        { id: 'levelDotsEasy', total: 8, startIdx: 1, zoneEl: '.level-zone-easy' },
        { id: 'levelDotsMedium', total: 7, startIdx: 9, zoneEl: '.level-zone-medium' },
        { id: 'levelDotsHard', total: 5, startIdx: 16, zoneEl: '.level-zone-hard' },
    ];
    zones.forEach(zone => {
        const dotsEl = document.getElementById(zone.id);
        if (!dotsEl) return;
        if (dotsEl.children.length !== zone.total) {
            dotsEl.innerHTML = '';
            for (let i = 0; i < zone.total; i++) {
                dotsEl.appendChild(document.createElement('span'));
            }
        }
        const completedInZone = Math.max(0, Math.min(zone.total, idx - zone.startIdx + 1));
        Array.from(dotsEl.children).forEach((dot, i) => {
            dot.classList.toggle('filled', i < completedInZone);
        });
        const zoneEl = document.querySelector(zone.zoneEl);
        if (zoneEl) {
            zoneEl.classList.toggle('active', completedInZone > 0 && completedInZone < zone.total);
            zoneEl.classList.toggle('completed', completedInZone >= zone.total);
        }
    });
}

// Update visual difficulty indicators (background, level indicator)
function updateDifficultyVisuals(difficulty) {
    const diffLower = difficulty.toLowerCase();

    // Update game area background
    if (gameArea) {
        gameArea.classList.remove('difficulty-easy', 'difficulty-medium', 'difficulty-hard');
        gameArea.classList.add('difficulty-' + diffLower);
    }

    // Update level indicator
    if (levelIndicator) {
        levelIndicator.classList.remove('easy', 'medium', 'hard');
        levelIndicator.classList.add(diffLower);
    }
}

// Show zone transition notification
function showZoneNotification(difficulty) {
    if (!zoneNotification) return;

    const diffLower = difficulty.toLowerCase();
    const icon = getDifficultyIcon(difficulty);

    // Set content and styling
    zoneNotification.querySelector('.zone-icon').textContent = icon;
    zoneNotification.querySelector('.zone-text').textContent = difficulty + ' MODE';
    zoneNotification.className = 'zone-notification ' + diffLower;

    // Show notification
    zoneNotification.classList.add('show');

    // Add celebration animation to game area
    if (gameArea) {
        gameArea.classList.add('zone-celebration');
        setTimeout(() => gameArea.classList.remove('zone-celebration'), 800);
    }

    // Hide notification after delay
    setTimeout(() => {
        zoneNotification.classList.remove('show');
    }, 1500);
}

// Check for zone transition and trigger notification
function checkZoneTransition(currentDifficulty) {
    if (previousDifficulty && previousDifficulty !== currentDifficulty) {
        showZoneNotification(currentDifficulty);
    }
    previousDifficulty = currentDifficulty;
}

const TOTAL_QUESTIONS = 20;
const COOLDOWN_GAMES = 5; // Questions can't reappear for 5 games

// --- Question Cooldown System ---
// Uses localStorage to track which questions have been used and their cooldown

function getQuestionCooldowns() {
    try {
        const data = localStorage.getItem('questionCooldowns');
        return data ? JSON.parse(data) : {};
    } catch (e) {
        console.error('Error reading cooldowns:', e);
        return {};
    }
}

function saveQuestionCooldowns(cooldowns) {
    try {
        localStorage.setItem('questionCooldowns', JSON.stringify(cooldowns));
    } catch (e) {
        console.error('Error saving cooldowns:', e);
    }
}

// Generate a unique ID for a question (based on question text)
function getQuestionId(question) {
    // Use a simple hash of the question text
    let hash = 0;
    const str = question.question;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return 'q_' + Math.abs(hash).toString(36);
}

// Decrement all cooldowns by 1 (called at start of each game)
function decrementCooldowns() {
    const cooldowns = getQuestionCooldowns();
    const updated = {};

    for (const [id, count] of Object.entries(cooldowns)) {
        if (count > 1) {
            updated[id] = count - 1;
        }
        // If count <= 1, don't include it (cooldown expired)
    }

    saveQuestionCooldowns(updated);
    return updated;
}

// Mark questions as used (called at end of each game)
function markQuestionsAsUsed(usedQuestions) {
    const cooldowns = getQuestionCooldowns();

    for (const question of usedQuestions) {
        const id = getQuestionId(question);
        cooldowns[id] = COOLDOWN_GAMES;
    }

    saveQuestionCooldowns(cooldowns);
}

// Check if a question is available (not on cooldown)
function isQuestionAvailable(question) {
    const cooldowns = getQuestionCooldowns();
    const id = getQuestionId(question);
    return !cooldowns[id] || cooldowns[id] <= 0;
}

// Get available questions from a pool (excluding those on cooldown)
function getAvailableQuestions(pool) {
    return pool.filter(q => isQuestionAvailable(q));
}

// Track questions used in this game session
let usedInCurrentGame = []; // Track questions used in this game session

// Shuffle function
function shuffle(arr) {
    const shuffled = [...arr];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// Initialize game session (called at start of each game)
function initGameSession() {
    // Decrement cooldowns at the start of each game
    decrementCooldowns();
    usedInCurrentGame = [];

    // Log available questions for debugging
    const availableEasy = getAvailableQuestions(questionBank.EASY);
    const availableMedium = getAvailableQuestions(questionBank.MEDIUM);
    const availableHard = getAvailableQuestions([...questionBank.HARD, ...questionBank.EXTREME]);

    console.log('Available questions at game start:', {
        EASY: availableEasy.length,
        MEDIUM: availableMedium.length,
        HARD: availableHard.length
    });
}

// Get a random question based on current prize level
function getQuestionForCurrentLevel() {
    const difficulty = getDifficultyForLevel(currentMoneyIndex);

    // Get the appropriate pool
    let pool;
    if (difficulty === 'EASY') {
        pool = questionBank.EASY;
    } else if (difficulty === 'MEDIUM') {
        pool = questionBank.MEDIUM;
    } else {
        pool = [...questionBank.HARD, ...questionBank.EXTREME];
    }

    // Filter out questions used in current game AND on cooldown
    const usedIds = usedInCurrentGame.map(q => getQuestionId(q));
    let availableQuestions = pool.filter(q => {
        const id = getQuestionId(q);
        return !usedIds.includes(id) && isQuestionAvailable(q);
    });

    // If no questions available with cooldown, ignore cooldown but still avoid repeats
    if (availableQuestions.length === 0) {
        console.log(`No ${difficulty} questions available with cooldown, ignoring cooldown...`);
        availableQuestions = pool.filter(q => {
            const id = getQuestionId(q);
            return !usedIds.includes(id);
        });
    }

    // If still no questions (all used in current game), allow repeats from cooldown pool
    if (availableQuestions.length === 0) {
        console.log(`All ${difficulty} questions used in this game, allowing repeats...`);
        availableQuestions = pool.filter(q => isQuestionAvailable(q));
    }

    // Last resort: use any question from the pool
    if (availableQuestions.length === 0) {
        console.log(`Using any ${difficulty} question as last resort...`);
        availableQuestions = pool;
    }

    // Pick a random question
    const shuffled = shuffle(availableQuestions);
    return shuffled[0];
}

// --- Global Game State & DOM Element References ---
let availableQuestions, currentQuestion, currentQuestionIndex, currentMoneyIndex, fiftyFiftyUsed, addTimeUsed, skipQuestionUsed, gameActive, countdownInterval, isTimerModalActive, totalGameTime;
let questionTimerInterval;
const QUESTION_TIME_LIMIT = 30;
let currentQuestionTimeLeft = QUESTION_TIME_LIMIT;

const startScreen = document.getElementById('startScreen');
const startGameBtn = document.getElementById('startGameBtn');
const leaderboardBtn = document.getElementById('leaderboardBtn');
const playerNameInput = document.getElementById('playerNameInput');
const nameValidation = document.getElementById('nameValidation');

// Store player name for the session
let playerName = '';
const gameContainer = document.getElementById('gameContainer');
const exitButton = document.getElementById('exitButton');
const questionElement = document.getElementById('question');
const optionsElement = document.getElementById('options');
const levelIndicator = document.getElementById('levelIndicator');
const moneyLadderElement = document.getElementById('moneyLadder');
const resultModal = document.getElementById('resultModal');
const resultTitle = document.getElementById('resultTitle');
const resultMessage = document.getElementById('resultMessage');
const resultButton = document.getElementById('resultButton');
const certificateModal = document.getElementById('certificateModal');
const certificateName = document.getElementById('certificateName');
const certificateAmount = document.getElementById('certificateAmount');
const nameInput = document.getElementById('nameInput');
const playAgainBtn = document.getElementById('playAgain');
const addToLeaderboardBtn = document.getElementById('addToLeaderboardBtn');
const fiftyFiftyBtn = document.getElementById('fiftyFifty');
const addTimeBtn = document.getElementById('addTime');
const skipQuestionBtn = document.getElementById('skipQuestion');
const correctSound = document.getElementById('correctSound');
const wrongSound = document.getElementById('wrongSound');
const clickSound = document.getElementById('clickSound');
const questionTimerElement = document.getElementById('questionTimer');
const leaderboardModal = document.getElementById('leaderboardModal');
const backToStartBtn = document.getElementById('backToStartBtn');
const leaderboardTableBody = document.getElementById('leaderboardTableBody');
const helpModal = document.getElementById('helpModal');
const helpBtn = document.getElementById('helpBtn');
const backToStartFromHelpBtn = document.getElementById('backToStartFromHelpBtn');
const downloadCertificateBtn = document.getElementById('downloadCertificateBtn');
const nameInputContainer = document.getElementById('nameInputContainer');
const submitNameBtn = document.getElementById('submitNameBtn');
const validationMessage = document.getElementById('validationMessage');
const certificateButtons = document.querySelector('.certificate-buttons');


// Lifeline elements (no longer in a dropdown)

// Sound toggle element
const soundToggle = document.getElementById('soundToggle');

// Progress bar and zone notification elements
const progressBar = document.getElementById('progressBar');
const progressText = document.getElementById('progressText');
const zoneNotification = document.getElementById('zoneNotification');
const gameArea = document.querySelector('.game-area');

// Track previous difficulty for zone transition detection
let previousDifficulty = null;


// --- Leaderboard Functions ---
async function checkScoreQualifies(score, time) {
    try {
        const { data, error } = await supabase
            .from('leaderboard')
            .select('score, time')
            .order('score', { ascending: false })
            .order('time', { ascending: true })
            .limit(15);

        if (error) throw error;

        if (!data || data.length < 15) return true;

        const lowestEntry = data[data.length - 1];

        if (score > lowestEntry.score) return true;
        if (score === lowestEntry.score && time < lowestEntry.time) return true;

        return false;
    } catch (error) {
        console.error("Error checking score qualification:", error);
        return false;
    }
}

async function addScoreToLeaderboard(name, score, amount, time) {
    try {
        const { error } = await supabase
            .from('leaderboard')
            .insert([{ name, score, amount, time }]);

        if (error) throw error;
        console.log("Score successfully added to Supabase!");
    } catch (error) {
        console.error("Error adding score: ", error);
    }
}

async function showLeaderboard() {
    startScreen.classList.remove('active');
    certificateModal.classList.remove('active');
    leaderboardModal.classList.add('active');
    leaderboardTableBody.innerHTML = '<tr><td colspan="4">Loading scores...</td></tr>';

    try {
        const { data, error } = await supabase
            .from('leaderboard')
            .select('*')
            .order('score', { ascending: false })
            .order('time', { ascending: true })
            .limit(15);

        if (error) throw error;

        leaderboardTableBody.innerHTML = '';

        if (!data || data.length === 0) {
            leaderboardTableBody.innerHTML = '<tr><td colspan="4">No scores yet. Be the first!</td></tr>';
            return;
        }

        let rank = 1;
        data.forEach(entry => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${rank}.</td>
                <td>${entry.name}</td>
                <td>${entry.time}s</td>
                <td>${entry.amount}</td>
            `;
            leaderboardTableBody.appendChild(row);
            rank++;
        });

    } catch (error) {
        console.error("Error getting leaderboard: ", error);
        leaderboardTableBody.innerHTML = '<tr><td colspan="4">Could not load scores. Please try again.</td></tr>';
    }
}

function hideLeaderboard() {
    leaderboardModal.classList.remove('active');
    startScreen.classList.add('active');
}


// --- Core Game Logic ---
function initGame() {
    resetGameState();
    initGameSession(); // Initialize cooldowns and reset used questions
    updateMoneyLadder();

    // Show helpline explainer, then the level explainer, then the first question.
    const helpModal = document.getElementById('lifelineExplainerModal');
    const helpOk = document.getElementById('lifelineExplainerOk');
    const levelModal = document.getElementById('levelExplainerModal');
    const levelOk = document.getElementById('levelExplainerOk');

    helpModal.classList.add('active');

    const onHelpAck = () => {
        helpModal.classList.remove('active');
        helpOk.removeEventListener('click', onHelpAck);
        if (levelModal && levelOk) {
            levelModal.classList.add('active');
            const onLevelAck = () => {
                levelModal.classList.remove('active');
                levelOk.removeEventListener('click', onLevelAck);
                showQuestion();
            };
            levelOk.addEventListener('click', onLevelAck);
        } else {
            showQuestion();
        }
    };
    helpOk.addEventListener('click', onHelpAck);
}

function stopQuestionTimer() {
    clearInterval(questionTimerInterval);
}

function resumeQuestionTimer() {
    if (!gameActive) return;
    questionTimerInterval = setInterval(() => {
        currentQuestionTimeLeft--;
        if (questionTimerElement) {
            const mm = String(Math.floor(currentQuestionTimeLeft / 60)).padStart(2, '0');
            const ss = String(currentQuestionTimeLeft % 60).padStart(2, '0');
            questionTimerElement.textContent = `${mm}:${ss}`;
            if (currentQuestionTimeLeft <= 10) {
                questionTimerElement.classList.add('urgent');
            }
        }
        if (currentQuestionTimeLeft <= 0) handleTimeout();
    }, 1000);
}

function startQuestionTimer() {
    stopQuestionTimer();
    currentQuestionTimeLeft = QUESTION_TIME_LIMIT;
    if (questionTimerElement) {
        const mm = String(Math.floor(currentQuestionTimeLeft / 60)).padStart(2, '0');
        const ss = String(currentQuestionTimeLeft % 60).padStart(2, '0');
        questionTimerElement.textContent = `${mm}:${ss}`;
        questionTimerElement.style.visibility = 'visible';
        questionTimerElement.classList.remove('urgent');
    }
    resumeQuestionTimer();
}

function showQuestion() {
    // Check if game is complete (answered all 20 questions)
    if (currentQuestionIndex >= TOTAL_QUESTIONS) {
        stopQuestionTimer();
        // Mark all used questions for cooldown
        markQuestionsAsUsed(usedInCurrentGame);
        showCertificate();
        return;
    }

    gameActive = true;

    // Get a question based on current prize level (dynamic selection)
    currentQuestion = getQuestionForCurrentLevel();

    // Track this question as used in current game
    if (currentQuestion && !usedInCurrentGame.includes(currentQuestion)) {
        usedInCurrentGame.push(currentQuestion);
    }

    // Determine difficulty based on current prize level
    const difficulty = getDifficultyForLevel(currentMoneyIndex);
    const questionNumber = currentQuestionIndex + 1;
    const difficultyIcon = getDifficultyIcon(difficulty);

    questionElement.textContent = currentQuestion.question;
    if (levelIndicator) {
        const stars = difficulty === 'EASY' ? '★' : difficulty === 'MEDIUM' ? '★★' : '★★★';
        levelIndicator.textContent = stars;
    }

    // Update all visual elements
    updateProgressBar();
    updateDifficultyVisuals(difficulty);
    checkZoneTransition(difficulty);

    optionsElement.innerHTML = '';
    const letters = ['A', 'B', 'C', 'D'];
    currentQuestion.options.forEach((option, index) => {
        const optionElement = document.createElement('div');
        optionElement.className = 'option';
        optionElement.setAttribute('tabindex', '0');
        optionElement.setAttribute('role', 'button');
        optionElement.setAttribute('aria-label', `Option ${letters[index]}: ${option}`);
        optionElement.innerHTML = `<div class="option-letter">${letters[index]}</div><div class="option-text">${option}</div>`;
        optionElement.addEventListener('click', () => selectAnswer(index));
        // Allow Enter and Space keys to select option
        optionElement.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                selectAnswer(index);
            }
        });
        optionsElement.appendChild(optionElement);
    });
    startQuestionTimer();
}

function selectAnswer(selectedIndex) {
    if (!gameActive) return;
    stopQuestionTimer();
    playSound(clickSound);
    
    const timeTaken = QUESTION_TIME_LIMIT - currentQuestionTimeLeft;
    totalGameTime += timeTaken;
    
    const options = document.querySelectorAll('.option');
    options.forEach(option => option.style.pointerEvents = 'none');
    options[selectedIndex].style.background = 'linear-gradient(135deg, #f67d21ff, #efab23ff)';
    
    setTimeout(() => {
        let message = ''; // Initialize message variable

        if (selectedIndex === currentQuestion.correct) {
            options[selectedIndex].style.background = 'linear-gradient(135deg, #0a6a0a, #0a8a0a)';
            playSound(correctSound);
            currentMoneyIndex = Math.min(moneyLadder.length - 1, currentMoneyIndex + 1);
            resultTitle.textContent = "Correct!";
            // Format "Correct" message
            message = `Congratulations!<br>You have won <strong>${moneyLadder[currentMoneyIndex].amount}</strong>.`;
        } else {
            playSound(wrongSound);
            // Wrong answer: stay at current level (no movement down)
            resultTitle.textContent = "Incorrect!";
            // Format "Incorrect" message
            message = `<br>The correct answer was: ${currentQuestion.options[currentQuestion.correct]}.`;
        }
        
        // Append fun fact if it exists
        if (currentQuestion.fact) {
            message += `<hr style="margin: 1rem 0;"><strong>Fun Fact:</strong><br><em>${currentQuestion.fact}</em>`;
        }
        
        // Use innerHTML to render formatted message
        resultMessage.innerHTML = message;
        
        updateMoneyLadder();
        resultButton.textContent = "Next Question";
        resultModal.classList.add('active');
        gameActive = false;
    }, 1000);
}

function handleTimeout() {
    stopQuestionTimer();
    playSound(wrongSound);
    gameActive = false;

    totalGameTime += QUESTION_TIME_LIMIT;

    // Timeout: stay at current level (no movement down)
    updateMoneyLadder();

    resultTitle.textContent = "Time's Up!";
    
    let message = `The correct answer was: ${currentQuestion.options[currentQuestion.correct]}.`;

    // Append fun fact if it exists
    if (currentQuestion.fact) {
        message += `<hr style="margin: 1rem 0;"><strong>Fun Fact:</strong><br><em>${currentQuestion.fact}</em>`;
    }

    // Use innerHTML to render formatted message
    resultMessage.innerHTML = message;
    
    const options = document.querySelectorAll('.option');
    if (currentQuestion && options.length > currentQuestion.correct) {
       options[currentQuestion.correct].style.background = 'linear-gradient(135deg, #0a6a0a, #0a8a0a)';
    }
    resultModal.classList.add('active');
}

function continueGameAfterAnswer() {
    resultModal.classList.remove('active');
    currentQuestionIndex++;
    showQuestion();
}

function updateMoneyLadder() {
    moneyLadderElement.innerHTML = '';
    moneyLadder.forEach((level, index) => {
        const levelElement = document.createElement('div');
        levelElement.className = 'money-level';
        levelElement.textContent = level.amount;

        // Add difficulty zone class based on level index
        if (index <= 7) {
            levelElement.classList.add('zone-easy');
        } else if (index <= 14) {
            levelElement.classList.add('zone-medium');
        } else {
            levelElement.classList.add('zone-hard');
        }

        if (index === currentMoneyIndex) {
            levelElement.classList.add('current');
        } else if (index < currentMoneyIndex) {
            levelElement.classList.add('passed');
        }

        // Mark checkpoint levels with a special class
        if (level.checkpoint) {
            levelElement.classList.add('checkpoint');
        }

        moneyLadderElement.append(levelElement);
    });
    const currentLevel = document.querySelector('.money-level.current');
    if (currentLevel) currentLevel.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function useFiftyFifty() {
    if (fiftyFiftyUsed || !gameActive) return;
    playSound(clickSound);
    fiftyFiftyUsed = true;
    fiftyFiftyBtn.classList.add('used');

    const options = document.querySelectorAll('.option');
    let wrongOptions = [];
    options.forEach((opt, index) => {
        if (index !== currentQuestion.correct) {
            wrongOptions.push(index);
        }
    });

    // Shuffle wrong options and remove only 1
    wrongOptions.sort(() => Math.random() - 0.5);

    if (wrongOptions.length > 0) {
        options[wrongOptions[0]].style.opacity = '0.3';
        options[wrongOptions[0]].style.pointerEvents = 'none';
    }
}

function useAddTime() {
    if (addTimeUsed || !gameActive) return;
    playSound(clickSound);
    addTimeUsed = true;
    addTimeBtn.classList.add('used');

    // Add 30 seconds to the current timer
    currentQuestionTimeLeft += 30;
    if (questionTimerElement) {
        questionTimerElement.textContent = currentQuestionTimeLeft;
        // Reset timer color if it was red
        if (currentQuestionTimeLeft > 10) {
            questionTimerElement.style.background = '#FFD700';
        }
    }
}

function useSkipQuestion() {
    if (skipQuestionUsed || !gameActive) return;
    playSound(clickSound);
    skipQuestionUsed = true;
    skipQuestionBtn.classList.add('used');
    stopQuestionTimer();

    // Skip to next question without affecting prize level
    // Question counter still increments (question is consumed)
    currentQuestionIndex++;
    showQuestion();
}

async function showCertificate() {
    stopQuestionTimer();
    
    // Reset the certificate modal UI state to its initial view
    nameInputContainer.style.display = 'none';
    certificateButtons.style.display = 'flex';
    validationMessage.style.display = 'none';
    nameInput.style.borderColor = 'var(--background-dark)';
    nameInput.value = "";

    // Get certificate modal text elements
    const certModalTitle = document.querySelector('#certificateModal .main-title');
    const certModalPresentedText = document.querySelector('#certificateModal .presented-text');
    const certModalAchievementText = document.querySelector('#certificateModal .achievement-text');
    
    const finalWinnings = moneyLadder[currentMoneyIndex];

    // CHECK THE SCORE and display the correct certificate text
    if (finalWinnings.value === 1000000) {
        // --- Winner's Certificate Text ---
        certModalTitle.textContent = '🏆 Certificate of Excellence 🏆';
        certModalPresentedText.textContent = 'This is proudly awarded to';
        certModalAchievementText.innerHTML = 'for achieving the title of Sustainable Energy Ambassador by winning the "Watt\'s The Answer" challenge and collecting <strong>1,000,000 Points.</strong>';
        certificateName.textContent = playerName; // Use stored player name
        certificateAmount.style.display = 'none'; // Hide the old amount field
    } else {
        // --- Standard Certificate Text ---
        certModalTitle.textContent = 'Certificate of Achievement';
        certModalPresentedText.textContent = 'This certificate is proudly presented to';
        certModalAchievementText.innerHTML = 'for demonstrating knowledge in sustainable energy by reaching a key milestone in the "Watt\'s The Answer" challenge and collecting';
        certificateName.textContent = playerName; // Use stored player name
        certificateAmount.style.display = 'block'; // Ensure the old amount field is visible
        certificateAmount.innerHTML = `<strong>${finalWinnings.value.toLocaleString()}</strong> Points.`;    }

    addToLeaderboardBtn.style.display = 'none';
    
    if (finalWinnings.value > 0) {
        const qualifies = await checkScoreQualifies(finalWinnings.value, totalGameTime);
        if (qualifies) {
            addToLeaderboardBtn.style.display = 'inline-block';
        }
    }
    
    certificateModal.classList.add('active');
    document.body.classList.remove('in-game');
    videoController.playOutro();
}

// Detect if user is on mobile device
function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
           || window.innerWidth <= 768;
}

async function downloadCertificate() {
    // Use the certificate displayed in the modal to generate an image
    const certificateWrapper = document.querySelector('#certificateModal .certificate-wrapper');

    if (!certificateWrapper) {
        alert('Sorry, there was an error generating the certificate.');
        return;
    }

    try {
        // Show loading state
        downloadCertificateBtn.textContent = 'Generating...';
        downloadCertificateBtn.disabled = true;

        // Generate image from the certificate element
        const canvas = await html2canvas(certificateWrapper, {
            scale: 2, // Higher quality
            useCORS: true,
            backgroundColor: '#ffffff',
            logging: false
        });

        const fileName = `MissionCleanEnergy_Certificate_${playerName.replace(/\s+/g, '_')}`;

        if (isMobileDevice()) {
            // MOBILE: Generate shareable image
            const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png', 1.0));

            // Try Web Share API first (native share sheet)
            if (navigator.share && navigator.canShare) {
                const file = new File([blob], `${fileName}.png`, { type: 'image/png' });
                const shareData = { files: [file] };

                if (navigator.canShare(shareData)) {
                    try {
                        await navigator.share(shareData);
                        downloadCertificateBtn.textContent = 'Download Certificate';
                        downloadCertificateBtn.disabled = false;
                        return;
                    } catch (shareError) {
                        if (shareError.name === 'AbortError') {
                            downloadCertificateBtn.textContent = 'Download Certificate';
                            downloadCertificateBtn.disabled = false;
                            return;
                        }
                    }
                }
            }

            // Fallback: Download image
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${fileName}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

        } else {
            // DESKTOP: Generate PDF
            const { jsPDF } = window.jspdf;

            // Create landscape A4 PDF
            const pdf = new jsPDF({
                orientation: 'landscape',
                unit: 'mm',
                format: 'a4'
            });

            // Get dimensions
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();

            // Convert canvas to image and add to PDF
            const imgData = canvas.toDataURL('image/png', 1.0);

            // Calculate scaling to fit page while maintaining aspect ratio
            const canvasRatio = canvas.width / canvas.height;
            const pageRatio = pageWidth / pageHeight;

            let imgWidth, imgHeight, x, y;

            if (canvasRatio > pageRatio) {
                // Image is wider - fit to width
                imgWidth = pageWidth - 20; // 10mm margin each side
                imgHeight = imgWidth / canvasRatio;
                x = 10;
                y = (pageHeight - imgHeight) / 2;
            } else {
                // Image is taller - fit to height
                imgHeight = pageHeight - 20; // 10mm margin each side
                imgWidth = imgHeight * canvasRatio;
                x = (pageWidth - imgWidth) / 2;
                y = 10;
            }

            pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);
            pdf.save(`${fileName}.pdf`);
        }

        downloadCertificateBtn.textContent = 'Download Certificate';
        downloadCertificateBtn.disabled = false;

    } catch (error) {
        console.error('Error generating certificate:', error);
        alert('Sorry, there was an error generating the certificate. Please try again.');
        downloadCertificateBtn.textContent = 'Download Certificate';
        downloadCertificateBtn.disabled = false;
    }
}

function resetGameState() {
    currentQuestionIndex = 0;
    currentMoneyIndex = 0;
    totalGameTime = 0;
    fiftyFiftyUsed = false;
    addTimeUsed = false;
    skipQuestionUsed = false;
    gameActive = true;
    currentQuestion = null;
    previousDifficulty = null; // Reset for zone transition detection
    fiftyFiftyBtn.classList.remove('used');
    addTimeBtn.classList.remove('used');
    skipQuestionBtn.classList.remove('used');

    // Reset progress bar
    if (progressBar) {
        progressBar.style.width = '0%';
        progressBar.className = 'progress-bar easy';
    }
    if (progressText) {
        progressText.textContent = 'Question 0 / 20';
    }

    // Reset game area background
    if (gameArea) {
        gameArea.classList.remove('difficulty-easy', 'difficulty-medium', 'difficulty-hard');
        gameArea.classList.add('difficulty-easy');
    }
    nameInput.style.borderColor = '#FFD700';
    document.querySelectorAll('.option').forEach(option => {
        option.style.opacity = '1';
        option.style.pointerEvents = 'auto';
        option.style.background = 'linear-gradient(135deg, #1a1a4a, #2a2a6a)';
    });
    stopQuestionTimer();
    clearInterval(countdownInterval);
}

function resetGame() {
    certificateModal.classList.remove('active');
    resetGameState();
    document.body.classList.add('in-game');
    videoController.pauseForGameplay();
    initGame();
}

function endGame() {
    stopQuestionTimer();
    resetGameState();
    gameContainer.style.display = 'none';
    startScreen.classList.add('active');
    document.body.classList.remove('in-game');
    videoController.playIntroThenLoop();
}

// --- Event Listeners ---
document.addEventListener('DOMContentLoaded', async () => {
    let nameInputMode = null; // Can be 'leaderboard' or 'certificate'

    // Load questions from Excel/CSV file
    startGameBtn.disabled = true;
    startGameBtn.classList.add('loading');

    await loadQuestionsFromFile();

    // Update button once questions are loaded
    startGameBtn.disabled = false;
    startGameBtn.classList.remove('loading');

    // Log question counts for debugging
    console.log('Questions loaded:', {
        EASY: questionBank.EASY.length,
        MEDIUM: questionBank.MEDIUM.length,
        HARD: questionBank.HARD.length,
        EXTREME: questionBank.EXTREME.length
    });

    // Set the certificate date dynamically
    const certificateDateElement = document.getElementById('certificateDate');
    if (certificateDateElement) {
        certificateDateElement.textContent = new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    // Sound toggle functionality — keeps two stacked SVG icons in the button
    // (.sound-on / .sound-off) and switches between them via the .muted class.
    soundToggle.addEventListener('click', () => {
        isMuted = !isMuted;
        soundToggle.classList.toggle('muted', isMuted);
        soundToggle.setAttribute('aria-pressed', isMuted ? 'true' : 'false');
        soundToggle.setAttribute('aria-label', isMuted ? 'Sound is off' : 'Sound is on');
    });

    helpBtn.addEventListener('click', () => {
        startScreen.classList.remove('active');
        helpModal.classList.add('active');
    });

    backToStartFromHelpBtn.addEventListener('click', () => {
        helpModal.classList.remove('active');
        startScreen.classList.add('active');
    });
    
    startGameBtn.addEventListener('click', () => {
        // Validate player name
        const name = playerNameInput.value.trim();
        if (!name) {
            nameValidation.style.display = 'block';
            playerNameInput.style.borderColor = '#F44336';
            playerNameInput.focus();
            return;
        }

        // Store the sanitized player name
        playerName = sanitizeInput(name);
        nameValidation.style.display = 'none';
        playerNameInput.style.borderColor = 'var(--background-dark)';

        startScreen.classList.remove('active');
        gameContainer.style.display = 'flex';
        document.body.classList.add('in-game');
        videoController.pauseForGameplay();
        initGame();
    });

    // Clear validation error when typing
    playerNameInput.addEventListener('input', () => {
        if (playerNameInput.value.trim()) {
            nameValidation.style.display = 'none';
            playerNameInput.style.borderColor = 'var(--background-dark)';
        }
    });

    leaderboardBtn.addEventListener('click', showLeaderboard);
    backToStartBtn.addEventListener('click', hideLeaderboard);
    exitButton.addEventListener('click', () => {
        playSound(clickSound);
        endGame();
    });

    // --- NEW CERTIFICATE MODAL LOGIC ---

    addToLeaderboardBtn.addEventListener('click', () => {
        nameInputMode = 'leaderboard';
        certificateButtons.style.display = 'none';
        nameInputContainer.style.display = 'flex';

        nameInput.placeholder = "Enter 3 Initials";
        nameInput.maxLength = 3;
        // Pre-fill with first 3 letters of player name
        const initials = playerName.replace(/[^a-zA-Z]/g, '').substring(0, 3).toUpperCase();
        nameInput.value = initials;
        submitNameBtn.textContent = "Submit to Leaderboard";
    });

    downloadCertificateBtn.addEventListener('click', () => {
        // Directly download certificate using stored player name
        downloadCertificate();
    });

    submitNameBtn.addEventListener('click', async () => {
        // Sanitize and validate input (for leaderboard initials)
        const rawName = nameInput.value.trim();
        const sanitizedName = sanitizeInput(rawName);
        validationMessage.style.display = 'none';
        nameInput.style.borderColor = 'var(--background-dark)';

        // Validate: only allow letters for initials
        const initialsOnly = sanitizedName.replace(/[^a-zA-Z]/g, '');
        if (initialsOnly === '' || initialsOnly.length > 3) {
            validationMessage.textContent = 'Please enter 1-3 letters only.';
            validationMessage.style.display = 'block';
            nameInput.style.borderColor = 'red';
            return;
        }

        const finalWinnings = moneyLadder[currentMoneyIndex];

        submitNameBtn.textContent = 'Adding...';
        submitNameBtn.disabled = true;

        // Format the name like A.G.A.
        const formattedName = initialsOnly.toUpperCase().split('').join('.');

        await addScoreToLeaderboard(formattedName, finalWinnings.value, finalWinnings.amount, totalGameTime);

        submitNameBtn.textContent = 'Added!';

        setTimeout(() => {
            nameInputContainer.style.display = 'none';
            certificateButtons.style.display = 'flex';
            addToLeaderboardBtn.style.display = 'none';
            submitNameBtn.disabled = false;
            submitNameBtn.textContent = 'Submit to Leaderboard';
        }, 1500);
    });

    nameInput.addEventListener('input', () => {
        if (nameInput.value.trim() !== '') {
            nameInput.style.borderColor = 'var(--background-dark)';
            validationMessage.style.display = 'none';
        }
    });

    playAgainBtn.addEventListener('click', resetGame);
    resultButton.addEventListener('click', continueGameAfterAnswer);
    
    fiftyFiftyBtn.addEventListener('click', useFiftyFifty);
    addTimeBtn.addEventListener('click', useAddTime);
    skipQuestionBtn.addEventListener('click', useSkipQuestion);

    // --- Lifeline Chooser (Idea 3) ---
    const lifelineChooserModal = document.getElementById('lifelineChooserModal');
    const lifelinesOpenBtn = document.getElementById('lifelinesOpenBtn');
    const chooserCancel = document.getElementById('chooserCancel');
    const chooserElimination = document.getElementById('chooserElimination');
    const chooserAddTime = document.getElementById('chooserAddTime');
    const chooserSkip = document.getElementById('chooserSkip');

    function openLifelineChooser() {
        if (!gameActive) return;
        stopQuestionTimer(); // Freeze time
        // Mark used lifelines
        chooserElimination.classList.toggle('used-lifeline', fiftyFiftyUsed);
        chooserAddTime.classList.toggle('used-lifeline', addTimeUsed);
        chooserSkip.classList.toggle('used-lifeline', skipQuestionUsed);
        lifelineChooserModal.classList.add('active');
    }

    function closeLifelineChooser() {
        lifelineChooserModal.classList.remove('active');
        if (gameActive) resumeQuestionTimer(); // Resume time
    }

    // The standalone "Lifelines" button was removed in the final-concept layout
    // (helplines are now inline at the top of the question card). Keep the
    // chooser modal logic intact in case we re-enable it later, but only
    // wire the trigger if the button is still present.
    if (lifelinesOpenBtn) lifelinesOpenBtn.addEventListener('click', openLifelineChooser);
    chooserCancel.addEventListener('click', closeLifelineChooser);
    chooserElimination.addEventListener('click', () => {
        closeLifelineChooser();
        useFiftyFifty();
    });
    chooserAddTime.addEventListener('click', () => {
        closeLifelineChooser();
        useAddTime();
    });
    chooserSkip.addEventListener('click', () => {
        closeLifelineChooser();
        useSkipQuestion();
    });
    
    // Keyboard navigation for answer selection
    document.addEventListener('keydown', (event) => {
        if (!gameActive) return;

        const key = event.key.toUpperCase();
        let selectedIndex = -1;

        // Support both letter keys (A, B, C, D) and number keys (1, 2, 3, 4)
        if (key === 'A' || key === '1') selectedIndex = 0;
        else if (key === 'B' || key === '2') selectedIndex = 1;
        else if (key === 'C' || key === '3') selectedIndex = 2;
        else if (key === 'D' || key === '4') selectedIndex = 3;

        // Validate the selection is within available options
        if (selectedIndex >= 0 && currentQuestion && selectedIndex < currentQuestion.options.length) {
            const options = document.querySelectorAll('.option');
            // Only select if the option is not disabled (e.g., from 50/50)
            if (options[selectedIndex] && options[selectedIndex].style.pointerEvents !== 'none') {
                selectAnswer(selectedIndex);
            }
        }

        // Enter key to continue after result modal
        if (event.key === 'Enter' && resultModal.classList.contains('active')) {
            continueGameAfterAnswer();
        }
    });
});
