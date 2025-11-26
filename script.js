const firebaseConfig = {
    // THAY ĐOÀN NÀY BẰNG CONFIG CỦA BẠN
    apiKey: "AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    authDomain: "your-project.firebaseapp.com",
    projectId: "your-project",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef123456789"
};

const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const ADMIN_EMAIL = "admin@vpsmanager.com";

auth.onAuthStateChanged(user => {
    if (user) {
        if (location.pathname.includes('login.html') || location.pathname === '/') redirect(user);
        if (location.pathname.includes('user-dashboard.html') || location.pathname.includes('admin-dashboard.html')) {
            loadKeys(user);
            if (location.pathname.includes('admin-dashboard.html')) { loadUsers(); loadDownloadLink(); }
        }
    } else {
        if (location.pathname.includes('user-dashboard.html') || location.pathname.includes('admin-dashboard.html')) {
            location.href = 'login.html';
        }
    }
    if (location.pathname.includes('index.html') || location.pathname === '/') loadDownloadLinkForHome();
});

function redirect(user) {
    db.collection('users').doc(user.uid).get().then(doc => {
        location.href = (doc.data().role === 'admin') ? 'admin-dashboard.html' : 'user-dashboard.html';
    });
}

function register() {
    const email = document.getElementById('email').value;
    const pass = document.getElementById('password').value;
    auth.createUserWithEmailAndPassword(email, pass).then(cred => {
        db.collection('users').doc(cred.user.uid).set({ email, role: (email === ADMIN_EMAIL) ? 'admin' : 'user', createdAt: new Date() });
        alert("Đăng ký thành công! Đang chuyển...");
    }).catch(e => alert(e.message));
}

function login() {
    const email = document.getElementById('email').value;
    const pass = document.getElementById('password').value;
    auth.signInWithEmailAndPassword(email, pass).catch(e => alert(e.message));
}

function logout() { auth.signOut(); }

function createKey() {
    const user = auth.currentUser;
    const exp = document.getElementById('expiration-select').value;
    let expiration = null;
    if (exp !== 'none') {
        const d = new Date();
        if (exp === '1month') d.setMonth(d.getMonth() + 1);
        if (exp === '3months') d.setMonth(d.getMonth() + 3);
        if (exp === '1year') d.setFullYear(d.getFullYear() + 1);
        expiration = firebase.firestore.Timestamp.fromDate(d);
    }
    const key = crypto.randomUUID();
    db.collection(`users/${user.uid}/keys`).add({ key, bound_device: null, expiration }).then(() => loadKeys(user));
}

function resetKey(id) {
    const user = auth.currentUser;
    db.collection(`users/${user.uid}/keys`).doc(id).update({ bound_device: null }).then(() => loadKeys(user));
}

function loadKeys(user) {
    const list = document.getElementById('key-list');
    if (!list) return;
    list.innerHTML = '';
    db.collection(`users/${user.uid}/keys`).get().then(snap => {
        snap.forEach(doc => {
            const d = doc.data();
            const li = document.createElement('li');
            const exp = d.expiration ? new Date(d.expiration.seconds * 1000).toLocaleDateString() : 'Vĩnh viễn';
            li.innerHTML = `${d.key}<br><small>Hết hạn: ${exp} | Máy: ${d.bound_device || 'Chưa bind'}</small>`;
            const reset = document.createElement('button'); reset.textContent = 'Reset'; reset.onclick = () => resetKey(doc.id);
            const del = document.createElement('button'); del.textContent = 'Xóa'; del.onclick = () => doc.ref.delete().then(() => loadKeys(user));
            li.append(reset, del);
            list.appendChild(li);
        });
    });
}

function loadUsers() {
    const list = document.getElementById('user-list');
    list.innerHTML = '';
    db.collection('users').get().then(snap => {
        snap.forEach(doc => {
            const d = doc.data();
            const li = document.createElement('li');
            li.textContent = `${d.email} (${d.role})`;
            const del = document.createElement('button');
            del.textContent = 'Xóa user';
            del.onclick = () => { if (confirm('Xóa user này?')) { doc.ref.delete(); db.collection(`users/${doc.id}/keys`).get().then(s => s.forEach(k => k.ref.delete())); loadUsers(); } }
            li.appendChild(del);
            list.appendChild(li);
        });
    });
}

function updateDownloadLink() {
    const link = document.getElementById('download-link').value.trim();
    if (!link) return alert("Nhập link!");
    db.collection('settings').doc('general').set({ download_link: link }, { merge: true }).then(() => alert("Đã cập nhật link tải!"));
}

function loadDownloadLink() {
    db.collection('settings').doc('general').get().then(doc => {
        if (doc.exists && doc.data().download_link) {
            document.getElementById('download-link').value = doc.data().download_link;
        }
    });
}

function loadDownloadLinkForHome() {
    db.collection('settings').doc('general').get().then(doc => {
        const btn = document.getElementById('download-btn');
        if (doc.exists && doc.data().download_link) {
            btn.onclick = () => window.open(doc.data().download_link, '_blank');
        } else {
            btn.onclick = () => alert("Link tải chưa được Admin cập nhật!");
        }
    });
}