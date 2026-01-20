const SPREADSHEET_ID = "1NOl0KMh6HA5cteNHYcXEtCq9voN4-kRFjVi-kiowkZs";
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbzV22XjDFuIplf2Wpc8WEcyF3ucI2aNeGnWtyXXVCqynXdqfLLG8lEM3INJ5UKdga_esQ/exec"; 
const CODES = { ADMIN: "TR-2026", VIEW: "COM-2026" };

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
            // Annual Cards - Pulled from the main summary
            document.getElementById('total-income').innerText = "KES " + (data.finance.income || 0).toLocaleString();
            document.getElementById('total-expense').innerText = "KES " + (data.finance.expense || 0).toLocaleString();
            const bal = data.finance.balance || 0;
            const balEl = document.getElementById('total-balance');
            balEl.innerText = "KES " + bal.toLocaleString();
            balEl.style.color = bal >= 0 ? "#27ae60" : "#e74c3c";

            // Weekly History - Sort chronologically (Jan to Dec)
            weeklyDataGrouped = data.weeklyHistory;
            weekKeys = Object.keys(weeklyDataGrouped).sort((a,b) => new Date(a) - new Date(b));
            currentWeekIndex = 0; 
            updateWeeklyDisplay();

            // Cell Analytics
            document.getElementById('cell-analytics-data').innerHTML = data.topCells
                .map((c, i) => `<div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid #eee;">
                    <span><b>${i+1}. ${c[0]}</b></span>
                    <span>KES ${Number(c[1]).toLocaleString()}</span>
                </div>`).join('');

            // Members Tab Full List
            document.querySelector('#members-table tbody').innerHTML = data.members
                .map(m => `<tr><td><b>${m[0]}</b></td><td>${m[1]}</td><td>${m[2]}</td><td>${m[3]}</td><td>${m[4]}</td></tr>`).join('');

            // Monthly Progress Tab
            let mHtml = "<table><thead><tr><th>Month</th><th>Income</th><th>Expense</th><th>Balance</th></tr></thead><tbody>";
            data.growth.forEach(r => {
                mHtml += `<tr><td><b>${r.month}</b></td><td>${Number(r.inc).toLocaleString()}</td><td>${Number(r.exp).toLocaleString()}</td><td style="color:${r.bal >= 0 ? 'green' : 'red'}">${Number(r.bal).toLocaleString()}</td></tr>`;
            });
            document.getElementById('monthly-table-data').innerHTML = mHtml + "</tbody></table>";
        }
    } catch (e) { console.error("Fetch Error:", e); }
}

function updateWeeklyDisplay() {
    if (weekKeys.length === 0) return;
    const dateKey = weekKeys[currentWeekIndex];
    const weekData = weeklyDataGrouped[dateKey];
    document.getElementById('week-label').innerText = dateKey;

    // INTERNAL MATH LOGIC: 
    // We filter out any row that contains the word "TOTAL" to avoid double-counting
    let calcIncomeTotal = 0;
    let incHtml = weekData.income
        .filter(i => !i.name.toUpperCase().includes("TOTAL"))
        .map(i => {
            const val = parseFloat(i.amount) || 0;
            calcIncomeTotal += val;
            return `<li>${i.name} <span>${val.toLocaleString()}</span></li>`;
        }).join('');
    
    incHtml += `<li class="total-row">TOTAL INCOME <span>${calcIncomeTotal.toLocaleString()}</span></li>`;
    document.getElementById('income-details').innerHTML = incHtml;

    let calcExpenseTotal = 0;
    let expHtml = weekData.expense
        .filter(e => !e.name.toUpperCase().includes("TOTAL"))
        .map(e => {
            const val = parseFloat(e.amount) || 0;
            calcExpenseTotal += val;
            return `<li>${e.name} <span>${val.toLocaleString()}</span></li>`;
        }).join('');

    const weeklyBalance = calcIncomeTotal - calcExpenseTotal;
    
    expHtml += `<li class="total-row">TOTAL EXPENDITURE <span>${calcExpenseTotal.toLocaleString()}</span></li>`;
    expHtml += `<li style="color:${weeklyBalance >= 0 ? '#27ae60' : '#e74c3c'}; font-weight:bold; border:none; margin-top:5px; font-size:1.1rem;">WEEKLY BALANCE <span>${weeklyBalance.toLocaleString()}</span></li>`;
    document.getElementById('expense-details').innerHTML = expHtml;
}

function changeWeek(dir) {
    currentWeekIndex += dir;
    if (currentWeekIndex < 0) currentWeekIndex = 0;
    if (currentWeekIndex >= weekKeys.length) currentWeekIndex = weekKeys.length - 1;
    updateWeeklyDisplay();
}

function switchTab(id, btn) {
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active-content'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('tab-' + id).classList.add('active-content');
    btn.classList.add('active');
}

function searchTable() {
    let input = document.getElementById('memberSearch').value.toUpperCase();
    let rows = document.querySelector("#members-table tbody").rows;
    for (let i = 0; i < rows.length; i++) {
        rows[i].style.display = rows[i].cells[0].innerText.toUpperCase().includes(input) ? "" : "none";
    }
}

function logout() { localStorage.removeItem('ackRole'); location.reload(); }


















