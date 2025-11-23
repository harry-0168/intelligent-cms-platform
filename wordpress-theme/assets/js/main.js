document.addEventListener("DOMContentLoaded", () => {
  const nav = document.querySelector(".site-nav");
  if (!nav) return;
  window.addEventListener("scroll", () => {
    nav.style.boxShadow = window.scrollY > 6 ? "0 2px 10px rgba(15,23,42,0.08)" : "none";
  });
});
