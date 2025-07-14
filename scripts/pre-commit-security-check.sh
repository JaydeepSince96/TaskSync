#!/bin/bash

# Pre-commit hook to prevent committing sensitive files
# Place this file in .git/hooks/pre-commit and make it executable

echo "🔒 Running security checks before commit..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Flag to track if commit should be blocked
BLOCK_COMMIT=false

# Check for .env files
echo "🔍 Checking for environment files..."
if git diff --cached --name-only | grep -E "\.env(\.|$)"; then
    echo -e "${RED}❌ ERROR: Attempting to commit .env files!${NC}"
    echo -e "${YELLOW}   Found environment files in staging area:${NC}"
    git diff --cached --name-only | grep -E "\.env(\.|$)" | sed 's/^/   - /'
    echo -e "${YELLOW}   These files may contain sensitive credentials.${NC}"
    BLOCK_COMMIT=true
fi

# Check for potential secrets in staged files
echo "🔍 Checking for potential secrets..."
SUSPICIOUS_PATTERNS=(
    "TWILIO_ACCOUNT_SID=AC[a-f0-9]{32}"
    "TWILIO_AUTH_TOKEN=[a-f0-9]{32}"
    "EMAIL_PASS=[a-zA-Z0-9]{16}"
    "ONESIGNAL_APP_ID=[a-f0-9-]{36}"
    "ONESIGNAL_API_KEY=[a-zA-Z0-9+/=]{40,}"
    "password.*=.*[a-zA-Z0-9]{8,}"
    "secret.*=.*[a-zA-Z0-9]{8,}"
    "key.*=.*[a-zA-Z0-9]{8,}"
)

for pattern in "${SUSPICIOUS_PATTERNS[@]}"; do
    if git diff --cached | grep -E "$pattern" > /dev/null; then
        echo -e "${RED}❌ ERROR: Potential secret found in staged changes!${NC}"
        echo -e "${YELLOW}   Pattern: $pattern${NC}"
        BLOCK_COMMIT=true
    fi
done

# Check for hardcoded localhost URLs in production files
echo "🔍 Checking for hardcoded URLs..."
if git diff --cached | grep -E "http://localhost:[0-9]+" > /dev/null; then
    echo -e "${YELLOW}⚠️  WARNING: Found hardcoded localhost URLs${NC}"
    echo -e "${YELLOW}   Make sure these are not for production use.${NC}"
fi

# Check file permissions on sensitive files
echo "🔍 Checking file permissions..."
for file in .env .env.local .env.production; do
    if [ -f "$file" ]; then
        permissions=$(stat -c "%a" "$file" 2>/dev/null || stat -f "%A" "$file" 2>/dev/null)
        if [ "$permissions" != "600" ] && [ "$permissions" != "400" ]; then
            echo -e "${YELLOW}⚠️  WARNING: $file has permissions $permissions${NC}"
            echo -e "${YELLOW}   Consider: chmod 600 $file${NC}"
        fi
    fi
done

# Final decision
if [ "$BLOCK_COMMIT" = true ]; then
    echo ""
    echo -e "${RED}🚫 COMMIT BLOCKED for security reasons!${NC}"
    echo ""
    echo -e "${YELLOW}To fix:${NC}"
    echo "1. Remove sensitive files from staging: git reset HEAD <file>"
    echo "2. Move secrets to .env files (already in .gitignore)"
    echo "3. Use environment variables or placeholders"
    echo "4. Review SECURITY_CONFIGURATION.md for guidance"
    echo ""
    echo -e "${YELLOW}To bypass this check (NOT RECOMMENDED):${NC}"
    echo "git commit --no-verify"
    echo ""
    exit 1
else
    echo -e "${GREEN}✅ Security checks passed!${NC}"
    echo ""
fi

exit 0
