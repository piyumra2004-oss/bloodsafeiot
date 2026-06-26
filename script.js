// ============================================================
// BLOODSAFE IoT - Complete JavaScript
// Suwa Setha Hospital Blood Bank
// Connected to Supabase Cloud Database
// ============================================================

const SUPABASE_URL = "https://jqdnxrmulgndvcotnfmu.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpxZG54cm11bGduZHZjb3RuZm11Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIzMTQ2MDIsImV4cCI6MjA5Nzg5MDYwMn0.PJRHVVdtK56rDKJxnQH-grwD0M8SaUrJZL9qUdhnSzg";

let updateInterval = null;

// ============================================================
// PAGE LOAD
// ============================================================
document.addEventListener('DOMContentLoaded', function() {
    var user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
        window.location.href = 'login.html';
        return;
    }

    document.getElementById('userDisplay').textContent = '👤 ' + user.username;

    refreshData();
    updateInterval = setInterval(refreshData, 5000);
});

// ============================================================
// FETCH DATA FROM SUPABASE
// ============================================================
async function refreshData() {
    try {
        console.log('Fetching from Supabase...');

        const response = await fetch(
            SUPABASE_URL + "/rest/v1/bloodbank?select=*&order=id.desc&limit=1",
            {
                headers: {
                    "apikey": SUPABASE_KEY,
                    "Authorization": "Bearer " + SUPABASE_KEY
                }
            }
        );

        const rows = await response.json();
        console.log('Supabase data:', rows);

        if (rows && rows.length > 0) {
            const row = rows[0];

            const data = {
                temperature: parseFloat(row.temperature) || 0,
                stock: parseInt(row.blood_stock) || 0,
                status: row.status || 'NORMAL',
                expiry: 5,
                lastUpdated: new Date().toISOString(),
                inventory: {
                    'A+':  { quantity: 46, status: 'OK' },
                    'A-':  { quantity: 23, status: 'OK' },
                    'B+':  { quantity: 34, status: 'OK' },
                    'B-':  { quantity: 17, status: 'OK' },
                    'O+':  { quantity: 40, status: 'OK' },
                    'O-':  { quantity: 13, status: 'OK' },
                    'AB+': { quantity: 11, status: 'OK' },
                    'AB-': { quantity: 6,  status: 'LOW' }
                }
            };

            // Update stock status based on quantity
            for (const [group, info] of Object.entries(data.inventory)) {
                if (info.quantity < 10) info.status = 'CRITICAL';
                else if (info.quantity < 20) info.status = 'LOW';
                else info.status = 'OK';
            }

            if (document.getElementById('tempDisplay')) {
                updateDashboard(data);
            }

            if (document.getElementById("inventoryBody")) {
                updateInventoryPage(data);
            }

            if (document.getElementById('alertList')) {
                updateAlertsPage(data);
            }
        }

    } catch (error) {
        console.error('Supabase Error:', error);
    }
}

// ============================================================
// DASHBOARD
// ============================================================
function updateDashboard(data) {
    const temp = data.temperature;
    document.getElementById('tempDisplay').textContent = temp.toFixed(1) + '°C';

    const tempStatus = document.getElementById('tempStatus');
    if (temp > 8) {
        tempStatus.textContent = '🚨 CRITICAL';
        tempStatus.className = 'stat-status critical';
        document.querySelector('.temp-card').classList.add('critical');
    } else if (temp < 2) {
        tempStatus.textContent = '⚠ TOO LOW';
        tempStatus.className = 'stat-status warning';
    } else {
        tempStatus.textContent = '✅ Normal';
        tempStatus.className = 'stat-status normal';
        document.querySelector('.temp-card').classList.remove('critical');
    }

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

    document.getElementById('expiryDisplay').textContent = data.expiry || 0;

    const status = data.status || 'NORMAL';
    document.getElementById('systemStatus').textContent = status;
    document.getElementById('lastUpdate').textContent =
        new Date().toLocaleTimeString();

    updateAlertBanner(status, temp, stock);

    if (data.inventory) {
        updateBloodGrid(data.inventory);
    }
}

function updateAlertBanner(status, temp, stock) {
    const banner = document.getElementById('alertBanner');

    if (temp > 8) {
        banner.className = 'alert-banner critical';
        banner.textContent = '🚨 CRITICAL: Temperature ' + temp.toFixed(1) + '°C - Immediate Action Required!';
    } else if (stock < 30) {
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

    for (const [group, info] of Object.entries(inventory)) {
        const dotColors = { 'OK': 'ok', 'LOW': 'warning', 'CRITICAL': 'critical' };
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
    if (totalUnits) totalUnits.textContent = data.stock || 0;

    let lowCount = 0;
    let criticalCount = 0;

    if (data.inventory) {
        for (const [group, info] of Object.entries(data.inventory)) {
            if (info.status === 'LOW') lowCount++;
            if (info.status === 'CRITICAL') criticalCount++;
        }
    }

    const lowStockCount = document.getElementById('lowStockCount');
    if (lowStockCount) lowStockCount.textContent = lowCount + criticalCount;

    updateInventoryTable(data.inventory);
}

function updateInventoryTable(inventory) {
    const tbody = document.getElementById('inventoryBody');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (!inventory) {
        tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;">No data</td></tr>';
        return;
    }

    for (const [group, info] of Object.entries(inventory)) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>${group}</strong></td>
            <td>${info.quantity}</td>
            <td><span class="status-badge ${info.status}">${info.status}</span></td>
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

    const temp = data.temperature;
    const stock = data.stock;
    const now = new Date().toLocaleTimeString();

    const alerts = [
        { type: 'INFO', message: 'System connected to Supabase cloud database', time: now },
        { type: 'INFO', message: 'Wokwi ESP32 sensor data received', time: now }
    ];

    if (temp > 8) {
        alerts.unshift({
            type: 'CRITICAL',
            message: 'Temperature ' + temp.toFixed(1) + '°C exceeds safe limit! Check storage immediately.',
            time: now
        });
    }

    if (stock < 30) {
        alerts.unshift({
            type: 'WARNING',
            message: 'Blood stock low: only ' + stock + ' units remaining. Restock required.',
            time: now
        });
    }

    if (temp <= 8 && stock >= 30) {
        alerts.unshift({
            type: 'INFO',
            message: 'All systems normal. Temperature and stock within safe limits.',
            time: now
        });
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
        item.style.display =
            filter === 'ALL' || item.dataset.type === filter ? 'flex' : 'none';
    });

    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.textContent.toUpperCase().includes(filter)) {
            btn.classList.add('active');
        }
    });
}

// ============================================================
// QUICK ACTIONS
// ============================================================
async function updateStock(change) {
    try {
        const res = await fetch(
            SUPABASE_URL + "/rest/v1/bloodbank?id=eq.1",
            {
                method: 'PATCH',
                headers: {
                    "apikey": SUPABASE_KEY,
                    "Authorization": "Bearer " + SUPABASE_KEY,
                    "Content-Type": "application/json",
                    "Prefer": "return=minimal"
                },
                body: JSON.stringify({ blood_stock: Math.max(0, (parseInt(document.getElementById('stockDisplay').textContent) || 0) - change) })
            }
        );
        setTimeout(refreshData, 500);
    } catch (error) {
        console.error('Error updating stock:', error);
    }
}

function simulateCritical() {
    document.getElementById('tempDisplay').textContent = '10.0°C';
    document.getElementById('tempStatus').textContent = '🚨 CRITICAL';
    document.getElementById('tempStatus').className = 'stat-status critical';
    document.querySelector('.temp-card').classList.add('critical');
    const banner = document.getElementById('alertBanner');
    banner.className = 'alert-banner critical';
    banner.textContent = '🚨 CRITICAL: Temperature 10°C - Immediate Action Required!';
}

function logout() {
    localStorage.removeItem('user');
    clearInterval(updateInterval);
    window.location.href = 'login.html';
}
