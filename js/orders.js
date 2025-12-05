const activeOrdersList = document.getElementById('active-orders-list');
const completedOrdersList = document.getElementById('completed-orders-list');
const totalCompletedOrdersElement = document.getElementById('total-completed-orders');
const totalProfitElement = document.getElementById('total-profit');

// Modal Elements
const detailsModal = document.getElementById('order-modal');
const statusModal = document.getElementById('status-modal');
const closeDetailsModal = document.getElementById('close-details-modal');
const closeStatusModal = document.getElementById('close-status-modal');

let currentStatusOrderId = null;

// Event Listeners
if (closeDetailsModal) {
    closeDetailsModal.onclick = function() {
        detailsModal.style.display = "none";
    }
}

if (closeStatusModal) {
    closeStatusModal.onclick = function() {
        statusModal.style.display = "none";
    }
}

async function fetchOrders() {
    if (showMode) {
        console.log('Show Mode: Displaying mock data');
        displayOrders(mockOrders);
        return;
    }

    try {
        // Add timestamp to prevent caching
        const response = await authenticatedFetch(SERVER_URL + 'api/v1/orders?t=' + new Date().getTime());
        if (!response) return; // Auth failed

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Server Error (${response.status}): ${errorText}`);
        }

        let orders = await response.json();
        
        // Ensure orders is an array
        if (!Array.isArray(orders)) {
            orders = [orders];
        }
        
        displayOrders(orders);
    } catch (error) {
        console.error('Error fetching orders:', error);
        displayErrorState(error.message || 'Could not connect to the server. Please try again later.');
    }
}

function calculateOrderTotal(order) {
    if (order.TotalAmount !== undefined) return order.TotalAmount;
    
    const items = order.items || order.Items || [];
    if (!Array.isArray(items)) return 0;
    
    return items.reduce((sum, item) => {
        const price = parseFloat(item.price || item.Price || item.DishPrice || 0);
        const quantity = parseInt(item.quantity || item.Quantity || item.aantal || 1);
        return sum + (price * quantity);
    }, 0);
}

function displayOrders(orders) {
    activeOrdersList.innerHTML = '';
    completedOrdersList.innerHTML = '';

    // Calculate completed orders count
    const completedCount = orders.filter(order => order.Status === 'completed').length;
    if (totalCompletedOrdersElement) {
        totalCompletedOrdersElement.textContent = completedCount;
    }

    // Calculate total profit (sum of TotalAmount for Paid orders)
    const totalProfit = orders
        .filter(order => order.Paid)
        .reduce((sum, order) => sum + calculateOrderTotal(order), 0);
    
    if (totalProfitElement) {
        totalProfitElement.textContent = `€${totalProfit.toFixed(2)}`;
    }

    // Update Earnings Chart
    // Pre-calculate totals for the chart
    const ordersWithTotals = orders.map(o => ({
        ...o,
        TotalAmount: calculateOrderTotal(o)
    }));

    if (window.renderEarningsChart) {
        window.renderEarningsChart(ordersWithTotals);
    }

    orders.forEach(order => {
        // Determine progress width based on status
        let progress = '10%';
        const status = (order.Status || '').toLowerCase();
        
        if (status === 'processing') progress = '50%';
        if (status === 'delivering') progress = '80%';
        if (status === 'completed') progress = '100%';

        // Create Order Card
        const card = document.createElement('div');
        card.className = `order-card ${status === 'completed' ? 'completed' : ''}`;
        
        const date = new Date(order.Ordered_at).toLocaleString();
        const total = calculateOrderTotal(order);

        card.innerHTML = `
            <div class="order-header">
                <span>Order #${order.OrderID}</span>
                <span>User #${order.UserID}</span>
                <span>${date}</span>
            </div>
            <div class="order-details">
                <p>Status: <strong>${status.toUpperCase()}</strong> ${order.Paid ? '<span style="color:green; margin-left:10px">PAID</span>' : '<span style="color:red; margin-left:10px">UNPAID</span>'}</p>
                <p>Total: <strong>€${total.toFixed(2)}</strong></p>
            </div>
            ${status !== 'completed' ? `
            <div class="order-actions">
                <div class="progress-container">
                    <div class="progress-bar" style="width: ${progress}"></div>
                </div>
                <button class="btn btn-details" onclick="showOrderDetails('${order.OrderID}')">Details</button>
                <button class="btn btn-process" onclick="openStatusModal('${order.OrderID}')">Update Status</button>
            </div>
            ` : `
            <div class="order-actions">
                 <button class="btn btn-details" onclick="showOrderDetails('${order.OrderID}')">Details</button>
            </div>
            `}
        `;
        
        if (order.Status === 'completed') {
            completedOrdersList.appendChild(card);
        } else {
            activeOrdersList.appendChild(card);
        }
    });
}

async function showOrderDetails(orderId) {
    // Find order in mock data (or fetch from API in real app)
    let order;
    if (showMode) {
        order = mockOrders.find(o => o.OrderID == orderId);
    } else {
        try {
            const response = await authenticatedFetch(SERVER_URL + `api/v1/orders/${orderId}`);
            if (!response) return;
            if (!response.ok) throw new Error('Failed to fetch order');
            order = await response.json();
            if (Array.isArray(order)) order = order[0];
        } catch (error) {
            console.error('Error fetching order details:', error);
            alert('Failed to load order details');
            return;
        }
    }

    if (!order) return;

    document.getElementById('modal-order-id').textContent = `Order #${order.OrderID} Details`;
    const itemsContainer = document.getElementById('modal-order-items');
    itemsContainer.innerHTML = '';

    // Handle case sensitivity (Items vs items)
    const items = order.Items || order.items || [];

    if (items && items.length > 0) {
        items.forEach(item => {
            const name = item.Name || item.name || item.DishName || 'Unknown Item';
            const quantity = parseInt(item.Quantity || item.quantity || item.aantal || 1);
            const ingredients = item.Ingredients || item.ingredients || '';
            const price = parseFloat(item.Price || item.price || item.DishPrice || 0);

            const itemDiv = document.createElement('div');
            itemDiv.className = 'modal-item';
            itemDiv.innerHTML = `
                <div>
                    <strong>${name}</strong> x${quantity}
                    <br><small style="color: #7f8c8d;">${ingredients}</small>
                </div>
                <span>€${(price * quantity).toFixed(2)}</span>
            `;
            itemsContainer.appendChild(itemDiv);
        });
    } else {
        itemsContainer.innerHTML = '<p>No items found for this order.</p>';
    }

    const total = calculateOrderTotal(order);
    document.getElementById('modal-total-price').textContent = `€${parseFloat(total).toFixed(2)}`;
    detailsModal.style.display = "block";
}

function openStatusModal(orderId) {
    currentStatusOrderId = orderId;
    document.getElementById('status-order-id').textContent = orderId;
    statusModal.style.display = "block";
}

function updateOrderStatus(newStatus) {
    if (!currentStatusOrderId) return;

    console.log(`Updating order ${currentStatusOrderId} to ${newStatus}`);
    
    if (showMode) {
        const order = mockOrders.find(o => o.OrderID == currentStatusOrderId);
        if (order) {
            order.Status = newStatus;
            fetchOrders(); // Re-render
        }
    } else {
        authenticatedFetch(SERVER_URL + `api/v1/orders/${currentStatusOrderId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ Status: newStatus })
        })
        .then(async response => {
            if (!response) return;
            
            if (response.ok) {
                console.log('Status updated successfully');
                fetchOrders(); // Refresh the list
            } else {
                const errorText = await response.text();
                console.error('Failed to update status:', response.status, errorText);
                alert(`Failed to update order status: ${response.status} ${response.statusText}\n${errorText}`);
            }
        })
        .catch(error => {
            console.error('Error updating status:', error);
            alert('Error updating status: ' + error.message);
        });
    }
    
    statusModal.style.display = "none";
}

// Make functions globally available
window.showOrderDetails = showOrderDetails;
window.openStatusModal = openStatusModal;
window.updateOrderStatus = updateOrderStatus;
