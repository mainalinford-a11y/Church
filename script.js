/**
 * ACK GITUNDU MANAGEMENT SYSTEM - FINAL PRODUCTION VERSION
 * Full Script with Dashboard, 2026 Weekly History, and Member Statements
 */

// 1. CONFIGURATION (Ensure these are your actual IDs)
const SPREADSHEET_ID = "1NOl0KMh6HA5cteNHYcXEtCq9voN4-kRFjVi-kiowkZs";
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbzV22XjDFuIplf2Wpc8WEcyF3ucI2aNeGnWtyXXVCqynXdqfLLG8lEM3INJ5UKdga_esQ/exec"; 
const CODES = { ADMIN: "TR-2026", VIEW: "COM-2026" };

// 2. GLOBAL VARIABLES
let weeklyDataGrouped = {};
let weekKeys = [];
let currentWeekIndex = 0;
let rawMemberGiving = []; 

// 3. PAGE LOAD INITIALIZATION
window.onload = function() {
    console.log("App Initialized");
    const savedRole = localStorage.getItem('ackRole');
    if (savedRole) {
        showDashboard(savedRole);
        fetchDashboardData();
    }
};

// 4. LOGIN LOGIC
function checkLogin() {
    const passInput = document.getElementById('pass');
    if (!passInput) return;
    
    const val = passInput.value.trim();
    let role = null;

    if (val === CODES.ADMIN) role = "EDITOR";
    else if (val === CODES.VIEW) role = "VIEWER";

    if (role) {
        localStorage.setItem('ackRole', role);
        showDashboard(role);
        fetchDashboardData();
    } else {
        alert("Incorrect code. Please try again.");
    }
}

function showDashboard(role) {
    document.getElementById('login-container').style.display = 'none';
    document.getElementById('dashboard').style.display = 'block';
    const container = document.getElementById('spreadsheet-container');
    const mode = (role === "EDITOR") ? "edit" : "preview";
    container.innerHTML = `<iframe src="https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/${mode}?rm=minimal"></iframe>`;
}

// 5. DATA FETCHING & SYNC
async function fetchDashboardData() {
    try {
        const response = await fetch(WEB_APP_URL);
        const data = await response.json();
        
        if (data.status === "success") {
            // Update Annual Cards
            document.getElementById('total-income').innerText = "KES " + (data.finance.income || 0).toLocaleString();
            document.getElementById('total-expense').innerText = "KES " + (data.finance.expense || 0).toLocaleString();
            const bal = data.finance.balance || 0;
            const bEl = document.getElementById('total-balance');
            bEl.innerText = "KES " + bal.toLocaleString();
            bEl.style.color = bal >= 0 ? "#27ae60" : "#e74c3c";

            // Process Weekly Data (STRICT 2026 FILTER)
            rawMemberGiving = data.memberGiving || [];
            weeklyDataGrouped = data.weeklyHistory || {};
            
            // This line ensures we only see 2026 Sundays
            weekKeys = Object.keys(weeklyDataGrouped)
                .filter(d => {
                    const year = new Date(d).getFullYear();
                    return year === 2026;
                })
                .sort((a, b) => new Date(a) - new Date(b));
            
            // Set to the most recent Sunday
            currentWeekIndex = weekKeys.length - 1;
            updateWeeklyDisplay();

            // Build Member List Table
            const tbody = document.querySelector('#members-table tbody');
            if (tbody) {
                tbody.innerHTML = data.members.map(m => {
                    const safeName = m[0].replace(/'/g, "\\'");
                    return `<tr>
                        <td><b>${m[0]}</b></td>
                        <td>${m[1]}</td>
                        <td>Active</td>
                        <td><button class="statement-btn" onclick="viewStatement('${safeName}')">Statement</button></td>
                    </tr>`;
                }).join('');
            }

            // Build Monthly Growth Table
            const gDiv = document.getElementById('monthly-table-data');
            if (gDiv) {
                let h = "<table><thead><tr><th>Month</th><th>Income</th><th>Expense</th><th>Balance</th></tr></thead><tbody>";
                data.growth.forEach(r => {
                    h += `<tr><td><b>${r.month}</b></td><td>${Number(r.inc).toLocaleString()}</td><td>${Number(r.exp).toLocaleString()}</td><td style="color:${r.bal >= 0 ? 'green':'red'}">${Number(r.bal).toLocaleString()}</td></tr>`;
                });
                gDiv.innerHTML = h + "</tbody></table>";
            }
        }
    } catch (err) {
        console.error("Data fetch error:", err);
    }
}

// 6. WEEKLY DISPLAY (Dashboard View)
function updateWeeklyDisplay() {
    if (weekKeys.length === 0) {
        document.getElementById('week-label').innerText = "No 2026 Data Found";
        return;
    }
    const dateStr = weekKeys[currentWeekIndex];
    const week = weeklyDataGrouped[dateStr];
    
    // Nice Date Label
    const dateObj = new Date(dateStr);
    document.getElementById('week-label').innerText = dateObj.toLocaleDateString('en-GB', {
        day: 'numeric', month: 'long', year: 'numeric'
    });

    const clean = (v) => parseFloat(String(v).replace(/,/g, '')) || 0;

    // Filter and Sum Income (Ignore phantom rows)
    let incT = 0;
    let incH = week.income
        .filter(i => i.name && !i.name.toUpperCase().includes("TOTAL") && clean(i.amount) > 0)
        .map(i => {
            const amt = clean(i.amount);
            incT += amt;
            return `<li>${i.name} <span>${amt.toLocaleString()}</span></li>`;
        }).join('');
    
    // Filter and Sum Expenses
    let expT = 0;
    let expH = week.expense
        .filter(e => e.name && !e.name.toUpperCase().includes("TOTAL") && clean(e.amount) > 0)
        .map(e => {
            const amt = clean(e.amount);
            expT += amt;
            return `<li>${e.name} <span>${amt.toLocaleString()}</span></li>`;
        }).join('');

    document.getElementById('income-details').innerHTML = (incH || "<li>No income</li>") + 
        `<li class="total-row">TOTAL INCOME <span>${incT.toLocaleString()}</span></li>`;
    
    document.getElementById('expense-details').innerHTML = (expH || "<li>No expense</li>") + 
        `<li class="total-row">TOTAL EXPENSE <span>${expT.toLocaleString()}</span></li>`;

    // Cell Rankings
    let cells = {};
    const targetTime = new Date(dateStr).setHours(0,0,0,0);
    rawMemberGiving.forEach(r => {
        const recordTime = new Date(r[0]).setHours(0,0,0,0);
        if (recordTime === targetTime) {
            cells[r[1]] = (cells[r[1]] || 0) + clean(r[2]);
        }
    });
    const sorted = Object.entries(cells).sort((a,b) => b[1]-a[1]);
    document.getElementById('cell-analytics-data').innerHTML = sorted.length > 0 ? sorted.map((c, i) => {
        return `<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px dotted #eee;">
            <span><b>${i+1}. ${c[0]}</b></span><span>KES ${c[1].toLocaleString()}</span>
        </div>`;
    }).join('') : "<p style='text-align:center;'>No Cell data this week.</p>";
}

// 7. INDIVIDUAL MEMBER STATEMENT LOGIC
async function viewStatement(name) {
    const start = prompt("View statement from (YYYY-MM-DD):", "2026-01-01");
    const end = prompt("To (YYYY-MM-DD):", new Date().toISOString().split('T')[0]);
    if (!start || !end) return;

    const url = `${WEB_APP_URL}?action=getStatement&name=${encodeURIComponent(name)}&start=${start}&end=${end}`;
    try {
        const res = await fetch(url);
        const d = await res.json();
        if (!d.history || d.history.length === 0) return alert("No records found for this period.");

        let m = `OFFICIAL STATEMENT: ${d.name}\n`;
        m += `Period: ${start} to ${end}\n`;
        m += `--------------------------\n`;
        m += `Tithes: ${d.summary.tithe.toLocaleString()}\n`;
        m += `Pledges: ${d.summary.pledge.toLocaleString()}\n`;
        m += `Others: ${d.summary.others.toLocaleString()}\n`;
        m += `TOTAL: KES ${d.summary.total.toLocaleString()}\n`;
        m += `--------------------------\n`;
        m += `Recent Contributions:\n`;
        d.history.slice(0, 5).forEach(h => m += `${h.date}: ${h.total.toLocaleString()}\n`);
        alert(m);
    } catch (e) { alert



























