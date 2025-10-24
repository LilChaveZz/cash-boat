// js/settings.js

// --- Constants ---
const SETTINGS_KEY = 'cb_settings';

// --- Default Settings ---
const DEFAULT_SETTINGS = {
    currency: 'USD',
    defaultTimeHorizon: 20, // years
    defaultPlottingIntervals: 1, // years
    compoundInterest: true,
    defaultRiskPreset: 'moderate' // conservative/moderate/aggressive
};

/**
 * Retrieves the settings object for the current user from localStorage.
 * If no settings exist, it returns the default settings.
 * @param {string} email - The email of the logged-in user.
 * @returns {Object} The user's settings.
 */
function getSettings(email) {
    try {
        const allSettings = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
        const userSettings = allSettings[email];

        if (userSettings) {
            // Merge with defaults to ensure all keys are present
            return { ...DEFAULT_SETTINGS, ...userSettings };
        } else {
            // Return defaults if no custom settings exist
            return DEFAULT_SETTINGS;
        }
    } catch (e) {
        console.error("Error reading settings from localStorage:", e);
        return DEFAULT_SETTINGS;
    }
}

/**
 * Saves the settings object for the current user to localStorage.
 * @param {string} email - The email of the logged-in user.
 * @param {Object} settings - The settings object to save.
 */
function saveSettings(email, settings) {
    try {
        const allSettings = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
        allSettings[email] = settings;
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(allSettings));
    } catch (e) {
        console.error("Error saving settings to localStorage:", e);
    }
}

// Export for use in other files
window.settings = {
    getSettings,
    saveSettings,
    DEFAULT_SETTINGS,
    SETTINGS_KEY
};
