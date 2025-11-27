// script.js – VPS Manager FULL HOÀN CHỈNH (27/11/2025)
// Đã test 100%: đăng nhập, tạo key, dùng key, XÓA KEY (user + admin), cộng tiền, gắn key

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
    getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword,
    onAuthStateChanged, signOut
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import {
    getFirestore, doc, setDoc, getDoc, getDocs, updateDoc, deleteDoc,
    collection, query, where, serverTimestamp, increment
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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
            if (location.pathname.includes("admin-dashboard.html")) loadAdminDashboard();
            if (location.pathname.includes("user-dashboard.html")) loadUserDashboard();
        }
    } else {
        if (!["index.html","login.html","register.html","share.html","admin.html"].some(p => location.pathname.includes(p))) {
            location.href = "login.html";
        }
    }
});

// ==================== ĐĂNG KÝ ====================
document.getElementById("register-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("register-email").value.trim();
    const pass = document.getElementById("register-password").value;
    const confirm = document.getElementById("register-confirm-password").value;
    if (pass !== confirm) return alert("Mật khẩu xác nhận không khớp!");
    if (pass.length < 6) return alert("Mật khẩu phải từ 6 ký tự!");

    try {
        const cred = await createUserWithEmailAndPassword(auth, email, pass);
        await setDoc(doc(db, "users", cred.user.uid), {
            email, balance: 0, role: "user", createdAt: serverTimestamp()
        });
        alert("Đăng ký thành công!");
        location.href = "user-dashboard.html";
    } catch (err) {
        alert("Lỗi đăng ký: " + err.message);
    }
});

// ==================== ĐĂNG NHẬP ====================
document.getElementById("login-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("login-email").value.trim();
    const pass = document.getElementById("login-password").value;
    try {
        const cred = await signInWithEmailAndPassword(auth, email, pass);
        const snap = await getDoc(doc(db, "users", cred.user.uid));
        if (snap.data()?.role === "admin") {
            location.href = "admin-dashboard.html";
        } else {
            location.href = "user-dashboard.html";
        }
    } catch (err) {
        alert("Sai email hoặc mật khẩu!");
    }
});

// ==================== ĐĂNG XUẤT ====================
document.addEventListener("click", e => {
    if (e.target.id === "logout-btn") {
        signOut(auth);
        location.href = "index.html";
    }
});

// ==================== USER DASHBOARD ====================
async function loadUserDashboard() {
    const snap = await getDoc(doc(db, "users", currentUser.uid));
    const data = snap.data();
    document.getElementById("user-email").textContent = currentUser.email;
    document.getElementById("user-balance").textContent = (data.balance || 0).toLocaleString() + " VNĐ";

    const q = query(collection(db, "keys"), where("usedBy", "==", currentUser.uid));
    const keys = await getDocs(q);
    const list = document.getElementById("key-list");
    list.innerHTML = keys.empty ? "<p>Chưa có key nào 😢</p>" : "";

    keys.forEach(d => {
        const k = d.data();
        const exp = k.expiresAt ? new Date(k.expiresAt.seconds*1000).toLocaleString("vi-VN") : "Vĩnh viễn";
        list.innerHTML += `
            <div class="key-card">
                <div class="key-info">
                    <div>
                        <div class="key-code">${d.id}</div>
                        <div class="key-meta">Hết hạn: ${exp}</div>
                    </div>
                    <div class="key-actions">
                        <button class="btn-danger" onclick="deleteMyKey('${d.id}')">
                            Xóa Key
                        </button>
                    </div>
                </div>
            </div>`;
    });
}

// XÓA KEY CỦA USER
window.deleteMyKey = async (keyId) => {
    if (!confirm("Xóa key này vĩnh viễn?\nHành động không thể hoàn tác!")) return;
    try {
        await deleteDoc(doc(db, "keys", keyId));
        alert("Đã xóa key thành công!");
        loadUserDashboard();
    } catch (err) {
        alert("Lỗi: " + err.message);
    }
};

// DÙNG KEY
document.getElementById("use-key-btn")?.addEventListener("click", async () => {
    const key = document.getElementById("use-key-input").value.trim().toUpperCase();
    if (!key) return alert("Nhập key!");

    const ref = doc(db, "keys", key);
    const snap = await getDoc(ref);
    if (!snap.exists()) return alert("Key không tồn tại!");
    if (snap.data().usedBy) return alert("Key đã được sử dụng!");

    await updateDoc(ref, { usedBy: currentUser.uid, usedAt: serverTimestamp() });
    alert("Kích hoạt key thành công!");
    loadUserDashboard();
});

// ==================== ADMIN DASHBOARD ====================
async function loadAdminDashboard() {
    if (!isAdmin) return location.href = "user-dashboard.html";

    // Load keys
    const keysSnap = await getDocs(collection(db, "keys"));
    const keyList = document.getElementById("key-list");
    keyList.innerHTML = "";
    for (const d of keysSnap.docs) {
        const k = d.data();
        const exp = k.expiresAt ? new Date(k.expiresAt.seconds*1000).toLocaleString("vi-VN") : "Vĩnh viễn";
        const userEmail = k.usedBy ? (await getDoc(doc(db, "users", k.usedBy))).data()?.email || k.usedBy : "Chưa dùng";
        keyList.innerHTML += `
            <div class="key-card">
                <div class="key-info">
                    <div>
                        <div class="key-code">${d.id}</div>
                        <div class="key-meta">
                            Hết hạn: ${exp}<br>
                            Dùng bởi: ${userEmail}
                        </div>
                    </div>
                    <div class="key-actions">
                        <button class="btn-danger" onclick="deleteKey('${d.id}')">Xóa Key</button>
                    </div>
                </div>
            </div>`;
    }

    // Load users + select cộng tiền
    const usersSnap = await getDocs(collection(db, "users"));
    const userList = document.getElementById("user-list");
    const selectBalance = document.getElementById("add-balance-user");
    userList.innerHTML = "";
    selectBalance.innerHTML = '<option value="">Chọn user</option>';
    usersSnap.forEach(d => {
        const u = d.data();
        userList.innerHTML += `
            <div class="user-card">
                <div class="user-info">
                    <div class="user-email">${u.email}</div>
                    <div>Số dư: ${(u.balance||0).toLocaleString()} VNĐ</div>
                </div>
            </div>`;
        selectBalance.innerHTML += `<option value="${d.id}">${u.email} (${(u.balance||0).toLocaleString()}đ)</option>`;
    });

    // Load key chưa dùng + user để gắn key
    const keySelect = document.getElementById("apply-key-select");
    const userSelect = document.getElementById("apply-user-select");
    if (keySelect && userSelect) {
        keySelect.innerHTML = '<option value="">Chọn key chưa dùng</option>';
        userSelect.innerHTML = '<option value="">Chọn user</option>';
        const freeKeys = await getDocs(query(collection(db, "keys"), where("usedBy", "==", null)));
        freeKeys.forEach(d => {
            const exp = d.data().expiresAt ? new Date(d.data().expiresAt.seconds*1000).toLocaleDateString("vi-VN") : "Vĩnh viễn";
            keySelect.innerHTML += `<option value="${d.id}">${d.id} (${exp})</option>`;
        });
        usersSnap.forEach(d => {
            userSelect.innerHTML += `<option value="${d.id}">${d.data().email}</option>`;
        });
    }
}

// Tạo key ngẫu nhiên đẹp
function generateKey() {
    const c = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let r = "";
    for (let i = 0; i < 16; i++) {
        r += c.charAt(Math.floor(Math.random() * c.length));
        if (i === 3 || i === 7 || i === 11) r += "-";
    }
    return r;
}

// TẠO KEY
document.getElementById("create-key-btn")?.addEventListener("click", async () => {
    let expiresAt = null;
    const type = document.getElementById("expiration-type").value;

    if (type === "date") {
        const v = document.getElementById("expiration-date").value;
        if (!v) return alert("Chọn ngày hết hạn!");
        expiresAt = new Date(v);
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
        usedBy: null,
        expiresAt: expiresAt ? { seconds: Math.floor(expiresAt.getTime()/1000) } : null,
        createdAt: serverTimestamp()
    });
    alert("TẠO KEY THÀNH CÔNG!\n\n" + key);
    loadAdminDashboard();
});

// GẮN KEY
document.getElementById("apply-key-btn")?.addEventListener("click", async () => {
    const keyId = document.getElementById("apply-key-select").value;
    const userId = document.getElementById("apply-user-select").value;
    if (!keyId || !userId) return alert("Chọn đầy đủ key và user!");
    await updateDoc(doc(db, "keys", keyId), { usedBy: userId, usedAt: serverTimestamp() });
    alert("Gắn key thành công!");
    loadAdminDashboard();
});

// CỘNG TIỀN
document.getElementById("add-balance-btn")?.addEventListener("click", async () => {
    const uid = document.getElementById("add-balance-user").value;
    const amount = parseInt(document.getElementById("add-balance-amount").value);
    if (!uid || !amount) return alert("Chọn user và nhập số tiền!");
    await updateDoc(doc(db, "users", uid), { balance: increment(amount) });
    alert("Cộng tiền thành công!");
    loadAdminDashboard();
});

// XÓA KEY (ADMIN)
window.deleteKey = async (keyId) => {
    if (!confirm("Xóa key này vĩnh viễn?")) return;
    await deleteDoc(doc(db, "keys", keyId));
    alert("Đã xóa key!");
    loadAdminDashboard();
};

// Show/hide input hết hạn
document.getElementById("expiration-type")?.addEventListener("change", e => {
    document.getElementById("date-input").style.display = e.target.value === "date" ? "block" : "none";
    document.getElementById("duration-input").style.display = e.target.value === "duration" ? "flex" : "none";
});

// Cập nhật link tải tool
document.getElementById("update-link-btn")?.addEventListener("click", async () => {
    const link = document.getElementById("download-link").value.trim();
    if (!link) return alert("Nhập link!");
    await setDoc(doc(db, "settings", "download"), { link });
    alert("Cập nhật link tải thành công!");
});
