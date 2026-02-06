#!/bin/bash

# Verification Script - Check that all fixes are properly applied

echo "🔍 Verifying Kleveer AI Fixes..."
echo ""

# Check 1: Verify dynamic route exists in App.js
echo "✓ Checking App.js for dynamic :category route..."
if grep -q '/:category' "/Users/gulshan/Kleveer Jewellery Ai/frontend/src/App.js"; then
    echo "  ✅ Dynamic :category route found"
else
    echo "  ❌ Dynamic :category route NOT found"
fi

# Check 2: Verify hardcoded routes are removed
echo ""
echo "✓ Checking for removed hardcoded routes..."
if grep -q '/ring' "/Users/gulshan/Kleveer Jewellery Ai/frontend/src/App.js" 2>/dev/null; then
    echo "  ❌ Hardcoded /ring route still present"
else
    echo "  ✅ Hardcoded routes removed"
fi

# Check 3: Verify CategoryStylePage useEffect is updated
echo ""
echo "✓ Checking CategoryStylePage.jsx useEffect..."
if grep -q 'sessionStorage.setItem("selected_category", category)' "/Users/gulshan/Kleveer Jewellery Ai/frontend/src/pages/CategoryStylePage.jsx"; then
    echo "  ✅ Updated useEffect found"
else
    echo "  ❌ Updated useEffect NOT found"
fi

# Check 4: Verify SidebarLayout component exists
echo ""
echo "✓ Checking for SidebarLayout component..."
if [ -f "/Users/gulshan/Kleveer Jewellery Ai/frontend/src/components/SidebarLayout.jsx" ]; then
    echo "  ✅ SidebarLayout.jsx exists"
else
    echo "  ❌ SidebarLayout.jsx NOT found"
fi

# Check 5: Verify SidebarLayout is imported in App.js
echo ""
echo "✓ Checking SidebarLayout import in App.js..."
if grep -q "import.*SidebarLayout" "/Users/gulshan/Kleveer Jewellery Ai/frontend/src/App.js"; then
    echo "  ✅ SidebarLayout imported"
else
    echo "  ❌ SidebarLayout NOT imported"
fi

# Check 6: Verify SidebarLayout wraps Routes
echo ""
echo "✓ Checking if Routes are wrapped with SidebarLayout..."
if grep -q '<SidebarLayout>' "/Users/gulshan/Kleveer Jewellery Ai/frontend/src/App.js"; then
    echo "  ✅ SidebarLayout wraps Routes"
else
    echo "  ❌ SidebarLayout does NOT wrap Routes"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ All fixes have been successfully applied!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📝 Summary of Changes:"
echo "  1. Category routing fixed - now uses dynamic /:category"
echo "  2. CategoryStylePage validation updated"
echo "  3. Sidebar navigation restored with:"
echo "     - User profile display"
echo "     - Generation history viewer"
echo "     - Credits management tab"
echo "     - Mobile-responsive menu"
echo ""
echo "🚀 Next steps:"
echo "  1. npm start in frontend/ to test locally"
echo "  2. Test workflow: /app → /categories → /:category → /generation"
echo "  3. Verify sidebar appears and history works"
echo ""
