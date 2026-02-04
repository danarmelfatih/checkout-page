// Penghitung jumlah karakter
document.getElementById('name')?.addEventListener('input', function(e) {
  document.getElementById('nameCount').textContent = e.target.value.length;
});

document.getElementById('password')?.addEventListener('input', function(e) {
  document.getElementById('passwordCount').textContent = e.target.value.length;
});

document.getElementById('phone')?.addEventListener('input', function(e) {
  document.getElementById('phoneCount').textContent = e.target.value.length;
});

// Fungsi validasi
function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

function validatePassword(password) {
  // 12 karakter, wajib mengandung huruf dan angka
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  return password.length === 12 && hasLetter && hasNumber;
}

function validatePhone(phone) {
  // 13 digit angka, harus diawali 628
  const re = /^628[0-9]{10}$/;
  return re.test(phone);
}

function showError(fieldName, customMessage = null) {
  const formGroup = document.querySelector(`[data-field="${fieldName}"]`);
  if (formGroup) {
    formGroup.classList.add('error');
    
    // Jika ada custom message, tampilkan
    if (customMessage) {
      const errorMsg = formGroup.querySelector('.error-message');
      if (errorMsg) {
        errorMsg.textContent = customMessage;
      }
    }
  }
}

function hideError(fieldName) {
  const formGroup = document.querySelector(`[data-field="${fieldName}"]`);
  if (formGroup) {
    formGroup.classList.remove('error');
  }
}

// Validasi langsung saat user selesai mengisi (real-time)
document.getElementById('email')?.addEventListener('blur', function(e) {
  if (e.target.value && !validateEmail(e.target.value)) {
    showError('email');
  } else {
    hideError('email');
  }
});

document.getElementById('password')?.addEventListener('blur', function(e) {
  if (e.target.value && !validatePassword(e.target.value)) {
    showError('password');
  } else {
    hideError('password');
  }
});

// ✨ VALIDASI NOMOR WHATSAPP DENGAN HIT API
document.getElementById('phone')?.addEventListener('blur', async function(e) {
  const phoneValue = e.target.value.trim();
  
  // Validasi format dulu
  if (!phoneValue) {
    showError('phone', 'No HP harus diisi');
    return;
  }
  
  if (!validatePhone(phoneValue)) {
    showError('phone', 'No HP harus 13 digit angka dimulai dengan 628');
    return;
  }
  
  // Jika format valid, hit API untuk cek validasi WhatsApp
  try {
    // Tampilkan loading indicator (optional)
    const formGroup = document.querySelector(`[data-field="phone"]`);
    if (formGroup) {
      formGroup.classList.add('validating');
    }
    
    const response = await fetch('/api/cek_valid', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        no_wa: phoneValue
      })
    });
    
    const result = await response.json();
    
    // Hapus loading indicator
    if (formGroup) {
      formGroup.classList.remove('validating');
    }
    
    if (result.status === 'success') {
      // Nomor valid dan terdaftar di WhatsApp
      hideError('phone');
      
      // Optional: Tampilkan pesan sukses
      if (formGroup) {
        formGroup.classList.add('valid');
      }
    } else {
      // Nomor tidak valid atau tidak terdaftar di WhatsApp
      showError('phone', result.message || 'Nomor tidak terdaftar di WhatsApp');
    }
    
  } catch (error) {
    console.error('Error validating WhatsApp number:', error);
    
    // Hapus loading indicator
    const formGroup = document.querySelector(`[data-field="phone"]`);
    if (formGroup) {
      formGroup.classList.remove('validating');
    }
    
    // Tampilkan error umum
    showError('phone', 'Gagal memvalidasi nomor WhatsApp. Silakan coba lagi.');
  }
});

// Pemilihan metode pembayaran
document.querySelectorAll('.payment-option').forEach(option => {
  option.addEventListener('click', function() {
    document.querySelectorAll('.payment-option').forEach(opt => {
      opt.classList.remove('selected');
    });
    this.classList.add('selected');
    this.querySelector('input[type="radio"]').checked = true;
  });
});

// Saat tombol Bayar diklik
document.getElementById('payButton')?.addEventListener('click', function(e) {
  e.preventDefault();
  
  // Ambil nilai dari form
  const product = document.getElementById('product').value.trim();
  const quantity = document.getElementById('quantity').value;
  const name = document.getElementById('name').value.trim();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const phone = document.getElementById('phone').value.trim();
  const paymentRadio = document.querySelector('input[name="payment"]:checked');
  const payment = paymentRadio ? paymentRadio.value : 'virtual-account';
  
  // Penanda validasi
  let isValid = true;
  let errors = [];
  
  // Validasi produk
  if (!product) {
    showError('product');
    errors.push('Nama produk harus diisi');
    isValid = false;
  } else {
    hideError('product');
  }
  
  // Validasi jumlah
  if (!quantity || quantity < 1) {
    showError('quantity');
    errors.push('Jumlah order minimal 1');
    isValid = false;
  } else {
    hideError('quantity');
  }
  
  // Validasi nama
  if (!name || name.length > 15) {
    showError('name');
    errors.push('Nama harus diisi dan maksimal 15 karakter');
    isValid = false;
  } else {
    hideError('name');
  }
  
  // Validasi email
  if (!validateEmail(email)) {
    showError('email');
    errors.push('Email harus valid');
    isValid = false;
  } else {
    hideError('email');
  }
  
  // Validasi password
  if (!validatePassword(password)) {
    showError('password');
    errors.push('Password harus 12 karakter dengan kombinasi huruf dan angka');
    isValid = false;
  } else {
    hideError('password');
  }
  
  // Validasi nomor HP
  if (!validatePhone(phone)) {
    showError('phone');
    errors.push('No HP harus 13 digit angka dimulai dengan 628');
    isValid = false;
  } else {
    hideError('phone');
  }
  
  // Jika semua valid, pindah ke halaman sukses TANPA alert
  if (isValid) {
    // Ambil total harga dari teks tombol
    const totalText = this.textContent.split('|')[1].trim().replace('Rp', '').trim();
    
    // Buat parameter URL
    const params = new URLSearchParams({
      product: product,
      quantity: quantity,
      name: name,
      email: email,
      phone: phone,
      payment: payment,
      total: totalText
    });
    
    // Langsung redirect
    window.location.href = `/checkout/success?${params.toString()}`;
  } else {
    // Tampilkan error di console
    console.log('Validation errors:', errors);
    
    // Scroll ke error pertama
    const firstError = document.querySelector('.form-group.error');
    if (firstError) {
      firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }
});

// Fungsi salin teks di halaman sukses
function copyToClipboard(text, buttonId) {
  navigator.clipboard.writeText(text).then(() => {
    const button = document.getElementById(buttonId);
    if (button) {
      const originalText = button.textContent;
      button.textContent = 'Tersalin!';
      button.style.backgroundColor = '#10b981';
      
      setTimeout(() => {
        button.textContent = originalText;
        button.style.backgroundColor = '';
      }, 2000);
    }
  }).catch(err => {
    console.error('Gagal menyalin:', err);
    alert('Gagal menyalin. Silakan copy manual.');
  });
}