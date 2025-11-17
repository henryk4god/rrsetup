const PROXY_URL = 'https://script.google.com/macros/s/AKfycbwATUTIqB5rn9j24hrl5AaBuJgiJPksf8lKamo9_6a1G1wQqZWqLXa_Q2vjNa7LZ7tj-g/exec';

class RestaurantSetup {
    constructor() {
        this.config = {};
        this.init();
    }

    async init() {
        await this.loadCurrentConfig();
        this.setupEventListeners();
    }

    setupEventListeners() {
        document.getElementById('setupForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveConfig();
        });
    }

    async loadCurrentConfig() {
        try {
            this.showStatus('Loading current configuration...', 'info');
            
            const response = await fetch(`${PROXY_URL}?path=config&action=get`);
            const data = await response.json();
            
            if (data.success) {
                this.config = data.data;
                this.populateForm(this.config);
                this.showStatus('Configuration loaded successfully!', 'success');
            } else {
                this.showStatus('Using default configuration', 'info');
                // Form will remain with default values
            }
        } catch (error) {
            console.error('Error loading configuration:', error);
            this.showStatus('Error loading configuration. Using default values.', 'error');
        }
    }

    populateForm(config) {
        // Basic Information
        document.getElementById('restaurantName').value = config.name || '';
        document.getElementById('restaurantAddress').value = config.address || '';
        document.getElementById('restaurantPhone').value = config.phone || '';
        document.getElementById('restaurantEmail').value = config.email || '';
        
        // Business Hours
        if (config.businessHours) {
            document.getElementById('weekdayOpen').value = config.businessHours.weekday?.open || '08:00';
            document.getElementById('weekdayClose').value = config.businessHours.weekday?.close || '22:00';
            document.getElementById('saturdayOpen').value = config.businessHours.saturday?.open || '09:00';
            document.getElementById('saturdayClose').value = config.businessHours.saturday?.close || '23:00';
            document.getElementById('sundayOpen').value = config.businessHours.sunday?.open || '10:00';
            document.getElementById('sundayClose').value = config.businessHours.sunday?.close || '21:00';
        }
        
        // Order Settings
        document.getElementById('prepTime').value = config.orderSettings?.prepTime || 30;
        document.getElementById('pickupInterval').value = config.orderSettings?.pickupInterval || 15;
        document.getElementById('serviceFee').value = config.orderSettings?.serviceFee || 5;
        
        // Payment & Monetization
        document.getElementById('paymentMethod').value = config.paymentSettings?.method || 'cash';
        document.getElementById('setupFee').value = config.monetization?.setupFee || 49;
        document.getElementById('monthlyFee').value = config.monetization?.monthlyFee || 19;
    }

    gatherFormData() {
        return {
            name: document.getElementById('restaurantName').value.trim(),
            address: document.getElementById('restaurantAddress').value.trim(),
            phone: document.getElementById('restaurantPhone').value.trim(),
            email: document.getElementById('restaurantEmail').value.trim(),
            
            businessHours: {
                weekday: {
                    open: document.getElementById('weekdayOpen').value,
                    close: document.getElementById('weekdayClose').value
                },
                saturday: {
                    open: document.getElementById('saturdayOpen').value,
                    close: document.getElementById('saturdayClose').value
                },
                sunday: {
                    open: document.getElementById('sundayOpen').value,
                    close: document.getElementById('sundayClose').value
                }
            },
            
            orderSettings: {
                prepTime: parseInt(document.getElementById('prepTime').value),
                pickupInterval: parseInt(document.getElementById('pickupInterval').value),
                serviceFee: parseFloat(document.getElementById('serviceFee').value)
            },
            
            paymentSettings: {
                method: document.getElementById('paymentMethod').value
            },
            
            monetization: {
                setupFee: parseFloat(document.getElementById('setupFee').value),
                monthlyFee: parseFloat(document.getElementById('monthlyFee').value)
            }
        };
    }

    validateForm(configData) {
        const errors = [];
        
        if (!configData.name) {
            errors.push('Restaurant name is required');
        }
        
        if (!configData.address) {
            errors.push('Address is required');
        }
        
        if (!configData.phone) {
            errors.push('Phone number is required');
        }
        
        if (!configData.email) {
            errors.push('Email is required');
        } else if (!this.isValidEmail(configData.email)) {
            errors.push('Please enter a valid email address');
        }
        
        if (configData.orderSettings.prepTime < 15) {
            errors.push('Preparation time must be at least 15 minutes');
        }
        
        if (configData.orderSettings.pickupInterval < 5) {
            errors.push('Pickup interval must be at least 5 minutes');
        }
        
        if (configData.orderSettings.serviceFee < 0 || configData.orderSettings.serviceFee > 20) {
            errors.push('Service fee must be between 0% and 20%');
        }
        
        return errors;
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    async saveConfig() {
        const configData = this.gatherFormData();
        const errors = this.validateForm(configData);
        
        if (errors.length > 0) {
            this.showStatus('Please fix the following errors:<br>' + errors.join('<br>'), 'error');
            return;
        }

        try {
            this.showStatus('Saving configuration...', 'info');
            
            const response = await fetch(PROXY_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    path: 'config',
                    action: 'save',
                    data: configData
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.showStatus('Configuration saved successfully!', 'success');
                
                // Update the Telegram bot's information
                this.updateBotWithNewConfig(configData);
            } else {
                this.showStatus('Error saving configuration: ' + result.error, 'error');
            }
        } catch (error) {
            console.error('Error saving configuration:', error);
            this.showStatus('Error saving configuration. Please try again.', 'error');
        }
    }

    updateBotWithNewConfig(configData) {
        // This would typically trigger a refresh of the bot's cached configuration
        // For now, we'll just log it
        console.log('Bot configuration updated:', configData);
        
        // You could add additional logic here to:
        // - Refresh the bot's webhook
        // - Update cached values
        // - Notify restaurant owners
    }

    showStatus(message, type) {
        const statusElement = document.getElementById('statusMessage');
        statusElement.innerHTML = message;
        statusElement.className = `status-message status-${type}`;
        statusElement.style.display = 'block';
        
        // Auto-hide success messages after 5 seconds
        if (type === 'success') {
            setTimeout(() => {
                statusElement.style.display = 'none';
            }, 5000);
        }
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    new RestaurantSetup();
});
