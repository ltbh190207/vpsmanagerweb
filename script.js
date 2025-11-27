import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, fetchSignInMethodsForEmail, updatePassword } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { getFirestore, collection, addDoc, getDocs, getDoc, doc, setDoc, updateDoc, deleteDoc, Timestamp, query, where } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

const firebaseConfig = {
    apiKey: "AIzaSyCe3V1JFEI9w3UoREuehqMx9gxtz-Yw1oc",
    authDomain: "vpsmanagerweb.firebaseapp.com",
    projectId: "vpsmanagerweb",
    storageBucket: "vpsmanagerweb.firebasestorage.app",
    messagingSenderId: "851393978130",
    appId: "1:851393978130:web:24fddef37a51f577565dcb",
    measurementId: "G-7H51LQGZV0"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const ADMIN_EMAIL = 'admin@vpsmanager.com';

// Sample data for share.html (in production, load from Firebase)
const tools = [
    {
        name: "VPS Auto Installer",
        description: "Công cụ cài đặt tự động VPS với nhiều tùy chọn",
        downloadLink: "https://example.com/tool1.zip"
    },
    {
        name: "Key Generator",
        description: "Tạo key ngẫu nhiên bảo mật cao",
        downloadLink: "https://example.com/tool2.zip"
    }
];

const apis = [
    {
        name: "Check IP API",
        description: "API kiểm tra địa chỉ IP và thông tin liên quan",
        url: "https://api.example.com/checkip?ip={IP_ADDRESS}"
    },
    {
        name: "Weather API",
        description: "Lấy thông tin thời tiết theo vị trí",
        url: "https://api.example.com/weather?location={LOCATION}"
    },
    {
        name: "Currency Exchange API",
        description: "Tỷ giá hối đoái theo thời gian thực",
        url: "https://api.example.com/exchange?from={FROM}&to={TO}"
    }
];

let currentAPI = '';

// Chờ DOM ready để attach events
document.addEventListener('DOMContentLoaded', () => {
    // Attach events cho login form
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            login();
        });
    }

    // Attach events cho register form
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            register();
        });
    }

    // Attach events cho các phần khác
    if (document.getElementById('update-link-btn')) {
        document.getElementById('update-link-btn').addEventListener('click', updateDownloadLink);
    }

    if (document.getElementById('create-key-btn')) {
        document.getElementById('create-key-btn').addEventListener('click', createKey);
    }

    if (document.getElementById('expiration-type')) {
        document.getElementById('expiration-type').addEventListener('change', toggleExpirationType);
    }

    if (document.getElementById('change-password-btn')) {
        document.getElementById('change-password-btn').addEventListener('click', changePassword);
    }

    if (document.getElementById('set-secondary-password-btn')) {
        document.getElementById('set-secondary-password-btn').addEventListener('click', setSecondaryPassword);
    }

    if (document.getElementById('toggle-secondary-btn')) {
        document.getElementById('toggle-secondary-btn').addEventListener('click', toggleSecondaryPasswordButton);
    }

    if (document.getElementById('add-balance-btn')) {
        document.getElementById('add-balance-btn').addEventListener('click', addUserBalance);
    }

    if (document.getElementById('change-admin-password-btn')) {
        document.getElementById('change-admin-password-btn').addEventListener('click', changeAdminPassword);
    }

    if (document.getElementById('download-vps-btn')) {
        document.getElementById('download-vps-btn').addEventListener('click', downloadVPSManager);
    }

    // Attach logout nếu có
    const logoutBtns = document.querySelectorAll('#logout-btn');
    logoutBtns.forEach(btn => btn.addEventListener('click', logout));

    // Xử lý cho share.html
    if (window.location.pathname.includes('share.html')) {
        // Attach events cho buttons in share.html
        const toolsBtn = document.querySelector('button[onclick="showSection(\'tools\')"]');
        if (toolsBtn) toolsBtn.addEventListener('click', () => showSection('tools'));

        const apisBtn = document.querySelector('button[onclick="showSection(\'apis\')"]');
        if (apisBtn) apisBtn.addEventListener('click', () => showSection('apis'));

        const closeSpan = document.querySelector('.close');
        if (closeSpan) closeSpan.addEventListener('click', closeModal);

        // Close modal when clicking outside
        window.onclick = function(event) {
            const modal = document.getElementById('api-modal');
            if (event.target === modal) {
                closeModal();
            }
        };
    }
});

onAuthStateChanged(auth, (user) => {
    if (user) {
        if (window.location.pathname.includes('login.html') || window.location.pathname.includes('index.html') || window.location.pathname === '/') {
            // Redirect to dashboard khi đã đăng nhập
            getDoc(doc(db, 'users', user.uid)).then((docSnap) => {
                if (docSnap.exists()) {
                    const role = docSnap.data().role;
                    window.location.href = role === 'admin' ? 'admin-dashboard.html' : 'user-dashboard.html';
                }
            });
        }
        loadKeys(user);
        loadUserInfo(user);
        if (window.location.pathname.includes('admin-dashboard.html')) {
            loadUsers();
            loadDownloadLink();
            loadUsersForAddBalance();
        }
        if (window.location.pathname.includes('user-dashboard.html')) {
            loadUserBalance(user);
            loadSecondaryPasswordSettings(user);
        }
    } else {
        if (window.location.pathname.includes('user-dashboard.html') || window.location.pathname.includes('admin-dashboard.html')) {
            window.location.href = 'login.html';
        }
    }
});

function login() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            // onAuthStateChanged sẽ xử lý redirect
        })
        .catch((error) => {
            showAlert('Lỗi đăng nhập: ' + error.message, 'error');
        });
}

function register() {
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('register-confirm-password').value;

    if (password !== confirmPassword) {
        showAlert('Mật khẩu xác nhận không khớp!', 'error');
        return;
    }

    if (password.length < 6) {
        showAlert('Mật khẩu không hợp lệ: Phải ít nhất 6 ký tự!', 'error');
        return;
    }

    fetchSignInMethodsForEmail(auth, email)
        .then((methods) => {
            if (methods.length > 0) {
                showAlert('Email này đã được sử dụng. Hãy thử đăng nhập.', 'error');
                return;
            }
            createUserWithEmailAndPassword(auth, email, password)
                .then((userCredential) => {
                    const user = userCredential.user;
                    setDoc(doc(db, 'users', user.uid), {
                        email: email,
                        role: (email === ADMIN_EMAIL) ? 'admin' : 'user',
                        balance: 0,
                        createdAt: Timestamp.now(),
                        secondaryPassword: null,
                        enableSecondary: false
                    }).then(() => {
                        showAlert('Đăng ký thành công! Đang tự động đăng nhập...', 'success');
                        signInWithEmailAndPassword(auth, email, password); // Tự đăng nhập
                    });
                })
                .catch((error) => {
                    showAlert('Lỗi đăng ký: ' + error.message, 'error');
                });
        });
}

function logout() {
    signOut(auth).then(() => {
        window.location.href = 'index.html';
    });
}

// Các function khác giữ nguyên (updateDownloadLink, createKey, toggleExpirationType, changePassword, setSecondaryPassword, toggleSecondaryPasswordButton, loadSecondaryPasswordSettings, loadUsersForAddBalance, addUserBalance, changeAdminPassword, showAlert, downloadVPSManager, v.v.)

// Functions từ share.html inline
function showSection(section) {
    document.getElementById('tools-section').style.display = 'none';
    document.getElementById('apis-section').style.display = 'none';

    if (section === 'tools') {
        document.getElementById('tools-section').style.display = 'block';
        loadTools();
    } else if (section === 'apis') {
        document.getElementById('apis-section').style.display = 'block';
        loadAPIs();
    }
}

function loadTools() {
    const toolsList = document.getElementById('tools-list');
    toolsList.innerHTML = '';

    tools.forEach(tool => {
        const div = document.createElement('div');
        div.className = 'key-card';
        div.innerHTML = `
            <h3 style="color: #667eea;">${tool.name}</h3>
            <p>${tool.description}</p>
            <a href="${tool.downloadLink}" class="btn" style="width: auto; margin-top: 10px;" target="_blank">📥 Tải Tool</a>
        `;
        toolsList.appendChild(div);
    });
}

function loadAPIs() {
    const apisList = document.getElementById('apis-list');
    apisList.innerHTML = '';

    apis.forEach((api, index) => {
        const div = document.createElement('div');
        div.className = 'key-card';
        div.style.cursor = 'pointer';
        div.innerHTML = `
            <h3 style="color: #667eea;">${api.name}</h3>
            <p>${api.description}</p>
            <button class="btn" style="width: auto; margin-top: 10px;" onclick="showAPIModal(${index})">🔍 Xem API</button>
        `;
        apisList.appendChild(div);
    });
}

function showAPIModal(index) {
    const api = apis[index];
    document.getElementById('modal-title').textContent = api.name;
    document.getElementById('modal-description').textContent = api.description;
    document.getElementById('modal-api-url').textContent = api.url;
    currentAPI = api.url;
    document.getElementById('api-modal').style.display = 'flex';

    // Attach copy button event (vì button được tạo động)
    const copyBtn = document.querySelector('#api-modal .btn');
    if (copyBtn) copyBtn.addEventListener('click', copyAPI);
}

function closeModal() {
    document.getElementById('api-modal').style.display = 'none';
}

function copyAPI() {
    navigator.clipboard.writeText(currentAPI).then(() => {
        alert('✅ Đã copy API!');
    });
}

// Các function còn lại từ script gốc (loadKeys, loadUserInfo, loadUsers, loadDownloadLink, v.v.) giữ nguyên, vì chúng đã khớp.
