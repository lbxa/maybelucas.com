document.addEventListener('DOMContentLoaded', () => {
  const themeColorMetaTag = document.querySelector('meta[name="theme-color"]');

  function updateThemeColor() {
    const isDarkMode = document.documentElement.classList.contains('dark');
    themeColorMetaTag?.setAttribute('content', isDarkMode ? '#121212' : '#f5f5f5');
  }

  // Initial call to set the theme color based on current mode
  updateThemeColor();

  const observer = new MutationObserver(updateThemeColor);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
});