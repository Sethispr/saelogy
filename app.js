import dayjs from "dayjs";


/* Data (incomplete images for now) */
const data = {
  Light: ["9S (starr)","Aether","Angel Devil","Devine Kitsune","Gilbert Bougainvillea","Levi Ackerman","Lumine (starr)","Pacis Maria","Sakura Matou","Senku Ishigami","Tomaki Ichia","Yamada Asaemon Sagiri","Yoriichi Tsugikuni"].map(name => ({ name })),
  Dark: ["2B (starr)","Chainsaw Man","Dante","Feitan Portor","Fischl","Fumikage Tokoyami","Hu Tao","Ken Kaneki","Kokushibo","Muzan Kibutsuji","Nezuko Kamado","Power","Ryuk (starr)","Sable Mary","Souya Kawata","Tenebris (starr)","Tobio Kageyama","Vergil","Violence Devil","Yor Forger (starr)","Zombieman"].map(name => ({ name })),
  Balance: ["Elara Valestra","Gin","Hotaru Takegawa","Koshi Sugawara","Makima"].map(name => ({ name })),
  Grass: ["Izuna Tokage","Nahida","Neji Hyuuga","Obanai Iguro","Roronoa Zoro","Shinobu Kocho","Sinon","Sylvia Sherwood","Verdant Sentinel","Violet Evergarden (starr)","Yoichi Isagi"].map(name => ({ name })),
  Fire: [
    { name: "Ai Enma" },
    { name: "Blaze Howl" },
    { name: "Eris Boreas Greyrat", image: "https://cdn.discordapp.com/attachments/1069706839295528989/1413017196627755109/image.png?ex=68ba6650&is=68b914d0&hm=2697efa247d92eebbfe3b825bca4e5edee28978c8556cff44286592a178839ea", details: "Eris is a fiery and impulsive swordswoman from the world of Mushoku Tensei. Her aggressive fighting style makes her a top-tier choice for raid events that require high burst damage. She excels in frontline combat." },
    { name: "Juuzou Suzuya" },
    { name: "Kaizen Arashi" },
    { name: "Mavuika" },
    { name: "Mika Sei (starr)" },
    { name: "Orihime Inoue" },
    { name: "Ruby Hoshino" },
    { name: "Suzaku Kururugi" },
    { name: "Vinsmoke Sanji" },
    { name: "Xue Lian" }
  ],
  Water: ["Aqua Hoshino","Asuna","Higashiyama Kobeni","Kallen Kozuki","Neuvillette","Shoto Todoroki","Sophia Belle","Thomas Andre","Trunks"].map(name => ({ name })),
  Electric: ["Dio Brando","Emai Joma (starr)","Izuku Midoriya","Killua Zoldyck","Raiden Shogun (starr)","Yuu Nishinoya"].map(name => ({ name })),
  Ground: ["Aventurine","Aza Chobei","Cu Chulian","Damian Desmond","Gilda","Inosuke Hashibira","Mitsuya Takashi","Muichiro Tokito","Shion","Zhongli"].map(name => ({ name })),
};

const ELEMENTS = Object.keys(data);
const grid = document.getElementById("grid");
const elementFilters = document.getElementById("element-filters");
const searchInput = document.getElementById("search");
const raritySelect = document.getElementById("rarity");
const clearBtn = document.getElementById("clear-filters");
const emptyState = document.getElementById("empty-state");

const checkoutDialog = document.getElementById("checkout-dialog");
const checkoutTitle = document.getElementById("checkout-title");
const cartItemsList = document.getElementById("cart-items-list");
const cartGrandTotal = document.getElementById("cart-grand-total");
const confirmCheckoutBtn = document.getElementById("confirm-checkout");
const discordInput = document.getElementById("discord");
const reasonSelect = document.getElementById("reason");
const closeCheckoutBtn = document.getElementById("close-checkout");

const rentalsDrawer = document.getElementById("rentals-drawer");
const rentalsList = document.getElementById("rentals-list");
const openRentalsBtn = document.getElementById("open-rentals");
const closeRentalsBtn = document.getElementById("close-rentals");

const toasts = document.getElementById("toasts");
const ctaRandom = document.getElementById("cta-random");
const detailsDialog = document.getElementById("details-dialog");
const detailsTitle = document.getElementById("details-title");
const detailsBody = document.getElementById("details-body");
const closeDetailsBtn = document.getElementById("close-details");

const suggestions = document.getElementById("suggestions");
const RECENT_KEY = "arcana_recent_searches";

const openCartBtn = document.getElementById("open-cart");
const cartCountSpan = document.getElementById("cart-count");

const progressBar = document.getElementById("progress-bar");

// Discord Webhook URL for rental notifications (removed for now, will use github secrets)
const DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/";

let state = {
  elements: ELEMENTS.reduce((acc, el) => ({ ...acc, [el]: 0 }), {}), // 0: off, 1: include, 2: exclude
  query: "",
  rarity: "",
};
let cart = [];
let currentDetailsCard = null;

function parseRarity(cardName) {
  return /\(starr\)/i.test(cardName) ? "Starlight" : "Mythic";
}
function baseName(cardName) {
  return cardName.replace(/\s*\s*\(\s*starr\s*\)\s*/i, "").trim();
}
function priceFor(cardName) {
  const r = parseRarity(cardName);
  return r === "Starlight" ? 15000 : 10000; // per day
}

/* UI builders */
function buildElementFilters() {
  elementFilters.innerHTML = "";
  ELEMENTS.forEach(el => {
    const btn = document.createElement("button");
    btn.className = "element-tag";
    btn.dataset.element = el;
    btn.dataset.state = state.elements[el];
    btn.innerHTML = `<span class="element-tag-dot"></span><span>${el}</span>`;
    btn.addEventListener("click", () => {
      state.elements[el] = (state.elements[el] + 1) % 3;
      btn.dataset.state = state.elements[el];
      render();
    });
    elementFilters.appendChild(btn);
  });
}

function cardComponent(card) {
  const { element, name, image } = card;
  const rarity = parseRarity(name);
  const n = baseName(name);
  const perDay = priceFor(name);

  const el = document.createElement("div");
  el.className = "card rounded-xl border border-neutral-800 bg-neutral-950 shadow-soft flex p-3 gap-4 items-start cursor-pointer"; // Added cursor-pointer
  el.innerHTML = `
    <div class="flex-shrink-0 w-32 h-24 rounded-md bg-neutral-900/60 border border-neutral-800 p-1 flex items-center justify-center">
      ${image 
        ? `<img src="${image}" alt="${n}" class="w-full h-full object-contain">` 
        : `<div class="w-full h-full grid place-items-center text-neutral-600 text-2xl font-bold">${n.charAt(0).toUpperCase()}</div>`
      }
    </div>
    <div class="flex-grow flex flex-col justify-between self-stretch">
      <div>
        <p class="text-neutral-100 font-medium leading-tight">${n}</p>
        <div class="flex items-center gap-2 mt-1.5 text-xs">
          <span class="element-badge element-badge-${element.toLowerCase()} rounded-md border px-1.5 py-0.5 font-medium">${element}</span>
          <span class="text-neutral-500">${rarity}</span>
        </div>
      </div>
      <div class="flex items-center justify-between mt-2">
        <div class="text-neutral-300 text-sm">${perDay.toLocaleString()}/d</div>
        <div class="flex items-center gap-2">
          <button class="details inline-flex items-center justify-center rounded-md border border-neutral-800 h-8 w-8 text-neutral-400 hover:bg-neutral-900 hover:text-neutral-200 transition-colors" aria-label="Show details">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 11v5m0-8v.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>
          <button class="add-to-cart inline-flex items-center justify-center rounded-md bg-neutral-100 text-neutral-900 h-8 w-8 text-sm font-medium hover:bg-white transition" aria-label="Add to cart">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
          </button>
        </div>
      </div>
    </div>
  `;
  el.addEventListener("click", (event) => {
    // If the click target is one of the specific buttons, let their handlers take over.
    if (event.target.closest(".add-to-cart") || event.target.closest(".details")) {
      return;
    }
    openDetailsModal({ element, name: n, rarity, perDay, image, details: card.details });
  });
  el.querySelector(".add-to-cart").addEventListener("click", (event) => {
    event.stopPropagation(); // Prevent this click from bubbling to the parent card
    addToCart({ element, name: n, rarity, perDay, image, cardId: name });
  });
  el.querySelector(".details").addEventListener("click", (event) => {
    event.stopPropagation(); // Prevent this click from bubbling to the parent card
    openDetailsModal({ element, name: n, rarity, perDay, image, details: card.details });
  });
  return el;
}

function filterData() {
  let allCards = [];
  ELEMENTS.forEach(el => {
    data[el].forEach(cardObj => allCards.push({ element: el, ...cardObj }));
  });

  // 1. Element filters
  const includedElements = Object.keys(state.elements).filter(el => state.elements[el] === 1);
  const excludedElements = Object.keys(state.elements).filter(el => state.elements[el] === 2);

  let items = allCards;
  if (includedElements.length > 0) {
    items = items.filter(card => includedElements.includes(card.element));
  }
  if (excludedElements.length > 0) {
    items = items.filter(card => !excludedElements.includes(card.element));
  }

  // 2. Search query filter
  if (state.query) {
    const q = state.query.toLowerCase();
    items = items.filter(i => baseName(i.name).toLowerCase().includes(q));
  }

  // 3. Rarity filter
  if (state.rarity) {
    items = items.filter(i => parseRarity(i.name) === state.rarity);
  }
  return items;
}

function render() {
  grid.innerHTML = ""; // Clear existing cards
  emptyState.classList.add("hidden"); 

  const items = filterData();
  if (items.length === 0) {
    emptyState.classList.remove("hidden");
    return;
  }
  emptyState.classList.add("hidden");
  items.forEach(card => grid.appendChild(cardComponent(card)));
  updateCartCount();
}

/* Cart & Checkout */
function updateCartCount() {
  cartCountSpan.textContent = `Cart (${cart.length})`;
}

function addToCart(card) {
  const existingCardIndex = cart.findIndex(item => item.cardId === card.cardId && item.name === card.name);

  if (existingCardIndex === -1) {
    cart.push({
      ...card,
      uuid: crypto.randomUUID(),
      startDate: dayjs().format("YYYY-MM-DD"),
      duration: 1,
      total: card.perDay,
    });
    toast(`Added "${card.name}" to cart.`);
  } else {
    toast(`"${card.name}" is already in your cart. You can adjust its duration in the cart.`);
    cart.push({
      ...card,
      uuid: crypto.randomUUID(),
      startDate: dayjs().format("YYYY-MM-DD"),
      duration: 1,
      total: card.perDay,
    });
    toast(`Added another instance of "${card.name}" to cart.`);
  }
  updateCartCount();
  // No need to renderCheckoutModal here unless the cart modal is already open
}

function removeFromCart(uuid) {
  cart = cart.filter(item => item.uuid !== uuid);
  updateCartCount();
  renderCheckoutModalContent(); // Only re-render content
  toast("Card removed from cart.");
}

function updateCartItemDetails(uuid, key, value) {
  const itemIndex = cart.findIndex(item => item.uuid === uuid);
  if (itemIndex > -1) {
    const item = cart[itemIndex];
    item[key] = value;
    if (key === "duration" || key === "startDate") {
      // Duration should at least 1 and up to 30 (30+ day rent is crazy..)
      if (key === "duration") {
        item.duration = Math.max(1, Math.min(30, parseInt(value, 10) || 1));
      }
      item.total = item.duration * item.perDay;
    }
    cart[itemIndex] = item;
    renderCheckoutModalContent(); // Only re-render content
  }
}

function renderCheckoutModalContent() {
  cartItemsList.innerHTML = "";
  let grandTotal = 0;

  if (cart.length === 0) {
    cartItemsList.innerHTML = `<div class="text-neutral-500 text-center py-4">Your cart is empty.</div>`;
    cartGrandTotal.textContent = "0 coins";
    confirmCheckoutBtn.disabled = true;
    return;
  }
  confirmCheckoutBtn.disabled = false;

  cart.forEach(item => {
    grandTotal += item.total;
    const cartItemEl = document.createElement("div");
    cartItemEl.className = "flex flex-col gap-3 p-3 border border-neutral-800 rounded-md bg-neutral-900";
    cartItemEl.innerHTML = `
      <div class="flex items-center justify-between">
        <div>
          <p class="text-neutral-100 font-medium">${item.name}</p>
          <p class="text-neutral-500 text-xs">${item.element} • ${item.rarity} • ${item.perDay.toLocaleString()}/d</p>
        </div>
        <span class="text-sm text-neutral-300">${item.total.toLocaleString()} coins</span>
        <button data-uuid="${item.uuid}" class="remove-from-cart text-neutral-400 hover:text-red-400 transition-colors" aria-label="Remove card">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </div>
      <div class="grid grid-cols-2 gap-3 text-sm">
        <label>
          <span class="block mb-1 text-neutral-400">Start date</span>
          <input type="text" value="${item.startDate}" data-uuid="${item.uuid}" data-key="startDate" class="cart-item-input w-full rounded-md bg-neutral-950 border border-neutral-800 px-3 py-2 h-9 focus:ring-2 focus:ring-neutral-700/60 flatpickr-input" readonly />
        </label>
        <label>
          <span class="block mb-1 text-neutral-400">Duration (days)</span>
          <input type="number" min="1" max="30" value="${item.duration}" data-uuid="${item.uuid}" data-key="duration" class="cart-item-input w-full rounded-md bg-neutral-950 border border-neutral-800 px-3 py-2 h-9 focus:ring-2 focus:ring-neutral-700/60" />
        </label>
      </div>
    `;
    cartItemsList.appendChild(cartItemEl);

    // Initialize Flatpickr for the start date input
    const startDateInput = cartItemEl.querySelector(`input[data-key="startDate"]`);
    if (startDateInput && typeof flatpickr !== 'undefined') {
      flatpickr(startDateInput, {
        dateFormat: "Y-m-d", // Changed to match the default date format
        minDate: "today",
        defaultDate: item.startDate,
        onChange: function(selectedDates, dateStr, instance) {
          updateCartItemDetails(item.uuid, "startDate", dateStr);
        },
      });
    }
  });

  cartGrandTotal.textContent = `${grandTotal.toLocaleString()} coins`;

  cartItemsList.querySelectorAll(".remove-from-cart").forEach(btn => {
    btn.addEventListener("click", (e) => removeFromCart(e.currentTarget.dataset.uuid));
  });

  cartItemsList.querySelectorAll(".cart-item-input").forEach(input => {
    // Only add listener for duration, flatpickr handles startDate
    if (input.dataset.key === "duration") {
      input.addEventListener("change", (e) => {
        const { uuid, key } = e.currentTarget.dataset;
        let value = e.currentTarget.value;
        if (key === "duration") value = parseInt(value, 10);
        updateCartItemDetails(uuid, key, value);
      });
    }
  });
}

function openCheckoutModal() {
  try { if (!checkoutDialog.open) checkoutDialog.showModal(); } catch (_) { /* no-op if already open */ }
  renderCheckoutModalContent();
  discordInput.value = "";
  reasonSelect.value = "flooring"; // Set default reason to "flooring"
}

function toast(msg) {
  const t = document.createElement("div");
  t.className = "rounded-md border border-neutral-800 bg-neutral-900/95 text-neutral-200 px-3 py-2 text-sm shadow-xl animate-fade-in";
  t.textContent = msg;
  toasts.appendChild(t);
  setTimeout(() => {
    t.style.opacity = "0";
    t.style.transition = "opacity .2s ease";
    setTimeout(() => t.remove(), 200);
  }, 2200);
}

function saveRentalTransaction(transaction) {
  const key = "arcana_rentals_history";
  const list = JSON.parse(localStorage.getItem(key) || "[]");
  list.push(transaction);
  localStorage.setItem(key, JSON.stringify(list));
}

function loadRentalTransactions() {
  const key = "arcana_rentals_history";
  return JSON.parse(localStorage.getItem(key) || "[]");
}

function removeRentalTransaction(id) {
  const key = "arcana_rentals_history";
  let list = JSON.parse(localStorage.getItem(key) || "[]");
  list = list.filter(transaction => transaction.id !== id);
  localStorage.setItem(key, JSON.stringify(list));
  renderRentalsContent(); // Re-render the rentals list content
  toast("Rental transaction removed.");
}

function renderRentalsContent() {
  const transactions = loadRentalTransactions();
  rentalsList.innerHTML = "";
  if (!transactions.length) {
    rentalsList.innerHTML = `<div class="text-neutral-500">No past rental transactions yet.</div>`;
    return;
  }

  transactions.forEach((transaction, transIdx) => {
    const transactionEl = document.createElement("div");
    transactionEl.className = "rounded-lg border border-neutral-800 bg-neutral-950 p-4 space-y-3";
    
    let totalTransactionPrice = 0;
    const cardsHtml = transaction.cards.map(r => {
      totalTransactionPrice += r.total;
      const end = dayjs(r.startDate).add(r.duration, "day");
      return `
        <div class="flex items-center justify-between gap-3">
          <div>
            <div class="text-neutral-100 font-medium">${r.name}</div>
            <div class="text-xs text-neutral-500">${r.element} • ${r.rarity}</div>
            <div class="text-xs text-neutral-400 mt-1">${dayjs(r.startDate).format("MMM D")} → ${end.format("MMM D")} • ${r.duration}d</div>
          </div>
          <div class="text-right">
            <div class="text-neutral-200 text-sm">${r.total.toLocaleString()}</div>
          </div>
        </div>
      `;
    }).join("");

    transactionEl.innerHTML = `
      <div class="border-b border-neutral-800 pb-3 mb-3 flex justify-between items-center">
        <div>
          <div class="text-neutral-300 text-sm">Transaction on: ${dayjs(transaction.createdAt).format("MMM D, YYYY HH:mm")}</div>
          <div class="text-xs text-neutral-500 mt-1">Discord: ${transaction.discord || 'N/A'}</div>
          <div class="text-xs text-neutral-500">Reason: ${transaction.reason || 'N/A'}</div>
        </div>
        <button data-id="${transaction.id}" class="remove-rental text-neutral-400 hover:text-red-400 p-1 rounded" aria-label="Remove rental transaction">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </div>
      ${cardsHtml}
      <div class="flex justify-between items-center text-sm font-medium border-t border-neutral-800 pt-3 mt-3">
        <span>Total for this transaction:</span>
        <span class="text-neutral-100">${totalTransactionPrice.toLocaleString()} coins</span>
      </div>
    `;
    
    rentalsList.appendChild(transactionEl);
  });

  rentalsList.querySelectorAll(".remove-rental").forEach(btn => {
    btn.addEventListener("click", (e) => removeRentalTransaction(e.currentTarget.dataset.id));
  });
}

function openDetailsModal({ element, name, rarity, perDay, image, details }) {
  currentDetailsCard = { element, name, rarity, perDay, image, details };
  try { if (!detailsDialog.open) detailsDialog.showModal(); } catch (_) { /* no-op if already open */ }
  detailsTitle.textContent = name; // Update title immediately
  const placeholderDetails = "Authenticated listing. Reserve instantly through the rent dialog. Contact owner for extended rental periods after checkout confirmation.";
  detailsBody.innerHTML = `
    <div class="space-y-4">
      <div class="rounded-lg overflow-hidden w-full flex items-center justify-center">
        ${image
          ? `<img src="${image}" alt="${name}" class="w-full h-auto object-contain block">`
          : `<div class="w-full h-[250px] grid place-items-center text-neutral-600 text-4xl font-bold">${name.charAt(0).toUpperCase()}</div>`
        }
      </div>
      <div>
        <h4 class="text-neutral-100 font-medium">Information</h4>
        <div class="mt-2 space-y-2 text-sm border-t border-b border-neutral-800/60 py-3">
          <div class="flex justify-between"><span class="text-neutral-400">Element</span> <span class="element-badge element-badge-${element.toLowerCase()} rounded-md border px-1.5 py-0.5 text-xs font-medium">${element}</span></div>
          <div class="flex justify-between"><span class="text-neutral-400">Rarity</span> <span class="text-neutral-200">${rarity}</span></div>
          <div class="flex justify-between"><span class="text-neutral-400">Rate</span> <span class="text-neutral-200">${perDay.toLocaleString()}/day</span></div>
        </div>
      </div>
      <p class="text-sm text-neutral-400">
        ${details || placeholderDetails}
      </p>
      <button id="add-to-cart-from-details" class="w-full inline-flex items-center justify-center gap-2 rounded-md bg-neutral-100 text-neutral-900 px-4 py-2.5 text-sm font-medium hover:bg-white transition">
        Add to Cart
      </button>
    </div>
  `;

  const addToCartFromDetailsBtn = detailsBody.querySelector("#add-to-cart-from-details");
  addToCartFromDetailsBtn.addEventListener("click", () => {
    closeDetailsModalAnimated();
    if (currentDetailsCard) {
      addToCart({
        element: currentDetailsCard.element,
        name: currentDetailsCard.name,
        rarity: currentDetailsCard.rarity,
        perDay: currentDetailsCard.perDay,
        image: currentDetailsCard.image,
        cardId: currentDetailsCard.name
      });
    }
  });
}

// Function to close details modal with animation
function closeDetailsModalAnimated() {
  if (!detailsDialog.open) return;

  detailsDialog.classList.add("details-dialog-closing");

  setTimeout(() => {
    detailsDialog.classList.remove("details-dialog-closing");
    detailsDialog.close();
  }, 300);
}

// Function to close checkout modal with animation
function closeCheckoutModalAnimated() {
  if (!checkoutDialog.open) return;

  checkoutDialog.classList.add("checkout-dialog-closing");

  setTimeout(() => {
    checkoutDialog.classList.remove("checkout-dialog-closing");
    checkoutDialog.close();
  }, 300);
}

// Function to close rentals drawer with animation
function closeRentalsModalAnimated() {
  if (!rentalsDrawer.open) return;

  rentalsDrawer.classList.add("rentals-drawer-closing");

  setTimeout(() => {
    rentalsDrawer.classList.remove("rentals-drawer-closing");
    rentalsDrawer.close();
  }, 300);
}

/* Suggestions */
const ALL = ELEMENTS.flatMap(el => data[el].map(card => ({ element: el, ...card })));
function saveRecent(q){ if(!q) return; const s=new Set([q,...(JSON.parse(localStorage.getItem(RECENT_KEY)||"[]"))]); localStorage.setItem(RECENT_KEY, JSON.stringify([...s].slice(0,6))); }
function getRecent(){ return JSON.parse(localStorage.getItem(RECENT_KEY)||"[]"); }
function getSuggestions(q){
  const out=[]; const s=q.trim().toLowerCase(); if(!s){ return getRecent().map(r=>({t:"recent", label:r})); }
  const elTok=/^(e:|element\s+)/; const raTok=/^(r:|rarity\s+)/;
  if(elTok.test(s)){ const k=s.replace(elTok,""); ELEMENTS.filter(x=>x.toLowerCase().startsWith(k)).forEach(x=>out.push({t:"element",label:x})); }
  else if(raTok.test(s)){ ["Mythic","Starlight"].filter(x=>x.toLowerCase().startsWith(s.replace(raTok,""))).forEach(x=>out.push({t:"rarity",label:x})); }
  const byStart=[], byIn=[]; ALL.forEach(i=>{ const bn=baseName(i.name); const low=bn.toLowerCase(); if(low.startsWith(s)) byStart.push({t:"card",label:bn, meta:`${i.element} • ${parseRarity(i.name)}`}); else if(low.includes(s)) byIn.push({t:"card",label:bn, meta:`${i.element} • ${parseRarity(i.name)}`}); });
  getRecent().filter(r=>r.toLowerCase().startsWith(s)).forEach(r=>out.push({t:"recent",label:r}));
  return [...out.slice(0,4), ...byStart, ...byIn].slice(0,8);
}

let sugIndex=-1, sugData=[];
function renderSuggestions(list){
  sugData=list; sugIndex=-1;
  if(!list.length){ suggestions.classList.add("hidden"); suggestions.innerHTML=""; return; }
  suggestions.classList.remove("hidden");
  suggestions.innerHTML=list.map((s,i)=>`<div class="suggest-item" data-i="${i}">
    <span class="suggest-tag">${s.t}</span><span>${s.label}</span>${s.meta?`<span class="text-neutral-500 text-xs">• ${s.meta}</span>`:""}
    ${s.t === "recent" ? `<button class="remove-suggestion ml-auto text-neutral-500 hover:text-red-400 p-1 rounded" data-label="${s.label}" aria-label="Remove suggestion"><svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M9 10L4 15L9 20" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M20 4V11C20 12.0609 19.5786 13.0783 18.8284 13.8284C18.0783 14.5786 17.0609 15 16 15H4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>` : `<span class="suggest-kbd"><svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M9 10L4 15L9 20" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M20 4V11C20 12.0609 19.5786 13.0783 18.8284 13.8284C18.0783 14.5786 17.0609 15 16 15H4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></span>`}
  </div>`).join("");
  suggestions.querySelectorAll(".suggest-item").forEach(el=>el.addEventListener("mousedown",(e)=>{ 
    // Only apply suggestion if the target is not the remove button
    if (!e.target.closest(".remove-suggestion")) {
      e.preventDefault(); 
      applySuggestion(list[+el.dataset.i]);
    }
  }));
  suggestions.querySelectorAll(".remove-suggestion").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation(); // Prevent parent item click
      removeRecentSuggestion(e.currentTarget.dataset.label);
    });
  });
}
function applySuggestion(s){
  if(s.t==="element"){ 
    state.elements[s.label] = (state.elements[s.label] + 1) % 3;
    const btn = elementFilters.querySelector(`[data-element="${s.label}"]`);
    if(btn) btn.dataset.state = state.elements[s.label];
    state.query=""; 
    searchInput.value=""; 
  }
  else if(s.t==="rarity"){ state.rarity=s.label; raritySelect.value = s.label; }
  else { state.query=s.label; searchInput.value=s.label; saveRecent(s.label); }
  render(); suggestions.classList.add("hidden");
}

function removeRecentSuggestion(label) {
  const recentSearches = getRecent().filter(item => item !== label);
  localStorage.setItem(RECENT_KEY, JSON.stringify(recentSearches));
  renderSuggestions(getSuggestions(searchInput.value)); // Re-render current suggestions
}

/* Discord Webhook function */
async function sendDiscordRentalNotification(rentalTransaction) {
  const reasonText = rentalTransaction.reason.charAt(0).toUpperCase() + rentalTransaction.reason.slice(1);
  let totalTransactionPrice = 0;

  const cardFields = rentalTransaction.cards.map(rentalRecord => {
    const startFormatted = dayjs(rentalRecord.startDate).format("MMM D, YYYY");
    const endFormatted = dayjs(rentalRecord.startDate).add(rentalRecord.duration, "day").format("MMM D, YYYY");
    totalTransactionPrice += rentalRecord.total;
    return {
      name: `**${rentalRecord.name}**`,
      value: `Element: \`${rentalRecord.element}\`\nRarity: \`${rentalRecord.rarity}\`\nStart: \`${startFormatted}\`\nEnd: \`${endFormatted}\`\nDuration: \`${rentalRecord.duration} day(s)\`\nPrice: \`${rentalRecord.total.toLocaleString()} coins\``,
      inline: false
    };
  });

  const embed = {
    title: `New Rental Request (${rentalTransaction.cards.length} cards) <:thinki:1400706147161210972>`,
    description: `A new multi-card rental transaction has been initiated by **${rentalTransaction.discord || 'n/a'}** for reason: \`${reasonText}\`.\n\n**Total Transaction Price: ${totalTransactionPrice.toLocaleString()} coins**\n\n**Rented Cards:**`,
    color: 0xA5B4FC,
    fields: cardFields,
    timestamp: new Date(rentalTransaction.createdAt).toISOString(),
    footer: {
      text: "saelogy rental service"
    }
  };

  const payload = { embeds: [embed] };

  try {
    const response = await fetch(DISCORD_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      toast("Rental request sent to Discord!");
      console.log("Discord notification sent successfully!");
    } else {
      const errorText = await response.text();
      console.error(`Failed to send Discord notification: ${response.status} ${response.statusText}`, errorText);
      console.error("Payload sent:", JSON.stringify(payload, null, 2));
      toast(`Failed to send rental request to Discord. Status: ${response.status}. Check console for details.`);
    }
  } catch (error) {
    console.error("Error sending Discord notification:", error);
    console.error("Payload that tried to be sent:", JSON.stringify(payload, null, 2));
    toast("An error occurred while sending the rental request to Discord. Check console for details.");
  }
}

/* Events */
searchInput.addEventListener("input",(e)=>{ state.query=e.target.value.trim(); render(); renderSuggestions(getSuggestions(e.target.value)); });
searchInput.addEventListener("focus",()=>{ renderSuggestions(getSuggestions(searchInput.value)); });
searchInput.addEventListener("blur",()=>{ setTimeout(()=>{ suggestions.classList.add("hidden"); },100); });
searchInput.addEventListener("keydown",(e)=>{
  const items=[...suggestions.querySelectorAll(".suggest-item")];
  if(e.key==="ArrowDown"){ e.preventDefault(); if(!items.length) return; sugIndex=(sugIndex+1)%items.length; items.forEach((n,i)=>n.toggleAttribute("data-active",i===sugIndex)); }
  else if(e.key==="ArrowUp"){ e.preventDefault(); if(!items.length) return; sugIndex=(sugIndex-1+items.length)%items.length; items.forEach((n,i)=>n.toggleAttribute("data-active",i===sugIndex)); }
  else if(e.key==="Enter"){ if(sugIndex>-1 && sugData[sugIndex]){ e.preventDefault(); applySuggestion(sugData[sugIndex]); } else { saveRecent(searchInput.value.trim()); suggestions.classList.add("hidden"); } }
  else if(e.key==="Escape"){ suggestions.classList.add("hidden"); }
});
raritySelect.addEventListener("change", (e) => {
  state.rarity = e.target.value;
  render();
});
clearBtn.addEventListener("click", () => {
  state = { 
    elements: ELEMENTS.reduce((acc, el) => ({ ...acc, [el]: 0 }), {}),
    query: "", 
    rarity: "" 
  };
  searchInput.value = "";
  raritySelect.value = "";
  [...elementFilters.children].forEach(btn => btn.dataset.state = 0);
  render();
});

confirmCheckoutBtn.addEventListener("click", () => {
  if (cart.length === 0) {
    toast("Your cart is empty!");
    return;
  }

  // Validate Discord username
  if (!discordInput.value.trim()) {
    toast("Discord username is required!");
    discordInput.focus();
    return;
  }

  const validCart = cart.every(item => item.duration >= 1 && item.duration <= 30 && dayjs(item.startDate).isValid());
  if (!validCart) {
    toast("Please ensure all card durations are between 1-30 days and start dates are valid.");
    return;
  }

  const rentalTransaction = {
    id: crypto.randomUUID(),
    cards: cart,
    discord: (discordInput.value || "").trim(),
    reason: reasonSelect.value,
    createdAt: Date.now()
  };
  saveRentalTransaction(rentalTransaction);
  
  sendDiscordRentalNotification(rentalTransaction);
  
  cart = [];
  updateCartCount();
  closeCheckoutModalAnimated(); 
  toast("Rental(s) confirmed and cart cleared.");
});

openRentalsBtn.addEventListener("click", () => {
  try { if (!rentalsDrawer.open) rentalsDrawer.showModal(); } catch (_) { /* no-op if already open */ }
  renderRentalsContent();
});
openCartBtn.addEventListener("click", () => {
  openCheckoutModal();
});
ctaRandom.addEventListener("click", () => {
  const pool = filterData();
  if (!pool.length) {
    toast("No cards found for surprise me. Try adjusting filters!");
    return;
  }
  const pick = pool[Math.floor(Math.random() * pool.length)];
  addToCart({
    element: pick.element,
    name: baseName(pick.name),
    rarity: parseRarity(pick.name),
    perDay: priceFor(pick.name),
    image: pick.image,
    cardId: pick.name
  });
});

/* Manual dialog close buttons */
closeCheckoutBtn.addEventListener("click", closeCheckoutModalAnimated);
closeDetailsBtn.addEventListener("click", closeDetailsModalAnimated);
closeRentalsBtn.addEventListener("click", closeRentalsModalAnimated); // Updated to use animated close

// Close modals when clicking outside them (on the backdrop)
detailsDialog.addEventListener("click", (event) => {
  if (event.target === detailsDialog) {
    closeDetailsModalAnimated();
  }
});

checkoutDialog.addEventListener("click", (event) => {
  if (event.target === checkoutDialog) {
    closeCheckoutModalAnimated();
  }
});

rentalsDrawer.addEventListener("click", (event) => {
  if (event.target === rentalsDrawer) {
    closeRentalsModalAnimated(); // Updated to use animated close
  }
});

// Function to update the scroll progress bar
function updateProgressBar() {
  const scrollPx = document.documentElement.scrollTop || document.body.scrollTop;
  const winHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
  const scrollProgress = (winHeight > 0) ? (scrollPx / winHeight) * 100 : 0;
  progressBar.style.width = `${scrollProgress}%`;
}

/* Init */
buildElementFilters();
render();
updateCartCount();
// Initialize progress bar and listen for scroll events
updateProgressBar(); // Set initial state
window.addEventListener("scroll", updateProgressBar);

// Animate hero cards and title on page load
document.addEventListener("DOMContentLoaded", () => {
  const heroCards = document.querySelectorAll(".hero-card-item");
  heroCards.forEach(card => {
    card.classList.add("animate-in");
  });

  // Animate hero title words
  const heroTitleWords = document.querySelectorAll(".hero-title-word");
  heroTitleWords.forEach((word, index) => {
    word.style.animationDelay = `${0.05 * index}s`; // Staggered delay for each word
    word.classList.add("animate-in");
  });
});
