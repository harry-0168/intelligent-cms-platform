<?php get_header(); ?>
<section class="content-section">
  <div class="container">
    <h1>Latest Posts</h1>
    <?php if (have_posts()) : while (have_posts()) : the_post(); ?>
      <article>
        <h2><a href="<?php the_permalink(); ?>"><?php the_title(); ?></a></h2>
        <p><?php the_excerpt(); ?></p>
      </article>
    <?php endwhile; else: ?>
      <p>No content found.</p>
    <?php endif; ?>
  </div>
</section>
<?php get_footer(); ?>
