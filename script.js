// --- CONFIGURATION ---
const SPREADSHEET_ID = "1NOl0KMh6HA5cteNHYcXEtCq9voN4-kRFjVi-kiowkZs";
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbzV22XjDFuIplf2Wpc8WEcyF3ucI2aNeGnWtyXXVCqynXdqfLLG8lEM3INJ5UKdga_esQ/exec"; 
const CODES = { ADMIN: "TR-2026", VIEW: "COM-2026" };

// --- SYSTEM LOGIC ---
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

    // Embedded Spreadsheet Logic
    const container = document.getElementById('spreadsheet-container');
    let sheetUrl = "";
    if (role === "EDITOR") {
        sheetUrl = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/edit?rm=minimal`;
    } else {
        sheetUrl = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/preview?rm=minimal`;
    }
    container.innerHTML = `<iframe src="${sheetUrl}"></iframe>`;
}

async function fetchDashboardData() {
    try {
        const response = await fetch(WEB_APP_URL);
        const data = await response.json();
        if(data.status === "success") {
            // Summary Cards
            document.getElementById('total-income').innerText = "KES " + Number(data.finance.income).toLocaleString();
            document.getElementById('total-expense').innerText = "KES " + Number(data.finance.expense).toLocaleString();
            document.getElementById('total-balance').innerText = "KES " + Number(data.finance.balance).toLocaleString();
            
            // Weekly Details (Income Index 1, Exp Index 3)
            document.getElementById('income-details').innerHTML = data.finance.details
                .map(row => row[1] > 0 ? `<li>${row[0]} <b>${Number(row[1]).toLocaleString()}</b></li>` : '').join('');
            document.getElementById('expense-details').innerHTML = data.finance.details
                .map(row => row[3] > 0 ? `<li>${row[0]} <b>${Number(row[3]).toLocaleString()}</b></li>` : '').join('');

            // Leaderboard
            document.getElementById('leaderboard-data').innerHTML = data.topCells.map((cell, i) => `
                <div style="display:flex; justify-content:space-between; padding:5px 0; border-bottom:1px solid #eee;">
                    <span>#${i+1} ${cell[0]}</span><span>${Number(cell[1]).toLocaleString()}</span>
                </div>`).join('');

            // Members Table
            document.querySelector('#members-table tbody').innerHTML = data.members.map(m => `
                <tr><td><b>${m[0]}</b></td><td>${m[1]}</td><td>${m[2]}</td><td>${m[3]}</td><td>${m[4]}</td></tr>`).join('');

            // Monthly Progress (Fixed Column Mapping)
            const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            let growthHtml = "<table class='growth-table'><thead><tr><th>Month</th><th>Income</th><th>Exp</th><th>Bal</th></tr></thead><tbody>";
            data.growth.forEach((row, i) => {
                growthHtml += `<tr><td><b>${months[i] || 'M'+(i+1)}</b></td><td>${row.inc.toLocaleString()}</td><td>${row.exp.toLocaleString()}</td><td class="${row.bal >= 0 ? 'pos-bal' : 'neg-bal'}">${row.bal.toLocaleString()}</td></tr>`;
            });
            document.getElementById('growth-chart-data').innerHTML = growthHtml + "</tbody></table>";
        }
    } catch (e) { console.error("Sync Error", e); }
}

function switchTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('tab-' + tabName).classList.add('active');
    event.currentTarget.classList.add('active');
}

function searchTable() {
    let input = document.getElementById('memberSearch').value.toUpperCase();
    let rows = document.querySelector("#members-table tbody").rows;
    for (let i = 0; i < rows.length; i++) {
        rows[i].style.display = rows[i].cells[0].innerText.toUpperCase().includes(input) ? "" : "none";
    }
}

function logout() { localStorage.removeItem('ackRole'); location.reload(); }






