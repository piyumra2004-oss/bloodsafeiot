// ============================================================
// BLOODSAFE IoT - Complete JavaScript
// Suwa Setha Hospital Blood Bank
// ============================================================

// !!! IMPORTANT: Replace this with YOUR Web App URL !!!
const API_URL = 'https://script.google.com/macros/s/AKfycbxrhEDd6YKGXuuM6hnP5H97tpcUV7_z21vTSgNLZf0AVA7Eh-ZBABPMm2qKYgiYtOlo/exec';

let updateInterval = null;

// ============================================================
// PAGE LOAD
// ============================================================
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

// ============================================================
// FETCH DATA FROM API
// ============================================================
// ============================================================
// FETCH DATA FROM API
// ============================================================
async function refreshData() {
    try {
        console.log('📡 Fetching data from API...');
        const response = await fetch(API_URL);
        const data = await response.json();
        
        console.log('📊 Data received:', data);
        
        if (data.success) {
            // ONLY update dashboard if we're on the dashboard page
            if (document.getElementById('tempDisplay')) {
                console.log('🖥️ Updating dashboard...');
                updateDashboard(data);
            }
            
            // ONLY update inventory if we're on inventory page
            if (document.getElementById("inventoryBody")) {
                console.log('📋 Updating inventory page...');
                updateInventoryPage(data);
            }
            
            // ONLY update alerts if we're on alerts page
            if (document.getElementById('alertList')) {
                console.log('🔔 Updating alerts page...');
                updateAlertsPage(data);
            }
        } else {
            console.error('❌ API Error:', data.error);
        }
    } catch (error) {
        console.error('❌ Network Error:', error);
    }
}

// ============================================================
// DASHBOARD
// ============================================================
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
    
    // Inventory Grid
    if (data.inventory) {
        updateBloodGrid(data.inventory);
    }
}

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

function updateBloodGrid(inventory) {
    const grid = document.getElementById('bloodGrid');
    if (!grid) return;
    
    grid.innerHTML = '';
    
    const dotColors = {
        'OK': 'ok',
        'LOW': 'warning',
        'CRITICAL': 'critical'
    };
    
    for (const [group, info] of Object.entries(inventory)) {
        const item = document.createElement('div');
        item.className = 'blood-item';
        item.innerHTML = `
            <span class="blood-type">${group}</span>
            <span>${info.quantity} units</span>
            <span class="dot ${dotColors[info.status] || 'ok'}"></span>
        `;
        grid.appendChild(item);
    }
}

// ============================================================
// INVENTORY PAGE
// ============================================================
function updateInventoryPage(data) {
    console.log('Updating inventory page...', data);
    
    // Update total units
    const totalUnits = document.getElementById('totalUnits');
    if (totalUnits) {
        totalUnits.textContent = data.stock || 0;
    }
    
    // Count low stock types
    let lowCount = 0;
    let criticalCount = 0;
    
    if (data.inventory) {
        for (const [group, info] of Object.entries(data.inventory)) {
            if (info.status === 'LOW') lowCount++;
            if (info.status === 'CRITICAL') criticalCount++;
        }
    }
    
    const lowStockCount = document.getElementById('lowStockCount');
    if (lowStockCount) {
        lowStockCount.textContent = lowCount + criticalCount;
    }
    
    // Update inventory table
    updateInventoryTable(data.inventory);
}

function updateInventoryTable(inventory) {
    const tbody = document.getElementById('inventoryBody');
    if (!tbody) {
        console.log('inventoryBody not found');
        return;
    }
    
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

// ============================================================
// ALERTS PAGE
// ============================================================
function updateAlertsPage(data) {
    console.log('Updating alerts page...', data);
    
    const alertList = document.getElementById('alertList');
    if (!alertList) {
        console.log('alertList not found');
        return;
    }
    
    // Sample alerts
    const now = new Date().toLocaleTimeString();
    const alerts = [
        { type: 'INFO', message: 'System initialized successfully', time: now },
        { type: 'WARNING', message: 'Low stock detected for AB- blood type', time: now },
        { type: 'CRITICAL', message: 'Temperature alert: 10°C detected', time: now },
        { type: 'WARNING', message: 'Stock below 30 units', time: now },
        { type: 'INFO', message: 'Restock completed: +10 units', time: now }
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
    
    // Find and activate the clicked button
    document.querySelectorAll('.filter-btn').forEach(btn => {
        if (btn.textContent.toUpperCase() === filter || 
            btn.textContent === filter) {
            btn.classList.add('active');
        }
    });
}

// ============================================================
// STOCK MANAGEMENT
// ============================================================
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

function simulateCritical() {
    document.getElementById('tempDisplay').textContent = '10°C';
    document.getElementById('tempStatus').textContent = '🚨 CRITICAL';
    document.getElementById('tempStatus').className = 'stat-status critical';
    document.querySelector('.temp-card').classList.add('critical');
    const banner = document.getElementById('alertBanner');
    banner.className = 'alert-banner critical';
    banner.textContent = '🚨 CRITICAL: Temperature 10°C - Immediate Action!';
}

function logout() {
    localStorage.removeItem('user');
    clearInterval(updateInterval);
    window.location.href = 'login.html';
}
