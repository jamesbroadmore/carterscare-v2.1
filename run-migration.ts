// Execute migration SQL against Supabase using the SQL execution endpoint
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im55bGVqZmNzemRrYW1ua2tqcnl0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDk2MjA1OSwiZXhwIjoyMDg2NTM4MDU5fQ.-LvFyX_vTm7v1SY3fKJN7iIMpVrL0FdmGUGuOf7Upnk";
const PROJECT_ID = "nylejfcszdkamnkkjryt";

const sql = await Bun.file("/home/user/carterscare/migration.sql").text();

// Split into individual statements and execute via rpc
// Use the Supabase Management API SQL endpoint
const resp = await fetch(`https://${PROJECT_ID}.supabase.co/rest/v1/rpc/`, {
  method: "POST",
  headers: {
    "apikey": SERVICE_KEY,
    "Authorization": `Bearer ${SERVICE_KEY}`,
    "Content-Type": "application/json",
    "Prefer": "params=single-object"
  },
  body: JSON.stringify({})
});

console.log("RPC status:", resp.status);
console.log("RPC body:", await resp.text());

// Try the pg endpoint approach - execute raw SQL
// Supabase exposes a /pg endpoint for project SQL execution
// Actually let's use the Supabase Management API approach
const mgmtResp = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_ID}/database/query`, {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${SERVICE_KEY}`,
    "Content-Type": "application/json"
  },
  body: JSON.stringify({ query: sql })
});

console.log("\nManagement API status:", mgmtResp.status);
const mgmtBody = await mgmtResp.text();
console.log("Management API body:", mgmtBody.slice(0, 500));
