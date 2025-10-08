#!/bin/bash

# Setup automated repayment checker cron job for Bochica
# This script configures a cron job to check all active loans periodically

CRON_SCRIPT="/home/debian/bochica/scripts/check-repayments.sh"
API_KEY="bochica-repayment-checker-2025"
APP_URL="https://51.178.253.51:8100"

echo "Setting up Bochica automated repayment checker..."

# 1. Create scripts directory if it doesn't exist
mkdir -p /home/debian/bochica/scripts

# 2. Create the checker script
cat > "$CRON_SCRIPT" << 'EOF'
#!/bin/bash

# Bochica Automated Repayment Checker
# Checks all active loans for repayment and updates status automatically

LOG_FILE="/home/debian/bochica/logs/repayment-checker.log"
API_KEY="bochica-repayment-checker-2025"
APP_URL="https://51.178.253.51:8100"

# Create logs directory if it doesn't exist
mkdir -p /home/debian/bochica/logs

# Log the check
echo "======================================" >> "$LOG_FILE"
echo "Repayment Check: $(date)" >> "$LOG_FILE"
echo "======================================" >> "$LOG_FILE"

# Call the automated checker API (using -k to skip SSL cert verification for self-signed cert)
curl -k -s "${APP_URL}/api/repay/check-all?apiKey=${API_KEY}" >> "$LOG_FILE" 2>&1

echo "" >> "$LOG_FILE"
echo "Check completed at $(date)" >> "$LOG_FILE"
echo "" >> "$LOG_FILE"

# Keep only last 1000 lines of log
tail -1000 "$LOG_FILE" > "${LOG_FILE}.tmp" && mv "${LOG_FILE}.tmp" "$LOG_FILE"
EOF

# 3. Make the script executable
chmod +x "$CRON_SCRIPT"

echo "✓ Created checker script at: $CRON_SCRIPT"

# 4. Add cron job (check every 6 hours)
# Remove any existing repayment checker cron jobs first
crontab -l 2>/dev/null | grep -v "check-repayments.sh" > /tmp/crontab.tmp

# Add new cron job: Run at 0:00, 6:00, 12:00, and 18:00 every day
echo "0 */6 * * * $CRON_SCRIPT" >> /tmp/crontab.tmp

# Install the new crontab
crontab /tmp/crontab.tmp
rm /tmp/crontab.tmp

echo "✓ Added cron job: Checks every 6 hours"

# 5. Display cron schedule
echo ""
echo "Current crontab:"
crontab -l | grep "check-repayments.sh"

echo ""
echo "======================================"
echo "Setup Complete!"
echo "======================================"
echo ""
echo "Automated repayment checker is now configured to run every 6 hours."
echo ""
echo "Manual usage:"
echo "  - Run now: $CRON_SCRIPT"
echo "  - View logs: tail -f /home/debian/bochica/logs/repayment-checker.log"
echo "  - Test API: curl -k '$APP_URL/api/repay/check-all?apiKey=$API_KEY'"
echo ""
echo "Cron schedule: 0 */6 * * * (every 6 hours at 0:00, 6:00, 12:00, 18:00)"
echo ""
