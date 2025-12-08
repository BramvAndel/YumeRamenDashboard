const activeOrdersList = document.getElementById("active-orders-list");
const completedOrdersList = document.getElementById("completed-orders-list");
const totalCompletedOrdersElement = document.getElementById(
  "total-completed-orders"
);
const totalProfitElement = document.getElementById("total-profit");

// Modal Elements
const detailsModal = document.getElementById("order-modal");
const statusModal = document.getElementById("status-modal");
const closeDetailsModal = document.getElementById("close-details-modal");
const closeStatusModal = document.getElementById("close-status-modal");

let currentStatusOrderId = null;
let currentOrders = [];
let currentUserMap = {};

// Event Listeners
if (closeDetailsModal) {
  closeDetailsModal.onclick = function () {
    detailsModal.style.display = "none";
  };
}

if (closeStatusModal) {
  closeStatusModal.onclick = function () {
    statusModal.style.display = "none";
  };
}

async function fetchOrders() {
  if (showMode) {
    console.log("Show Mode: Displaying mock data");
    currentOrders = mockOrders;
    renderCurrentOrders();
    return;
  }

  try {
    // Add timestamp to prevent caching
    const response = await authenticatedFetch(
      SERVER_URL + "api/v1/orders?t=" + new Date().getTime()
    );
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

    currentOrders = orders;

    // Fetch Users to map IDs to Names
    try {
      const userResponse = await authenticatedFetch(
        SERVER_URL + "api/v1/users"
      );
      if (userResponse && userResponse.ok) {
        const users = await userResponse.json();
        if (Array.isArray(users)) {
          users.forEach((u) => {
            // Handle potential casing differences in User ID
            const uid = u.userID || u.UserID || u.id;
            if (uid) {
              const firstName = u.username || u.Username || "";
              const lastName = u.last_name || u.Last_name || "";
              currentUserMap[uid] =
                `${firstName} ${lastName}`.trim() || "Unknown";
            }
          });
        }
      }
    } catch (userError) {
      console.warn("Failed to fetch users for name mapping:", userError);
    }

    renderCurrentOrders();
  } catch (error) {
    console.error("Error fetching orders:", error);
    displayErrorState(
      error.message ||
        "Could not connect to the server. Please try again later."
    );
  }
}

function calculateOrderTotal(order) {
  if (order.TotalAmount !== undefined) return order.TotalAmount;

  const items = order.items || order.Items || [];
  if (!Array.isArray(items)) return 0;

  return items.reduce((sum, item) => {
    const price = parseFloat(item.price || item.Price || item.DishPrice || 0);
    const quantity = parseInt(
      item.quantity || item.Quantity || item.aantal || 1
    );
    return sum + price * quantity;
  }, 0);
}

function renderCurrentOrders() {
  const orders = currentOrders;
  activeOrdersList.innerHTML = "";
  completedOrdersList.innerHTML = "";

  // --- Global Stats (Based on ALL orders) ---

  // Update Badge
  const activeCount = orders.filter(
    (order) =>
      (order.Status || order.status || "ordered").toLowerCase() !== "completed"
  ).length;
  const badge = document.getElementById("active-orders-badge");
  if (badge) {
    badge.textContent = activeCount;
    badge.style.display = activeCount > 0 ? "flex" : "none";
  }

  // Calculate completed orders count
  const totalCompletedCount = orders.filter(
    (order) =>
      (order.Status || order.status || "").toLowerCase() === "completed"
  ).length;
  if (totalCompletedOrdersElement) {
    totalCompletedOrdersElement.textContent = totalCompletedCount;
  }

  // Calculate total profit (sum of TotalAmount for Paid orders)
  const totalProfit = orders
    .filter((order) => order.Paid)
    .reduce((sum, order) => sum + calculateOrderTotal(order), 0);

  if (totalProfitElement) {
    totalProfitElement.textContent = `€${totalProfit.toFixed(2)}`;
  }

  // Update Earnings Chart
  const ordersWithTotals = orders.map((o) => ({
    ...o,
    TotalAmount: calculateOrderTotal(o),
  }));

  if (window.renderEarningsChart) {
    window.renderEarningsChart(ordersWithTotals);
  }

  // --- Filtering & Sorting ---

  // 1. Get Filter Values
  const activeSort = document.getElementById("active-sort")
    ? document.getElementById("active-sort").value
    : "date-desc";
  const activeStatus = document.getElementById("active-filter-status")
    ? document.getElementById("active-filter-status").value
    : "all";
  const activePaid = document.getElementById("active-filter-paid")
    ? document.getElementById("active-filter-paid").value
    : "all";
  const activeId = document.getElementById("active-filter-id")
    ? document.getElementById("active-filter-id").value.trim()
    : "";

  const completedSort = document.getElementById("completed-sort")
    ? document.getElementById("completed-sort").value
    : "date-desc";
  const completedPaid = document.getElementById("completed-filter-paid")
    ? document.getElementById("completed-filter-paid").value
    : "all";
  const completedId = document.getElementById("completed-filter-id")
    ? document.getElementById("completed-filter-id").value.trim()
    : "";

  // 2. Split Orders
  let activeOrders = orders.filter(
    (o) => (o.Status || o.status || "ordered").toLowerCase() !== "completed"
  );
  let completedOrders = orders.filter(
    (o) => (o.Status || o.status || "ordered").toLowerCase() === "completed"
  );

  // 3. Filter Active Orders
  if (activeId) {
    activeOrders = activeOrders.filter((o) =>
      o.OrderID.toString().includes(activeId)
    );
  }
  if (activeStatus !== "all") {
    activeOrders = activeOrders.filter(
      (o) => (o.Status || o.status || "ordered").toLowerCase() === activeStatus
    );
  }
  if (activePaid !== "all") {
    const isPaid = activePaid === "paid";
    // Use Boolean() to handle 1/0 or true/false
    activeOrders = activeOrders.filter((o) => Boolean(o.Paid) === isPaid);
  }

  // 4. Filter Completed Orders
  if (completedId) {
    completedOrders = completedOrders.filter((o) =>
      o.OrderID.toString().includes(completedId)
    );
  }
  if (completedPaid !== "all") {
    const isPaid = completedPaid === "paid";
    // Use Boolean() to handle 1/0 or true/false
    completedOrders = completedOrders.filter((o) => Boolean(o.Paid) === isPaid);
  }

  // 5. Sort Helper
  const sortOrders = (list, sortValue) => {
    return list.sort((a, b) => {
      if (sortValue === "date-desc")
        return new Date(b.Ordered_at || 0) - new Date(a.Ordered_at || 0);
      if (sortValue === "date-asc")
        return new Date(a.Ordered_at || 0) - new Date(b.Ordered_at || 0);
      if (sortValue === "id-desc") return b.OrderID - a.OrderID;
      if (sortValue === "id-asc") return a.OrderID - b.OrderID;
      if (sortValue === "price-desc")
        return calculateOrderTotal(b) - calculateOrderTotal(a);
      if (sortValue === "price-asc")
        return calculateOrderTotal(a) - calculateOrderTotal(b);
      return 0;
    });
  };

  // 6. Apply Sort
  activeOrders = sortOrders(activeOrders, activeSort);
  completedOrders = sortOrders(completedOrders, completedSort);

  // --- Rendering ---

  const renderCard = (order, container) => {
    // Defaults for missing fields
    const statusRaw = order.Status || order.status || "ordered";
    const status = statusRaw.toLowerCase();
    const isPaid = order.Paid !== undefined ? order.Paid : false;
    const date = order.Ordered_at
      ? new Date(order.Ordered_at).toLocaleString()
      : "Date Unknown";

    // Resolve Username
    const userName = currentUserMap[order.UserID] || `User #${order.UserID}`;
    const address = order.delivery_address || "No address provided";

    // Determine progress width based on status
    let progress = "10%";
    if (status === "processing") progress = "50%";
    if (status === "delivering") progress = "80%";
    if (status === "completed") progress = "100%";

    // Create Order Card
    const card = document.createElement("div");
    card.className = `order-card ${status === "completed" ? "completed" : ""}`;

    const total = calculateOrderTotal(order);

    card.innerHTML = `
            <div class="order-header">
                <span>Order #${order.OrderID}</span>
                <span>${userName}</span>
                <span>${date}</span>
            </div>
            <div class="order-details">
                <p>Status: <strong>${status.toUpperCase()}</strong> ${
      isPaid
        ? '<span style="color:green; margin-left:10px">PAID</span>'
        : '<span style="color:red; margin-left:10px">UNPAID</span>'
    }</p>
                <p><i class="fas fa-map-marker-alt"></i> ${address}</p>
                <p>Total: <strong>€${total.toFixed(2)}</strong></p>
            </div>
            ${
              status !== "completed"
                ? `
            <div class="order-actions">
                <div class="progress-container">
                    <div class="progress-bar" style="width: ${progress}"></div>
                </div>
                <button class="btn btn-details" onclick="showOrderDetails('${order.OrderID}')">Details</button>
                <button class="btn btn-process" onclick="openStatusModal('${order.OrderID}')">Update Status</button>
            </div>
            `
                : `
            <div class="order-actions">
                 <button class="btn btn-details" onclick="showOrderDetails('${order.OrderID}')">Details</button>
            </div>
            `
            }
        `;
    container.appendChild(card);
  };

  activeOrders.forEach((order) => renderCard(order, activeOrdersList));
  completedOrders.forEach((order) => renderCard(order, completedOrdersList));
}

async function showOrderDetails(orderId) {
  // Find order in mock data (or fetch from API in real app)
  let order;
  if (showMode) {
    order = mockOrders.find((o) => o.OrderID == orderId);
  } else {
    try {
      const response = await authenticatedFetch(
        SERVER_URL + `api/v1/orders/${orderId}`
      );
      if (!response) return;
      if (!response.ok) throw new Error("Failed to fetch order");
      order = await response.json();
      if (Array.isArray(order)) order = order[0];
    } catch (error) {
      console.error("Error fetching order details:", error);
      alert("Failed to load order details");
      return;
    }
  }

  if (!order) return;

  document.getElementById(
    "modal-order-id"
  ).textContent = `Order #${order.OrderID} Details`;
  const itemsContainer = document.getElementById("modal-order-items");
  itemsContainer.innerHTML = "";

  // Add Order Info Display (User, Date, Address)
  const infoDiv = document.createElement("div");
  infoDiv.className = "modal-info-grid";

  const userName = currentUserMap[order.UserID] || `User #${order.UserID}`;
  const dateOrdered = order.Ordered_at
    ? new Date(order.Ordered_at).toLocaleString()
    : "Date Unknown";
  const dateProcessing = order.processing_at
    ? new Date(order.processing_at).toLocaleString()
    : "-";
  const dateDelivering = order.Delivering_at
    ? new Date(order.Delivering_at).toLocaleString()
    : "-";
  const dateCompleted = order.Completed_at
    ? new Date(order.Completed_at).toLocaleString()
    : "-";

  // Determine status icon
  const statusRaw = (order.Status || "ordered").toLowerCase();
  let statusIcon = "fa-clipboard-check";
  if (statusRaw === "processing") statusIcon = "fa-fire";
  if (statusRaw === "delivering") statusIcon = "fa-shipping-fast";
  if (statusRaw === "completed") statusIcon = "fa-check";

  infoDiv.innerHTML = `
        <div class="modal-info-section">
            <h3><i class="fas fa-user"></i> Customer</h3>
            <p>${userName}</p>
        </div>
        
        <div class="modal-info-section">
            <h3><i class="fas fa-map-marker-alt"></i> Delivery Address</h3>
            <p>${order.delivery_address || "No address provided"}</p>
        </div>

        <div class="modal-info-section full-width">
            <h3><i class="fas fa-history"></i> Order Timeline</h3>
            
            <div class="timeline-visual">
                <div class="timeline-track"></div>
                <div class="timeline-progress" style="width: ${
                  order.Status === "completed"
                    ? "100%"
                    : order.Status === "delivering"
                    ? "66%"
                    : order.Status === "processing"
                    ? "33%"
                    : "0%"
                }">
                    <div class="timeline-icon">
                        <i class="fas ${statusIcon}"></i>
                    </div>
                </div>
                
                <div class="timeline-steps">
                    <!-- Step 1: Ordered -->
                    <div class="timeline-step ${
                      [
                        "ordered",
                        "processing",
                        "delivering",
                        "completed",
                      ].includes(order.Status || "ordered")
                        ? "active"
                        : ""
                    }">
                        <div class="step-dot"></div>
                        <span class="step-label">Ordered</span>
                        <span class="step-time">${dateOrdered}</span>
                    </div>

                    <!-- Step 2: Processing -->
                    <div class="timeline-step ${
                      ["processing", "delivering", "completed"].includes(
                        order.Status
                      )
                        ? "active"
                        : ""
                    }">
                        <div class="step-dot"></div>
                        <span class="step-label">Processing</span>
                        <span class="step-time">${
                          dateProcessing !== "-" ? dateProcessing : ""
                        }</span>
                    </div>

                    <!-- Step 3: Delivering -->
                    <div class="timeline-step ${
                      ["delivering", "completed"].includes(order.Status)
                        ? "active"
                        : ""
                    }">
                        <div class="step-dot"></div>
                        <span class="step-label">Delivering</span>
                        <span class="step-time">${
                          dateDelivering !== "-" ? dateDelivering : ""
                        }</span>
                    </div>

                    <!-- Step 4: Completed -->
                    <div class="timeline-step ${
                      order.Status === "completed" ? "active" : ""
                    }">
                        <div class="step-dot"></div>
                        <span class="step-label">Completed</span>
                        <span class="step-time">${
                          dateCompleted !== "-" ? dateCompleted : ""
                        }</span>
                    </div>
                </div>
            </div>
        </div>
    `;
  itemsContainer.appendChild(infoDiv);

  // Handle case sensitivity (Items vs items)
  const items = order.Items || order.items || [];

  if (items && items.length > 0) {
    items.forEach((item) => {
      const name = item.Name || item.name || item.DishName || "Unknown Item";
      const quantity = parseInt(
        item.Quantity || item.quantity || item.aantal || 1
      );
      const ingredients = item.Ingredients || item.ingredients || "";
      const price = parseFloat(item.Price || item.price || item.DishPrice || 0);

      const itemDiv = document.createElement("div");
      itemDiv.className = "modal-item";
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
    itemsContainer.innerHTML = "<p>No items found for this order.</p>";
  }

  const total = calculateOrderTotal(order);
  document.getElementById("modal-total-price").textContent = `€${parseFloat(
    total
  ).toFixed(2)}`;
  detailsModal.style.display = "block";
}

function openStatusModal(orderId) {
  currentStatusOrderId = orderId;
  document.getElementById("status-order-id").textContent = orderId;
  statusModal.style.display = "block";
}

function updateOrderStatus(newStatus) {
  if (!currentStatusOrderId) return;

  if (showMode) {
    const order = mockOrders.find((o) => o.OrderID == currentStatusOrderId);
    if (order) {
      order.Status = newStatus;
      fetchOrders(); // Re-render
    }
  } else {
    // Find the current order to preserve other fields like 'Paid'
    const order = currentOrders.find((o) => o.OrderID == currentStatusOrderId);
    const paidStatus = order ? order.Paid : false; // Default to false if not found, though it should be found

    // Create local timestamp in format YYYY-MM-DD HH:mm:ss
    const now = new Date();
    const offsetMs = now.getTimezoneOffset() * 60 * 1000;
    const localTimestamp = new Date(now.getTime() - offsetMs)
      .toISOString()
      .slice(0, 19)
      .replace("T", " ");

    const body = {
      Status: newStatus,
      Paid: paidStatus,
    };

    // Add specific timestamp based on status
    if (newStatus === "processing") {
      body.processing_at = localTimestamp;
    } else if (newStatus === "delivering") {
      body.Delivering_at = localTimestamp;
    } else if (newStatus === "completed") {
      body.Completed_at = localTimestamp;
    }

    authenticatedFetch(SERVER_URL + `api/v1/orders/${currentStatusOrderId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })
      .then(async (response) => {
        if (!response) return;

        if (response.ok) {
          fetchOrders(); // Refresh the list
        } else {
          const errorText = await response.text();
          alert(
            `Failed to update order status: ${response.status} ${response.statusText}\n${errorText}`
          );
        }
      })
      .catch((error) => {
        alert("Error updating status: " + error.message);
      });
  }

  statusModal.style.display = "none";
}

// Make functions globally available
window.showOrderDetails = showOrderDetails;
window.openStatusModal = openStatusModal;
window.updateOrderStatus = updateOrderStatus;
window.renderCurrentOrders = renderCurrentOrders;

// Auto-refresh orders based on config interval
if (typeof REFRESH_INTERVAL !== "undefined" && REFRESH_INTERVAL > 0) {
  setInterval(() => {
    fetchOrders();
  }, REFRESH_INTERVAL);
}
