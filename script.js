const SPREADSHEET_ID = "YOUR_SPREADSHEET_ID_HERE";
const WEB_APP_URL = "YOUR_APPS_SCRIPT_URL_HERE"; 

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
    } else { alert("Access Denied."); }
}

function showDashboard(role) {
    document.getElementById('login-container').style.display = 'none';
    document.getElementById('dashboard').style.display = 'block';
    document.getElementById('user-tag').innerText = `(${role} MODE)`;

    // SPREADSHEET PERMISSION LOGIC
    const container = document.getElementById('spreadsheet-container');
    let sheetUrl = "";

    if (role === "EDITOR") {
        // Full Edit Access for Treasurer
        sheetUrl = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/edit?rm=minimal`;
    } else {
        // Read-Only Preview for Committee
        sheetUrl = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/preview?rm=minimal`;
    }

    container.innerHTML = `<iframe src="${sheetUrl}"></iframe>`;
}

async function fetchDashboardData() {
    try {
        const response = await fetch(WEB_APP_URL);
        const data = await response.json();
        if(data.status === "success") {
            // Summary Card Data
            document.getElementById('total-income').innerText = "KES " + Number(data.finance.income).toLocaleString();
            document.getElementById('total-expense').innerText = "KES " + Number(data.finance.expense).toLocaleString();
            document.getElementById('total-balance').innerText = "KES " + Number(data.finance.balance).toLocaleString();
            
            // Weekly Details
            document.getElementById('income-details').innerHTML = data.finance.details
                .map(row => row[1] > 0 ? `<li>${row[0]}: <b>${Number(row[1]).toLocaleString()}</b></li>` : '').join('');
            document.getElementById('expense-details').innerHTML = data.finance.details
                .map(row => row[3] > 0 ? `<li>${row[0]}: <b>${Number(row[3]).toLocaleString()}</b></li>` : '').join('');

            // Leaderboard
            document.getElementById('leaderboard-data').innerHTML = data.topCells.map((cell, i) => `
                <div class="rank-row"><span>#${i+1} ${cell[0]}</span><span>${Number(cell[1]).toLocaleString()}</span></div>`).join('');

            // Members
            document.querySelector('#members-table tbody').innerHTML = data.members.map(m => `
                <tr><td>${m[0]}</td><td>${m[1]}</td><td>${m[2]}</td><td>${m[3]}</td><td>${m[4]}</td></tr>`).join('');
        }
    } catch (e) { console.error(e); }
}

function switchTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('tab-' + tabName).classList.add('active');
    event.currentTarget.classList.add('active');
}

function logout() { localStorage.removeItem('ackRole'); location.reload(); }







