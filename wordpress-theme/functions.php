<?php
function theme_setup() {
    add_theme_support('title-tag');
    add_theme_support('post-thumbnails');
    add_theme_support('html5', ['script', 'style']);
    register_nav_menus(['primary' => 'Primary Menu']);
}
add_action('after_setup_theme', 'theme_setup');

function theme_scripts() {
    wp_enqueue_style(
        'google-fonts',
        'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Lato:wght@400;600;700&display=swap',
        [],
        null
    );
    wp_enqueue_style('theme-style', get_template_directory_uri() . '/assets/css/main.css', [], '1.1');
    wp_enqueue_script('theme-js', get_template_directory_uri() . '/assets/js/main.js', [], '1.0', true);
}
add_action('wp_enqueue_scripts', 'theme_scripts');

function add_ga4() {
    $ga_id = 'G-XXXXXXXXXX'; // Replace with real GA4 ID
    echo "
    <script async src='https://www.googletagmanager.com/gtag/js?id={$ga_id}'></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '{$ga_id}');
    </script>";
}
add_action('wp_head', 'add_ga4');

function register_custom_meta() {
    $auth = function() { return current_user_can('edit_posts'); };
    $fields = ['_meta_description', '_s3_image_url'];
    $types  = ['post', 'page'];

    foreach ($types as $type) {
        foreach ($fields as $field) {
            register_post_meta($type, $field, [
                'show_in_rest'  => true,
                'single'        => true,
                'type'          => 'string',
                'auth_callback' => $auth,
            ]);
        }
    }
}
add_action('init', 'register_custom_meta');
