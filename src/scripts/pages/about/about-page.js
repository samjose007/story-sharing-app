export default class AboutPage {
  async render() {
    return `
      <section class="container about-container">
        <div class="about-content">
          <h1>About App</h1>
          <p>Story Sharing App is a platform for sharing experiences and stories with the community.</p>
          <div class="features">
            <h3>Features:</h3>
            <ul>
              <li>Share stories with photos</li>
              <li>Mark locations on maps</li>
              <li>View stories from other users</li>
            </ul>
          </div>
        </div>
      </section>
    `;
  }

  async afterRender() {
    return;
  }
}