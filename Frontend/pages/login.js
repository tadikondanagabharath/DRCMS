export default {
  title: 'Login',
  html: `
    <section class="auth-page">
      <div class="auth-card">
        <h3>Login to DRCMS</h3>
        <p>Securely access your disaster response dashboard and messaging tools.</p>
        <form class="auth-form login-form">
          <label for="login-email">Email address</label>
          <input id="login-email" name="email" type="email" placeholder="you@example.com" required />
          <label for="login-password">Password</label>
          <input id="login-password" name="password" type="password" placeholder="Enter your password" required />
          <button type="submit">Sign in</button>
          <div class="auth-status" aria-live="polite"></div>
        </form>
        <p class="auth-switch">
          Don't have an account? <button type="button" class="link-button" data-target-page="signup">Create one</button>
        </p>
      </div>
    </section>
  `,
};
