import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import {
  ArrowDown, ArrowLeft, ArrowRight, ArrowUp, CircleHelp, Lock, Unlock,
  Code2, Copy, Download, Eye, EyeOff, FolderOpen, GripVertical,
  Layers3, Monitor, Plus, Redo2,
  Save, Settings2, Smartphone, Tablet, Trash2, Undo2, X,
} from 'lucide-react';
import { Link, Route, Switch, useLocation, useRoute, Router as WouterRouter } from 'wouter';
import { z } from 'zod';

type SectionType = 'navigation' | 'hero' | 'about' | 'features' | 'testimonial' | 'contact' | 'footer';
type Section = { id: string; type: SectionType; title: string; body: string; imageUrl?: string; visible: boolean; locked: boolean; padding: number };
type Theme = { primaryColor: string; backgroundColor: string; textColor: string };
type Project = { id: string; name: string; businessType: string; prompt: string; templateId: string; theme: Theme; sections: Section[]; updatedAt: string };
type Template = { id: string; name: string; category: string; description: string; businessType: string; colors: [string, string, string]; tone: string; sections: Omit<Section, 'id'>[] };

const queryClient = new QueryClient();
const STORAGE_KEY = 'nexogen-projects-v1';
const SectionSchema = z.object({
  id: z.string().min(1),
  type: z.enum(['navigation', 'hero', 'about', 'features', 'testimonial', 'contact', 'footer']),
  title: z.string().max(300),
  body: z.string().max(3000),
  imageUrl: z.string().max(2048).optional(),
  visible: z.boolean(),
  locked: z.boolean(),
  padding: z.number().int().min(10).max(120),
});
const ProjectSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(160),
  businessType: z.string().min(1).max(100),
  prompt: z.string().max(3000),
  templateId: z.string().min(1),
  theme: z.object({
    primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    backgroundColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    textColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  }),
  sections: z.array(SectionSchema).max(40),
  updatedAt: z.string().datetime(),
}).superRefine((project, context) => {
  const ids = new Set<string>();
  project.sections.forEach((section, index) => {
    if (ids.has(section.id)) context.addIssue({ code: 'custom', message: 'Section IDs must be unique.', path: ['sections', index, 'id'] });
    ids.add(section.id);
  });
});
const ProjectListSchema = z.array(ProjectSchema).max(100);
const templates: Template[] = [
  { id: 'atelier', name: 'The Atelier', category: 'Creative studio', description: 'A considered portfolio for independent makers and design-led studios.', businessType: 'Ceramics studio', colors: ['#b56d5e', '#f4eee6', '#342a28'], tone: 'rose', sections: [
    { type: 'navigation', title: 'Atelier Sol', body: 'Work    Studio    Visit', visible: true, locked: false, padding: 18 },
    { type: 'hero', title: 'Objects made to be lived with.', body: 'Small-batch ceramics shaped slowly in our Portland studio. Made for everyday rituals, and the years that follow.', visible: true, locked: false, padding: 58 },
    { type: 'about', title: 'A little more considered.', body: 'Every piece begins as a sketch, then passes through many hands and many firings. We work in small runs so each object keeps a trace of the maker.', visible: true, locked: false, padding: 48 },
    { type: 'features', title: 'Made for the everyday.', body: 'Hand-thrown stoneware · Local clay · Small seasonal releases', visible: true, locked: false, padding: 44 },
    { type: 'contact', title: 'Come by the studio.', body: 'Visit us Thursday to Sunday, 11–5. We would love to show you around.', visible: true, locked: false, padding: 42 },
    { type: 'footer', title: 'Atelier Sol', body: 'Portland, Oregon · © 2025 Atelier Sol', visible: true, locked: false, padding: 24 },
  ] },
  { id: 'northline', name: 'Northline Dental', category: 'Health & wellness', description: 'Warm, approachable first impressions for neighborhood care teams.', businessType: 'Family dental practice', colors: ['#477b91', '#eef4f1', '#203940'], tone: 'blue', sections: [
    { type: 'navigation', title: 'Northline Dental', body: 'Our care    Meet the team    Find us', visible: true, locked: false, padding: 18 },
    { type: 'hero', title: 'A healthier smile starts here.', body: 'Thoughtful, unhurried dental care for every age. A neighborhood practice built around people, not procedures.', visible: true, locked: false, padding: 58 },
    { type: 'about', title: 'Care that feels different.', body: 'Our team takes time to listen, explain, and make sure you feel at home. From your first check-up to a more confident smile, you are in good hands.', visible: true, locked: false, padding: 48 },
    { type: 'features', title: 'Good care, all in one place.', body: 'Preventive visits · Family dentistry · Clear aligners · Emergency appointments', visible: true, locked: false, padding: 44 },
    { type: 'testimonial', title: '“The first appointment where I actually felt listened to.”', body: '— Morgan R., patient since 2021', visible: true, locked: false, padding: 42 },
    { type: 'contact', title: 'Your next visit, made easy.', body: 'Call (503) 555-0148 or stop by 2418 North Williams Avenue, Portland.', visible: true, locked: false, padding: 42 },
    { type: 'footer', title: 'Northline Dental', body: 'Portland, Oregon · Mon–Fri, 8am–5pm', visible: true, locked: false, padding: 24 },
  ] },
  { id: 'fieldnotes', name: 'Fieldnotes Coffee', category: 'Food & drink', description: 'An expressive neighborhood coffee page with room for the story.', businessType: 'Independent coffee shop', colors: ['#a77a42', '#f4f0e5', '#292a24'], tone: 'gold', sections: [
    { type: 'navigation', title: 'Fieldnotes', body: 'The coffee    Our place    Hours', visible: true, locked: false, padding: 18 },
    { type: 'hero', title: 'Good coffee. No big occasion needed.', body: 'A sunny corner, a proper espresso, and something warm from the oven. Your table is waiting.', visible: true, locked: false, padding: 58 },
    { type: 'about', title: 'A neighborhood sort of place.', body: 'We opened Fieldnotes to make a little more room for the everyday: a familiar face at the counter, a book left on the table, a coffee made just right.', visible: true, locked: false, padding: 48 },
    { type: 'features', title: 'On the counter this week.', body: 'Single-origin pour-over · Cardamom morning bun · Seasonal fruit tart', visible: true, locked: false, padding: 44 },
    { type: 'contact', title: 'Find us on the corner.', body: '18 NE Alberta Street, Portland · Daily, 7am–4pm', visible: true, locked: false, padding: 42 },
    { type: 'footer', title: 'Fieldnotes Coffee', body: 'Come as you are. Stay as long as you like.', visible: true, locked: false, padding: 24 },
  ] },
  { id: 'morrow', name: 'Morrow House', category: 'Home & hospitality', description: 'Quietly confident booking page for thoughtful places to stay.', businessType: 'Boutique guesthouse', colors: ['#767a69', '#f1efe7', '#32372e'], tone: 'teal', sections: [
    { type: 'navigation', title: 'Morrow House', body: 'The house    Rooms    Getting here', visible: true, locked: false, padding: 18 },
    { type: 'hero', title: 'A slower stay, just outside the city.', body: 'Five restful rooms in a restored 1920s house. Come for a night, stay for the quiet.', visible: true, locked: false, padding: 58 },
    { type: 'about', title: 'A house with a little history.', body: 'Once a family home, now a welcoming place to land. We kept the original details and added the comforts we always wished for.', visible: true, locked: false, padding: 48 },
    { type: 'features', title: 'Thoughtful, not fussy.', body: 'Five individually styled rooms · Garden breakfast · Quiet library · Walkable neighborhood', visible: true, locked: false, padding: 44 },
    { type: 'contact', title: 'Make room for a little pause.', body: 'Find availability and tell us a little about your visit. We will take it from there.', visible: true, locked: false, padding: 42 },
    { type: 'footer', title: 'Morrow House', body: 'Sauvie Island, Oregon · A place to come back to.', visible: true, locked: false, padding: 24 },
  ] },
  { id: 'lumen', name: 'Lumen Advisory', category: 'Professional services', description: 'A clear, human introduction for independent consultants and teams.', businessType: 'Sustainability consultancy', colors: ['#718b76', '#f0f1e9', '#26352b'], tone: 'plum', sections: [
    { type: 'navigation', title: 'Lumen Advisory', body: 'What we do    Our approach    Contact', visible: true, locked: false, padding: 18 },
    { type: 'hero', title: 'Better decisions begin with a clearer view.', body: 'Independent sustainability advice for businesses ready to make meaningful progress.', visible: true, locked: false, padding: 58 },
    { type: 'about', title: 'Practical change, built together.', body: 'We help leadership teams find the next right step. Our work is grounded in evidence, shaped around your business, and designed to move from good intentions to real action.', visible: true, locked: false, padding: 48 },
    { type: 'features', title: 'From first questions to lasting practice.', body: 'Carbon baselines · Sustainability strategy · Team workshops · Progress reporting', visible: true, locked: false, padding: 44 },
    { type: 'testimonial', title: '“We finally had a plan our whole team could get behind.”', body: '— Jamie Lee, operations director', visible: true, locked: false, padding: 42 },
    { type: 'contact', title: 'Start with a conversation.', body: 'Tell us what you are working through. We will bring a fresh perspective.', visible: true, locked: false, padding: 42 },
    { type: 'footer', title: 'Lumen Advisory', body: 'Independent advice, Portland and beyond.', visible: true, locked: false, padding: 24 },
  ] },
  { id: 'kindred', name: 'Kindred Movement', category: 'Health & wellness', description: 'A welcoming studio page focused on movement, belonging and practice.', businessType: 'Pilates and movement studio', colors: ['#887287', '#f2edf1', '#382f3b'], tone: 'plum', sections: [
    { type: 'navigation', title: 'Kindred', body: 'Classes    Our studio    Schedule', visible: true, locked: false, padding: 18 },
    { type: 'hero', title: 'Move in a way that feels like yours.', body: 'Small group movement for real life. Find your strength, take your time, and feel at home in your body.', visible: true, locked: false, padding: 58 },
    { type: 'about', title: 'There is room for you here.', body: 'Kindred is a neighborhood studio for people at every point in their practice. No pressure to keep up. Just thoughtful teaching and a space to begin.', visible: true, locked: false, padding: 48 },
    { type: 'features', title: 'Find your kind of movement.', body: 'Reformer · Mat flow · Restorative stretch · Private sessions', visible: true, locked: false, padding: 44 },
    { type: 'contact', title: 'Your first class is on us.', body: 'Find us at 1124 SE Division Street. Mats and props are ready when you are.', visible: true, locked: false, padding: 42 },
    { type: 'footer', title: 'Kindred Movement', body: 'Practice together. Find your own pace.', visible: true, locked: false, padding: 24 },
  ] },
];

const sectionLabels: Record<SectionType, string> = { navigation: 'Navigation', hero: 'Hero', about: 'About', features: 'Highlights', testimonial: 'Testimonial', contact: 'Contact', footer: 'Footer' };
const sectionDefaults: Record<SectionType, [string, string]> = {
  navigation: ['Your business', 'Services    About    Contact'],
  hero: ['A better way to begin.', 'Tell people what makes your business worth finding. Keep it clear, warm, and unmistakably yours.'],
  about: ['A little about us.', 'Share the story behind your business and what you care about.'],
  features: ['What we do best.', 'Thoughtful service · Local expertise · Made for you'],
  testimonial: ['“They made the whole experience feel easy.”', '— A happy customer'],
  contact: ['Let’s make it happen.', 'Get in touch and tell us what you are looking for.'],
  footer: ['Your business', 'Made with care.'],
};
const stylePalettes: Record<string, [string, string, string]> = {
  Minimal: ['#60747a', '#f3f4ef', '#273239'],
  Premium: ['#b28b59', '#24211c', '#f1e8d9'],
  'Modern corporate': ['#476fb3', '#f1f4f8', '#26334a'],
  'Bold and energetic': ['#db5835', '#fff1e6', '#2b1d19'],
  Elegant: ['#8a718b', '#f5f0f4', '#352d36'],
  Creative: ['#a4568c', '#f7eef4', '#322530'],
};

const uuid = () => globalThis.crypto?.randomUUID?.() ?? `nx-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
function readProjects(): Project[] {
  const value = localStorage.getItem(STORAGE_KEY);
  return value ? ProjectListSchema.parse(JSON.parse(value)) as Project[] : [];
}
function createProject(template: Template, name: string, businessType: string, prompt: string, style?: string): Project {
  const colors = stylePalettes[style || ''] ?? template.colors;
  return ProjectSchema.parse({ id: uuid(), name, businessType, prompt, templateId: template.id, theme: { primaryColor: colors[0], backgroundColor: colors[1], textColor: colors[2] }, sections: template.sections.map(s => ({ ...s, id: uuid() })), updatedAt: new Date().toISOString() }) as Project;
}
function downloadFile(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a'); anchor.href = url; anchor.download = filename; anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function safeName(name: string) { return name.trim().replace(/[^\w-]+/g, '-').replace(/^-|-$/g, '').toLowerCase() || 'nexogen-page'; }
function escapeHtml(text: string) { return text.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char] || char)); }

function AppFrame({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const onEditor = location.startsWith('/workspace/');
  if (onEditor) return <>{children}</>;
  return <div className="app-shell"><header className="topbar">
    <Link href="/" className="brand" aria-label="NexoGen home"><span className="brand-mark">N</span><span>NexoGen</span></Link>
    <nav className="main-nav" aria-label="Main navigation">
      <Link href="/projects" className={`nav-link ${location === '/projects' ? 'active' : ''}`} data-testid="link-projects">Projects</Link>
      <Link href="/templates" className={`nav-link ${location === '/templates' ? 'active' : ''}`} data-testid="link-templates">Templates</Link>
      <Link href="/settings" className={`nav-link ${location === '/settings' ? 'active' : ''}`} data-testid="link-settings">Settings</Link>
    </nav>
    <span className="local-pill"><span className="local-dot" />Local only</span>
  </header>{children}</div>;
}
function Home() {
  const [, setLocation] = useLocation();
  const [business, setBusiness] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [description, setDescription] = useState('');
  const [style, setStyle] = useState('Friendly local business');
  const [templateId, setTemplateId] = useState('atelier');
  const [error, setError] = useState('');
  function start() {
    if (!business || !description.trim()) { setError('Choose a business type and add a short description to start.'); return; }
    const template = templates.find(item => item.id === templateId) ?? templates[0];
    const businessType = business === 'Other' && businessName.trim() ? businessName.trim() : business;
    const name = businessName.trim() || businessType;
    const project = createProject(template, `${name} — demo`, businessType, `${description.trim()} Style: ${style}.`, style);
    try { const projects = readProjects(); localStorage.setItem(STORAGE_KEY, JSON.stringify([project, ...projects])); setLocation(`/workspace/${project.id}`); }
    catch { setError('Your browser could not save this demo. Check local storage permissions and try again.'); }
  }
  const examples = [
    { title: 'A neighborhood gym', business: 'Gym', description: 'Small-group strength training for all levels, with friendly coaches and flexible memberships.' },
    { title: 'A neighborhood restaurant', business: 'Restaurant', description: 'Seasonal plates, a welcoming dining room, and an easy way to book a table.' },
    { title: 'A creative agency', business: 'Agency', description: 'Brand strategy and digital work for ambitious independent businesses.' },
    { title: 'A modern salon', business: 'Salon', description: 'Thoughtful cuts and color in a relaxed studio, with an easy online booking experience.' },
    { title: 'A growing SaaS company', business: 'SaaS', description: 'A clear product story that helps growing teams understand the value and get started.' },
  ];
  return <AppFrame><main className="page"><div className="home-layout">
    <div className="home-copy">
      <div className="eyebrow">A simpler way to show up online</div>
       <h1 className="display">Build Business Landing Pages with AI</h1>
       <p className="subhead">Describe your business and create a professional landing page you can customize visually, without writing code. Start with a clearly labeled local demo; AI generation is not connected yet.</p>
      <div className="home-note"><Layers3 size={15} /> Structured sections, direct edits, no code.</div>
      <div className="home-note"><Save size={15} /> Saved locally on this device. Nothing is published.</div>
    </div>
    <section className="form-card" aria-labelledby="start-title">
      <h2 id="start-title" className="card-title">Start with a local demo</h2>
      <p className="card-subtitle">A starter page will open in the editor. You stay in control of every word.</p>
       <div className="field"><label htmlFor="business-type">What kind of business?</label><select id="business-type" value={business} onChange={e => setBusiness(e.target.value)} data-testid="select-business-type"><option value="">Choose a business type</option>{['Gym', 'Restaurant', 'Salon', 'Coaching', 'Agency', 'Portfolio', 'Real Estate', 'SaaS', 'Other'].map(type => <option key={type}>{type}</option>)}</select></div>
       <div className="field"><label htmlFor="business-name">Business name <span className="optional-label">Optional</span></label><input id="business-name" value={businessName} onChange={e => setBusinessName(e.target.value)} placeholder="e.g. Northstar Fitness" data-testid="input-business-name" /></div>
      <div className="field"><label htmlFor="business-description">Describe what you do</label><textarea id="business-description" value={description} onChange={e => setDescription(e.target.value)} placeholder="A couple of details about your business, your customers, or what makes it special." data-testid="input-business-description" /></div>
      <div className="example-row">{examples.map(ex => <button key={ex.title} className="chip-button" type="button" onClick={() => { setBusiness(ex.business); setBusinessName(''); setDescription(ex.description); }} data-testid={`example-${ex.business.toLowerCase().replaceAll(' ', '-')}`}>Try: {ex.title}</button>)}</div>
       <div className="field"><label htmlFor="style-choice">Page style</label><select id="style-choice" value={style} onChange={e => setStyle(e.target.value)} data-testid="select-style"><option>Minimal</option><option>Premium</option><option>Modern corporate</option><option>Bold and energetic</option><option>Elegant</option><option>Creative</option><option>Friendly local business</option></select></div>
      <div className="field"><label htmlFor="template-choice">Start from a template</label><select id="template-choice" value={templateId} onChange={e => setTemplateId(e.target.value)} data-testid="select-template">{templates.map(t => <option value={t.id} key={t.id}>{t.name} · {t.category}</option>)}</select></div>
      {error && <div className="status-box" role="alert" style={{ marginBottom: 13, borderColor: '#704348', color: '#ffb0aa' }}>{error}</div>}
      <button className="primary-button wide" onClick={start} data-testid="button-start-demo">Create my local demo <ArrowRight size={15} /></button>
      <p className="template-hint">This is a product demo, not AI generation. Publishing and hosting are not connected.</p>
    </section>
  </div></main></AppFrame>;
}

function TemplateCard({ template, onUse }: { template: Template; onUse: (template: Template) => void }) {
  return <article className="template-card surface" data-testid={`card-template-${template.id}`}>
    <div className={`preview-art ${template.tone}`}><span>{template.category}</span><strong>{template.name}</strong></div>
    <div className="template-card-body"><h3>{template.name}</h3><div className="meta">{template.description}</div><div className="card-actions"><button className="primary-button" onClick={() => onUse(template)} data-testid={`button-use-template-${template.id}`}><Plus size={13} /> Use this template</button></div></div>
  </article>;
}
function TemplatesPage() {
  const [, setLocation] = useLocation();
  function useTemplate(template: Template) {
    const project = createProject(template, `${template.businessType} — demo`, template.businessType, template.description);
    const all = readProjects(); localStorage.setItem(STORAGE_KEY, JSON.stringify([project, ...all])); setLocation(`/workspace/${project.id}`);
  }
  return <AppFrame><main className="page">
    <div className="section-heading"><div><div className="eyebrow">Starter library · 06 templates</div><h1>Start with a strong first draft.</h1><p>Each template is a structured local page you can reshape in the editor.</p></div><span className="demo-pill">Demo templates</span></div>
    <div className="template-grid">{templates.map(t => <TemplateCard key={t.id} template={t} onUse={useTemplate} />)}</div>
  </main></AppFrame>;
}
function ProjectsPage() {
  const [projects, setProjects] = useState(readProjects);
  const [, setLocation] = useLocation();
  const [dialog, setDialog] = useState<{ type: 'rename' | 'delete'; project: Project } | null>(null);
  const [rename, setRename] = useState('');
  const [notice, setNotice] = useState('');
  function update(next: Project[]) { setProjects(next); localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); }
  function duplicate(project: Project) {
    const clone = { ...project, id: uuid(), name: `${project.name.replace(/ — copy$/, '')} — copy`, sections: project.sections.map(s => ({ ...s, id: uuid() })), updatedAt: new Date().toISOString() };
    update([clone, ...projects]); setNotice('A local copy is ready.');
  }
  function confirmDialog() {
    if (!dialog) return;
    if (dialog.type === 'delete') { update(projects.filter(p => p.id !== dialog.project.id)); setNotice('Project deleted from this browser.'); }
    else if (rename.trim()) { update(projects.map(p => p.id === dialog.project.id ? { ...p, name: rename.trim(), updatedAt: new Date().toISOString() } : p)); setNotice('Project renamed.'); }
    setDialog(null);
  }
  return <AppFrame><main className="page">
    <div className="section-heading"><div><div className="eyebrow">Your workspace</div><h1>Saved projects</h1><p>These drafts live in this browser only.</p></div><button className="primary-button" onClick={() => setLocation('/')} data-testid="button-new-project"><Plus size={15} /> New demo</button></div>
    {notice && <div className="status-box" role="status" style={{ marginBottom: 18 }}>{notice}</div>}
    {projects.length ? <div className="project-grid">{projects.map(project => <article className="project-card surface" key={project.id} data-testid={`card-project-${project.id}`}>
      <div className={`preview-art ${templates.find(t => t.id === project.templateId)?.tone || 'blue'}`}><span>{project.businessType}</span><strong>{project.name}</strong></div>
      <div className="project-card-body"><h3>{project.name}</h3><div className="meta">Updated {new Date(project.updatedAt).toLocaleDateString()} · Local demo</div>
        <div className="card-actions"><button className="primary-button" onClick={() => setLocation(`/workspace/${project.id}`)} data-testid={`button-open-${project.id}`}>Open editor <ArrowRight size={13} /></button>
          <button className="quiet-button" aria-label={`Rename ${project.name}`} onClick={() => { setRename(project.name); setDialog({ type: 'rename', project }); }} data-testid={`button-rename-${project.id}`}>Rename</button>
          <button className="icon-button" aria-label={`Duplicate ${project.name}`} onClick={() => duplicate(project)} data-testid={`button-duplicate-${project.id}`}><Copy size={14} /></button>
          <button className="icon-button" aria-label={`Delete ${project.name}`} onClick={() => setDialog({ type: 'delete', project })} data-testid={`button-delete-${project.id}`}><Trash2 size={14} /></button>
        </div>
      </div></article>)}</div> : <div className="surface empty-state"><FolderOpen size={28} /><h2>No local projects yet</h2><p>Start with one of the demo templates. Your work is stored in this browser and stays private to this device.</p><button className="primary-button" onClick={() => setLocation('/')} data-testid="button-empty-start">Create a local demo <ArrowRight size={14} /></button></div>}
    {dialog && <div className="modal-backdrop" role="presentation"><section className="modal-card" role="dialog" aria-modal="true" aria-labelledby="project-dialog-title">
      <h2 id="project-dialog-title">{dialog.type === 'delete' ? 'Delete this project?' : 'Rename project'}</h2>
      {dialog.type === 'delete' ? <p><strong>{dialog.project.name}</strong> will be removed from local browser storage. This cannot be undone.</p> : <div className="field"><label htmlFor="rename-project">Project name</label><input id="rename-project" value={rename} onChange={e => setRename(e.target.value)} data-testid="input-rename-project" /></div>}
      <div className="modal-actions"><button className="quiet-button" onClick={() => setDialog(null)} data-testid="button-cancel-dialog">Cancel</button><button className={dialog.type === 'delete' ? 'danger-button' : 'primary-button'} onClick={confirmDialog} data-testid="button-confirm-dialog">{dialog.type === 'delete' ? 'Delete project' : 'Save name'}</button></div>
    </section></div>}
  </main></AppFrame>;
}
function SettingsPage() {
  return <AppFrame><main className="page">
    <div className="eyebrow">Workspace preferences</div><h1 className="display" style={{ fontSize: 46 }}>Settings & status</h1><p className="subhead">A short, honest view of what this Phase 1 workspace does today.</p>
    <div className="settings-grid">
      <section className="surface settings-block"><h3>Storage</h3><p>Your project drafts are stored in local browser storage on this device. Clearing browser data may remove them.</p><div style={{ marginTop: 17 }}><span className="local-pill"><span className="local-dot" />Local only</span></div></section>
      <section className="surface settings-block"><h3>Publishing</h3><p>No hosting provider is connected. Pages can be exported as JSON or a self-contained HTML file; they are not deployed from NexoGen.</p><div className="status-box" style={{ marginTop: 14 }}>Setup needed · No site is live</div></section>
      <section className="surface settings-block"><h3>AI features</h3><p>AI writing and generation are not active in this demo. The starting page is assembled from an editable local template.</p></section>
       <section className="surface settings-block"><h3>Local demo mode</h3><p>Demo mode is always local in this build. Drafts stay in this browser; they are not uploaded or published.</p><div style={{ marginTop: 15 }}><span className="local-pill"><span className="local-dot" />Always local</span></div></section>
    </div>
    <div style={{ marginTop: 18 }}><Link href="/projects" className="quiet-button" data-testid="link-settings-projects">Review saved projects <ArrowRight size={14} /></Link></div>
  </main></AppFrame>;
}

function renderHtml(project: Project) {
  const sections = project.sections.filter(s => s.visible).map(section => {
    const title = escapeHtml(section.title), body = escapeHtml(section.body);
    if (section.type === 'navigation') return `<header class="nav"><strong>${title}</strong><span>${body}</span></header>`;
    if (section.type === 'hero') return `<section class="hero"><h1>${title}</h1><p>${body}</p><a class="cta" href="#contact">Get in touch</a></section>`;
    if (section.type === 'features') return `<section class="features"><div><h2>${title}</h2><p>${body}</p></div><div class="visual"></div></section>`;
    if (section.type === 'testimonial') return `<section class="quote"><h2>${title}</h2><small>${body}</small></section>`;
    if (section.type === 'contact') return `<section class="contact" id="contact"><h2>${title}</h2><p>${body}</p></section>`;
    if (section.type === 'footer') return `<footer>${title} · ${body}</footer>`;
    return `<section><h2>${title}</h2><p>${body}</p></section>`;
  }).join('\n');
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escapeHtml(project.name)}</title>
<style>*{box-sizing:border-box}body{margin:0;background:${project.theme.backgroundColor};color:${project.theme.textColor};font:16px/1.6 system-ui,-apple-system,sans-serif}h1,h2{font-family:Georgia,serif;line-height:1.08}section{padding:56px max(8%,calc((100% - 1000px)/2))}h2{font-size:34px;margin:0 0 12px}p{max-width:680px;opacity:.78}.nav{display:flex;justify-content:space-between;padding:20px 8%;border-bottom:1px solid #0002}.hero{min-height:400px;display:flex;flex-direction:column;justify-content:center;background:linear-gradient(130deg,${project.theme.primaryColor},${project.theme.backgroundColor});color:white}.hero h1{font-size:clamp(42px,7vw,76px);max-width:850px;margin:0 0 18px}.hero p{font-size:18px;color:#fff;max-width:650px}.cta{align-self:flex-start;background:white;color:#263142;padding:11px 17px;text-decoration:none;border-radius:3px;font-weight:700}.features{display:grid;grid-template-columns:1fr 1fr;gap:35px;align-items:center}.visual{height:220px;border-radius:6px;background:linear-gradient(145deg,${project.theme.primaryColor},${project.theme.textColor})}.quote{border-left:4px solid ${project.theme.primaryColor};margin:35px 8%;padding:15px 28px}.quote h2{font-size:29px}.quote small{opacity:.65}.contact{background:${project.theme.textColor};color:${project.theme.backgroundColor}}footer{padding:26px 8%;border-top:1px solid #0002;opacity:.7;font-size:13px}@media(max-width:650px){.features{grid-template-columns:1fr}.nav span{display:none}}</style></head><body>${sections}</body></html>`;
}

function ProjectEditor({ projectId }: { projectId: string }) {
  const [all, setAll] = useState(readProjects);
  const project = all.find(item => item.id === projectId);
  const [selected, setSelected] = useState<string>('');
  const [device, setDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [saved, setSaved] = useState(true);
  const [notice, setNotice] = useState('');
  const [publishOpen, setPublishOpen] = useState(false);
  const [mobileAddOpen, setMobileAddOpen] = useState(false);
  const [history, setHistory] = useState<Project[]>([]);
  const [future, setFuture] = useState<Project[]>([]);
  const dragId = useRef('');
  const dragType = useRef<SectionType | ''>('');
  useEffect(() => {
    if (project && !selected && project.sections[0]) setSelected(project.sections[0].id);
  }, [project, selected]);
  useEffect(() => { setHistory([]); setFuture([]); }, [projectId]);
  useEffect(() => {
    if (!project) return;
    setSaved(false);
    const timer = window.setTimeout(() => {
      try {
        const fresh = { ...project, updatedAt: new Date().toISOString() };
        const list = readProjects().map(p => p.id === fresh.id ? fresh : p);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
        setSaved(true);
      } catch { setNotice('Autosave failed. Browser storage may be unavailable.'); }
    }, 350);
    return () => window.clearTimeout(timer);
  }, [project]);
  const selectedSection = project?.sections.find(s => s.id === selected);
  const activeTemplate = useMemo(() => templates.find(t => t.id === project?.templateId), [project?.templateId]);
  function commit(next: Project, track = true) {
    if (!project) return;
    const validation = ProjectSchema.safeParse(next);
    if (!validation.success) { setNotice('That change could not be saved because it exceeds the page limits.'); return; }
    next = validation.data as Project;
    if (track) setHistory(prev => [...prev.slice(-39), project]);
    setFuture([]);
    const list = all.map(p => p.id === next.id ? { ...next, updatedAt: new Date().toISOString() } : p);
    setAll(list);
  }
  function patchProject(patch: Partial<Project>) { if (project) commit({ ...project, ...patch }); }
  function patchSection(id: string, patch: Partial<Section>) {
    if (!project) return;
    const current = project.sections.find(section => section.id === id);
    if (current?.locked && Object.keys(patch).some(key => key !== 'visible' && key !== 'locked')) return;
    commit({ ...project, sections: project.sections.map(s => s.id === id ? { ...s, ...patch } : s) });
  }
  function addSection(type: SectionType, beforeId?: string) {
    if (!project) return;
    const [title, body] = sectionDefaults[type];
    const section: Section = { id: uuid(), type, title, body, visible: true, locked: false, padding: 44 };
    const targetIndex = beforeId ? project.sections.findIndex(s => s.id === beforeId) : -1;
    const at = targetIndex >= 0 ? targetIndex : type === 'footer' ? project.sections.length : project.sections.findIndex(s => s.type === 'footer');
    const sections = [...project.sections]; sections.splice(at < 0 ? sections.length : at, 0, section);
    commit({ ...project, sections }); setSelected(section.id); setNotice(`${sectionLabels[type]} section added.`); dragType.current = '';
  }
  function removeSection(id: string) {
    if (!project) return;
    const section = project.sections.find(s => s.id === id);
    if (!section || section.locked) return;
    commit({ ...project, sections: project.sections.filter(s => s.id !== id) });
    if (selected === id) setSelected(project.sections.find(s => s.id !== id)?.id || '');
  }
  function duplicateSection(id: string) {
    if (!project) return;
    const index = project.sections.findIndex(s => s.id === id);
    const source = project.sections[index];
    if (!source) return;
    const copy = { ...source, id: uuid(), title: `${source.title} (copy)` };
    const sections = [...project.sections]; sections.splice(index + 1, 0, copy);
    commit({ ...project, sections }); setSelected(copy.id);
  }
  function reorder(from: string, to: string) {
    if (!project || from === to) return;
    const sections = [...project.sections];
    const fromIndex = sections.findIndex(s => s.id === from), toIndex = sections.findIndex(s => s.id === to);
    if (fromIndex < 0 || toIndex < 0 || sections[fromIndex].locked || sections[toIndex].locked) return;
    const [item] = sections.splice(fromIndex, 1); sections.splice(toIndex, 0, item);
    commit({ ...project, sections });
  }
  function moveSection(id: string, direction: -1 | 1) {
    if (!project) return;
    const index = project.sections.findIndex(section => section.id === id);
    const target = project.sections[index + direction];
    if (index < 0 || !target) return;
    reorder(id, target.id);
  }
  function undo() {
    if (!project || !history.length) return;
    const previous = history[history.length - 1];
    setHistory(history.slice(0, -1)); setFuture([project, ...future]);
    setAll(all.map(p => p.id === project.id ? previous : p));
  }
  function redo() {
    if (!project || !future.length) return;
    const next = future[0]; setFuture(future.slice(1)); setHistory([...history, project]);
    setAll(all.map(p => p.id === project.id ? next : p));
  }
  useEffect(() => {
    function onShortcut(event: KeyboardEvent) {
      if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== 'z') return;
      const target = event.target;
      if (target instanceof HTMLElement && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))) return;
      event.preventDefault();
      if (event.shiftKey) redo(); else undo();
    }
    window.addEventListener('keydown', onShortcut);
    return () => window.removeEventListener('keydown', onShortcut);
  }, [undo, redo]);
  function exportJson() { if (project) { downloadFile(`${safeName(project.name)}.json`, JSON.stringify(project, null, 2), 'application/json'); setNotice('Project JSON downloaded.'); } }
  function exportHtml() { if (project) { downloadFile(`${safeName(project.name)}.html`, renderHtml(project), 'text/html'); setNotice('Self-contained HTML downloaded.'); } }
  if (!project) return <AppFrame><main className="page"><div className="surface empty-state"><CircleHelp size={28} /><h2>Project not found</h2><p>This local project may have been removed or is not available in this browser.</p><Link href="/projects" className="primary-button" data-testid="link-back-projects">Back to projects <ArrowRight size={14} /></Link></div></main></AppFrame>;
  const canvasWidth = device === 'desktop' ? '100%' : device === 'tablet' ? '768px' : '390px';
  return <div className="editor-shell">
    <header className="editor-top">
      <Link href="/projects" className="icon-button" aria-label="Back to projects" data-testid="link-editor-projects"><ArrowLeft size={16} /></Link>
      <span className="editor-divider" />
      <Link href="/" className="brand" aria-label="NexoGen home"><span className="brand-mark">N</span></Link>
      <input className="editor-name" aria-label="Project name" value={project.name} onChange={e => patchProject({ name: e.target.value })} data-testid="input-editor-project-name" />
      <span className="demo-pill">Local demo</span>
      <span className={`save-status ${saved ? '' : 'saving'}`} role="status" data-testid="status-autosave">{saved ? 'Saved locally' : 'Saving…'}</span>
      <div className="editor-spacer" />
      <button className="icon-button" aria-label="Undo" title="Undo" disabled={history.length === 0} onClick={undo} data-testid="button-undo"><Undo2 size={15} /></button>
      <button className="icon-button" aria-label="Redo" title="Redo" disabled={future.length === 0} onClick={redo} data-testid="button-redo"><Redo2 size={15} /></button>
      <button className="toolbar-button" onClick={exportJson} data-testid="button-export-json"><Code2 size={14} /> JSON</button>
      <button className="toolbar-button" onClick={exportHtml} data-testid="button-export-html"><Download size={14} /> HTML</button>
      <button className="primary-button" onClick={() => setPublishOpen(true)} data-testid="button-publish">Publish</button>
    </header>
    <div className="editor-content">
      <aside className="side-panel" aria-label="Page layers">
        <div className="panel-head"><span>Page layers</span><span className="meta">{project.sections.length}</span></div>
        <div className="panel-body">
          <div className="layers-note">Drag to reorder</div>
          <div className="layers-list">{project.sections.map((section, index) => <div key={section.id} className={`layer-row ${selected === section.id ? 'selected' : ''}`} onClick={() => setSelected(section.id)} onDragOver={e => e.preventDefault()} onDrop={() => reorder(dragId.current, section.id)} data-testid={`layer-${section.id}`}>
             <span className="layer-grip" draggable={!section.locked} aria-label={`Reorder ${sectionLabels[section.type]}`} onDragStart={() => { dragId.current = section.id; }} onClick={e => e.stopPropagation()}><GripVertical size={13} /></span>
            <span className="layer-title">{sectionLabels[section.type]} <span style={{ opacity: .55 }}>{index + 1}</span></span>
             <span className="layer-move-controls">
               <button className="icon-button" aria-label="Move section up" disabled={index === 0 || section.locked || project.sections[index - 1]?.locked} onClick={e => { e.stopPropagation(); moveSection(section.id, -1); }}><ArrowUp size={12} /></button>
               <button className="icon-button" aria-label="Move section down" disabled={index === project.sections.length - 1 || section.locked || project.sections[index + 1]?.locked} onClick={e => { e.stopPropagation(); moveSection(section.id, 1); }}><ArrowDown size={12} /></button>
             </span>
            <span className="layer-mini">
              <button className="icon-button" aria-label={section.visible ? 'Hide section' : 'Show section'} onClick={e => { e.stopPropagation(); patchSection(section.id, { visible: !section.visible }); }} data-testid={`button-visibility-${section.id}`}>{section.visible ? <Eye size={12} /> : <EyeOff size={12} />}</button>
               <button className="icon-button" aria-label={section.locked ? 'Unlock section' : 'Lock section'} title={section.locked ? 'Unlock section' : 'Lock section'} onClick={e => { e.stopPropagation(); patchSection(section.id, { locked: !section.locked }); }} data-testid={`button-lock-${section.id}`}>{section.locked ? <Lock size={12} /> : <Unlock size={12} />}</button>
               <button className="icon-button" aria-label="Duplicate section" disabled={section.locked} onClick={e => { e.stopPropagation(); duplicateSection(section.id); }} data-testid={`button-duplicate-section-${section.id}`}><Copy size={12} /></button>
              {!section.locked && <button className="icon-button" aria-label="Remove section" onClick={e => { e.stopPropagation(); removeSection(section.id); }} data-testid={`button-remove-section-${section.id}`}><X size={12} /></button>}
            </span>
          </div>)}</div>
           <div className="add-section-menu" aria-label="Add a section">{(['navigation', 'hero', 'about', 'features', 'testimonial', 'contact', 'footer'] as SectionType[]).map(type => <button key={type} draggable onDragStart={event => { dragType.current = type; dragId.current = ''; event.dataTransfer.setData('text/plain', type); }} onClick={() => addSection(type)} data-testid={`button-add-${type}`}><Plus size={11} /> {sectionLabels[type]}</button>)}</div>
        </div>
      </aside>
      <main className="canvas-area" aria-label="Page canvas">
        <div className="canvas-toolbar">
          <button className={`device-button ${device === 'desktop' ? 'active' : ''}`} onClick={() => setDevice('desktop')} aria-label="Desktop preview" data-testid="button-preview-desktop"><Monitor size={14} /> Desktop</button>
          <button className={`device-button ${device === 'tablet' ? 'active' : ''}`} onClick={() => setDevice('tablet')} aria-label="Tablet preview" data-testid="button-preview-tablet"><Tablet size={14} /> Tablet</button>
          <button className={`device-button ${device === 'mobile' ? 'active' : ''}`} onClick={() => setDevice('mobile')} aria-label="Mobile preview" data-testid="button-preview-mobile"><Smartphone size={14} /> Mobile</button>
        </div>
        <div className="canvas-wrap" style={{ width: canvasWidth }}>
          <div className="canvas-label"><span>Page preview</span><span>{device === 'desktop' ? 'Fluid desktop' : device === 'tablet' ? '768 px' : '390 px'}</span></div>
           <div className="site-canvas" style={{ '--site-bg': project.theme.backgroundColor, '--site-text': project.theme.textColor, '--site-primary': project.theme.primaryColor } as CSSProperties} onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); if (dragType.current) addSection(dragType.current); }} data-testid="site-canvas">
             {project.sections.filter(section => section.visible).map(section => <section key={section.id} id={section.type === 'contact' ? 'contact' : undefined} draggable={!section.locked} onDragStart={() => { dragId.current = section.id; dragType.current = ''; }} onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); e.stopPropagation(); if (dragType.current) addSection(dragType.current, section.id); else reorder(dragId.current, section.id); }} onClick={() => setSelected(section.id)} className={`site-section ${selected === section.id ? 'selected' : ''} ${section.type === 'hero' ? 'site-hero' : ''} ${section.type === 'features' ? 'site-feature' : ''} ${section.type === 'testimonial' ? 'site-quote' : ''} ${section.type === 'contact' ? 'site-contact' : ''} ${section.type === 'footer' ? 'site-footer' : ''}`} style={{ paddingTop: section.padding, paddingBottom: section.padding }} data-testid={`canvas-section-${section.id}`}>
              <span className="inline-hint">Select to edit</span>
               {section.type === 'navigation' ? <><strong contentEditable={!section.locked} suppressContentEditableWarning onBlur={e => patchSection(section.id, { title: e.currentTarget.innerText })} style={{ font: '17px "DM Serif Display", serif' }}>{section.title}</strong><span contentEditable={!section.locked} suppressContentEditableWarning onBlur={e => patchSection(section.id, { body: e.currentTarget.innerText })} style={{ float: 'right', fontSize: 11, opacity: .7 }}>{section.body}</span></> :
                 section.type === 'hero' ? <><h1 contentEditable={!section.locked} suppressContentEditableWarning onBlur={e => patchSection(section.id, { title: e.currentTarget.innerText })}>{section.title}</h1><p contentEditable={!section.locked} suppressContentEditableWarning onBlur={e => patchSection(section.id, { body: e.currentTarget.innerText })}>{section.body}</p><a className="site-cta" href="#contact" onClick={e => { e.preventDefault(); setSelected(section.id); }}>Get in touch</a></> :
                 section.type === 'features' ? <><div><h2 contentEditable={!section.locked} suppressContentEditableWarning onBlur={e => patchSection(section.id, { title: e.currentTarget.innerText })}>{section.title}</h2><p contentEditable={!section.locked} suppressContentEditableWarning onBlur={e => patchSection(section.id, { body: e.currentTarget.innerText })}>{section.body}</p></div><div className="feature-visual" aria-hidden="true" /></> :
                 section.type === 'testimonial' ? <><p contentEditable={!section.locked} suppressContentEditableWarning onBlur={e => patchSection(section.id, { title: e.currentTarget.innerText })}>{section.title}</p><small contentEditable={!section.locked} suppressContentEditableWarning onBlur={e => patchSection(section.id, { body: e.currentTarget.innerText })}>{section.body}</small></> :
                 section.type === 'footer' ? <><strong contentEditable={!section.locked} suppressContentEditableWarning onBlur={e => patchSection(section.id, { title: e.currentTarget.innerText })}>{section.title}</strong><span contentEditable={!section.locked} suppressContentEditableWarning onBlur={e => patchSection(section.id, { body: e.currentTarget.innerText })} style={{ marginLeft: 8 }}>{section.body}</span></> :
                 <><h2 contentEditable={!section.locked} suppressContentEditableWarning onBlur={e => patchSection(section.id, { title: e.currentTarget.innerText })}>{section.title}</h2><p contentEditable={!section.locked} suppressContentEditableWarning onBlur={e => patchSection(section.id, { body: e.currentTarget.innerText })}>{section.body}</p></>}
            </section>)}
          </div>
        </div>
      </main>
      <aside className={`side-panel right-panel ${inspectorOpen ? 'mobile-inspector-open' : ''}`} aria-label="Section properties">
        <div className="panel-head"><span>Properties</span><button className="icon-button" aria-label="Close properties" onClick={() => setInspectorOpen(false)}><X size={14} /></button></div>
        {selectedSection ? <div className="panel-body">
          <div className="property-section"><div className="property-title">{sectionLabels[selectedSection.type]} section</div>
           <label className="property-label" htmlFor="section-title">Heading</label><input id="section-title" className="property-input" value={selectedSection.title} disabled={selectedSection.locked} onChange={e => patchSection(selectedSection.id, { title: e.target.value })} data-testid="input-section-title" />
           <label className="property-label" htmlFor="section-body">Text</label><textarea id="section-body" className="property-input property-textarea" value={selectedSection.body} disabled={selectedSection.locked} onChange={e => patchSection(selectedSection.id, { body: e.target.value })} data-testid="input-section-body" />
          </div>
           <div className="property-section"><div className="property-title">Spacing</div><label className="property-label" htmlFor="section-spacing">Section padding</label><div className="range-row"><input id="section-spacing" type="range" min="20" max="100" step="4" value={selectedSection.padding} disabled={selectedSection.locked} onChange={e => patchSection(selectedSection.id, { padding: Number(e.target.value) })} data-testid="input-section-spacing" /><span className="range-value">{selectedSection.padding}px</span></div></div>
          <div className="property-section"><div className="property-title">Page colors</div>
            <label className="color-row">Accent color <input type="color" value={project.theme.primaryColor} onChange={e => patchProject({ theme: { ...project.theme, primaryColor: e.target.value } })} aria-label="Primary color" data-testid="input-primary-color" /></label>
            <label className="color-row">Background <input type="color" value={project.theme.backgroundColor} onChange={e => patchProject({ theme: { ...project.theme, backgroundColor: e.target.value } })} aria-label="Background color" data-testid="input-background-color" /></label>
            <label className="color-row">Text color <input type="color" value={project.theme.textColor} onChange={e => patchProject({ theme: { ...project.theme, textColor: e.target.value } })} aria-label="Text color" data-testid="input-text-color" /></label>
          </div>
           <div className="property-section"><div className="property-title">Section actions</div><button className="secondary-button wide" onClick={() => patchSection(selectedSection.id, { locked: !selectedSection.locked })} data-testid="button-property-lock">{selectedSection.locked ? <Unlock size={13} /> : <Lock size={13} />}{selectedSection.locked ? 'Unlock section' : 'Lock section'}</button><button className="secondary-button wide" style={{ marginTop: 7 }} disabled={selectedSection.locked} onClick={() => duplicateSection(selectedSection.id)} data-testid="button-property-duplicate"><Copy size={13} /> Duplicate section</button>
            {!selectedSection.locked && <button className="quiet-button wide" style={{ marginTop: 7 }} onClick={() => patchSection(selectedSection.id, { visible: !selectedSection.visible })} data-testid="button-property-visibility">{selectedSection.visible ? <EyeOff size={13} /> : <Eye size={13} />}{selectedSection.visible ? 'Hide on page' : 'Show on page'}</button>}
            {!selectedSection.locked && <button className="quiet-button wide" style={{ marginTop: 7, color: '#e99a98' }} onClick={() => removeSection(selectedSection.id)} data-testid="button-property-remove"><Trash2 size={13} /> Remove section</button>}
          </div>
          {activeTemplate && <div className="template-hint">Started from {activeTemplate.name}. All edits are yours.</div>}
        </div> : <div className="selection-empty">Select a section on the page or in the layers list to edit its content and spacing.</div>}
      </aside>
    </div>
    <div className="mobile-bottom-bar">
      <button onClick={() => document.querySelector('.side-panel')?.scrollIntoView({ behavior: 'smooth' })} data-testid="button-mobile-layers"><Layers3 size={17} />Layers</button>
      <button onClick={() => setInspectorOpen(!inspectorOpen)} data-testid="button-mobile-properties"><Settings2 size={17} />Properties</button>
       <button onClick={() => setMobileAddOpen(true)} data-testid="button-mobile-add"><Plus size={17} />Add</button>
      <button onClick={exportHtml} data-testid="button-mobile-export"><Download size={17} />Export</button>
      <button onClick={() => setPublishOpen(true)} data-testid="button-mobile-publish"><ArrowUp size={17} />Publish</button>
    </div>
    {notice && <div className="toast-message" role="status" onClick={() => setNotice('')} data-testid="status-notice">{notice}</div>}
    {publishOpen && <div className="modal-backdrop" role="presentation"><section className="modal-card" role="dialog" aria-modal="true" aria-labelledby="publish-title">
      <h2 id="publish-title">Publishing needs setup</h2><p>This local demo cannot deploy a site yet. No hosting service or deployment is configured, and this page is not live.</p>
      <div className="status-box">Setup needed · Your draft remains saved on this device.</div>
      <div className="modal-actions"><button className="quiet-button" onClick={() => setPublishOpen(false)} data-testid="button-close-publish">Close</button><button className="primary-button" onClick={() => { setPublishOpen(false); exportHtml(); }} data-testid="button-export-instead">Export HTML <Download size={13} /></button></div>
    </section></div>}
    {mobileAddOpen && <div className="modal-backdrop mobile-add-backdrop" role="presentation" onClick={() => setMobileAddOpen(false)}><section className="modal-card mobile-add-sheet" role="dialog" aria-modal="true" aria-labelledby="add-section-title" onClick={e => e.stopPropagation()}>
      <h2 id="add-section-title">Add a section</h2><p>Choose a section to add to your page.</p>
      <div className="mobile-add-grid">{(['navigation', 'hero', 'about', 'features', 'testimonial', 'contact', 'footer'] as SectionType[]).map(type => <button key={type} onClick={() => { addSection(type); setMobileAddOpen(false); }} data-testid={`mobile-add-${type}`}><Plus size={14} />{sectionLabels[type]}</button>)}</div>
      <div className="modal-actions"><button className="quiet-button" onClick={() => setMobileAddOpen(false)}>Cancel</button></div>
    </section></div>}
  </div>;
}
function EditorRoute() {
  const [, params] = useRoute('/workspace/:projectId');
  return <ProjectEditor projectId={params?.projectId || ''} />;
}
function Router() {
  return <RoutedErrorBoundary><Switch>
    <Route path="/" component={Home} />
    <Route path="/projects" component={ProjectsPage} />
    <Route path="/templates" component={TemplatesPage} />
    <Route path="/settings" component={SettingsPage} />
    <Route path="/workspace/:projectId" component={EditorRoute} />
    <Route component={NotFound} />
  </Switch></RoutedErrorBoundary>;
}
function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}
function App() {
  return <QueryClientProvider client={queryClient}><TooltipProvider><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><Router /></WouterRouter><Toaster /></TooltipProvider></QueryClientProvider>;
}
export default App;
