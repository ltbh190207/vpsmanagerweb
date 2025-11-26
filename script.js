import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, fetchSignInMethodsForEmail } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { getFirestore, collection, addDoc, getDocs, getDoc, doc, setDoc, updateDoc, deleteDoc, Timestamp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

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

// Chờ DOM ready để attach events
document.addEventListener('DOMContentLoaded', () => {
    // Attach events cho các trang cụ thể
    if (document.getElementById('login-btn')) {
        document.getElementById('login-btn').addEventListener('click', login);
        document.getElementById('register-btn').addEventListener('click', register);
    }

    if (document.getElementById('download-btn')) {
        loadDownloadLinkForHome(); // Load ngay để attach onclick
    }

    if (document.getElementById('update-link-btn')) {
        document.getElementById('update-link-btn').addEventListener('click', updateDownloadLink);
    }

    if (document.getElementById('create-key-btn')) {
        document.getElementById('create-key-btn').addEventListener('click', createKey);
    }

    if (document.getElementById('expiration-type')) {
        document.getElementById('expiration-type').addEventListener('change', toggleExpirationType);
    }

    if (document.getElementById('purchase-key-btn')) {
        document.getElementById('purchase-key-btn').addEventListener('click', purchaseKey);
    }

    // Attach logout nếu có
    const logoutBtns = document.querySelectorAll('#logout-btn');
    logoutBtns.forEach(btn => btn.addEventListener('click', logout));
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
    if (window.location.pathname.includes('admin-dashboard.html')) {
      loadUsers();
      loadDownloadLink();
    }
    if (window.location.pathname.includes('user-dashboard.html')) {
      loadUserBalance(user);
    }
  } else {
    if (window.location.pathname.includes('user-dashboard.html') || window.location.pathname.includes('admin-dashboard.html')) {
      window.location.href = 'login.html';
    }
  }
  if (window.location.pathname.includes('index.html') || window.location.pathname === '/') {
    loadDownloadLinkForHome();
  }
});

function register() {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  if (password.length < 6) {
    showAlert('Mật khẩu phải ít nhất 6 ký tự!', 'error');
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
            createdAt: Timestamp.now()
          }).then(() => {
            showAlert('Đăng ký thành công! Đang tự động đăng nhập...', 'success');
            signInWithEmailAndPassword(auth, email, password); // Tự đăng nhập, onAuthStateChanged sẽ redirect
          });
        })
        .catch((error) => {
          let message = 'Lỗi đăng ký không xác định: ' + error.message;
          switch (error.code) {
            case 'auth/invalid-email':
              message = 'Email không hợp lệ.';
              break;
            case 'auth/weak-password':
              message = 'Mật khẩu phải ít nhất 6 ký tự.';
              break;
            case 'auth/email-already-in-use':
              message = 'Email này đã được sử dụng. Hãy thử đăng nhập hoặc sử dụng email khác.';
              break;
            default:
              // Giữ nguyên message default
          }
          showAlert(message, 'error');
        });
    })
    .catch((error) => {
      let message = 'Lỗi kiểm tra email không xác định: ' + error.message;
      switch (error.code) {
        case 'auth/invalid-email':
          message = 'Email không hợp lệ.';
          break;
        default:
          // Giữ nguyên message default
      }
      showAlert(message, 'error');
    });
}

function login() {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  signInWithEmailAndPassword(auth, email, password)
    .then(() => showAlert('Đăng nhập thành công!', 'success'))
    .catch((error) => {
      let message = 'Lỗi đăng nhập không xác định: ' + error.message;
      switch (error.code) {
        case 'auth/invalid-email':
          message = 'Email không hợp lệ.';
          break;
        case 'auth/invalid-credential':
          message = 'Email hoặc mật khẩu không đúng.';
          break;
        case 'auth/user-not-found':
          message = 'Không tìm thấy tài khoản với email này.';
          break;
        case 'auth/wrong-password':
          message = 'Mật khẩu không đúng.';
          break;
        default:
          // Giữ nguyên message default
      }
      showAlert(message, 'error');
    });
}

function logout() {
  signOut(auth).then(() => {
    window.location.href = 'login.html';
  });
}

// ADMIN: Tạo key với nhiều tùy chọn (giữ nguyên)
function createKey() {
  const user = auth.currentUser;
  if (!user) return;
  
  const newKey = crypto.randomUUID();
  const expirationType = document.getElementById('expiration-type').value;
  let expiration = null;
  
  if (expirationType === 'date') {
    const dateInput = document.getElementById('expiration-date').value;
    if (!dateInput) {
      showAlert('Vui lòng chọn ngày hết hạn!', 'error');
      return;
    }
    expiration = Timestamp.fromDate(new Date(dateInput));
  } else if (expirationType === 'duration') {
    const value = parseInt(document.getElementById('duration-value').value);
    const unit = document.getElementById('duration-unit').value;
    if (!value || value <= 0) {
      showAlert('Vui lòng nhập thời gian hợp lệ!', 'error');
      return;
    }
    
    const now = new Date();
    if (unit === 'hours') now.setHours(now.getHours() + value);
    else if (unit === 'days') now.setDate(now.getDate() + value);
    else if (unit === 'months') now.setMonth(now.getMonth() + value);
    else if (unit === 'years') now.setFullYear(now.getFullYear() + value);
    
    expiration = Timestamp.fromDate(now);
  }
  
  addDoc(collection(db, `keys`), {
    key: newKey,
    bound_device: null,
    bound_user: null,
    expiration: expiration,
    createdAt: Timestamp.now(),
    createdBy: user.uid
  }).then(() => {
    showAlert('Tạo key thành công!', 'success');
    loadKeys(user);
  });
}

function resetKey(keyId) {
  updateDoc(doc(db, `keys`, keyId), {
    bound_device: null
  }).then(() => {
    showAlert('Reset key thành công!', 'success');
    loadKeys(auth.currentUser);
  });
}

function loadKeys(user) {
  const keyList = document.getElementById('key-list');
  if (!keyList) return;
  keyList.innerHTML = '';
  
  getDoc(doc(db, 'users', user.uid)).then((userDoc) => {
    const isAdmin = userDoc.exists() && userDoc.data().role === 'admin';
    
    getDocs(collection(db, 'keys')).then((snapshot) => {
      if (snapshot.empty) {
        keyList.innerHTML = '<div class="empty-state"><p>Chưa có key nào</p></div>';
        return;
      }
      
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        
        // User chỉ thấy key của mình
        if (!isAdmin && data.bound_user !== user.uid) return;
        
        const div = document.createElement('div');
        div.className = 'key-card';
        
        let expText = 'Vĩnh viễn';
        let expStatus = '';
        if (data.expiration) {
          const expDate = data.expiration.toDate();
          expText = expDate.toLocaleString('vi-VN');
          expStatus = expDate > new Date() ? '✅ Còn hạn' : '❌ Hết hạn';
        }
        
        div.innerHTML = `
          <div class="key-info">
            <div>
              <div class="key-code">${data.key}</div>
              <div class="key-meta">
                📅 Hết hạn: ${expText} ${expStatus}<br>
                💻 Thiết bị: ${data.bound_device || 'Chưa kích hoạt'}<br>
                ${isAdmin ? `👤 User: ${data.bound_user || 'Chưa gán'}` : ''}
              </div>
            </div>
            <div class="key-actions">
              <button class="btn-success" data-key-id="${docSnap.id}">Reset</button>
              <button class="btn-danger" data-key-id="${docSnap.id}">Xóa</button>
            </div>
          </div>
        `;
        keyList.appendChild(div);
      });

      // Attach events cho buttons động
      keyList.querySelectorAll('.btn-success').forEach(btn => {
        btn.addEventListener('click', () => resetKey(btn.dataset.keyId));
      });
      keyList.querySelectorAll('.btn-danger').forEach(btn => {
        btn.addEventListener('click', () => deleteKey(btn.dataset.keyId));
      });
    });
  });
}

function deleteKey(keyId) {
  if (!confirm('Bạn có chắc muốn xóa key này?')) return;
  deleteDoc(doc(db, `keys`, keyId)).then(() => {
    showAlert('Xóa key thành công!', 'success');
    loadKeys(auth.currentUser);
  });
}

function loadUsers() {
  const userList = document.getElementById('user-list');
  if (!userList) return;
  userList.innerHTML = '';
  
  getDocs(collection(db, 'users')).then((snapshot) => {
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const div = document.createElement('div');
      div.className = 'user-card';
      
      div.innerHTML = `
        <div class="user-info">
          <div class="user-email">${data.email}</div>
          <span class="user-role">${data.role === 'admin' ? '👑 Admin' : '👤 User'}</span>
          <div class="key-meta">💰 Số dư: ${(data.balance || 0).toLocaleString('vi-VN')} VNĐ</div>
        </div>
        <button class="btn-danger" data-user-id="${docSnap.id}" data-email="${data.email}">Xóa</button>
      `;
      userList.appendChild(div);
    });

    // Attach events cho buttons động
    userList.querySelectorAll('.btn-danger').forEach(btn => {
      btn.addEventListener('click', () => deleteUser(btn.dataset.userId, btn.dataset.email));
    });
  });
}

function deleteUser(userId, email) {
  if (!confirm(`Xóa user ${email}?`)) return;
  deleteDoc(doc(db, 'users', userId)).then(() => {
    showAlert('Xóa user thành công!', 'success');
    loadUsers();
  });
}

function updateDownloadLink() {
  const link = document.getElementById('download-link').value;
  if (!link) return showAlert('Nhập link!', 'error');
  setDoc(doc(db, 'settings', 'general'), { download_link: link }, { merge: true })
    .then(() => showAlert('Cập nhật link thành công!', 'success'));
}

function loadDownloadLink() {
  getDoc(doc(db, 'settings', 'general')).then((docSnap) => {
    if (docSnap.exists()) {
      document.getElementById('download-link').value = docSnap.data().download_link || '';
    }
  });
}

function loadDownloadLinkForHome() {
  getDoc(doc(db, 'settings', 'general')).then((docSnap) => {
    if (docSnap.exists()) {
      const btn = document.getElementById('download-btn');
      if (btn) {
        btn.addEventListener('click', () => window.open(docSnap.data().download_link, '_blank'));
      }
    }
  });
}

// USER: Mua key với loại và giá khác nhau
function purchaseKey() {
  const user = auth.currentUser;
  if (!user) return;
  
  const keyType = document.getElementById('key-type').value;
  let price = 0;
  let expiration = null;
  
  switch (keyType) {
    case 'permanent':
      price = 100000;
      break;
    case 'month':
      price = 40000;
      const nowMonth = new Date();
      nowMonth.setMonth(nowMonth.getMonth() + 1);
      expiration = Timestamp.fromDate(nowMonth);
      break;
    case 'week':
      price = 20000;
      const nowWeek = new Date();
      nowWeek.setDate(nowWeek.getDate() + 7);
      expiration = Timestamp.fromDate(nowWeek);
      break;
    case 'day':
      price = 5000;
      const nowDay = new Date();
      nowDay.setDate(nowDay.getDate() + 1);
      expiration = Timestamp.fromDate(nowDay);
      break;
    default:
      showAlert('Vui lòng chọn loại key!', 'error');
      return;
  }
  
  getDoc(doc(db, 'users', user.uid)).then((userDoc) => {
    const balance = userDoc.data().balance || 0;
    
    if (balance < price) {
      showAlert(`Số dư không đủ! Cần thêm ${(price - balance).toLocaleString('vi-VN')} VNĐ`, 'error');
      return;
    }
    
    if (!confirm(`Mua key ${keyType} với giá ${price.toLocaleString('vi-VN')} VNĐ?`)) return;
    
    // Tạo key mới với expiration tương ứng
    const newKey = crypto.randomUUID();
    addDoc(collection(db, 'keys'), {
      key: newKey,
      bound_device: null,
      bound_user: user.uid,
      expiration: expiration,
      createdAt: Timestamp.now(),
      purchasedAt: Timestamp.now()
    }).then(() => {
      // Trừ tiền
      updateDoc(doc(db, 'users', user.uid), {
        balance: balance - price
      }).then(() => {
        showAlert('Mua key thành công!', 'success');
        loadKeys(user);
        loadUserBalance(user);
      });
    });
  });
}

function loadUserBalance(user) {
  getDoc(doc(db, 'users', user.uid)).then((docSnap) => {
    if (docSnap.exists()) {
      const balance = docSnap.data().balance || 0;
      const balanceEl = document.getElementById('user-balance');
      if (balanceEl) {
        balanceEl.textContent = balance.toLocaleString('vi-VN');
      }
    }
  });
}

// Toggle expiration type (cho admin)
function toggleExpirationType() {
  const type = document.getElementById('expiration-type').value;
  document.getElementById('date-input').style.display = type === 'date' ? 'block' : 'none';
  document.getElementById('duration-input').style.display = type === 'duration' ? 'flex' : 'none';
}

// Show alert message
function showAlert(message, type) {
  const alertDiv = document.createElement('div');
  alertDiv.className = `alert alert-${type === 'success' ? 'success' : 'error'}`;
  alertDiv.textContent = message;
  
  const container = document.querySelector('.container');
  if (container) {
    container.insertBefore(alertDiv, container.firstChild);
    
    setTimeout(() => alertDiv.remove(), 3000);
  }
}
