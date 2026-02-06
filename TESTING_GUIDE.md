# Complete Workflow Test Guide

## Category-Specific Preset System End-to-End Test

This guide walks through testing the complete category-specific preset system implementation.

---

## Step 1: Upload Image

**URL**: `http://localhost:3000/app`

**Actions**:
1. Click upload area or drag-and-drop a jewelry image
2. Select or upload a clear, well-lit image of jewelry
3. Click "Continue to Generation"

**Expected Result**:
- Image displays in preview
- sessionStorage is populated:
  ```javascript
  sessionStorage.uploaded_image = "data:image/png;base64,..."
  ```
- Navigation to Step 2

---

## Step 2: Select Category

**URL**: `http://localhost:3000/categories`

**Actions**:
1. View 8 jewelry type buttons with custom icons
2. Click on a category (e.g., "Ring")
3. Click "Continue to Style"

**Expected Result**:
- sessionStorage updated:
  ```javascript
  sessionStorage.selected_category = "ring"
  ```
- Navigation to Step 3: `/ring`

**Browser DevTools Check**:
```javascript
// In browser console, verify:
sessionStorage.getItem("selected_category") // Should be "ring"
sessionStorage.getItem("uploaded_image")    // Should contain base64 image
```

---

## Step 3: Select Preset Style

**URL**: `http://localhost:3000/ring` (or other selected category)

**Actions**:
1. View category-specific presets
   - Ring: 8 presets (White Luxe, Black Velvet, Pastel Editorial, etc.)
   - Each shows name, description, and preview image
2. Click on a preset to select it
3. Click "Continue to Generation"

**Expected Result**:
- Selected preset highlighted with checkmark
- sessionStorage populated with preset data:
  ```javascript
  sessionStorage.selected_preset = "ring-white-ecommerce"
  sessionStorage.preset_name = "White Luxe E-Commerce"
  sessionStorage.preset_description = "Clean white background, soft natural shadows, high-clarity commercial jewellery photography optimized for e-commerce and catalogs."
  ```
- Navigation to Step 4

**Browser DevTools Check**:
```javascript
// In browser console, verify:
sessionStorage.getItem("selected_preset")       // "ring-white-ecommerce"
sessionStorage.getItem("preset_name")           // "White Luxe E-Commerce"
sessionStorage.getItem("preset_description")    // "Clean white background..."
```

---

## Step 4: Generate Image

**URL**: `http://localhost:3000/generation`

**Actions**:
1. Review original image and settings
2. Select aspect ratio from modal (e.g., 1:1 Square)
3. Click "Generate Image (1 Credit)"

**Expected Requests**:

The browser will make a POST request to `/api/generate` with **FormData**:

```http
POST http://localhost:32000/api/generate HTTP/1.1
Content-Type: multipart/form-data

image: [Blob: jewellery.png] (binary file data)
jewellery_type: ring
shoot_type: product
preset_name: White Luxe E-Commerce
preset_description: Clean white background, soft natural shadows, high-clarity commercial jewellery photography optimized for e-commerce and catalogs.
quality: HD
aspect_ratio: 1-1
```

**Expected Result**:
- Progress bar shows generation progress (0-100%)
- After ~10-15 seconds, generated image appears
- Credits deducted by 1
- User can download, regenerate, or create video

---

## Network Inspection (DevTools)

### Check Network Tab

1. Open DevTools (F12 → Network)
2. Go through the workflow
3. In the Generation step, look for the `/api/generate` request

**Request Details**:
```
Method: POST
URL: http://localhost:32000/api/generate
Headers:
  - No Content-Type header (auto-set by FormData)
  - No Authorization header (yet)

Body (Form Data):
  ✓ image: [File] jewellery.png
  ✓ jewellery_type: ring
  ✓ shoot_type: product
  ✓ preset_name: White Luxe E-Commerce
  ✓ preset_description: Clean white background...
  ✓ quality: HD
  ✓ aspect_ratio: 1-1
```

### Expected Response

```json
{
  "status": "completed",
  "image": "data:image/png;base64,...",
  "message": "Image generated successfully"
}
```

---

## Backend Verification

### Check Server Logs

The backend should log:
```
INFO: Generating product shoot for ring with preset: White Luxe E-Commerce
INFO: Prompt injected with preset_name: "White Luxe E-Commerce"
INFO: Prompt injected with preset_description: "Clean white background..."
```

### Master Prompt Injection Check

The prompt sent to Gemini should contain:
```
STYLE / PRESET:
White Luxe E-Commerce

SCENE & MOOD:
Clean white background, soft natural shadows, high-clarity commercial jewellery photography optimized for e-commerce and catalogs.
```

---

## Testing Different Categories

### Ring (8 presets)
1. White Luxe E-Commerce - Commercial/e-commerce
2. Black Velvet Spotlight - Dramatic/luxury
3. Pastel Editorial Studio - Editorial/fashion
4. Stone Pedestal Studio - Product showcase
5. Royal Box Display - Premium presentation
6. Sand Texture Minimal - Modern/minimalist
7. Midnight Blue Drama - Dramatic/contrast
8. Cream Sculptural Studio - Editorial/artistic

**Test**: Select Ring → Select "Black Velvet Spotlight" → Verify preset_description mentions "Deep black velvet studio background"

### Bangle (8 presets)
1. Heritage Teal Silk - Festival/traditional
2. Soft Blush Studio - Feminine/romantic
3. Champagne Gold Luxe - Festive/warm
4. Minimal Warm Drapery - Modern/clean
5. Mint Ceramic Plate - Fresh/minimal
6. Black Gold Contrast - Dramatic/texture
7. Sunlit Sand Studio - Natural/warm
8. Luxury White Minimal - Premium/clean

**Test**: Select Bangle → Select "Heritage Teal Silk" → Verify preset_description mentions "Indian heritage"

### Other Categories
- **Earrings** (8 presets) - White Commercial, Velvet Blush, Rustic Wood, Color Block, Desert Stone, Coastal Pastel, Black Studio, Cream Arch
- **Necklace** (8 presets) - Premium White, Rose Gold Drape, Emerald Silk, Gold Spotlight, Marble Backdrop, Sunset Gradient, Diamond Showcase, Luxury Moody
- **Pendant** (6 presets) - White Minimalist, Deep Emerald, Gold Sophisticated, Black Studio, Pastel Soft, Luxury Showcase
- **Bracelet** (5 presets) - White Clean, Rose Silk, Gold Sophisticated, Black Drama, Premium Minimal
- **Mangalsutra** (7 presets) - Traditional Red, Drape Luxury, Gold Spotlight, Marble Premium, Silk Red, Festival Glow, Wedding Showcase
- **Anklet** (4 presets) - White Commercial, Gold Soft, Beach Casual, Traditional Heritage

---

## Troubleshooting

### Issue: Presets not showing on Category page

**Check**:
1. Browser console for errors
2. Network tab - verify GET requests successful
3. sessionStorage has `selected_category` set correctly
4. categoryPresets.js imported correctly in CategoryStylePage

**Solution**:
```javascript
// In browser console:
import { getPresetsForCategory } from './src/lib/categoryPresets.js'
getPresetsForCategory('ring')  // Should return array of 8 presets
```

### Issue: FormData not sent correctly

**Check**:
1. Network tab - look at Form Data in request
2. Verify `image` field shows as [File] type, not [string]
3. All preset fields present

**Solution**:
```javascript
// Verify FormData construction:
const formData = new FormData();
formData.append('image', blob, 'jewellery.png');
// Blob type check:
console.log(blob instanceof Blob)  // Should be true
```

### Issue: Backend returns 400 Bad Request

**Check**:
1. All required form fields present in request
2. Field names match backend expectations:
   - `image` (File)
   - `jewellery_type` (string)
   - `shoot_type` (string)
   - `preset_name` (string)
   - `preset_description` (string)
   - `quality` (string)

**Solution**: Verify GenerationPage is using correct field names:
```javascript
formData.append('jewellery_type', selectedCategory);
formData.append('shoot_type', 'product');
formData.append('preset_name', presetName);
formData.append('preset_description', presetDescription);
```

### Issue: Backend returns 500 Internal Server Error

**Check**:
1. Backend logs for error message
2. GEMINI_API_KEY configured
3. Master prompt template syntax correct
4. Preset values not causing injection errors

**Likely Cause**: Special characters in preset_description breaking prompt format
**Solution**: Ensure preset descriptions don't contain unescaped quotes or special characters

---

## Verification Checklist

- [ ] Presets display for selected category only
- [ ] Each preset shows name, description, and preview
- [ ] Selecting preset updates UI (highlight, checkmark)
- [ ] sessionStorage contains all required fields
- [ ] FormData sent with multipart/form-data
- [ ] All form fields match backend expectations
- [ ] Backend logs show preset injection
- [ ] Gemini receives enriched prompt with preset data
- [ ] Generated image reflects preset style
- [ ] Different categories show different preset options
- [ ] Different presets within category show different descriptions
- [ ] Master prompt unchanged (only injection values change)

---

## Performance Benchmarks

**Expected Performance**:
- Category page load: <500ms
- Preset loading: Instant (in-memory data)
- FormData construction: <100ms
- API request: ~100-200ms (network latency)
- Image generation: ~10-15 seconds (Gemini processing)

**Test**:
```javascript
// Measure preset loading
console.time('preset-load');
const presets = getPresetsForCategory('ring');
console.timeEnd('preset-load');  // Should be <1ms

// Measure FormData creation
console.time('formdata');
const formData = new FormData();
formData.append('image', blob);
console.timeEnd('formdata');  // Should be <100ms
```

---

## Success Criteria

✅ **Implementation is successful when:**
1. All 8 jewelry categories show appropriate preset lists
2. Each category has 4-8 jewelry-specific preset options
3. FormData correctly constructed and sent to backend
4. Backend receives preset_name and preset_description
5. Gemini API receives enriched prompt with preset data
6. Generated images reflect the selected preset style
7. Master prompt template unchanged and working
8. No errors in browser console or server logs

---

## Next Steps After Testing

1. **Document Results**: Record which presets produce best results
2. **Refine Descriptions**: Adjust preset descriptions based on results
3. **Performance Tuning**: Cache preset images if needed
4. **User Feedback**: Gather feedback on preset options
5. **Analytics**: Track which presets are most popular
6. **Database Integration**: Move presets to database for easier management

---

## Quick Test Command

```bash
# Terminal 1: Start backend
cd backend && python server.py

# Terminal 2: Start frontend dev server
cd frontend && npm start

# Browser: Open http://localhost:3000
# Navigate: /app → /categories → /ring → /generation
# DevTools: Check Network tab and sessionStorage
```

---

**Happy Testing! 🎉**
