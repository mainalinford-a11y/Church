const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbzV22XjDFuIplf2Wpc8WEcyF3ucI2aNeGnWtyXXVCqynXdqfLLG8lEM3INJ5UKdga_esQ/exec"; 
const CODES = { ADMIN: "TR-2026", VIEW: "COM-2026" };

window.onload = () => {
    const saved = localStorage.getItem('ackRole');
    if (saved) {
        showDashboard(saved);
        fetchDashboardData();
    }
};

function checkLogin() {
    const code = document.getElementById('pass').value;
    let role = (code === CODES.ADMIN) ? "EDITOR" : (code === CODES.VIEW ? "VIEWER" : null);
    if (role) {
        localStorage.setItem('ackRole', role);
        showDashboard(role);
        fetchDashboardData();
    } else { alert("Access Denied"); }
}

function showDashboard(role) {
    document.getElementById('login-container').style.display = 'none';
    document.getElementById('dashboard').style.display = 'block';
    
    // Security: Only show spreadsheet link for the Treasurer
    if (role === "EDITOR") {
        document.querySelectorAll('.admin-only').forEach(el => el.style.display = 'block');
        document.getElementById('user-tag').innerText = " (Treasurer)";
    } else {
        document.getElementById('user-tag').innerText = " (Committee)";
    }
}

async function fetchDashboardData() {
    try {
        const response = await fetch(WEB_APP_URL);
        const data = await response.json();
        
        if(data.status === "success") {
            // 1. Finance Summaries
            document.getElementById('total-income').innerText = "KES " + data.finance.income.toLocaleString();
            document.getElementById('total-expense').innerText = "KES " + data.finance.expense.toLocaleString();
            
            // 2. Breakdowns
            let incHtml = data.finance.details.map(row => row[1] > 0 ? `<li>${row[0]}: <b>KES ${row[1].toLocaleString()}</b></li>` : '').join('');
            let expHtml = data.finance.details.map(row => row[3] > 0 ? `<li>${row[0]}: <b>KES ${row[3].toLocaleString()}</b></li>` : '').join('');
            document.getElementById('income-details').innerHTML = incHtml || "<li>No specific entries.</li>";
            document.getElementById('expense-details').innerHTML = expHtml || "<li>No specific entries.</li>";

            // 3. Leaderboard
            document.getElementById('leaderboard-data').innerHTML = data.topCells.map((cell, i) => `
                <div class="rank-row">
                    <span><b>#${i+1}</b> ${cell[0]}</span>
                    <span>KES ${Number(cell[1]).toLocaleString()}</span>
                </div>`).join('');

            // 4. Members Table
            document.querySelector('#members-table tbody').innerHTML = data.members.map(m => `
                <tr><td>${m[0]}</td><td>${m[1]}</td><td>${m[2]}</td><td>${m[3]}</td><td>${m[4]}</td></tr>`).join('');

            // 5. Monthly Growth Table
            const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            let growthHtml = "<table class='growth-table'><thead><tr><th>Month</th><th>Income</th><th>Expense</th></tr></thead><tbody>";
            data.growth.forEach((row, i) => {
                if (row[0] > 0 || row[1] > 0) {
                    growthHtml += `<tr><td>${months[i]}</td><td>KES ${row[0].toLocaleString()}</td><td>KES ${row[1].toLocaleString()}</td></tr>`;
                }
            });
            document.getElementById('growth-chart-data').innerHTML = growthHtml + "</tbody></table>";

            document.getElementById('sync-time').innerText = data.lastUpdated;
        }
    } catch (e) { console.error("Sync Error", e); }
}

function switchTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('tab-' + tabName).classList.add('active');
    event.currentTarget.classList.add('active');
}

function toggleDetails(id) {
    const el = document.getElementById(id);
    el.style.display = el.style.display === "none" ? "block" : "none";
}

function searchTable() {
    let input = document.getElementById('memberSearch').value.toUpperCase();
    let rows = document.querySelector("#members-table tbody").rows;
    for (let i = 0; i < rows.length; i++) {
        let name = rows[i].cells[0].innerText.toUpperCase();
        rows[i].style.display = name.indexOf(input) > -1 ? "" : "none";
    }
}

function logout() { localStorage.removeItem('ackRole'); location.reload(); }

