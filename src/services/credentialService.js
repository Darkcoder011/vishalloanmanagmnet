import { getDatabase, ref, set, get } from 'firebase/database';
import { db } from './firebase';

// Encrypt password (basic encryption - you might want to use a more secure method)
const encryptPassword = (password) => {
  return btoa(password); // Basic base64 encoding
};

// Decrypt password
const decryptPassword = (encrypted) => {
  return atob(encrypted); // Basic base64 decoding
};

// Initialize default credentials if none exist
export const initializeCredentials = async () => {
  const credentialsRef = ref(db, 'admin_credentials');
  const snapshot = await get(credentialsRef);
  
  if (!snapshot.exists()) {
    await set(credentialsRef, {
      username: 'admin',
      password: encryptPassword('admin@123'),
      lastUpdated: new Date().toISOString()
    });
  }
};

// Get current credentials
export const getCurrentCredentials = async () => {
  const credentialsRef = ref(db, 'admin_credentials');
  const snapshot = await get(credentialsRef);
  
  if (snapshot.exists()) {
    const data = snapshot.val();
    return {
      username: data.username,
      password: decryptPassword(data.password),
      lastUpdated: data.lastUpdated
    };
  }
  return null;
};

// Update credentials
export const updateCredentials = async (oldUsername, oldPassword, newUsername, newPassword) => {
  try {
    // First verify old credentials
    const current = await getCurrentCredentials();
    if (!current || current.username !== oldUsername || current.password !== oldPassword) {
      throw new Error('वर्तमान क्रेडेन्शियल्स चुकीचे आहेत');
    }

    // Update with new credentials
    const credentialsRef = ref(db, 'admin_credentials');
    await set(credentialsRef, {
      username: newUsername,
      password: encryptPassword(newPassword),
      lastUpdated: new Date().toISOString()
    });

    return true;
  } catch (error) {
    throw error;
  }
};

// Verify credentials
export const verifyCredentials = async (username, password) => {
  const current = await getCurrentCredentials();
  return current && current.username === username && current.password === password;
};
