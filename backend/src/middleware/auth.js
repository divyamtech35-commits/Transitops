const { Client, Account } = require('node-appwrite');

const verifyJWT = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    // Initialize a scoped client with the user's JWT
    const client = new Client()
      .setEndpoint(process.env.APPWRITE_ENDPOINT)
      .setProject(process.env.APPWRITE_PROJECT_ID)
      .setJWT(token);

    const account = new Account(client);
    
    // Fetch the user profile (this validates the JWT)
    const user = await account.get();
    
    // Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    console.error('JWT Verification Error:', error.message);
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};

const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized: User not found' });
    }

    const userLabels = req.user.labels || [];
    
    // Check if the user has at least one of the allowed roles
    const hasRole = allowedRoles.some((role) => userLabels.includes(role));

    if (!hasRole) {
      return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
    }

    next();
  };
};

module.exports = {
  verifyJWT,
  requireRole,
};
