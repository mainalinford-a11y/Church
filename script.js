const SPREADSHEET_ID = "YOUR_SPREADSHEET_ID_HERE";
const WEB_APP_URL = "YOUR_WEB_APP_URL_HERE"; 
const CODES = { ADMIN: "TR-2026", VIEW: "COM-2026" };

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
    } else { alert("Incorrect Code."); }
}

function showDashboard(role) {
    document.getElementById('login-container').style.display = 'none';
    document.getElementById('dashboard').style.display = 'block';
    document.getElementById('user-tag').innerText = `(${role} MODE)`;
    const mode = (role === "EDITOR") ? "edit" : "preview";
    document.getElementById('spreadsheet-container').innerHTML = `<iframe src="https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/${mode}?rm=minimal"></iframe>`;
}

async function fetchDashboardData() {
    try {
        const response = await fetch(WEB_APP_URL);
        const data = await response.json();
        
        // Cards - Forced Number Conversion to avoid NaN
        document.getElementById('total-income').innerText = "KES " + (Number(data.finance.income) || 0).toLocaleString();
        document.getElementById('total-expense').innerText = "KES " + (Number(data.finance.expense) || 0).toLocaleString();
        const bal = Number(data.finance.balance) || 0;
        document.getElementById('total-balance').innerText = "KES " + bal.toLocaleString();
        document.getElementById('total-balance').style.color = bal >= 0 ? "green" : "red";

        // Weekly List
        document.getElementById('income-details').innerHTML = data.finance.details
            .map(r => Number(r[2]) > 0 ? `<li>${r[1]} <b>${Number(r[2]).toLocaleString()}</b></li>` : '').join('');
        document.getElementById('expense-details').innerHTML = data.finance.details
            .map(r => Number(r[3]) > 0 ? `<li>${r[1]} <b>${Number(r[3]).toLocaleString()}</b></li>` : '').join('');

        // Leaderboard
        document.getElementById('leaderboard-data').innerHTML = data.topCells
            .map((c, i) => `<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #eee;"><span>#${i+1} ${c[0]}</span><b>${(Number(c[1]) || 0).toLocaleString()}</b></div>`).join('');

        // Members
        document.querySelector('#members-table tbody').innerHTML = data.members
            .map(m => `<tr><td><b>${m[0]}</b></td><td>${m[1]}</td><td>${m[2]}</td><td>${m[3]}</td><td>${m[4]}</td></tr>`).join('');

        // Monthly
        let gHtml = "<table class='growth-table'><thead><tr><th>Month</th><th>Income</th><th>Exp</th><th>Bal</th></tr></thead><tbody>";
        data.growth.forEach(r => {
            gHtml += `<tr><td><b>${r.month}</b></td><td>${(Number(r.inc) || 0).toLocaleString()}</td><td>${(Number(r.exp) || 0).toLocaleString()}</td><td style="color:${r.bal >= 0 ? 'green' : 'red'}"><b>${(Number(r.bal) || 0).toLocaleString()}</b></td></tr>`;
        });
        document.getElementById('growth-chart-data').innerHTML = gHtml + "</tbody></table>";
        
    } catch (e) { console.error("Sync Error:", e); }
}

function switchTab(t) {
    document.querySelectorAll('.tab-content, .tab-btn').forEach(el => el.classList.remove('active'));
    document.getElementById('tab-' + t).classList.add('active');
    event.currentTarget.classList.add('active');
}

function logout() { localStorage.removeItem('ackRole'); location.reload(); }










