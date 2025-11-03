# PricePulse - Advanced Price Tracker Extension

![PricePulse Banner](github-header-image.png)

A beautiful, functional, and feature-rich browser extension for tracking product prices across the web. Get notified when prices drop and save money on your favorite products.

## Features

### Core Features
- **Automatic Price Detection** - Intelligently detects prices on any e-commerce website
- **Real-time Tracking** - Monitor prices for multiple products simultaneously
- **Price Drop Alerts** - Get instant notifications when prices decrease
- **Price History** - View complete price history with timestamps
- **Smart Filtering** - Filter tracked items by price changes (drops, increases, stable)
- **Data Export** - Export your tracked items and history as JSON

### Advanced Features
- **Multi-Platform Support** - Works on Amazon, eBay, Walmart, Best Buy, Target, AliExpress, and more
- **Customizable Check Interval** - Set how often prices should be checked (default: 60 minutes)
- **Notification Controls** - Choose to receive alerts for all changes or drops only
- **Minimum Change Threshold** - Set minimum percentage change for notifications (default: 5%)
- **Background Monitoring** - Automatic price checks run in the background
- **Beautiful Statistics** - Track total items watched, price drops, and total savings

### UI/UX Features
- **Modern Glassmorphism Design** - Beautiful frosted glass effects
- **Smooth Animations** - Polished transitions and hover effects
- **Dark Theme** - Eye-friendly dark interface
- **Responsive Layout** - Clean and organized interface
- **Visual Price Indicators** - Color-coded price changes (green for drops, red for increases)
- **Real-time Updates** - Live updates without page refresh

## Installation

### Chrome/Edge/Brave

1. **Download the Extension**
   ```bash
   git clone https://github.com/yourusername/pricepulse.git
   cd pricepulse
   ```

2. **Generate Icons** (Optional but recommended)
   - Open `icons/generate-icons.html` in your browser
   - Download all three icon sizes (16x16, 48x48, 128x128)
   - Save them in the `icons/` directory

3. **Load Extension in Browser**
   - Open Chrome/Edge/Brave
   - Navigate to `chrome://extensions/` or `edge://extensions/`
   - Enable "Developer mode" (toggle in top-right corner)
   - Click "Load unpacked"
   - Select the `pricepulse` folder
   - The extension icon should appear in your toolbar

### Firefox

1. **Download the Extension** (same as above)

2. **Load Temporary Extension**
   - Open Firefox
   - Navigate to `about:debugging#/runtime/this-firefox`
   - Click "Load Temporary Add-on"
   - Select the `manifest.json` file from the pricepulse folder

*Note: For permanent Firefox installation, the extension needs to be signed by Mozilla.*

## Usage

### Tracking Your First Item

1. **Visit a Product Page**
   - Navigate to any e-commerce website (Amazon, eBay, etc.)
   - Go to a product page with a visible price

2. **Open PricePulse**
   - Click the PricePulse icon in your browser toolbar
   - The extension will automatically detect the price

3. **Track the Price**
   - Click the "Track This Price" button
   - The item is now being monitored

4. **Check Your Dashboard**
   - View all tracked items in the extension popup
   - See price changes, history, and statistics

### Managing Tracked Items

- **Refresh Price** - Click the refresh icon to manually check current price
- **Delete Item** - Click the X icon to stop tracking an item
- **Visit Product** - Click "Visit" to open the product page
- **Filter Items** - Use filter buttons to view specific price changes
- **Export Data** - Click "Export Data" to download your tracking history

### Customizing Settings

1. Click the settings icon (gear) in the extension popup
2. Adjust your preferences:
   - Check interval (how often to check prices)
   - Notification preferences (all changes vs. drops only)
   - Minimum change percentage for alerts
   - Theme preferences

## How It Works

### Price Detection Algorithm

PricePulse uses a sophisticated multi-method price detection system:

1. **Selector-based Detection**
   - Searches for common price selectors (classes, IDs, data attributes)
   - Supports major e-commerce platforms out of the box

2. **Meta Tag Analysis**
   - Reads Open Graph and Schema.org price metadata
   - Provides high-confidence price detection

3. **Text Pattern Scanning**
   - Scans page content for price patterns
   - Identifies currency symbols and numeric formats
   - Handles multiple currency formats

4. **Confidence Scoring**
   - Each detection method has a confidence score
   - The highest confidence price is selected
   - Visual indicators show detection confidence

### Background Monitoring

- Extension service worker runs periodic checks
- Creates background tabs to fetch current prices
- Compares new prices with tracked prices
- Sends notifications for significant changes
- Updates statistics and price history
- Badge shows number of price drops

## File Structure

```
pricepulse/
├── manifest.json           # Extension configuration
├── popup.html             # Main popup interface
├── popup.js               # Popup logic and UI control
├── styles.css             # Beautiful glassmorphism styles
├── content.js             # Price detection engine
├── background.js          # Background monitoring service
├── storage.js             # Data management utilities
├── options.html           # Settings page
├── options.js             # Settings logic
├── icons/                 # Extension icons
│   ├── icon16.png
│   ├── icon48.png
│   ├── icon128.png
│   ├── icon.svg
│   └── generate-icons.html
└── README-EXTENSION.md    # This file
```

## Supported Websites

PricePulse works on most e-commerce websites, including:

- **Amazon** - Full support for all Amazon domains
- **eBay** - Buy It Now and auction prices
- **Walmart** - Online and marketplace items
- **Best Buy** - All product categories
- **Target** - Full catalog support
- **AliExpress** - International marketplace
- **Etsy** - Handmade and vintage items
- **Newegg** - Electronics and tech
- **And many more!** - Generic price detection works on most sites

## Privacy & Security

- **No Data Collection** - All data stays on your device
- **No External Servers** - No tracking or analytics
- **Open Source** - Code is fully transparent
- **Local Storage Only** - Uses browser's local storage
- **No Account Required** - No sign-up or registration
- **Secure Permissions** - Only requests necessary permissions

## Permissions Explained

- **storage** - Save tracked items and settings locally
- **tabs** - Open product pages and check prices
- **notifications** - Send price drop alerts
- **alarms** - Schedule periodic price checks
- **activeTab** - Detect prices on current page
- **host_permissions** - Access e-commerce websites to check prices

## Tips & Best Practices

1. **Set Realistic Check Intervals** - Checking every hour is usually sufficient
2. **Use Price Drop Only** - Avoid notification fatigue by only alerting on drops
3. **Monitor High-Value Items** - Best for expensive items where savings matter
4. **Check Price History** - Review trends before making purchases
5. **Export Regularly** - Back up your tracking data
6. **Clear Old Items** - Remove items you're no longer interested in

## Troubleshooting

### Price Not Detected
- Ensure the page has a visible price
- Try refreshing the page
- Check if the site uses dynamic loading (wait a few seconds)
- Some sites may use anti-scraping measures

### Notifications Not Working
- Check extension settings for notification preferences
- Ensure browser notifications are enabled
- Verify the price change exceeds your threshold

### Extension Not Loading
- Check for browser compatibility (Chrome 88+, Edge 88+, Firefox 89+)
- Disable conflicting extensions
- Try reloading the extension
- Check browser console for errors

## Development

### Building From Source

```bash
# Clone repository
git clone https://github.com/yourusername/pricepulse.git
cd pricepulse

# Generate icons
# Open icons/generate-icons.html in browser

# Load extension in developer mode
# See Installation section above
```

### Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## Roadmap

- [ ] Price prediction using historical data
- [ ] Multiple currency support with conversion
- [ ] Wishlist sharing capabilities
- [ ] Mobile app companion
- [ ] Advanced chart visualizations
- [ ] Price alerts via email/SMS
- [ ] Integration with shopping lists
- [ ] Coupon code finder
- [ ] Product comparison tools

## License

MIT License - feel free to use this project however you'd like!

## Support

If you encounter any issues or have questions:
- Open an issue on GitHub
- Check the troubleshooting section
- Review the code - it's well-commented!

## Credits

Created with care by the PricePulse team.

Special thanks to all contributors and users who help make this extension better!

---

**Happy Shopping & Saving!** 🛍️💰

*Made with Claude Code*
