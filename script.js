// script.js - VPS Manager Full Working (Firebase Auth + Firestore)
// Phiên bản phù hợp 100% với HTML bạn gửi

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
    getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword,
    onAuthStateChanged, signOut, updatePassword, reauthenticateWithCredential, EmailAuthProvider
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import {
    getFirestore, doc, setDoc, getDoc, getDocs, updateDoc, deleteDoc,
    collection, query, where, serverTimestamp, increment, writeBatch
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

// === THAY CONFIG NÀY BẰNG CỦA BẠN ===
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

let currentUser = null;
let isAdmin = false;

// Kiểm tra đăng nhập toàn site
onAuthStateChanged(auth, async (user) => {
    currentUser = user;
    if (user) {
        const snap = await getDoc(doc(db, "users", user.uid));
        if (snap.exists()) {
            isAdmin = snap.data().role === "admin";
            document.body.classList.add("logged-in");
            document.body.classList.remove("guest");

            // Tự động chuyển hướng đúng dashboard
            if (location.pathname.includes("admin-dashboard.html") && !isAdmin) {
                location.href = "user-dashboard.html";
            }
            if (location.pathname.includes("user-dashboard.html") && isAdmin) {
                loadAdminDashboard();
            } else if (location.pathname.includes("user-dashboard.html")) {
                loadUserDashboard();
            }
            if (location.pathname.includes("admin-dashboard.html") && isAdmin) {
                loadAdminDashboard();
            }
        }
    } else {
        document.body.classList.add("guest");
        document.body.classList.remove("logged-in");
        if (location.pathname.includes("user-dashboard.html") || location.pathname.includes("admin-dashboard.html")) {
            location.href = "login.html";
        }
    }
});

// ==================== ĐĂNG KÝ ====================
if (document.getElementById("register-form")) {
    document.getElementById("register-form").onsubmit = async (e) => {
        e.preventDefault();
        const email = document.getElementById("register-email").value.trim();
        const pass = document.getElementById("register-password").value;
        const confirm = document.getElementById("register-confirm-password").value;

        if (pass !== confirm) return alert("Mật khẩu xác nhận không khớp!");
        if (pass.length < 6) return alert("Mật khẩu phải ≥ 6 ký tự!");

        try {
            const cred = await createUserWithEmailAndPassword(auth, email, pass);
            await setDoc(doc(db, "users", cred.user.uid), {
                email: email,
                balance: 0,
                role: "user",
                createdAt: serverTimestamp()
            });
            alert("Đăng ký thành công!");
            location.href = "user-dashboard.html";
        } catch (err) {
            alert("Lỗi: " + err.message);
        }
    };
}

// ==================== ĐĂNG NHẬP ====================
if (document.getElementById("login-form")) {
    document.getElementById("login-form").onsubmit = async (e) => {
        e.preventDefault();
        const email = document.getElementById("login-email").value.trim();
        const pass = document.getElementById("login-password").value;

        try {
            const cred = await signInWithEmailAndPassword(auth, email, pass);
            const snap = await getDoc(doc(db, "users", cred.user.uid));
            if (snap.data().role === "admin") {
                location.href = "admin-dashboard.html";
            } else {
                location.href = "user-dashboard.html";
            }
        } catch (err) {
            alert("Sai email hoặc mật khẩu!");
        }
    };
}

// ==================== ĐĂNG XUẤT ====================
document.addEventListener("click", async (e) => {
    if (e.target.id === "logout-btn") {
        await signOut(auth);
        location.href = "index.html";
    }
});

// ==================== ADMIN DASHBOARD ====================
async function loadAdminDashboard() {
    if (!isAdmin) return;

    // Load Keys
    const keysSnap = await getDocs(collection(db, "keys"));
    const keyList = document.getElementById("key-list");
    keyList.innerHTML = keysSnap.empty ? "<p>Chưa có key nào</p>" : "";
    keysSnap.forEach(d => {
        const data = d.data();
        const expire = data.expiresAt ? new Date(data.expiresAt.seconds * 1000).toLocaleString("vi-VN") : "Vĩnh viễn";
        const used = data.usedBy ? "Đã dùng" : "Chưa dùng";
        keyList.innerHTML += `
            <div class="key-card">
                <div class="key-info">
                    <div>
                        <div class="key-code">${d.id}</div>
                        <div class="key-meta">Hết hạn: ${expire} | Trạng thái: ${used}</div>
                    </div>
                    <button class="btn-danger" onclick="deleteKey('${d.id}')">Xóa</button>
                </div>
            </div>`;
    });

    // Load Users + Select cộng tiền
    const usersSnap = await getDocs(collection(db, "users"));
    const userList = document.getElementById("user-list");
    const selectUser = document.getElementById("add-balance-user");
    userList.innerHTML = "";
    selectUser.innerHTML = '<option value="">Chọn user</option>';

    usersSnap.forEach(d => {
        const u = d.data();
        userList.innerHTML += `
            <div class="user-card">
                <div class="user-info">
                    <div class="user-email">${u.email}</div>
                    <div>Số dư: ${u.balance?.toLocaleString() || 0} VNĐ</div>
                </div>
            </div>`;
        selectUser.innerHTML += `<option value="${d.id}">${u.email} (${u.balance || 0}đ)</option>`;
    });
}

// Tạo key mới
if (document.getElementById("create-key-btn")) {
    document.getElementById("create-key-btn").onclick = async () => {
        let expiresAt = null;
        const type = document.getElementById("expiration-type").value;

        if (type === "date") {
            const date = document.getElementById("expiration-date").value;
            if (!date) return alert("Chọn ngày hết hạn!");
            expiresAt = new Date(date);
        } else if (type === "duration") {
            const val = parseInt(document.getElementById("duration-value").value);
            const unit = document.getElementById("duration-unit").value;
            if (!val) return alert("Nhập số lượng!");
            expiresAt = new Date();
            if (unit === "hours") expiresAt.setHours(expiresAt.getHours() + val);
            if (unit === "days") expiresAt.setDate(expiresAt.getDate() + val);
            if (unit === "months") expiresAt.setMonth(expiresAt.getMonth() + val);
            if (unit === "years") expiresAt.setFullYear(expiresAt.getFullYear() + val);
        }

        const key = generateKey();
        await setDoc(doc(db, "keys", key), {
            expiresAt: expiresAt ? { seconds: Math.floor(expiresAt / 1000) } : null,
            usedBy: null,
            createdAt: serverTimestamp()
        });
        alert("Tạo key thành công:\n" + key);
        loadAdminDashboard();
    };
}

// Show/hide input theo loại key
document.getElementById("expiration-type")?.addEventListener("change", (e) => {
    document.getElementById("date-input").style.display = e.target.value === "date" ? "block" : "none";
    document.getElementById("duration-input").style.display = e.target.value === "duration" ? "flex" : "none";
});

// Cộng tiền
document.getElementById("add-balance-btn")?.onclick = async () => {
    const uid = document.getElementById("add-balance-user").value;
    const amount = parseInt(document.getElementById("add-balance-amount").value);
    if (!uid || !amount) return alert("Chọn user và nhập số tiền!");
    await updateDoc(doc(db, "users", uid), { balance: increment(amount) });
    alert("Cộng tiền thành công!");
    loadAdminDashboard();
};

// Xóa key
window.deleteKey = async (key) => {
    if (confirm("Xóa key này thật chứ?")) {
        await deleteDoc(doc(db, "keys", key));
        loadAdminDashboard();
    }
};

// Tạo key ngẫu nhiên đẹp
function generateKey() {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < 16; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
        if (i === 3 || i === 7 || i === 11) result += "-";
    }
    return result;
}

// ==================== USER DASHBOARD ====================
async function loadUserDashboard() {
    const snap = await getDoc(doc(db, "users", currentUser.uid));
    const data = snap.data();
    document.getElementById("user-email").textContent = currentUser.email;
    document.getElementById("user-balance").textContent = (data.balance || 0).toLocaleString() + " VNĐ";

    // Keys của user
    const q = query(collection(db, "keys"), where("usedBy", "==", currentUser.uid));
    const keysSnap = await getDocs(q);
    const list = document.getElementById("key-list");
    list.innerHTML = keysSnap.empty ? "<p>Chưa có key nào</p>" : "";
    keysSnap.forEach(d => {
        const k = d.data();
        const exp = k.expiresAt ? new Date(k.expiresAt.seconds * 1000).toLocaleString("vi-VN") : "Vĩnh viễn";
        list.innerHTML += `
            <div class="key-card">
                <div class="key-code">${d.id}</div>
                <div class="key-meta">Hết hạn: ${exp}</div>
            </div>`;
    });
}

// Dùng key
document.getElementById("use-key-btn")?.onclick = async () => {
    const key = document.getElementById("use-key-input").value.trim().toUpperCase();
    if (!key) return alert("Nhập key!");

    const keyDoc = await getDoc(doc(db, "keys", key));
    if (!keyDoc.exists()) return alert("Key không tồn tại!");
    if (keyDoc.data().usedBy) return alert("Key đã được sử dụng!");

    await updateDoc(doc(db, "keys", key), {
        usedBy: currentUser.uid,
        usedAt: serverTimestamp()
    });
    alert("Kích hoạt key thành công!");
    loadUserDashboard();
};

// Cập nhật link tải tool (lưu vào Firestore)
document.getElementById("update-link-btn")?.onclick = async () => {
    const link = document.getElementById("download-link").value.trim();
    if (!link) return alert("Nhập link!");
    await setDoc(doc(db, "settings", "download"), { link });
    alert("Cập nhật link tải thành công!");
};
