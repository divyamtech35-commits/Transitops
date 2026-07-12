require('dotenv').config();
const { Client, Users } = require('node-appwrite');

async function fixLabels() {
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

  const users = new Users(client);
  const list = await users.list();

  for (const user of list.users) {
    let label = '';
    if (user.email.includes('fleet')) label = 'FleetManager';
    if (user.email.includes('driver')) label = 'Driver';
    if (user.email.includes('safety')) label = 'SafetyOfficer';
    if (user.email.includes('finance')) label = 'FinancialAnalyst';
    
    if (label) {
      await users.updateLabels(user.$id, [label]);
      console.log('Updated', user.email, 'to', label);
    }
  }
}

fixLabels().catch(console.error);
