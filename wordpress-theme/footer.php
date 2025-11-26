<footer class="site-footer">
  <div class="container">
    <div class="site-footer__inner">

      <div>
        <p class="footer-brand__name">La Maison Bakery</p>
        <p class="footer-brand__tagline">Handcrafted with love, baked fresh every morning. Open Tuesday–Sunday, 7 AM – 3 PM.</p>
      </div>

      <div>
        <p class="footer-col__heading">Explore</p>
        <ul class="footer-col__links">
          <li><a href="<?php echo esc_url(home_url('/')); ?>">Home</a></li>
          <li><a href="<?php echo esc_url(home_url('/our-menu')); ?>">Our Menu</a></li>
          <li><a href="<?php echo esc_url(home_url('/our-story')); ?>">Our Story</a></li>
          <li><a href="<?php echo esc_url(home_url('/contact')); ?>">Contact</a></li>
        </ul>
      </div>

      <div>
        <p class="footer-col__heading">Visit Us</p>
        <ul class="footer-col__links">
          <li>123 Maple Street</li>
          <li>Toronto, ON</li>
          <li><a href="mailto:hello@lamaisonbakery.ca">hello@lamaisonbakery.ca</a></li>
          <li>Tue–Sun 7 AM – 3 PM</li>
        </ul>
      </div>

    </div>
    <div class="site-footer__bottom">
      <p>&copy; <?php echo date('Y'); ?> La Maison Bakery. Built with a custom WordPress theme.</p>
    </div>
  </div>
</footer>

<?php wp_footer(); ?>
</body>
</html>
