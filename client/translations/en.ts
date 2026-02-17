export interface Translations {
    common: {
        appName: string;
        language: string;
        switchLanguage: string;
    };
    sidebar: {
        rent: string;
        electricity: string;
        profile: string;
        logout: string;
    };
    login: {
        welcome: string;
        subtitle: string;
        email: string;
        emailPlaceholder: string;
        password: string;
        passwordPlaceholder: string;
        rememberMe: string;
        signIn: string;
        noAccount: string;
        signUp: string;
    };
    dashboard: {
        title: string;
        welcome: string;
    };
}

const en: Translations = {
    common: {
        appName: "Keswani System",
        language: "Language",
        switchLanguage: "العربية",
    },
    sidebar: {
        rent: "Rent",
        electricity: "Electricity",
        profile: "Profile",
        logout: "Logout",
    },
    login: {
        welcome: "Welcome Back",
        subtitle: "Enter your email and password to sign in",
        email: "Email",
        emailPlaceholder: "Your email address",
        password: "Password",
        passwordPlaceholder: "Your password",
        rememberMe: "Remember me",
        signIn: "Sign In",
        noAccount: "Don't have an account?",
        signUp: "Sign up",
    },
    dashboard: {
        title: "Dashboard",
        welcome: "Welcome to Keswani System",
    },
};

export default en;
