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
  const qvGalleryThumbs = document.getElementById('qvGalleryThumbs');
  const qvColorsGroup = document.getElementById('qvColorsGroup');
  const qvColorsContainer = document.getElementById('qvColorsContainer');
  let selectedQvColor = '';

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
  const colorVariantsList = document.getElementById('colorVariantsList');
  const addColorVariantBtn = document.getElementById('addColorVariantBtn');

  function addColorVariantRow(name = '', hex = '#E5C158') {
    if (!colorVariantsList) return;
    const row = document.createElement('div');
    row.className = 'color-variant-row';
    row.style.cssText = 'display: flex; gap: 8px; align-items: center; background: rgba(255,255,255,0.03); padding: 8px; border-radius: var(--radius-sm); border: 1px solid var(--border-color);';
    row.innerHTML = `
      <input type="text" class="cvar-name" value="${name}" placeholder="Color Name (e.g. Royal Blue)" style="flex: 1; padding: 6px 10px; font-size: 0.85rem; border-radius: var(--radius-sm); background: #000; border: 1px solid var(--border-color); color: #fff;">
      <input type="color" class="cvar-hex" value="${hex}" style="width: 38px; height: 34px; padding: 2px; border-radius: 4px; border: 0; cursor: pointer; background: transparent;">
      <input type="file" class="cvar-file" accept="image/*" style="flex: 1.2; font-size: 0.75rem; color: var(--text-muted);">
      <button type="button" class="remove-cvar-btn" style="color: #EF4444; background: none; border: 0; cursor: pointer; font-size: 1rem; padding: 4px;"><i class="fa-solid fa-trash"></i></button>
    `;
    colorVariantsList.appendChild(row);
  }

  if (addColorVariantBtn) {
    addColorVariantBtn.addEventListener('click', () => addColorVariantRow());
  }

  if (colorVariantsList) {
    colorVariantsList.addEventListener('click', (e) => {
      const rmBtn = e.target.closest('.remove-cvar-btn');
      if (rmBtn) {
        const row = rmBtn.closest('.color-variant-row');
        if (row) row.remove();
      }
    });
  }
  const inventoryTableBody = document.getElementById('inventoryTableBody');
  const inventorySearch = document.getElementById('inventorySearch');
  const ordersTableBody = document.getElementById('ordersTableBody');
  const darajaConfigForm = document.getElementById('darajaConfigForm');

  const DEFAULT_PRODUCTS = [
    {
      "id": "prod_1",
      "title": "Chrome Hearts Cross Rhinestone Luxury Tee",
      "category": "T-Shirts",
      "price": 2500,
      "image": "assets/images/chrome_hearts_black_tee.jpg",
      "images": [
        "assets/images/chrome_hearts_black_tee.jpg",
        "assets/images/chrome_hearts_blue_tee.jpg"
      ],
      "colors": [
        { "name": "Midnight Black", "hex": "#111111", "image": "assets/images/chrome_hearts_black_tee.jpg" },
        { "name": "Royal Blue", "hex": "#1E3A8A", "image": "assets/images/chrome_hearts_blue_tee.jpg" }
      ],
      "description": "Oversized luxury heavyweight cotton t-shirt featuring Chrome Hearts front chest logo and iconic cross crystal print back.",
      "sizes": ["S", "M", "L", "XL", "XXL"],
      "inStock": true,
      "stockQty": 15,
      "featured": true,
      "tags": ["Streetwear", "Bestseller", "New"]
    },
    {
      "id": "prod_2",
      "title": "Stussy 8-Ball Vintage Graphic Tee",
      "category": "T-Shirts",
      "price": 2200,
      "image": "assets/images/stussy_brown_tee.jpg",
      "images": [
        "assets/images/stussy_brown_tee.jpg",
        "assets/images/stussy_black_tee.jpg",
        "assets/images/stussy_white_tee.jpg"
      ],
      "colors": [
        { "name": "Vintage Brown", "hex": "#4A2E1B", "image": "assets/images/stussy_brown_tee.jpg" },
        { "name": "Washed Black", "hex": "#1A1A1A", "image": "assets/images/stussy_black_tee.jpg" },
        { "name": "Fresh White", "hex": "#FFFFFF", "image": "assets/images/stussy_white_tee.jpg" }
      ],
      "description": "Classic streetwear tee with pink Stussy script logo and signature 8-ball graphic print.",
      "sizes": ["S", "M", "L", "XL"],
      "inStock": true,
      "stockQty": 25,
      "featured": true,
      "tags": ["Vintage", "Popular"]
    },
    {
      "id": "prod_6",
      "title": "Los Angeles L.A. 3-Piece Track Set & Cap",
      "category": "Sets & Suits",
      "price": 4200,
      "image": "assets/images/la_shortset_red.jpg",
      "images": [
        "assets/images/la_shortset_red.jpg",
        "assets/images/la_shortset_black.jpg",
        "assets/images/la_shortset_brown.jpg"
      ],
      "colors": [
        { "name": "Bold Red", "hex": "#DC2626", "image": "assets/images/la_shortset_red.jpg" },
        { "name": "Midnight Black", "hex": "#111827", "image": "assets/images/la_shortset_black.jpg" },
        { "name": "Mocha Brown", "hex": "#6B4636", "image": "assets/images/la_shortset_brown.jpg" }
      ],
      "description": "3-Piece Premium Streetwear Set: Oversized embroidered Los Angeles t-shirt, matching drawstring shorts, and crisp white LA baseball cap.",
      "sizes": ["M", "L", "XL", "XXL"],
      "inStock": true,
      "stockQty": 20,
      "featured": true,
      "tags": ["3-Piece Set", "Trending"]
    },
    {
      "id": "prod_9",
      "title": "Air Jordan 1 High Bred Retro Kicks",
      "category": "Shoes & Kicks",
      "price": 6800,
      "image": "assets/images/jordan_sneaker.jpg",
      "images": ["assets/images/jordan_sneaker.jpg"],
      "colors": [{ "name": "Bred Red/Black", "hex": "#991B1B", "image": "assets/images/jordan_sneaker.jpg" }],
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
      "images": ["assets/images/dunk_sneaker.jpg"],
      "colors": [{ "name": "Forest Green", "hex": "#15803D", "image": "assets/images/dunk_sneaker.jpg" }],
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
      "images": ["assets/images/cream_sweater.jpg"],
      "colors": [{ "name": "Cream White", "hex": "#FEF3C7", "image": "assets/images/cream_sweater.jpg" }],
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

    if (window.location.hash === '#admin' || localStorage.getItem('vibe_last_view') === 'admin') {
      openAdminPortal();
    }
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

        const colorsHtml = p.colors && p.colors.length > 0 ? `
          <div class="card-colors-row">
            ${p.colors.map((c, i) => `
              <span class="card-color-chip ${i === 0 ? 'active' : ''}" data-id="${p.id}" data-img="${getImageUrl(c.image || p.image)}" data-color="${c.name}">
                <span class="color-swatch-dot" style="background-color: ${c.hex || '#E5C158'};"></span> ${c.name}
              </span>
            `).join('')}
          </div>
        ` : '';

        const defaultColor = p.colors && p.colors.length > 0 ? p.colors[0].name : '';

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
              ${colorsHtml}
              <div class="card-sizes">
                ${sizesHtml}
              </div>
              <div class="card-footer">
                <button class="btn btn-gold btn-full add-to-cart-direct" data-id="${p.id}" data-selected-color="${defaultColor}" ${!p.inStock ? 'disabled' : ''}>
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
    selectedQvColor = product.colors && product.colors.length > 0 ? product.colors[0].name : '';

    const initialImg = getImageUrl(product.image);
    qvImage.src = initialImg;
    qvCategory.textContent = product.category;
    qvTitle.textContent = product.title;
    qvPrice.textContent = `KES ${product.price.toLocaleString()}`;
    qvDescription.textContent = product.description || 'No detailed description available.';
    qvQtyInput.value = 1;

    // Build list of all available images (main image, images array, color variant images)
    const allImages = [];
    if (product.image) allImages.push(product.image);
    if (product.images && product.images.length > 0) {
      product.images.forEach(img => {
        if (!allImages.includes(img)) allImages.push(img);
      });
    }
    if (product.colors && product.colors.length > 0) {
      product.colors.forEach(c => {
        if (c.image && !allImages.includes(c.image)) allImages.push(c.image);
      });
    }

    // Render Thumbnail Gallery
    if (allImages.length > 1) {
      qvGalleryThumbs.style.display = 'flex';
      qvGalleryThumbs.innerHTML = allImages.map((img, idx) => `
        <button class="qv-thumb-btn ${idx === 0 ? 'active' : ''}" data-img="${getImageUrl(img)}">
          <img src="${getImageUrl(img)}" alt="thumb">
        </button>
      `).join('');
    } else {
      qvGalleryThumbs.style.display = 'none';
      qvGalleryThumbs.innerHTML = '';
    }

    // Render Color Options
    if (product.colors && product.colors.length > 0) {
      qvColorsGroup.style.display = 'block';
      qvColorsContainer.innerHTML = product.colors.map((c, idx) => `
        <button class="color-swatch-btn ${idx === 0 ? 'selected' : ''}" data-color="${c.name}" data-img="${getImageUrl(c.image || product.image)}">
          <span class="color-swatch-dot" style="background-color: ${c.hex || '#E5C158'};"></span>
          ${c.name}
        </button>
      `).join('');
    } else {
      qvColorsGroup.style.display = 'none';
      qvColorsContainer.innerHTML = '';
    }

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
  function addToCart(productId, size = null, qty = 1, color = null) {
    const product = products.find(p => p.id === productId);
    if (!product || !product.inStock) return;

    const chosenSize = size || (product.sizes && product.sizes.length > 0 ? product.sizes[0] : 'Standard');
    const chosenColor = color || selectedQvColor || (product.colors && product.colors.length > 0 ? product.colors[0].name : null);

    let chosenImage = product.image;
    if (chosenColor && product.colors) {
      const matchedColor = product.colors.find(c => c.name === chosenColor);
      if (matchedColor && matchedColor.image) {
        chosenImage = matchedColor.image;
      }
    }

    const existingIndex = cart.findIndex(item => item.id === productId && item.size === chosenSize && item.color === chosenColor);

    if (existingIndex > -1) {
      cart[existingIndex].quantity += qty;
    } else {
      cart.push({
        id: product.id,
        title: product.title,
        price: product.price,
        image: chosenImage,
        category: product.category,
        size: chosenSize,
        color: chosenColor,
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
            <div class="cart-item-meta">
              ${item.color ? `Color: <strong>${item.color}</strong> &nbsp;|&nbsp; ` : ''}Size: <strong>${item.size}</strong>
            </div>
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
    localStorage.setItem('vibe_last_view', 'admin');
    if (window.location.hash !== '#admin') {
      try { history.pushState(null, null, '#admin'); } catch (e) {}
    }
    if (adminToken) {
      adminLoginView.style.display = 'none';
      adminDashboardView.style.display = 'block';
      loadAdminData();
    } else {
      adminLoginView.style.display = 'block';
      adminDashboardView.style.display = 'none';
    }
  }

  function closeAdminPortalFunc() {
    adminModal.classList.remove('active');
    localStorage.setItem('vibe_last_view', 'store');
    if (window.location.hash === '#admin') {
      try { history.pushState(null, null, ' '); } catch (e) {}
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
        localStorage.setItem('vibe_last_view', 'admin');
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
    localStorage.setItem('vibe_last_view', 'store');
    adminLoginView.style.display = 'block';
    adminDashboardView.style.display = 'none';
    closeAdminPortalFunc();
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

  let isSubmittingProduct = false;

  async function handleAddProduct(e) {
    e.preventDefault();
    if (isSubmittingProduct) return;

    const submitBtn = addProductForm.querySelector('button[type="submit"]');
    const originalBtnHtml = submitBtn ? submitBtn.innerHTML : '<i class="fa-solid fa-floppy-disk"></i> Save &amp; Display in Store';

    isSubmittingProduct = true;
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Uploading to Cloudinary... Please wait';
    }

    try {
      const title = document.getElementById('prodTitle').value.trim();
      const category = document.getElementById('prodCategory').value;
      const price = parseFloat(document.getElementById('prodPrice').value) || 0;
      const description = document.getElementById('prodDescription').value.trim();
      const sizesRaw = document.getElementById('prodSizes').value.trim();
      const stockQty = parseInt(document.getElementById('prodStockQty').value) || 10;
      const imageUrlInput = document.getElementById('prodImageUrl').value.trim();
      const colorInputRaw = document.getElementById('prodColors') ? document.getElementById('prodColors').value.trim() : '';
      const tagsRaw = document.getElementById('prodTags').value.trim();
      const featured = document.getElementById('prodFeatured').checked;

      const sizes = sizesRaw ? sizesRaw.split(',').map(s => s.trim()).filter(Boolean) : ['S', 'M', 'L', 'XL'];
      const tags = tagsRaw ? tagsRaw.split(',').map(t => t.trim()).filter(Boolean) : ['New Drop'];
      const colorNames = colorInputRaw ? colorInputRaw.split(',').map(c => c.trim()).filter(Boolean) : [];

      const fileInput = document.getElementById('prodImageFile');

      let uploadedImages = [];

      // Check Cloudinary Credentials
      const cldCloud = localStorage.getItem('vibe_cloudinary_cloud_name') || 'yvbo2mtt';
      const cldPreset = localStorage.getItem('vibe_cloudinary_preset') || 'clothstore_preset';

      if (fileInput.files.length > 0) {
        for (let i = 0; i < fileInput.files.length; i++) {
          if (submitBtn) {
            submitBtn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> Uploading photo ${i + 1} of ${fileInput.files.length}...`;
          }
          const file = fileInput.files[i];
          let cldUrl = null;

          // 1. Try Cloudinary direct upload
          if (cldCloud && cldPreset) {
            try {
              const cldForm = new FormData();
              cldForm.append('file', file);
              cldForm.append('upload_preset', cldPreset);

              const cldRes = await fetch(`https://api.cloudinary.com/v1_1/${cldCloud}/image/upload`, {
                method: 'POST',
                body: cldForm
              });

              if (cldRes.ok) {
                const cldData = await cldRes.json();
                if (cldData.secure_url) {
                  cldUrl = cldData.secure_url;
                }
              }
            } catch (cldErr) {
              console.warn('Cloudinary upload error for file', i, cldErr);
            }
          }

          // 2. Local compressed canvas backup
          if (!cldUrl) {
            try {
              cldUrl = await compressImageFile(file, 800, 800, 0.75);
            } catch (err) {}
          }

          if (cldUrl) {
            uploadedImages.push(cldUrl);
          }
        }
      }

      if (imageUrlInput) {
        const extraUrls = imageUrlInput.split(',').map(u => u.trim()).filter(Boolean);
        uploadedImages = [...uploadedImages, ...extraUrls];
      }

      // Colors & photos mapping
      const colors = [];
      const colorRows = colorVariantsList ? colorVariantsList.querySelectorAll('.color-variant-row') : [];

      let rowIdx = 1;
      for (let row of colorRows) {
        const cNameInput = row.querySelector('.cvar-name');
        const cHexInput = row.querySelector('.cvar-hex');
        const cFileInput = row.querySelector('.cvar-file');

        const cName = cNameInput ? cNameInput.value.trim() : '';
        const cHex = cHexInput ? cHexInput.value : '#E5C158';
        const cFile = cFileInput && cFileInput.files.length > 0 ? cFileInput.files[0] : null;

        if (cName) {
          let cImg = null;
          if (cFile) {
            if (submitBtn) {
              submitBtn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> Uploading ${cName} color photo...`;
            }
            if (cldCloud && cldPreset) {
              try {
                const cldForm = new FormData();
                cldForm.append('file', cFile);
                cldForm.append('upload_preset', cldPreset);
                const cldRes = await fetch(`https://api.cloudinary.com/v1_1/${cldCloud}/image/upload`, {
                  method: 'POST',
                  body: cldForm
                });
                if (cldRes.ok) {
                  const cldData = await cldRes.json();
                  if (cldData.secure_url) cImg = cldData.secure_url;
                }
              } catch (err) {}
            }
            if (!cImg) {
              try { cImg = await compressImageFile(cFile, 800, 800, 0.75); } catch (err) {}
            }
          }
          if (cImg) {
            uploadedImages.push(cImg);
          }
          colors.push({
            name: cName,
            hex: cHex,
            image: cImg
          });
        }
        rowIdx++;
      }

      if (colors.length === 0 && colorNames.length > 0) {
        colorNames.forEach((name, idx) => {
          colors.push({
            name: name,
            hex: '#E5C158',
            image: uploadedImages[idx] || uploadedImages[0] || null
          });
        });
      }

      const finalImage = uploadedImages[0] || 'assets/images/chrome_hearts_black_tee.jpg';
      if (uploadedImages.length === 0) {
        uploadedImages = [finalImage];
      }

      colors.forEach(c => {
        if (!c.image) c.image = finalImage;
      });

      if (submitBtn) {
        submitBtn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Saving to catalog...';
      }

      const formData = new FormData();
      formData.append('title', title);
      formData.append('category', category);
      formData.append('price', price);
      formData.append('description', description);
      formData.append('sizes', JSON.stringify(sizes));
      formData.append('stockQty', stockQty);
      formData.append('imageUrl', finalImage);
      formData.append('images', JSON.stringify(uploadedImages));
      formData.append('colors', JSON.stringify(colors));
      formData.append('tags', JSON.stringify(tags));
      formData.append('featured', featured);

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
          images: uploadedImages,
          colors: colors,
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
        createdProduct.images = uploadedImages;
        createdProduct.colors = colors;
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

      alert('Product added successfully! (' + uploadedImages.length + ' photo' + (uploadedImages.length > 1 ? 's' : '') + ' saved)');
      addProductForm.reset();
      if (colorVariantsList) colorVariantsList.innerHTML = '';
      await fetchProducts();
      renderInventoryTable();
    } catch (error) {
      console.error('Add product error:', error);
      alert('An error occurred while uploading. Please try again.');
    } finally {
      isSubmittingProduct = false;
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnHtml;
      }
    }
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

    // Grid Actions (Quick View, Add to Cart, & Color Swatch Taps)
    productGrid.addEventListener('click', (e) => {
      const colorChip = e.target.closest('.card-color-chip');
      if (colorChip) {
        const card = colorChip.closest('.product-card');
        if (card) {
          card.querySelectorAll('.card-color-chip').forEach(chip => chip.classList.remove('active'));
          colorChip.classList.add('active');
          const cardImg = card.querySelector('.card-media img');
          if (cardImg && colorChip.dataset.img) {
            cardImg.src = colorChip.dataset.img;
          }
          const addBtn = card.querySelector('.add-to-cart-direct');
          if (addBtn) {
            addBtn.dataset.selectedColor = colorChip.dataset.color;
          }
        }
        return;
      }

      const qvBtn = e.target.closest('.quick-view-btn');
      if (qvBtn) {
        openQuickView(qvBtn.dataset.id);
        return;
      }

      const addBtn = e.target.closest('.add-to-cart-direct');
      if (addBtn) {
        const color = addBtn.dataset.selectedColor || null;
        addToCart(addBtn.dataset.id, null, 1, color);
      }
    });

    // Quick View Gallery & Color Swatch Listeners
    if (qvGalleryThumbs) {
      qvGalleryThumbs.addEventListener('click', (e) => {
        const thumb = e.target.closest('.qv-thumb-btn');
        if (!thumb) return;
        document.querySelectorAll('.qv-thumb-btn').forEach(t => t.classList.remove('active'));
        thumb.classList.add('active');
        if (thumb.dataset.img) {
          qvImage.src = thumb.dataset.img;
        }
      });
    }

    if (qvColorsContainer) {
      qvColorsContainer.addEventListener('click', (e) => {
        const swatch = e.target.closest('.color-swatch-btn');
        if (!swatch) return;
        document.querySelectorAll('.color-swatch-btn').forEach(s => s.classList.remove('selected'));
        swatch.classList.add('selected');
        selectedQvColor = swatch.dataset.color;
        if (swatch.dataset.img) {
          qvImage.src = swatch.dataset.img;
          document.querySelectorAll('.qv-thumb-btn').forEach(t => {
            t.classList.toggle('active', t.dataset.img === swatch.dataset.img);
          });
        }
      });
    }

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
        addToCart(currentQvProduct.id, selectedQvSize, qty, selectedQvColor);
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
    closeAdminModal.addEventListener('click', closeAdminPortalFunc);
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
