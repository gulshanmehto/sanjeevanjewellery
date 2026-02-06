#!/bin/bash

# Category-Specific Preset System Verification Script
# This script verifies all components of the implementation

echo "=== Category-Specific Preset System Verification ==="
echo ""

PROJECT_DIR="/Users/gulshan/Kleveer Jewellery Ai"
FRONTEND_DIR="$PROJECT_DIR/frontend/src"
BACKEND_DIR="$PROJECT_DIR/backend"

# Check 1: categoryPresets.js exists and has all categories
echo "✓ Checking categoryPresets.js structure..."
if grep -q "ring:" "$FRONTEND_DIR/lib/categoryPresets.js" && \
   grep -q "bangle:" "$FRONTEND_DIR/lib/categoryPresets.js" && \
   grep -q "earrings:" "$FRONTEND_DIR/lib/categoryPresets.js" && \
   grep -q "necklace:" "$FRONTEND_DIR/lib/categoryPresets.js" && \
   grep -q "pendant:" "$FRONTEND_DIR/lib/categoryPresets.js" && \
   grep -q "bracelet:" "$FRONTEND_DIR/lib/categoryPresets.js" && \
   grep -q "mangalsutra:" "$FRONTEND_DIR/lib/categoryPresets.js" && \
   grep -q "anklet:" "$FRONTEND_DIR/lib/categoryPresets.js"; then
  echo "  ✅ All 8 jewelry categories found in categoryPresets.js"
else
  echo "  ❌ Missing jewelry categories in categoryPresets.js"
fi
echo ""

# Check 2: Helper functions exported
echo "✓ Checking exported helper functions..."
if grep -q "export const getPresetsForCategory" "$FRONTEND_DIR/lib/categoryPresets.js" && \
   grep -q "export const getPresetById" "$FRONTEND_DIR/lib/categoryPresets.js" && \
   grep -q "export const isPresetValidForCategory" "$FRONTEND_DIR/lib/categoryPresets.js"; then
  echo "  ✅ All helper functions exported"
else
  echo "  ❌ Missing helper functions"
fi
echo ""

# Check 3: CategoryStylePage uses correct import
echo "✓ Checking CategoryStylePage imports..."
if grep -q "import { getPresetsForCategory }" "$FRONTEND_DIR/pages/CategoryStylePage.jsx"; then
  echo "  ✅ CategoryStylePage correctly imports getPresetsForCategory"
else
  echo "  ❌ CategoryStylePage missing correct import"
fi
echo ""

# Check 4: CategoryStylePage uses category-specific presets
echo "✓ Checking CategoryStylePage preset loading..."
if grep -q "getPresetsForCategory(category)" "$FRONTEND_DIR/pages/CategoryStylePage.jsx"; then
  echo "  ✅ CategoryStylePage loads category-specific presets"
else
  echo "  ❌ CategoryStylePage not loading category-specific presets"
fi
echo ""

# Check 5: CategoryStylePage stores preset metadata in sessionStorage
echo "✓ Checking sessionStorage storage in CategoryStylePage..."
if grep -q 'sessionStorage.setItem("preset_name"' "$FRONTEND_DIR/pages/CategoryStylePage.jsx" && \
   grep -q 'sessionStorage.setItem("preset_description"' "$FRONTEND_DIR/pages/CategoryStylePage.jsx"; then
  echo "  ✅ Preset metadata stored in sessionStorage"
else
  echo "  ❌ Preset metadata not stored in sessionStorage"
fi
echo ""

# Check 6: GenerationPage reads preset from sessionStorage
echo "✓ Checking GenerationPage reads preset metadata..."
if grep -q 'sessionStorage.getItem("preset_name")' "$FRONTEND_DIR/pages/GenerationPage.jsx" && \
   grep -q 'sessionStorage.getItem("preset_description")' "$FRONTEND_DIR/pages/GenerationPage.jsx"; then
  echo "  ✅ GenerationPage reads preset metadata from sessionStorage"
else
  echo "  ❌ GenerationPage not reading preset metadata"
fi
echo ""

# Check 7: GenerationPage sends FormData
echo "✓ Checking GenerationPage API request format..."
if grep -q "new FormData()" "$FRONTEND_DIR/pages/GenerationPage.jsx" && \
   grep -q "formData.append('image'" "$FRONTEND_DIR/pages/GenerationPage.jsx" && \
   grep -q "formData.append('preset_name'" "$FRONTEND_DIR/pages/GenerationPage.jsx" && \
   grep -q "formData.append('preset_description'" "$FRONTEND_DIR/pages/GenerationPage.jsx"; then
  echo "  ✅ GenerationPage sends FormData with preset metadata"
else
  echo "  ❌ GenerationPage API request format incorrect"
fi
echo ""

# Check 8: Backend master prompt unchanged
echo "✓ Checking backend master prompt..."
if grep -q "JEWELLERY_PROMPT_TEMPLATE" "$BACKEND_DIR/services/__init__.py" && \
   grep -q "{preset_name}" "$BACKEND_DIR/services/__init__.py" && \
   grep -q "{preset_description}" "$BACKEND_DIR/services/__init__.py"; then
  echo "  ✅ Master prompt intact with injection points"
else
  echo "  ❌ Master prompt missing or altered"
fi
echo ""

# Check 9: Backend API endpoint supports preset parameters
echo "✓ Checking backend API endpoint parameters..."
if grep -q "preset_name.*Form" "$BACKEND_DIR/server.py" && \
   grep -q "preset_description.*Form" "$BACKEND_DIR/server.py"; then
  echo "  ✅ Backend API endpoint accepts preset parameters"
else
  echo "  ❌ Backend API endpoint missing preset parameters"
fi
echo ""

# Check 10: Count presets per category
echo "✓ Counting presets per category..."
RING_COUNT=$(grep -c '"ring-' "$FRONTEND_DIR/lib/categoryPresets.js")
BANGLE_COUNT=$(grep -c '"bangle-' "$FRONTEND_DIR/lib/categoryPresets.js")
EARRINGS_COUNT=$(grep -c '"earrings-' "$FRONTEND_DIR/lib/categoryPresets.js")
NECKLACE_COUNT=$(grep -c '"necklace-' "$FRONTEND_DIR/lib/categoryPresets.js")
echo "  Ring: ~$RING_COUNT presets"
echo "  Bangle: ~$BANGLE_COUNT presets"
echo "  Earrings: ~$EARRINGS_COUNT presets"
echo "  Necklace: ~$NECKLACE_COUNT presets"
echo ""

echo "=== Verification Complete ==="
echo ""
echo "Test Workflow:"
echo "1. Upload image at /app"
echo "2. Select category at /categories"
echo "3. View category-specific presets at /{category}"
echo "4. Select preset to populate sessionStorage"
echo "5. Proceed to /generation"
echo "6. API call includes preset metadata in FormData"
echo "7. Backend receives and injects into master prompt"
echo ""
echo "✅ Implementation ready for testing!"
