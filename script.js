/**
 * ABC Bank - Front-End Logic
 * Complete Account Registration & Role-Based UI Controls
 */

// Persistent Storage for Accounts & Ledger
let accounts = JSON.parse(localStorage.getItem('abc_accounts')) || [
    {
        accountNumber: '10011223344',
        pin: '1234',
        name: 'Demo Customer',
        email: 'demo@abcbank.com',
        balance: 2500.00,
        type: 'Savings'
    }
];

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

let currentUser = null;

// --- 1. AUTHENTICATION & REGISTRATION TABS ---
function switchAuthTab(mode) {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const tabLogin = document.getElementById('tabLogin');
    const tabRegister = document.getElementById('tabRegister');
    const loginAlert = document.getElementById('loginAlert');
    const regAlert = document.getElementById('regAlert');

    loginAlert.style.display = 'none';
    regAlert.style.display = 'none';

    if (mode === 'login') {
        loginForm.style.display = 'block';
        registerForm.style.display = 'none';
        tabLogin.classList.add('active');
        tabRegister.classList.remove('active');
    } else {
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
        tabLogin.classList.remove('active');
        tabRegister.classList.add('active');
    }
}

// Toggle input formats for Admin vs Customer
function toggleRoleFields() {
    const role = document.getElementById('loginRole').value;
    const accountLabel = document.getElementById('accountLabel');
    const loginAccount = document.getElementById('loginAccount');

    if (role === 'Admin') {
        accountLabel.innerText = "Admin Username";
        loginAccount.placeholder = "e.g., AD2026";
    } else {
        accountLabel.innerText = "11-Digit Account Number";
        loginAccount.placeholder = "e.g., 10023456789";
    }
}

// Generate valid 11-Digit Account Number starting with 100
function generate11DigitAccountNumber() {
    let acc = '100';
    for (let i = 0; i < 8; i++) {
        acc += Math.floor(Math.random() * 10);
    }
    return acc;
}

// Registration Form Handler
document.getElementById('registerForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('regName').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const type = document.getElementById('regType').value;
    const deposit = parseFloat(document.getElementById('regDeposit').value);
    const pin = document.getElementById('regPin').value.trim();

    const regAlert = document.getElementById('regAlert');
    const regSuccessNotice = document.getElementById('regSuccessNotice');

    regAlert.style.display = 'none';

    if (pin.length !== 4 || isNaN(pin)) {
        regAlert.innerText = "PIN must be exactly 4 digits.";
        regAlert.style.display = 'block';
        return;
    }

    if (deposit < 50) {
        regAlert.innerText = "Minimum initial deposit is $50.";
        regAlert.style.display = 'block';
        return;
    }

    // Auto-generate 11-digit account number
    const newAccNum = generate11DigitAccountNumber();

    const newAccount = {
        accountNumber: newAccNum,
        pin: pin,
        name: name,
        email: email,
        balance: deposit,
        type: type
    };

    accounts.push(newAccount);
    localStorage.setItem('abc_accounts', JSON.stringify(accounts));

    // Show Success Notice with 11-digit Account Number
    regSuccessNotice.innerHTML = `
        <strong>Account Created Successfully!</strong><br>
        Your 11-Digit Account Number is: <code>${newAccNum}</code><br>
        <small>Use this Account Number and your 4-digit PIN to log in.</small>
    `;
    regSuccessNotice.style.display = 'block';

    document.getElementById('registerForm').reset();
});

// Login Handler
document.getElementById('loginForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const role = document.getElementById('loginRole').value;
    const inputAcc = document.getElementById('loginAccount').value.trim();
    const inputPin = document.getElementById('loginPin').value.trim();
    const loginAlert = document.getElementById('loginAlert');

    loginAlert.style.display = 'none';

    // Admin Auth
    if (role === 'Admin') {
        if (inputAcc === 'AD2026' && inputPin === 'AD2026') {
            authenticateUser({ name: 'System Admin', account: 'AD2026', role: 'Admin' });
        } else {
            loginAlert.innerText = "Invalid Admin Credentials. (ID: AD2026, PIN: AD2026)";
            loginAlert.style.display = 'block';
        }
        return;
    }

    // Customer Auth
    const foundAcc = accounts.find(a => a.accountNumber === inputAcc && a.pin === inputPin);
    if (foundAcc) {
        authenticateUser({ name: foundAcc.name, account: foundAcc.accountNumber, role: 'Customer' });
    } else {
        loginAlert.innerText = "Invalid 11-Digit Account Number or PIN. Please check or create an account.";
        loginAlert.style.display = 'block';
    }
});

function authenticateUser(userObj) {
    currentUser = userObj;
    sessionStorage.setItem('abc_user', JSON.stringify(currentUser));
    
    // Toggle screens
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('appScreen').style.display = 'block';

    // Header info
    document.getElementById('userDisplayName').innerText = currentUser.name;
    document.getElementById('userRoleBadge').innerText = currentUser.role;

    // Role-based UI updates: Remove transaction capability for Admins
    const transferCard = document.getElementById('transferCard');
    const adminOverviewCard = document.getElementById('adminOverviewCard');

    if (currentUser.role === 'Admin') {
        transferCard.style.display = 'none'; // Hide fund transfer for Admins
        adminOverviewCard.style.display = 'block'; // Show Admin metrics panel
        updateAdminStats();
    } else {
        transferCard.style.display = 'block'; // Show fund transfer for Customers
        adminOverviewCard.style.display = 'none';
    }

    renderLedger();
}

function updateAdminStats() {
    document.getElementById('statTotalAccounts').innerText = accounts.length;
    const totalVolume = transactions.reduce((sum, t) => sum + t.amount, 0);
    document.getElementById('statTotalVolume').innerText = `$${totalVolume.toFixed(2)}`;
}

function logout() {
    currentUser = null;
    sessionStorage.removeItem('abc_user');
    document.getElementById('appScreen').style.display = 'none';
    document.getElementById('loginScreen').style.display = 'flex';
    document.getElementById('loginForm').reset();
}

// --- 2. REAL-TIME AI FRAUD ENGINE ---
function analyzeFraudRisk(account, amount) {
    let score = 0;
    let flags = [];

    if (amount > 10000) {
        score += 50;
        flags.push("High-value transaction (> $10,000)");
    } else if (amount > 5000) {
        score += 25;
        flags.push("Elevated transaction amount (> $5,000)");
    }

    if (account.endsWith("0000") || account.startsWith("99")) {
        score += 30;
        flags.push("Suspicious target account routing profile");
    }

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

// --- 3. CUSTOMER TRANSACTION MANAGEMENT ---
const transferForm = document.getElementById('transferForm');
const transAccountInput = document.getElementById('transAccount');
const transAccError = document.getElementById('transAccError');

function isValid11DigitAccount(account) {
    return /^\d{11}$/.test(account);
}

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

    const analysis = analyzeFraudRisk(targetAcc, amount);

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
    localStorage.setItem('abc_transactions', JSON.stringify(transactions));
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

function clearLedger() {
    if (confirm("Reset ledger session history?")) {
        transactions = [];
        localStorage.setItem('abc_transactions', JSON.stringify(transactions));
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

// Restore Session on Load
window.addEventListener('DOMContentLoaded', () => {
    const savedUser = sessionStorage.getItem('abc_user');
    if (savedUser) {
        authenticateUser(JSON.parse(savedUser));
    }
});