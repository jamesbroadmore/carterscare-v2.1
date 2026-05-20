#!/bin/bash
# Setup script for new Supabase project
# Creates auth user, profile, and admin role

SUPABASE_URL="https://nylejfcszdkamnkkjryt.supabase.co"
SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im55bGVqZmNzemRrYW1ua2tqcnl0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDk2MjA1OSwiZXhwIjoyMDg2NTM4MDU5fQ.-LvFyX_vTm7v1SY3fKJN7iIMpVrL0FdmGUGuOf7Upnk"

EMAIL="jamesbroadmore@gmail.com"
PASSWORD="Cart3rsCar3!2026"

echo "=== Step 1: Create auth user ==="
USER_RESPONSE=$(curl -s -X POST "$SUPABASE_URL/auth/v1/admin/users" \
  -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
  -H "apikey: $SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$EMAIL\",
    \"password\": \"$PASSWORD\",
    \"email_confirm\": true
  }")

echo "$USER_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$USER_RESPONSE"

USER_ID=$(echo "$USER_RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])" 2>/dev/null)

if [ -z "$USER_ID" ]; then
  echo "ERROR: Failed to extract user ID. Check response above."
  exit 1
fi

echo ""
echo "User ID: $USER_ID"
echo ""

echo "=== Step 2: Create staff record ==="
STAFF_RESPONSE=$(curl -s -X POST "$SUPABASE_URL/rest/v1/staff" \
  -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
  -H "apikey: $SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d "{
    \"first_name\": \"James\",
    \"last_name\": \"Broadmore\",
    \"email\": \"$EMAIL\",
    \"role\": \"admin\",
    \"employment_type\": \"permanent\",
    \"status\": \"active\",
    \"user_id\": \"$USER_ID\"
  }")

echo "$STAFF_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$STAFF_RESPONSE"

STAFF_ID=$(echo "$STAFF_RESPONSE" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d[0]['id'] if isinstance(d,list) else d['id'])" 2>/dev/null)

echo ""
echo "Staff ID: $STAFF_ID"
echo ""

echo "=== Step 3: Create profile ==="
curl -s -X POST "$SUPABASE_URL/rest/v1/profiles" \
  -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
  -H "apikey: $SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d "{
    \"user_id\": \"$USER_ID\",
    \"staff_id\": \"$STAFF_ID\",
    \"display_name\": \"James Broadmore\"
  }" | python3 -m json.tool 2>/dev/null

echo ""

echo "=== Step 4: Create admin role ==="
curl -s -X POST "$SUPABASE_URL/rest/v1/user_roles" \
  -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
  -H "apikey: $SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d "{
    \"user_id\": \"$USER_ID\",
    \"role\": \"admin\"
  }" | python3 -m json.tool 2>/dev/null

echo ""
echo "=== DONE ==="
echo "Login: $EMAIL / $PASSWORD"
echo "User ID: $USER_ID"
echo "Staff ID: $STAFF_ID"
