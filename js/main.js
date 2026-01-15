// Initial load
document.addEventListener('DOMContentLoaded', () => {
    // Restore active tab
    const activeTab = getCookie('activeTab');
    if (activeTab) {
        showTab(activeTab);
    } else {
        // Default to dashboard if no tab saved
        showTab('dashboard');
    }

    fetchOrders();
    fetchMeals();
    
    // Auto-refresh orders every 5 seconds
    setInterval(() => {
        fetchOrders();
    }, 5000);
});

// Global Event Listeners
window.onclick = function(event) {
    const detailsModal = document.getElementById('order-modal');
    const statusModal = document.getElementById('status-modal');
    const mealModal = document.getElementById('meal-modal');

    if (event.target == detailsModal) {
        detailsModal.style.display = "none";
    }
    if (event.target == statusModal) {
        statusModal.style.display = "none";
    }
    if (event.target == mealModal) {
        mealModal.style.display = "none";
    }
}