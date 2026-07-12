const login = async (req, res) => {
  const { email, password } = req.body;
  const emailClean = email?.trim();
  const ENDPOINT = process.env.APPWRITE_ENDPOINT;
  const PROJECT_ID = process.env.APPWRITE_PROJECT_ID;

  try {
    // 1. Create a session to get the cookie
    const sessionRes = await fetch(`${ENDPOINT}/account/sessions/email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Appwrite-Project': PROJECT_ID,
      },
      body: JSON.stringify({ email: emailClean, password })
    });

    if (!sessionRes.ok) {
      const err = await sessionRes.json();
      console.log('Appwrite rejected login:', err);
      return res.status(sessionRes.status).json({ error: err.message || 'Invalid credentials' });
    }

    const sessionCookie = sessionRes.headers.get('set-cookie');

    // 2. Fetch User Profile
    const userRes = await fetch(`${ENDPOINT}/account`, {
      headers: {
        'X-Appwrite-Project': PROJECT_ID,
        'Cookie': sessionCookie
      }
    });
    const user = await userRes.json();

    // 3. Generate JWT
    const jwtRes = await fetch(`${ENDPOINT}/account/jwt`, {
      method: 'POST',
      headers: {
        'X-Appwrite-Project': PROJECT_ID,
        'Cookie': sessionCookie
      }
    });
    
    if (!jwtRes.ok) {
        return res.status(500).json({ error: 'Failed to generate JWT' });
    }
    
    const { jwt } = await jwtRes.json();

    const role = user.labels && user.labels.length > 0 ? user.labels[0] : 'User';

    res.json({ jwt, user, role });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const getCurrentUser = async (req, res) => {
  try {
    const user = req.user; // Attached by verifyJWT middleware
    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
};

module.exports = { login, getCurrentUser };
