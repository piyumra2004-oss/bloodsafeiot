// ============================================================
// BLOODSAFE IoT - FIXED VERSION
// ============================================================

let updateInterval = null;

// ============================================================
// PAGE LOAD
// ============================================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔄 Page loaded');
    
    // Check login
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
        window.location.href = 'login.html';
        return;
    }
    
    const userDisplay = document.getElementById('userDisplay');
    if (userDisplay) {
        userDisplay.textContent = '👤 ' + user.username;
    }
    console.log('👤 User:', user.username);
    
    // Load data
    refreshData();
    
    // Auto-refresh every 5 seconds
    updateInterval = setInterval(refreshData, 5000);
});

// ============================================================
// FETCH DATA FROM SUPABASE
// ============================================================
async function refreshData() {
    try {
        console.log('📡 Fetching data from Supabase...');
        
        const { data, error } = await sb
            .from('sensors')
            .select('*')
            .order('id', { ascending: false })
            .limit(1);
        
        if (error) {
            console.error('❌ Supabase error:', error);
            return;
        }
        
        console.log('📊 Data received:', data);
        
        if (data && data.length > 0) {
            const latest = data[0];
            console.log('✅ Latest record:', latest);
            
            const dashboardData = {
                temperature: latest.temperature || 0,
                stock: latest.blood_stock || 0,
                expiry: latest.expiry_count || 0,
                status: latest.status || 'NORMAL',
                door: latest.door || 'Closed',
                lastUpdated: latest.updated_at || new Date().toISOString()
            };
            
            // UPDATE ONLY THE PAGE WE'RE ON
            updateCurrentPage(dashboardData);
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

// ============================================================
// UPDATE ONLY THE CURRENT PAGE
// ============================================================
function updateCurrentPage(data) {
    // Check which page we're on by looking for unique elements
    
    // DASHBOARD PAGE - has tempDisplay
    if (document.getElementById('tempDisplay')) {
        console.log('🖥️ Updating dashboard...');
        updateDashboard(data);
    }
    
    // INVENTORY PAGE - has inventoryBody
    if (document.getElementById('inventoryBody')) {
        console.log('📋 Updating inventory page...');
        updateInventoryPage(data);
    }
    
    // ALERTS PAGE - has alertList
    if (document.getElementById('alertList')) {
        console.log('🔔 Updating alerts page...');
        updateAlertsPage(data);
    }
}

// ============================================================
// UPDATE DASHBOARD
// ============================================================
function updateDashboard(data) {
    // Temperature
    const tempDisplay = document.getElementById('tempDisplay');
    if (tempDisplay) tempDisplay.textContent = data.temperature + '°C';
    
    const tempStatus = document.getElementById('tempStatus');
    if (tempStatus) {
        if (data.temperature > 8) {
            tempStatus.textContent = '🚨 CRITICAL';
            tempStatus.className = 'stat-status critical';
        } else if (data.temperature < 2) {
            tempStatus.textContent = '⚠ LOW';
            tempStatus.className = 'stat-status warning';
        } else {
            tempStatus.textContent = '✅ Normal';
            tempStatus.className = 'stat-status normal';
        }
    }
    
    // Stock
    const stockDisplay = document.getElementById('stockDisplay');
    if (stockDisplay) stockDisplay.textContent = data.stock;
    
    const stockStatus = document.getElementById('stockStatus');
    if (stockStatus) {
        if (data.stock < 15) {
            stockStatus.textContent = '🚨 CRITICAL';
            stockStatus.className = 'stat-status critical';
        } else if (data.stock < 30) {
            stockStatus.textContent = '⚠ LOW';
            stockStatus.className = 'stat-status warning';
        } else {
            stockStatus.textContent = '✅ Sufficient';
            stockStatus.className = 'stat-status normal';
        }
    }
    
    // Expiry
    const expiryDisplay = document.getElementById('expiryDisplay');
    if (expiryDisplay) expiryDisplay.textContent = data.expiry;
    
    // System Status
    const systemStatus = document.getElementById('systemStatus');
    if (systemStatus) {
        systemStatus.textContent = data.status;
        systemStatus.className = data.status.toLowerCase();
    }
    
    // Last Update
    const lastUpdate = document.getElementById('lastUpdate');
    if (lastUpdate) {
        lastUpdate.textContent = data.lastUpdated ? new Date(data.lastUpdated).toLocaleTimeString() : '--';
    }
    
    // Alert Banner
    const banner = document.getElementById('alertBanner');
    if (banner) {
        if (data.status === 'CRITICAL' || data.temperature > 8) {
            banner.className = 'alert-banner critical';
            banner.textContent = '🚨 CRITICAL: Temperature ' + data.temperature + '°C - Immediate Action!';
        } else if (data.status === 'WARNING' || data.stock < 30) {
            banner.className = 'alert-banner warning';
            banner.textContent = '⚠ WARNING: Low Stock (' + data.stock + ' units)';
        } else {
            banner.className = 'alert-banner normal';
            banner.textContent = '✅ ALL SYSTEMS NORMAL - Blood Bank Operating Safely';
        }
    }
    
    // Blood Grid
    const inventory = calculateInventory(data.stock);
    updateBloodGrid(inventory);
    
    console.log('✅ Dashboard updated!');
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
    console.log('📋 Updating inventory page...');
    
    const totalUnits = document.getElementById('totalUnits');
    if (totalUnits) {
        totalUnits.textContent = data.stock || 0;
    }
    
    const lowStockCount = document.getElementById('lowStockCount');
    if (lowStockCount) {
        let count = 0;
        if (data.stock < 30) count++;
        if (data.stock < 15) count++;
        lowStockCount.textContent = count;
    }
    
    const tbody = document.getElementById('inventoryBody');
    if (!tbody) return;
    
    const inventory = calculateInventory(data.stock || 0);
    tbody.innerHTML = '';
    
    for (const [group, info] of Object.entries(inventory)) {
        const row = document.createElement('tr');
        const badgeClass = info.status === 'OK' ? 'OK' : (info.status === 'LOW' ? 'LOW' : 'CRITICAL');
        row.innerHTML = `
            <td><strong>${group}</strong></td>
            <td>${info.quantity}</td>
            <td><span class="status-badge ${badgeClass}">${info.status}</span></td>
        `;
        tbody.appendChild(row);
    }
    
    console.log('✅ Inventory updated with', Object.keys(inventory).length, 'blood types');
}

// ============================================================
// ALERTS PAGE
// ============================================================
function updateAlertsPage(data) {
    const alertList = document.getElementById('alertList');
    if (!alertList) return;
    
    const time = new Date().toLocaleTimeString();
    const alerts = [];
    
    if (data.status === 'CRITICAL' || data.temperature > 8) {
        alerts.push({ type: 'CRITICAL', message: 'Temperature Alert: ' + data.temperature + '°C', time: time });
    }
    if (data.stock < 15) {
        alerts.push({ type: 'CRITICAL', message: 'Stock Critically Low: ' + data.stock + ' units', time: time });
    }
    if (data.stock < 30 && data.stock >= 15) {
        alerts.push({ type: 'WARNING', message: 'Stock Low: ' + data.stock + ' units', time: time });
    }
    if (data.door === 'Open') {
        alerts.push({ type: 'WARNING', message: 'Door is Open!', time: time });
    }
    if (data.expiry > 10) {
        alerts.push({ type: 'WARNING', message: data.expiry + ' bags near expiry', time: time });
    }
    if (alerts.length === 0) {
        alerts.push({ type: 'INFO', message: 'All systems normal', time: time });
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
        item.style.display = filter === 'ALL' || item.dataset.type === filter ? 'flex' : 'none';
    });
}

// ============================================================
// STOCK MANAGEMENT
// ============================================================
async function updateStock(change) {
    try {
        const { data, error } = await sb
            .from('sensors')
            .select('blood_stock')
            .order('id', { ascending: false })
            .limit(1);
        
        if (error) throw error;
        
        const currentStock = data && data.length > 0 ? data[0].blood_stock : 85;
        const newStock = Math.max(0, Math.min(150, currentStock + change));
        
        await sb
            .from('sensors')
            .update({ blood_stock: newStock })
            .eq('id', 1);
        
        console.log('✅ Stock updated to:', newStock);
        refreshData();
        
    } catch (error) {
        console.error('❌ Error:', error);
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
