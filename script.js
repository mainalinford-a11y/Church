const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbzV22XjDFuIplf2Wpc8WEcyF3ucI2aNeGnWtyXXVCqynXdqfLLG8lEM3INJ5UKdga_esQ/exec"; 
const CODES = { ADMIN: "TR-2026", VIEW: "COM-2026" };

window.onload = () => {
    const saved = localStorage.getItem('ackRole');
    if (saved) {
        showDashboard(saved);
        fetchDashboardData();
    }
};

function switchTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('tab-' + tabName).classList.add('active');
    event.currentTarget.classList.add('active');
}

async function fetchDashboardData() {
    try {
        const response = await fetch(WEB_APP_URL);
        const data = await response.json();
        
        // 1. Finance Numbers
        document.getElementById('total-income').innerText = "KES " + Number(data.finance.income).toLocaleString();
        document.getElementById('total-expense').innerText = "KES " + Number(data.finance.expense).toLocaleString();
        document.getElementById('sync-time').innerText = data.lastUpdated;

        // 2. Leaderboard
        let lbHtml = data.topCells.map((cell, i) => `
            <div style="display:flex; justify-content:space-between; padding:10px; border-bottom:1px solid #eee;">
                <span><b>#${i+1}</b> ${cell[0]}</span>
                <span>KES ${Number(cell[1]).toLocaleString()}</span>
            </div>`).join('');
        document.getElementById('leaderboard-data').innerHTML = lbHtml;

        // 3. Members Table
        const memBody = document.querySelector('#members-table tbody');
        memBody.innerHTML = data.members.map(m => `<tr><td>${m[0]}</td><td>${m[1]}</td><td>${m[2]}</td><td>${m[3]}</td><td>${m[4]}</td></tr>`).join('');

        // 4. Giving Table
        const giveBody = document.querySelector('#giving-table tbody');
        giveBody.innerHTML = data.giving.map(g => `<tr><td>${new Date(g[0]).toLocaleDateString()}</td><td>${g[1]}</td><td>${g[2]}</td><td>${g[4]}</td><td>${g[3]}</td><td>${g[6]}</td></tr>`).join('');

    } catch (e) { console.error("Sync Error:", e); }
}

function checkLogin() {
    const code = document.getElementById('pass').value;
    let role = (code === CODES.ADMIN) ? "EDITOR" : (code === CODES.VIEW ? "VIEWER" : null);
    if (role) {
        localStorage.setItem('ackRole', role);
        showDashboard(role);
        fetchDashboardData();
    } else { alert("Invalid Code"); }
}

function showDashboard(role) {
    document.getElementById('login-container').style.display = 'none';
    document.getElementById('dashboard').style.display = 'block';
}

function searchTable(tableId, colIdx) {
    let input = document.getElementById('memberSearch').value.toUpperCase();
    let rows = document.getElementById(tableId).getElementsByTagName('tr');
    for (let i = 1; i < rows.length; i++) {
        let txt = rows[i].getElementsByTagName('td')[colIdx].innerText;
        rows[i].style.display = txt.toUpperCase().indexOf(input) > -1 ? "" : "none";
    }
}

function logout() { localStorage.removeItem('ackRole'); location.reload(); }
