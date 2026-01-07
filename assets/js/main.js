// Enhanced JavaScript for Navjyoti Handloom Website

class NavjyotiApp {
    constructor() {
        this.cart = JSON.parse(localStorage.getItem('cart')) || [];
        this.products = [];
        this.filteredProducts = [];
        this.currentCategory = 'all';
        this.currentSort = 'name';
        this.searchQuery = '';
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateCartBadge();
        this.setupScrollEffects();
        this.loadProducts();
        this.setupSearch();
        this.setupFilters();
        this.setupAnimations();
    }

    // Event Listeners Setup
    setupEventListeners() {
        // Navbar scroll effect
        window.addEventListener('scroll', this.handleScroll.bind(this));
        
        // Cart events
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('add-to-cart-btn')) {
                e.preventDefault();
                const productName = e.target.dataset.name;
                const productPrice = parseFloat(e.target.dataset.price);
                const quantityInput = e.target.parentElement.querySelector('input[type="number"]');
                const quantity = quantityInput ? parseInt(quantityInput.value) : 1;
                
                this.addToCart(productName, productPrice, quantity);
            }
        });

        // Search functionality
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', this.handleSearch.bind(this));
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.performSearch();
                }
            });
        }

        // Filter functionality
        const categoryFilter = document.getElementById('categoryFilter');
        const sortFilter = document.getElementById('sortFilter');
        
        if (categoryFilter) {
            categoryFilter.addEventListener('change', this.handleCategoryFilter.bind(this));
        }
        
        if (sortFilter) {
            sortFilter.addEventListener('change', this.handleSortFilter.bind(this));
        }
    }

    // Scroll Effects
    handleScroll() {
        const navbar = document.querySelector('.navbar');
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    }

    setupScrollEffects() {
        // Intersection Observer for animations
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('fade-in');
                }
            });
        }, observerOptions);

        // Observe all product cards
        document.querySelectorAll('.product-card').forEach(card => {
            observer.observe(card);
        });
    }

    // Cart Management
    addToCart(name, price, quantity = 1) {
        const existingItem = this.cart.find(item => item.name === name);
        
        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            this.cart.push({ name, price, quantity });
        }
        
        this.saveCart();
        this.updateCartBadge();
        this.showToast(`${name} added to cart!`, 'success');
        
        // Add visual feedback
        this.addCartAnimation();
    }

    removeFromCart(index) {
        this.cart.splice(index, 1);
        this.saveCart();
        this.updateCartBadge();
        this.loadCart();
        this.showToast('Item removed from cart', 'info');
    }

    updateQuantity(index, quantity) {
        if (quantity <= 0) {
            this.removeFromCart(index);
            return;
        }
        
        this.cart[index].quantity = parseInt(quantity);
        this.saveCart();
        this.loadCart();
    }

    clearCart() {
        this.cart = [];
        this.saveCart();
        this.updateCartBadge();
        this.loadCart();
        this.showToast('Cart cleared', 'info');
    }

    saveCart() {
        localStorage.setItem('cart', JSON.stringify(this.cart));
    }

    updateCartBadge() {
        const badge = document.querySelector('.cart-badge');
        const totalItems = this.cart.reduce((sum, item) => sum + item.quantity, 0);
        
        if (badge) {
            badge.textContent = totalItems;
            badge.style.display = totalItems > 0 ? 'flex' : 'none';
        }
    }

    loadCart() {
        const cartTable = document.getElementById('cart-items');
        const cartTotal = document.getElementById('cart-total');
        
        if (!cartTable) return;
        
        let totalAmount = 0;
        cartTable.innerHTML = '';
        
        this.cart.forEach((item, index) => {
            const total = item.price * item.quantity;
            totalAmount += total;
            
            cartTable.innerHTML += `
                <tr class="fade-in">
                    <td>${item.name}</td>
                    <td>₹${item.price}</td>
                    <td>
                        <input type="number" min="1" value="${item.quantity}" 
                               class="quantity-input" 
                               onchange="app.updateQuantity(${index}, this.value)">
                    </td>
                    <td>₹${total}</td>
                    <td>
                        <button class="btn btn-danger btn-sm" 
                                onclick="app.removeFromCart(${index})">
                            <i class="fas fa-trash"></i> Remove
                        </button>
                    </td>
                </tr>
            `;
        });
        
        if (cartTotal) {
            cartTotal.innerHTML = `
                <div class="cart-total">
                    Total: ₹${totalAmount}
                    <small class="d-block mt-2">${this.cart.length} items in cart</small>
                </div>
            `;
        }
    }

    // Search Functionality
    setupSearch() {
        this.loadProductsFromDOM();
    }

    loadProductsFromDOM() {
        const productCards = document.querySelectorAll('.product-card');
        this.products = [];
        
        productCards.forEach(card => {
            const title = card.querySelector('.card-title')?.textContent || '';
            const description = card.querySelector('.card-text')?.textContent || '';
            const priceText = card.querySelector('.card-text')?.textContent || '';
            const price = this.extractPrice(priceText);
            
            this.products.push({
                element: card,
                title: title.toLowerCase(),
                description: description.toLowerCase(),
                price: price,
                category: this.getProductCategory(title)
            });
        });
        
        this.filteredProducts = [...this.products];
    }

    extractPrice(priceText) {
        const match = priceText.match(/₹?(\d+)/);
        return match ? parseInt(match[1]) : 0;
    }

    getProductCategory(title) {
        const titleLower = title.toLowerCase();
        if (titleLower.includes('kurta')) return 'kurtas';
        if (titleLower.includes('suit')) return 'suits';
        if (titleLower.includes('bag')) return 'bags';
        if (titleLower.includes('mat') || titleLower.includes('doormat')) return 'mats';
        return 'other';
    }

    handleSearch(e) {
        this.searchQuery = e.target.value.toLowerCase();
        this.filterProducts();
    }

    performSearch() {
        this.filterProducts();
        this.showToast(`Found ${this.filteredProducts.length} products`, 'info');
    }

    // Filter Functionality
    setupFilters() {
        this.createFilterUI();
    }

    createFilterUI() {
        const filterContainer = document.querySelector('.filter-section');
        if (!filterContainer) return;
        
        const categories = ['all', ...new Set(this.products.map(p => p.category))];
        
        const categorySelect = document.getElementById('categoryFilter');
        if (categorySelect) {
            categorySelect.innerHTML = categories.map(cat => 
                `<option value="${cat}">${this.capitalizeFirst(cat)}</option>`
            ).join('');
        }
    }

    handleCategoryFilter(e) {
        this.currentCategory = e.target.value;
        this.filterProducts();
    }

    handleSortFilter(e) {
        this.currentSort = e.target.value;
        this.filterProducts();
    }

    filterProducts() {
        this.filteredProducts = this.products.filter(product => {
            const matchesSearch = !this.searchQuery || 
                product.title.includes(this.searchQuery) || 
                product.description.includes(this.searchQuery);
            
            const matchesCategory = this.currentCategory === 'all' || 
                product.category === this.currentCategory;
            
            return matchesSearch && matchesCategory;
        });
        
        // Sort products
        this.filteredProducts.sort((a, b) => {
            switch (this.currentSort) {
                case 'price-low':
                    return a.price - b.price;
                case 'price-high':
                    return b.price - a.price;
                case 'name':
                default:
                    return a.title.localeCompare(b.title);
            }
        });
        
        this.displayFilteredProducts();
    }

    displayFilteredProducts() {
        // Hide all products first
        this.products.forEach(product => {
            product.element.style.display = 'none';
            product.element.parentElement.style.display = 'none';
        });
        
        // Show filtered products
        this.filteredProducts.forEach((product, index) => {
            product.element.style.display = 'block';
            product.element.parentElement.style.display = 'block';
            
            // Add staggered animation
            setTimeout(() => {
                product.element.classList.add('slide-up');
            }, index * 100);
        });
        
        // Update results count
        const resultsCount = document.getElementById('resultsCount');
        if (resultsCount) {
            resultsCount.textContent = `Showing ${this.filteredProducts.length} of ${this.products.length} products`;
        }
    }

    // Animations
    setupAnimations() {
        // Add loading animation to buttons
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('buti') || e.target.classList.contains('btn-primary-custom')) {
                this.addButtonLoadingState(e.target);
            }
        });
    }

    addButtonLoadingState(button) {
        const originalText = button.textContent;
        button.innerHTML = '<span class="loading-spinner"></span> Loading...';
        button.disabled = true;
        
        setTimeout(() => {
            button.textContent = originalText;
            button.disabled = false;
        }, 1000);
    }

    addCartAnimation() {
        const cartIcon = document.querySelector('.nav-link[href="cart.html"]');
        if (cartIcon) {
            cartIcon.classList.add('animate__animated', 'animate__bounce');
            setTimeout(() => {
                cartIcon.classList.remove('animate__animated', 'animate__bounce');
            }, 1000);
        }
    }

    // Toast Notifications
    showToast(message, type = 'success') {
        const toastContainer = this.getOrCreateToastContainer();
        
        const toast = document.createElement('div');
        toast.className = `toast-custom ${type === 'error' ? 'toast-error' : ''}`;
        toast.innerHTML = `
            <div class="d-flex align-items-center">
                <i class="fas fa-${this.getToastIcon(type)} me-2"></i>
                <span>${message}</span>
                <button type="button" class="btn-close ms-auto" onclick="this.parentElement.parentElement.remove()"></button>
            </div>
        `;
        
        toastContainer.appendChild(toast);
        
        // Auto remove after 3 seconds
        setTimeout(() => {
            if (toast.parentElement) {
                toast.remove();
            }
        }, 3000);
    }

    getOrCreateToastContainer() {
        let container = document.querySelector('.toast-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'toast-container';
            document.body.appendChild(container);
        }
        return container;
    }

    getToastIcon(type) {
        switch (type) {
            case 'success': return 'check-circle';
            case 'error': return 'exclamation-circle';
            case 'info': return 'info-circle';
            default: return 'check-circle';
        }
    }

    // Utility Functions
    capitalizeFirst(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    // Checkout Functions
    proceedToCheckout() {
        if (this.cart.length === 0) {
            this.showToast('Your cart is empty!', 'error');
            return;
        }
        
        window.location.href = 'checkout.html';
    }

    loadCheckout() {
        const checkoutTable = document.getElementById('checkout-items');
        const checkoutTotal = document.getElementById('checkout-total');
        
        if (!checkoutTable) return;
        
        let totalAmount = 0;
        checkoutTable.innerHTML = '';
        
        this.cart.forEach(item => {
            const total = item.price * item.quantity;
            totalAmount += total;
            
            checkoutTable.innerHTML += `
                <tr>
                    <td>${item.name}</td>
                    <td>₹${item.price}</td>
                    <td>${item.quantity}</td>
                    <td>₹${total}</td>
                </tr>
            `;
        });
        
        if (checkoutTotal) {
            checkoutTotal.innerHTML = `
                <div class="cart-total">
                    Total: ₹${totalAmount}
                    <small class="d-block mt-2">Including all taxes</small>
                </div>
            `;
        }
        
        // Set hidden form fields
        const cartInput = document.getElementById('cart');
        const totalInput = document.getElementById('total');
        
        if (cartInput) cartInput.value = JSON.stringify(this.cart);
        if (totalInput) totalInput.value = totalAmount;
    }

    // Form Validation
    validateCheckoutForm(form) {
        const requiredFields = form.querySelectorAll('[required]');
        let isValid = true;
        
        requiredFields.forEach(field => {
            if (!field.value.trim()) {
                field.classList.add('is-invalid');
                isValid = false;
            } else {
                field.classList.remove('is-invalid');
            }
        });
        
        // Validate mobile number
        const mobileField = form.querySelector('[name="mobile"]');
        if (mobileField && mobileField.value) {
            const mobileRegex = /^[6-9]\d{9}$/;
            if (!mobileRegex.test(mobileField.value)) {
                mobileField.classList.add('is-invalid');
                this.showToast('Please enter a valid mobile number', 'error');
                isValid = false;
            }
        }
        
        // Validate pincode
        const pincodeField = form.querySelector('[name="pincode"]');
        if (pincodeField && pincodeField.value) {
            const pincodeRegex = /^\d{6}$/;
            if (!pincodeRegex.test(pincodeField.value)) {
                pincodeField.classList.add('is-invalid');
                this.showToast('Please enter a valid 6-digit pincode', 'error');
                isValid = false;
            }
        }
        
        return isValid;
    }
}

// Initialize the app
const app = new NavjyotiApp();

// Global functions for backward compatibility
function addToCart(name, price, quantity = 1) {
    app.addToCart(name, price, quantity);
}

function loadCart() {
    app.loadCart();
}

function updateQuantity(index, quantity) {
    app.updateQuantity(index, quantity);
}

function removeItem(index) {
    app.removeFromCart(index);
}

function clearCart() {
    app.clearCart();
}

function proceedToCheckout() {
    app.proceedToCheckout();
}

function loadCheckout() {
    app.loadCheckout();
}

// Page-specific initialization
document.addEventListener('DOMContentLoaded', function() {
    // Cart page
    if (document.getElementById('cart-items')) {
        app.loadCart();
    }
    
    // Checkout page
    if (document.getElementById('checkout-items')) {
        app.loadCheckout();
        
        // Setup checkout form validation
        const checkoutForm = document.getElementById('checkout-form');
        if (checkoutForm) {
            checkoutForm.addEventListener('submit', function(e) {
                if (!app.validateCheckoutForm(this)) {
                    e.preventDefault();
                    return false;
                }
                
                // Show loading state
                const submitBtn = this.querySelector('[type="submit"]');
                app.addButtonLoadingState(submitBtn);
            });
        }
    }
    
    // Add smooth scrolling to all anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
});

// Service Worker Registration (for PWA capabilities)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('/sw.js')
            .then(function(registration) {
                console.log('ServiceWorker registration successful');
            })
            .catch(function(err) {
                console.log('ServiceWorker registration failed');
            });
    });
}