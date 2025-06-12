// pages/api/sessionLogin.js

export default async function handler(req, res) {
  const { getAuth } = require('firebase-admin/auth');
  const { initializeApp, getApps, cert } = require('firebase-admin/app');

  if (!process.env.FIREBASE_PRIVATE_KEY) {
    console.error('Missing FIREBASE_PRIVATE_KEY env variable');
    return res.status(500).send('Server misconfiguration');
  }

  if (!getApps().length) {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }),
    });
  }

  if (req.method !== 'POST') return res.status(405).end();
  const { idToken } = req.body;
  const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days

  try {
    if (!idToken) {
      console.error('[sessionLogin] No idToken provided');
      return res.status(400).send('No idToken provided');
    }
    const sessionCookie = await getAuth().createSessionCookie(idToken, { expiresIn });
    // Only add Secure if running in production
    const isProd = process.env.NODE_ENV === 'production';
    const cookie = [
      `session=${sessionCookie}`,
      'Path=/',
      'HttpOnly',
      'SameSite=Strict',
      `Max-Age=${expiresIn / 1000}`,
      isProd ? 'Secure' : '', // Only add Secure in production
    ].filter(Boolean).join('; ');

    res.setHeader('Set-Cookie', cookie);
    res.status(200).end();
  } catch (error) {
    console.error('[sessionLogin] Error:', error);
    res.status(500).send('INTERNAL SERVER ERROR');
  }
}