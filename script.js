const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbzV22XjDFuIplf2Wpc8WEcyF3ucI2aNeGnWtyXXVCqynXdqfLLG8lEM3INJ5UKdga_esQ/exec"; 
const CODES = { ADMIN: "TR-2026", VIEW: "COM-2026" };

window.onload = () => {
    const saved = localStorage.getItem('ackRole');
    if (saved) {
        showDashboard(saved);
        fetchLeaderboard();
    }
};

async function fetchLeaderboard() {
    try {
        const response = await fetch(WEB_APP_URL);
        const data = await response.json();
        const container = document.getElementById('leaderboard-data');
        let html = "<div class='leaderboard-grid'>";
        data.topCells.forEach((cell, index) => {
            html += `<div class='rank-item'><span class='rank'>#${index + 1}</span><span class='name'>${cell[0]}</span><span class='amount'>KES ${Number(cell[1]).toLocaleString()}</span></div>`;
        });
        container.innerHTML = html + "</div>";
        document.getElementById('sync-time').innerText = data.lastUpdated;
    } catch (e) { console.log("Leaderboard load failed"); }
}

function checkLogin() {
    const code = document.getElementById('pass').value;
    let role = (code === CODES.ADMIN) ? "EDITOR" : (code === CODES.VIEW ? "VIEWER" : null);
    if (role) {
        localStorage.setItem('ackRole', role);
        showDashboard(role);
        fetchLeaderboard();
    } else { alert("Access Denied"); }
}

function showDashboard(role) {
    document.getElementById('login-container').style.display = 'none';
    document.getElementById('dashboard').style.display = 'block';
    const isAdmin = (role === "EDITOR");
    document.getElementById('user-status').innerText = isAdmin ? "Treasurer Access" : "Committee View";
    document.querySelectorAll('.edit-only').forEach(el => el.style.display = isAdmin ? 'block' : 'none');
}

function logout() { localStorage.removeItem('ackRole'); location.reload(); }

async function apiCall(action) {
    const btn = event.target;
    btn.innerText = "Processing...";
    btn.disabled = true;

    const data = { action: action };
    if (action === 'addMember') {
        data.name = document.getElementById('mName').value;
        data.cell = document.getElementById('mCell').value;
    } else if (action === 'addStream') {
        data.streamName = document.getElementById('streamName').value;
    } else if (action === 'submitGiving') {
        data.date = document.getElementById('gDate').value;
        data.name = document.getElementById('gName').value;
        data.cell = document.getElementById('gCell').value;
        data.tithe = document.getElementById('gTithe').value;
        data.pledge = document.getElementById('gPledge').value;
        data.thanks = document.getElementById('gThanks').value;
    }

    try {
        await fetch(WEB_APP_URL, {
            method: 'POST',
            mode: 'no-cors', 
            body: JSON.stringify(data)
        });
        alert("Success! Entry recorded.");
        if(action === 'submitGiving') location.reload(); // Refresh to show new leaderboard totals
    } catch (e) {
        alert("Connection Error.");
    } finally {
        btn.disabled = false;
        btn.innerText = "Complete";
    }
}
