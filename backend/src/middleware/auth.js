const { client, teams, users } = require('../config/appwrite');
const { APPWRITE_TEAM_ID } = process.env;

async function verifyJWT(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: true, message: 'Missing Authorization header' });
  }

  const jwt = header.split(' ')[1];

  try {
    client.setJWT(jwt);
    const account = await users.get('me');
    req.user = account;

    const memberships = await teams.listMemberships(APPWRITE_TEAM_ID);
    const membership = memberships.memberships.find(
      (m) => m.userId === account.$id
    );
    req.userRole = membership ? membership.roles[0] : null;

    next();
  } catch (err) {
    return res.status(401).json({ error: true, message: 'Invalid or expired token' });
  }
}

function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.userRole || !allowedRoles.includes(req.userRole)) {
      return res.status(403).json({ error: true, message: 'Insufficient permissions' });
    }
    next();
  };
}

module.exports = { verifyJWT, requireRole };
