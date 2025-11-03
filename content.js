// PricePulse Content Script - Price Detection Engine

// Price detection patterns for various e-commerce sites
const PRICE_SELECTORS = [
    // Common price classes and IDs
    '.price',
    '.product-price',
    '.current-price',
    '.sale-price',
    '.offer-price',
    '.actual-price',
    '#price',
    '#product-price',
    '[data-price]',
    '[data-testid*="price"]',
    '[class*="price"]',
    '[id*="price"]',

    // Specific e-commerce platforms
    // Amazon
    '.a-price-whole',
    '.a-offscreen',
    '#priceblock_ourprice',
    '#priceblock_dealprice',
    '.a-price .a-offscreen',

    // eBay
    '.x-price-primary',
    '#prcIsum',
    '.display-price',

    // Walmart
    '[itemprop="price"]',
    '.price-characteristic',

    // Best Buy
    '.priceView-hero-price',
    '.priceView-customer-price',

    // Target
    '[data-test="product-price"]',

    // AliExpress
    '.product-price-value',

    // Generic schema.org markup
    '[itemprop="price"]',
    '[itemtype*="Product"] [itemprop="offers"] [itemprop="price"]',

    // Meta tags
    'meta[property="og:price:amount"]',
    'meta[property="product:price:amount"]',
    'meta[name="twitter:data1"]'
];

// Currency symbols to help identify prices
const CURRENCY_SYMBOLS = ['$', '€', '£', '¥', '₹', '₽', 'USD', 'EUR', 'GBP', 'INR'];

// Main price detection function
function detectPrice() {
    let bestMatch = null;
    let highestConfidence = 0;

    // Method 1: Try specific selectors
    for (const selector of PRICE_SELECTORS) {
        try {
            const elements = document.querySelectorAll(selector);

            elements.forEach(element => {
                const result = extractPriceFromElement(element);
                if (result && result.confidence > highestConfidence) {
                    highestConfidence = result.confidence;
                    bestMatch = result;
                }
            });
        } catch (e) {
            // Selector might not be valid for this page
            continue;
        }
    }

    // Method 2: Try meta tags
    const metaPrice = extractPriceFromMeta();
    if (metaPrice && metaPrice.confidence > highestConfidence) {
        highestConfidence = metaPrice.confidence;
        bestMatch = metaPrice;
    }

    // Method 3: Scan visible text for price patterns
    if (!bestMatch || highestConfidence < 0.7) {
        const textPrice = scanTextForPrice();
        if (textPrice && textPrice.confidence > highestConfidence) {
            highestConfidence = textPrice.confidence;
            bestMatch = textPrice;
        }
    }

    return bestMatch;
}

// Extract price from a DOM element
function extractPriceFromElement(element) {
    if (!element) return null;

    // Get text content
    let text = element.textContent || element.innerText || '';

    // Check data attributes
    const dataPrice = element.getAttribute('data-price') ||
                     element.getAttribute('data-value') ||
                     element.getAttribute('content');

    if (dataPrice) {
        text = dataPrice;
    }

    // Clean and parse price
    const parsed = parsePrice(text);
    if (!parsed) return null;

    // Calculate confidence based on element characteristics
    let confidence = 0.5;

    // Higher confidence for elements with price-related classes/ids
    const attr = (element.className + ' ' + element.id).toLowerCase();
    if (attr.includes('price')) confidence += 0.2;
    if (attr.includes('current') || attr.includes('sale') || attr.includes('offer')) confidence += 0.1;
    if (element.hasAttribute('itemprop') && element.getAttribute('itemprop').includes('price')) confidence += 0.2;

    // Check if element is visible
    const style = window.getComputedStyle(element);
    if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
        confidence -= 0.3;
    }

    // Check font size (larger prices are usually more important)
    const fontSize = parseFloat(style.fontSize);
    if (fontSize > 20) confidence += 0.1;
    if (fontSize > 30) confidence += 0.1;

    return {
        price: parsed.formatted,
        priceValue: parsed.value,
        confidence: Math.min(confidence, 1.0),
        source: 'element'
    };
}

// Extract price from meta tags
function extractPriceFromMeta() {
    const metaTags = [
        document.querySelector('meta[property="og:price:amount"]'),
        document.querySelector('meta[property="product:price:amount"]'),
        document.querySelector('meta[name="twitter:data1"]')
    ];

    for (const meta of metaTags) {
        if (!meta) continue;

        const content = meta.getAttribute('content');
        const parsed = parsePrice(content);

        if (parsed) {
            return {
                price: parsed.formatted,
                priceValue: parsed.value,
                confidence: 0.9,
                source: 'meta'
            };
        }
    }

    return null;
}

// Scan visible text for price patterns
function scanTextForPrice() {
    const bodyText = document.body.innerText || document.body.textContent;

    // Look for price patterns in text
    const priceRegex = /(?:USD|EUR|GBP|[$€£¥₹₽])\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/gi;
    const matches = bodyText.match(priceRegex);

    if (!matches || matches.length === 0) return null;

    // Get the first significant price (usually the product price)
    const prices = matches.map(match => parsePrice(match)).filter(p => p !== null);

    if (prices.length === 0) return null;

    // Return the highest value price (assuming it's the main product price)
    const highestPrice = prices.reduce((max, p) => p.value > max.value ? p : max);

    return {
        price: highestPrice.formatted,
        priceValue: highestPrice.value,
        confidence: 0.4,
        source: 'text'
    };
}

// Parse price string into formatted price and numeric value
function parsePrice(text) {
    if (!text) return null;

    // Clean the text
    const cleaned = text.toString().trim();

    // Extract currency symbol
    let currency = '$';
    for (const symbol of CURRENCY_SYMBOLS) {
        if (cleaned.includes(symbol)) {
            currency = symbol.length === 1 ? symbol : symbol.substring(0, 1);
            if (currency === 'U' || currency === 'E' || currency === 'G' || currency === 'I') {
                currency = '$'; // Default for multi-char codes
            }
            break;
        }
    }

    // Extract numeric value
    // Match patterns like: 123.45, 1,234.56, 1.234,56 (European format)
    const numberMatch = cleaned.match(/(\d{1,3}(?:[,.\s]\d{3})*(?:[.,]\d{2})?)/);

    if (!numberMatch) return null;

    let numberStr = numberMatch[1];

    // Handle different decimal separators
    // If there's a comma followed by exactly 2 digits at the end, it's a decimal separator
    if (/,\d{2}$/.test(numberStr)) {
        numberStr = numberStr.replace(/\./g, '').replace(',', '.');
    } else {
        // Otherwise, remove commas (thousand separators)
        numberStr = numberStr.replace(/,/g, '');
    }

    const value = parseFloat(numberStr);

    if (isNaN(value) || value <= 0) return null;

    return {
        value: value,
        formatted: `${currency}${value.toFixed(2)}`,
        currency: currency
    };
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'detectPrice') {
        const result = detectPrice();

        if (result) {
            sendResponse({
                price: result.price,
                priceValue: result.priceValue,
                confidence: result.confidence,
                source: result.source
            });
        } else {
            sendResponse(null);
        }
    }

    return true; // Keep the message channel open for async response
});

// Auto-detect and cache price when page loads
let cachedPrice = null;

function initPriceDetection() {
    // Wait for page to be fully loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', detectAndCache);
    } else {
        detectAndCache();
    }
}

function detectAndCache() {
    // Wait a bit for dynamic content to load
    setTimeout(() => {
        cachedPrice = detectPrice();

        if (cachedPrice) {
            console.log('PricePulse: Price detected -', cachedPrice.price);

            // Send to background script for potential notification
            chrome.runtime.sendMessage({
                action: 'priceDetected',
                price: cachedPrice
            });
        }
    }, 1000);
}

// Initialize price detection
initPriceDetection();

// Re-detect if page content changes significantly (for SPAs)
let lastDetection = Date.now();
const observer = new MutationObserver(() => {
    // Debounce: only re-detect every 2 seconds
    if (Date.now() - lastDetection > 2000) {
        lastDetection = Date.now();
        detectAndCache();
    }
});

observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: false
});
