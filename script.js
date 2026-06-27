// ============================================================
// BLOODSAFE IoT - SUPABASE VERSION
// ============================================================

let updateInterval = null;
let currentUser = null;

// ============================================================
// PAGE LOAD
// ============================================================
document.addEventListener('DOMContentLoaded', function() {
    // Check login
    currentUser = JSON.parse(localStorage.getItem('user'));
    if (!currentUser) {
        window.location.href = 'login.html';
        return;
    }
    
    document.getElementById('userDisplay').textContent = '👤 ' + currentUser.username;
    
    // Check role
    if (currentUser.role === 'MANAGER') {
        document.querySelectorAll('.manager-only').forEach(el => {
            el.style.display = 'inline-block';
        });
    }
    
    // Load data
    refreshData();
    
    // Auto-refresh every 5 seconds
    updateInterval = setInterval(refreshData, 5000);
});

// ============================================================
// READ FROM SUPABASE
// ============================================================
async function refreshData() {
    try {
        console.log('📡 Reading from Supabase...');
        
        // Read from sensors table
        const { data, error } = await supabase
            .from('sensors')
            .select('*')
            .order('id', { ascending: false })
            .limit(1);
        
        if (error) {
            console.error('❌ Supabase Error:', error);
            return;
        }
        
        if (data && data.length > 0) {
            const latest = data[0];
            console.log('📊 Data:', latest);
            
            // Map data
            const dashboardData = {
                temperature: latest.temperature || 0,
                stock: latest.blood_stock || 0,
                expiry: latest.expiry_count || 0,
                status: latest.status || 'NORMAL',
                door: latest.door || 'Closed',
                lastUpdated: latest.updated_at || new Date().toISOString()
            };
            
            updateDashboard(dashboardData);
            
            if (document.getElementById('inventoryBody')) {
                updateInventoryPage(dashboardData);
            }
            if (document.getElementById('alertList')) {
                updateAlertsPage(dashboardData);
            }
        }
        
    } catch (error) {
        console.error('❌ Network Error:', error);
    }
}

// ============================================================
// UPDATE DASHBOARD
// ============================================================
function updateDashboard(data) {
    // Temperature
    const temp = data.temperature;
    document.getElementById('tempDisplay').textContent = temp + '°C';
    const tempStatus = document.getElementById('tempStatus');
    if (temp > 8) {
        tempStatus.textContent = '🚨 CRITICAL';
        tempStatus.className = 'stat-status critical';
    } else if (temp < 2) {
        tempStatus.textContent = '⚠ LOW';
        tempStatus.className = 'stat-status warning';
    } else {
        tempStatus.textContent = '✅ Normal';
        tempStatus.className = 'stat-status normal';
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
    updateAlertBanner(status, data.temperature, data.stock, data.door);
    
    // Inventory Grid
    if (data.stock > 0) {
        const inventory = calculateInventory(data.stock);
        updateBloodGrid(inventory);
    }
}

// ============================================================
// CALCULATE INVENTORY
// ============================================================
function calculateInventory(totalStock) {
    const percentages = {
        'A+': 0.24, 'A-': 0.12, 'B+': 0.18, 'B-': 0.09,
        'O+': 0.21, 'O-': 0.07, 'AB+': 0.06, 'AB-': 0.03
    };
    
    const inventory = {};
    for (const [group, pct] of Object.entries(percentages)) {
        const qty = Math.round(totalStock * pct);
        const status = qty < 3 ? 'CRITICAL' : (qty < 8 ? 'LOW' : 'OK');
        inventory[group] = { quantity: qty, status: status };
    }
    return inventory;
}

// ============================================================
// UPDATE ALERT BANNER
// ============================================================
function updateAlertBanner(status, temp, stock, door) {
    const banner = document.getElementById('alertBanner');
    if (!banner) return;
    
    if (status === 'CRITICAL' || temp > 8) {
        banner.className = 'alert-banner critical';
        banner.textContent = '🚨 CRITICAL: Temperature ' + temp + '°C - Immediate Action!';
    } else if (status === 'WARNING' || stock < 30) {
        banner.className = 'alert-banner warning';
        banner.textContent = '⚠ WARNING: Low Stock (' + stock + ' units) - Restock Recommended';
    } else if (door === 'Open') {
        banner.className = 'alert-banner warning';
        banner.textContent = '⚠ WARNING: Door is Open - Close Immediately!';
    } else {
        banner.className = 'alert-banner normal';
        banner.textContent = '✅ ALL SYSTEMS NORMAL - Blood Bank Operating Safely';
    }
}

// ============================================================
// UPDATE BLOOD GRID
// ============================================================
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
    const totalUnits = document.getElementById('totalUnits');
    if (totalUnits) {
        totalUnits.textContent = data.stock || 0;
    }
    
    const stock = data.stock || 0;
    let lowCount = 0;
    if (stock < 30) lowCount++;
    if (stock < 15) lowCount++;
    if (data.expiry > 10) lowCount++;
    
    const lowStockCount = document.getElementById('lowStockCount');
    if (lowStockCount) {
        lowStockCount.textContent = lowCount;
    }
    
    const inventory = calculateInventory(stock);
    const tbody = document.getElementById('inventoryBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
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
    const alertList = document.getElementById('alertList');
    if (!alertList) return;
    
    const temp = data.temperature || 0;
    const stock = data.stock || 0;
    const status = data.status || 'NORMAL';
    const door = data.door || 'Closed';
    const time = new Date().toLocaleTimeString();
    
    const alerts = [];
    
    if (status === 'CRITICAL' || temp > 8) {
        alerts.push({ type: 'CRITICAL', message: 'Temperature Alert: ' + temp + '°C - Immediate action required!', time: time });
    }
    if (stock < 15) {
        alerts.push({ type: 'CRITICAL', message: 'Low Stock Alert: ' + stock + ' units remaining', time: time });
    }
    if (stock < 30 && stock >= 15) {
        alerts.push({ type: 'WARNING', message: 'Stock Warning: ' + stock + ' units', time: time });
    }
    if (door === 'Open') {
        alerts.push({ type: 'WARNING', message: 'Door Open Alert: Refrigerator door is open', time: time });
    }
    if (data.expiry > 10) {
        alerts.push({ type: 'WARNING', message: 'Expiry Warning: ' + data.expiry + ' bags near expiry', time: time });
    }
    if (status === 'NORMAL' && temp <= 6 && stock >= 30) {
        alerts.push({ type: 'INFO', message: 'System running normally', time: time });
    }
    
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
            item.style.display = item.dataset.type === filter ? 'flex' : 'none';
        }
    });
}

// ============================================================
// STOCK MANAGEMENT
// ============================================================
async function updateStock(change) {
    try {
        const { data, error } = await supabase
            .from('sensors')
            .select('blood_stock')
            .order('id', { ascending: false })
            .limit(1);
        
        if (error) throw error;
        
        const currentStock = data && data.length > 0 ? data[0].blood_stock : 85;
        const newStock = Math.max(0, Math.min(150, currentStock + change));
        
        const { error: updateError } = await supabase
            .from('sensors')
            .update({ blood_stock: newStock })
            .eq('id', 1);
        
        if (updateError) throw updateError;
        
        console.log('✅ Stock updated to:', newStock);
        refreshData();
        
    } catch (error) {
        console.error('❌ Error updating stock:', error);
    }
}

// ============================================================
// LOGOUT
// ============================================================
function logout() {
    localStorage.removeItem('user');
    clearInterval(updateInterval);
    window.location.href = 'login.html';
}
