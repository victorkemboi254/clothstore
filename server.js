const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files and asset folders
app.use(express.static(path.join(__dirname, 'public')));
app.use('/assets', express.static(path.join(__dirname, 'assets')));
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

// Ensure upload directory exists
const uploadDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer storage setup for product image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, 'item-' + uniqueSuffix + ext);
  }
});
const upload = multer({ storage });

// Helper functions for reading/writing data
const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const PRODUCTS_FILE = path.join(DATA_DIR, 'products.json');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');
const CONFIG_FILE = path.join(DATA_DIR, 'config.json');

function readJson(filePath, defaultValue) {
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err);
  }
  return defaultValue;
}

function writeJson(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error(`Error writing ${filePath}:`, err);
    return false;
  }
}

// Memory cache for active M-Pesa STK Push transactions
const pendingMpesaTransactions = new Map();

// Format phone number to 254XXXXXXXXX
function formatPhoneNumber(phone) {
  let cleaned = String(phone).replace(/\D/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '254' + cleaned.substring(1);
  } else if (cleaned.startsWith('+254')) {
    cleaned = cleaned.substring(1);
  } else if (cleaned.startsWith('7') || cleaned.startsWith('1')) {
    cleaned = '254' + cleaned;
  }
  return cleaned;
}

// --- API ENDPOINTS ---

// 1. PRODUCTS ENDPOINTS
app.get('/api/products', (req, res) => {
  const products = readJson(PRODUCTS_FILE, []);
  res.json(products);
});

app.post('/api/products', upload.single('imageFile'), (req, res) => {
  const products = readJson(PRODUCTS_FILE, []);
  
  let imageUrl = req.body.imageUrl || '';
  if (imageUrl && (imageUrl.startsWith('http://') || imageUrl.startsWith('https://') || imageUrl.startsWith('data:image/'))) {
    // Preserve Cloudinary URL or Data URL
  } else if (req.file) {
    imageUrl = `/uploads/${req.file.filename}`;
  } else if (!imageUrl) {
    imageUrl = 'assets/images/chrome_hearts_black_tee.jpg';
  }

  let sizes = req.body.sizes;
  if (typeof sizes === 'string') {
    try {
      sizes = JSON.parse(sizes);
    } catch (e) {
      sizes = sizes.split(',').map(s => s.trim()).filter(Boolean);
    }
  }

  let tags = req.body.tags;
  if (typeof tags === 'string') {
    try {
      tags = JSON.parse(tags);
    } catch (e) {
      tags = tags.split(',').map(t => t.trim()).filter(Boolean);
    }
  }

  const newProduct = {
    id: 'prod_' + Date.now(),
    title: req.body.title || 'Untitled Item',
    category: req.body.category || 'General',
    price: parseFloat(req.body.price) || 0,
    image: imageUrl,
    description: req.body.description || '',
    sizes: sizes || ['S', 'M', 'L', 'XL'],
    inStock: req.body.inStock !== 'false' && req.body.inStock !== false,
    stockQty: parseInt(req.body.stockQty) || 10,
    featured: req.body.featured === 'true' || req.body.featured === true,
    tags: tags || ['New Arrival'],
    createdAt: new Date().toISOString()
  };

  products.unshift(newProduct);
  writeJson(PRODUCTS_FILE, products);

  res.status(201).json({ success: true, product: newProduct });
});

app.put('/api/products/:id', upload.single('imageFile'), (req, res) => {
  const products = readJson(PRODUCTS_FILE, []);
  const index = products.findIndex(p => p.id === req.params.id);
  
  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Product not found' });
  }

  const existing = products[index];
  let imageUrl = req.body.imageUrl || existing.image;
  if (req.body.imageUrl && (req.body.imageUrl.startsWith('http://') || req.body.imageUrl.startsWith('https://') || req.body.imageUrl.startsWith('data:image/'))) {
    imageUrl = req.body.imageUrl;
  } else if (req.file) {
    imageUrl = `/uploads/${req.file.filename}`;
  }

  let sizes = req.body.sizes ? (typeof req.body.sizes === 'string' ? JSON.parse(req.body.sizes) : req.body.sizes) : existing.sizes;
  let tags = req.body.tags ? (typeof req.body.tags === 'string' ? JSON.parse(req.body.tags) : req.body.tags) : existing.tags;

  const updatedProduct = {
    ...existing,
    title: req.body.title || existing.title,
    category: req.body.category || existing.category,
    price: req.body.price ? parseFloat(req.body.price) : existing.price,
    image: imageUrl,
    description: req.body.description !== undefined ? req.body.description : existing.description,
    sizes: sizes,
    inStock: req.body.inStock !== undefined ? (req.body.inStock === 'true' || req.body.inStock === true) : existing.inStock,
    stockQty: req.body.stockQty ? parseInt(req.body.stockQty) : existing.stockQty,
    featured: req.body.featured !== undefined ? (req.body.featured === 'true' || req.body.featured === true) : existing.featured,
    tags: tags
  };

  products[index] = updatedProduct;
  writeJson(PRODUCTS_FILE, products);

  res.json({ success: true, product: updatedProduct });
});

app.delete('/api/products/:id', (req, res) => {
  let products = readJson(PRODUCTS_FILE, []);
  const initialLen = products.length;
  products = products.filter(p => p.id !== req.params.id);

  if (products.length === initialLen) {
    return res.status(404).json({ success: false, message: 'Product not found' });
  }

  writeJson(PRODUCTS_FILE, products);
  res.json({ success: true, message: 'Product deleted successfully' });
});


// 2. ADMIN AUTH & STORE CONFIG
app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  const config = readJson(CONFIG_FILE, { adminPassword: 'admin' });

  if (password === config.adminPassword) {
    res.json({ success: true, token: 'admin_token_' + Date.now(), storeName: config.storeName });
  } else {
    res.status(401).json({ success: false, message: 'Invalid Admin Password' });
  }
});

app.get('/api/config', (req, res) => {
  const config = readJson(CONFIG_FILE, {});
  // Mask sensitive credentials for safety when returning to client
  const safeConfig = {
    storeName: config.storeName || 'VIBE STREETWEAR & KICKS',
    storePhone: config.storePhone || '+254 712 345 678',
    currency: config.currency || 'KES',
    mpesaEnv: config.mpesa?.environment || 'sandbox',
    mpesaShortcode: config.mpesa?.shortcode || '174379',
    hasCredentials: Boolean(config.mpesa?.consumerKey && config.mpesa.consumerKey !== 'YOUR_CONSUMER_KEY')
  };
  res.json(safeConfig);
});

app.post('/api/admin/config', (req, res) => {
  const config = readJson(CONFIG_FILE, {});
  
  if (req.body.storeName) config.storeName = req.body.storeName;
  if (req.body.adminPassword) config.adminPassword = req.body.adminPassword;
  
  if (req.body.mpesa) {
    config.mpesa = {
      ...config.mpesa,
      ...req.body.mpesa
    };
  }

  writeJson(CONFIG_FILE, config);
  res.json({ success: true, message: 'Configuration saved successfully' });
});


// 3. SAFARICOM DARAJA M-PESA PAYMENTS & STK PUSH

// Initiate M-Pesa STK Push
app.post('/api/mpesa/stkpush', async (req, res) => {
  try {
    const { phone, amount, items, customerName } = req.body;

    if (!phone || !amount) {
      return res.status(400).json({ success: false, message: 'Phone number and amount are required' });
    }

    const formattedPhone = formatPhoneNumber(phone);
    const config = readJson(CONFIG_FILE, {});
    const mpesaConfig = config.mpesa || {};

    const isRealDaraja = mpesaConfig.consumerKey && 
                         mpesaConfig.consumerKey !== 'YOUR_CONSUMER_KEY' && 
                         mpesaConfig.consumerSecret && 
                         mpesaConfig.consumerSecret !== 'YOUR_CONSUMER_SECRET';

    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
    const checkoutRequestId = 'ws_CO_' + timestamp + '_' + Math.floor(1000 + Math.random() * 9000);
    const mpesaReceiptNumber = 'Q' + Math.random().toString(36).substring(2, 6).toUpperCase() + Math.floor(100 + Math.random() * 900) + 'K';

    // Store in pending transactions table
    const orderData = {
      orderId: 'ORD-' + Date.now().toString().slice(-6),
      checkoutRequestId,
      phone: formattedPhone,
      amount: parseFloat(amount),
      items: items || [],
      customerName: customerName || 'Valued Customer',
      status: 'PENDING',
      mpesaReceiptNumber: null,
      createdAt: new Date().toISOString()
    };

    pendingMpesaTransactions.set(checkoutRequestId, orderData);

    if (isRealDaraja) {
      // Execute Real Safaricom Daraja STK Push API call
      try {
        const isProd = mpesaConfig.environment === 'production';
        const shortcode = (mpesaConfig.shortcode && mpesaConfig.shortcode.trim()) ? mpesaConfig.shortcode.trim() : '174379';
        const passkey = (mpesaConfig.passkey && mpesaConfig.passkey.trim()) ? mpesaConfig.passkey.trim() : 'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919';

        const authUrl = isProd
          ? 'https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials'
          : 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials';

        const auth = Buffer.from(`${mpesaConfig.consumerKey.trim()}:${mpesaConfig.consumerSecret.trim()}`).toString('base64');
        const tokenRes = await axios.get(authUrl, {
          headers: { Authorization: `Basic ${auth}` },
          timeout: 10000
        });
        const accessToken = tokenRes.data.access_token;

        const password = Buffer.from(
          `${shortcode}${passkey}${timestamp}`
        ).toString('base64');

        const stkUrl = isProd
          ? 'https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest'
          : 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest';

        const stkRes = await axios.post(
          stkUrl,
          {
            BusinessShortCode: shortcode,
            Password: password,
            Timestamp: timestamp,
            TransactionType: 'CustomerPayBillOnline',
            Amount: Math.round(amount),
            PartyA: formattedPhone,
            PartyB: shortcode,
            PhoneNumber: formattedPhone,
            CallBackURL: mpesaConfig.callbackUrl || 'https://mydomain.com/api/mpesa/callback',
            AccountReference: 'VibeStore',
            TransactionDesc: 'Payment for Clothing & Kicks'
          },
          { 
            headers: { Authorization: `Bearer ${accessToken}` },
            timeout: 12000 
          }
        );

        if (stkRes.data && stkRes.data.CheckoutRequestID) {
          orderData.checkoutRequestId = stkRes.data.CheckoutRequestID;
          pendingMpesaTransactions.set(stkRes.data.CheckoutRequestID, orderData);
          
          return res.json({
            success: true,
            mode: 'live',
            checkoutRequestId: stkRes.data.CheckoutRequestID,
            customerMessage: stkRes.data.CustomerMessage || `STK Push sent to +${formattedPhone}. Please check your phone.`
          });
        }
      } catch (darajaErr) {
        console.error('Safaricom Daraja API Error:', darajaErr.response?.data || darajaErr.message);
        const errorDetail = darajaErr.response?.data?.errorMessage || darajaErr.response?.data?.ResponseDescription || darajaErr.message;
        
        return res.status(400).json({ 
          success: false, 
          mode: 'live_error',
          message: `Safaricom M-Pesa Error: ${errorDetail}. Please check your Daraja Consumer Key, Secret, Shortcode & Passkey in Admin Settings.` 
        });
      }
    }

    // Default: Sandbox Simulator mode for seamless local evaluation
    // Automatically complete after 6 seconds to simulate user entering PIN
    setTimeout(() => {
      const pending = pendingMpesaTransactions.get(checkoutRequestId);
      if (pending && pending.status === 'PENDING') {
        pending.status = 'COMPLETED';
        pending.mpesaReceiptNumber = mpesaReceiptNumber;
        pending.completedAt = new Date().toISOString();
        
        // Save to orders.json log
        const orders = readJson(ORDERS_FILE, []);
        orders.unshift(pending);
        writeJson(ORDERS_FILE, orders);
      }
    }, 6000);

    res.json({
      success: true,
      mode: 'sandbox_simulation',
      checkoutRequestId: checkoutRequestId,
      customerMessage: `STK Push prompt sent to +${formattedPhone}. Please check your handset and enter your 4-digit M-Pesa PIN.`
    });

  } catch (err) {
    console.error('STK Push Error:', err);
    res.status(500).json({ success: false, message: err.message || 'Failed to trigger M-Pesa STK Push' });
  }
});

// STK Push Status Polling Endpoint
app.get('/api/mpesa/status/:checkoutRequestId', (req, res) => {
  const { checkoutRequestId } = req.params;
  const pending = pendingMpesaTransactions.get(checkoutRequestId);

  if (!pending) {
    // Check orders file
    const orders = readJson(ORDERS_FILE, []);
    const existing = orders.find(o => o.checkoutRequestId === checkoutRequestId);
    if (existing) {
      return res.json({ success: true, ...existing });
    }
    return res.status(404).json({ success: false, message: 'Transaction not found' });
  }

  res.json({ success: true, ...pending });
});

// Daraja Callback Webhook
app.post('/api/mpesa/callback', (req, res) => {
  console.log('M-Pesa Webhook Callback received:', JSON.stringify(req.body));
  
  try {
    const callbackData = req.body?.Body?.stkCallback;
    if (callbackData) {
      const checkoutRequestId = callbackData.CheckoutRequestID;
      const resultCode = callbackData.ResultCode;
      
      const pending = pendingMpesaTransactions.get(checkoutRequestId);
      if (pending) {
        if (resultCode === 0) {
          pending.status = 'COMPLETED';
          const items = callbackData.CallbackMetadata?.Item || [];
          const receiptObj = items.find(i => i.Name === 'MpesaReceiptNumber');
          pending.mpesaReceiptNumber = receiptObj ? receiptObj.Value : 'M' + Date.now().toString(36).toUpperCase();
          pending.completedAt = new Date().toISOString();

          // Save to orders log
          const orders = readJson(ORDERS_FILE, []);
          orders.unshift(pending);
          writeJson(ORDERS_FILE, orders);
        } else {
          pending.status = 'FAILED';
          pending.failureReason = callbackData.ResultDesc || 'Payment cancelled or failed';
        }
      }
    }
  } catch (err) {
    console.error('Error parsing callback:', err);
  }

  // Safaricom expects a 200 JSON acknowledgment
  res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
});

// 4. ORDERS HISTORY (For Admin)
app.get('/api/orders', (req, res) => {
  const orders = readJson(ORDERS_FILE, []);
  res.json(orders);
});

// Start Server
app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`  VIBE APPAREL & KICKS STORE IS RUNNING!`);
  console.log(`  Access Storefront & Admin Portal at: http://localhost:${PORT}`);
  console.log(`====================================================`);
});
