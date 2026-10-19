import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import {
  ArrowDown, ArrowLeft, ArrowRight, ArrowUp, CircleHelp, Lock, Unlock,
  Code2, Copy, Download, Eye, EyeOff, GripVertical, Layers3, Monitor, Plus,
  Redo2, Settings2, Smartphone, Tablet, Trash2, Undo2, X,
} from 'lucide-react';
import { z } from 'zod';
import './_group.css';

type SectionType = 'navigation' | 'hero' | 'about' | 'features' | 'testimonial' | 'contact' | 'footer';
type Section = { id: string; type: SectionType; title: string; body: string; imageUrl?: string; visible: boolean; locked: boolean; padding: number };
type Theme = { primaryColor: string; backgroundColor: string; textColor: string };
type Project = { id: string; name: string; businessType: string; prompt: string; templateId: string; theme: Theme; sections: Section[]; updatedAt: string };
type Template = { id: string; name: string; category: string; description: string; businessType: string; colors: [string, string, string]; tone: string; sections: Omit<Section, 'id'>[] };

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

const templates: Template[] = [{
  id: 'atelier',
  name: 'The Atelier',
  category: 'Creative studio',
  description: 'A considered portfolio for independent makers and design-led studios.',
  businessType: 'Ceramics studio',
  colors: ['#b56d5e', '#f4eee6', '#342a28'],
  tone: 'rose',
  sections: [
    { type: 'navigation', title: 'Atelier Sol', body: 'Work    Studio    Visit', visible: true, locked: false, padding: 18 },
    { type: 'hero', title: 'Objects made to be lived with.', body: 'Small-batch ceramics shaped slowly in our Portland studio. Made for everyday rituals, and the years that follow.', visible: true, locked: false, padding: 58 },
    { type: 'about', title: 'A little more considered.', body: 'Every piece begins as a sketch, then passes through many hands and many firings. We work in small runs so each object keeps a trace of the maker.', visible: true, locked: false, padding: 48 },
    { type: 'features', title: 'Made for the everyday.', body: 'Hand-thrown stoneware · Local clay · Small seasonal releases', visible: true, locked: false, padding: 44 },
    { type: 'contact', title: 'Come by the studio.', body: 'Visit us Thursday to Sunday, 11–5. We would love to show you around.', visible: true, locked: false, padding: 42 },
    { type: 'footer', title: 'Atelier Sol', body: 'Portland, Oregon · © 2025 Atelier Sol', visible: true, locked: false, padding: 24 },
  ],
}];

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

const uuid = () => globalThis.crypto?.randomUUID?.() ?? `nx-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
const sampleProject: Project = ProjectSchema.parse({
  id: 'atelier-sol-demo',
  name: 'Atelier Sol — demo',
  businessType: 'Ceramics studio',
  prompt: 'A considered portfolio for independent makers and design-led studios.',
  templateId: 'atelier',
  theme: { primaryColor: '#b56d5e', backgroundColor: '#f4eee6', textColor: '#342a28' },
  sections: templates[0].sections.map((section, index) => ({ ...section, id: `atelier-section-${index + 1}` })),
  updatedAt: '2025-02-14T12:00:00.000Z',
}) as Project;

function downloadFile(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function safeName(name: string) { return name.trim().replace(/[^\w-]+/g, '-').replace(/^-|-$/g, '').toLowerCase() || 'nexogen-page'; }
function escapeHtml(text: string) { return text.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' } as Record<string, string>)[char] || char); }

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
  const [all, setAll] = useState<Project[]>([sampleProject]);
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
    const timer = window.setTimeout(() => setSaved(true), 350);
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
  if (!project) return <div className="editor-shell"><main className="selection-empty"><CircleHelp size={28} /><h2>Project not found</h2><p>This local project may have been removed or is not available in this browser.</p></main></div>;
  const canvasWidth = device === 'desktop' ? '100%' : device === 'tablet' ? '768px' : '390px';
  return <div className="editor-shell">
    <header className="editor-top">
      <a href="#" onClick={e => e.preventDefault()} className="icon-button" aria-label="Back to projects" data-testid="link-editor-projects"><ArrowLeft size={16} /></a>
      <span className="editor-divider" />
      <a href="#" onClick={e => e.preventDefault()} className="brand" aria-label="NexoGen home"><span className="brand-mark">N</span></a>
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

export function Current() {
  return <div className="nexogen-editor"><ProjectEditor projectId={sampleProject.id} /></div>;
}
