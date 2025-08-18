// AutoKosten Vergelijker - Navigation System
// Advanced navigation with mobile support

class NavigationSystem {
    constructor() {
        this.mobileBreakpoint = 768;
        this.isMenuOpen = false;
        this.init();
    }

    init() {
        this.createMobileMenu();
        this.bindEvents();
        this.setActiveNavigation();
    }

    /**
     * Create mobile hamburger menu
     */
    createMobileMenu() {
        const nav = document.querySelector('.nav');
        
        // Create mobile menu button
        const mobileMenuBtn = document.createElement('button');
        mobileMenuBtn.className = 'mobile-menu-btn';
        mobileMenuBtn.innerHTML = `
            <span class="hamburger-line"></span>
            <span class="hamburger-line"></span>
            <span class="hamburger-line"></span>
        `;
        mobileMenuBtn.setAttribute('aria-label', 'Open navigation menu');
        
        // Insert before nav
        nav.parentNode.insertBefore(mobileMenuBtn, nav);
        
        // Add mobile menu styles
        this.addMobileMenuStyles();
    }

    /**
     * Add mobile menu CSS styles
     */
    addMobileMenuStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .mobile-menu-btn {
                display: none;
                flex-direction: column;
                background: none;
                border: none;
                cursor: pointer;
                padding: 8px;
                gap: 4px;
            }
            
            .hamburger-line {
                width: 24px;
                height: 3px;
                background: var(--gray-700);
                transition: all 0.3s ease;
                border-radius: 2px;
            }
            
            .mobile-menu-btn.active .hamburger-line:nth-child(1) {
                transform: rotate(45deg) translate(7px, 7px);
            }
            
            .mobile-menu-btn.active .hamburger-line:nth-child(2) {
                opacity: 0;
            }
            
            .mobile-menu-btn.active .hamburger-line:nth-child(3) {
                transform: rotate(-45deg) translate(7px, -7px);
            }
            
            @media (max-width: 768px) {
                .mobile-menu-btn {
                    display: flex;
                }
                
                .nav {
                    position: absolute;
                    top: 100%;
                    left: 0;
                    right: 0;
                    background: var(--white);
                    box-shadow: var(--box-shadow-lg);
                    transform: translateY(-100%);
                    opacity: 0;
                    visibility: hidden;
                    transition: all 0.3s ease;
                    z-index: 1000;
                }
                
                .nav.mobile-open {
                    transform: translateY(0);
                    opacity: 1;
                    visibility: visible;
                }
                
                .nav ul {
                    flex-direction: column;
                    padding: var(--spacing-lg);
                    gap: var(--spacing-lg);
                }
                
                .nav li {
                    border-bottom: 1px solid var(--gray-200);
                    padding-bottom: var(--spacing-md);
                }
                
                .nav li:last-child {
                    border-bottom: none;
                    padding-bottom: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Bind event listeners
     */
    bindEvents() {
        const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
        const nav = document.querySelector('.nav');
        
        // Mobile menu toggle
        mobileMenuBtn.addEventListener('click', () => {
            this.toggleMobileMenu();
        });
        
        // Close menu when clicking nav links
        nav.addEventListener('click', (e) => {
            if (e.target.tagName === 'A') {
                this.closeMobileMenu();
            }
        });
        
        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!nav.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
                this.closeMobileMenu();
            }
        });
        
        // Handle window resize
        window.addEventListener('resize', AutoKostenUtils.debounce(() => {
            if (window.innerWidth > this.mobileBreakpoint) {
                this.closeMobileMenu();
            }
        }, 250));
        
        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isMenuOpen) {
                this.closeMobileMenu();
            }
        });
    }

    /**
     * Toggle mobile menu
     */
    toggleMobileMenu() {
        if (this.isMenuOpen) {
            this.closeMobileMenu();
        } else {
            this.openMobileMenu();
        }
    }

    /**
     * Open mobile menu
     */
    openMobileMenu() {
        const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
        const nav = document.querySelector('.nav');
        
        mobileMenuBtn.classList.add('active');
        nav.classList.add('mobile-open');
        this.isMenuOpen = true;
        
        // Prevent body scroll
        document.body.style.overflow = 'hidden';
        
        // Focus management
        const firstLink = nav.querySelector('a');
        if (firstLink) {
            firstLink.focus();
        }
    }

    /**
     * Close mobile menu
     */
    closeMobileMenu() {
        const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
        const nav = document.querySelector('.nav');
        
        mobileMenuBtn.classList.remove('active');
        nav.classList.remove('mobile-open');
        this.isMenuOpen = false;
        
        // Restore body scroll
        document.body.style.overflow = '';
    }

    /**
     * Set active navigation based on current page/section
     */
    setActiveNavigation() {
        const navLinks = document.querySelectorAll('.nav a');
        const sections = document.querySelectorAll('section[id]');
        
        // Function to update active nav
        const updateActiveNav = () => {
            let current = '';
            
            sections.forEach(section => {
                const sectionTop = section.offsetTop;
                const sectionHeight = section.clientHeight;
                
                if (window.scrollY >= (sectionTop - 200)) {
                    current = section.getAttribute('id');
                }
            });
            
            navLinks.forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href') === `#${current}`) {
                    link.classList.add('active');
                }
            });
        };
        
        // Update on scroll
        window.addEventListener('scroll', AutoKostenUtils.debounce(updateActiveNav, 100));
        
        // Initial update
        updateActiveNav();
    }
}

/**
 * Breadcrumb navigation for sub-pages
 */
class BreadcrumbSystem {
    constructor() {
        this.init();
    }

    init() {
        this.generateBreadcrumbs();
    }

    generateBreadcrumbs() {
        const path = window.location.pathname;
        const pathSegments = path.split('/').filter(segment => segment !== '');
        
        if (pathSegments.length === 0) return; // Home page
        
        const breadcrumbContainer = document.createElement('div');
        breadcrumbContainer.className = 'breadcrumb-container';
        
        const breadcrumb = document.createElement('nav');
        breadcrumb.className = 'breadcrumb';
        breadcrumb.setAttribute('aria-label', 'Breadcrumb navigation');
        
        const breadcrumbList = document.createElement('ol');
        breadcrumbList.className = 'breadcrumb-list';
        
        // Home link
        const homeItem = this.createBreadcrumbItem('Home', '/', false);
        breadcrumbList.appendChild(homeItem);
        
        // Path segments
        let currentPath = '';
        pathSegments.forEach((segment, index) => {
            currentPath += `/${segment}`;
            const isLast = index === pathSegments.length - 1;
            const title = this.formatSegmentTitle(segment);
            const item = this.createBreadcrumbItem(title, currentPath, isLast);
            breadcrumbList.appendChild(item);
        });
        
        breadcrumb.appendChild(breadcrumbList);
        breadcrumbContainer.appendChild(breadcrumb);
        
        // Insert after header
        const header = document.querySelector('.header');
        if (header) {
            header.insertAdjacentElement('afterend', breadcrumbContainer);
        }
        
        this.addBreadcrumbStyles();
    }

    createBreadcrumbItem(title, href, isLast) {
        const item = document.createElement('li');
        item.className = 'breadcrumb-item';
        
        if (isLast) {
            item.textContent = title;
            item.setAttribute('aria-current', 'page');
        } else {
            const link = document.createElement('a');
            link.href = href;
            link.textContent = title;
            item.appendChild(link);
        }
        
        return item;
    }

    formatSegmentTitle(segment) {
        return segment
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }

    addBreadcrumbStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .breadcrumb-container {
                background: var(--gray-50);
                border-bottom: 1px solid var(--gray-200);
                padding: var(--spacing-md) 0;
            }
            
            .breadcrumb-list {
                display: flex;
                align-items: center;
                list-style: none;
                margin: 0;
                padding: 0;
                gap: var(--spacing-sm);
            }
            
            .breadcrumb-item {
                font-size: var(--font-size-sm);
                color: var(--gray-600);
            }
            
            .breadcrumb-item:not(:last-child)::after {
                content: '›';
                margin-left: var(--spacing-sm);
                color: var(--gray-400);
            }
            
            .breadcrumb-item a {
                color: var(--secondary-color);
                text-decoration: none;
                transition: color 0.3s ease;
            }
            
            .breadcrumb-item a:hover {
                color: var(--primary-color);
            }
            
            .breadcrumb-item[aria-current="page"] {
                color: var(--gray-800);
                font-weight: 500;
            }
        `;
        document.head.appendChild(style);
    }
}

// Initialize navigation when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    new NavigationSystem();
    new BreadcrumbSystem();
});