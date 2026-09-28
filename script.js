// --- 1. Strong 11-Digit Account Validation Logic ---
const accInput = document.getElementById('accNum');
const accError = document.getElementById('accError');

function validateAccount(account) {
    // Must be exactly 11 numeric digits
    const regex = /^\d{11}$/;
    return regex.test(account);
}

accInput.addEventListener('input', () => {
    if (accInput.value.length > 0 && !validateAccount(accInput.value)) {
        accError.style.display = 'block';
    } else {
        accError.style.display = 'none';
    }
});

// --- 2. AI Fraud Detection Engine Logic ---
function analyzeFraudRisk(account, amount, type) {
    let score = 0;
    let flags = [];

    // Rule 1: High Transaction Value
    if (amount > 10000) {
        score += 45;
        flags.push("High-value anomaly (> $10,000)");
    } else if (amount > 5000) {
        score += 25;
        flags.push("Elevated transaction amount");
    }

    // Rule 2: Account Pattern Checks
    if (account.endsWith("0000") || account.startsWith("99")) {
        score += 30;
        flags.push("Suspicious account range profile");
    }

    // Rule 3: Dynamic Velocity Spike Simulation
    if (Math.random() < 0.2) {
        score += 20;
        flags.push("Unusual activity time/velocity spike");
    }

    // Determine Risk Level
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

// --- 3. Form Submission & Transaction Management ---
const transferForm = document.getElementById('transferForm');
const transactionTable = document.getElementById('transactionTable');
const fraudAlert = document.getElementById('fraudAlert');
const riskMeter = document.getElementById('riskMeter');
const riskScoreText = document.getElementById('riskScoreText');

transferForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const account = accInput.value;
    const amount = parseFloat(document.getElementById('transAmount').value);
    const type = document.getElementById('transType').value;

    if (!validateAccount(account)) {
        accError.style.display = 'block';
        return;
    }

    // Run Fraud Engine
    const analysis = analyzeFraudRisk(account, amount, type);

    // Update AI Display UI
    riskMeter.style.width = analysis.score + '%';
    riskMeter.style.backgroundColor = analysis.color;
    riskScoreText.innerText = `Score: ${analysis.score} / 100 (${analysis.level} Risk)`;

    if (analysis.flags.length > 0) {
        fraudAlert.innerHTML = `<strong>Status [${analysis.level} Risk]:</strong><br>` + 
            analysis.flags.map(f => `• ${f}`).join('<br>');
    } else {
        fraudAlert.innerHTML = `<strong>Status [Safe]:</strong> Transaction fits normal behavioral profile.`;
    }

    // Add Entry to Transaction Table
    const txnId = 'TXN-' + Math.floor(10000 + Math.random() * 90000);
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 16);

    const row = document.createElement('tr');
    row.innerHTML = `
        <td>${txnId}</td>
        <td>${account}</td>
        <td>${type}</td>
        <td>$${amount.toFixed(2)}</td>
        <td>${timestamp}</td>
        <td><span class="risk-badge ${analysis.badgeClass}">${analysis.level} (${analysis.score})</span></td>
    `;
    transactionTable.prepend(row);

    // Reset form
    transferForm.reset();
});

// --- 4. Intelligent Financial Goal Engine ---
function calculateGoal() {
    const name = document.getElementById('goalName').value || 'Target Goal';
    const target = parseFloat(document.getElementById('goalTarget').value);
    const resultBox = document.getElementById('goalResult');

    if (!target || target <= 0) {
        alert('Please enter a valid target amount');
        return;
    }

    const monthlyVal = (target / 12).toFixed(2);
    const weeklyVal = (target / 52).toFixed(2);

    resultBox.style.display = 'block';
    resultBox.innerHTML = `
        <strong>AI Plan for "${name}":</strong><br>
        To reach $${target.toLocaleString()} in 12 months:<br>
        • Save <strong>$${monthlyVal}/month</strong> or <strong>$${weeklyVal}/week</strong>.<br>
        <em>Automated allocation can be set up via user settings.</em>
    `;
}