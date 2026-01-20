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
            // Summary Cards from Dynamic Annual Records Scan
            document.getElementById('total-income').innerText = "KES " + (Number(data.finance.income) || 0).toLocaleString();
            document.getElementById('total-expense').innerText = "KES " + (Number(data.finance.expense) || 0).toLocaleString();
            
            const bal = Number(data.finance.balance) || 0;
            const balEl = document.getElementById('total-balance');
            balEl.innerText = "KES " + bal.toLocaleString();
            balEl.style.color = bal >= 0 ? "#28a745" : "#dc3545"; // Green for positive, red for negative

            // Weekly Breakdown Lists
            document.getElementById('income-details').innerHTML = data.finance.details
                .map(r => Number(r[2]) > 0 ? `<li>${r[1]} <b>${Number(r[2]).toLocaleString()}</b></li>` : '').join('');
            
            document.getElementById('expense-details').innerHTML = data.finance.details
                .map(r => Number(r[3]) > 0 ? `<li>${r[1]} <b>${Number(r[3]).toLocaleString()}</b></li>` : '').join('');

            // Leaderboard
            document.getElementById('leaderboard-data').innerHTML = data.topCells
                .map((c, i) => `
                <div style="display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid #eee;">
                    <span>#${i+1} ${c[0]}</span><b>${Number(c[1]).toLocaleString()}</b>
                </div>`).join('');

            // Members Table
            document.querySelector('#members-table tbody').innerHTML = data.members
                .map(m => `<tr><td><b>${m[0]}</b></td><td>${m[1]}</td><td>${m[2]}</td><td>${m[3]}</td><td>${m[4]}</td></tr>`).join('');

            // Monthly Progress Table
            let growthHtml = "<table class='growth-table'><thead><tr><th>Month</th><th>Income</th><th>Exp</th><th>Bal</th></tr></thead><tbody>";
            data.growth.forEach(r => {
                growthHtml += `<tr>
                    <td><b>${r.month}</b></td>
                    <td>${Number(r.inc).toLocaleString()}</td>
                    <td>${Number(r.exp).toLocaleString()}</td>
                    <td style="color:${r.bal >= 0 ? 'green' : 'red'}"><b>${Number(r.bal).toLocaleString()}</b></td>
                </tr>`;
            });
            document.getElementById('growth-chart-data').innerHTML = growthHtml + "</tbody></table>";
        }
    } catch (e) { console.error("Sync Error:", e); }
}

function switchTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('tab-' + tabName).classList.add('active');
    event.currentTarget.classList.add('active');
}

function logout() { localStorage.removeItem('ackRole'); location.reload(); }











