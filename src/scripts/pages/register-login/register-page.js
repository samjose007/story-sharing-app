import ApiService from '../../data/api.js';

export default class RegisterPage {
  async render() {
    return `
      <section class="container auth-container">
        <div class="auth-form">
          <h1>Register</h1>
          <form id="register-form">
            <div class="form-group">
              <label for="register-name">Name</label>
              <input type="text" id="register-name" name="name" required>
              <small>Enter your full name</small>
            </div>
            <div class="form-group">
              <label for="register-email">Email</label>
              <input type="email" id="register-email" name="email" required>
              <small>Enter the valid email</small>
            </div>
            <div class="form-group">
              <label for="register-password">Password</label>
              <input type="password" id="register-password" name="password" required minlength="8">
              <small>Password must have minimum 8 characters.</small>
            </div>
            <button type="submit" class="btn-primary">Register</button>
          </form>
          <p>Already have an account? <a href="#/login">Login Here!</a></p>
        </div>
      </section>
    `;
  }

  async afterRender() {
    const form = document.getElementById('register-form');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const name = document.getElementById('register-name').value;
      const email = document.getElementById('register-email').value;
      const password = document.getElementById('register-password').value;

      const userData = {
        name: name,
        email: email,
        password: password
      };

      try {
        const response = await ApiService.register(userData);
        
        if (response.error) {
          throw new Error(response.message);
        }

        this.showMessage('Registrasi berhasil! Silakan login.', 'success');
        setTimeout(() => {
          window.location.hash = '#/login';
        }, 2000);
        
      } catch (error) {
        this.showMessage('Registrasi gagal: ' + error.message, 'error');
      }
    });
  }

  showMessage(message, type = 'info') {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = message;
    messageDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 15px;
      background: ${type === 'error' ? '#f44336' : '#4CAF50'};
      color: white;
      border-radius: 5px;
      z-index: 10000;
    `;
    
    document.body.appendChild(messageDiv);
    setTimeout(() => messageDiv.remove(), 5000);
  }
}