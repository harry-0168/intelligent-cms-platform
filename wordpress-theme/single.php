<?php get_header(); ?>

<?php if (have_posts()) : while (have_posts()) : the_post(); ?>

<section class="hero">
  <div class="container">
    <span class="hero__eyebrow">La Maison Bakery</span>
    <h1 class="hero__title"><?php the_title(); ?></h1>
    <?php if (has_post_thumbnail()) : ?>
      <img class="hero__image"
           src="<?php the_post_thumbnail_url('full'); ?>"
           alt="<?php the_title(); ?>">
    <?php endif; ?>
  </div>
</section>

<div class="content-section">
  <div class="container" style="max-width: 800px;">
    <?php the_content(); ?>
  </div>
</div>

<?php endwhile; endif; ?>

<?php get_footer(); ?>
