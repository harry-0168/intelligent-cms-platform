<!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
    <meta charset="<?php bloginfo('charset'); ?>">
    <meta name="viewport" content="width=device-width, initial-scale=1">

    <title><?php wp_title('|', true, 'right'); ?><?php bloginfo('name'); ?></title>
    <meta name="description" content="<?php echo esc_attr(get_post_meta(get_the_ID(), '_meta_description', true) ?: get_bloginfo('description')); ?>">

    <meta property="og:title" content="<?php the_title(); ?>">
    <meta property="og:description" content="<?php echo esc_attr(get_post_meta(get_the_ID(), '_meta_description', true)); ?>">
    <meta property="og:image" content="<?php echo esc_url(get_the_post_thumbnail_url(get_the_ID(), 'full') ?: get_template_directory_uri() . '/assets/images/og-default.jpg'); ?>">
    <meta property="og:type" content="website">

    <script type="application/ld+json">
    {
        "@context": "https://schema.org",
        "@type": "Bakery",
        "name": "<?php bloginfo('name'); ?>",
        "url": "<?php echo esc_url(home_url()); ?>",
        "description": "<?php echo esc_js(get_bloginfo('description')); ?>"
    }
    </script>

    <?php wp_head(); ?>
</head>
<body <?php body_class(); ?>>

<nav class="site-nav">
    <div class="container site-nav__inner">
        <a href="<?php echo esc_url(home_url()); ?>" class="site-nav__logo">
            <?php
            $logo = get_template_directory_uri() . '/assets/images/logo.png';
            $logo_path = get_template_directory() . '/assets/images/logo.png';
            if (file_exists($logo_path) && filesize($logo_path) > 0) :
            ?>
                <img src="<?php echo esc_url($logo); ?>" alt="<?php bloginfo('name'); ?>">
            <?php else : ?>
                <span class="site-nav__logo-text">La <span>Maison</span> Bakery</span>
            <?php endif; ?>
        </a>
        <?php wp_nav_menu([
            'theme_location' => 'primary',
            'menu_class'     => 'site-nav__links',
            'container'      => false,
            'fallback_cb'    => false,
        ]); ?>
    </div>
</nav>
