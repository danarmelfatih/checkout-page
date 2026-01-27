// Character counters
document.getElementById('name')?.addEventListener('input', function(e) {
  document.getElementById('nameCount').textContent = e.target.value.length;
});

document.getElementById('password')?.addEventListener('input', function(e) {
  document.getElementById('passwordCount').textContent = e.target.value.length;
});

document.getElementById('phone')?.addEventListener('input', function(e) {
  document.getElementById('phoneCount').textContent = e.target.value.length;
});

// Validation functions
function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

function validatePassword(password) {
  // 12 karakter, harus ada huruf dan angka
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  return password.length === 12 && hasLetter && hasNumber;
}

function validatePhone(phone) {
  // 13 digit, dimulai dengan 628
  const re = /^628[0-9]{10}$/;
  return re.test(phone);
}

function showError(fieldName) {
  const formGroup = document.querySelector(`[data-field="${fieldName}"]`);
  if (formGroup) {
    formGroup.classList.add('error');
  }
}

function hideError(fieldName) {
  const formGroup = document.querySelector(`[data-field="${fieldName}"]`);
  if (formGroup) {
    formGroup.classList.remove('error');
  }
}

// Real-time validation
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

document.getElementById('phone')?.addEventListener('blur', function(e) {
  if (e.target.value && !validatePhone(e.target.value)) {
    showError('phone');
  } else {
    hideError('phone');
  }
});

// Payment method selection
document.querySelectorAll('.payment-option').forEach(option => {
  option.addEventListener('click', function() {
    document.querySelectorAll('.payment-option').forEach(opt => {
      opt.classList.remove('selected');
    });
    this.classList.add('selected');
    this.querySelector('input[type="radio"]').checked = true;
  });
});

// Handle Pay Button Click
document.getElementById('payButton')?.addEventListener('click', function(e) {
  e.preventDefault();
  
  // Get form values
  const product = document.getElementById('product').value.trim();
  const quantity = document.getElementById('quantity').value;
  const name = document.getElementById('name').value.trim();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const phone = document.getElementById('phone').value.trim();
  const paymentRadio = document.querySelector('input[name="payment"]:checked');
  const payment = paymentRadio ? paymentRadio.value : 'virtual-account';
  
  // Validation flags
  let isValid = true;
  let errors = [];
  
  // Validate product
  if (!product) {
    showError('product');
    errors.push('Nama produk harus diisi');
    isValid = false;
  } else {
    hideError('product');
  }
  
  // Validate quantity
  if (!quantity || quantity < 1) {
    showError('quantity');
    errors.push('Jumlah order minimal 1');
    isValid = false;
  } else {
    hideError('quantity');
  }
  
  // Validate name
  if (!name || name.length > 15) {
    showError('name');
    errors.push('Nama harus diisi dan maksimal 15 karakter');
    isValid = false;
  } else {
    hideError('name');
  }
  
  // Validate email
  if (!validateEmail(email)) {
    showError('email');
    errors.push('Email harus valid');
    isValid = false;
  } else {
    hideError('email');
  }
  
  // Validate password
  if (!validatePassword(password)) {
    showError('password');
    errors.push('Password harus 12 karakter dengan kombinasi huruf dan angka');
    isValid = false;
  } else {
    hideError('password');
  }
  
  // Validate phone
  if (!validatePhone(phone)) {
    showError('phone');
    errors.push('No HP harus 13 digit angka dimulai dengan 628');
    isValid = false;
  } else {
    hideError('phone');
  }
  
  // If all valid, redirect to success page WITHOUT alert
  if (isValid) {
    // Get total from button text
    const totalText = this.textContent.split('|')[1].trim().replace('Rp', '').trim();
    
    // Create URL parameters
    const params = new URLSearchParams({
      product: product,
      quantity: quantity,
      name: name,
      email: email,
      phone: phone,
      payment: payment,
      total: totalText
    });
    
    // LANGSUNG redirect tanpa alert
    window.location.href = `/checkout/success?${params.toString()}`;
  } else {
    // Show errors
    console.log('Validation errors:', errors);
    
    // Scroll to first error
    const firstError = document.querySelector('.form-group.error');
    if (firstError) {
      firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }
});

// Copy functionality for success page
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
    console.error('Failed to copy:', err);
    alert('Gagal menyalin. Silakan copy manual.');
  });
}