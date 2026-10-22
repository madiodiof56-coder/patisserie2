const productStorageKey = 'douceurRoyaleProducts';
const adminSessionKey = 'douceurRoyaleAdminSession';
const loginSection = document.getElementById('admin-login');
const dashboard = document.getElementById('admin-dashboard');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');
const productForm = document.getElementById('product-form');
const productEditor = document.getElementById('product-editor');
const productTableBody = document.getElementById('product-table-body');
const emptyProducts = document.getElementById('empty-products');
const toast = document.getElementById('admin-toast');
let products = [];

function loadProducts() {
    try {
        const savedProducts = JSON.parse(localStorage.getItem(productStorageKey));
        return Array.isArray(savedProducts) ? savedProducts : [];
    } catch {
        return [];
    }
}

function saveProducts() {
    localStorage.setItem(productStorageKey, JSON.stringify(products));
}

function showDashboard() {
    loginSection.hidden = true;
    dashboard.hidden = false;
    products = loadProducts();
    renderProductTable();
}

function renderProductTable() {
    productTableBody.replaceChildren();
    document.getElementById('product-count').textContent = products.length;
    emptyProducts.hidden = products.length > 0;

    products.forEach(product => {
        const row = document.createElement('tr');
        const productCell = document.createElement('td');
        productCell.className = 'admin-product-name';
        
        const image = document.createElement('img');
        image.src = product.image;
        image.alt = product.name;
        image.onerror = function() {
            this.src = 'images/gateaux.jpg';
        };

        const name = document.createElement('span');
        name.textContent = product.name;
        productCell.append(image, name);

        const categoryCell = document.createElement('td');
        categoryCell.textContent = {
            entremets: 'Entremets & Gâteaux',
            viennoiseries: 'Viennoiseries Pur Beurre',
            chocolats: 'Chocolats Fins'
        }[product.category] || product.category;

        const priceCell = document.createElement('td');
        priceCell.textContent = `${Number(product.price).toLocaleString('fr-FR')} FCFA`;

        const actionsCell = document.createElement('td');
        actionsCell.className = 'admin-actions-cell';

        const editButton = document.createElement('button');
        editButton.type = 'button';
        editButton.className = 'admin-icon-button';
        editButton.dataset.action = 'edit';
        editButton.dataset.id = product.id;
        editButton.title = 'Modifier';
        editButton.setAttribute('aria-label', `Modifier ${product.name}`);
        editButton.innerHTML = '<i class="fa-solid fa-pen"></i>';

        const deleteButton = document.createElement('button');
        deleteButton.type = 'button';
        deleteButton.className = 'admin-icon-button delete-product-button';
        deleteButton.dataset.action = 'delete';
        deleteButton.dataset.id = product.id;
        deleteButton.title = 'Supprimer';
        deleteButton.setAttribute('aria-label', `Supprimer ${product.name}`);
        deleteButton.innerHTML = '<i class="fa-solid fa-trash"></i>';

        actionsCell.append(editButton, deleteButton);
        row.append(productCell, categoryCell, priceCell, actionsCell);
        productTableBody.append(row);
    });
}

function closeEditor() {
    productEditor.hidden = true;
    productForm.reset();
    document.getElementById('product-id').value = '';
}

function openEditor(product = null) {
    productForm.reset();
    document.getElementById('product-id').value = product?.id || '';
    document.getElementById('product-name').value = product?.name || '';
    document.getElementById('product-category').value = product?.category || 'entremets';
    document.getElementById('product-price').value = product?.price || '';
    document.getElementById('product-image').value = product?.image || '';
    document.getElementById('product-description').value = product?.description || '';
    document.getElementById('product-badge').value = product?.badge || '';
    document.getElementById('editor-title').textContent = product ? 'Modifier la création' : 'Nouvelle création';
    productEditor.hidden = false;
    document.getElementById('product-name').focus();
}

function showToast(message) {
    toast.textContent = message;
    toast.classList.add('show');
    window.setTimeout(() => toast.classList.remove('show'), 2400);
}

loginForm.addEventListener('submit', event => {
    event.preventDefault();
    const username = document.getElementById('admin-username').value.trim();
    const password = document.getElementById('admin-password').value;
    if (username !== 'admin' || password !== 'admin123') {
        loginError.textContent = 'Identifiant ou mot de passe incorrect.';
        return;
    }
    sessionStorage.setItem(adminSessionKey, 'true');
    loginError.textContent = '';
    showDashboard();
});

document.getElementById('logout-button').addEventListener('click', () => {
    sessionStorage.removeItem(adminSessionKey);
    dashboard.hidden = true;
    loginSection.hidden = false;
    loginForm.reset();
});

document.getElementById('new-product-button').addEventListener('click', () => openEditor());
document.getElementById('cancel-edit-button').addEventListener('click', closeEditor);
document.getElementById('cancel-form-button').addEventListener('click', closeEditor);

productTableBody.addEventListener('click', event => {
    const button = event.target.closest('button[data-action]');
    if (!button) return;
    const product = products.find(item => item.id === button.dataset.id);
    if (!product) return;
    if (button.dataset.action === 'edit') {
        openEditor(product);
        return;
    }
    if (window.confirm(`Supprimer « ${product.name} » du catalogue ?`)) {
        products = products.filter(item => item.id !== product.id);
        saveProducts();
        renderProductTable();
        showToast('Création supprimée du catalogue.');
    }
});

productForm.addEventListener('submit', event => {
    event.preventDefault();
    const id = document.getElementById('product-id').value;
    const image = document.getElementById('product-image').value.trim();
    if (/^\s*javascript:/i.test(image)) {
        showToast('Adresse d’image non valide.');
        return;
    }
    const product = {
        id: id || `product-${Date.now()}`,
        name: document.getElementById('product-name').value.trim(),
        category: document.getElementById('product-category').value,
        price: Number(document.getElementById('product-price').value),
        image,
        description: document.getElementById('product-description').value.trim(),
        badge: document.getElementById('product-badge').value.trim()
    };
    if (id) {
        products = products.map(item => item.id === id ? product : item);
    } else {
        products.push(product);
    }
    saveProducts();
    renderProductTable();
    closeEditor();
    showToast(id ? 'Création modifiée avec succès.' : 'Nouvelle création ajoutée au catalogue.');
});

if (sessionStorage.getItem(adminSessionKey) === 'true') {
    showDashboard();
}
