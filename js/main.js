import { db, collection, getDocs } from './firebase-config.js';

console.log('Client Website Initialized');

async function loadProducts() {
    const grid = document.getElementById('products-grid');

    try {
        const querySnapshot = await getDocs(collection(db, "products"));

        if (querySnapshot.empty) {
            grid.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 3rem;">
                    <i class="fa-solid fa-box-open fa-3x" style="color: var(--text-dim); margin-bottom: 1rem;"></i>
                    <p>لا توجد منتجات متاحة حالياً.</p>
                </div>
            `;
            return;
        }

        grid.innerHTML = ''; // Clear loading

        querySnapshot.forEach((doc) => {
            const product = doc.data();
            const productHTML = `
                <div class="product-card">
                    <div class="product-image">
                       ${product.image ? `<img src="${product.image}" alt="${product.name}" style="width:100%; height:100%; object-fit:cover;">` : '<i class="fa-solid fa-image"></i>'}
                    </div>
                    <div class="product-info">
                        <h3 class="product-title">${product.name}</h3>
                        <span class="product-price">EGP ${product.price}</span>
                        <button class="btn-add-cart">
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

// Load products when page loads
document.addEventListener('DOMContentLoaded', loadProducts);
