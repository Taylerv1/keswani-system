const en = {
  // App
  appName: "Keswani System",

  // Login
  signIn: "Sign In",
  signInSubtitle: "Enter your email and password to Sign In",
  email: "Email",
  password: "Password",
  rememberMe: "Remember me",
  signInButton: "SIGN IN",
  noAccount: "Don't have an account?",
  signUp: "Sign Up",

  // Sidebar
  rent: "Rent",
  electricity: "Electricity",
  profile: "Profile",
  logout: "Logout",

  // Dashboard
  dashboard: "Dashboard",
  welcome: "Welcome back",
  language: "Language",
  switchLanguage: "العربية",

  // Common
  search: "Search here",
  save: "Save",
  cancel: "Cancel",
  delete: "Delete",
  edit: "Edit",
  add: "Add",
  loading: "Loading...",
  noData: "No data available",
  confirm: "Confirm",
  back: "Back",
  next: "Next",
  submit: "Submit",
  reset: "Reset",
} as const;

export type TranslationKeys = keyof typeof en;
export default en;
