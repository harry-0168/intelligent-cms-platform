<?php get_header(); ?>

<!-- Hero -->
<section class="hero">
  <div class="container">
    <span class="hero__eyebrow">Artisan Bakery · Est. 2018</span>
    <h1 class="hero__title">Where Every Morning Starts with Something Wonderful</h1>
    <p class="hero__subtitle">
      Fresh bread, flaky pastries, and celebration cakes — all handcrafted before dawn
      using local flour, free-range eggs, and recipes passed down through three generations.
    </p>
    <div class="hero__actions">
      <a class="btn btn--primary" href="<?php echo esc_url(home_url('/our-menu')); ?>">See Our Menu</a>
      <a class="btn btn--outline" href="<?php echo esc_url(home_url('/our-story')); ?>">Our Story</a>
    </div>
  </div>
</section>

<!-- Feature pillars -->
<section class="pillars">
  <div class="container">
    <div class="pillars__grid">

      <div class="pillar">
        <span class="pillar__icon">🌾</span>
        <h3 class="pillar__title">Local Ingredients</h3>
        <p class="pillar__text">We source our flour from mills within 50 miles, our eggs from a family farm down the road, and our seasonal fruit from local orchards.</p>
      </div>

      <div class="pillar">
        <span class="pillar__icon">🕔</span>
        <h3 class="pillar__title">Baked Before Dawn</h3>
        <p class="pillar__text">Our bakers start at 4 AM so that the first loaf is out of the oven before you've had your first coffee. Everything on the shelf is baked that morning.</p>
      </div>

      <div class="pillar">
        <span class="pillar__icon">🏆</span>
        <h3 class="pillar__title">Award-Winning Recipes</h3>
        <p class="pillar__text">Three years running, our sourdough has taken home the Regional Artisan Bread Award. Our croissants have been featured in Food & Travel magazine.</p>
      </div>

    </div>
  </div>
</section>

<!-- Signature items -->
<section class="items">
  <div class="container">
    <div class="section-heading">
      <span class="section-heading__label">Fresh Today</span>
      <h2 class="section-heading__title">Our Signature Bakes</h2>
      <p class="section-heading__sub">A few of the things our regulars come back for every single week.</p>
    </div>

    <div class="items__grid">

      <article class="item-card">
        <div class="item-card__img">🍞</div>
        <div class="item-card__body">
          <h3 class="item-card__name">Country Sourdough</h3>
          <p class="item-card__desc">A slow-fermented, open-crumb loaf with a blistered crust that crackles when you cut it. Pairs with everything.</p>
          <p class="item-card__price">$9.50 / loaf</p>
        </div>
      </article>

      <article class="item-card">
        <div class="item-card__img">🥐</div>
        <div class="item-card__body">
          <h3 class="item-card__name">Butter Croissant</h3>
          <p class="item-card__desc">72-hour laminated dough, 27 layers of French butter. Shatters on the outside, pillowy soft within. Worth every calorie.</p>
          <p class="item-card__price">$4.50 each</p>
        </div>
      </article>

      <article class="item-card">
        <div class="item-card__img">🎂</div>
        <div class="item-card__body">
          <h3 class="item-card__name">Seasonal Layer Cake</h3>
          <p class="item-card__desc">This week: roasted strawberry and vanilla mascarpone. Made fresh each morning in limited quantities — arrives early to avoid disappointment.</p>
          <p class="item-card__price">From $38 / 6-inch</p>
        </div>
      </article>

    </div>
  </div>
</section>

<!-- Our story -->
<section class="story">
  <div class="container">
    <div class="story__inner">
      <div>
        <span class="story__label">Our Story</span>
        <h2 class="story__title">Three Generations of Getting Up Early</h2>
        <p class="story__text">My grandmother baked bread to sell at the Saturday market in Lyon. My mother brought those recipes to Canada when she was 22. I grew up watching her hands shape dough at 5 AM.</p>
        <p class="story__text">La Maison Bakery opened in 2018 with one oven, one wooden table, and those same recipes. We're still using the same starter culture my grandmother kept alive for 40 years.</p>
        <a class="btn btn--outline" href="<?php echo esc_url(home_url('/our-story')); ?>">Read the full story</a>
      </div>
      <div class="story__img-wrap">🥖</div>
    </div>
  </div>
</section>

<!-- CTA banner -->
<section class="cta-banner">
  <div class="container">
    <h2 class="cta-banner__title">Order a Custom Celebration Cake</h2>
    <p class="cta-banner__sub">Birthdays, weddings, corporate events — built around your flavours, your occasion.</p>
    <a class="btn btn--dark" href="<?php echo esc_url(home_url('/contact')); ?>">Get in Touch</a>
  </div>
</section>

<?php get_footer(); ?>
