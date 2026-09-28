/**
 * ABC Bank - Front-End Logic
 * Clean, Modular, and Persistent State Engine
 */

// Global State
let currentUser = null;
let transactions = JSON.parse(localStorage.getItem('abc_transactions')) || [
    {
        id: 'TXN-90481',
        account: '10011223344',
        type: 'Debit',
        amount: 200.00,
        timestamp: '2026-09-28 10:15',
        score: 12,
        level: 'Low',
        badgeClass: 'risk-low'
    }
];

// --- 1. AUTHENTICATION & LOGIN LOGIC ---
const loginForm = document.getElementById('loginForm');
const loginRole = document.getElementById('loginRole');
const loginAccount = document.getElementById('loginAccount');
const loginPin = document.getElementById('loginPin');
const loginAlert = document.getElementById('loginAlert');
const accountLabel = document.getElementById('accountLabel');

// Toggle label based on selected role
function toggleRoleFields() {
    if (loginRole.value === 'Admin') {
        accountLabel.innerText = "Admin Username";
        loginAccount.placeholder = "e.g., AD2026";
    } else {
        accountLabel.innerText = "11-Digit Account Number";
        loginAccount.placeholder = "e.g., 10023456789";
    }
    loginAlert.style.display = 'none';
}

// Validate 11-digit account formatting
function isValid11DigitAccount(account) {
    return /^\d{11}$/.test(account);
}

loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    loginAlert.style.display = 'none';

    const role = loginRole.value;
    const account = loginAccount.value.trim();
    const pin = loginPin.value.trim();

    // Admin Authentication Check
    if (role === 'Admin') {
        if (account === 'AD2026' && pin === 'AD2026') {
            authenticateUser({ name: 'System Admin', account: 'AD2026', role: 'Admin' });
        } else {
            showLoginError("Invalid Admin Credentials. (Use ID: AD2026, PIN: AD2026)");
        }
        return;
    }

    // Customer Authentication Check
    if (!isValid11DigitAccount(account)) {
        showLoginError("Account number must be exactly 11 digits.");
        return;
    }

    if (pin.length !== 4 || isNaN(pin)) {
        showLoginError("PIN must be a 4-digit number.");
        return;
    }

    authenticateUser({ name: `Customer (${account.slice(-4)})`, account: account, role: 'Customer' });
});

function showLoginError(msg) {
    loginAlert.innerText = msg;
    loginAlert.style.display = 'block';
}

function authenticateUser(userObj) {
    currentUser = userObj;
    sessionStorage.setItem('abc_user', JSON.stringify(currentUser));
    
    // Switch Views
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('appScreen').style.display = 'block';

    // Update Header UI
    document.getElementById('userDisplayName').innerText = currentUser.account;
    document.getElementById('userRoleBadge').innerText = currentUser.role;

    renderLedger();
}

function logout() {
    currentUser = null;
    sessionStorage.removeItem('abc_user');
    document.getElementById('appScreen').style.display = 'none';
    document.getElementById('loginScreen').style.display = 'flex';
    loginForm.reset();
}

// --- 2. AI FRAUD DETECTION ENGINE ---
function analyzeFraudRisk(account, amount) {
    let score = 0;
    let flags = [];

    // Rule 1: High Transaction Value Anomaly
    if (amount > 10000) {
        score += 50;
        flags.push("High-value transaction (> $10,000)");
    } else if (amount > 5000) {
        score += 25;
        flags.push("Elevated transaction amount (> $5,000)");
    }

    // Rule 2: Account Number Formatting Anomaly
    if (account.endsWith("0000") || account.startsWith("99")) {
        score += 30;
        flags.push("Suspicious target account routing profile");
    }

    // Rule 3: Velocity Spike Simulation
    if (Math.random() < 0.25) {
        score += 20;
        flags.push("Unusual activity time/frequency spike");
    }

    let level = "Low";
    let color = "var(--accent-color)";
    let badgeClass = "risk-low";

    if (score >= 60) {
        level = "High";
        color = "var(--danger-color)";
        badgeClass = "risk-high";
    } else if (score >= 30) {
        level = "Medium";
        color = "var(--warning-color)";
        badgeClass = "risk-medium";
    }

    return { score, level, flags, color, badgeClass };
}

// --- 3. TRANSACTION MANAGEMENT & LEDGER ---
const transferForm = document.getElementById('transferForm');
const transAccountInput = document.getElementById('transAccount');
const transAccError = document.getElementById('transAccError');

transAccountInput.addEventListener('input', () => {
    if (transAccountInput.value.length > 0 && !isValid11DigitAccount(transAccountInput.value)) {
        transAccError.style.display = 'block';
    } else {
        transAccError.style.display = 'none';
    }
});

transferForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const targetAcc = transAccountInput.value.trim();
    const amount = parseFloat(document.getElementById('transAmount').value);
    const type = document.getElementById('transType').value;

    if (!isValid11DigitAccount(targetAcc)) {
        transAccError.style.display = 'block';
        return;
    }

    // Execute Fraud Analysis
    const analysis = analyzeFraudRisk(targetAcc, amount);

    // Update AI Telemetry Box
    const fraudAlert = document.getElementById('fraudAlert');
    const riskMeter = document.getElementById('riskMeter');
    const riskScoreText = document.getElementById('riskScoreText');

    riskMeter.style.width = analysis.score + '%';
    riskMeter.style.backgroundColor = analysis.color;
    riskScoreText.innerText = `Score: ${analysis.score} / 100 (${analysis.level} Risk)`;

    if (analysis.flags.length > 0) {
        fraudAlert.innerHTML = `<strong>Status [${analysis.level} Risk]:</strong><br>` + 
            analysis.flags.map(f => `• ${f}`).join('<br>');
    } else {
        fraudAlert.innerHTML = `<strong>Status [Safe]:</strong> Transaction fits customer's historical behavioral baseline.`;
    }

    // Append New Record
    const newTxn = {
        id: 'TXN-' + Math.floor(10000 + Math.random() * 90000),
        account: targetAcc,
        type: type,
        amount: amount,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
        score: analysis.score,
        level: analysis.level,
        badgeClass: analysis.badgeClass
    };

    transactions.unshift(newTxn);
    saveLedger();
    renderLedger();

    transferForm.reset();
});

function renderLedger() {
    const tableBody = document.getElementById('transactionTable');
    tableBody.innerHTML = '';

    transactions.forEach(txn => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${txn.id}</td>
            <td>${txn.account}</td>
            <td>${txn.type}</td>
            <td>$${txn.amount.toFixed(2)}</td>
            <td>${txn.timestamp}</td>
            <td><span class="risk-badge ${txn.badgeClass}">${txn.level} (${txn.score})</span></td>
        `;
        tableBody.appendChild(row);
    });
}

function saveLedger() {
    localStorage.setItem('abc_transactions', JSON.stringify(transactions));
}

function clearLedger() {
    if (confirm("Reset ledger session history?")) {
        transactions = [];
        saveLedger();
        renderLedger();
    }
}

// --- 4. INTELLIGENT GOAL ENGINE ---
function calculateGoal() {
    const name = document.getElementById('goalName').value || 'Target Savings';
    const target = parseFloat(document.getElementById('goalTarget').value);
    const resultBox = document.getElementById('goalResult');

    if (!target || target <= 0) {
        alert('Please enter a valid target amount.');
        return;
    }

    const monthly = (target / 12).toFixed(2);
    const weekly = (target / 52).toFixed(2);

    resultBox.style.display = 'block';
    resultBox.innerHTML = `
        <strong>AI Plan for "${name}":</strong><br>
        To reach $${target.toLocaleString()} in 12 months:<br>
        • Deposit <strong>$${monthly}/month</strong> or <strong>$${weekly}/week</strong>.<br>
        <em>Smart auto-transfer strategy enabled.</em>
    `;
}

// Restore Session on Page Load
window.addEventListener('DOMContentLoaded', () => {
    const savedUser = sessionStorage.getItem('abc_user');
    if (savedUser) {
        authenticateUser(JSON.parse(savedUser));
    }
});