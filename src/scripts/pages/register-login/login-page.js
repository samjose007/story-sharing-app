import ApiService from '../../data/api.js';

export default class LoginPage {
  async render() {
    return `
      <section class="container auth-container">
        <div class="auth-form">
          <h1>Login</h1>
          <form id="login-form">
            <div class="form-group">
              <label for="login-email">Email</label>
              <input type="email" id="login-email" name="email" required>
              <small>Enter your email</small>
            </div>
            <div class="form-group">
              <label for="login-password">Password</label>
              <input type="password" id="login-password" name="password" required>
              <small>Enter your password</small>
            </div>
            <button type="submit" class="btn-primary">Login</button>
          </form>
          <p>Didn't have an account? <a href="#/register">Register Here!</a></p>
        </div>
      </section>
    `;
  }

  async afterRender() {
    const form = document.getElementById('login-form');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const email = document.getElementById('login-email').value;
      const password = document.getElementById('login-password').value;

      const credentials = {
        email: email,
        password: password
      };

      try {
        const response = await ApiService.login(credentials);
        
        if (response.error) {
          throw new Error(response.message);
        }

        if (!response.loginResult || !response.loginResult.token) {
          throw new Error('Token tidak ditemukan dalam response');
        }

        localStorage.setItem('token', response.loginResult.token);
        localStorage.setItem('user', JSON.stringify(response.loginResult));
        
        this.showMessage('Login berhasil!', 'success');
        setTimeout(() => {
          window.location.hash = '#/';
        }, 1000);
        
      } catch (error) {
        this.showMessage('Login gagal: ' + error.message, 'error');
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