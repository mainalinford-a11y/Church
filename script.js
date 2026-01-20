const WEB_APP_URL = "YOUR_NEW_DEPLOYMENT_URL_HERE"; 
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
    document.getElementById('admin-controls').style.display = role === "EDITOR" ? 'block' : 'none';
    document.getElementById('viewer-controls').style.display = role === "VIEWER" ? 'block' : 'none';
    document.getElementById('user-tag').innerText = ` (${role} Mode)`;
}

async function fetchDashboardData() {
    try {
        const response = await fetch(WEB_APP_URL);
        const data = await response.json();
        
        if(data.status === "success") {
            // 1. Weekly Finance Summary
            document.getElementById('total-income').innerText = "KES " + data.finance.income.toLocaleString();
            document.getElementById('total-expense').innerText = "KES " + data.finance.expense.toLocaleString();
            
            // Handle Weekly Balance (Optional: You can add a balance ID to your HTML)
            const balanceVal = data.finance.income - data.finance.expense;
            const balanceEl = document.getElementById('total-balance');
            if(balanceEl) { balanceEl.innerText = "KES " + balanceVal.toLocaleString(); }

            // 2. Weekly Details Breakdown
            document.getElementById('income-details').innerHTML = data.finance.details
                .map(row => row[1] > 0 ? `<li>${row[0]}: <b>KES ${row[1].toLocaleString()}</b></li>` : '').join('');
            document.getElementById('expense-details').innerHTML = data.finance.details
                .map(row => row[3] > 0 ? `<li>${row[0]}: <b>KES ${row[3].toLocaleString()}</b></li>` : '').join('');

            // 3. Cell Leaderboard
            document.getElementById('leaderboard-data').innerHTML = data.topCells.map((cell, i) => `
                <div class="rank-row">
                    <span><b>#${i+1}</b> ${cell[0]}</span>
                    <span>KES ${Number(cell[1]).toLocaleString()}</span>
                </div>`).join('');

            // 4. Member Register
            document.querySelector('#members-table tbody').innerHTML = data.members.map(m => `
                <tr><td>${m[0]}</td><td>${m[1]}</td><td>${m[2]}</td><td>${m[3]}</td><td>${m[4]}</td></tr>`).join('');

            // 5. Monthly Financial Growth
            const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
            let growthHtml = "<table class='growth-table'><thead><tr><th>Month</th><th>Income</th><th>Expense</th><th>Balance</th></tr></thead><tbody>";
            
            data.growth.forEach((row, i) => {
                const bal = row[0] - row[1];
                const balClass = bal >= 0 ? "pos-bal" : "neg-bal";
                growthHtml += `
                    <tr>
                        <td><b>${months[i] || "Period " + (i+1)}</b></td>
                        <td>KES ${row[0].toLocaleString()}</td>
                        <td>KES ${row[1].toLocaleString()}</td>
                        <td class="${balClass}">KES ${bal.toLocaleString()}</td>
                    </tr>`;
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

function searchTable() {
    let input = document.getElementById('memberSearch').value.toUpperCase();
    let rows = document.querySelector("#members-table tbody").rows;
    for (let i = 0; i < rows.length; i++) {
        let name = rows[i].cells[0].innerText.toUpperCase();
        rows[i].style.display = name.indexOf(input) > -1 ? "" : "none";
    }
}

function logout() { localStorage.removeItem('ackRole'); location.reload(); }






