import HomePage from '../pages/home/home-page.js';
import AboutPage from '../pages/about/about-page.js';
import LoginPage from '../pages/register-login/login-page.js';
import RegisterPage from '../pages/register-login/register-page.js';
import AddStoryPage from '../pages/add-story-pages.js';

const routes = {
  '/': new HomePage(),
  '/about': new AboutPage(),
  '/login': new LoginPage(),
  '/register': new RegisterPage(),
  '/add-story': new AddStoryPage(),
  '/logout': {
    render: async () => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.hash = '#/login';
      return '<div class="loading">Logging out...</div>';
    },
    afterRender: async () => {}
  }
};

export default routes;