// AutoKosten Vergelijker - Main JavaScript
// Enterprise-level functionality

document.addEventListener('DOMContentLoaded', function() {
    
    // Initialize application
    console.log('AutoKosten Vergelijker loaded');
    
    // Smooth scrolling for navigation links
    initSmoothScrolling();
    
    // Header scroll effects
    initHeaderEffects();
    
    // Option cards hover effects
    initOptionCards();
    
    // Performance monitoring
    logPerformanceMetrics();
});

/**
 * Initialize smooth scrolling for anchor links
 */
function initSmoothScrolling() {
    const links = document.querySelectorAll('a[href^="#"]');
    
    links.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                const headerHeight = document.querySelector('.header').offsetHeight;
                const targetPosition = targetElement.offsetTop - headerHeight - 20;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
                
                // Update URL without jumping
                if (history.pushState) {
                    history.pushState(null, null, `#${targetId}`);
                }
            }
        });
    });
}

/**
 * Header scroll effects
 */
function initHeaderEffects() {
    const header = document.querySelector('.header');
    let lastScrollY = window.scrollY;
    
    window.addEventListener('scroll', function() {
        const currentScrollY = window.scrollY;
        
        // Add shadow when scrolled
        if (currentScrollY > 10) {
            header.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.1)';
        } else {
            header.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
        }
        
        lastScrollY = currentScrollY;
    });
}

/**
 * Option cards interactive effects
 */
function initOptionCards() {
    const optionCards = document.querySelectorAll('.optie-card');
    
    optionCards.forEach(card => {
        // Add click tracking
        card.addEventListener('click', function(e) {
            // Don't trigger if clicking on the button
            if (!e.target.classList.contains('btn')) {
                const button = this.querySelector('.btn');
                if (button) {
                    // Add visual feedback
                    this.style.transform = 'scale(0.98)';
                    setTimeout(() => {
                        this.style.transform = '';
                        button.click();
                    }, 150);
                }
            }
        });
        
        // Enhanced hover effects
        card.addEventListener('mouseenter', function() {
            this.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transition = 'all 0.3s ease';
        });
    });
}

/**
 * Performance monitoring
 */
function logPerformanceMetrics() {
    // Log load time
    window.addEventListener('load', function() {
        const loadTime = performance.now();
        console.log(`Page loaded in ${Math.round(loadTime)}ms`);
        
        // Monitor largest contentful paint
        if ('web-vitals' in window) {
            // Web Vitals monitoring would go here
        }
    });
}

/**
 * Error handling
 */
window.addEventListener('error', function(e) {
    console.error('JavaScript error:', e.error);
    
    // In production, send to error tracking service
    // trackError(e.error);
});

/**
 * Utility functions
 */
const Utils = {
    
    /**
     * Debounce function calls
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },
    
    /**
     * Format currency for Dutch locale
     */
    formatCurrency(amount) {
        return new Intl.NumberFormat('nl-NL', {
            style: 'currency',
            currency: 'EUR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    },
    
    /**
     * Format percentage for Dutch locale
     */
    formatPercentage(value) {
        return new Intl.NumberFormat('nl-NL', {
            style: 'percent',
            minimumFractionDigits: 1,
            maximumFractionDigits: 1
        }).format(value / 100);
    },
    
    /**
     * Validate Dutch license plate (kenteken)
     */
    validateKenteken(kenteken) {
        // Remove spaces and convert to uppercase
        const cleaned = kenteken.replace(/\s/g, '').toUpperCase();
        
        // Dutch license plate patterns
        const patterns = [
            /^[A-Z]{2}[0-9]{2}[A-Z]{2}$/, // XX-99-XX
            /^[0-9]{2}[A-Z]{3}[0-9]$/,    // 99-XXX-9
            /^[0-9]{2}[A-Z]{2}[0-9]{2}$/, // 99-XX-99
            /^[A-Z]{2}[0-9]{3}[A-Z]$/,    // XX-999-X
            /^[A-Z]{3}[0-9]{2}[A-Z]$/,    // XXX-99-X
            /^[0-9]{1}[A-Z]{3}[0-9]{2}$/, // 9-XXX-99
            /^[A-Z]{1}[0-9]{3}[A-Z]{2}$/  // X-999-XX
        ];
        
        return patterns.some(pattern => pattern.test(cleaned));
    },
    
    /**
     * Show loading state
     */
    showLoading(element) {
        element.style.opacity = '0.6';
        element.style.pointerEvents = 'none';
        
        // Add loading spinner if not exists
        if (!element.querySelector('.loading-spinner')) {
            const spinner = document.createElement('div');
            spinner.className = 'loading-spinner';
            spinner.innerHTML = '⏳';
            spinner.style.position = 'absolute';
            spinner.style.top = '50%';
            spinner.style.left = '50%';
            spinner.style.transform = 'translate(-50%, -50%)';
            spinner.style.fontSize = '24px';
            element.style.position = 'relative';
            element.appendChild(spinner);
        }
    },
    
    /**
     * Hide loading state
     */
    hideLoading(element) {
        element.style.opacity = '1';
        element.style.pointerEvents = 'auto';
        
        const spinner = element.querySelector('.loading-spinner');
        if (spinner) {
            spinner.remove();
        }
    }
};

// Export utilities for use in other modules
window.AutoKostenUtils = Utils;