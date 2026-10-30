const menu = document.querySelector('.menu-toggle');
const nav = document.querySelector('#studio-nav');
function closeMenu() { if (!menu || !nav) return; menu.setAttribute('aria-expanded','false'); nav.classList.remove('is-open'); }
menu?.addEventListener('click', () => { const open = menu.getAttribute('aria-expanded') !== 'true'; menu.setAttribute('aria-expanded',String(open)); nav.classList.toggle('is-open',open); });
nav?.addEventListener('click', event => { if (event.target.closest('a')) closeMenu(); });
document.addEventListener('keydown', event => { if (event.key === 'Escape' && menu?.getAttribute('aria-expanded') === 'true') { closeMenu(); menu.focus(); } });
document.addEventListener('click', event => { if (menu && nav && !menu.contains(event.target) && !nav.contains(event.target)) closeMenu(); });
window.matchMedia('(min-width:681px)').addEventListener('change', event => { if(event.matches) closeMenu(); });
const filters = document.querySelectorAll('[data-filter]');
const cards = document.querySelectorAll('[data-category]');
filters.forEach(button => button.addEventListener('click', () => {
  filters.forEach(filter => filter.setAttribute('aria-pressed',String(filter === button)));
  let visible = 0;
  cards.forEach(card => { card.hidden = button.dataset.filter !== 'all' && card.dataset.category !== button.dataset.filter; if (!card.hidden) visible++; });
  const count = document.querySelector('#work-count');
  if (count) count.textContent = `${visible} PROJECT${visible === 1 ? '' : 'S'}`;
}));
document.querySelectorAll('[data-year]').forEach(el => { el.textContent = String(new Date().getFullYear()); });

const screenshotViewer = document.querySelector('#screenshot-viewer');
const viewerImage = document.querySelector('#viewer-image');
const viewerTitle = document.querySelector('#screenshot-title');
if (screenshotViewer && viewerImage && viewerTitle) {
  document.querySelectorAll('.screenshot-open').forEach(button => {
    button.addEventListener('click', () => {
      viewerImage.src = button.dataset.image;
      document.querySelector('#viewer-fullsize').href = button.dataset.image;
      viewerImage.alt = button.dataset.title + ' product screenshot';
      viewerTitle.textContent = button.dataset.title;
      screenshotViewer.showModal();
      document.body.classList.add('has-screenshot-viewer');
    });
  });
  screenshotViewer.querySelector('.viewer-close').addEventListener('click', () => screenshotViewer.close());
  screenshotViewer.addEventListener('click', event => { if (event.target === screenshotViewer) screenshotViewer.close(); });
  screenshotViewer.addEventListener('close', () => { document.body.classList.remove('has-screenshot-viewer'); viewerImage.removeAttribute('src'); });
}
