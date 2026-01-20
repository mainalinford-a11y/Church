const SPREADSHEET_ID = "1NOl0KMh6HA5cteNHYcXEtCq9voN4-kRFjVi-kiowkZs";
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbzV22XjDFuIplf2Wpc8WEcyF3ucI2aNeGnWtyXXVCqynXdqfLLG8lEM3INJ5UKdga_esQ/exec"; 
 const CODES = { ADMIN: "TR-2026", VIEW: "COM-2026" };

// 2. STATE
let weeklyDataGrouped = {};
let weekKeys = [];
let currentWeekIndex = 0;
let rawMemberGiving = []; 

// 3. LOGIN & STARTUP
window.onload = function() {
    const saved = localStorage.getItem('ackRole');
    if (saved) {
        showDashboard(saved);
        fetchDashboardData();
    }
};

function checkLogin() {
    const passInput = document.getElementById('pass');
    if (!passInput) return;
    
    const val = passInput.value.trim();
    let role = (val === CODES.ADMIN) ? "EDITOR" : (val === CODES.VIEW ? "VIEWER" : null);

    if (role) {
        localStorage.setItem('ackRole', role);
        showDashboard(role);
        fetchDashboardData();
    } else {
        alert("Incorrect Access Code.");
    }
}

function showDashboard(role) {
    document.getElementById('login-container').style.display = 'none';
    document.getElementById('dashboard').style.display = 'block';
    const container = document.getElementById('spreadsheet-container');
    const mode = (role === "EDITOR") ? "edit" : "preview";
    container.innerHTML = `<iframe src="https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/${mode}?rm=minimal"></iframe>`;
}

// 4. DATA HANDLING
async function fetchDashboardData() {
    try {
        const response = await fetch(WEB_APP_URL);
        const data = await response.json();
        
        if (data.status === "success") {
            // Update Top Cards
            document.getElementById('total-income').innerText = "KES " + (data.finance.income || 0).toLocaleString();
            document.getElementById('total-expense').innerText = "KES " + (data.finance.expense || 0).toLocaleString();
            const bal = data.finance.balance || 0;
            const bEl = document.getElementById('total-balance');
            bEl.innerText = "KES " + bal.toLocaleString();
            bEl.style.color = bal >= 0 ? "#27ae60" : "#e74c3c";

            // Process Weekly Data (STRICT 2026 FILTER)
            rawMemberGiving = data.memberGiving || [];
            weeklyDataGrouped = data.weeklyHistory || {};
            weekKeys = Object.keys(weeklyDataGrouped)
                .filter(d => new Date(d).getFullYear() === 2026)
                .sort((a, b) => new Date(a) - new Date(b));
            
            currentWeekIndex = 0;
            updateWeeklyDisplay();

            // Build Members Table with Statement Button
            const tbody = document.querySelector('#members-table tbody');
            if (tbody) {
                tbody.innerHTML = data.members.map(m => {
                    const cleanName = m[0].replace(/'/g, ""); // Remove apostrophes to prevent crashes
                    return `<tr>
                        <td><b>${m[0]}</b></td>
                        <td>${m[1]}</td>
                        <td>Active</td>
                        <td><button class="statement-btn" onclick="viewStatement('${cleanName}')">View Statement</button></td>
                    </tr>`;
                }).join('');
            }

            // Build Growth Table
            const gDiv = document.getElementById('monthly-table-data');
            if (gDiv) {
                let h = "<table><thead><tr><th>Month</th><th>Income</th><th>Expense</th><th>Balance</th></tr></thead><tbody>";
                data.growth.forEach(r => {
                    h += `<tr><td><b>${r.month}</b></td><td>${Number(r.inc).toLocaleString()}</td><td>${Number(r.exp).toLocaleString()}</td><td style="color:${r.bal >= 0 ? 'green':'red'}">${Number(r.bal).toLocaleString()}</td></tr>`;
                });
                gDiv.innerHTML = h + "</tbody></table>";
            }
        }
    } catch (e) { console.error("Data Load Error:", e); }
}

// 5. UI UPDATES
function updateWeeklyDisplay() {
    if (weekKeys.length === 0) {
        document.getElementById('week-label').innerText = "No 2026 Data";
        return;
    }
    const dateStr = weekKeys[currentWeekIndex];
    const week = weeklyDataGrouped[dateStr];
    document.getElementById('week-label').innerText = new Date(dateStr).toLocaleDateString('en-GB', {day:'numeric', month:'long', year:'numeric'});

    const clean = (v) => parseFloat(String(v).replace(/,/g, '')) || 0;
    let incT = 0, expT = 0;
    
    let incH = week.income.filter(i => i.name && !i.name.toUpperCase().includes("TOTAL") && clean(i.amount) > 0).map(i => {
        incT += clean(i.amount);
        return `<li>${i.name} <span>${clean(i.amount).toLocaleString()}</span></li>`;
    }).join('');
    
    let expH = week.expense.filter(e => e.name && !e.name.toUpperCase().includes("TOTAL") && clean(e.amount) > 0).map(e => {
        expT += clean(e.amount);
        return `<li>${e.name} <span>${clean(e.amount).toLocaleString()}</span></li>`;
    }).join('');

    document.getElementById('income-details').innerHTML = (incH || "<li>No income recorded</li>") + `<li class="total-row">TOTAL <span>${incT.toLocaleString()}</span></li>`;
    document.getElementById('expense-details').innerHTML = (expH || "<li>No expense recorded</li>") + `<li class="total-row">TOTAL <span>${expT.toLocaleString()}</span></li>`;
}

// 6. STATEMENT FEATURE
async function viewStatement(name) {
    const start = prompt("Start Date (YYYY-MM-DD):", "2026-01-01");
    if (!start) return;

    const url = `${WEB_APP_URL}?action=getStatement&name=${encodeURIComponent(name)}&start=${start}`;
    try {
        const res = await fetch(url);
        const d = await res.json();
        if (!d.history || d.history.length === 0) return alert("No records found.");

        let msg = `STATEMENT: ${d.name}\n`;
        msg += `Total: KES ${d.summary.total.toLocaleString()}\n\n`;
        msg += `Recent History:\n`;
        d.history.slice(0, 10).forEach(h => msg += `${h.date}: ${h.total.toLocaleString()}\n`);
        alert(msg);
    } catch (e) { alert("Could not load statement."); }
}

// 7. UTILS
function changeWeek(n) { 
    currentWeekIndex += n; 
    if(currentWeekIndex < 0) currentWeekIndex = 0; 
    if(currentWeekIndex >= weekKeys.length) currentWeekIndex = weekKeys.length - 1; 
    updateWeeklyDisplay(); 
}
function switchTab(id, b) {
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active-content'));
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById('tab-' + id).classList.add('active-content');
    b.classList.add('active');
}
function logout() { localStorage.removeItem('ackRole'); location.reload(); }
function searchTable() {
    let val = document.getElementById('memberSearch').value.toUpperCase();
    let rows = document.querySelector("#members-table tbody").rows;
    for (let i = 0; i < rows.length; i++) {
        rows[i].style.display = rows[i].innerText.toUpperCase().includes(val) ? "" : "none";
    }
}






























