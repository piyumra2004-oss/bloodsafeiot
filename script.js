let updateInterval = null;

// ============================================================
// PAGE LOAD
// ============================================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔄 Page loaded');
    
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
    
    fetchDashboardData();
    updateInterval = setInterval(fetchDashboardData, 30000);
});

// ============================================================
// MAIN FETCH FUNCTION
// ============================================================
async function fetchDashboardData() {
    try {
        console.log('📡 Fetching data from Supabase...');
        
        const { data: sensorData, error: sensorError } = await sb
            .from('sensors')
            .select('*')
            .order('id', { ascending: false })
            .limit(1);
        
        if (sensorError) {
            console.error('❌ Sensor error:', sensorError);
        }
        
        const { data: inventoryData, error: inventoryError } = await sb
            .from('inventory')
            .select('*')
            .order('blood_group');
        
        if (inventoryError) {
            console.error('❌ Inventory error:', inventoryError);
        }
        
        const { data: alertData, error: alertError } = await sb
            .from('alerts')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(10);
        
        if (alertError) {
            console.error('❌ Alert error:', alertError);
        }
        
        const latest = sensorData && sensorData.length > 0 ? sensorData[0] : {};
        
        let totalStock = 0;
        let nearExpiry = 0;
        let lowStockCount = 0;
        let expiryData = [];
        
        if (inventoryData) {
            inventoryData.forEach(item => {
                totalStock += item.quantity || 0;
                if (item.days_until_expiry !== null && item.days_until_expiry <= 7 && item.days_until_expiry >= 0) {
                    nearExpiry++;
                }
                // ✅ Count ALL items below minimum_stock
                if (item.quantity < item.minimum_stock) {
                    lowStockCount++;
                }
            });
            expiryData = inventoryData;
        }
        
        const dashboardData = {
            temperature: latest.temperature || 0,
            humidity: latest.humidity || 0,
            stock: totalStock,
            expiry: nearExpiry,
            status: latest.status || 'NORMAL',
            door: latest.door_status || 'Closed',
            lastUpdated: latest.updated_at || new Date().toISOString(),
            inventory: expiryData,
            alerts: alertData || [],
            lowStockCount: lowStockCount
        };
        
        console.log('📊 Dashboard Data:', dashboardData);
        updateCurrentPage(dashboardData);
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

// ============================================================
// UPDATE CURRENT PAGE
// ============================================================
function updateCurrentPage(data) {
    if (document.getElementById('tempDisplay')) {
        console.log('🖥️ Updating dashboard...');
        updateDashboard(data);
    }
    if (document.getElementById('inventoryBody')) {
        console.log('📋 Updating inventory page...');
        updateInventoryPage(data);
    }
    if (document.getElementById('alertList')) {
        console.log('🔔 Updating alerts page...');
        updateAlertsPage(data);
    }
}

// ============================================================
// UPDATE DASHBOARD
// ============================================================
function updateDashboard(data) {
    console.log('🖥️ Updating dashboard...');
    
    const temp = data.temperature;
    const tempDisplay = document.getElementById('tempDisplay');
    if (tempDisplay) tempDisplay.textContent = temp + '°C';
    
    const tempStatus = document.getElementById('tempStatus');
    if (tempStatus) {
        if (temp > 25) {
            tempStatus.textContent = '🚨 CRITICAL';
            tempStatus.className = 'stat-status critical';
        } else if (temp < 15) {
            tempStatus.textContent = '⚠ LOW';
            tempStatus.className = 'stat-status warning';
        } else {
            tempStatus.textContent = '✅ Normal';
            tempStatus.className = 'stat-status normal';
        }
    }
    
    const humidityDisplay = document.getElementById('humidityDisplay');
    if (humidityDisplay) {
        humidityDisplay.textContent = (data.humidity || 0) + '%';
    }
    
    const humidityStatus = document.getElementById('humidityStatus');
    if (humidityStatus) {
        const humidity = data.humidity || 0;
        if (humidity > 80) {
            humidityStatus.textContent = '🚨 HIGH';
            humidityStatus.className = 'stat-status critical';
        } else if (humidity > 60) {
            humidityStatus.textContent = '⚠ WARNING';
            humidityStatus.className = 'stat-status warning';
        } else if (humidity < 30) {
            humidityStatus.textContent = '⚠ LOW';
            humidityStatus.className = 'stat-status warning';
        } else {
            humidityStatus.textContent = '✅ Normal';
            humidityStatus.className = 'stat-status normal';
        }
    }
    
    const stockDisplay = document.getElementById('stockDisplay');
    if (stockDisplay) stockDisplay.textContent = data.stock;
    
    const stockStatus = document.getElementById('stockStatus');
    if (stockStatus) {
        if (data.lowStockCount > 0) {
            stockStatus.textContent = '⚠ ' + data.lowStockCount + ' low stock items';
            stockStatus.className = 'stat-status warning';
        } else {
            stockStatus.textContent = '✅ Sufficient';
            stockStatus.className = 'stat-status normal';
        }
    }
    
    const expiryDisplay = document.getElementById('expiryDisplay');
    if (expiryDisplay) expiryDisplay.textContent = data.expiry || 0;
    
    const expiryStatus = document.getElementById('expiryStatus');
    if (expiryStatus) {
        const expiry = data.expiry || 0;
        if (expiry > 3) {
            expiryStatus.textContent = '🚨 CRITICAL';
            expiryStatus.className = 'stat-status critical';
        } else if (expiry > 0) {
            expiryStatus.textContent = '⚠ WARNING';
            expiryStatus.className = 'stat-status warning';
        } else {
            expiryStatus.textContent = '✅ No Issues';
            expiryStatus.className = 'stat-status normal';
        }
    }
    
    const doorDisplay = document.getElementById('doorDisplay');
    if (doorDisplay) {
        doorDisplay.textContent = data.door || 'Closed';
    }
    
    const doorStatus = document.getElementById('doorStatus');
    if (doorStatus) {
        const door = data.door || 'Closed';
        if (door === 'Open') {
            doorStatus.textContent = '⚠ OPEN';
            doorStatus.className = 'stat-status critical';
        } else {
            doorStatus.textContent = '✅ Closed';
            doorStatus.className = 'stat-status normal';
        }
    }
    
    const systemStatus = document.getElementById('systemStatus');
    if (systemStatus) {
        systemStatus.textContent = data.status || 'NORMAL';
        systemStatus.className = (data.status || 'normal').toLowerCase();
    }
    
    const lastUpdate = document.getElementById('lastUpdate');
    if (lastUpdate) {
        lastUpdate.textContent = data.lastUpdated ? new Date(data.lastUpdated).toLocaleTimeString() : '--';
    }
    
    const banner = document.getElementById('alertBanner');
    if (banner) {
        if (data.temperature > 25) {
            banner.className = 'alert-banner critical';
            banner.textContent = '🚨 CRITICAL: Temperature ' + data.temperature + '°C';
        } else if (data.temperature < 15) {
            banner.className = 'alert-banner warning';
            banner.textContent = '⚠ WARNING: Temperature ' + data.temperature + '°C (Below safe range)';
        } else if (data.door === 'Open') {
            banner.className = 'alert-banner critical';
            banner.textContent = '🚨 CRITICAL: Door is OPEN!';
        } else if (data.lowStockCount > 0) {
            banner.className = 'alert-banner warning';
            banner.textContent = '⚠ WARNING: ' + data.lowStockCount + ' blood types have LOW STOCK';
        } else if (data.expiry > 3) {
            banner.className = 'alert-banner warning';
            banner.textContent = '⚠ WARNING: ' + data.expiry + ' blood bags near expiry';
        } else {
            banner.className = 'alert-banner normal';
            banner.textContent = '✅ ALL SYSTEMS NORMAL - Blood Bank Operating Safely';
        }
    }
    
    updateBloodGrid(data.inventory);
    updateExpiryTable(data.inventory);
    updateRecentAlerts(data.alerts);
    
    console.log('✅ Dashboard updated!');
}

// ============================================================
// 🩸 BLOOD GRID
// ============================================================
function updateBloodGrid(inventory) {
    const grid = document.getElementById('bloodGrid');
    if (!grid) return;
    
    grid.innerHTML = '';
    
    if (!inventory || inventory.length === 0) {
        grid.innerHTML = '<p>No inventory data available</p>';
        return;
    }
    
    const sorted = [...inventory].sort((a, b) => a.quantity - b.quantity);
    
    sorted.forEach(item => {
        const status = getStockStatus(item.quantity, item.minimum_stock);
        const card = document.createElement('div');
        card.className = `blood-card ${status.class}`;
        card.innerHTML = `
            <h3>${item.blood_group}</h3>
            <p class="quantity">${item.quantity} units</p>
            <p class="minimum">Min: ${item.minimum_stock}</p>
            <span class="status-badge ${status.class}">${status.label}</span>
        `;
        grid.appendChild(card);
    });
}

function getStockStatus(quantity, minimum) {
    if (quantity < minimum) {
        return { class: 'critical', label: '🔴 CRITICAL' };
    } else if (quantity < minimum * 1.5) {
        return { class: 'low', label: '🟡 LOW' };
    } else {
        return { class: 'safe', label: '🟢 SAFE' };
    }
}

// ============================================================
// 📅 EXPIRY TABLE
// ============================================================
function updateExpiryTable(inventory) {
    const tbody = document.getElementById('expiryBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (!inventory || inventory.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5">No expiry data available</td></tr>';
        return;
    }
    
    const sorted = [...inventory].sort((a, b) => {
        const daysA = a.days_until_expiry !== null ? a.days_until_expiry : 999;
        const daysB = b.days_until_expiry !== null ? b.days_until_expiry : 999;
        return daysA - daysB;
    });
    
    sorted.forEach(item => {
        const days = item.days_until_expiry;
        const status = getExpiryStatus(days);
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>${item.blood_group}</strong></td>
            <td>${item.quantity}</td>
            <td>${item.expiry_date || 'N/A'}</td>
            <td>${days !== null ? days + ' days' : 'N/A'}</td>
            <td><span class="expiry-badge ${status.class}">${status.label}</span></td>
        `;
        tbody.appendChild(row);
    });
}

function getExpiryStatus(days) {
    if (days === null || days === undefined) return { class: 'safe', label: 'N/A' };
    if (days < 0) return { class: 'expired', label: '❌ EXPIRED' };
    if (days <= 3) return { class: 'critical', label: '⚠️ CRITICAL' };
    if (days <= 7) return { class: 'warning', label: '⚠️ WARNING' };
    return { class: 'safe', label: '✅ SAFE' };
}

// ============================================================
// 🔔 RECENT ALERTS
// ============================================================
function updateRecentAlerts(alerts) {
    const list = document.getElementById('alertsList');
    if (!list) return;
    
    list.innerHTML = '';
    
    if (!alerts || alerts.length === 0) {
        list.innerHTML = '<p class="no-alerts">✅ No alerts at this time</p>';
        return;
    }
    
    alerts.forEach(alert => {
        const div = document.createElement('div');
        const severityClass = alert.severity ? alert.severity.toLowerCase() : 'warning';
        div.className = `alert-item ${severityClass}`;
        div.innerHTML = `
            <span class="alert-icon">${alert.severity === 'CRITICAL' ? '🔴' : '🟡'}</span>
            <span class="alert-message">${alert.message}</span>
            <span class="alert-time">${new Date(alert.created_at).toLocaleString()}</span>
        `;
        list.appendChild(div);
    });
}

// ============================================================
// INVENTORY PAGE (FIXED)
// ============================================================
function updateInventoryPage(data) {
    console.log('📋 Updating inventory page...');
    console.log('📊 Data received:', data);
    console.log('📊 Inventory data:', data.inventory);
    
    // ============================================================
    // TOTAL UNITS
    // ============================================================
    const totalUnits = document.getElementById('totalUnits');
    if (totalUnits) {
        totalUnits.textContent = data.stock || 0;
        console.log('✅ Total units:', data.stock);
    }
    
    // ============================================================
    // BLOOD TYPES - FIXED
    // ============================================================
    const bloodTypes = document.getElementById('bloodTypes');
    console.log('🔍 bloodTypes element:', bloodTypes);
    if (bloodTypes) {
        const count = data.inventory ? data.inventory.length : 0;
        bloodTypes.textContent = count + ' Types';
        console.log('✅ Blood types:', count + ' Types');
    } else {
        console.log('❌ bloodTypes element not found!');
    }
    
    // ============================================================
    // LOW STOCK TYPES - FIXED: Count from inventory
    // ============================================================
    let lowStockTypes = 0;
    if (data.inventory) {
        data.inventory.forEach(item => {
            console.log('🔍 Checking:', item.blood_group, 'Qty:', item.quantity, 'Min:', item.minimum_stock);
            if (item.quantity < item.minimum_stock) {
                lowStockTypes++;
                console.log('⚠️ Low stock:', item.blood_group);
            }
        });
    }
    
    const lowStockCount = document.getElementById('lowStockCount');
    console.log('🔍 lowStockCount element:', lowStockCount);
    if (lowStockCount) {
        lowStockCount.textContent = lowStockTypes;
        console.log('✅ Low stock types:', lowStockTypes);
    } else {
        console.log('❌ lowStockCount element not found!');
    }
    
    // ============================================================
    // INVENTORY TABLE
    // ============================================================
    const tbody = document.getElementById('inventoryBody');
    if (!tbody) {
        console.error('❌ inventoryBody not found!');
        return;
    }
    
    tbody.innerHTML = '';
    
    if (!data.inventory || data.inventory.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4">No inventory data available</td></tr>';
        return;
    }
    
    data.inventory.forEach(item => {
        const status = getStockStatus(item.quantity, item.minimum_stock);
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>${item.blood_group}</strong></td>
            <td>${item.quantity}</td>
            <td>${item.minimum_stock}</td>
            <td><span class="status-badge ${status.class}">${status.label}</span></td>
        `;
        tbody.appendChild(row);
    });
    
    console.log('✅ Inventory table updated!');
}

// ============================================================
// ALERTS PAGE
// ============================================================
function updateAlertsPage(data) {
    const alertList = document.getElementById('alertList');
    if (!alertList) return;
    
    const time = new Date().toLocaleTimeString();
    const alerts = [];
    
    if (data.temperature > 25) {
        alerts.push({ type: 'CRITICAL', message: 'Temperature: ' + data.temperature + '°C', time: time });
    } else if (data.temperature < 15) {
        alerts.push({ type: 'WARNING', message: 'Temperature: ' + data.temperature + '°C (Below safe range)', time: time });
    }
    
    if (data.door === 'Open') {
        alerts.push({ type: 'CRITICAL', message: 'Door is OPEN!', time: time });
    }
    
    if (data.inventory) {
        data.inventory.forEach(item => {
            if (item.quantity < item.minimum_stock) {
                alerts.push({ 
                    type: 'WARNING', 
                    message: 'Low stock: ' + item.blood_group + ' has ' + item.quantity + ' units (Min: ' + item.minimum_stock + ')', 
                    time: time 
                });
            }
        });
    }
    
    if (data.inventory) {
        data.inventory.forEach(item => {
            const days = item.days_until_expiry;
            if (days !== null && days < 0) {
                alerts.push({ type: 'CRITICAL', message: 'EXPIRED: ' + item.blood_group + ' expired ' + Math.abs(days) + ' days ago', time: time });
            } else if (days !== null && days <= 3) {
                alerts.push({ type: 'WARNING', message: 'Expiring soon: ' + item.blood_group + ' expires in ' + days + ' days', time: time });
            }
        });
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

// ============================================================
// FILTER ALERTS
// ============================================================
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
        fetchDashboardData();
        
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

// ============================================================
// REFRESH BUTTON (FIXED - No Recursion)
// ============================================================
function refreshDataManually() {
    console.log('🔄 Manual refresh triggered');
    if (updateInterval) {
        clearInterval(updateInterval);
        updateInterval = null;
    }
    fetchDashboardData();
    updateInterval = setInterval(fetchDashboardData, 30000);
}

// ============================================================
// LOGOUT (FIXED)
// ============================================================
function logout() {
    localStorage.removeItem('user');
    if (updateInterval) {
        clearInterval(updateInterval);
        updateInterval = null;
    }
    window.location.href = 'login.html';
}

// ============================================================
// EXPOSE FUNCTIONS TO HTML
// ============================================================
window.refreshData = refreshDataManually;
window.logout = logout;
window.filterAlerts = filterAlerts;
window.updateStock = updateStock;
