import {CATALOG, money, initialState, estimate, generateBrief, whatsappLink} from './estimate.js';

let state = initialState();
let briefGenerated = false;
let copyRevision = 0;
const $ = selector => document.querySelector(selector);
const form = $('#brief-form');
const icons = {
  website: '<rect x="3" y="4" width="26" height="24" rx="1"/><path d="M3 10h26M7 7h1m3 0h1m3 0h1M8 16h9m-9 5h16"/>',
  webapp: '<path d="M8 5h16v17H8zM4 27h24M12 13l-3 3 3 3m8-6 3 3-3 3m-2-7-4 9"/>',
  saas: '<path d="m16 3 14 7-14 7L2 10l14-7Zm-14 14 14 7 14-7M2 24l14 7 14-7"/>',
  business: '<rect x="3" y="10" width="26" height="19" rx="1"/><path d="M11 10V4h10v6M3 18h26m-15-2h4v5h-4z"/>'
};

function renderProjects() {
  $('#project-types').innerHTML = Object.entries(CATALOG).map(([id, project]) => `
    <label class="project-choice"><input type="radio" name="project-type" value="${id}" ${state.type === id ? 'checked' : ''}>
    <span class="project-icon" aria-hidden="true"><svg viewBox="0 0 32 34" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round">${icons[project.icon]}</svg></span>
    <span class="choice-marker" aria-hidden="true"></span><strong>${project.label}</strong><span class="choice-desc">${project.description}</span><span class="choice-price">From ${money(project.base)} <span aria-hidden="true">↗</span></span></label>`).join('');
}

function renderOptions() {
  const project = CATALOG[state.type];
  $('#scope-options').innerHTML = project.scopes.map(scope => `
    <label class="scope-choice"><input type="radio" name="project-scope" value="${scope.id}" ${state.scope === scope.id ? 'checked' : ''}><span class="scope-dot" aria-hidden="true"></span><span class="scope-copy"><strong>${scope.label}</strong><span>${scope.description}</span></span><span class="scope-price">${scope.price ? '+ ' + money(scope.price) : 'Included'}</span></label>`).join('');
  $('#feature-options').innerHTML = project.features.map(feature => `
    <label class="feature-choice"><input type="checkbox" name="project-feature" value="${feature.id}" ${state.features.includes(feature.id) ? 'checked' : ''}><span class="feature-box" aria-hidden="true"></span><span class="feature-copy"><strong>${feature.label}</strong><span>${feature.description}</span></span><span class="feature-price">+ ${money(feature.price)}</span></label>`).join('');
  $('#included-features').textContent = project.included;
}

function renderEstimate() {
  const result = estimate(state);
  $('#estimate-project').textContent = result.project.label;
  const rows = [
    {label: 'Starting build', price: money(result.project.base)},
    {label: result.scope.description, price: result.scope.price ? '+ ' + money(result.scope.price) : 'Included', included: !result.scope.price},
    ...result.features.map(feature => ({label: feature.label, price: '+ ' + money(feature.price)})),
    {label: 'Domain + hosting · year one', price: 'Included', included: true}
  ];
  $('#estimate-lines').innerHTML = rows.map(row => `<div class="estimate-line ${row.included ? 'included' : ''}"><span>${row.label}</span><span>${row.price}</span></div>`).join('');
  $('#estimate-low').textContent = money(result.low);
  $('#estimate-high').textContent = money(result.high);
  $('#mobile-total').textContent = money(result.low) + '–' + money(result.high);
  $('#build-window').textContent = `Indicative build: ${result.weeks[0]}–${result.weeks[1]} weeks`;
  if (briefGenerated) refreshBrief();
}

function details() {
  return {name: $('#client-name').value, business: $('#business-name').value, goal: $('#project-goal').value, timeline: $('#timeline').value, budget: $('#budget').value};
}

function refreshBrief() {
  copyRevision++;
  const hasGoal = $('#project-goal').value.trim().length > 0;
  $('#generated-brief').value = generateBrief(state, details());
  const whatsapp = $('#whatsapp-brief');
  if (hasGoal) { whatsapp.href = whatsappLink($('#generated-brief').value); whatsapp.removeAttribute('aria-disabled'); whatsapp.removeAttribute('tabindex'); }
  else { whatsapp.removeAttribute('href'); whatsapp.setAttribute('aria-disabled', 'true'); whatsapp.setAttribute('tabindex', '-1'); }
  $('#copy-brief').disabled = !hasGoal;
  $('#brief-freshness').textContent = hasGoal ? 'Your brief follows your current project choices. Open WhatsApp to review it, then tap Send.' : 'Add your project goal above to finish this brief.';
  $('#copy-status').textContent = '';
  $('#copy-brief').firstChild.textContent = 'Copy project brief ';
}

$('#project-types').addEventListener('change', event => {
  if (event.target.name !== 'project-type') return;
  state = {type: event.target.value, scope: 'focused', features: []};
  renderOptions();
  renderEstimate();
});
$('#scope-options').addEventListener('change', event => {
  if (event.target.name !== 'project-scope') return;
  state.scope = event.target.value;
  renderEstimate();
});
$('#feature-options').addEventListener('change', event => {
  if (event.target.name !== 'project-feature') return;
  state.features = [...document.querySelectorAll('input[name="project-feature"]:checked')].map(input => input.value);
  renderEstimate();
});
$('#reset-project').addEventListener('click', () => {
  state = initialState();
  renderProjects();
  renderOptions();
  renderEstimate();
});
$('#project-goal').addEventListener('input', () => {
  $('#goal-count').textContent = $('#project-goal').value.length + ' / 1000';
  $('#project-goal').setCustomValidity('');
});
form.addEventListener('input', () => { if (briefGenerated) refreshBrief(); });
form.addEventListener('change', () => { if (briefGenerated) refreshBrief(); });
form.addEventListener('submit', event => {
  event.preventDefault();
  if (!$('#project-goal').value.trim()) {
    $('#project-goal').setCustomValidity('Tell me a little about your project first.');
    $('#project-goal').reportValidity();
    return;
  }
  briefGenerated = true;
  refreshBrief();
  $('#brief-output').hidden = false;
  $('#output-title').focus({preventScroll: true});
  $('#brief-output').scrollIntoView({behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start'});
});
$('#copy-brief').addEventListener('click', async () => {
  const button = $('#copy-brief');
  const output = $('#generated-brief');
  const revision = copyRevision;
  const text = output.value;
  let copied = false;
  try { await navigator.clipboard.writeText(text); copied = true; }
  catch {
    output.focus(); output.select(); output.setSelectionRange(0, output.value.length);
    try { copied = document.execCommand('copy'); } catch { /* Manual copy remains available. */ }
  }
  if (revision !== copyRevision) return;
  $('#copy-status').textContent = copied ? 'Copied. Paste your brief into WhatsApp or email when you’re ready.' : 'Your brief is selected. Use your device’s Copy action, or press Ctrl+C / Cmd+C.';
  if (copied) button.firstChild.textContent = 'Brief copied! ';
});
const builder = $('#project-builder');
const contact = $('#contact');
const mobileBar = $('#mobile-estimate');
function updateMobileBar() {
  const started = builder.getBoundingClientRect().top < window.innerHeight * .6;
  const atContact = contact.getBoundingClientRect().top < window.innerHeight * .8;
  mobileBar.classList.toggle('visible', started && !atContact);
}
window.addEventListener('scroll', updateMobileBar, {passive: true});
window.addEventListener('resize', updateMobileBar);
const yearLabel = $('#year');
if (yearLabel) yearLabel.textContent = String(new Date().getFullYear());
renderProjects();
renderOptions();
renderEstimate();
updateMobileBar();
