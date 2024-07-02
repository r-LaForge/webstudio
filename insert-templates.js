const { Client } = require("pg");
const { readFileSync } = require("node:fs");

function escapeJsonString(str) {
  return str
    .replace(/\\/g, "\\\\") // Escape backslashes
    .replace(/"/g, '\\"') // Escape double quotes
    .replace(/'/g, `\\'`) // Escape double quotes
    .replace(/\//g, "\\/") // Escape forward slashes (if necessary)
    .replace(/\b/g, "\\b") // Escape backspace
    .replace(/\f/g, "\\f") // Escape form feed
    .replace(/\n/g, "\\n") // Escape newline
    .replace(/\r/g, "\\r") // Escape carriage return
    .replace(/\t/g, "\\t"); // Escape tab
}

// Define the database connection details
const client = new Client({
  host: "localhost", // e.g., 'localhost'
  port: 5432, // default PostgreSQL port
  user: "postgres", // your database username
  password: "pass", // your database password
  database: "webstudio", // your database name
});

async function doWork() {
  try {
    await client.connect();
    const rows = await client.query("SELECT NOW()");
    // console.log(rows);

    const template = JSON.parse(
      readFileSync("./fixtures/templates/marketplace.json", "utf8")
    );
    const testTemplateId = "40bb9538-22f0-4588-b8c6-d927704f1cc7";

    // await client.query(`DELETE FROM "Build"`);
    // await client.query(`DELETE FROM "AuthorizationToken"`);
    // await client.query(`DELETE FROM "Project"`);
    // await client.query(`DELETE FROM "DashboardProject"`);
    // await client.query(`DELETE FROM "Team"`);
    // await client.query(`DELETE FROM "User"`);

    await client.query(
      `DELETE FROM "Build" WHERE id = '${testTemplateId}-build'`
    );
    await client.query(`DELETE FROM "Project" WHERE id = '${testTemplateId}'`);
    await client.query(
      `DELETE FROM "DashboardProject" WHERE id = '${testTemplateId}'`
    );
    await client.query(`DELETE FROM "Team" WHERE id = 'test-team'`);
    await client.query(`DELETE FROM "User" WHERE id = 'test-user'`);

    // Ensure test team exists
    await client.query(`INSERT INTO "Team" (id) VALUES ('test-team')`);
    await client.query(
      `INSERT INTO "User" ("id", "email", "provider", "username", "teamId") VALUES ('test-user', 'test@example.com', 'github', 'r-LaForge-test', 'test-team')`
    );
    await client.query(
      `INSERT INTO "DashboardProject" ("id", "title", "domain", "userId", "marketplaceApprovalStatus") VALUES ('${testTemplateId}', 'Marketpace template', 'test-domain', 'test-user', 'UNLISTED')`
    );

    const prep = (s) => `[${JSON.stringify(s)}]`;
    const b = template.build;
    const query = `INSERT INTO "Build" 
("id", "pages", "projectId", "styleSources", "styles", "breakpoints", "styleSourceSelections", "instances", "deployment", "dataSources" ,"resources")
VALUES ('${testTemplateId}-build', $1, '${testTemplateId}', $2, $3, $4, $5, $6, $7, $8, $9)
`;
    // VALUES ('test-marketplace-build', '${prep(template.build.pages)}', 'test-marketplace', '${prep(template.build.styleSources ?? [])}', '${prep(template.build.styles ?? [])}', '${prep(template.build.breakpoints ?? [])}', '${prep(template.build.styleSourceSelections ?? [])}', '${prep(template.build.instances ?? [])}', '${prep(template.build.deployment ?? [])}', '${prep(template.build.dataSources ?? [])}', '${prep(template.build.resources ?? [])}')
    const values = [
      prep(b.pages ?? []),
      prep(b.styleSources ?? []),
      prep(b.styles ?? []),
      prep(b.breakpoints ?? []),
      prep(b.styleSourceSelections ?? []),
      prep(b.instances ?? []),
      prep(b.deployment ?? []),
      prep(b.dataSources ?? []),
      prep(b.resources ?? []),
    ];
    await client.query(query, values);

    console.log(template);
  } catch (err) {
    console.error("Connection error", err.stack);
  } finally {
    client.end();
  }
}

doWork();
