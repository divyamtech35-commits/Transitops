require('dotenv').config();
const { Client, Users, ID } = require('node-appwrite');

async function seedUsers() {
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

  const users = new Users(client);

  const defaultUsers = [
    { email: 'fleet@transitops.in', password: 'password123', name: 'Fleet Manager', label: 'FleetManager' },
    { email: 'driver@transitops.in', password: 'password123', name: 'Driver', label: 'Driver' },
    { email: 'safety@transitops.in', password: 'password123', name: 'Safety Officer', label: 'SafetyOfficer' },
    { email: 'finance@transitops.in', password: 'password123', name: 'Financial Analyst', label: 'FinancialAnalyst' },
  ];

  for (const u of defaultUsers) {
    try {
      // Create user
      const user = await users.create(ID.unique(), u.email, undefined, u.password, u.name);
      console.log(`User created: ${u.email}`);
      
      // Assign label
      await users.updateLabels(user.$id, [u.label]);
      console.log(`Assigned label '${u.label}' to ${u.email}`);
    } catch (err) {
      if (err.code === 409) {
        console.log(`User ${u.email} already exists. Skipping.`);
      } else {
        console.error(`Error creating ${u.email}:`, err.message);
      }
    }
  }
}

seedUsers();
