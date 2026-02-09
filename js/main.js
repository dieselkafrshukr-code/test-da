import { db, collection, getDocs, googleProvider, auth, signInWithPopup, signOut, onAuthStateChanged, addDoc, serverTimestamp } from './firebase-config.js';

console.log('Client Website Initialized');

// STATE
let cart = [];
let currentUser = null;

// DOM ELEMENTS
const cartBadge = document.getElementById('cartBadge');
const cartCount = document.getElementById('cartCount');
const cartItemsContainer = document.getElementById('cartItems');
const cartTotalEl = document.getElementById('cartTotal');
const cartSidebar = document.getElementById('cartSidebar');
const cartOverlay = document.getElementById('cartOverlay');
const authSection = document.getElementById('authSection');
const userProfile = document.getElementById('userProfile');
const userAvatar = document.getElementById('userAvatar');
const themeToggle = document.getElementById('themeToggle');

// --- THEME LOGIC ---
themeToggle.addEventListener('click', () => {
    const html = document.documentElement;
    const currentTheme = html.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', newTheme);

    // Update Icon
    themeToggle.innerHTML = newTheme === 'dark' ? '<i class="fa-solid fa-sun"></i>' : '<i class="fa-solid fa-moon"></i>';
});

// --- AUTH LOGIC ---
window.loginWithGoogle = async () => {
    try {
        const result = await signInWithPopup(auth, googleProvider);
        console.log('User logged in:', result.user);
    } catch (error) {
        console.error('Login Failed', error);
        alert('فشل تسجيل الدخول: ' + error.message);
    }
};

window.logout = async () => {
    await signOut(auth);
    window.location.reload();
};

onAuthStateChanged(auth, (user) => {
    currentUser = user;
    if (user) {
        authSection.classList.add('hidden');
        userProfile.classList.remove('hidden');
        userAvatar.src = user.photoURL;
    } else {
        authSection.classList.remove('hidden');
        userProfile.classList.add('hidden');
    }
});

// --- PRODUCT LOGIC ---
async function loadProducts() {
    const grid = document.getElementById('products-grid');

    try {
        const querySnapshot = await getDocs(collection(db, "products"));

        if (querySnapshot.empty) {
            grid.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 3rem;">
                    <i class="fa-solid fa-box-open fa-3x" style="color: var(--text-secondary); margin-bottom: 1rem;"></i>
                    <p>لا توجد منتجات متاحة حالياً.</p>
                </div>
            `;
            return;
        }

        grid.innerHTML = ''; // Clear loading

        querySnapshot.forEach((doc) => {
            const product = doc.data();
            product.id = doc.id; // Store ID for cart

            const productHTML = `
                <div class="product-card">
                    <div class="product-image">
                       ${product.image ? `<img src="${product.image}" alt="${product.name}">` : '<i class="fa-solid fa-image fa-3x" style="color: var(--text-secondary)"></i>'}
                    </div>
                    <div class="product-info">
                        <h3 class="product-title">${product.name}</h3>
                        <span class="product-price">EGP ${product.price}</span>
                        <button class="btn-add-cart" onclick='addToCart(${JSON.stringify(product).replace(/'/g, "&#39;")})'>
                            <i class="fa-solid fa-cart-plus"></i> أضف للسلة
                        </button>
                    </div>
                </div>
            `;
            grid.innerHTML += productHTML;
        });

    } catch (error) {
        console.error("Error getting products: ", error);
        grid.innerHTML = '<p class="loading-placeholder" style="color: var(--danger);">حدث خطأ في تحميل المنتجات.</p>';
    }
}

// --- CART LOGIC ---
window.addToCart = (product) => {
    const existingItem = cart.find(item => item.id === product.id);
    if (existingItem) {
        existingItem.qty++;
    } else {
        cart.push({ ...product, qty: 1 });
    }
    updateCartUI();
    toggleCart(true); // Open sidebar
};

window.removeFromCart = (id) => {
    cart = cart.filter(item => item.id !== id);
    updateCartUI();
};

window.updateQty = (id, change) => {
    const item = cart.find(item => item.id === id);
    if (item) {
        item.qty += change;
        if (item.qty <= 0) window.removeFromCart(id);
        else updateCartUI();
    }
};

function updateCartUI() {
    // Update Counts & Total
    const totalQty = cart.reduce((acc, item) => acc + item.qty, 0);
    const totalPrice = cart.reduce((acc, item) => acc + (item.price * item.qty), 0);

    cartBadge.innerText = totalQty;
    cartCount.innerText = `(${totalQty})`;
    cartTotalEl.innerText = `${totalPrice.toLocaleString()} EGP`;
    document.getElementById('payAmount').innerText = `${totalPrice.toLocaleString()} EGP`;

    // Render Items
    if (cart.length === 0) {
        cartItemsContainer.innerHTML = `
            <div class="empty-cart-msg">
                <i class="fa-solid fa-shopping-basket"></i>
                <p>السلة فارغة</p>
            </div>`;
    } else {
        cartItemsContainer.innerHTML = cart.map(item => `
            <div class="cart-item">
                ${item.image ? `<img src="${item.image}">` : `<div style="width:60px;height:60px;background:#333;border-radius:8px;"></div>`}
                <div class="cart-item-info">
                    <div class="cart-item-title">${item.name}</div>
                    <div class="cart-item-price">EGP ${item.price}</div>
                    <div class="cart-item-controls">
                        <button class="qty-btn" onclick="updateQty('${item.id}', -1)">-</button>
                        <span>${item.qty}</span>
                        <button class="qty-btn" onclick="updateQty('${item.id}', 1)">+</button>
                        <button onclick="removeFromCart('${item.id}')" style="margin-right:auto;background:none;border:none;color:var(--secondary-color);cursor:pointer;"><i class="fa-solid fa-trash"></i></button>
                    </div>
                </div>
            </div>
        `).join('');
    }
}

window.toggleCart = (forceOpen = null) => {
    if (forceOpen === true) {
        cartSidebar.classList.add('open');
        cartOverlay.classList.add('open');
    } else {
        cartSidebar.classList.toggle('open');
        cartOverlay.classList.toggle('open');
    }
};

// --- CHECKOUT LOGIC ---
window.checkout = () => {
    if (!currentUser) {
        alert('يرجى تسجيل الدخول أولاً لإتمام الطلب');
        loginWithGoogle();
        return;
    }
    if (cart.length === 0) return;

    toggleCart(false); // Close cart
    document.getElementById('paymentModal').classList.remove('hidden');
};

window.closeModal = (id) => {
    document.getElementById(id).classList.add('hidden');
};

window.selectPayment = (type) => {
    document.querySelectorAll('.payment-option').forEach(el => el.classList.remove('selected'));
    if (type === 'card') {
        document.querySelector('.payment-option:nth-child(1)').classList.add('selected');
        document.getElementById('cardDetails').style.display = 'block';
    } else {
        document.querySelector('.payment-option:nth-child(2)').classList.add('selected');
        document.getElementById('cardDetails').style.display = 'none';
    }
};

// Handle Payment Submit
document.getElementById('paymentForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const phone = document.getElementById('userPhone').value;
    const address = document.getElementById('userAddress').value;

    // Simulate Processing
    const btn = e.target.querySelector('button');
    btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> جاري المعالجة...';
    btn.disabled = true;

    try {
        // Save Order to Firestore
        await addDoc(collection(db, "orders"), {
            user_id: currentUser.uid,
            user_email: currentUser.email,
            user_name: currentUser.displayName,
            products: cart,
            total_price: cart.reduce((acc, item) => acc + (item.price * item.qty), 0),
            phone: phone,
            address: address,
            status: 'pending',
            created_at: serverTimestamp(),
            payment_method: document.querySelector('.payment-option.selected').innerText.trim()
        });

        setTimeout(() => {
            alert('تم استلام طلبك بنجاح! شكراً لتسوقك معنا.');
            cart = [];
            updateCartUI();
            closeModal('paymentModal');
            btn.innerHTML = 'تأكيد الدفع';
            btn.disabled = false;
        }, 2000);

    } catch (error) {
        console.error("Error creating order: ", error);
        alert('حدث خطأ أثناء إرسال الطلب، يرجى المحاولة لاحقاً.');
        btn.innerHTML = 'تأكيد الدفع';
        btn.disabled = false;
    }
});

// INITIALIZE
document.addEventListener('DOMContentLoaded', loadProducts);
