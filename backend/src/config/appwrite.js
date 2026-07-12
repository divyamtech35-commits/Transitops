const { Client, TablesDB, Teams, Users } = require('node-appwrite');

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT)
  .setProject(process.env.APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const tablesDB = new TablesDB(client);
const teams = new Teams(client);
const users = new Users(client);

module.exports = { client, tablesDB, teams, users };
