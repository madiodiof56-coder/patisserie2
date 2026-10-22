/**
 * DOUCEUR ROYALE - HAUTE PÂTISSERIE ARTISANALE
 * Logique JavaScript principale : Catalogue, Filtres, Panier Dynamique, Modale de commande
 */

// --- 1. GESTION DU HEADER & NAVIGATION RESPONSIVE ---
const header = document.getElementById('header');
const hamburger = document.getElementById('hamburger');
const navLinks = document.querySelector('.nav-links');
const backToTopBtn = document.getElementById('back-to-top');

// Effet de scroll sur le header (Glassmorphism & ombrage)
window.addEventListener('scroll', () => {
    const scrollPos = window.scrollY;
    if (header) {
        header.classList.toggle('scrolled', scrollPos > 40);
    }
    if (backToTopBtn) {
        backToTopBtn.classList.toggle('visible', scrollPos > 350);
    }
});

// Bouton Retour en haut
if (backToTopBtn) {
    backToTopBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

// Menu Hamburger Mobile
if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        navLinks.classList.toggle('active');
    });

    // Fermer le menu mobile lors du clic sur un lien
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', () => {
            hamburger.classList.remove('active');
            navLinks.classList.remove('active');
        });
    });
}

// Mise à jour automatique du statut en direct de la boutique (Horaires)
function updateStoreStatus() {
    const statusElem = document.getElementById('store-status');
    if (!statusElem) return;

    const now = new Date();
    const day = now.getDay(); // 0 = Dimanche, 1 = Lundi, etc.
    const hour = now.getHours();
    const min = now.getMinutes();
    const currentTime = hour + min / 60;

    if (day === 1) {
        statusElem.textContent = 'Boutique Fermée aujourd\'hui (Réouverture Mardi 7h00)';
        statusElem.parentElement.style.borderColor = 'rgba(231, 76, 60, 0.4)';
        statusElem.parentElement.style.color = '#e74c3c';
        statusElem.previousElementSibling.style.background = '#e74c3c';
    } else if (currentTime >= 7 && currentTime < 19.5) {
        statusElem.textContent = 'Boutique Ouverte aujourd\'hui jusqu\'à 19h30';
    } else {
        statusElem.textContent = 'Boutique Actuellement fermée (Ouverture à 7h00)';
    }
}
updateStoreStatus();

// --- 2. CATALOGUE PRODUITS & SYNCHRONISATION LOCALSTORAGE ---
const productStorageKey = 'douceurRoyaleProducts';
const productsGrid = document.querySelector('.products-grid');
const filterBtns = document.querySelectorAll('.filter-btn');
let products = [];

// Lecture initiale des produits depuis le HTML
function readProductsFromPage() {
    return [...document.querySelectorAll('.product-card')].map((card, index) => ({
        id: `product-${index + 1}`,
        name: card.querySelector('h3')?.textContent.trim() || `Création ${index + 1}`,
        description: card.querySelector('.product-desc')?.textContent.trim() || '',
        image: card.querySelector('img')?.getAttribute('src') || 'images/gateaux.jpg',
        category: card.dataset.category || 'entremets',
        price: Number(card.querySelector('.add-to-cart')?.dataset.price) || 2500,
        badge: card.querySelector('.product-badge')?.textContent.trim() || ''
    }));
}

// Rendu moderne des produits dans la grille
function renderProducts() {
    if (!productsGrid) return;
    productsGrid.replaceChildren();

    const categoryNames = {
        entremets: 'Entremets & Gâteaux',
        viennoiseries: 'Viennoiseries Pur Beurre',
        chocolats: 'Chocolats Fins'
    };

    products.forEach(product => {
        const card = document.createElement('article');
        card.className = 'product-card';
        card.dataset.category = product.category;

        // Wrapper Image avec badge
        const imageWrap = document.createElement('div');
        imageWrap.className = 'product-image-wrap';

        if (product.badge) {
            const badge = document.createElement('span');
            badge.className = `product-badge ${product.badge.toLowerCase().includes('best') || product.badge.toLowerCase().includes('signature') ? 'gold' : ''}`;
            badge.textContent = product.badge;
            imageWrap.append(badge);
        }

        const image = document.createElement('img');
        image.src = product.image;
        image.alt = product.name;
        image.loading = 'lazy';
        image.onerror = function() {
            this.src = 'images/gateaux.jpg'; // Image de secours
        };
        imageWrap.append(image);

        // Informations produit
        const info = document.createElement('div');
        info.className = 'product-info';

        // Meta catégorie + rating
        const meta = document.createElement('div');
        meta.className = 'product-meta';
        const catName = document.createElement('span');
        catName.className = 'product-cat-name';
        catName.textContent = categoryNames[product.category] || product.category;

        const rating = document.createElement('div');
        rating.className = 'product-rating';
        rating.innerHTML = '<i class="fa-solid fa-star"></i> <span>4.9 (40+ avis)</span>';

        meta.append(catName, rating);

        const title = document.createElement('h3');
        title.textContent = product.name;

        const description = document.createElement('p');
        description.className = 'product-desc';
        description.textContent = product.description;

        // Footer avec prix et bouton ajouter
        const footer = document.createElement('div');
        footer.className = 'product-footer';

        const price = document.createElement('span');
        price.className = 'price';
        price.innerHTML = `${Number(product.price).toLocaleString('fr-FR')} <small>FCFA</small>`;

        const addButton = document.createElement('button');
        addButton.className = 'add-to-cart';
        addButton.dataset.name = product.name;
        addButton.dataset.price = product.price;
        addButton.dataset.image = product.image;
        addButton.innerHTML = '<i class="fa-solid fa-bag-shopping"></i> <span>Ajouter</span>';

        footer.append(price, addButton);
        info.append(meta, title, description, footer);

        card.append(imageWrap, info);
        productsGrid.append(card);
    });

    applyProductFilter(document.querySelector('.filter-btn.active')?.dataset.filter || 'all');
}

// Filtrage des produits par catégorie
function applyProductFilter(filter) {
    document.querySelectorAll('.product-card').forEach(card => {
        if (filter === 'all' || card.dataset.category === filter) {
            card.style.display = 'flex';
        } else {
            card.style.display = 'none';
        }
    });
}

// Initialisation catalogue
try {
    const stored = JSON.parse(localStorage.getItem(productStorageKey));
    if (Array.isArray(stored) && stored.length > 0) {
        products = stored;
    } else {
        products = readProductsFromPage();
        localStorage.setItem(productStorageKey, JSON.stringify(products));
    }
} catch {
    products = readProductsFromPage();
}

renderProducts();

// Clics sur les filtres
filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        applyProductFilter(btn.dataset.filter);
    });
});

// --- 3. GESTION DU PANIER GOURMAND (DRAWER) ---
const cartBtn = document.getElementById('cart-btn');
const cartModal = document.getElementById('cart-modal');
const cartOverlay = document.getElementById('cart-overlay');
const closeCart = document.getElementById('close-cart');
const cartItemsContainer = document.getElementById('cart-items');
const cartCount = document.getElementById('cart-count');
const cartTotalPrice = document.getElementById('cart-total-price');
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toast-message');
const checkoutBtn = document.getElementById('checkout-btn');

const shippingBar = document.getElementById('shipping-bar');
const shippingMsg = document.getElementById('shipping-msg');
const shippingPercent = document.getElementById('shipping-percent');
const FREE_SHIPPING_THRESHOLD = 25000; // 25 000 FCFA pour livraison offerte

let cart = [];

// Ouvrir le panier
function openCartDrawer() {
    if (cartModal && cartOverlay) {
        cartModal.classList.add('open');
        cartOverlay.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
}

// Fermer le panier
function closeCartDrawer() {
    if (cartModal && cartOverlay) {
        cartModal.classList.remove('open');
        cartOverlay.classList.remove('show');
        document.body.style.overflow = '';
    }
}

if (cartBtn) cartBtn.addEventListener('click', openCartDrawer);
if (closeCart) closeCart.addEventListener('click', closeCartDrawer);
if (cartOverlay) cartOverlay.addEventListener('click', closeCartDrawer);

// Ajout au panier avec animation du badge
if (productsGrid) {
    productsGrid.addEventListener('click', (event) => {
        const button = event.target.closest('.add-to-cart');
        if (!button) return;

        const name = button.dataset.name;
        const price = Number(button.dataset.price);
        const image = button.dataset.image || 'images/gateaux.jpg';

        const existingItem = cart.find(item => item.name === name);
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.push({ name, price, image, quantity: 1 });
        }

        updateCart();
        showToast(`« ${name} » ajouté au panier !`);

        // Effet de rebond sur l'icône du panier
        if (cartCount) {
            cartCount.classList.add('bump');
            setTimeout(() => cartCount.classList.remove('bump'), 300);
        }
    });
}

// Mettre à jour l'affichage du panier
function updateCart() {
    if (!cartItemsContainer) return;
    cartItemsContainer.innerHTML = '';

    if (cart.length === 0) {
        cartItemsContainer.innerHTML = `
            <div class="empty-cart-msg">
                <i class="fa-solid fa-cookie-bite"></i>
                <p>Votre panier est vide pour le moment.</p>
                <button class="btn btn-outline" style="margin-top: 15px; color: var(--dark); border-color: var(--border-color);" onclick="closeCartDrawer()">Découvrir nos créations</button>
            </div>
        `;
        if (cartCount) cartCount.textContent = '0';
        if (cartTotalPrice) cartTotalPrice.textContent = '0 FCFA';
        updateShippingProgress(0);
        return;
    }

    let totalCount = 0;
    let totalPrice = 0;

    cart.forEach((item, index) => {
        totalCount += item.quantity;
        const itemTotal = item.price * item.quantity;
        totalPrice += itemTotal;

        const itemCard = document.createElement('div');
        itemCard.className = 'cart-item';
        itemCard.innerHTML = `
            <img src="${item.image}" alt="${item.name}" class="cart-item-img" onerror="this.src='images/gateaux.jpg'">
            <div class="cart-item-details">
                <h4>${item.name}</h4>
                <div class="item-unit-price">${item.price.toLocaleString('fr-FR')} FCFA / unité</div>
                <div class="qty-selector">
                    <button class="qty-btn" onclick="changeQuantity(${index}, -1)" aria-label="Diminuer"><i class="fa-solid fa-minus"></i></button>
                    <span class="qty-count">${item.quantity}</span>
                    <button class="qty-btn" onclick="changeQuantity(${index}, 1)" aria-label="Augmenter"><i class="fa-solid fa-plus"></i></button>
                </div>
            </div>
            <div class="cart-item-right">
                <span class="cart-item-total">${itemTotal.toLocaleString('fr-FR')} FCFA</span>
                <button class="remove-item" onclick="removeFromCart(${index})" title="Supprimer cet article" aria-label="Supprimer">
                    <i class="fa-solid fa-trash-can"></i>
                </button>
            </div>
        `;
        cartItemsContainer.appendChild(itemCard);
    });

    if (cartCount) cartCount.textContent = totalCount;
    if (cartTotalPrice) cartTotalPrice.textContent = totalPrice.toLocaleString('fr-FR') + ' FCFA';
    updateShippingProgress(totalPrice);
}

// Calcul de la jauge livraison offerte
function updateShippingProgress(total) {
    if (!shippingBar || !shippingMsg || !shippingPercent) return;

    if (total >= FREE_SHIPPING_THRESHOLD) {
        shippingBar.style.width = '100%';
        shippingBar.style.background = '#2e7d32';
        shippingMsg.innerHTML = '🎉 <strong>Félicitations !</strong> Vous bénéficiez de la livraison offerte !';
        shippingPercent.textContent = '100%';
    } else {
        const remaining = FREE_SHIPPING_THRESHOLD - total;
        const pct = Math.min(100, Math.round((total / FREE_SHIPPING_THRESHOLD) * 100));
        shippingBar.style.width = `${pct}%`;
        shippingBar.style.background = 'linear-gradient(90deg, var(--primary) 0%, #2e7d32 100%)';
        shippingMsg.textContent = `Plus que ${remaining.toLocaleString('fr-FR')} FCFA pour la livraison offerte !`;
        shippingPercent.textContent = `${pct}%`;
    }
}

// Modifier la quantité
window.changeQuantity = function(index, delta) {
    if (!cart[index]) return;
    cart[index].quantity += delta;
    if (cart[index].quantity <= 0) {
        cart.splice(index, 1);
    }
    updateCart();
};

// Supprimer un article
window.removeFromCart = function(index) {
    if (!cart[index]) return;
    const removedName = cart[index].name;
    cart.splice(index, 1);
    updateCart();
    showToast(`« ${removedName} » retiré du panier.`);
};

// Notification Toast moderne
function showToast(message) {
    if (!toast) return;
    if (toastMessage) toastMessage.textContent = message;
    toast.classList.add('show');
    clearTimeout(window.toastTimer);
    window.toastTimer = setTimeout(() => {
        toast.classList.remove('show');
    }, 2800);
}

// --- 4. MODALE DE CHECKOUT & VALIDATION DE COMMANDE ---
const checkoutModal = document.getElementById('checkout-modal');
const closeCheckout = document.getElementById('close-checkout');
const cancelCheckout = document.getElementById('cancel-checkout');
const orderForm = document.getElementById('order-form');
const modalOrderTotal = document.getElementById('modal-order-total');
const methodTabs = document.querySelectorAll('.order-method-tab');
const deliveryGroup = document.getElementById('delivery-address-group');
let currentOrderMethod = 'pickup';

// Ouvrir la modale de commande
if (checkoutBtn) {
    checkoutBtn.addEventListener('click', () => {
        if (cart.length === 0) {
            showToast('Votre panier est vide !');
            return;
        }

        const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        if (modalOrderTotal) modalOrderTotal.textContent = totalPrice.toLocaleString('fr-FR') + ' FCFA';

        closeCartDrawer();
        if (checkoutModal) checkoutModal.classList.add('open');
    });
}

function closeCheckoutModal() {
    if (checkoutModal) checkoutModal.classList.remove('open');
}

if (closeCheckout) closeCheckout.addEventListener('click', closeCheckoutModal);
if (cancelCheckout) cancelCheckout.addEventListener('click', closeCheckoutModal);

// Sélection Retrait vs Livraison
methodTabs.forEach(tab => {
    tab.addEventListener('click', () => {
        methodTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        currentOrderMethod = tab.dataset.method;
        if (deliveryGroup) {
            deliveryGroup.style.display = currentOrderMethod === 'delivery' ? 'block' : 'none';
            const addressInput = document.getElementById('order-address');
            if (addressInput) addressInput.required = currentOrderMethod === 'delivery';
        }
    });
});

// Confirmation de la commande
if (orderForm) {
    orderForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const name = document.getElementById('order-name').value.trim();
        const phone = document.getElementById('order-phone').value.trim();
        const address = document.getElementById('order-address')?.value.trim() || '';
        const notes = document.getElementById('order-notes')?.value.trim() || '';

        const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const orderId = 'DR-' + Math.floor(100000 + Math.random() * 900000);

        // Construction du message WhatsApp récapitulatif
        let itemsSummary = cart.map(item => `• ${item.quantity}x ${item.name} (${(item.price * item.quantity).toLocaleString('fr-FR')} FCFA)`).join('\n');
        
        let waText = `👑 *NOUVELLE COMMANDE DOUCEUR ROYALE* 👑\n` +
                     `Réf: *#${orderId}*\n\n` +
                     `*Client:* ${name}\n` +
                     `*Téléphone:* ${phone}\n` +
                     `*Mode:* ${currentOrderMethod === 'delivery' ? '🛵 Livraison à domicile' : '🛍️ Retrait en boutique (Click & Collect)'}\n`;
        
        if (currentOrderMethod === 'delivery' && address) {
            waText += `*Adresse:* ${address}\n`;
        }
        if (notes) {
            waText += `*Notes:* ${notes}\n`;
        }

        waText += `\n*Détail de la commande:*\n${itemsSummary}\n\n` +
                  `*Total à régler:* *${totalPrice.toLocaleString('fr-FR')} FCFA*`;

        const encodedWaText = encodeURIComponent(waText);
        const waUrl = `https://wa.me/33142680000?text=${encodedWaText}`;

        // Réinitialisation
        cart = [];
        updateCart();
        closeCheckoutModal();
        orderForm.reset();

        // Notification de confirmation et redirection WhatsApp optionnelle
        showToast('🎉 Félicitations ! Votre commande a été enregistrée avec succès.');
        
        setTimeout(() => {
            if (confirm(`Merci pour votre commande #${orderId} !\n\nSouhaitez-vous envoyer le récapitulatif directement par WhatsApp à la boutique pour un suivi express ?`)) {
                window.open(waUrl, '_blank');
            }
        }, 500);
    });
}

// --- 5. GESTION DU FORMULAIRE DE CONTACT ---
const contactForm = document.getElementById('contact-form');
if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const clientName = document.getElementById('contact-name')?.value || 'Client';
        showToast(`Merci ${clientName}, votre message a bien été envoyé ! Nous vous répondrons dans les plus brefs délais.`);
        contactForm.reset();
    });
}
