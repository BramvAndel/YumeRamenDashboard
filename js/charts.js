let earningsChartInstance = null;

function renderEarningsChart(orders = []) {
    const ctx = document.getElementById('earningsChart').getContext('2d');
    
    // Calculate last 6 months
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const today = new Date();
    const last6Months = [];

    for (let i = 5; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        last6Months.push({
            month: d.getMonth(),
            year: d.getFullYear(),
            label: monthNames[d.getMonth()],
            total: 0
        });
    }

    // Aggregate data
    orders.forEach(order => {
        if (order.Paid) {
            const d = new Date(order.Ordered_at);
            const orderMonth = d.getMonth();
            const orderYear = d.getFullYear();

            const monthData = last6Months.find(m => m.month === orderMonth && m.year === orderYear);
            if (monthData) {
                monthData.total += (order.TotalAmount || 0);
            }
        }
    });

    const labels = last6Months.map(m => m.label);
    const data = last6Months.map(m => m.total);

    // Destroy existing chart if it exists
    if (earningsChartInstance) {
        earningsChartInstance.destroy();
    }

    earningsChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Earnings (€)',
                data: data,
                backgroundColor: '#3498db',
                borderColor: '#2980b9',
                borderWidth: 1,
                borderRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                label += new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR' }).format(context.parsed.y);
                            }
                            return label;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: '#f0f0f0'
                    },
                    ticks: {
                        callback: function(value, index, values) {
                            return '€' + value;
                        }
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

// Make globally available
window.renderEarningsChart = renderEarningsChart;
