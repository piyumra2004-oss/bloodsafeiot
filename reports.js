

// Check if supabase client exists
if (typeof supabase === 'undefined') {
    console.error('❌ Supabase client not found! Make sure supabase-config.js is loaded first.');
}

// Helper function to safely access supabase
function getSupabase() {
    if (typeof supabase === 'undefined') {
        console.error('❌ Supabase client not available');
        return null;
    }
    return supabase;
}
// Load report data
async function generateReport() {
    const reportType = document.getElementById('reportType').value;
    const dateRange = document.getElementById('dateRange').value;
    const previewDiv = document.getElementById('reportPreview');
    
    previewDiv.innerHTML = '<p>⏳ Generating report...</p>';
    
    try {
        let data;
        let html = '';
        
        switch(reportType) {
            case 'inventory':
                data = await getInventoryReport();
                html = renderInventoryReport(data);
                break;
            case 'alerts':
                data = await getAlertsReport(dateRange);
                html = renderAlertsReport(data);
                break;
            case 'temperature':
                data = await getTemperatureReport(dateRange);
                html = renderTemperatureReport(data);
                break;
            case 'wastage':
                data = await getWastageReport();
                html = renderWastageReport(data);
                break;
            case 'full':
                data = await getFullReport();
                html = renderFullReport(data);
                break;
        }
        
        previewDiv.innerHTML = html;
        
    } catch (error) {
        previewDiv.innerHTML = `<p style="color:red;">❌ Error: ${error.message}</p>`;
    }
}

// ============================================================
// REPORT DATA FETCHING FUNCTIONS
// ============================================================

async function getInventoryReport() {
    const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .order('blood_group');
    
    if (error) throw error;
    return data;
}

async function getAlertsReport(dateRange) {
    let startDate = new Date();
    switch(dateRange) {
        case 'today': startDate.setHours(0,0,0,0); break;
        case 'week': startDate.setDate(startDate.getDate() - 7); break;
        case 'month': startDate.setDate(startDate.getDate() - 30); break;
        default: startDate = null;
    }
    
    let query = supabase.from('alerts').select('*').order('created_at', { ascending: false });
    if (startDate) {
        query = query.gte('created_at', startDate.toISOString());
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data;
}

async function getTemperatureReport(dateRange) {
    let startDate = new Date();
    switch(dateRange) {
        case 'today': startDate.setHours(0,0,0,0); break;
        case 'week': startDate.setDate(startDate.getDate() - 7); break;
        case 'month': startDate.setDate(startDate.getDate() - 30); break;
        default: startDate = null;
    }
    
    let query = supabase.from('sensors').select('*').order('created_at', { ascending: false }).limit(100);
    if (startDate) {
        query = query.gte('created_at', startDate.toISOString());
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data;
}

async function getWastageReport() {
    const { data, error } = await supabase
        .from('alerts')
        .select('*')
        .eq('type', 'EXPIRY')
        .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
}

async function getFullReport() {
    const [inventory, alerts, sensors] = await Promise.all([
        supabase.from('inventory').select('*'),
        supabase.from('alerts').select('*').order('created_at', { ascending: false }).limit(50),
        supabase.from('sensors').select('*').order('created_at', { ascending: false }).limit(20)
    ]);
    
    return {
        inventory: inventory.data,
        alerts: alerts.data,
        sensors: sensors.data
    };
}

// ============================================================
// REPORT RENDER FUNCTIONS
// ============================================================

function renderInventoryReport(data) {
    let totalUnits = 0;
    let lowStockCount = 0;
    
    data.forEach(item => {
        totalUnits += item.quantity || 0;
        if (item.quantity < item.minimum_stock) lowStockCount++;
    });
    
    let html = `
        <div class="report-header">
            <h3>📦 Inventory Report</h3>
            <p>Generated: ${new Date().toLocaleString()}</p>
            <p>Total Units: ${totalUnits} | Low Stock Types: ${lowStockCount}</p>
        </div>
        <table class="report-table">
            <thead>
                <tr>
                    <th>Blood Group</th>
                    <th>Quantity</th>
                    <th>Minimum Stock</th>
                    <th>Expiry Date</th>
                    <th>Days Left</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    data.forEach(item => {
        const status = item.quantity < item.minimum_stock ? 'LOW STOCK' : 'OK';
        const days = item.days_until_expiry !== null ? item.days_until_expiry : 'N/A';
        html += `
            <tr>
                <td><strong>${item.blood_group}</strong></td>
                <td>${item.quantity}</td>
                <td>${item.minimum_stock}</td>
                <td>${item.expiry_date || 'N/A'}</td>
                <td>${days}</td>
                <td><span class="status-badge ${status === 'LOW STOCK' ? 'critical' : 'safe'}">${status}</span></td>
            </tr>
        `;
    });
    
    html += `</tbody></table>`;
    return html;
}

function renderAlertsReport(data) {
    let html = `
        <div class="report-header">
            <h3>🔔 Alerts Report</h3>
            <p>Generated: ${new Date().toLocaleString()}</p>
            <p>Total Alerts: ${data.length}</p>
        </div>
        <table class="report-table">
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Message</th>
                    <th>Severity</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    data.forEach(item => {
        const date = new Date(item.created_at).toLocaleString();
        const status = item.is_read ? 'Read' : 'Unread';
        html += `
            <tr>
                <td>${date}</td>
                <td>${item.type}</td>
                <td>${item.message}</td>
                <td><span class="severity-${item.severity.toLowerCase()}">${item.severity}</span></td>
                <td>${status}</td>
            </tr>
        `;
    });
    
    html += `</tbody></table>`;
    return html;
}

function renderTemperatureReport(data) {
    let avgTemp = 0;
    data.forEach(item => avgTemp += item.temperature);
    avgTemp = data.length > 0 ? (avgTemp / data.length).toFixed(1) : 'N/A';
    
    let html = `
        <div class="report-header">
            <h3>🌡️ Temperature Report</h3>
            <p>Generated: ${new Date().toLocaleString()}</p>
            <p>Average Temperature: ${avgTemp}°C | Readings: ${data.length}</p>
        </div>
        <table class="report-table">
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Temperature (°C)</th>
                    <th>Humidity (%)</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    data.slice(0, 50).forEach(item => {
        const date = new Date(item.created_at).toLocaleString();
        html += `
            <tr>
                <td>${date}</td>
                <td>${item.temperature}</td>
                <td>${item.humidity || 'N/A'}</td>
                <td><span class="status-${item.status.toLowerCase()}">${item.status}</span></td>
            </tr>
        `;
    });
    
    html += `</tbody></table>`;
    return html;
}

function renderWastageReport(data) {
    let html = `
        <div class="report-header">
            <h3>🗑️ Wastage Analysis</h3>
            <p>Generated: ${new Date().toLocaleString()}</p>
            <p>Total Wastage Events: ${data.length}</p>
        </div>
        <table class="report-table">
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Blood Group</th>
                    <th>Message</th>
                    <th>Severity</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    data.forEach(item => {
        const date = new Date(item.created_at).toLocaleString();
        html += `
            <tr>
                <td>${date}</td>
                <td>${item.blood_group || 'N/A'}</td>
                <td>${item.message}</td>
                <td><span class="severity-${item.severity.toLowerCase()}">${item.severity}</span></td>
            </tr>
        `;
    });
    
    html += `</tbody></table>`;
    return html;
}

function renderFullReport(data) {
    let totalStock = 0;
    data.inventory.forEach(item => totalStock += item.quantity || 0);
    
    let html = `
        <div class="report-header">
            <h3>📊 Full System Report</h3>
            <p>Generated: ${new Date().toLocaleString()}</p>
            <p>Total Stock: ${totalStock} | Blood Types: ${data.inventory.length}</p>
            <p>Total Alerts: ${data.alerts.length}</p>
            <p>Latest Temperature: ${data.sensors[0]?.temperature || 'N/A'}°C</p>
        </div>
    `;
    
    // Inventory section
    html += `<h4>📦 Inventory</h4><table class="report-table"><thead><tr><th>Blood Group</th><th>Quantity</th><th>Status</th></tr></thead><tbody>`;
    data.inventory.forEach(item => {
        const status = item.quantity < item.minimum_stock ? 'LOW' : 'OK';
        html += `<tr><td>${item.blood_group}</td><td>${item.quantity}</td><td>${status}</td></tr>`;
    });
    html += `</tbody></table>`;
    
    return html;
}

// ============================================================
// EXPORT FUNCTIONS
// ============================================================

function exportReport(format) {
    const content = document.getElementById('reportPreview').innerHTML;
    const title = document.querySelector('.report-header h3')?.textContent || 'Report';
    const date = new Date().toISOString().split('T')[0];
    
    switch(format) {
        case 'pdf':
            exportPDF(content, title);
            break;
        case 'excel':
            exportExcel(content, title, date);
            break;
        case 'json':
            exportJSON(content, title, date);
            break;
    }
}

function exportPDF(content, title) {
    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>${title}</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 40px; }
                .report-header { margin-bottom: 20px; }
                .report-table { width: 100%; border-collapse: collapse; }
                .report-table th { background: #f0f4f8; padding: 10px; text-align: left; border: 1px solid #ddd; }
                .report-table td { padding: 8px 10px; border: 1px solid #ddd; }
                .status-badge { padding: 2px 10px; border-radius: 12px; font-size: 12px; }
                .status-badge.critical { background: #f8d7da; color: #721c24; }
                .status-badge.safe { background: #d4edda; color: #155724; }
                .severity-critical { color: #dc3545; font-weight: bold; }
                .severity-warning { color: #ffc107; font-weight: bold; }
            </style>
        </head>
        <body>
            ${content}
        </body>
        </html>
    `;
    
    // Use window.print for PDF
    const win = window.open('', '_blank');
    win.document.write(html);
    win.document.close();
    win.print();
}

function exportExcel(content, title, date) {
    // Extract table data
    const table = document.querySelector('.report-table');
    if (!table) {
        alert('No table data to export. Please generate a report first.');
        return;
    }
    
    let csv = '';
    
    // Get headers
    const headers = table.querySelectorAll('thead th');
    const headerRow = [];
    headers.forEach(th => headerRow.push(th.textContent.trim()));
    csv += headerRow.join(',') + '\n';
    
    // Get rows
    const rows = table.querySelectorAll('tbody tr');
    rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        const rowData = [];
        cells.forEach(td => {
            // Clean text
            let text = td.textContent.trim().replace(/,/g, ';');
            rowData.push(text);
        });
        csv += rowData.join(',') + '\n';
    });
    
    // Download
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${title}_${date}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
}

function exportJSON(content, title, date) {
    // Extract data from table
    const table = document.querySelector('.report-table');
    if (!table) {
        alert('No data to export. Please generate a report first.');
        return;
    }
    
    // Get headers
    const headers = [];
    table.querySelectorAll('thead th').forEach(th => {
        headers.push(th.textContent.trim());
    });
    
    // Get data rows
    const data = [];
    table.querySelectorAll('tbody tr').forEach(row => {
        const rowData = {};
        const cells = row.querySelectorAll('td');
        cells.forEach((td, index) => {
            rowData[headers[index] || `column_${index}`] = td.textContent.trim();
        });
        data.push(rowData);
    });
    
    const json = {
        reportTitle: title,
        generated: new Date().toISOString(),
        data: data
    };
    
    // Download
    const blob = new Blob([JSON.stringify(json, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${title}_${date}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
}

function printReport() {
    window.print();
}

// ============================================================
// SCHEDULING FUNCTIONS
// ============================================================

function showScheduleModal() {
    document.getElementById('scheduleModal').style.display = 'flex';
}

function closeScheduleModal() {
    document.getElementById('scheduleModal').style.display = 'none';
}

async function saveSchedule() {
    const reportType = document.getElementById('scheduleReportType').value;
    const frequency = document.getElementById('scheduleFrequency').value;
    const recipients = document.getElementById('scheduleRecipients').value;
    
    try {
        const { error } = await supabase
            .from('scheduled_reports')
            .insert({
                report_type: reportType,
                frequency: frequency,
                recipients: recipients,
                created_at: new Date().toISOString()
            });
        
        if (error) throw error;
        
        alert('✅ Report scheduled successfully!');
        closeScheduleModal();
        loadScheduledReports();
        
    } catch (error) {
        alert('❌ Error scheduling report: ' + error.message);
    }
}

async function loadScheduledReports() {
    const { data, error } = await supabase
        .from('scheduled_reports')
        .select('*')
        .order('created_at', { ascending: false });
    
    if (error) return;
    
    const container = document.getElementById('scheduledReportsList');
    if (!data || data.length === 0) {
        container.innerHTML = '<p>No scheduled reports configured.</p>';
        return;
    }
    
    let html = '<table class="report-table"><thead><tr><th>Report Type</th><th>Frequency</th><th>Recipients</th><th>Created</th></tr></thead><tbody>';
    data.forEach(item => {
        html += `
            <tr>
                <td>${item.report_type}</td>
                <td>${item.frequency}</td>
                <td>${item.recipients}</td>
                <td>${new Date(item.created_at).toLocaleDateString()}</td>
            </tr>
        `;
    });
    html += '</tbody></table>';
    container.innerHTML = html;
}

// Auto-generate report on page load
document.addEventListener('DOMContentLoaded', function() {
    generateReport();
    loadScheduledReports();
});

// Export functions globally
window.generateReport = generateReport;
window.exportReport = exportReport;
window.printReport = printReport;
window.showScheduleModal = showScheduleModal;
window.closeScheduleModal = closeScheduleModal;
window.saveSchedule = saveSchedule;
