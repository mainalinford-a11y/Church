// CONFIGURATION - REPLACE WITH YOUR DATA
const WEB_APP_URL = "YOUR_APPS_SCRIPT_URL_HERhttps://script.google.com/macros/s/AKfycbzV22XjDFuIplf2Wpc8WEcyF3ucI2aNeGnWtyXXVCqynXdqfLLG8lEM3INJ5UKdga_esQ/execE";
const CODES = {
    ADMIN: "TR-2026", // Treasurer/Secretary Code
    VIEW: "COM-2026"  // Committee Code
};

// 1. CHECK SESSION ON LOAD
window.onload = function () {
    const savedRole = localStorage.getItem('churchRole');
    if (savedRole) {
        showDashboard(savedRole);
    }
};

// 2. LOGIN LOGIC
function checkLogin() {
    const code = document.getElementById('pass').value;
    let role = null;

    if (code === CODES.ADMIN) role = "EDITOR";
    else if (code === CODES.VIEW) role = "VIEWER";

    if (role) {
        localStorage.setItem('churchRole', role);
        showDashboard(role);
    } else {
        alert("Invalid Access Code");
    }
}

// 3. UI TOGGLE
function showDashboard(role) {
    document.getElementById('login-container').style.display = 'none';
    document.getElementById('dashboard').style.display = 'block';

    const isAdmin = (role === "EDITOR");
    document.getElementById('user-status').innerText = isAdmin ? "Mode: Treasurer/Secretary" : "Mode: Committee (View Only)";

    // Hide edit features if viewer
    const editElements = document.querySelectorAll('.edit-only');
    editElements.forEach(el => {
        el.style.display = isAdmin ? 'block' : 'none';
    });
}

// 4. LOGOUT
function logout() {
    localStorage.removeItem('churchRole');
    location.reload();
}

// 5. API CALLS TO GOOGLE SHEETS
async function apiCall(action) {
    const btn = event.target;
    const originalText = btn.innerText;
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
        data.tithe = document.getElementById('gTithe').value;
        data.pledge = document.getElementById('gPledge').value;
    }

    try {
        await fetch(WEB_APP_URL, {
            method: 'POST',
            mode: 'no-cors', // Essential for Google Apps Script
            body: JSON.stringify(data)
        });
        alert("Success! Spreadsheet has been updated.");
    } catch (e) {
        alert("Error connecting to system.");
    } finally {
        btn.innerText = originalText;
        btn.disabled = false;
    }
}