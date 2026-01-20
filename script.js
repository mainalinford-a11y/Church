 * ACK GITUNDU - STABLE VERSION
 */

const SPREADSHEET_ID = "1NOl0KMh6HA5cteNHYcXEtCq9voN4-kRFjVi-kiowkZs";
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbzV22XjDFuIplf2Wpc8WEcyF3ucI2aNeGnWtyXXVCqynXdqfLLG8lEM3INJ5UKdga_esQ/exec"; 
const CODES = { ADMIN: "TR-2026", VIEW: "COM-2026" };

let weeklyDataGrouped = {};
let weekKeys = [];
let currentWeekIndex = 0;
let rawMemberGiving = []; 

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
    let role = null;

    if (val === CODES.ADMIN) role = "EDITOR";
    else if (val === CODES.VIEW) role = "VIEWER";

    if (role) {
        localStorage.setItem('ackRole', role);
        showDashboard(role);
        fetchDashboardData();
    } else {
        alert("Incorrect code.");
    }
}

function showDashboard(role) {
    document.getElementById('login-container').style.display = 'none';
    document.getElementById('dashboard').style.display = 'block';
    const container = document.getElementById('spreadsheet-container');
    const mode = (role === "EDITOR") ? "edit" : "preview";
    container.innerHTML = `<iframe src="https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/${mode}?rm=minimal"></iframe>`;
}

async function fetchDashboardData() {
    try {
        const response = await fetch(WEB_APP_URL);
        const data = await response.json();
        
        if (data.status === "success") {
            // Cards
            document.getElementById('total-income').innerText = "KES " + (data.finance.income || 0).toLocaleString();
            document.getElementById('total-expense').innerText = "KES " + (data.finance.expense || 0).toLocaleString();
            const bal = data.finance.balance || 0;
            const bEl = document.getElementById('total-balance');
            bEl.innerText = "KES " + bal.toLocaleString();
            bEl.style.color = bal >= 0 ? "#27ae60" : "#e74c3c";

            // Weekly Processing
            rawMemberGiving = data.memberGiving || [];
            weeklyDataGrouped = data.weeklyHistory || {};
            weekKeys = Object.keys(weeklyDataGrouped)
                .filter(d => new Date(d).getFullYear() === 2026)
                .sort((a, b) => new Date(a) - new Date(b));
            
            currentWeekIndex = weekKeys.length - 1;
            updateWeeklyDisplay();

            // Members Table
            const tbody = document.querySelector('#members-table tbody');
            if (tbody) {
                tbody.innerHTML = data.members.map(m => {
                    return `<tr>
                        <td><b>${m[0]}</b></td>
                        <td>${m[1]}</td>
                        <td>Active</td>
                        <td><button class="statement-btn" onclick="viewStatement('${m[0].replace(/'/g, "\\'")}')">Statement</button></td>
                    </tr>`;
                }).join('');
            }

            // Growth Table
            const gDiv = document.getElementById('monthly-table-data');
            if (gDiv) {
                let h = "<table><thead><tr><th>Month</th><th>Income</th><th>Expense</th><th>Balance</th></tr></thead><tbody>";
                data.growth.forEach(r => {
                    h += `<tr><td>${r.month}</td><td>${Number(r.inc).toLocaleString()}</td><td>${Number(r.exp).toLocaleString()}</td><td style="color:${r.bal >= 0 ? 'green':'red'}">${Number(r.bal).toLocaleString()}</td></tr>`;
                });
                gDiv.innerHTML = h + "</tbody></table>";
            }
        }
    } catch (e) { console.error(e); }
}

function updateWeeklyDisplay() {
    if (weekKeys.length === 0) return;
    const dateStr = weekKeys[currentWeekIndex];
    const week = weeklyDataGrouped[dateStr];
    document.getElementById('week-label').innerText = new Date(dateStr).toLocaleDateString('en-GB', {day:'numeric', month:'short', year:'numeric'});

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

    document.getElementById('income-details').innerHTML = incH + `<li class="total-row">TOTAL <span>${incT.toLocaleString()}</span></li>`;
    document.getElementById('expense-details').innerHTML = expH + `<li class="total-row">TOTAL <span>${expT.toLocaleString()}</span></li>`;
}

async function viewStatement(name) {
    const start = prompt("Start Date (YYYY-MM-DD):", "2026-01-01");
    const end = prompt("End Date (YYYY-MM-DD):", "2026-12-31");
    if (!start || !end) return;

    const url = `${WEB_APP_URL}?action=getStatement&name=${encodeURIComponent(name)}&start=${start}&end=${end}`;
    try {
        const res = await fetch(url);
        const d = await res.json();
        alert(`Name: ${d.name}\nTotal: KES ${d.summary.total.toLocaleString()}\nCheck console for details.`);
        console.table(d.history);
    } catch (e) { alert("Error."); }
}

function changeWeek(n) { currentWeekIndex += n; if(currentWeekIndex<0) currentWeekIndex=0; if(currentWeekIndex>=weekKeys.length) currentWeekIndex=weekKeys.length-1; updateWeeklyDisplay(); }
function switchTab(id, b) {
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active-content'));
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById('tab-'+id).classList.add('active-content');
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




























