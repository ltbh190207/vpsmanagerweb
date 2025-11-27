/* Reset & Base Styles */
 {
    margin: 0;
    padding: 0;
    box- sizing: border - box;
}

body {
    font - family: 'Segoe UI', Tahoma, Geneva, Verdana, sans - serif;
    background: linear - gradient(135deg, #667eea 0 %, #764ba2 100 %);
    min - height: 100vh;
    color: #fff;
    padding: 20px;
}

/* Container Styles */
.container {
    max - width: 1200px;
    margin: 0 auto;
    background: rgba(255, 255, 255, 0.95);
    border - radius: 20px;
    padding: 40px;
    box - shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    color: #333;
    animation: fadeIn 0.5s ease;
}

@keyframes fadeIn {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
}

/* Header Styles */
h1 {
    color: #667eea;
    font - size: 2.5rem;
    margin - bottom: 10px;
    text - align: center;
    text - shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
}

h2 {
    color: #764ba2;
    font - size: 1.8rem;
    margin: 30px 0 15px;
    border - bottom: 3px solid #667eea;
    padding - bottom: 10px;
}

p {
    text - align: center;
    font - size: 1.1rem;
    margin - bottom: 20px;
    color: #666;
}

/* Input & Select Styles */
input, select, textarea {
    width: 100 %;
    padding: 15px;
    margin: 10px 0;
    border: 2px solid #e0e0e0;
    border - radius: 10px;
    font - size: 1rem;
    transition: all 0.3s ease;
    background: #fff;
    color: #333;
}

input: focus, select: focus, textarea:focus {
    outline: none;
    border - color: #667eea;
    box - shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

/* Button Styles */
button, .btn {
    padding: 15px 30px;
    background: linear - gradient(135deg, #667eea 0 %, #764ba2 100 %);
    color: #fff;
    border: none;
    border - radius: 10px;
    font - size: 1rem;
    font - weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    box - shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
    width: 100 %;
    margin: 10px 0;
    text - decoration: none;
    display: inline - block;
    text - align: center;
}

button: hover, .btn:hover {
    transform: translateY(-2px);
    box - shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
}

button:active {
    transform: translateY(0);
}

.btn - secondary {
    background: linear - gradient(135deg, #f093fb 0 %, #f5576c 100 %);
}

.btn - danger {
    background: linear - gradient(135deg, #ff6b6b 0 %, #ee5a6f 100 %);
    padding: 8px 15px;
    width: auto;
    margin: 0 5px;
    font - size: 0.9rem;
}

.btn - success {
    background: linear - gradient(135deg, #56ab2f 0 %, #a8e063 100 %);
    padding: 8px 15px;
    width: auto;
    margin: 0 5px;
    font - size: 0.9rem;
}

/* Key Card Styles */
.key - card {
    background: linear - gradient(135deg, #f5f7fa 0 %, #c3cfe2 100 %);
    border - radius: 15px;
    padding: 20px;
    margin: 15px 0;
    box - shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
    transition: all 0.3s ease;
}

.key - card:hover {
    transform: translateY(-5px);
    box - shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
}

.key - info {
    display: flex;
    justify - content: space - between;
    align - items: center;
    flex - wrap: wrap;
    gap: 10px;
}

.key - code {
    font - family: 'Courier New', monospace;
    font - size: 1.1rem;
    font - weight: bold;
    color: #667eea;
    word -break: break-all;
}

.key - meta {
    font - size: 0.9rem;
    color: #666;
    margin - top: 10px;
}

.key - actions {
    display: flex;
    gap: 10px;
    margin - top: 10px;
}

/* User Card Styles */
.user - card {
    background: linear - gradient(135deg, #ffecd2 0 %, #fcb69f 100 %);
    border - radius: 15px;
    padding: 20px;
    margin: 15px 0;
    display: flex;
    justify - content: space - between;
    align - items: center;
    box - shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
    flex - wrap: wrap;
}

.user - info {
    flex: 1;
}

.user - email {
    font - weight: bold;
    font - size: 1.1rem;
    color: #333;
}

.user - role {
    display: inline - block;
    padding: 5px 15px;
    background: #667eea;
    color: #fff;
    border - radius: 20px;
    font - size: 0.9rem;
    margin - top: 5px;
}

/* Price Card */
.price - card {
    background: linear - gradient(135deg, #f093fb 0 %, #f5576c 100 %);
    color: #fff;
    border - radius: 20px;
    padding: 30px;
    text - align: center;
    margin: 20px 0;
    box - shadow: 0 10px 30px rgba(240, 147, 251, 0.4);
}

.price - amount {
    font - size: 3rem;
    font - weight: bold;
    margin: 20px 0;
}

.price - card p {
    color: #fff;
    font - size: 1.2rem;
}

.price - card h2 {
    border - bottom: none;
}

/* Links */
a {
    color: #667eea;
    text - decoration: none;
    font - weight: 600;
    transition: all 0.3s ease;
    display: inline - block;
    margin: 10px 5px;
}

a:hover {
    color: #764ba2;
    transform: translateX(5px);
}

/* Footer */
footer {
    text - align: center;
    margin - top: 40px;
    padding: 20px;
    background: rgba(255, 255, 255, 0.1);
    border - radius: 15px;
}

footer a {
    color: #fff;
    margin: 0 15px;
    font - size: 1.1rem;
    transition: all 0.3s ease;
}

footer a:hover {
    color: #f093fb;
    transform: scale(1.1);
}

/* Form Grid */
.form - grid {
    display: grid;
    grid - template - columns: 1fr 1fr;
    gap: 15px;
    margin: 20px 0;
}

.form - group {
    display: flex;
    flex - direction: column;
}

.form - group label {
    font - weight: 600;
    margin - bottom: 5px;
    color: #667eea;
}

/* Alert Messages */
.alert {
    padding: 15px;
    border - radius: 10px;
    margin: 15px 0;
    font - weight: 600;
}

.alert - success {
    background: #d4edda;
    color: #155724;
    border: 2px solid #c3e6cb;
}

.alert - error {
    background: #f8d7da;
    color: #721c24;
    border: 2px solid #f5c6cb;
}

/* Loading Spinner */
.loading {
    display: inline - block;
    width: 20px;
    height: 20px;
    border: 3px solid rgba(255, 255, 255, .3);
    border - radius: 50 %;
    border - top - color: #fff;
    animation: spin 1s ease -in -out infinite;
}

@keyframes spin {
    to { transform: rotate(360deg); }
}

/* Modal Styles (thêm để đồng bộ với share.html) */
.modal {
    display: none;
    position: fixed;
    z - index: 1;
    left: 0;
    top: 0;
    width: 100 %;
    height: 100 %;
    overflow: auto;
    background - color: rgba(0, 0, 0, 0.4);
    justify - content: center;
    align - items: center;
}

.modal - content {
    background - color: #fefefe;
    margin: 15 % auto;
    padding: 20px;
    border: 1px solid #888;
    width: 80 %;
    max - width: 500px;
    border - radius: 15px;
    box - shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
}

.close {
    color: #aaa;
    float: right;
    font - size: 28px;
    font - weight: bold;
}

.close: hover,
.close:focus {
    color: black;
    text - decoration: none;
    cursor: pointer;
}

/* Code block in modal */
code {
    word -break: break-all;
    color: #333;
}

/* ============================================
   RESPONSIVE - MOBILE (max-width: 768px)
   ============================================ */
@media(max - width: 768px) {
    body {
        padding: 10px;
    }
    
    .container {
        padding: 20px;
        border - radius: 15px;
    }
    
    h1 {
        font - size: 1.8rem;
    }
    
    h2 {
        font - size: 1.4rem;
    }
    
    .form - grid {
        grid - template - columns: 1fr;
    }
    
    .key - info {
        flex - direction: column;
        align - items: flex - start;
    }
    
    .key - actions {
        width: 100 %;
        flex - direction: column;
    }
    
    .key - actions button {
        width: 100 %;
    }
    
    .user - card {
        flex - direction: column;
        align - items: flex - start;
    }
    
    .price - amount {
        font - size: 2rem;
    }
    
    footer a {
        display: block;
        margin: 10px 0;
    }

    button, .btn {
        padding: 12px 20px;
        font - size: 0.95rem;
    }
}

/* ============================================
   RESPONSIVE - TABLET (768px - 1024px)
   ============================================ */
@media(min - width: 769px) and(max - width: 1024px) {
    .container {
        max - width: 900px;
        padding: 35px;
    }
    
    .form - grid {
        grid - template - columns: 1fr 1fr;
    }
}

/* ============================================
   RESPONSIVE - DESKTOP (min-width: 1025px)
   ============================================ */
@media(min - width: 1025px) {
    .container {
        max - width: 1200px;
    }
    
    .form - grid {
        grid - template - columns: repeat(3, 1fr);
    }
    
    .key - card, .user - card {
        transition: all 0.3s ease;
    }
    
    .key - card:hover {
        transform: translateY(-8px);
    }
}

/* Empty State */
.empty - state {
    text - align: center;
    padding: 60px 20px;
    color: #999;
}

.empty - state svg {
    width: 150px;
    height: 150px;
    margin - bottom: 20px;
    opacity: 0.5;
}
/* Hiệu ứng click cho button */
button:active {
    transform: scale(0.95);
    box - shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
    transition: transform 0.1s ease, box - shadow 0.1s ease;
}

/* Hidden Key Styles */
.hidden - key {
    filter: blur(5px);
}
.hidden - key.visible {
    filter: none;
}
