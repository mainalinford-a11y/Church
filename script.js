const SPREADSHEET_ID = "1NOl0KMh6HA5cteNHYcXEtCq9voN4-kRFjVi-kiowkZs";
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbzV22XjDFuIplf2Wpc8WEcyF3ucI2aNeGnWtyXXVCqynXdqfLLG8lEM3INJ5UKdga_esQ/exec"; 
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

    const container = document.getElementById('spreadsheet-container');
    let sheetUrl = role === "EDITOR" 
        ? `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/edit?rm=minimal` 
        : `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/preview?rm=minimal`;
    
    container.innerHTML = `<iframe src="${sheetUrl}"></iframe>`;
}

async function fetchDashboardData() {
    try {
        const response = await fetch(WEB_APP_URL);
        const data = await response.json();
        
        if(data.status === "success") {
            // Cards
            document.getElementById('total-income').innerText = "KES " + Number(data.finance.income).toLocaleString();
            document.getElementById('total-expense').innerText = "KES " + Number(data.finance.expense).toLocaleString();
            const balEl = document.getElementById('total-balance');
            balEl.innerText = "KES " + Number(data.finance.balance).toLocaleString();
            balEl.style.color = data.finance.balance >= 0 ? "var(--success)" : "var(--danger)";

            // Weekly Lists (Based on Col C & D mapping)
            document.getElementById('income-details').innerHTML = data.finance.details
                .map(row => row[2] > 0 ? `<li>${row[1]} <b>${Number(row[2]).toLocaleString()}</b></li>` : '').join('');
            document.getElementById('expense-details').innerHTML = data.finance.details
                .map(row => row[3] > 0 ? `<li>${row[1]} <b>${Number(row[3]).toLocaleString()}</b></li>` : '').join('');

            // Leaderboard
            document.getElementById('leaderboard-data').innerHTML = data.topCells.map((cell, i) => `
                <div style="display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid #f0f0f0;">
                    <span>#${i+1} ${cell[0]}</span><b>${Number(cell[1]).toLocaleString()}</b>
                </div>`).join('');

            // Members
            document.querySelector('#members-table tbody').innerHTML = data.members.map(m => `
                <tr><td><b>${m[0]}</b></td><td>${m[1]}</td><td>${m[2]}</td><td>${m[3]}</td><td>${m[4]}</td></tr>`).join('');

            // Monthly Progress (Fixed Column Mapping)
            let growthHtml = "<table class='growth-table'><thead><tr><th>Month</th><th>Income</th><th>Exp</th><th>Bal</th></tr></thead><tbody>";
            data.growth.forEach((row) => {
                growthHtml += `<tr>
                    <td><b>${row.month}</b></td>
                    <td>${Number(row.inc).toLocaleString()}</td>
                    <td>${Number(row.exp).toLocaleString()}</td>
                    <td style="color:${row.bal >= 0 ? 'green' : 'red'}"><b>${Number(row.bal).toLocaleString()}</b></td>
                </tr>`;
            });
            document.getElementById('growth-chart-data').innerHTML = growthHtml + "</tbody></table>";
        }
    } catch (e) { console.error(e); }
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







