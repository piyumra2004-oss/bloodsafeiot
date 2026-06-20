// ============================================================
// BLOODSAFE IoT - Main JavaScript
// Replace YOUR_API_URL with your Google Apps Script URL
// ============================================================

// !!! IMPORTANT: Replace this with YOUR Web App URL !!!
const API_URL = 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec';

let updateInterval = null;

// ---------- ON PAGE LOAD ----------
document.addEventListener('DOMContentLoaded', function() {
    // Check login
    var user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
        window.location.href = 'login.html';
        return;
    }
    
    document.getElementById('userDisplay').textContent = '👤 ' + user.username;
    
    // Load data
    refreshData();
    
    // Auto-refresh every 30 seconds
    updateInterval = setInterval(refreshData, 30000);
});

// ---------- FETCH DATA ----------
async function refreshData() {
    try {
        const response = await fetch(API_URL);
        const data = await response.json();
        
        if (data.success) {
            updateDashboard(data);
            
            // Check which page we're on and update accordingly
            if (document.getElementById('inventoryBody')) {
                updateInventoryPage(data);
            }
            if (document.getElementById('alertList')) {
                updateAlertsPage(data);
            }
        } else {
            console.error('API Error:', data.error);
        }
    } catch (error) {
        console.error('Network Error:', error);
    }
}

// ---------- UPDATE DASHBOARD ----------
function updateDashboard(data) {
    // Temperature
    const temp = data.temperature;
    document.getElementById('tempDisplay').textContent = temp + '°C';
    const tempStatus = document.getElementById('tempStatus');
    if (temp > 8) {
        tempStatus.textContent = '🚨 CRITICAL';
        tempStatus.className = 'stat-status critical';
        document.querySelector('.temp-card').classList.add('critical');
    } else if (temp < 2) {
        tempStatus.textContent = '⚠ LOW';
        tempStatus.className = 'stat-status warning';
    } else {
        tempStatus.textContent = '✅ Normal';
        tempStatus.className = 'stat-status normal';
        document.querySelector('.temp-card').classList.remove('critical');
    }
    
    // Stock
    const stock = data.stock;
    document.getElementById('stockDisplay').textContent = stock;
    const stockStatus = document.getElementById('stockStatus');
    if (stock < 15) {
        stockStatus.textContent = '🚨 CRITICAL';
        stockStatus.className = 'stat-status critical';
    } else if (stock < 30) {
        stockStatus.textContent = '⚠ LOW';
        stockStatus.className = 'stat-status warning';
    } else {
        stockStatus.textContent = '✅ Sufficient';
        stockStatus.className = 'stat-status normal';
    }
    
    // Expiry
    document.getElementById('expiryDisplay').textContent = data.expiry || 0;
    
    // System Status
    const status = data.status || 'NORMAL';
    document.getElementById('systemStatus').textContent = status;
    document.getElementById('systemStatus').className = status.toLowerCase();
    
    // Last Update
    document.getElementById('lastUpdate').textContent = 
        data.lastUpdated ? new Date(data.lastUpdated).toLocaleTimeString() : '--';
    
    // Alert Banner
    updateAlertBanner(status, temp, stock);
    
    // Inventory
    if (data.inventory) {
        updateBloodGrid(data.inventory);
    }
}

// ---------- ALERT BANNER ----------
function updateAlertBanner(status, temp, stock) {
    const banner = document.getElementById('alertBanner');
    
    if (status === 'CRITICAL' || temp > 8) {
        banner.className = 'alert-banner critical';
        banner.textContent = '🚨 CRITICAL: Temperature ' + temp + '°C - Immediate Action!';
    } else if (status === 'WARNING' || stock < 30) {
        banner.className = 'alert-banner warning';
        banner.textContent = '⚠ WARNING: Low Stock (' + stock + ' units) - Restock Recommended';
    } else {
        banner.className = 'alert-banner normal';
        banner.textContent = '✅ ALL SYSTEMS NORMAL - Blood Bank Operating Safely';
    }
}

// ---------- BLOOD GRID ----------
function updateBloodGrid(inventory) {
    const grid = document.getElementById('bloodGrid');
    if (!grid) return;
    
    grid.innerHTML = '';
    
    const dotColors = {
        'OK': 'ok',
        'LOW': 'warning',
        'CRITICAL': 'critical'
    };
    
    for (const [group, data] of Object.entries(inventory)) {
        const item = document.createElement('div');
        item.className = 'blood-item';
        item.innerHTML = `
            <span class="blood-type">${group}</span>
            <span>${data.quantity} units</span>
            <span class="dot ${dotColors[data.status] || 'ok'}"></span>
        `;
        grid.appendChild(item);
    }
}

// ---------- INVENTORY PAGE ----------
function updateInventoryPage(data) {
    // Update total units
    document.getElementById('totalUnits').textContent = data.stock || 0;
    
    // Count low stock types
    let lowCount = 0;
    let criticalCount = 0;
    
    if (data.inventory) {
        for (const [group, info] of Object.entries(data.inventory)) {
            if (info.status === 'LOW') lowCount++;
            if (info.status === 'CRITICAL') criticalCount++;
        }
    }
    
    document.getElementById('lowStockCount').textContent = lowCount + criticalCount;
    
    // Update inventory table
    updateInventoryTable(data.inventory);
}

function updateInventoryTable(inventory) {
    const tbody = document.getElementById('inventoryBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (!inventory) {
        tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;color:#888;">No data available</td></tr>';
        return;
    }
    
    for (const [group, info] of Object.entries(inventory)) {
        const row = document.createElement('tr');
        
        let badgeClass = 'OK';
        if (info.status === 'LOW') badgeClass = 'LOW';
        if (info.status === 'CRITICAL') badgeClass = 'CRITICAL';
        
        row.innerHTML = `
            <td><strong>${group}</strong></td>
            <td>${info.quantity}</td>
            <td><span class="status-badge ${badgeClass}">${info.status}</span></td>
        `;
        tbody.appendChild(row);
    }
}

// ---------- ALERTS PAGE ----------
function updateAlertsPage(data) {
    const alertList = document.getElementById('alertList');
    if (!alertList) return;
    
    // Sample alerts for demo
    const alerts = [
        { type: 'INFO', message: 'System initialized successfully', time: '8:28 PM' },
        { type: 'WARNING', message: 'Low stock detected for AB- blood type', time: '8:15 PM' },
        { type: 'CRITICAL', message: 'Temperature alert: 10°C detected', time: '7:45 PM' },
        { type: 'WARNING', message: 'Stock below 30 units', time: '7:30 PM' },
        { type: 'INFO', message: 'Restock completed: +10 units', time: '7:00 PM' }
    ];
    
    alertList.innerHTML = '';
    
    alerts.forEach(alert => {
        const item = document.createElement('div');
        item.className = 'alert-item';
        item.dataset.type = alert.type;
        item.innerHTML = `
            <span class="alert-type ${alert.type}">${alert.type}</span>
            <span class="alert-message">${alert.message}</span>
            <span class="alert-time">${alert.time}</span>
        `;
        alertList.appendChild(item);
    });
}

// ---------- FILTER ALERTS ----------
function filterAlerts(filter) {
    const items = document.querySelectorAll('.alert-item');
    items.forEach(item => {
        if (filter === 'ALL') {
            item.style.display = 'flex';
        } else {
            const type = item.dataset.type;
            item.style.display = type === filter ? 'flex' : 'none';
        }
    });
    
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    if (event && event.target) {
        event.target.classList.add('active');
    }
}

// ---------- UPDATE STOCK ----------
async function updateStock(change) {
    try {
        await fetch(API_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'updateStock',
                change: change
            })
        });
        setTimeout(refreshData, 1000);
    } catch (error) {
        console.error('Error updating stock:', error);
    }
}

// ---------- SIMULATE CRITICAL (Demo) ----------
function simulateCritical() {
    document.getElementById('tempDisplay').textContent = '10°C';
    document.getElementById('tempStatus').textContent = '🚨 CRITICAL';
    document.getElementById('tempStatus').className = 'stat-status critical';
    document.querySelector('.temp-card').classList.add('critical');
    const banner = document.getElementById('alertBanner');
    banner.className = 'alert-banner critical';
    banner.textContent = '🚨 CRITICAL: Temperature 10°C - Immediate Action!';
}

// ---------- LOGOUT ----------
function logout() {
    localStorage.removeItem('user');
    clearInterval(updateInterval);
    window.location.href = 'login.html';
}
