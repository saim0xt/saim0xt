# PricePulse Installation Guide

This guide will walk you through installing and setting up the PricePulse browser extension.

## Prerequisites

- Google Chrome (version 88+), Microsoft Edge (version 88+), or Brave browser
- OR Mozilla Firefox (version 89+)
- Basic understanding of browser extensions

## Installation Steps

### For Chrome/Edge/Brave

#### Step 1: Prepare the Extension Files

1. Make sure all extension files are in a single folder:
   ```
   pricepulse/
   ├── manifest.json
   ├── popup.html
   ├── popup.js
   ├── styles.css
   ├── content.js
   ├── background.js
   ├── storage.js
   ├── options.html
   ├── options.js
   ├── options.css
   └── icons/
       ├── icon.svg
       ├── generate-icons.html
       └── README.md
   ```

#### Step 2: Generate Icons (Recommended)

1. Navigate to the `icons` folder
2. Open `generate-icons.html` in your browser
3. Download all three PNG icons:
   - icon16.png
   - icon48.png
   - icon128.png
4. Save them in the `icons` folder

**Note:** The extension will work without custom icons (using browser defaults), but custom icons provide a better experience.

#### Step 3: Load the Extension

1. Open Chrome/Edge/Brave browser
2. Type in the address bar:
   - Chrome: `chrome://extensions/`
   - Edge: `edge://extensions/`
   - Brave: `brave://extensions/`
3. Press Enter

4. Enable **Developer Mode**:
   - Look for a toggle switch in the top-right corner
   - Click to enable it

5. Click **"Load unpacked"** button:
   - This appears in the top-left after enabling Developer Mode

6. Select the PricePulse folder:
   - Navigate to where you saved the extension files
   - Select the entire `pricepulse` folder (not individual files)
   - Click "Select Folder" or "Open"

7. Verify installation:
   - You should see the PricePulse extension card appear
   - Check that there are no errors (red text)
   - The extension icon should appear in your toolbar

### For Firefox

#### Step 1: Prepare Files
Same as Chrome (see above)

#### Step 2: Load Temporary Extension

1. Open Firefox
2. Type `about:debugging` in the address bar
3. Click **"This Firefox"** in the left sidebar
4. Click **"Load Temporary Add-on"**
5. Navigate to the PricePulse folder
6. Select the `manifest.json` file
7. Click "Open"

**Important:** Firefox temporary extensions are removed when you close the browser. For permanent installation, the extension needs to be signed by Mozilla.

## First-Time Setup

### Step 1: Pin the Extension

1. Click the puzzle piece icon in your toolbar
2. Find "PricePulse" in the list
3. Click the pin icon next to it
4. The PricePulse icon will now stay visible in your toolbar

### Step 2: Configure Settings

1. Click the PricePulse icon
2. Click the settings (gear) icon
3. Configure your preferences:
   - **Check Interval**: How often to check prices (default: 60 minutes)
   - **Notifications**: Enable/disable browser notifications
   - **Price Drop Only**: Only notify for price decreases
   - **Min Change Threshold**: Minimum % change to notify (default: 5%)

### Step 3: Grant Permissions

When you first track an item, the extension may ask for permissions:
- **Notifications**: Click "Allow" to receive price alerts
- **Storage**: Automatically granted to save your data locally

## Testing the Extension

### Test 1: Price Detection

1. Visit any e-commerce website (try Amazon, eBay, Walmart, etc.)
2. Go to a product page with a visible price
3. Click the PricePulse icon
4. Check if the price is automatically detected
5. The "Current Page" section should show the detected price

### Test 2: Track an Item

1. On a product page with a detected price
2. Click "Track This Price"
3. The item should appear in "Tracked Items"
4. Verify the price, title, and URL are correct

### Test 3: Manual Price Check

1. In the PricePulse popup, find a tracked item
2. Click the refresh icon (circular arrows)
3. Wait for the price to update
4. Check if the new price is displayed correctly

### Test 4: Settings

1. Click the settings icon
2. Try changing the check interval
3. Click "Save Settings"
4. Verify you see a success message

## Troubleshooting

### Extension Not Loading

**Problem:** Extension shows errors when loading

**Solutions:**
1. Verify all files are in the correct location
2. Check that `manifest.json` is valid JSON
3. Make sure you selected the folder, not individual files
4. Check browser console for specific error messages

### Price Not Detected

**Problem:** "No price found" shows on product pages

**Solutions:**
1. Refresh the page and wait a few seconds
2. Ensure the page actually displays a price
3. Try a different product page
4. Check if the site uses dynamic loading (JavaScript)
5. Some sites may block automated price detection

### Notifications Not Working

**Problem:** Not receiving price drop alerts

**Solutions:**
1. Check browser notification permissions:
   - Chrome: Settings → Privacy → Site Settings → Notifications
   - Look for the extension in the list
2. Verify notifications are enabled in extension settings
3. Check that price changes exceed your threshold
4. Ensure "Price Drop Only" matches your expectations

### Icons Not Showing

**Problem:** Extension has no icon or shows default icon

**Solutions:**
1. Generate PNG icons using `icons/generate-icons.html`
2. Save all three sizes in the `icons` folder
3. Reload the extension:
   - Go to extensions page
   - Click the refresh icon on the extension card

### Background Checks Not Running

**Problem:** Prices not updating automatically

**Solutions:**
1. Check extension settings for check interval
2. Verify service worker is active:
   - Extensions page → PricePulse → "service worker"
   - Should say "active"
3. Click "service worker" to view console logs
4. Look for scheduled price checks

## Updating the Extension

### Manual Update

1. Make changes to extension files
2. Go to extensions page
3. Click the refresh icon on PricePulse card
4. Changes will take effect immediately

### Preserving Data

Your tracked items and settings are preserved when updating, as they're stored in browser local storage.

## Uninstalling

### Complete Removal

1. Go to extensions page
2. Find PricePulse
3. Click "Remove"
4. Confirm removal

**Note:** This will delete all your tracked items and settings.

### Backup Before Uninstall

1. Open PricePulse settings
2. Click "Export Data"
3. Save the JSON file
4. Later, you can import this file to restore your data

## Advanced Configuration

### Custom Check Intervals

Edit `background.js` to add custom intervals:
```javascript
// Find the setupAlarms function
// Add your custom interval to the select options in options.html
```

### Price Detection Customization

Edit `content.js` to add support for specific websites:
```javascript
// Add custom selectors to PRICE_SELECTORS array
// Add site-specific detection logic
```

## Getting Help

### Check Console Logs

**Extension Console:**
1. Extensions page → PricePulse → "service worker"
2. View background script logs

**Page Console:**
1. Right-click page → "Inspect"
2. Console tab
3. Look for PricePulse messages

### Common Log Messages

- `"PricePulse: Price detected - $XX.XX"` = Price found successfully
- `"Running scheduled price check..."` = Automatic check running
- `"Price check complete. X changes detected"` = Check finished

### Report Issues

If you encounter problems:
1. Check browser console for errors
2. Note your browser version
3. Document steps to reproduce
4. Save console logs if available

## Privacy & Security

### Data Storage

- All data stored locally in browser
- No external servers
- No data collection or tracking
- No account required

### Permissions

The extension requests:
- **storage**: Save tracked items locally
- **tabs**: Access product pages to check prices
- **notifications**: Send price alerts
- **alarms**: Schedule periodic checks
- **activeTab**: Detect prices on current page
- **host_permissions**: Access websites to check prices

### Security Best Practices

1. Only load the extension from trusted sources
2. Review code before installation
3. Keep browser updated
4. Export data regularly as backup
5. Don't track items with sensitive information in URLs

## Tips for Best Experience

1. **Tracking Items:**
   - Track 5-15 items for optimal performance
   - Remove items you're no longer interested in
   - Check price history before purchasing

2. **Notification Settings:**
   - Use "Price Drop Only" to avoid alert fatigue
   - Set appropriate threshold (5-10% recommended)
   - Check interval of 60 minutes is usually sufficient

3. **Performance:**
   - Don't track too many items (50+ may slow checks)
   - Clear old items periodically
   - Export data before major updates

4. **Reliability:**
   - Some sites may block automated access
   - Prices may not always be detected
   - Manual refresh available as backup
   - Price history helps identify trends

## Next Steps

Now that PricePulse is installed:

1. Visit your favorite shopping sites
2. Track some items you're interested in
3. Configure your preferred settings
4. Wait for price drop notifications
5. Save money on your purchases!

Happy shopping and saving with PricePulse! 🛍️💰
