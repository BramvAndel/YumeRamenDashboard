// Initial load
fetchOrders();
fetchMeals();

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
