import { db, collection, getDocs, googleProvider, auth, signInWithPopup, signOut, onAuthStateChanged, addDoc, serverTimestamp } from './firebase-config.js';

// Initialize Libraries
AOS.init({
    duration: 800,
    once: true,
    offset: 100
});

// Initialize Swiper
const swiper = new Swiper(".heroSwiper", {
    effect: "fade",
    autoplay: { delay: 5000, disableOnInteraction: false },
    pagination: { el: ".swiper-pagination", clickable: true },
    loop: true
});

// STATE
let cart = [];
let currentUser = null;
let bsOffcanvas = null; // Bootstrap Offcanvas Instance

// --- AUTH LOGIC ---
const authSection = document.getElementById('authSection');
const userProfile = document.getElementById('userProfile');
const userAvatar = document.getElementById('userAvatar');

onAuthStateChanged(auth, (user) => {
    currentUser = user;
    if (user) {
        authSection.classList.add('d-none');
        userProfile.classList.remove('d-none');
        userProfile.classList.add('d-flex');
        userAvatar.src = user.photoURL || 'https://ui-avatars.com/api/?name=' + user.displayName;
    } else {
        authSection.classList.remove('d-none');
        userProfile.classList.add('d-none');
        userProfile.classList.remove('d-flex');
    }
});

window.loginWithGoogle = async () => {
    try {
        await signInWithPopup(auth, googleProvider);
        Toastify({ text: "تم تسجيل الدخول بنجاح! 👋", duration: 3000, gravity: "top", position: "center", style: { background: "linear-gradient(to right, #00b09b, #96c93d)" } }).showToast();
    } catch (error) {
        console.error(error);
        Toastify({ text: "فشل تسجيل الدخول", duration: 3000, style: { background: "#ff5f6d" } }).showToast();
    }
};

window.logout = async () => {
    await signOut(auth);
    window.location.reload();
};

// --- PRODUCTS ---
document.addEventListener('DOMContentLoaded', async () => {
    const grid = document.getElementById('products-grid');

    // Initialize Bootstrap Offcanvas
    bsOffcanvas = new bootstrap.Offcanvas(document.getElementById('cartOffcanvas'));

    try {
        const snapshot = await getDocs(collection(db, "products"));

        if (snapshot.empty) {
            grid.innerHTML = '<div class="col-12 text-center text-white-50 p-5"><h4>لا توجد منتجات حالياً</h4></div>';
            return;
        }

        grid.innerHTML = '';
        snapshot.forEach(doc => {
            const p = doc.data();
            p.id = doc.id;

            grid.innerHTML += `
            <div class="col-lg-3 col-md-4 col-sm-6" data-aos="fade-up">
                <div class="product-card">
                    <span class="badge bg-danger product-badge">New</span>
                    <div class="product-img-wrapper">
                         ${p.image ? `<img src="${p.image}" alt="${p.name}">` : '<i class="fa-solid fa-image fa-3x text-secondary"></i>'}
                    </div>
                    <div class="p-3 d-flex flex-column flex-grow-1">
                        <h5 class="fw-bold mb-1">${p.name}</h5>
                        <p class="small text-white-50 mb-2">القسم: إلكترونيات</p>
                        <div class="mt-auto d-flex justify-content-between align-items-center">
                            <h5 class="text-white mb-0 fw-bold">${p.price} <small class="fs-6 text-white-50">EGP</small></h5>
                            <button class="btn btn-primary rounded-circle shadow-sm" style="width:40px;height:40px" onclick='addToCart(${JSON.stringify(p).replace(/'/g, "&#39;")})'>
                                <i class="fa-solid fa-cart-plus"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            `;
        });

    } catch (error) {
        console.error(error);
        grid.innerHTML = '<div class="text-danger text-center w-100">فشل تحميل المنتجات</div>';
    }
});

// --- CART ---
window.toggleCart = () => bsOffcanvas.show();

window.addToCart = (product) => {
    const exists = cart.find(x => x.id === product.id);
    if (exists) exists.qty++;
    else cart.push({ ...product, qty: 1 });

    updateCartUI();
    bsOffcanvas.show();
    Toastify({ text: "تمت الإضافة للسلة 🛒", duration: 2000, position: "left", style: { background: "#4f46e5" } }).showToast();
};

window.removeFromCart = (id) => {
    cart = cart.filter(x => x.id !== id);
    updateCartUI();
};

window.updateQty = (id, delta) => {
    const item = cart.find(x => x.id === id);
    if (item) {
        item.qty += delta;
        if (item.qty <= 0) removeFromCart(id);
        else updateCartUI();
    }
};

function updateCartUI() {
    const container = document.getElementById('cartItems');
    const totalEl = document.getElementById('cartTotal');
    const badge = document.getElementById('cartBadge');

    const total = cart.reduce((acc, item) => acc + (item.price * item.qty), 0);
    const count = cart.reduce((acc, item) => acc + item.qty, 0);

    badge.innerText = count;
    totalEl.innerText = total.toLocaleString() + ' EGP';
    document.getElementById('payAmount').innerText = total.toLocaleString() + ' EGP';

    if (cart.length === 0) {
        container.innerHTML = `
            <div class="h-100 d-flex flex-column align-items-center justify-content-center text-white-50">
                <i class="fa-solid fa-cart-arrow-down fa-3x mb-3 opacity-50"></i>
                <p>السلة فارغة</p>
            </div>`;
    } else {
        container.innerHTML = cart.map(item => `
            <div class="d-flex gap-3 mb-3 bg-dark p-2 rounded-3 align-items-center">
                <img src="${item.image || 'placeholder.png'}" class="rounded-2" width="60" height="60" style="object-fit:cover">
                <div class="flex-grow-1">
                    <h6 class="mb-0 fw-bold small">${item.name}</h6>
                    <div class="text-warning small fw-bold">${item.price} EGP</div>
                </div>
                <div class="d-flex align-items-center gap-2 bg-black rounded-pill px-2 py-1">
                    <button class="btn btn-sm text-white p-0" onclick="updateQty('${item.id}', -1)">-</button>
                    <span class="small fw-bold">${item.qty}</span>
                    <button class="btn btn-sm text-white p-0" onclick="updateQty('${item.id}', 1)">+</button>
                </div>
                <button class="btn btn-sm text-danger" onclick="removeFromCart('${item.id}')"><i class="fa-solid fa-trash"></i></button>
            </div>
        `).join('');
    }
}

// --- CHECKOUT ---
window.checkout = () => {
    if (!currentUser) {
        bsOffcanvas.hide();
        Toastify({ text: "يرجى تسجيل الدخول أولاً!", duration: 3000, style: { background: "#d63384" } }).showToast();
        return;
    }
    if (cart.length === 0) return;

    bsOffcanvas.hide();
    const modal = new bootstrap.Modal(document.getElementById('paymentModal'));
    modal.show();
};

document.getElementById('paymentForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<div class="spinner-border spinner-border-sm"></div> جاري المعالجة...';
    btn.disabled = true;

    try {
        await addDoc(collection(db, "orders"), {
            user_id: currentUser.uid,
            user_email: currentUser.email,
            user_name: currentUser.displayName,
            products: cart,
            total_price: cart.reduce((acc, item) => acc + (item.price * item.qty), 0),
            phone: document.getElementById('userPhone').value,
            address: document.getElementById('userAddress').value,
            status: 'pending',
            created_at: serverTimestamp(),
            payment_method: document.querySelector('input[name="payment"]:checked').value
        });

        // Close Modal manually using bootstrap API
        const modalEl = document.getElementById('paymentModal');
        const modalInstance = bootstrap.Modal.getInstance(modalEl);
        modalInstance.hide();

        // Success
        Swal.fire({
            title: 'تم بنجاح!',
            text: 'تم استلام طلبك وسنقوم بالتواصل معك قريباً.',
            icon: 'success',
            background: '#1a202e',
            color: '#fff'
        });

        cart = [];
        updateCartUI();

    } catch (error) {
        console.error(error);
        Toastify({ text: "حدث خطأ غير متوقع", style: { background: "#ff5f6d" } }).showToast();
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
});
