let adminApp;
function getAdminApp() {
  if (!adminApp) {
    const { initializeApp, getApps, cert } = require('firebase-admin/app');
    if (!getApps().length) {
      adminApp = initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        }),
      });
    } else {
      adminApp = getApps()[0];
    }
  }
  return adminApp;
}

function getAuth() {
  getAdminApp();
  return require('firebase-admin/auth').getAuth();
}

function getFirestore() {
  getAdminApp();
  return require('firebase-admin/firestore').getFirestore();
}

module.exports = { getAuth, getFirestore };
