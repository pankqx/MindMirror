export const copy = {
  checkin: {
    // Individual question content for CheckIn.tsx

    mood: {
      title: "How are you feeling today?",
      description: "There is no right or wrong answer.",
    },

    stress: {
      title: "How much pressure are you feeling?",
      description: "Think about your studies and daily life.",
    },

    energy: {
      title: "How is your energy today?",
      description: "How energetic do you feel right now?",
    },

    sleep: {
      title: "How many hours did you sleep?",
      description: "Think about last night's sleep.",
    },

    connected: {
      title: "Do you feel connected to others?",
      description: "Have you felt supported and connected?",
    },

    note: {
      title: "Anything else on your mind?",
      description: "You can share anything you want. This is optional.",
    },

    // Existing question array from main

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

  // Keep the existing weather object from main below.
};


