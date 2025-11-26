
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

// Chờ DOM ready để attach events
document.addEventListener('DOMContentLoaded', () => {
    // Attach events cho các trang cụ thể
    if (document.getElementById('login-btn')) {
        document.getElementById('login-btn').addEventListener('click', login);
        document.getElementById('register-btn').addEventListener('click', register);
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

function register() {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
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
              message = 'Mật khẩu không hợp lệ: Phải ít nhất 6 ký tự.';
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
          message = 'Mật khẩu không hợp lệ.';
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
    if (!value) {
      showAlert('Vui lòng nhập số lượng!', 'error');
      return;
    }
    const now = new Date();
    if (unit === 'hours') now.setHours(now.getHours() + value);
    else if (unit === 'days') now.setDate(now.getDate() + value);
    else if (unit === 'months') now.setMonth(now.getMonth() + value);
    else if (unit === 'years') now.setFullYear(now.getFullYear() + value);
    expiration = Timestamp.fromDate(now);
  }

  addDoc(collection(db, 'keys'), {
    key: newKey,
    bound_device: null,
    bound_user: null,
    expiration: expiration,
    createdAt: Timestamp.now(),
    createdBy: user.email
  }).then(() => {
    showAlert('Tạo key thành công!', 'success');
    loadKeys(user);
  });
}

function resetKey(keyId) {
  updateDoc(doc(db, 'keys', keyId), {
    bound_device: null,
    bound_user: null
  }).then(() => {
    showAlert('Reset key thành công!', 'success');
    loadKeys(auth.currentUser);
  });
}

async function loadKeys(user) {
  const keyList = document.getElementById('key-list');
  if (!keyList) return;
  keyList.innerHTML = '';
  
  const userDocSnap = await getDoc(doc(db, 'users', user.uid));
  const isAdmin = userDocSnap.data().role === 'admin';
  const enableSecondary = userDocSnap.data().enableSecondary || false;
  const secondaryPassword = userDocSnap.data().secondaryPassword;
  
  let keysQuery;
  if (isAdmin) {
    keysQuery = collection(db, 'keys');
  } else {
    keysQuery = query(collection(db, 'keys'), where('bound_user', '==', user.uid));
  }
  
  const snapshot = await getDocs(keysQuery);
  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    
    const div = document.createElement('div');
    div.className = 'key-card';
    
    let expText = 'Vĩnh viễn';
    let expStatus = '';
    if (data.expiration) {
      const expDate = data.expiration.toDate();
      expText = expDate.toLocaleString('vi-VN');
      expStatus = expDate > new Date() ? '✅ Còn hạn' : '❌ Hết hạn';
    }
    
    const keyDisplay = enableSecondary ? '********' : data.key;
    const keyClass = enableSecondary ? 'hidden-key' : '';
    
    div.innerHTML = `
      <div class="key-info">
        <div>
          <div class="key-code ${keyClass}" data-key="${data.key}">${keyDisplay}</div>
          <div class="key-meta">
            📅 Hết hạn: ${expText} ${expStatus}<br>
            💻 Thiết bị: ${data.bound_device || 'Chưa kích hoạt'}<br>
            ${isAdmin ? `👤 User: ${data.bound_user || 'Chưa gán'}<br>📧 Tạo bởi: ${data.createdBy || 'Unknown'}<br>⏰ Thời gian tạo: ${data.createdAt.toDate().toLocaleString('vi-VN')}` : ''}
          </div>
        </div>
        <div class="key-actions">
          <button class="btn-success show-key-btn" data-key-id="${docSnap.id}">👁️ Hiện Key</button>
          <button class="btn-success copy-key-btn" data-key="${data.key}">📋 Copy</button>
          <button class="btn-success" data-key-id="${docSnap.id}">Reset</button>
          <button class="btn-danger" data-key-id="${docSnap.id}">Xóa</button>
        </div>
      </div>
    `;
    keyList.appendChild(div);
  }

  // Attach events cho buttons động
  keyList.querySelectorAll('.show-key-btn').forEach(btn => {
    btn.addEventListener('click', () => showKey(btn.dataset.keyId, enableSecondary, secondaryPassword));
  });
  keyList.querySelectorAll('.copy-key-btn').forEach(btn => {
    btn.addEventListener('click', () => copyKey(btn.dataset.key));
  });
  keyList.querySelectorAll('.btn-success:not(.show-key-btn):not(.copy-key-btn)').forEach(btn => {
    btn.addEventListener('click', () => resetKey(btn.dataset.keyId));
  });
  keyList.querySelectorAll('.btn-danger').forEach(btn => {
    btn.addEventListener('click', () => deleteKey(btn.dataset.keyId));
  });
}

function copyKey(key) {
  navigator.clipboard.writeText(key).then(() => {
    showAlert('Copy key thành công!', 'success');
  });
}

function showKey(keyId, enableSecondary, secondaryPassword) {
  if (enableSecondary) {
    const input = prompt('Nhập mật khẩu cấp 2 để hiện key:');
    if (input !== secondaryPassword) {
      showAlert('Mật khẩu cấp 2 sai!', 'error');
      return;
    }
  }
  const keyElement = document.querySelector(`[data-key-id="${keyId}"]`).parentElement.previousSibling.querySelector('.key-code');
  keyElement.classList.add('visible');
  keyElement.textContent = keyElement.dataset.key;
}

function deleteKey(keyId) {
  if (!confirm('Bạn có chắc muốn xóa key này?')) return;
  deleteDoc(doc(db, `keys`, keyId)).then(() => {
    showAlert('Xóa key thành công!', 'success');
    loadKeys(auth.currentUser);
  });
}

async function loadUsers() {
  const userList = document.getElementById('user-list');
  if (!userList) return;
  userList.innerHTML = '';
  
  const snapshot = await getDocs(collection(db, 'users'));
  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    const div = document.createElement('div');
    div.className = 'user-card';
    
    div.innerHTML = `
      <div class="user-info">
        <div class="user-email">${data.email}</div>
        <span class="user-role">${data.role === 'admin' ? '👑 Admin' : '👤 User'}</span>
        <div class="key-meta">💰 Số dư: ${(data.balance || 0).toLocaleString('vi-VN')} VNĐ<br>⏰ Tạo lúc: ${data.createdAt.toDate().toLocaleString('vi-VN')}</div>
      </div>
      <button class="btn-danger" data-user-id="${docSnap.id}" data-email="${data.email}">Xóa</button>
    `;
    userList.appendChild(div);
  }

  // Attach events cho buttons động
  userList.querySelectorAll('.btn-danger').forEach(btn => {
    btn.addEventListener('click', () => deleteUser(btn.dataset.userId, btn.dataset.email));
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

// USER: Mua key với loại và giá khác nhau
async function purchaseKey() {
  const user = auth.currentUser;
  if (!user) return;
  
  const userDoc = await getDoc(doc(db, 'users', user.uid));
  const enableSecondary = userDoc.data().enableSecondary || false;
  const secondaryPassword = userDoc.data().secondaryPassword;
  
  if (enableSecondary) {
    const input = document.getElementById('purchase-secondary-password').value;
    if (input !== secondaryPassword) {
      showAlert('Mật khẩu cấp 2 sai!', 'error');
      return;
    }
  }
  
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
    purchasedAt: Timestamp.now(),
    createdBy: user.email
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

function loadUserInfo(user) {
  const emailEl = document.getElementById('user-email');
  if (emailEl) {
    emailEl.textContent = user.email;
  }
  loadUserBalance(user);
}

function changePassword() {
  const user = auth.currentUser;
  const oldPassword = document.getElementById('old-password').value;
  const newPassword = document.getElementById('new-password').value;

  // Re-authenticate with old password
  signInWithEmailAndPassword(auth, user.email, oldPassword)
    .then(() => {
      updatePassword(user, newPassword)
        .then(() => showAlert('Đổi mật khẩu thành công!', 'success'))
        .catch((error) => showAlert('Lỗi đổi mật khẩu: ' + error.message, 'error'));
    })
    .catch(() => showAlert('Mật khẩu cũ sai!', 'error'));
}

function setSecondaryPassword() {
  const user = auth.currentUser;
  const secondary = document.getElementById('secondary-password').value;
  if (!secondary) return showAlert('Nhập mật khẩu cấp 2!', 'error');

  updateDoc(doc(db, 'users', user.uid), { secondaryPassword: secondary })
    .then(() => showAlert('Thiết lập mật khẩu cấp 2 thành công!', 'success'));
}

async function toggleSecondaryPasswordButton() {
  const user = auth.currentUser;
  const button = document.getElementById('toggle-secondary-btn');
  const currentEnabled = button.textContent.includes('Tắt');
  const enabled = !currentEnabled;

  if (enabled) {
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (!userDoc.data().secondaryPassword) {
      showAlert('Vui lòng thiết lập mật khẩu cấp 2 trước khi bật!', 'error');
      return;
    }
  }

  updateDoc(doc(db, 'users', user.uid), { enableSecondary: enabled })
    .then(() => {
      showAlert(`Mật khẩu cấp 2 đã ${enabled ? 'bật' : 'tắt'}!`, 'success');
      button.textContent = enabled ? 'Tắt Mật Khẩu C2' : 'Bật Mật Khẩu C2';
      document.getElementById('purchase-secondary-password').style.display = enabled ? 'block' : 'none';
      loadKeys(user); // Reload to apply hiding
    });
}

function loadSecondaryPasswordSettings(user) {
  getDoc(doc(db, 'users', user.uid)).then((docSnap) => {
    if (docSnap.exists()) {
      const enabled = docSnap.data().enableSecondary || false;
      const button = document.getElementById('toggle-secondary-btn');
      if (button) {
        button.textContent = enabled ? 'Tắt Mật Khẩu C2' : 'Bật Mật Khẩu C2';
      }
      document.getElementById('purchase-secondary-password').style.display = enabled ? 'block' : 'none';
    }
  });
}

async function loadUsersForAddBalance() {
  const select = document.getElementById('add-balance-user');
  if (!select) return;

  const snapshot = await getDocs(collection(db, 'users'));
  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    if (data.role !== 'admin') {
      const option = document.createElement('option');
      option.value = docSnap.id;
      option.textContent = data.email;
      select.appendChild(option);
    }
  }
}

function addUserBalance() {
  const userId = document.getElementById('add-balance-user').value;
  const amount = parseInt(document.getElementById('add-balance-amount').value);
  if (!userId || !amount || amount <= 0) return showAlert('Chọn user và nhập số tiền hợp lệ!', 'error');

  getDoc(doc(db, 'users', userId)).then((docSnap) => {
    const currentBalance = docSnap.data().balance || 0;
    updateDoc(doc(db, 'users', userId), { balance: currentBalance + amount })
      .then(() => {
        showAlert(`Cộng ${amount.toLocaleString('vi-VN')} VNĐ thành công!`, 'success');
        loadUsers();
      });
  });
}

function changeAdminPassword() {
  const user = auth.currentUser;
  const oldPassword = document.getElementById('admin-old-password').value;
  const newPassword = document.getElementById('admin-new-password').value;

  // Re-authenticate with old password
  signInWithEmailAndPassword(auth, user.email, oldPassword)
    .then(() => {
      updatePassword(user, newPassword)
        .then(() => showAlert('Đổi mật khẩu admin thành công!', 'success'))
        .catch((error) => showAlert('Lỗi đổi mật khẩu: ' + error.message, 'error'));
    })
    .catch(() => showAlert('Mật khẩu cũ sai!', 'error'));
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

async function downloadVPSManager() {
  const user = auth.currentUser;
  if (!user) return showAlert('Vui lòng đăng nhập!', 'error');
  
  const inputKey = document.getElementById('download-key').value;
  if (!inputKey) return showAlert('Nhập key để tải!', 'error');
  
  const q = query(collection(db, 'keys'), where('key', '==', inputKey), where('bound_user', '==', user.uid));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return showAlert('Key không hợp lệ hoặc không thuộc về bạn!', 'error');
  
  const settingsDoc = await getDoc(doc(db, 'settings', 'general'));
  if (settingsDoc.exists() && settingsDoc.data().download_link) {
    window.open(settingsDoc.data().download_link, '_blank');
  } else {
    showAlert('Link tải không khả dụng!', 'error');
  }
}
