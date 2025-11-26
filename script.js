const firebaseConfig = {
   apiKey: "AIzaSyCe3V1JFEI9w3UoREuehqMx9gxtz-Yw1oc",
  authDomain: "vpsmanagerweb.firebaseapp.com",
  projectId: "vpsmanagerweb",
  storageBucket: "vpsmanagerweb.firebasestorage.app",
  messagingSenderId: "851393978130",
  appId: "1:851393978130:web:24fddef37a51f577565dcb",
  measurementId: "G-7H51LQGZV0"
};

const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

const ADMIN_EMAIL = 'admin@vpsmanager.com';

auth.onAuthStateChanged(user => {
  if (user) {
    if (window.location.pathname.includes('login.html') || window.location.pathname === '/') {
      window.location.href = doc.data().role === 'admin' ? 'admin-dashboard.html' : 'user-dashboard.html';
    }
    loadKeys(user);
    if (window.location.pathname.includes('admin-dashboard.html')) {
      loadUsers();
      loadDownloadLink();
    }
  } else {
    if (window.location.pathname.includes('dashboard.html')) {
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
  auth.createUserWithEmailAndPassword(email, password)
    .then((userCredential) => {
      const user = userCredential.user;
      db.collection('users').doc(user.uid).set({
        email: email,
        role: (email === ADMIN_EMAIL) ? 'admin' : 'user',
        createdAt: firebase.firestore.Timestamp.now()
      });
      // Tự động đăng nhập sau đăng ký
      login(email, password);
    })
    .catch(err => alert(err.message));
}

function login(email, password) {
  auth.signInWithEmailAndPassword(email, password)
    .then(() => alert('Đăng nhập thành công!'))
    .catch(err => alert(err.message));
}

function logout() {
  auth.signOut();
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
    expiration = firebase.firestore.Timestamp.fromDate(now);
  }
  db.collection(`users/${user.uid}/keys`).add({
    key: newKey,
    bound_device: null,
    expiration: expiration
  }).then(() => loadKeys(user));
}

function loadKeys(user) {
  const keyList = document.getElementById('key-list');
  if (!keyList) return;
  keyList.innerHTML = '';
  db.collection(`users/${user.uid}/keys`).get().then(snapshot => {
    snapshot.forEach(doc => {
      const data = doc.data();
      const li = document.createElement('li');
      let expText = data.expiration ? new Date(data.expiration.seconds * 1000).toLocaleDateString() : 'Vĩnh viễn';
      li.textContent = `${data.key} (Exp: ${expText}) (Bound: ${data.bound_device || 'Chưa bind'})`;
      const resetBtn = document.createElement('button');
      resetBtn.textContent = 'Reset';
      resetBtn.onclick = () => db.collection(`users/${user.uid}/keys`).doc(doc.id).update({bound_device: null}).then(() => loadKeys(user));
      const deleteBtn = document.createElement('button');
      deleteBtn.textContent = 'Xóa';
      deleteBtn.onclick = () => db.collection(`users/${user.uid}/keys`).doc(doc.id).delete().then(() => loadKeys(user));
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
  db.collection('users').get().then(snapshot => {
    snapshot.forEach(doc => {
      const data = doc.data();
      const li = document.createElement('li');
      li.textContent = `${data.email} (Role: ${data.role})`;
      const deleteBtn = document.createElement('button');
      deleteBtn.textContent = 'Xóa User';
      deleteBtn.onclick = () => {
        if (confirm(`Xóa user ${data.email}?`)) {
          db.collection('users').doc(doc.id).delete();
          db.collection(`users/${doc.id}/keys`).get().then(snapshot => {
            snapshot.forEach(keyDoc => keyDoc.ref.delete());
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
  db.collection('settings').doc('general').set({download_link: link}, {merge: true}).then(() => alert('Link updated!'));
}

function loadDownloadLink() {
  db.collection('settings').doc('general').get().then(doc => {
    if (doc.exists) {
      document.getElementById('download-link').value = doc.data().download_link || '';
    }
  });
}

function loadDownloadLinkForHome() {
  db.collection('settings').doc('general').get().then(doc => {
    if (doc.exists) {
      const btn = document.getElementById('download-btn');
      btn.onclick = () => window.open(doc.data().download_link, '_blank');
    }
  });
}
