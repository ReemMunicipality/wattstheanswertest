// Bilingual UI dictionary for Watt's The Answer (English / Arabic).
// Keys are shared; `en` and `ar` provide the two translations.
// Keys ending in usage as innerHTML (rich content) are listed in HTML_KEYS below.
// NOTE: Machine-assisted MSA translation — recommend a native review pass before go-live.

export const I18N = {
  en: {
    /* ---- brand / start screen ---- */
    game_main_title: "WATT'S THE ANSWER",
    powered_by: "Powered by",
    choose_language: "Choose your language",
    lang_en: "English",
    lang_ar: "العربية",
    name_placeholder: "Your name...",
    name_validation: "Please enter your name to start",

    /* ---- generic buttons / aria ---- */
    aria_leaderboard: "Leaderboard",
    aria_start_game: "Start Game",
    aria_more_info: "More Info",
    aria_exit: "Exit",
    aria_sound_on: "Sound is on",
    aria_sound_off: "Sound is off",
    aria_language: "Switch language",
    back: "Back",
    got_it: "Got it!",
    cancel: "Cancel",
    continue: "Continue",
    next_question: "Next Question",
    play_again: "Play Again",
    download_certificate: "Download Certificate",

    /* ---- rotate prompt ---- */
    rotate_prompt: "Please rotate your device to portrait to play.",

    /* ---- leaderboard ---- */
    leaderboard_title: "Top 15 Players",
    col_rank: "Rank",
    col_name: "Name",
    col_time: "Time",
    col_score: "Score",
    lb_loading: "Loading scores...",
    lb_empty: "No scores yet. Be the first!",
    lb_error: "Could not load scores. Please try again.",

    /* ---- help modal ---- */
    help_title: "More Info",
    help_goal_h: "🎯 The Goal",
    help_goal_p: "Answer all questions correctly for a chance to win the grand prize of 1,000,000 points.",
    help_how_h: "🎮 How It Works",
    help_how_p: "You will face 20 questions in each game and progress through all of them.",
    help_how_li1: "You move through all questions in order",
    help_how_li2: "The challenge continues until all 20 are attempted",
    help_ladder_h: "🪜 Climb the Ladder",
    help_ladder_li1: "Correct answers move you up the ladder",
    help_ladder_li2: "Wrong answers keep you at the same level",
    help_ladder_li3: "You will not lose progress or move backward",
    help_clock_h: "⏱ Beat the Clock",
    help_clock_li1: "You have 30 seconds per question",
    help_clock_li2: "If time runs out, it counts as a wrong answer",
    help_diff_h: "📊 Difficulty by Level",
    help_diff_p: "Questions get harder the more correct answers you give:",
    help_diff_li1: "First 8 correct answers → Easy",
    help_diff_li2: "Next 7 correct answers → Medium",
    help_diff_li3: "Last 5 correct answers → Hard",
    help_diff_p2: "A wrong answer keeps you at the same level, so the difficulty only goes up when you answer correctly.",
    help_help_h: "🧩 Helplines",
    help_help_p: "Each game includes one use per helpline. Use them wisely:",
    help_help_elim: "<strong>Elimination</strong> – removes one wrong option",
    help_help_time: "<strong>Add Time</strong> – adds +30 seconds",
    help_help_skip: "<strong>Skip Question</strong> – moves to next question with no penalty",
    help_win_h: "🏆 Winning &amp; Glory",
    help_win_p: "After the game, you can:",
    help_win_li1: "Download a personalised certificate based on your score",
    help_win_li2: "Join the leaderboard if you're in the Top 15",
    help_win_li3: "Tiebreaker is based on total time (faster = better rank)",
    help_terms_h: "📜 Terms &amp; Conditions",
    help_terms_p1: "This game is intended for educational and entertainment purposes only.",
    help_terms_p2: "Points have no real-world monetary value.",
    help_ack_h: "👏 Acknowledgements",
    help_ack_p: "Developed by passionate volunteers:",

    /* ---- helpline explainer ---- */
    lifeline_title: "Your Helplines",
    lifeline_subtitle: "You get one of each per game. Use them wisely!",
    elim_name: "Elimination",
    elim_desc: "Removes one wrong answer",
    time_name: "Add Time",
    time_desc: "Adds 30 extra seconds",
    skip_name: "Skip",
    skip_desc: "Skip to the next question",
    helplines_label: "HELPLINES",

    /* ---- level explainer ---- */
    level_title: "Climbing the Ladder",
    level_subtitle: "The game has 3 difficulty levels",
    level_easy_name: "Easy — First 8 correct",
    level_easy_desc: "Build the basics. 100 to 8,000 points.",
    level_medium_name: "Medium — Next 7 correct",
    level_medium_desc: "Step it up. 10,000 to 150,000 points.",
    level_hard_name: "Hard — Last 5 correct",
    level_hard_desc: "The big leagues. 250,000 to 1,000,000 points.",

    /* ---- helpline chooser ---- */
    chooser_title: "Choose a Helpline",

    /* ---- result modal ---- */
    result_title: "Result",
    result_default_msg: "Your answer was correct!",

    /* ---- certificate ---- */
    cert_player_name: "Player Name",
    add_to_leaderboard: "Add to Leaderboard",
    cert_name_placeholder: "Enter your name",
    submit: "Submit",

    /* ---- dynamic (script.js) ---- */
    points: "Points",
    mode_easy: "EASY MODE",
    mode_medium: "MEDIUM MODE",
    mode_hard: "HARD MODE",
    correct_title: "Correct!",
    incorrect_title: "Incorrect!",
    timesup_title: "Time's Up!",
    skipped_title: "Question Skipped",
    congrats: "Congratulations!",
    you_won: "You have won {amount}.",
    correct_answer_was: "The correct answer was: {ans}.",
    left_game_msg: "You left the game, so this question was marked incorrect.",
    fun_fact: "Fun Fact:",
    one_q_left: "1 question left",
    n_q_left: "{n} questions left",
    q_counter: "{current} / {total}",
    enter_initials: "Enter 3 Initials",
    submit_to_lb: "Submit to Leaderboard",
    initials_validation: "Please enter 1-3 letters only.",
    adding: "Adding...",
    added: "Added!",
    cert_error: "Sorry, there was an error generating the certificate.",
    cert_error_retry: "Sorry, there was an error generating the certificate. Please try again."
  },

  ar: {
    /* ---- brand / start screen ---- */
    game_main_title: "WATT'S THE ANSWER",
    powered_by: "بدعمٍ من",
    choose_language: "اختر لغتك",
    lang_en: "English",
    lang_ar: "العربية",
    name_placeholder: "اسمك...",
    name_validation: "الرجاء إدخال اسمك للبدء",

    /* ---- generic buttons / aria ---- */
    aria_leaderboard: "لوحة المتصدرين",
    aria_start_game: "ابدأ اللعبة",
    aria_more_info: "مزيد من المعلومات",
    aria_exit: "خروج",
    aria_sound_on: "الصوت مُفعّل",
    aria_sound_off: "الصوت مُغلق",
    aria_language: "تبديل اللغة",
    back: "رجوع",
    got_it: "حسنًا!",
    cancel: "إلغاء",
    continue: "متابعة",
    next_question: "السؤال التالي",
    play_again: "العب مجددًا",
    download_certificate: "تحميل الشهادة",

    /* ---- rotate prompt ---- */
    rotate_prompt: "يرجى تدوير جهازك إلى الوضع العمودي للّعب.",

    /* ---- leaderboard ---- */
    leaderboard_title: "أفضل 15 لاعبًا",
    col_rank: "المرتبة",
    col_name: "الاسم",
    col_time: "الوقت",
    col_score: "النقاط",
    lb_loading: "جارٍ تحميل النتائج...",
    lb_empty: "لا توجد نتائج بعد. كن الأول!",
    lb_error: "تعذّر تحميل النتائج. حاول مرة أخرى.",

    /* ---- help modal ---- */
    help_title: "مزيد من المعلومات",
    help_goal_h: "🎯 الهدف",
    help_goal_p: "أجب عن جميع الأسئلة بشكل صحيح للحصول على فرصة الفوز بالجائزة الكبرى البالغة 1,000,000 نقطة.",
    help_how_h: "🎮 كيف تسير اللعبة",
    help_how_p: "ستواجه 20 سؤالًا في كل لعبة وتتقدّم خلالها جميعًا.",
    help_how_li1: "تنتقل عبر جميع الأسئلة بالترتيب",
    help_how_li2: "يستمر التحدي حتى محاولة الإجابة عن الأسئلة العشرين كاملة",
    help_ladder_h: "🪜 تسلّق السُّلّم",
    help_ladder_li1: "الإجابات الصحيحة ترفعك في السُّلّم",
    help_ladder_li2: "الإجابات الخاطئة تُبقيك في المستوى نفسه",
    help_ladder_li3: "لن تخسر تقدّمك ولن تتراجع إلى الخلف",
    help_clock_h: "⏱ سابق الزمن",
    help_clock_li1: "لديك 30 ثانية لكل سؤال",
    help_clock_li2: "إذا نفد الوقت، تُحتسب إجابة خاطئة",
    help_diff_h: "📊 الصعوبة حسب المستوى",
    help_diff_p: "تزداد صعوبة الأسئلة كلما زادت إجاباتك الصحيحة:",
    help_diff_li1: "أول 8 إجابات صحيحة ← سهل",
    help_diff_li2: "الـ 7 إجابات الصحيحة التالية ← متوسط",
    help_diff_li3: "آخر 5 إجابات صحيحة ← صعب",
    help_diff_p2: "الإجابة الخاطئة تُبقيك في المستوى نفسه، لذا لا تزداد الصعوبة إلا عند الإجابة الصحيحة.",
    help_help_h: "🧩 وسائل المساعدة",
    help_help_p: "تتضمّن كل لعبة استخدامًا واحدًا لكل وسيلة مساعدة. استخدمها بحكمة:",
    help_help_elim: "<strong>الحذف</strong> – يزيل خيارًا خاطئًا واحدًا",
    help_help_time: "<strong>إضافة وقت</strong> – يضيف 30 ثانية",
    help_help_skip: "<strong>تخطّي السؤال</strong> – ينتقل إلى السؤال التالي دون عقوبة",
    help_win_h: "🏆 الفوز والمجد",
    help_win_p: "بعد انتهاء اللعبة، يمكنك:",
    help_win_li1: "تحميل شهادة مخصّصة بناءً على نتيجتك",
    help_win_li2: "الانضمام إلى لوحة المتصدرين إذا كنت ضمن أفضل 15",
    help_win_li3: "يُحسم التعادل بالوقت الإجمالي (الأسرع = مرتبة أفضل)",
    help_terms_h: "📜 الشروط والأحكام",
    help_terms_p1: "هذه اللعبة لأغراض تعليمية وترفيهية فقط.",
    help_terms_p2: "النقاط ليس لها أي قيمة نقدية حقيقية.",
    help_ack_h: "👏 شكر وتقدير",
    help_ack_p: "طُوِّرت بجهود متطوعين شغوفين:",

    /* ---- helpline explainer ---- */
    lifeline_title: "وسائل مساعدتك",
    lifeline_subtitle: "تحصل على واحدة من كل نوع في كل لعبة. استخدمها بحكمة!",
    elim_name: "الحذف",
    elim_desc: "يزيل إجابة خاطئة واحدة",
    time_name: "إضافة وقت",
    time_desc: "يضيف 30 ثانية إضافية",
    skip_name: "تخطّي",
    skip_desc: "الانتقال إلى السؤال التالي",
    helplines_label: "وسائل المساعدة",

    /* ---- level explainer ---- */
    level_title: "تسلّق السُّلّم",
    level_subtitle: "تتكوّن اللعبة من 3 مستويات صعوبة",
    level_easy_name: "سهل — أول 8 إجابات صحيحة",
    level_easy_desc: "ابنِ الأساسيات. من 100 إلى 8,000 نقطة.",
    level_medium_name: "متوسط — الـ 7 التالية",
    level_medium_desc: "ارفع المستوى. من 10,000 إلى 150,000 نقطة.",
    level_hard_name: "صعب — آخر 5 إجابات",
    level_hard_desc: "الدوري الكبير. من 250,000 إلى 1,000,000 نقطة.",

    /* ---- helpline chooser ---- */
    chooser_title: "اختر وسيلة مساعدة",

    /* ---- result modal ---- */
    result_title: "النتيجة",
    result_default_msg: "إجابتك صحيحة!",

    /* ---- certificate ---- */
    cert_player_name: "اسم اللاعب",
    add_to_leaderboard: "أضف إلى لوحة المتصدرين",
    cert_name_placeholder: "أدخل اسمك",
    submit: "إرسال",

    /* ---- dynamic (script.js) ---- */
    points: "نقطة",
    mode_easy: "وضع سهل",
    mode_medium: "وضع متوسط",
    mode_hard: "وضع صعب",
    correct_title: "إجابة صحيحة!",
    incorrect_title: "إجابة خاطئة!",
    timesup_title: "انتهى الوقت!",
    skipped_title: "تم تخطّي السؤال",
    congrats: "تهانينا!",
    you_won: "لقد ربحت {amount}.",
    correct_answer_was: "الإجابة الصحيحة هي: {ans}.",
    left_game_msg: "لقد غادرت اللعبة، لذا احتُسب هذا السؤال إجابةً خاطئة.",
    fun_fact: "معلومة طريفة:",
    one_q_left: "بقي سؤال واحد",
    n_q_left: "بقي {n} سؤالًا",
    q_counter: "{current} / {total}",
    enter_initials: "أدخل 3 أحرف",
    submit_to_lb: "إرسال إلى لوحة المتصدرين",
    initials_validation: "الرجاء إدخال 1-3 أحرف فقط.",
    adding: "جارٍ الإضافة...",
    added: "تمت الإضافة!",
    cert_error: "عذرًا، حدث خطأ أثناء إنشاء الشهادة.",
    cert_error_retry: "عذرًا، حدث خطأ أثناء إنشاء الشهادة. حاول مرة أخرى."
  }
};

// Keys whose value contains HTML and must be assigned via innerHTML.
export const HTML_KEYS = new Set([
  "help_help_elim", "help_help_time", "help_help_skip",
  "help_win_h", "help_terms_h"
]);
