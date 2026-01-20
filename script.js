 /**
 * ACK GITUNDU MANAGEMENT SYSTEM - FRONTEND
 * Features: Dashboard, Weekly History (No Phantoms), Member Giving Automation, & Individual Statements
 */

const SPREADSHEET_ID = "1NOl0KMh6HA5cteNHYcXEtCq9voN4-kRFjVi-kiowkZs";
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbzV22XjDFuIplf2Wpc8WEcyF3ucI2aNeGnWtyXXVCqynXdqfLLG8lEM3INJ5UKdga_esQ/exec"; 
const CODES = { ADMIN: "TR-2026", VIEW: "COM-2026" };

let weeklyDataGrouped = {};
let weekKeys = [];
let currentWeekIndex = 0;
let rawMemberGiving = []; 

window.onload = () => {
    const saved = localStorage.getItem('ackRole');
    if (saved) { showDashboard(saved); fetchDashboardData(); }
};

function checkLogin() {
    const code = document.getElementById('pass').value;
    let role = (code === CODES.ADMIN) ? "EDITOR" : (code === CODES.VIEW ? "VIEWER" : null);
    if (role) {
        localStorage.setItem('ackRole', role);
        showDashboard(role);
        fetchDashboardData();
    } else { alert("Access Denied."); }
}

function showDashboard(role) {
    document.getElementById('login-container').style.display = 'none';
    document.getElementById('dashboard').style.display = 'block';
    const container = document.getElementById('spreadsheet-container');
    let mode = (role === "EDITOR") ? "edit" : "preview";
    container.innerHTML = `<iframe src="https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/${mode}?rm=minimal"></iframe>`;
}

async function fetchDashboardData() {
    try {
        const response = await fetch(WEB_APP_URL);
        const data = await response.json();
        if(data.status === "success") {
            // Update Annual Summary Cards
            document.getElementById('total-income').innerText = "KES " + (data.finance.income || 0).toLocaleString();
            document.getElementById('total-expense').innerText = "KES " + (data.finance.expense || 0).toLocaleString();
            const bal = data.finance.balance || 0;
            const balEl = document.getElementById('total-balance');
            balEl.innerText = "KES " + bal.toLocaleString();
            balEl.style.color = bal >= 0 ? "#27ae60" : "#e74c3c";

            rawMemberGiving = data.memberGiving || [];
            weeklyDataGrouped = data.weeklyHistory;
            
            // Filter keys for 2026 and sort chronologically
            weekKeys = Object.keys(weeklyDataGrouped)
                .filter(dateStr => new Date(dateStr).getFullYear() >= 2026)
                .sort((a,b) => new Date(a) - new Date(b));
            
            currentWeekIndex = weekKeys.length - 1; 
            updateWeeklyDisplay();

            // Build Member List with "View Statement" Button
            document.querySelector('#members-table tbody').innerHTML = data.members.map(m => {
                return `<tr>
                    <td><b>${m[0]}</b></td>
                    <td>${m[1]}</td>
                    <td>${m[2]}</td>
                    <td><button onclick="viewStatement('${m[0].replace(/'/g, "\\'")}')" class="statement-btn">Statement</button></td>
                </tr>`;
            }).join('');
            
            // Build Monthly Growth Table
            let mHtml = "<table><thead><tr><th>Month</th><th>Income</th><th>Expense</th><th>Balance</th></tr></thead><tbody>";
            data.growth.forEach(r => { 
                mHtml += `<tr><td><b>${r.month}</b></td><td>${Number(r.inc).toLocaleString()}</td><td>${Number(r.exp).toLocaleString()}</td><td style="color:${r.bal >= 0 ? 'green' : 'red'}">${Number(r.bal).toLocaleString()}</td></tr>`; 
            });
            document.getElementById('monthly-table-data').innerHTML = mHtml + "</tbody></table>";
        }
    } catch (e) { console.error("Sync Error:", e); }
}

function updateWeeklyDisplay() {
    if (weekKeys.length === 0) return;
    
    const rawDate = weekKeys[currentWeekIndex];
    const weekData = weeklyDataGrouped[rawDate];

    // Format Date nicely (Monday, 1 January 2026)
    const dateObj = new Date(rawDate);
    const cleanDate = dateObj.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    document.getElementById('week-label').innerText = cleanDate;

    const cleanNum = (val) => parseFloat(String(val).replace(/,/g, '')) || 0;
    const normalizeDate = (d) => new Date(d).setHours(0,0,0,0);
    const targetDate = normalizeDate(rawDate);

    // Weekly Income List (Filters out Phantoms)
    let calcIncomeTotal = 0;
    let incHtml = weekData.income
        .filter(i => i.name && i.name.trim() !== "" && !i.name.toUpperCase().includes("TOTAL") && cleanNum(i.amount) > 0)
        .map(i => {
            const val = cleanNum(i.amount);
            calcIncomeTotal += val;
            return `<li>${i.name} <span>${val.toLocaleString()}</span></li>`;
        }).join('');
    
    // Weekly Expenditure List (Filters out Phantoms)
    let calcExpenseTotal = 0;
    let expHtml = weekData.expense
        .filter(e => e.name && e.name.trim() !== "" && !e.name.toUpperCase().includes("TOTAL") && cleanNum(e.amount) > 0)
        .map(e => {
            const val = cleanNum(e.amount);
            calcExpenseTotal += val;
            return `<li>${e.name} <span>${val.toLocaleString()}</span></li>`;
        }).join('');

    const weeklyBalance = calcIncomeTotal - calcExpenseTotal;

    document.getElementById('income-details').innerHTML = (incHtml || "<li>No income recorded.</li>") + 
        `<li class="total-row">TOTAL INCOME <span>${calcIncomeTotal.toLocaleString()}</span></li>`;
    
    document.getElementById('expense-details').innerHTML = (expHtml || "<li>No expenses recorded.</li>") + 
        `<li class="total-row">TOTAL EXPENDITURE <span>${calcExpenseTotal.toLocaleString()}</span></li>` +
        `<li style="color:${weeklyBalance >= 0 ? '#27ae60' : '#e74c3c'}; font-weight:bold; border:none; margin-top:8px; font-size:1.1rem;">WEEKLY BALANCE <span>${weeklyBalance.toLocaleString()}</span></li>`;

    // Cell Analytics
    let cellRankings = {};
    rawMemberGiving.forEach(record => {
        if (record[0] && normalizeDate(record[0]) === targetDate) {
            let cellName = record[1]; 
            let amount = cleanNum(record[2]);
            if (cellName) cellRankings[cellName] = (cellRankings[cellName] || 0) + amount;
        }
    });
    let sortedCells = Object.entries(cellRankings).sort((a, b) => b[1] - a[1]);
    document.getElementById('cell-analytics-data').innerHTML = sortedCells.length > 0 ? sortedCells.map((c, i) => {
        let medal =

























