export type Language = "en" | "hi" | "mr";

export const LANGUAGES: { code: Language; label: string; native: string; flag: string }[] = [
  { code: "en", label: "English", native: "English", flag: "🇬🇧" },
  { code: "hi", label: "Hindi", native: "हिन्दी", flag: "🇮🇳" },
  { code: "mr", label: "Marathi", native: "मराठी", flag: "🇮🇳" },
];

type Dict = Record<string, { en: string; hi: string; mr: string }>;

const dict: Dict = {
  tagline: { en: "Fear Less. Live Free.", hi: "निर्भय बनो. मुक्त जियो.", mr: "निर्भय व्हा. मुक्त जगा." },
  welcome: { en: "Welcome to Abhaya", hi: "अभया में आपका स्वागत है", mr: "अभयामध्ये आपले स्वागत आहे" },
  continue: { en: "Continue", hi: "आगे बढ़ें", mr: "पुढे जा" },
  getStarted: { en: "Get Started", hi: "शुरू करें", mr: "सुरू करा" },
  chooseLanguage: { en: "Choose Your Language", hi: "अपनी भाषा चुनें", mr: "आपली भाषा निवडा" },
  privacyPriority: { en: "Your privacy is our priority.", hi: "आपकी गोपनीयता हमारी प्राथमिकता है।", mr: "आपली गोपनीयता आमची प्राथमिकता आहे." },
  developedBy: { en: "Developed by Team Abhaya", hi: "टीम अभया द्वारा विकसित", mr: "टीम अभयाने विकसित केले" },
  companion: {
    en: "Your trusted companion for women's safety, emergency support, legal awareness, and community protection.",
    hi: "महिला सुरक्षा, आपातकालीन सहायता, कानूनी जागरूकता और सामुदायिक सुरक्षा के लिए आपका विश्वसनीय साथी।",
    mr: "महिला सुरक्षा, आपत्कालीन मदत, कायदेशीर जागरूकता आणि सामुदायिक संरक्षणासाठी आपला विश्वासू सोबती.",
  },
  signIn: { en: "Sign in", hi: "साइन इन करें", mr: "साइन इन करा" },
  signUp: { en: "Create account", hi: "खाता बनाएँ", mr: "खाते तयार करा" },
  email: { en: "Email", hi: "ईमेल", mr: "ईमेल" },
  password: { en: "Password", hi: "पासवर्ड", mr: "पासवर्ड" },
  fullName: { en: "Full name", hi: "पूरा नाम", mr: "पूर्ण नाव" },
  forgotPassword: { en: "Forgot password?", hi: "पासवर्ड भूल गए?", mr: "पासवर्ड विसरलात?" },
  signInGoogle: { en: "Continue with Google", hi: "Google से जारी रखें", mr: "Google ने पुढे जा" },
  home: { en: "Home", hi: "होम", mr: "होम" },
  map: { en: "Map", hi: "नक्शा", mr: "नकाशा" },
  report: { en: "Report", hi: "रिपोर्ट", mr: "अहवाल" },
  learn: { en: "Learn", hi: "सीखें", mr: "शिका" },
  profile: { en: "Profile", hi: "प्रोफ़ाइल", mr: "प्रोफाइल" },
  emergencySos: { en: "Emergency SOS", hi: "आपातकालीन SOS", mr: "आपत्कालीन SOS" },
  oneTapForHelp: { en: "One tap for help.", hi: "मदद के लिए एक टैप।", mr: "मदतीसाठी एक टॅप." },
  tapToAlert: { en: "Tap to alert your emergency contacts.", hi: "अपने आपातकालीन संपर्कों को सचेत करने के लिए टैप करें।", mr: "आपत्कालीन संपर्कांना अलर्ट करण्यासाठी टॅप करा." },
  quickAccess: { en: "Quick Access", hi: "त्वरित पहुँच", mr: "त्वरित प्रवेश" },
  viewAll: { en: "View all", hi: "सभी देखें", mr: "सर्व पहा" },
  followingMe: { en: "Someone is Following Me", hi: "कोई मेरा पीछा कर रहा है", mr: "कोणीतरी माझा पाठलाग करत आहे" },
  domesticViolence: { en: "Domestic Violence", hi: "घरेलू हिंसा", mr: "घरगुती हिंसा" },
  harassment: { en: "Harassment", hi: "उत्पीड़न", mr: "छळ" },
  cyberSafety: { en: "Cyber Safety", hi: "साइबर सुरक्षा", mr: "सायबर सुरक्षा" },
  helplineNumbers: { en: "Helpline Numbers", hi: "हेल्पलाइन नंबर", mr: "हेल्पलाइन क्रमांक" },
  safePlaces: { en: "Safe Places Nearby", hi: "पास सुरक्षित स्थान", mr: "जवळील सुरक्षित ठिकाणे" },
  aiAssistant: { en: "AI Safety Assistant", hi: "AI सुरक्षा सहायक", mr: "AI सुरक्षा सहाय्यक" },
  aiSubtitle: { en: "Get instant guidance and suggestions for your safety.", hi: "अपनी सुरक्षा के लिए तत्काल मार्गदर्शन और सुझाव प्राप्त करें।", mr: "आपल्या सुरक्षिततेसाठी त्वरित मार्गदर्शन आणि सूचना मिळवा." },
  stayAlert: { en: "Stay alert, stay safe.", hi: "सतर्क रहें, सुरक्षित रहें।", mr: "सावध रहा, सुरक्षित रहा." },
  hello: { en: "Hello", hi: "नमस्ते", mr: "नमस्कार" },
  settings: { en: "Settings", hi: "सेटिंग्स", mr: "सेटिंग्ज" },
  notifications: { en: "Notifications", hi: "सूचनाएँ", mr: "सूचना" },
  logout: { en: "Sign out", hi: "साइन आउट", mr: "साइन आउट" },
};

export function t(key: keyof typeof dict, lang: Language = "en"): string {
  return dict[key]?.[lang] ?? dict[key]?.en ?? String(key);
}
