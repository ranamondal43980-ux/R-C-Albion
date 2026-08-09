const loginView = document.getElementById('login-view');
const dashboardView = document.getElementById('dashboard-view');
const loginEmail = document.getElementById('login-email');
const loginPassword = document.getElementById('login-password');
const loginBtn = document.getElementById('login-btn');
const loginStatus = document.getElementById('login-status');
const logoutBtn = document.getElementById('logout-btn');
const loggedInAs = document.getElementById('logged-in-as');
const reportsList = document.getElementById('reports-list');
const dashboardStatus = document.getElementById('dashboard-status');

function showDashboard(session) {
    loginView.classList.add('hidden');
    dashboardView.classList.remove('hidden');
    loggedInAs.textContent = `Logged in as ${session.user.email}`;
    loadReports();
}

function showLogin() {
    dashboardView.classList.add('hidden');
    loginView.classList.remove('hidden');
}

async function checkSession() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session) {
        showDashboard(session);
    } else {
        showLogin();
    }
}

loginBtn.addEventListener('click', async () => {
    const email = loginEmail.value.trim();
    const password = loginPassword.value;
    if (!email || !password) {
        loginStatus.textContent = 'Enter both email and password.';
        loginStatus.className = 'form-status error';
        return;
    }

    loginBtn.disabled = true;
    loginBtn.textContent = 'Logging in...';
    loginStatus.textContent = '';
    loginStatus.className = 'form-status';

    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });

    loginBtn.disabled = false;
    loginBtn.textContent = 'Log In';

    if (error) {
        loginStatus.textContent = 'Login failed: ' + error.message;
        loginStatus.className = 'form-status error';
        return;
    }

    loginPassword.value = '';
    showDashboard(data.session);
});

loginPassword.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') loginBtn.click();
});

logoutBtn.addEventListener('click', async () => {
    await supabaseClient.auth.signOut();
    showLogin();
});

async function loadReports() {
    reportsList.innerHTML = '<p class="admin-sub">Loading reports...</p>';
    dashboardStatus.textContent = '';
    dashboardStatus.className = 'form-status';

    const { data, error } = await supabaseClient
        .from('bug_reports')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        reportsList.innerHTML = '';
        dashboardStatus.textContent = 'Could not load reports: ' + error.message;
        dashboardStatus.className = 'form-status error';
        return;
    }

    if (!data || data.length === 0) {
        reportsList.innerHTML = '<p class="admin-sub">No bug reports yet.</p>';
        return;
    }

    reportsList.innerHTML = data.map(report => `
        <div class="report-card">
            <div class="report-meta">
                <span class="report-date">${new Date(report.created_at).toLocaleString()}</span>
                <span class="report-status status-${(report.status || 'new').toLowerCase()}">${report.status || 'new'}</span>
            </div>
            <p class="report-desc">${escapeHtml(report.description)}</p>
            <div class="report-footer">
                <span class="report-url">${report.page_url ? escapeHtml(report.page_url) : ''}</span>
            </div>
        </div>
    `).join('');
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

checkSession();
