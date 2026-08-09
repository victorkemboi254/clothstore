/**
 * VIBE APPAREL & KICKS - CLIENT APPLICATION LOGIC
 * Includes Storefront rendering, live search, cart drawer,
 * Safaricom Daraja M-Pesa STK Push payment flow & Admin management.
 */

document.addEventListener('DOMContentLoaded', () => {
  // --- STATE ---
  let products = [];
  let cart = JSON.parse(localStorage.getItem('vibe_cart') || '[]');
  let activeCategory = 'All';
  let searchQuery = '';
  let inStockOnly = false;
  let sortBy = 'featured';
  let currentQvProduct = null;
  let selectedQvSize = '';
  let adminToken = localStorage.getItem('vibe_admin_token') || null;

  // --- DOM ELEMENTS ---
  const productGrid = document.getElementById('productGrid');
  const noResults = document.getElementById('noResults');
  const searchInput = document.getElementById('searchInput');
  const clearSearchBtn = document.getElementById('clearSearchBtn');
  const categoryTabs = document.getElementById('categoryTabs');
  const sortSelect = document.getElementById('sortSelect');
  const inStockOnlyCheck = document.getElementById('inStockOnlyCheck');
  const resetFiltersBtn = document.getElementById('resetFiltersBtn');

  // Cart DOM
  const cartBtn = document.getElementById('cartBtn');
  const cartBadge = document.getElementById('cartBadge');
  const cartDrawerBackdrop = document.getElementById('cartDrawerBackdrop');
  const closeCartDrawer = document.getElementById('closeCartDrawer');
  const cartItemsContainer = document.getElementById('cartItemsContainer');
  const cartSubtotal = document.getElementById('cartSubtotal');
  const cartTotal = document.getElementById('cartTotal');
  const proceedMpesaBtn = document.getElementById('proceedMpesaBtn');

  // Quick View DOM
  const quickViewModal = document.getElementById('quickViewModal');
  const closeQuickView = document.getElementById('closeQuickView');
  const qvImage = document.getElementById('qvImage');
  const qvCategory = document.getElementById('qvCategory');
  const qvTitle = document.getElementById('qvTitle');
  const qvPrice = document.getElementById('qvPrice');
  const qvDescription = document.getElementById('qvDescription');
  const qvSizesContainer = document.getElementById('qvSizesContainer');
  const qvQtyInput = document.getElementById('qvQtyInput');
  const qvMinusBtn = document.getElementById('qvMinusBtn');
  const qvPlusBtn = document.getElementById('qvPlusBtn');
  const qvAddToCartBtn = document.getElementById('qvAddToCartBtn');

  // M-Pesa Modal DOM
  const mpesaModal = document.getElementById('mpesaModal');
  const closeMpesaModal = document.getElementById('closeMpesaModal');
  const mpesaForm = document.getElementById('mpesaForm');
  const mpesaStep1 = document.getElementById('mpesaStep1');
  const mpesaStep2 = document.getElementById('mpesaStep2');
  const mpesaStep3 = document.getElementById('mpesaStep3');
  const mpesaItemCount = document.getElementById('mpesaItemCount');
  const mpesaAmount = document.getElementById('mpesaAmount');
  const stkSimAmount = document.getElementById('stkSimAmount');
  const stkMessageText = document.getElementById('stkMessageText');
  const stkCountdown = document.getElementById('stkCountdown');
  const receiptMpesaCode = document.getElementById('receiptMpesaCode');
  const receiptAmount = document.getElementById('receiptAmount');
  const receiptPhone = document.getElementById('receiptPhone');
  const receiptTime = document.getElementById('receiptTime');
  const closeReceiptBtn = document.getElementById('closeReceiptBtn');

  // Admin Portal DOM
  const openAdminBtn = document.getElementById('openAdminBtn');
  const heroAdminBtn = document.getElementById('heroAdminBtn');
  const adminModal = document.getElementById('adminModal');
  const closeAdminModal = document.getElementById('closeAdminModal');
  const adminLoginView = document.getElementById('adminLoginView');
  const adminDashboardView = document.getElementById('adminDashboardView');
  const adminLoginForm = document.getElementById('adminLoginForm');
  const adminLogoutBtn = document.getElementById('adminLogoutBtn');
  const addProductForm = document.getElementById('addProductForm');
  const inventoryTableBody = document.getElementById('inventoryTableBody');
  const inventorySearch = document.getElementById('inventorySearch');
  const ordersTableBody = document.getElementById('ordersTableBody');
  const darajaConfigForm = document.getElementById('darajaConfigForm');

  const DEFAULT_PRODUCTS = [
    {
      "id": "prod_1",
      "title": "Chrome Hearts Cross Rhinestone Black Tee",
      "category": "T-Shirts",
      "price": 2500,
      "image": "assets/images/chrome_hearts_black_tee.jpg",
      "description": "Oversized luxury heavyweight cotton black t-shirt featuring Chrome Hearts front chest logo and iconic cross crystal print back.",
      "sizes": ["S", "M", "L", "XL", "XXL"],
      "inStock": true,
      "stockQty": 15,
      "featured": true,
      "tags": ["Streetwear", "Bestseller", "New"]
    },
    {
      "id": "prod_2",
      "title": "Stussy 8-Ball Vintage Brown Tee",
      "category": "T-Shirts",
      "price": 2200,
      "image": "assets/images/stussy_brown_tee.jpg",
      "description": "Classic streetwear rich chocolate brown tee with pink Stussy script logo and signature 8-ball graphic.",
      "sizes": ["S", "M", "L", "XL"],
      "inStock": true,
      "stockQty": 12,
      "featured": true,
      "tags": ["Vintage", "Popular"]
    },
    {
      "id": "prod_3",
      "title": "Stussy 8-Ball Graphic Black Tee",
      "category": "T-Shirts",
      "price": 2200,
      "image": "assets/images/stussy_black_tee.jpg",
      "description": "Premium washed black oversized graphic t-shirt featuring pink Stussy script and 8-ball chest print.",
      "sizes": ["S", "M", "L", "XL", "XXL"],
      "inStock": true,
      "stockQty": 20,
      "featured": true,
      "tags": ["Hot", "Essential"]
    },
    {
      "id": "prod_4",
      "title": "Stussy 8-Ball Fresh White Tee",
      "category": "T-Shirts",
      "price": 2200,
      "image": "assets/images/stussy_white_tee.jpg",
      "description": "Clean bright white streetwear crewneck t-shirt with pink Stussy logo and 8-ball detail.",
      "sizes": ["S", "M", "L", "XL"],
      "inStock": true,
      "stockQty": 18,
      "featured": true,
      "tags": ["Summer", "Clean"]
    },
    {
      "id": "prod_5",
      "title": "Chrome Hearts Cross Rhinestone Royal Blue Tee",
      "category": "T-Shirts",
      "price": 2500,
      "image": "assets/images/chrome_hearts_blue_tee.jpg",
      "description": "Vibrant royal blue luxury graphic tee with rhinestone embellished Chrome Hearts crosses back artwork.",
      "sizes": ["S", "M", "L", "XL"],
      "inStock": true,
      "stockQty": 10,
      "featured": true,
      "tags": ["Exclusive", "Blue"]
    },
    {
      "id": "prod_6",
      "title": "Los Angeles L.A. Red Track Set & Cap",
      "category": "Sets & Suits",
      "price": 4200,
      "image": "assets/images/la_shortset_red.jpg",
      "description": "3-Piece Premium Streetwear Set: Bold red oversized embroidered Los Angeles t-shirt, matching drawstring shorts, and crisp white LA baseball cap.",
      "sizes": ["M", "L", "XL", "XXL"],
      "inStock": true,
      "stockQty": 8,
      "featured": true,
      "tags": ["3-Piece Set", "Trending"]
    },
    {
      "id": "prod_7",
      "title": "Los Angeles L.A. Midnight Black Track Set & Cap",
      "category": "Sets & Suits",
      "price": 4200,
      "image": "assets/images/la_shortset_black.jpg",
      "description": "3-Piece Premium Streetwear Set: Midnight black embroidered Los Angeles t-shirt, matching black drawstring shorts, and white LA cap.",
      "sizes": ["M", "L", "XL", "XXL"],
      "inStock": true,
      "stockQty": 14,
      "featured": true,
      "tags": ["3-Piece Set", "Bestseller"]
    },
    {
      "id": "prod_8",
      "title": "Los Angeles L.A. Mocha Brown Track Set & Cap",
      "category": "Sets & Suits",
      "price": 4200,
      "image": "assets/images/la_shortset_brown.jpg",
      "description": "3-Piece Premium Streetwear Set: Earthy mocha brown embroidered Los Angeles t-shirt, matching shorts, and white LA cap.",
      "sizes": ["M", "L", "XL", "XXL"],
      "inStock": true,
      "stockQty": 9,
      "featured": true,
      "tags": ["3-Piece Set", "Mocha"]
    },
    {
      "id": "prod_9",
      "title": "Air Jordan 1 High Bred Retro Kicks",
      "category": "Shoes & Kicks",
      "price": 6800,
      "image": "assets/images/jordan_sneaker.jpg",
      "description": "Iconic high-top premium leather sneakers in classic black and varsity red colorway with signature swoosh and cushioned sole.",
      "sizes": ["EU 40", "EU 41", "EU 42", "EU 43", "EU 44", "EU 45"],
      "inStock": true,
      "stockQty": 11,
      "featured": true,
      "tags": ["Kicks", "Retro", "Limited"]
    },
    {
      "id": "prod_10",
      "title": "Nike Dunk Low Forest Green Kicks",
      "category": "Shoes & Kicks",
      "price": 5900,
      "image": "assets/images/dunk_sneaker.jpg",
      "description": "Stylish low-top leather sneakers with white panels and forest green overlays. Ultimate everyday streetwear sneaker.",
      "sizes": ["EU 40", "EU 41", "EU 42", "EU 43", "EU 44"],
      "inStock": true,
      "stockQty": 7,
      "featured": false,
      "tags": ["Low Top", "Green"]
    },
    {
      "id": "prod_11",
      "title": "Minimalist Cable Knit Cream Sweater",
      "category": "Sweaters & Hoodies",
      "price": 3800,
      "image": "assets/images/cream_sweater.jpg",
      "description": "Cozy luxury oversized cable knit sweater crafted from soft heavy wool blend in a timeless cream white tone.",
      "sizes": ["S", "M", "L", "XL"],
      "inStock": true,
      "stockQty": 6,
      "featured": false,
      "tags": ["Sweaters", "Luxury Knit"]
    }
  ];

  function compressImageFile(file, maxWidth = 800, maxHeight = 800, quality = 0.75) {
    return new Promise((resolve) => {
      if (!file || !file.type || !file.type.startsWith('image/')) {
        resolve(null);
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          let width = img.width;
          let height = img.height;

          if (width > maxWidth || height > maxHeight) {
            if (width > height) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            } else {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          const dataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(dataUrl);
        };
        img.onerror = () => resolve(null);
        img.src = e.target.result;
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    });
  }

  function getImageUrl(imgPath) {
    if (!imgPath) return 'assets/images/chrome_hearts_black_tee.jpg';
    let clean = imgPath.trim();
    if (clean.startsWith('/assets/')) {
      clean = clean.substring(1);
    } else if (clean.startsWith('/uploads/')) {
      clean = clean.substring(1);
    }
    return clean;
  }

  // --- INITIALIZATION ---
  initApp();

  async function initApp() {
    await fetchProducts();
    updateCartUI();
    setupEventListeners();
  }

  async function fetchProducts() {
    let fetchedList = [];
    try {
      const res = await fetch('/api/products');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          fetchedList = data;
        }
      }
    } catch (err) {
      console.warn('Failed to fetch from backend API, attempting static fallback:', err);
    }

    if (fetchedList.length === 0) {
      try {
        const staticRes = await fetch('data/products.json');
        if (staticRes.ok) {
          const staticData = await staticRes.json();
          if (Array.isArray(staticData) && staticData.length > 0) {
            fetchedList = staticData;
          }
        }
      } catch (staticErr) {}
    }

    if (fetchedList.length === 0) {
      fetchedList = [...DEFAULT_PRODUCTS];
    }

    // Merge custom listings saved in localStorage
    const localCustom = JSON.parse(localStorage.getItem('vibe_custom_products') || '[]');
    const existingIds = new Set(fetchedList.map(p => p.id));
    const missingCustom = localCustom.filter(p => !existingIds.has(p.id));

    products = [...missingCustom, ...fetchedList];
    renderCatalog();
  }

  // --- STOREFRONT RENDERING ---
  function renderCatalog() {
    let filtered = [...products];

    // Category filter
    if (activeCategory !== 'All') {
      filtered = filtered.filter(p => p.category.toLowerCase() === activeCategory.toLowerCase());
    }

    // Search filter
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(p => 
        p.title.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query) ||
        (p.description && p.description.toLowerCase().includes(query)) ||
        (p.tags && p.tags.some(t => t.toLowerCase().includes(query)))
      );
    }

    // In Stock filter
    if (inStockOnly) {
      filtered = filtered.filter(p => p.inStock);
    }

    // Sort logic
    if (sortBy === 'price-asc') {
      filtered.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-desc') {
      filtered.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'name-asc') {
      filtered.sort((a, b) => a.title.localeCompare(b.title));
    } else {
      // Featured first
      filtered.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
    }

    // Render Grid
    if (filtered.length === 0) {
      productGrid.style.display = 'none';
      noResults.style.display = 'block';
    } else {
      noResults.style.display = 'none';
      productGrid.style.display = 'grid';
      
      productGrid.innerHTML = filtered.map(p => {
        const primaryTag = p.tags && p.tags.length > 0 ? p.tags[0] : (p.featured ? 'Featured Drop' : p.category);
        const sizesHtml = p.sizes ? p.sizes.map(s => `<span class="size-pill">${s}</span>`).join('') : '';
        const imgSrc = getImageUrl(p.image);

        return `
          <div class="product-card">
            <div class="card-media">
              <img src="${imgSrc}" alt="${p.title}" loading="lazy" onerror="this.onerror=null; this.src='assets/images/chrome_hearts_black_tee.jpg';">
              <span class="badge-tag">${primaryTag}</span>
              <button class="quick-view-btn" data-id="${p.id}" title="Quick View">
                <i class="fa-solid fa-eye"></i>
              </button>
            </div>
            <div class="card-body">
              <span class="card-category">${p.category}</span>
              <h3 class="card-title">${p.title}</h3>
              <div class="card-price-row">
                <span class="price-text">KES ${p.price.toLocaleString()}</span>
                <span class="stock-badge ${p.inStock ? '' : 'out-of-stock'}">
                  ${p.inStock ? 'In Stock' : 'Sold Out'}
                </span>
              </div>
              <div class="card-sizes">
                ${sizesHtml}
              </div>
              <div class="card-footer">
                <button class="btn btn-gold btn-full add-to-cart-direct" data-id="${p.id}" ${!p.inStock ? 'disabled' : ''}>
                  <i class="fa-solid fa-bag-shopping"></i> ${p.inStock ? 'Add to Cart' : 'Out of Stock'}
                </button>
              </div>
            </div>
          </div>
        `;
      }).join('');
    }
  }

  // --- QUICK VIEW MODAL ---
  function openQuickView(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    currentQvProduct = product;
    selectedQvSize = product.sizes && product.sizes.length > 0 ? product.sizes[0] : 'Free Size';

    qvImage.src = getImageUrl(product.image);
    qvCategory.textContent = product.category;
    qvTitle.textContent = product.title;
    qvPrice.textContent = `KES ${product.price.toLocaleString()}`;
    qvDescription.textContent = product.description || 'No detailed description available.';
    qvQtyInput.value = 1;

    // Render sizes
    if (product.sizes && product.sizes.length > 0) {
      qvSizesContainer.innerHTML = product.sizes.map((s, idx) => `
        <button class="size-option-btn ${idx === 0 ? 'selected' : ''}" data-size="${s}">${s}</button>
      `).join('');
    } else {
      qvSizesContainer.innerHTML = `<button class="size-option-btn selected" data-size="Standard">Standard</button>`;
    }

    quickViewModal.classList.add('active');
  }

  // --- SHOPPING CART MANAGEMENT ---
  function addToCart(productId, size = null, qty = 1) {
    const product = products.find(p => p.id === productId);
    if (!product || !product.inStock) return;

    const chosenSize = size || (product.sizes && product.sizes.length > 0 ? product.sizes[0] : 'Standard');
    const existingIndex = cart.findIndex(item => item.id === productId && item.size === chosenSize);

    if (existingIndex > -1) {
      cart[existingIndex].quantity += qty;
    } else {
      cart.push({
        id: product.id,
        title: product.title,
        price: product.price,
        image: product.image,
        category: product.category,
        size: chosenSize,
        quantity: qty
      });
    }

    saveCart();
    updateCartUI();
    openCartDrawer();
  }

  function updateCartQuantity(index, delta) {
    if (cart[index]) {
      cart[index].quantity += delta;
      if (cart[index].quantity <= 0) {
        cart.splice(index, 1);
      }
      saveCart();
      updateCartUI();
    }
  }

  function removeCartItem(index) {
    cart.splice(index, 1);
    saveCart();
    updateCartUI();
  }

  function saveCart() {
    localStorage.setItem('vibe_cart', JSON.stringify(cart));
  }

  function updateCartUI() {
    const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartBadge.textContent = totalCount;

    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    cartSubtotal.textContent = `KES ${subtotal.toLocaleString()}`;
    cartTotal.textContent = `KES ${subtotal.toLocaleString()}`;

    if (cart.length === 0) {
      cartItemsContainer.innerHTML = `
        <div class="empty-cart-state" style="text-align: center; padding: 40px 0; color: var(--text-muted);">
          <i class="fa-solid fa-bag-shopping" style="font-size: 3rem; margin-bottom: 12px;"></i>
          <p>Your shopping bag is currently empty.</p>
        </div>
      `;
      proceedMpesaBtn.disabled = true;
    } else {
      proceedMpesaBtn.disabled = false;
      cartItemsContainer.innerHTML = cart.map((item, idx) => `
        <div class="cart-item-card">
          <img src="${getImageUrl(item.image)}" alt="${item.title}" class="cart-item-thumb" onerror="this.onerror=null; this.src='assets/images/chrome_hearts_black_tee.jpg';">
          <div class="cart-item-info">
            <h4 class="cart-item-title">${item.title}</h4>
            <div class="cart-item-meta">Size: <strong>${item.size}</strong></div>
            <div class="cart-item-price">KES ${(item.price * item.quantity).toLocaleString()}</div>
          </div>
          <div class="cart-item-actions" style="display: flex; flex-direction: column; align-items: flex-end; justify-content: space-between;">
            <button class="remove-cart-item" data-index="${idx}" style="color: var(--text-muted);"><i class="fa-solid fa-trash-can"></i></button>
            <div class="quantity-control" style="transform: scale(0.85); transform-origin: right bottom;">
              <button class="cart-qty-btn" data-index="${idx}" data-delta="-1"><i class="fa-solid fa-minus"></i></button>
              <input type="number" value="${item.quantity}" readonly>
              <button class="cart-qty-btn" data-index="${idx}" data-delta="1"><i class="fa-solid fa-plus"></i></button>
            </div>
          </div>
        </div>
      `).join('');
    }
  }

  function openCartDrawer() {
    cartDrawerBackdrop.classList.add('active');
  }

  function closeCartDrawerFunc() {
    cartDrawerBackdrop.classList.remove('active');
  }

  // --- SAFARICOM M-PESA DARAJA CHECKOUT ---
  function openMpesaCheckout() {
    if (cart.length === 0) return;

    closeCartDrawerFunc();

    const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const totalQty = cart.reduce((sum, item) => sum + item.quantity, 0);

    mpesaItemCount.textContent = `${totalQty} item${totalQty > 1 ? 's' : ''}`;
    mpesaAmount.textContent = `KES ${totalAmount.toLocaleString()}`;
    stkSimAmount.textContent = totalAmount.toLocaleString();

    // Show Step 1
    mpesaStep1.style.display = 'block';
    mpesaStep2.style.display = 'none';
    mpesaStep3.style.display = 'none';

    mpesaModal.classList.add('active');
  }

  let stkPollInterval = null;

  async function handleMpesaSubmit(e) {
    e.preventDefault();

    const phoneInput = document.getElementById('customerPhone');
    const phone = phoneInput.value.trim();
    const name = document.getElementById('customerName').value.trim();
    const amount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    if (!phone) {
      alert('Please enter a valid phone number');
      return;
    }

    const sendBtn = document.getElementById('sendStkBtn');
    sendBtn.disabled = true;
    sendBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Triggering STK Push...`;

    try {
      const res = await fetch('/api/mpesa/stkpush', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone,
          amount,
          items: cart,
          customerName: name
        })
      });

      const data = await res.json();

      if (data.success) {
        // Transition to STK Push Wait Screen (Step 2)
        mpesaStep1.style.display = 'none';
        mpesaStep2.style.display = 'block';

        if (data.mode === 'live') {
          stkMessageText.innerHTML = `<strong style="color: #10B981;">LIVE SAFARICOM M-PESA:</strong> ${data.customerMessage}`;
        } else {
          stkMessageText.innerHTML = `<strong>STK Push Prompt Sent:</strong> ${data.customerMessage}<br><small style="color: var(--gold-primary); margin-top:6px; display:inline-block;">(Running in Simulator Mode. Add real Daraja keys in Admin Settings for live handset prompts)</small>`;
        }

        // Start 30s Countdown
        let seconds = 30;
        stkCountdown.textContent = seconds;

        if (stkPollInterval) clearInterval(stkPollInterval);

        stkPollInterval = setInterval(async () => {
          seconds--;
          stkCountdown.textContent = seconds;

          // Poll status endpoint
          try {
            const statusRes = await fetch(`/api/mpesa/status/${data.checkoutRequestId}`);
            if (statusRes.ok) {
              const statusData = await statusRes.json();
              if (statusData.status === 'COMPLETED') {
                clearInterval(stkPollInterval);
                showReceipt(statusData);
              }
            }
          } catch (pollErr) {
            console.warn('Error polling STK status:', pollErr);
          }

          if (seconds <= 0) {
            clearInterval(stkPollInterval);
            alert('M-Pesa payment prompt timed out or was not confirmed. Please try again.');
            mpesaStep1.style.display = 'block';
            mpesaStep2.style.display = 'none';
            sendBtn.disabled = false;
            sendBtn.innerHTML = `<i class="fa-solid fa-paper-plane"></i> Send STK Push Prompt`;
          }
        }, 1000);

      } else {
        alert(data.message || 'Failed to trigger M-Pesa STK Push. Please verify your credentials or phone number.');
        sendBtn.disabled = false;
        sendBtn.innerHTML = `<i class="fa-solid fa-paper-plane"></i> Send STK Push Prompt`;
      }

    } catch (err) {
      alert('Network Error triggering M-Pesa STK Push: ' + err.message);
      sendBtn.disabled = false;
      sendBtn.innerHTML = `<i class="fa-solid fa-paper-plane"></i> Send STK Push Prompt`;
    }
  }

  function showReceipt(orderData) {
    mpesaStep2.style.display = 'none';
    mpesaStep3.style.display = 'block';

    receiptMpesaCode.textContent = orderData.mpesaReceiptNumber || 'QK982718K';
    receiptAmount.textContent = `KES ${orderData.amount.toLocaleString()}`;
    receiptPhone.textContent = `+${orderData.phone}`;
    receiptTime.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ', ' + new Date().toLocaleDateString();

    // Clear Shopping Cart
    cart = [];
    saveCart();
    updateCartUI();
  }

  // --- ADMIN PORTAL LOGIC ---
  function openAdminPortal() {
    adminModal.classList.add('active');
    if (adminToken) {
      adminLoginView.style.display = 'none';
      adminDashboardView.style.display = 'block';
      loadAdminData();
    } else {
      adminLoginView.style.display = 'block';
      adminDashboardView.style.display = 'none';
    }
  }

  async function handleAdminLogin(e) {
    e.preventDefault();
    const password = document.getElementById('adminPass').value;

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });

      const data = await res.json();
      if (data.success) {
        adminToken = data.token;
        localStorage.setItem('vibe_admin_token', adminToken);
        adminLoginView.style.display = 'none';
        adminDashboardView.style.display = 'block';
        loadAdminData();
      } else {
        alert(data.message || 'Invalid admin password');
      }
    } catch (err) {
      alert('Login error: ' + err.message);
    }
  }

  function handleAdminLogout() {
    adminToken = null;
    localStorage.removeItem('vibe_admin_token');
    adminLoginView.style.display = 'block';
    adminDashboardView.style.display = 'none';
  }

  function loadAdminData() {
    renderInventoryTable();
    loadOrdersTable();
    loadDarajaConfig();
  }

  function renderInventoryTable() {
    const searchVal = (inventorySearch.value || '').toLowerCase();
    const filtered = products.filter(p => 
      p.title.toLowerCase().includes(searchVal) || 
      p.category.toLowerCase().includes(searchVal)
    );

    inventoryTableBody.innerHTML = filtered.map(p => `
      <tr>
        <td><img src="${p.image}" alt="${p.title}" class="table-img" onerror="this.src='/assets/images/chrome_hearts_black_tee.jpg'"></td>
        <td><strong>${p.title}</strong></td>
        <td>${p.category}</td>
        <td><strong>KES ${p.price.toLocaleString()}</strong></td>
        <td>${p.stockQty || 10} pcs</td>
        <td>
          <span class="stock-badge ${p.inStock ? '' : 'out-of-stock'}">
            ${p.inStock ? 'In Stock' : 'Sold Out'}
          </span>
        </td>
        <td>
          <button class="btn btn-outline btn-sm toggle-stock-btn" data-id="${p.id}">
            <i class="fa-solid fa-rotate"></i> Toggle
          </button>
          <button class="btn btn-outline btn-sm delete-prod-btn" data-id="${p.id}" style="color: #EF4444; border-color: rgba(239,68,68,0.3);">
            <i class="fa-solid fa-trash"></i> Delete
          </button>
        </td>
      </tr>
    `).join('');
  }

  async function handleAddProduct(e) {
    e.preventDefault();

    const title = document.getElementById('prodTitle').value.trim();
    const category = document.getElementById('prodCategory').value;
    const price = parseFloat(document.getElementById('prodPrice').value) || 0;
    const description = document.getElementById('prodDescription').value.trim();
    const sizesRaw = document.getElementById('prodSizes').value.trim();
    const stockQty = parseInt(document.getElementById('prodStockQty').value) || 10;
    const imageUrl = document.getElementById('prodImageUrl').value.trim();
    const tagsRaw = document.getElementById('prodTags').value.trim();
    const featured = document.getElementById('prodFeatured').checked;

    const sizes = sizesRaw ? sizesRaw.split(',').map(s => s.trim()).filter(Boolean) : ['S', 'M', 'L', 'XL'];
    const tags = tagsRaw ? tagsRaw.split(',').map(t => t.trim()).filter(Boolean) : ['New Drop'];

    const fileInput = document.getElementById('prodImageFile');

    let localDataUrl = null;
    let cloudinaryUrl = null;

    // Check Cloudinary Credentials (Defaults to pre-configured yvbo2mtt & clothstore_preset)
    const cldCloud = localStorage.getItem('vibe_cloudinary_cloud_name') || 'yvbo2mtt';
    const cldPreset = localStorage.getItem('vibe_cloudinary_preset') || 'clothstore_preset';

    if (fileInput.files.length > 0) {
      // 1. Try Cloudinary direct upload if configured
      if (cldCloud && cldPreset) {
        try {
          const cldForm = new FormData();
          cldForm.append('file', fileInput.files[0]);
          cldForm.append('upload_preset', cldPreset);

          const cldRes = await fetch(`https://api.cloudinary.com/v1_1/${cldCloud}/image/upload`, {
            method: 'POST',
            body: cldForm
          });

          if (cldRes.ok) {
            const cldData = await cldRes.json();
            if (cldData.secure_url) {
              cloudinaryUrl = cldData.secure_url;
            }
          }
        } catch (cldErr) {
          console.warn('Cloudinary upload error:', cldErr);
        }
      }

      // 2. Local compressed canvas backup
      try {
        localDataUrl = await compressImageFile(fileInput.files[0], 800, 800, 0.75);
      } catch (err) {
        console.warn('Image compression error:', err);
      }
    }

    const finalImage = cloudinaryUrl || localDataUrl || imageUrl || 'assets/images/chrome_hearts_black_tee.jpg';

    const formData = new FormData();
    formData.append('title', title);
    formData.append('category', category);
    formData.append('price', price);
    formData.append('description', description);
    formData.append('sizes', JSON.stringify(sizes));
    formData.append('stockQty', stockQty);
    formData.append('imageUrl', finalImage);
    formData.append('tags', JSON.stringify(tags));
    formData.append('featured', featured);

    if (fileInput.files.length > 0 && !cloudinaryUrl) {
      formData.append('imageFile', fileInput.files[0]);
    }

    let createdProduct = null;

    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.product) {
          createdProduct = data.product;
        }
      }
    } catch (err) {
      console.warn('Backend upload failed, creating product locally:', err);
    }

    if (!createdProduct) {
      createdProduct = {
        id: 'prod_' + Date.now(),
        title: title || 'New Streetwear Item',
        category: category || 'T-Shirts',
        price: price,
        image: finalImage,
        description: description,
        sizes: sizes,
        inStock: true,
        stockQty: stockQty,
        featured: featured,
        tags: tags,
        createdAt: new Date().toISOString()
      };
    } else {
      createdProduct.image = finalImage;
    }

    // Save to localStorage safely
    try {
      const customProducts = JSON.parse(localStorage.getItem('vibe_custom_products') || '[]');
      const filtered = customProducts.filter(p => p.id !== createdProduct.id);
      filtered.unshift(createdProduct);
      localStorage.setItem('vibe_custom_products', JSON.stringify(filtered));
    } catch (storageErr) {
      console.warn('localStorage quota reached, keeping latest 15 listings:', storageErr);
      try {
        let customProducts = JSON.parse(localStorage.getItem('vibe_custom_products') || '[]');
        customProducts = customProducts.filter(p => p.id !== createdProduct.id);
        customProducts.unshift(createdProduct);
        customProducts = customProducts.slice(0, 15);
        localStorage.setItem('vibe_custom_products', JSON.stringify(customProducts));
      } catch (e) {
        console.error('Could not save to localStorage:', e);
      }
    }

    alert('Product added successfully!' + (cloudinaryUrl ? ' (Saved to Cloudinary Cloud)' : ''));
    addProductForm.reset();
    await fetchProducts();
    renderInventoryTable();
  }

  async function loadOrdersTable() {
    try {
      const res = await fetch('/api/orders');
      if (res.ok) {
        const orders = await res.json();
        ordersTableBody.innerHTML = orders.map(o => `
          <tr>
            <td>${new Date(o.createdAt || Date.now()).toLocaleString()}</td>
            <td><strong class="mpesa-code-text">${o.mpesaReceiptNumber || o.checkoutRequestId}</strong></td>
            <td>+${o.phone}</td>
            <td>${o.customerName || 'Customer'}</td>
            <td><strong>KES ${(o.amount || 0).toLocaleString()}</strong></td>
            <td>
              <span class="stock-badge ${o.status === 'COMPLETED' ? '' : 'out-of-stock'}">
                ${o.status}
              </span>
            </td>
          </tr>
        `).join('');
      }
    } catch (err) {
      console.warn('Failed to load orders:', err);
    }
  }

  async function loadDarajaConfig() {
    try {
      const res = await fetch('/api/config');
      if (res.ok) {
        const cfg = await res.json();
        if (document.getElementById('cfgEnv')) document.getElementById('cfgEnv').value = cfg.mpesaEnv || 'sandbox';
        if (document.getElementById('cfgShortcode')) document.getElementById('cfgShortcode').value = cfg.mpesaShortcode || '174379';
        if (document.getElementById('cfgStoreName')) document.getElementById('cfgStoreName').value = cfg.storeName || 'VIBE APPAREL & KICKS';
      }
    } catch (err) {
      console.warn('Failed to load config:', err);
    }

    if (document.getElementById('cfgCloudinaryCloudName')) {
      document.getElementById('cfgCloudinaryCloudName').value = localStorage.getItem('vibe_cloudinary_cloud_name') || 'yvbo2mtt';
    }
    if (document.getElementById('cfgCloudinaryPreset')) {
      document.getElementById('cfgCloudinaryPreset').value = localStorage.getItem('vibe_cloudinary_preset') || 'clothstore_preset';
    }
  }

  async function handleConfigSave(e) {
    e.preventDefault();

    const cldCloudName = document.getElementById('cfgCloudinaryCloudName')?.value.trim() || '';
    const cldPreset = document.getElementById('cfgCloudinaryPreset')?.value.trim() || '';

    if (cldCloudName) localStorage.setItem('vibe_cloudinary_cloud_name', cldCloudName);
    if (cldPreset) localStorage.setItem('vibe_cloudinary_preset', cldPreset);

    const configData = {
      storeName: document.getElementById('cfgStoreName').value.trim(),
      adminPassword: document.getElementById('cfgNewPass').value.trim() || undefined,
      cloudinary: {
        cloudName: cldCloudName,
        uploadPreset: cldPreset
      },
      mpesa: {
        environment: document.getElementById('cfgEnv').value,
        shortcode: document.getElementById('cfgShortcode').value.trim(),
        consumerKey: document.getElementById('cfgConsumerKey').value.trim() || undefined,
        consumerSecret: document.getElementById('cfgConsumerSecret').value.trim() || undefined,
        passkey: document.getElementById('cfgPasskey').value.trim() || undefined,
        callbackUrl: document.getElementById('cfgCallbackUrl').value.trim() || undefined
      }
    };

    try {
      const res = await fetch('/api/admin/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(configData)
      });
      const data = await res.json();
      if (data.success) {
        alert('Settings saved successfully!');
      }
    } catch (err) {
      alert('Settings saved locally! (API offline)');
    }
  }

  // --- EVENT LISTENERS ---
  function setupEventListeners() {
    // Search
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      clearSearchBtn.hidden = searchQuery === '';
      renderCatalog();
    });

    clearSearchBtn.addEventListener('click', () => {
      searchInput.value = '';
      searchQuery = '';
      clearSearchBtn.hidden = true;
      renderCatalog();
    });

    // Category Tabs
    categoryTabs.addEventListener('click', (e) => {
      const btn = e.target.closest('.tab-btn');
      if (!btn) return;
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeCategory = btn.dataset.category;
      renderCatalog();
    });

    // Sort & Stock filter
    sortSelect.addEventListener('change', (e) => {
      sortBy = e.target.value;
      renderCatalog();
    });

    inStockOnlyCheck.addEventListener('change', (e) => {
      inStockOnly = e.target.checked;
      renderCatalog();
    });

    resetFiltersBtn.addEventListener('click', () => {
      searchInput.value = '';
      searchQuery = '';
      activeCategory = 'All';
      inStockOnly = false;
      sortBy = 'featured';
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.category === 'All'));
      inStockOnlyCheck.checked = false;
      sortSelect.value = 'featured';
      renderCatalog();
    });

    // Grid Actions (Quick View & Add to Cart)
    productGrid.addEventListener('click', (e) => {
      const qvBtn = e.target.closest('.quick-view-btn');
      if (qvBtn) {
        openQuickView(qvBtn.dataset.id);
        return;
      }

      const addBtn = e.target.closest('.add-to-cart-direct');
      if (addBtn) {
        addToCart(addBtn.dataset.id);
      }
    });

    // Quick View Modal
    closeQuickView.addEventListener('click', () => quickViewModal.classList.remove('active'));

    qvSizesContainer.addEventListener('click', (e) => {
      const sizeBtn = e.target.closest('.size-option-btn');
      if (!sizeBtn) return;
      document.querySelectorAll('.size-option-btn').forEach(b => b.classList.remove('selected'));
      sizeBtn.classList.add('selected');
      selectedQvSize = sizeBtn.dataset.size;
    });

    qvMinusBtn.addEventListener('click', () => {
      let val = parseInt(qvQtyInput.value) || 1;
      if (val > 1) qvQtyInput.value = val - 1;
    });

    qvPlusBtn.addEventListener('click', () => {
      let val = parseInt(qvQtyInput.value) || 1;
      qvQtyInput.value = val + 1;
    });

    qvAddToCartBtn.addEventListener('click', () => {
      if (currentQvProduct) {
        const qty = parseInt(qvQtyInput.value) || 1;
        addToCart(currentQvProduct.id, selectedQvSize, qty);
        quickViewModal.classList.remove('active');
      }
    });

    // Cart Drawer
    cartBtn.addEventListener('click', openCartDrawer);
    closeCartDrawer.addEventListener('click', closeCartDrawerFunc);
    cartDrawerBackdrop.addEventListener('click', (e) => {
      if (e.target === cartDrawerBackdrop) closeCartDrawerFunc();
    });

    cartItemsContainer.addEventListener('click', (e) => {
      const removeBtn = e.target.closest('.remove-cart-item');
      if (removeBtn) {
        removeCartItem(parseInt(removeBtn.dataset.index));
        return;
      }

      const qtyBtn = e.target.closest('.cart-qty-btn');
      if (qtyBtn) {
        const idx = parseInt(qtyBtn.dataset.index);
        const delta = parseInt(qtyBtn.dataset.delta);
        updateCartQuantity(idx, delta);
      }
    });

    proceedMpesaBtn.addEventListener('click', openMpesaCheckout);

    // M-Pesa Modal
    closeMpesaModal.addEventListener('click', () => mpesaModal.classList.remove('active'));
    mpesaForm.addEventListener('submit', handleMpesaSubmit);
    closeReceiptBtn.addEventListener('click', () => mpesaModal.classList.remove('active'));

    // Admin Portal
    openAdminBtn.addEventListener('click', openAdminPortal);
    heroAdminBtn.addEventListener('click', openAdminPortal);
    closeAdminModal.addEventListener('click', () => adminModal.classList.remove('active'));
    adminLoginForm.addEventListener('submit', handleAdminLogin);
    adminLogoutBtn.addEventListener('click', handleAdminLogout);

    // Admin Tabs
    document.querySelectorAll('.admin-tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.admin-tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.admin-tab-panel').forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById(`tab-${btn.dataset.admintab}`).classList.add('active');
      });
    });

    // Admin Forms
    addProductForm.addEventListener('submit', handleAddProduct);
    inventorySearch.addEventListener('input', renderInventoryTable);
    darajaConfigForm.addEventListener('submit', handleConfigSave);

    const resetSimulatorBtn = document.getElementById('resetSimulatorBtn');
    if (resetSimulatorBtn) {
      resetSimulatorBtn.addEventListener('click', async () => {
        document.getElementById('cfgConsumerKey').value = '';
        document.getElementById('cfgConsumerSecret').value = '';
        document.getElementById('cfgPasskey').value = '';
        document.getElementById('cfgShortcode').value = '174379';
        document.getElementById('cfgEnv').value = 'sandbox';

        await fetch('/api/admin/config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mpesa: {
              environment: 'sandbox',
              shortcode: '174379',
              passkey: 'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919',
              consumerKey: 'YOUR_CONSUMER_KEY',
              consumerSecret: 'YOUR_CONSUMER_SECRET'
            }
          })
        });

        alert('Cleared API keys! M-Pesa is now running in instant Simulator Mode.');
      });
    }

    // Inventory Table Actions
    inventoryTableBody.addEventListener('click', async (e) => {
      const toggleBtn = e.target.closest('.toggle-stock-btn');
      if (toggleBtn) {
        const prodId = toggleBtn.dataset.id;
        const prod = products.find(p => p.id === prodId);
        if (prod) {
          prod.inStock = !prod.inStock;
          await fetch('/api/products/' + prodId, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ inStock: prod.inStock })
          });
          await fetchProducts();
          renderInventoryTable();
        }
        return;
      }

      const deleteBtn = e.target.closest('.delete-prod-btn');
      if (deleteBtn) {
        const prodId = deleteBtn.dataset.id;
        if (confirm('Are you sure you want to delete this product?')) {
          let customProducts = JSON.parse(localStorage.getItem('vibe_custom_products') || '[]');
          customProducts = customProducts.filter(p => p.id !== prodId);
          localStorage.setItem('vibe_custom_products', JSON.stringify(customProducts));

          try {
            await fetch('/api/products/' + prodId, { method: 'DELETE' });
          } catch (err) {}

          await fetchProducts();
          renderInventoryTable();
        }
      }
    });
  }
});
