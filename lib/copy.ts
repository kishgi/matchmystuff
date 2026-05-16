export const COPY = {
  brand: {
    tagline: "Powered by AI. Driven by kindness.",
  },
  nav: {
    home: "Home",
    reportLost: "Report Lost",
    reportFound: "Report Found",
    messages: "Messages",
    signIn: "Sign In",
    myPosts: "My Posts",
    myMatches: "My Matches",
    signOut: "Sign Out",
  },
  hero: {
    line1: "Lost something?",
    line2: "We'll find it.",
    subtext:
      "MatchMyStuff uses AI-powered image understanding and real-time matching to connect lost items with found items instantly.",
    subtext2:
      "Post a photo, describe what you lost or found, and our system scans the community feed around the clock. When there is a strong match, both sides get notified and can chat securely in the app.",
    lostCta: "I Lost Something",
    foundCta: "I Found Something",
    trustLine: "Free to use · Secure in-app chat · Built for Sri Lanka",
  },
  features: {
    title: "Why MatchMyStuff?",
    subtitle:
      "Traditional lost-and-found boards are slow and easy to miss. We combine computer vision, semantic search, and instant messaging so reunions happen faster.",
    items: [
      {
        title: "AI that understands photos",
        description:
          "GPT-4o vision reads your image and builds a rich description — color, brand, material, and unique marks — so matches go beyond simple keywords.",
      },
      {
        title: "Smart pairing",
        description:
          "Embeddings compare lost and found posts semantically. Location is factored in too, so nearby reports rank higher.",
      },
      {
        title: "Real-time alerts",
        description:
          "When similarity crosses our match threshold, both users get a notification and can open a private conversation immediately.",
      },
      {
        title: "Safe coordination",
        description:
          "Coordinate handoff through in-app chat — share photos, text, or a meet-up location without exposing personal email in public listings.",
      },
    ],
  },
  community: {
    title: "Built for everyday reunions",
    body:
      "Whether it is a phone left on the bus, a wallet at a café, or keys at the park, MatchMyStuff gives your community a single place to report, search, and connect. Every post helps someone else get closer to an answer.",
    body2:
      "Found something? You are doing more than posting — you are giving the owner a real chance to see it again. Lost something? You are not alone; new found items are added every day and checked against your report automatically.",
  },
  stats: {
    recovered: "2,400+ Items Recovered",
    accuracy: "98% Match Accuracy",
    response: "< 2 min Response Time",
  },
  howItWorks: {
    title: "How It Works",
    subtitle: "Three simple steps from report to reunion.",
    steps: [
      {
        title: "Snap a Photo",
        description:
          "Create a free account and upload a clear photo with title, description, and where it was lost or found. Your post appears on the public feed right away.",
      },
      {
        title: "AI Finds Matches",
        description:
          "Within minutes our pipeline generates an AI description and embedding, then compares against opposite-type posts. Strong candidates become matches with a confidence score.",
      },
      {
        title: "Chat & Reunite",
        description:
          "Open the match, start a conversation, agree on a handoff spot, and confirm when the item is back where it belongs.",
      },
    ],
  },
  feed: {
    title: "Recently Reported",
    lostTab: "Lost",
    foundTab: "Found",
  },
  cta: {
    headline: "Ready to make a difference?",
    subtext:
      "Every found-item report is a thread of hope for someone searching right now. Join the community and help reunite belongings across your city.",
    button: "Report a Found Item",
    secondary: "Report something lost",
  },
  footer: {
    tagline: "Powered by AI. Driven by kindness.",
    description:
      "MatchMyStuff connects people who have lost items with those who have found them — using vision AI, vector search, and secure messaging.",
    product: "Product",
    company: "Company",
    legal: "Legal",
    home: "Home",
    reportLost: "Report Lost",
    reportFound: "Report Found",
    matches: "Matches",
    messages: "Messages",
    privacy: "Privacy",
    terms: "Terms",
    contact: "Contact",
    signIn: "Sign In",
    copyright: "MatchMyStuff. All rights reserved.",
  },
  toast: {
    authSignInSuccess: "Signed in successfully",
    authSignUpSuccess: "Account created successfully",
    authError: "Authentication failed",
    reportSuccess: "Posted! We'll notify you when a match is found.",
    reportError: "Failed to submit report",
    uploadSuccess: "Image uploaded successfully",
    uploadError: "Failed to upload image",
    signOutSuccess: "Signed out successfully",
    signOutError: "Failed to sign out",
    markAllReadSuccess: "All notifications marked as read",
    markAllReadError: "Failed to mark notifications as read",
    postNotFound: "Post not found",
    matchNotFound: "Match not found",
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
    titleMin: "Title must be at least 3 characters",
    descriptionMin: "Description must be at least 10 characters",
    imageRequired: "Please upload an image",
  },
  matches: {
    title: "Your Matches",
    empty: "No matches yet. We'll notify you instantly when one is found.",
    openChat: "Open Chat",
    back: "Back to matches",
    scoreLabel: "Match",
    viewMatch: "View Match",
  },
  chat: {
    title: "Messages",
    subtitle: "Coordinate safely with people you have matched with.",
    empty: "No conversations yet. Match with someone to start chatting.",
    emptyInChat: "Say hello and agree on a time and place to meet.",
    emptyInChatHint: "You can send text, photos, or share your location below.",
    placeholder: "Write a message...",
    sharePhoto: "Photo",
    shareLocation: "Location",
    locationDenied: "Location permission denied. Enable location to share.",
    locationUnavailable: "Location is not available on this device.",
    viewMatch: "View match",
    back: "Messages",
    backMatches: "Matches",
    matchedItem: "Regarding",
    online: "Match conversation",
    scrollDown: "New messages",
    photo: "Photo",
    location: "Location",
    openMaps: "Open in Google Maps",
    sent: "Sent",
    delivered: "Delivered",
    noMessagesYet: "No messages yet",
  },
  auth: {
    backHome: "Back to home",
    welcomeBack: "Welcome back",
    welcomeSignUp: "Create your account",
    signInSubtext: "Sign in to reunite with your belongings",
    signUpSubtext: "Join MatchMyStuff and help reunite lost items",
    signInTab: "Sign In",
    signUpTab: "Sign Up",
    name: "Name",
    email: "Email",
    password: "Password",
    showPassword: "Show",
    hidePassword: "Hide",
    submit: "Continue",
    noAccount: "Don't have an account?",
    hasAccount: "Already have an account?",
    termsFooter: "By continuing you agree to our",
    termsLink: "Terms",
    privacyLink: "Privacy Policy",
    and: "and",
    errorFallback: "Authentication failed",
    wrongPassword: "Incorrect email or password",
    emailExists: "An account with this email already exists",
    quote: "Every lost item has someone waiting for it.",
    quoteSubtext:
      "Our AI matches lost and found items in real time — so reunions happen faster.",
    statRecovered: "2,400+ Recovered",
    statAccuracy: "98% Accuracy",
    statMatch: "< 2 min Match",
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
