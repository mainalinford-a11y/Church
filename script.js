// REPLACE THIS WITH YOUR ACTUAL GOOGLE SCRIPT DEPLOYMENT ID
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbzV22XjDFuIplf2Wpc8WEcyF3ucI2aNeGnWtyXXVCqynXdqfLLG8lEM3INJ5UKdga_esQ/exec"; 

const CODES = { 
    ADMIN: "TR-2026", // Treasurer Code
    VIEW: "COM-2026"  // Committee Code
};

// Check for saved session on load
window.onload = () => {
    const savedRole = localStorage.getItem('ackRole');
    if (savedRole) { 
        showDashboard(savedRole); 
        fetchDashboardData(); 
    }
};

// Handle Login Logic
function checkLogin() {
    const code = document.getElementById('pass').value;
    let role = null;

    if (code === CODES.ADMIN) role = "EDITOR";
    else if (code === CODES.VIEW) role = "VIEWER";

    if (role) {
        localStorage.setItem('ackRole', role);
        showDashboard(role);
        fetchDashboardData();
    } else {
        alert("Incorrect Access Code.");
    }
}

// UI Switcher: Login -> Dashboard
function showDashboard(role) {
    document.getElementById('login-container').style.display = 'none';
    document.getElementById('dashboard').style.display = 'block';
    
    // Show/Hide Admin Controls based on role
    const adminPanel = document.getElementById('admin-controls');
    if (role === "EDITOR") {
        adminPanel.style.display = 'block';
    } else {
        adminPanel.style.display = 'none';
    }

    document.getElementById('user-tag').innerText = `(${role} MODE)`;
}

// MAIN DATA SYNC FUNCTION
async function fetchDashboardData() {
    try {
        const syncLabel = document.getElementById('sync-time');
        syncLabel.innerText = "Syncing...";

        const response = await fetch(WEB_APP_URL);
        const data = await response.json();
        
        if(data.status === "success") {
            // 1. UPDATE SUMMARY CARDS
            document.getElementById('total-income').innerText = "KES " + Number(data.finance.income).toLocaleString();
            document.getElementById('total-expense').innerText = "KES " + Number(data.finance.expense).toLocaleString();
            
            // Balance Card Logic (Green if positive, Red if negative)
            const balEl = document.getElementById('total-balance');
            const balVal = Number(data.finance.balance);
            balEl.innerText = "KES " + balVal.toLocaleString();
            balEl.style.color = balVal >= 0 ? "var(--success)" : "var(--danger)";

            // 2. UPDATE WEEKLY BREAKDOWN LISTS
            // Map logic: Income is in Col C (Index 2), Expense is in Col E (Index 4)
            const incomeHtml = data.finance.details
                .filter(row => Number(row[2]) > 0)
                .map(row => `<li><span>${row[1]}</span> <b>${Number(row[2]).toLocaleString()}</b></li>`)
                .join('');
            
            const expenseHtml = data.finance.details
                .filter(row => Number(row[4]) > 0)
                .map(row => `<li><span>${row[1]}</span> <b>${Number(row[4]).toLocaleString()}</b></li>`)
                .join('');

            document.getElementById('income-details').innerHTML = incomeHtml || "<li style='color:#ccc'>No income recorded</li>";
            document.getElementById('expense-details').innerHTML = expenseHtml || "<li style='color:#ccc'>No expenses recorded</li>";

            // 3. UPDATE LEADERBOARD
            const leaderboardHtml = data.topCells.map((cell, i) => `
                <div class="rank-row">
                    <span><div class="rank-badge">${i+1}</div> ${cell[0]}</span>
                    <span>KES ${Number(cell[1]).toLocaleString()}</span>
                </div>`).join('');
            document.getElementById('leaderboard-data').innerHTML = leaderboardHtml;

            // 4. UPDATE MEMBERS TABLE
            const membersHtml = data.members.map(m => `
                <tr>
                    <td><b>${m[0]}</b></td>
                    <td>${m[1]}</td>
                    <td>${m[2]}</td>
                    <td>${m[3]}</td>
                    <td>${m[4]}</td>
                </tr>`).join('');
            document.querySelector('#members-table tbody').innerHTML = membersHtml;

            // 5. UPDATE MONTHLY PROGRESS TABLE
            const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            let growthHtml = "<table class='growth-table'><thead><tr><th>Month</th><th>Income</th><th>Exp</th><th>Bal</th></tr></thead><tbody>";
            
            data.growth.forEach((row, i) => {
                const inc = row[0];
                const exp = row[1];
                const bal = inc - exp;
                // Use month name from array or generic label
                const monthName = months[i] || `Period ${i+1}`; 
                
                growthHtml += `
                    <tr>
                        <td>${monthName}</td>
                        <td>${Number(inc).toLocaleString()}</td>
                        <td>${Number(exp).toLocaleString()}</td>
                        <td class="${bal >= 0 ? 'pos-bal' : 'neg-bal'}">${Number(bal).toLocaleString()}</td>
                    </tr>`;
            });
            document.getElementById('growth-chart-data').innerHTML = growthHtml + "</tbody></table>";

            // Update timestamp
            syncLabel.innerText = data.lastUpdated;

        } else {
            console.error("Data Status Error:", data);
            alert("Error loading data. Check console.");
        }
    } catch (e) {
        console.error("Fetch Error:", e);
        document.getElementById('sync-time').innerText = "Sync Failed";
    }
}

// TAB SWITCHING LOGIC
function switchTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    // Remove active class from buttons
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    
    // Show selected tab
    document.getElementById('tab-' + tabName).classList.add('active');
    // Highlight button (event.currentTarget works on click)
    event.currentTarget.classList.add('active');
}

// TABLE SEARCH LOGIC
function searchTable() {
    let input = document.getElementById('memberSearch').value.toUpperCase();
    let rows = document.querySelector("#members-table tbody").rows;
    for (let i = 0; i < rows.length; i++) {
        let name = rows[i].cells[0].innerText.toUpperCase();
        if (name.indexOf(input) > -1) {
            rows[i].style.display = "";
        } else {
            rows[i].style.display = "none";
        }
    }
}

// ADD MEMBER LOGIC (Admin Only)
function addMember() {
    const name = document.getElementById('newMemName').value;
    const cell = document.getElementById('newMemCell').value;
    
    if(!name || !cell) return alert("Please fill in Name and Cell Group");

    // Show loading state
    const btn = document.querySelector('.add-member-form button');
    const originalText = btn.innerText;
    btn.innerText = "Saving...";
    btn.disabled = true;

    fetch(WEB_APP_URL, {
        method: 'POST',
        body: JSON.stringify({ action: "addMember", name: name, cell: cell })
    })
    .then(response => response.text())
    .then(result => {
        alert("Member Added Successfully!");
        document.getElementById('newMemName').value = "";
        document.getElementById('newMemCell').selectedIndex = 0;
        
        // Refresh data to show new member
        fetchDashboardData();
    })
    .catch(error => {
        console.error("Error:", error);
        alert("Failed to add member.");
    })
    .finally(() => {
        btn.innerText = originalText;
        btn.disabled = false;
    });
}

// LOGOUT
function logout() {
    localStorage.removeItem('ackRole');
    location.reload();
}



