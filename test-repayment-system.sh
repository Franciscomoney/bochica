#!/bin/bash

# Test script for Bochica Repayment Tracking System
# This script verifies that all components are properly installed

echo "======================================"
echo "Bochica Repayment System Test Script"
echo "======================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test results
PASSED=0
FAILED=0

# Function to test file existence
test_file() {
    local file=$1
    local description=$2

    if [ -f "$file" ]; then
        echo -e "${GREEN}✓${NC} $description"
        ((PASSED++))
    else
        echo -e "${RED}✗${NC} $description - FILE NOT FOUND: $file"
        ((FAILED++))
    fi
}

# Function to test directory existence
test_dir() {
    local dir=$1
    local description=$2

    if [ -d "$dir" ]; then
        echo -e "${GREEN}✓${NC} $description"
        ((PASSED++))
    else
        echo -e "${RED}✗${NC} $description - DIRECTORY NOT FOUND: $dir"
        ((FAILED++))
    fi
}

# Test 1: Database Migration
echo "1. Database Migration"
test_file "/home/debian/bochica/migrations/007_add_repayment_tracking.sql" "Migration file exists"
echo ""

# Test 2: API Endpoints
echo "2. API Endpoints"
test_file "/home/debian/bochica/app/api/repay/route.ts" "Main repayment API endpoint"
test_file "/home/debian/bochica/app/api/repay/check-all/route.ts" "Automated checker API endpoint"
echo ""

# Test 3: UI Components
echo "3. UI Components"
test_file "/home/debian/bochica/components/RepaymentTracker.tsx" "RepaymentTracker component"
echo ""

# Test 4: Automation Scripts
echo "4. Automation Scripts"
test_file "/home/debian/bochica/setup-repayment-cron.sh" "Cron setup script"
test_dir "/home/debian/bochica/scripts" "Scripts directory (created after cron setup)"
echo ""

# Test 5: Documentation
echo "5. Documentation"
test_file "/home/debian/bochica/REPAYMENT-TRACKING-SYSTEM.md" "System documentation"
echo ""

# Test 6: Permissions
echo "6. File Permissions"
if [ -x "/home/debian/bochica/setup-repayment-cron.sh" ]; then
    echo -e "${GREEN}✓${NC} Cron setup script is executable"
    ((PASSED++))
else
    echo -e "${RED}✗${NC} Cron setup script is NOT executable"
    ((FAILED++))
fi
echo ""

# Summary
echo "======================================"
echo "Test Summary"
echo "======================================"
echo -e "Passed: ${GREEN}$PASSED${NC}"
echo -e "Failed: ${RED}$FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}All tests passed!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Run the migration in Supabase SQL Editor"
    echo "   Location: migrations/007_add_repayment_tracking.sql"
    echo ""
    echo "2. Set up automated checks (optional):"
    echo "   cd /home/debian/bochica"
    echo "   ./setup-repayment-cron.sh"
    echo ""
    echo "3. Add RepaymentTracker component to project detail page"
    echo "   Import: import RepaymentTracker from '@/components/RepaymentTracker';"
    echo ""
    echo "4. Test the API:"
    echo "   curl -X POST https://51.178.253.51:8100/api/repay \\"
    echo "     -H 'Content-Type: application/json' \\"
    echo "     -d '{\"projectId\": \"your-uuid\", \"checkerType\": \"manual\"}' -k"
    echo ""
    exit 0
else
    echo -e "${RED}Some tests failed. Please review the errors above.${NC}"
    exit 1
fi
