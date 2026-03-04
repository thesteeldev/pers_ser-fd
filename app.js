// Firebase Config (replace with your own)
const firebaseConfig = {
  apiKey: "AIzaSyCh2xTrbOz3F9uZkMeKlr2g7Pk94TkJMd8",
  authDomain: "steeldev-journal.firebaseapp.com",
  projectId: "steeldev-journal",
  storageBucket: "steeldev-journal.firebasestorage.app",
  messagingSenderId: "923272289095",
  appId: "1:923272289095:web:289dcf21213c497b808a62",
  measurementId: "G-5TS1E8B8TN"
};
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const provider = new firebase.auth.GoogleAuthProvider();

// Backend API URL (Render)
const API_URL = "https://lifeflow-api-yyz3.onrender.com";

let currentUser = null;
let currentTab = 'health';

// Auth functions
function login() {
    auth.signInWithPopup(provider);
}

function logout() {
    auth.signOut().then(() => location.reload());
}

auth.onAuthStateChanged(async user => {
    if (user) {
        currentUser = user;
        document.getElementById('login-screen').classList.add('hidden');
        document.getElementById('app-screen').classList.remove('hidden');
        document.getElementById('user-email').innerText = user.email;

        // Verify token with backend
        const idToken = await user.getIdToken();
        await fetch(`${API_URL}/auth/verify-token`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({idToken})
        });

        loadTab(currentTab);
    } else {
        document.getElementById('login-screen').classList.remove('hidden');
        document.getElementById('app-screen').classList.add('hidden');
    }
});

// Tab switching
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentTab = btn.dataset.tab;
        loadTab(currentTab);
    });
});

async function loadTab(tab) {
    if (!currentUser) return;
    const uid = currentUser.uid;
    const res = await fetch(`${API_URL}/${tab}/?uid=${uid}`);
    const data = await res.json();
    renderTab(tab, data);
}

function renderTab(tab, entries) {
    const content = document.getElementById('content');
    let html = `<h2>${tab.charAt(0).toUpperCase() + tab.slice(1)}</h2>`;
    if (entries.length === 0) {
        html += '<p>No entries yet. Use the command box to add.</p>';
    } else {
        entries.forEach(entry => {
            html += `<div class="card">${JSON.stringify(entry)}</div>`;
        });
    }
    content.innerHTML = html;
}

// Simple command parsing (extend as needed)
async function sendCommand() {
    const input = document.getElementById('command-input');
    const text = input.value.trim();
    if (!text) return;

    let category = null;
    let type = null;
    let amount = null;
    let notes = text;

    if (text.startsWith('add expense')) {
        category = 'wealth';
        type = 'expense';
        const match = text.match(/\d+/);
        if (match) amount = parseInt(match[0]);
    } else if (text.startsWith('add income')) {
        category = 'wealth';
        type = 'income';
        const match = text.match(/\d+/);
        if (match) amount = parseInt(match[0]);
    } else if (text.startsWith('log workout')) {
        category = 'health';
        type = 'workout';
    } else {
        alert('Command not recognized (demo).');
        input.value = '';
        return;
    }

    if (category && type && currentUser) {
        const payload = {
            uid: currentUser.uid,
            type: type,
            amount: amount,
            notes: notes
        };
        const res = await fetch(`${API_URL}/${category}/`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(payload)
        });
        if (res.ok) {
            input.value = '';
            loadTab(currentTab);
        } else {
            alert('Error adding entry');
        }
    }
}