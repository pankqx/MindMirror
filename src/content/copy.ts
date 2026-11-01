export const copy = {
  checkin: {
    questions: [
      {
        id: "mood",
        question: "How are you feeling today?",
        options: ["Very low", "A little low", "Okay", "Good", "Great"],
      },
      {
        id: "stress",
        question: "How much stress are you feeling?",
        options: ["1", "2", "3", "4", "5"],
      },
      {
        id: "energy",
        question: "How is your energy today?",
        options: ["1", "2", "3", "4", "5"],
      },
      {
        id: "sleep",
        question: "How many hours did you sleep last night?",
        type: "number",
      },
      {
        id: "connection",
        question: "Did you talk to someone you like today?",
        options: ["Yes", "Not yet"],
      },
    ],
    thankYou: "Thanks for checking in. Taking a moment for yourself matters. 💚",
  },

  weather: {
    clear: {
      title: "Clear skies ☀️",
      line: "Things seem steady. Keep doing what feels good for you.",
    },
    clouds: {
      title: "Passing clouds ⛅",
      line: "A few things may be weighing on you. Take it one step at a time.",
    },
    rain: {
      title: "Soft rain 🌧️",
      line: "You might need a little extra care today. Be gentle with yourself.",
    },
    storm: {
      title: "Heavy skies ⛈️",
      line: "It sounds like a lot is happening. Reaching out for support is okay.",
    },
  },

  tips: {
    sleep: [
      "Try putting your phone away a little earlier tonight.",
      "A regular bedtime can help you feel more rested.",
      "Give yourself a few quiet minutes before sleeping.",
    ],
    pressure: [
      "Break your next assignment into smaller tasks.",
      "Start with just one thing you can finish today.",
      "Take a short break between study sessions.",
    ],
    connection: [
      "Send a quick message to a friend.",
      "Sit with someone during your next break.",
      "Call someone you haven't spoken to in a while.",
    ],
    energy: [
      "Take a few minutes to stretch.",
      "Drink some water and give yourself a pause.",
      "Step outside for a little fresh air.",
    ],
    drive: [
      "Choose one small task to get started.",
      "Remember that progress doesn't have to be perfect.",
      "Make time for something you enjoy.",
    ],
  },

  ladder: [
    {
      title: "Look after yourself",
      line: "Take a breath, rest, and do something kind for yourself.",
    },
    {
      title: "One small step today",
      line: "Choose one manageable thing to focus on.",
    },
    {
      title: "Reach out to someone",
      line: "Talk to a friend, family member, or mentor you trust.",
    },
    {
      title: "Talk to someone trained",
      line: "Connect with your campus counsellor or call Tele-MANAS 14416 (free, 24×7). For emergencies, call 112.",
    },
  ],

  games: {
    bubbleWrap: {
      emoji: "🫧",
      title: "Bubble wrap",
      description: "Pop slowly. Breathe out with each one.",
    },
    worryShredder: {
      emoji: "📝",
      title: "Worry shredder",
      description: "Put a worry on paper and let it go.",
    },
    ripples: {
      emoji: "💧",
      title: "Ripples pond",
      description: "Tap the water. Watch it settle.",
    },
  },

  disclaimer: "MindMirror is not a medical device and does not diagnose.",
};