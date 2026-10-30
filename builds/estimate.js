export const CATALOG = {
  website: {
    label: 'Website', description: 'A great home for your brand or business.', base: 100000, icon: 'website', window: [1, 2],
    included: 'Mobile-friendly design, basic SEO and a contact call to action.',
    scopes: [
      {id: 'focused', label: 'Keep it focused', description: 'One well-crafted landing page', price: 0},
      {id: 'growing', label: 'Room to explore', description: 'Up to 5 pages', price: 50000},
      {id: 'expanded', label: 'The bigger picture', description: 'Up to 10 pages', price: 100000}
    ],
    features: [
      {id: 'cms', label: 'Manage my own content', description: 'An editor for text, images and updates', price: 40000},
      {id: 'booking', label: 'Appointment booking', description: 'Let customers request a time online', price: 60000},
      {id: 'store', label: 'Online store & checkout', description: 'A small product catalogue and payment flow', price: 120000},
      {id: 'copy', label: 'Help with the words', description: 'Starter copy for the agreed pages', price: 30000},
      {id: 'branding', label: 'Starter brand kit', description: 'A simple visual identity for your launch', price: 50000}
    ]
  },
  webapp: {
    label: 'Web app', description: 'Turn a useful idea into an interactive tool.', base: 300000, icon: 'webapp', window: [3, 6],
    included: 'Mobile-friendly design, sign-in, a user dashboard and one core workflow.',
    scopes: [
      {id: 'focused', label: 'A focused first version', description: 'One core workflow, up to 5 key screens', price: 0},
      {id: 'growing', label: 'A connected experience', description: 'Up to 3 linked workflows and 10 screens', price: 100000},
      {id: 'expanded', label: 'A broader product', description: 'Up to 5 workflows and 15 screens', price: 220000}
    ],
    features: [
      {id: 'payments', label: 'Accept payments', description: 'One payment provider integration', price: 75000},
      {id: 'notifications', label: 'Email notifications', description: 'Key updates sent to users', price: 40000},
      {id: 'integration', label: 'Connect another service', description: 'One standard third-party API integration', price: 70000},
      {id: 'reports', label: 'Reports & insights', description: 'A useful overview with downloadable data', price: 60000},
      {id: 'pwa', label: 'Installable web app', description: 'Add-to-home-screen experience', price: 80000}
    ]
  },
  saas: {
    label: 'SaaS product', description: 'A product people can sign up for and use.', base: 450000, icon: 'saas', window: [5, 8],
    included: 'Mobile-friendly design, sign-in, user roles, a dashboard and one core product workflow.',
    scopes: [
      {id: 'focused', label: 'Launch the essentials', description: 'One core workflow, up to 7 key screens', price: 0},
      {id: 'growing', label: 'A fuller first release', description: 'Up to 3 linked workflows and 12 screens', price: 150000},
      {id: 'expanded', label: 'Think a little bigger', description: 'Up to 5 workflows and 20 screens', price: 300000}
    ],
    features: [
      {id: 'subscriptions', label: 'Subscription billing', description: 'Plans and recurring billing with one provider', price: 100000},
      {id: 'workspaces', label: 'Team workspaces', description: 'Separate organisations with team access', price: 150000},
      {id: 'integration', label: 'Connect another service', description: 'One standard third-party API integration', price: 70000},
      {id: 'reports', label: 'Reports & insights', description: 'A useful overview with downloadable data', price: 60000},
      {id: 'pwa', label: 'Installable web app', description: 'Add-to-home-screen experience', price: 80000}
    ]
  },
  business: {
    label: 'Business platform', description: 'Make the day-to-day run a little smarter.', base: 350000, icon: 'business', window: [4, 7],
    included: 'Mobile-friendly design, staff sign-in, basic roles, a dashboard and one business workflow.',
    scopes: [
      {id: 'focused', label: 'One job, done well', description: 'One core workflow, up to 5 key screens', price: 0},
      {id: 'growing', label: 'Connect the operations', description: 'Up to 3 linked workflows and 10 screens', price: 120000},
      {id: 'expanded', label: 'A wider business view', description: 'Up to 5 workflows and 15 screens', price: 250000}
    ],
    features: [
      {id: 'branches', label: 'Multiple branches', description: 'Manage locations from a central workspace', price: 100000},
      {id: 'invoices', label: 'Invoices & documents', description: 'Generate branded PDF invoices', price: 70000},
      {id: 'reports', label: 'Reports & insights', description: 'A useful overview with downloadable data', price: 60000},
      {id: 'integration', label: 'Connect another service', description: 'One standard third-party API integration', price: 70000},
      {id: 'notifications', label: 'Email notifications', description: 'Key updates sent to staff or customers', price: 40000}
    ]
  }
};

export const TIMELINES = {flexible: 'Flexible — let’s agree a timeline', soon: 'As soon as practical (subject to availability)', month: 'Within the next month (to be confirmed)', quarter: 'In the next 2–3 months (to be confirmed)'};
export const BUDGETS = {unsure: 'Exploring options', starter: '₦100,000–₦250,000', growing: '₦250,000–₦500,000', established: '₦500,000–₦1,000,000', large: '₦1,000,000+'};
export const money = value => '₦' + new Intl.NumberFormat('en-NG', {maximumFractionDigits: 0}).format(value);
export const initialState = () => ({type: 'website', scope: 'focused', features: []});

export function estimate(state) {
  const type = Object.hasOwn(CATALOG, state?.type) ? state.type : 'website';
  const project = CATALOG[type];
  const scope = project.scopes.find(item => item.id === state?.scope) || project.scopes[0];
  const features = project.features.filter(item => (state?.features || []).includes(item.id));
  const low = project.base + scope.price + features.reduce((sum, item) => sum + item.price, 0);
  const high = Math.round(low * 1.2);
  const addedWeeks = project.scopes.indexOf(scope) + Math.ceil(features.length / 2);
  return {type, project, scope, features, low, high, weeks: [project.window[0] + addedWeeks, project.window[1] + addedWeeks]};
}

export function generateBrief(state, details = {}) {
  const result = estimate(state);
  const clean = (value, limit) => String(value || '').trim().slice(0, limit);
  const name = clean(details.name, 80);
  const business = clean(details.business, 100);
  const goal = clean(details.goal, 1000);
  const lines = ['Hi Utee, I’d like to discuss a project.'];
  if (name) lines.push('Name: ' + name);
  if (business) lines.push('Business / idea: ' + business);
  lines.push('', 'Build: ' + result.project.label, 'Scope: ' + result.scope.description,
    'Goal: ' + (goal || 'To discuss'),
    'Extras: ' + (result.features.map(item => item.label).join(', ') || 'No extras selected'),
    'Included: ' + result.project.included + ' Domain + hosting for the first year.',
    '', 'Planning estimate: ' + money(result.low) + '–' + money(result.high) + ' NGN',
    'Breakdown: ' + money(result.project.base) + ' base' + (result.scope.price ? ' + ' + money(result.scope.price) + ' scope' : '') + result.features.map(item => ' + ' + money(item.price) + ' ' + item.label).join(''),
    'Preferred launch: ' + (TIMELINES[details.timeline] || TIMELINES.flexible),
    'Budget: ' + (BUDGETS[details.budget] || BUDGETS.unsure),
    '', 'This is a planning guide, not a final quote. The upper end allows 20% for scope details. Final scope, price and delivery need confirmation. Renewals after year one and paid service fees are separate.',
    '', 'Can we discuss the next steps?');
  return lines.join('\n');
}

export function whatsappLink(brief) { return 'https://wa.me/2347068931865?text=' + encodeURIComponent(brief); }
