export const COPY = {
  brand: {
    tagline: "Powered by AI. Driven by kindness.",
  },
  nav: {
    home: "Home",
    reportLost: "Report Lost",
    reportFound: "Report Found",
    signIn: "Sign In",
    myPosts: "My Posts",
    myMatches: "My Matches",
    signOut: "Sign Out",
  },
  hero: {
    line1: "Lost something?",
    line2: "We'll find it.",
    subtext:
      "Upload a photo. Our AI matches it with found items nearby — instantly.",
    lostCta: "I Lost Something",
    foundCta: "I Found Something",
  },
  stats: {
    recovered: "2,400+ Items Recovered",
    accuracy: "98% Match Accuracy",
    response: "< 2 min Response Time",
  },
  howItWorks: {
    title: "How It Works",
    steps: [
      {
        title: "Snap a Photo",
        description:
          "Upload a clear photo of the lost or found item with a short description.",
      },
      {
        title: "AI Finds Matches",
        description:
          "Our AI compares your item with nearby reports and surfaces the best matches.",
      },
      {
        title: "Get Notified",
        description:
          "When we find a match, you are notified instantly so you can reunite.",
      },
    ],
  },
  feed: {
    title: "Recently Reported",
    lostTab: "Lost",
    foundTab: "Found",
  },
  cta: {
    headline: "Have you found something?",
    subtext: "Help reunite it with its owner.",
    button: "Report a Found Item",
  },
  footer: {
    privacy: "Privacy",
    terms: "Terms",
    contact: "Contact",
  },
  auth: {
    signInTab: "Sign In",
    signUpTab: "Sign Up",
    name: "Name",
    email: "Email",
    password: "Password",
    submit: "Continue",
    errorFallback: "Authentication failed",
  },
  report: {
    lostHeading: "Report a Lost Item",
    foundHeading: "Report a Found Item",
    title: "Title",
    description: "Description",
    location: "Location",
    uploadHint: "Drag and drop an image, or click to browse",
    submit: "Submit Report",
    success:
      "Posted! We'll notify you when a match is found.",
  },
  matches: {
    title: "Your Matches",
    empty: "No matches yet. We'll notify you instantly when one is found.",
    contact: "Contact Owner",
    back: "Back to matches",
    scoreLabel: "Match",
  },
  post: {
    aiLabel: "AI Analysis:",
    viewMatches: "View Matches",
    notFound: "Post not found",
  },
  myPosts: {
    empty: "You haven't reported anything yet.",
    reportLost: "Report Lost Item",
    reportFound: "Report Found Item",
  },
  notifications: {
    title: "Notifications",
    matchFound: "Match found for",
    markAllRead: "Mark all read",
    empty: "No notifications",
  },
  postCard: {
    matched: "Matched!",
    viewMatch: "View Match",
    lost: "Lost",
    found: "Found",
  },
} as const;
