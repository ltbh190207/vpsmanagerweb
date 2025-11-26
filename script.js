// Sử dụng global Firebase từ HTML module
const { app, auth, db, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, collection, addDoc, getDocs, getDoc, doc, setDoc, updateDoc, deleteDoc, Timestamp } = window.firebase || {};

const ADMIN_EMAIL = 'admin@vpsmanager.com';

onAuthStateChanged(auth, (user) => {
  if (user) {
    if (window.location.pathname.includes('login.html') || window.location.pathname === '/') {
      // Redirect to dashboard
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
    alert('Mật khẩu phải ít nhất 6 ký tự!');
    return;
  }
  createUserWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      const user = userCredential.user;
      setDoc(doc(db, 'users', user.uid), {
        email: email,
        role: (email === ADMIN_EMAIL) ? 'admin' : 'user',
        createdAt: Timestamp.now()
      }).then(() => {
        alert('Đăng ký thành công! Đang đăng nhập...');
        // Tự động đăng nhập
        signInWithEmailAndPassword(auth, email, password);
      });
    })
    .catch((error) => alert('Lỗi đăng ký: ' + error.message));
}

function login() {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  signInWithEmailAndPassword(auth, email, password)
    .then(() => alert('Đăng nhập thành công!'))
    .catch((error) => alert('Lỗi đăng nhập: ' + error.message));
}

function logout() {
  signOut(auth);
}

function createKey() {
  const user = auth.currentUser;
  if (!user) return;
  const newKey = crypto.randomUUID();
  const expirationOption = document.getElementById('expiration-select').value;
  let expiration = null;
  if (expirationOption !== 'none') {
    const now = new Date();
    if (expirationOption === '1month') now.setMonth(now.getMonth() + 1);
    else if (expirationOption === '3months') now.setMonth(now.getMonth() + 3);
    else if (expirationOption === '1year') now.setFullYear(now.getFullYear() + 1);
    expiration = Timestamp.fromDate(now);
  }
  addDoc(collection(db, `users/${user.uid}/keys`), {
    key: newKey,
    bound_device: null,
    expiration: expiration
  }).then(() => loadKeys(user));
}

function resetKey(docId) {
  const user = auth.currentUser;
  updateDoc(doc(db, `users/${user.uid}/keys`, docId), {
    bound_device: null
  }).then(() => loadKeys(user));
}

function loadKeys(user) {
  const keyList = document.getElementById('key-list');
  if (!keyList) return;
  keyList.innerHTML = '';
  getDocs(collection(db, `users/${user.uid}/keys`)).then((snapshot) => {
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const li = document.createElement('li');
      let expText = data.expiration ? data.expiration.toDate().toLocaleDateString() : 'Vĩnh viễn';
      li.textContent = `${data.key} (Hết hạn: ${expText}) (Máy: ${data.bound_device || 'Chưa bind'})`;
      const resetBtn = document.createElement('button');
      resetBtn.textContent = 'Reset';
      resetBtn.onclick = () => resetKey(docSnap.id);
      const deleteBtn = document.createElement('button');
      deleteBtn.textContent = 'Xóa';
      deleteBtn.onclick = () => deleteDoc(doc(db, `users/${user.uid}/keys`, docSnap.id)).then(() => loadKeys(user));
      li.appendChild(resetBtn);
      li.appendChild(deleteBtn);
      keyList.appendChild(li);
    });
  });
}

function loadUsers() {
  const userList = document.getElementById('user-list');
  if (!userList) return;
  userList.innerHTML = '';
  getDocs(collection(db, 'users')).then((snapshot) => {
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const li = document.createElement('li');
      li.textContent = `${data.email} (Role: ${data.role})`;
      const deleteBtn = document.createElement('button');
      deleteBtn.textContent = 'Xóa User';
      deleteBtn.onclick = () => {
        if (confirm(`Xóa user ${data.email}?`)) {
          deleteDoc(doc(db, 'users', docSnap.id));
          getDocs(collection(db, `users/${docSnap.id}/keys`)).then((keySnapshot) => {
            keySnapshot.forEach((kDoc) => deleteDoc(kDoc.ref));
          });
          loadUsers();
        }
      };
      li.appendChild(deleteBtn);
      userList.appendChild(li);
    });
  });
}

function updateDownloadLink() {
  const link = document.getElementById('download-link').value;
  if (!link) return alert('Nhập link!');
  setDoc(doc(db, 'settings', 'general'), { download_link: link }, { merge: true }).then(() => alert('Link updated!'));
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
        btn.onclick = () => window.open(docSnap.data().download_link, '_blank');
      }
    }
  });
}
