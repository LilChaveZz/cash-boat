// js/auth.js

// --- Constants ---
const USERS_KEY = 'cb_users';
const SESSION_KEY = 'cb_session';
const REDIRECT_URL = '/auth/login.html';
const HOME_URL = 'index.html';

// --- Utility Functions ---

/**
 * Converts a string to an ArrayBuffer.
 * @param {string} str - The string to convert.
 * @returns {ArrayBuffer}
 */
function str2ab(str) {
    const buf = new ArrayBuffer(str.length);
    const bufView = new Uint8Array(buf);
    for (let i = 0, strLen = str.length; i < strLen; i++) {
        bufView[i] = str.charCodeAt(i);
    }
    return buf;
}

/**
 * Converts an ArrayBuffer to a hexadecimal string.
 * @param {ArrayBuffer} buffer - The buffer to convert.
 * @returns {string}
 */
function ab2hex(buffer) {
    return Array.prototype.map.call(new Uint8Array(buffer), x => ('00' + x.toString(16)).slice(-2)).join('');
}

// --- Crypto Functions ---

/**
 * Generates a random 16-byte salt (32 hex characters).
 * @returns {string} The hexadecimal salt.
 */
function generateSalt() {
    const salt = window.crypto.getRandomValues(new Uint8Array(16));
    return ab2hex(salt.buffer);
}

/**
 * Hashes a password using a salt with SHA-256.
 * @param {string} salt - The salt to use (hex string).
 * @param {string} password - The password to hash.
 * @returns {Promise<string>} The hexadecimal hash.
 */
async function hashPassword(salt, password) {
    const data = str2ab(salt + password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return ab2hex(hashBuffer);
}

// --- User & Session Management ---

/**
 * Retrieves all users from localStorage.
 * @returns {Object<string, User>} A map of email to user objects.
 */
function getAllUsers() {
    try {
        const users = localStorage.getItem(USERS_KEY);
        return users ? JSON.parse(users) : {};
    } catch (e) {
        console.error("Error reading users from localStorage:", e);
        return {};
    }
}

/**
 * Saves a user object to localStorage.
 * @param {User} user - The user object to save.
 */
function saveUser(user) {
    const users = getAllUsers();
    users[user.email] = user;
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

/**
 * Finds a user by their email.
 * @param {string} email - The email of the user.
 * @returns {User | null} The user object or null if not found.
 */
function findUserByEmail(email) {
    const users = getAllUsers();
    return users[email] || null;
}

/**
 * Logs a user in by setting the session key.
 * @param {string} email - The email of the user to log in.
 */
function login(email) {
    localStorage.setItem(SESSION_KEY, email);
}

/**
 * Logs the current user out by clearing the session key.
 */
function logout() {
    localStorage.removeItem(SESSION_KEY);
    window.location.href = HOME_URL;
}

/**
 * Gets the email of the current logged-in user.
 * @returns {string | null} The user's email or null if not logged in.
 */
function getSessionEmail() {
    return localStorage.getItem(SESSION_KEY);
}

/**
 * Retrieves the current logged-in user object.
 * @returns {User | null} The user object or null if not logged in.
 */
function getCurrentUser() {
    const email = getSessionEmail();
    if (email) {
        return findUserByEmail(email);
    }
    return null;
}

/**
 * Redirects to the login page if the user is not authenticated.
 */
function requireAuth() {
    if (!getSessionEmail()) {
        if (window.location.pathname !== REDIRECT_URL) {
            window.location.replace(REDIRECT_URL);
        }
    }
}

/**
 * Updates a user object in localStorage.
 * @param {User} user - The user object to update.
 */
function updateUser(user) {
    saveUser(user);
}

// Export for use in other files
window.auth = {
    generateSalt,
    hashPassword,
    saveUser,
    findUserByEmail,
    login,
    logout,
    getSessionEmail,
    getCurrentUser,
    requireAuth,
    updateUser,
    USERS_KEY,
    SESSION_KEY,
    REDIRECT_URL,
    HOME_URL
};

// Immediately check for auth on protected pages
// This will be called on profile.html
if (document.body.classList.contains('protected')) {
    requireAuth();
}
