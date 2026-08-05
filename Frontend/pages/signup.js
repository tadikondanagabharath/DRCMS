export default {
  title: 'Sign Up',
  html: `
    <section class="auth-page">
      <div class="auth-card">
        <h3>Create an account</h3>
        <p>Register to report incidents, monitor alerts, and coordinate rescue efforts.</p>
        <form class="auth-form signup-form">
          <label for="signup-name">Full name</label>
          <input id="signup-name" name="name" type="text" placeholder="Your full name" required />
          <label for="signup-email">Email address</label>
          <input id="signup-email" name="email" type="email" placeholder="you@example.com" required />
          <label for="signup-password">Password</label>
          <input id="signup-password" name="password" type="password" placeholder="Create a password" required />
          <button type="submit">Create account</button>
          <div class="auth-status" aria-live="polite"></div>
        </form>
        <p class="auth-switch">
          Already have an account? <button type="button" class="link-button" data-target-page="login">Log in</button>
        </p>
      </div>
    </section>
  `,
};
