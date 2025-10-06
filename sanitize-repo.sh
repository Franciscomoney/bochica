#!/bin/bash

echo "🔒 BOCHICA REPOSITORY SECURITY SANITIZATION"
echo "==========================================="
echo ""

# Backup critical files first
echo "📦 Creating backup..."
mkdir -p .sanitization-backup
cp -r *.md .env.local ADMIN_CREDENTIALS.txt .sanitization-backup/ 2>/dev/null
echo "✅ Backup created in .sanitization-backup/"
echo ""

# 1. Replace server addresses
echo "1️⃣ Sanitizing server addresses..."
find . -type f \( -name "*.md" -o -name "*.tsx" -o -name "*.ts" -o -name "*.js" -o -name "*.txt" -o -name "*.html" \) \
  -not -path "*/node_modules/*" \
  -not -path "*/.next/*" \
  -not -path "*/.git/*" \
  -not -path "*/.turbo/*" \
  -not -path "*/.sanitization-backup/*" \
  -exec sed -i 's|https://51\.178\.253\.51:8100|http://localhost:3000|g' {} \;

find . -type f \( -name "*.md" -o -name "*.tsx" -o -name "*.ts" -o -name "*.js" -o -name "*.txt" -o -name "server.js" \) \
  -not -path "*/node_modules/*" \
  -not -path "*/.next/*" \
  -not -path "*/.git/*" \
  -not -path "*/.turbo/*" \
  -not -path "*/.sanitization-backup/*" \
  -exec sed -i 's|51\.178\.253\.51:8100|localhost:3000|g' {} \;

find . -type f \( -name "*.md" -o -name "*.tsx" -o -name "*.ts" -o -name "*.js" -o -name "*.txt" \) \
  -not -path "*/node_modules/*" \
  -not -path "*/.next/*" \
  -not -path "*/.git/*" \
  -not -path "*/.turbo/*" \
  -not -path "*/.sanitization-backup/*" \
  -exec sed -i 's|155\.138\.165\.47:8100|localhost:3000|g' {} \;

echo "   ✅ Server addresses sanitized"

# 2. Replace Supabase project ID
echo "2️⃣ Sanitizing Supabase project ID..."
find . -type f \( -name "*.md" -o -name "*.tsx" -o -name "*.ts" -o -name "*.js" -o -name "*.html" \) \
  -not -path "*/node_modules/*" \
  -not -path "*/.next/*" \
  -not -path "*/.git/*" \
  -not -path "*/.turbo/*" \
  -not -path "*/.sanitization-backup/*" \
  -exec sed -i 's|fvehyzvdffnxrmupwgtv|your-supabase-project-id|g' {} \;

echo "   ✅ Supabase project ID sanitized"

# 3. Replace wallet addresses
echo "3️⃣ Sanitizing wallet addresses..."
# Escrow wallet
find . -type f \( -name "*.md" -o -name "*.tsx" -o -name "*.ts" -o -name "*.js" \) \
  -not -path "*/node_modules/*" \
  -not -path "*/.next/*" \
  -not -path "*/.git/*" \
  -not -path "*/.turbo/*" \
  -not -path "*/.sanitization-backup/*" \
  -exec sed -i 's|15SF1r3zuTgRB8yt6mDSTcXtaQZqVv1YpDCyUoV7E3bSJfSf|5EXAMPLE_ESCROW_WALLET_ADDRESS_PLACEHOLDER|g' {} \;

# Platform commission wallet
find . -type f \( -name "*.md" -o -name "*.tsx" -o -name "*.ts" -o -name "*.js" \) \
  -not -path "*/node_modules/*" \
  -not -path "*/.next/*" \
  -not -path "*/.git/*" \
  -not -path "*/.turbo/*" \
  -not -path "*/.sanitization-backup/*" \
  -exec sed -i 's|13H5V7W5YHNNXh5bhMxXLEw4boe6R6mxEG5SFAThYyYteFLy|5EXAMPLE_PLATFORM_WALLET_ADDRESS_PLACEHOLDER|g' {} \;

echo "   ✅ Wallet addresses sanitized"

# 4. Replace admin credentials
echo "4️⃣ Sanitizing admin credentials..."
find . -type f \( -name "*.md" -o -name "*.txt" \) \
  -not -path "*/node_modules/*" \
  -not -path "*/.next/*" \
  -not -path "*/.git/*" \
  -not -path "*/.turbo/*" \
  -not -path "*/.sanitization-backup/*" \
  -exec sed -i 's|Bochica2025!|CHANGE_ME_IN_PRODUCTION|g' {} \;

echo "   ✅ Admin credentials sanitized"

# 5. Remove sensitive files
echo "5️⃣ Removing sensitive files..."
rm -f ADMIN_CREDENTIALS.txt
rm -f .env.local
rm -f key.pem cert.pem
echo "   ✅ Sensitive files removed"

echo ""
echo "✅ SANITIZATION COMPLETE!"
echo ""
echo "Summary of changes:"
echo "  - Server addresses: 51.178.253.51:8100 → localhost:3000"
echo "  - Supabase ID: fvehyzvdffnxrmupwgtv → your-supabase-project-id"
echo "  - Escrow wallet: 15SF... → 5EXAMPLE_ESCROW_WALLET..."
echo "  - Platform wallet: 13H5... → 5EXAMPLE_PLATFORM_WALLET..."
echo "  - Admin password: Bochica2025! → CHANGE_ME_IN_PRODUCTION"
echo "  - Removed: ADMIN_CREDENTIALS.txt, .env.local, key.pem, cert.pem"
echo ""
