// CONFIGURATION
const SPREADSHEET_ID = "1NOl0KMh6HA5cteNHYcXEtCq9voN4-kRFjVi-kiowkZs";
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbzV22XjDFuIplf2Wpc8WEcyF3ucI2aNeGnWtyXXVCqynXdqfLLG8lEM3INJ5UKdga_esQ/exec"; 
const CODES = { ADMIN: "TR-2026", VIEW: "COM-2026" };

// STATE MANAGEMENT
let weeklyDataGrouped = {};
let weekKeys = [];
let currentWeekIndex = 0;

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
    } else { alert("Incorrect Access Code."); }
}

function showDashboard(role) {
    document.getElementById('login-container').style.display = 'none';
    document.getElementById('dashboard').style.display = 'block';
    document.getElementById('user-tag').innerText = `(${role} MODE)`;
    const container = document.getElementById('spreadsheet-container');
    let mode = (role === "EDITOR") ? "edit" : "preview";
    container.innerHTML = `<iframe src="https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/${mode}?rm=minimal"></iframe>`;
}

async function fetchDashboardData() {
    try {
        const response = await fetch(WEB_APP_URL);
        const data = await response.json();
        
        if(data.status === "success") {
            // Update Top Cards
            document.getElementById('total-income').innerText = "KES " + (data.finance.income || 0).toLocaleString();
            document.getElementById('total-expense').innerText = "KES " + (data.finance.expense || 0).toLocaleString();
            const netBal = data.finance.balance || 0;
            const netEl = document.getElementById('total-balance');
            netEl.innerText = "KES " + netBal.toLocaleString();
            netEl.style.color = netBal >= 0 ? "green" : "red";

            // Setup Weekly Navigation
            weeklyDataGrouped = data.weeklyHistory;
            weekKeys = Object.keys(weeklyDataGrouped).sort((a,b) => new Date(b) - new Date(a)); // Newest first
            currentWeekIndex = 0;
            updateWeeklyDisplay();

            // Cell Leaderboard
            document.getElementById('leaderboard-data').innerHTML = data.topCells
                .map((c, i) => `<div class="leaderboard-item" style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #eee;"><span>#${i+1} ${c[0]}</span><b>${Number(c[1]).toLocaleString()}</b></div>`).join('');

            // Members Table
            document.querySelector('#members-table tbody').innerHTML = data.members
                .map(m => `<tr><td><b>${m[0]}</b></td><td>${m[1]}</td><td>${m[2]}</td><td>${m[3]}</td><td>${m[4]}</td></tr>`).join('');

            // Monthly Progress Table
            let gHtml = "<table class='growth-table' style='width:100%; border-collapse:collapse;'><thead><tr style='background:#f4f4f4;'><th>Month</th><th>Income</th><th>Exp</th><th>Bal</th></tr></thead><tbody>";
            data.growth.forEach(r => {
                gHtml += `<tr><td><b>${r.month}</b></td><td>${Number(r.inc).toLocaleString()}</td><td>${Number(r.exp).toLocaleString()}</td><td style="color:${r.bal >= 0 ? 'green' : 'red'}"><b>${Number(r.bal).toLocaleString()}</b></td></tr>`;
            });
            document.getElementById('growth-chart-data').innerHTML = gHtml + "</tbody></table>";
        }
    } catch (e) { console.error("Data fetch error:", e); }
}

function updateWeeklyDisplay() {
    if (weekKeys.length === 0) return;
    const dateKey = weekKeys[currentWeekIndex];
    const weekData = weeklyDataGrouped[dateKey];
    
    document.getElementById('week-label').innerText = dateKey;

    // Income Side
    let incHtml = weekData.income.map(item => `<li>${item.name} <b>${Number(item.amount).toLocaleString()}</b></li>`).join('');
    incHtml += `<li style="border-top:2px solid #eee; margin-top:5px; font-weight:bold;">TOTAL INCOME <b>${(weekData.totals.inc || 0).toLocaleString()}</b></li>`;
    document.getElementById('income-details').innerHTML = incHtml;

    // Expenditure Side
    let expHtml = weekData.expense.map(item => `<li>${item.name} <b>${Number(item.amount).toLocaleString()}</b></li>`).join('');
    expHtml += `<li style="border-top:2px solid #eee; margin-top:5px; font-weight:bold;">TOTAL EXPENDITURE <b>${(weekData.totals.exp || 0).toLocaleString()}</b></li>`;
    
    // Weekly Balance Row
    const wBal = weekData.totals.bal || 0;
    expHtml += `<li style="color:${wBal >= 0 ? 'green' : 'red'}; font-weight:bold; font-size: 1.1em;">BALANCE <b>${wBal.toLocaleString()}</b></li>`;
    document.getElementById('expense-details').innerHTML = expHtml;
}

function changeWeek(direction) {
    currentWeekIndex += direction;
    if (currentWeekIndex < 0) currentWeekIndex = 0;
    if (currentWeekIndex >= weekKeys.length) currentWeekIndex = weekKeys.length - 1;
    updateWeeklyDisplay();
}

function switchTab(t) {
    document.querySelectorAll('.tab-content, .tab-btn').forEach(el => el.classList.remove('active'));
    document.getElementById('tab-' + t).classList.add('active');
    event.currentTarget.classList.add('active');
}

function logout() { localStorage.removeItem('ackRole'); location.reload(); }













