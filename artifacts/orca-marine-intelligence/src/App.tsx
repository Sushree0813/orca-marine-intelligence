import { type CSSProperties, type ReactNode, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import {
  Activity, Bell, BookOpen, Bot, Check, ChevronRight,
  CloudSun, Compass, Database, GitBranch, Globe2, History as HistoryIcon, Info, Layers,
  LifeBuoy, Map as MapIcon, Menu, Navigation, Network,
  Route as RouteIcon, ShieldAlert, Sparkles, Waves,
  Wind, X, Zap
} from 'lucide-react';
import * as L from 'leaflet';
import {
  Circle,
  CircleMarker,
  LayerGroup,
  LayersControl,
  MapContainer,
  Marker,
  Polygon,
  Polyline,
  Popup,
  TileLayer,
} from 'react-leaflet';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip as ChartTooltip, XAxis, YAxis } from 'recharts';
import { Link, Route, Switch, useLocation, Router as WouterRouter } from 'wouter';
import 'leaflet/dist/leaflet.css';

const queryClient = new QueryClient();

type IconType = typeof Activity;
const navSections = [
  { label: '', items: [{ href: '/', label: 'Dashboard', icon: Activity }] },
  { label: 'INTELLIGENCE', items: [{ href: '/ask', label: 'Ask ORCA', icon: Sparkles }, { href: '/analysis', label: 'Marine Analysis', icon: Waves }, { href: '/map', label: 'Marine Map', icon: MapIcon }] },
  { label: 'SAFETY', items: [{ href: '/alerts', label: 'Risk & Alerts', icon: ShieldAlert }, { href: '/route-safety', label: 'Route Safety', icon: RouteIcon }, { href: '/geofencing', label: 'Geofencing', icon: Layers }] },
  { label: 'INSIGHTS', items: [{ href: '/evidence', label: 'Evidence Explorer', icon: BookOpen }, { href: '/history', label: 'Analysis History', icon: HistoryIcon }] },
  { label: 'SYSTEM', items: [{ href: '/sources', label: 'Data Sources', icon: Database }, { href: '/agents', label: 'Agent Network', icon: Network }, { href: '/architecture', label: 'Architecture', icon: GitBranch }, { href: '/about', label: 'About', icon: Info }] },
];

const locations = [
  { name: 'Paradip', x: 69, y: 42, tone: 'normal' },
  { name: 'Puri', x: 68, y: 49, tone: 'alert' },
  { name: 'Visakhapatnam', x: 62, y: 66, tone: 'alert' },
  { name: 'Chennai', x: 59, y: 82, tone: 'normal' },
  { name: 'Kochi', x: 25, y: 91, tone: 'normal' },
];
const alerts = [
  { level: 'HIGH', title: 'High Wind Alert', area: 'Bay of Bengal', detail: 'Wind conditions may affect small craft operations.' },
  { level: 'MEDIUM', title: 'Wave Condition Alert', area: 'Visakhapatnam', detail: 'Wave height is at the upper end of the demo operating window.' },
  { level: 'MEDIUM', title: 'Coastal Risk Alert', area: 'Puri', detail: 'Route-adjacent coastal risk zone requires additional caution.' },
];
const sources = ['Weather Dataset', 'Oceanographic Dataset', 'Marine Advisory', 'GIS Layer', 'Satellite EO Dataset'];
const workflow = ['User Query', 'Planner Agent', 'Weather Agent', 'Ocean Agent', 'GIS Agent', 'Risk Agent', 'Evidence Fusion', 'Safety Validation', 'Final Recommendation'];
const mapPlaces = [
  { name: 'Paradip', coords: [20.3167, 86.6167] as [number, number], tone: 'safe' as const, description: 'Origin port · Odisha' },
  { name: 'Puri', coords: [19.8135, 85.8312] as [number, number], tone: 'medium' as const, description: 'Coastal alert point · Odisha' },
  { name: 'Visakhapatnam', coords: [17.6868, 83.2185] as [number, number], tone: 'medium' as const, description: 'Destination port · Andhra Pradesh' },
  { name: 'Chennai', coords: [13.0827, 80.2707] as [number, number], tone: 'safe' as const, description: 'Coastal monitoring point · Tamil Nadu' },
  { name: 'Kochi', coords: [9.9312, 76.2673] as [number, number], tone: 'safe' as const, description: 'Coastal monitoring point · Kerala' },
];
const demoRoute: [number, number][] = [
  [20.3167, 86.6167],
  [20.05, 86.22],
  [19.8135, 85.8312],
  [19.28, 85.66],
  [18.7, 85.44],
  [18.12, 84.62],
  [17.6868, 83.2185],
];
const alternativeRoute: [number, number][] = [
  [20.3167, 86.6167],
  [19.84, 86.18],
  [19.22, 85.38],
  [18.35, 84.37],
  [17.6868, 83.2185],
];
const paradipRiskZone: [number, number][] = [
  [20.68, 86.16],
  [20.9, 86.72],
  [20.45, 87.34],
  [19.96, 87.07],
  [19.98, 86.42],
];
const visakhapatnamRiskZone: [number, number][] = [
  [18.12, 82.92],
  [18.22, 83.56],
  [17.66, 83.82],
  [17.21, 83.39],
  [17.43, 82.84],
];
const geofenceZone: [number, number][] = [
  [19.2, 84.98],
  [19.48, 85.55],
  [18.83, 85.96],
  [18.45, 85.49],
];
const pfzAdvisoryZone: [number, number][] = [
  [18.9, 86.18],
  [19.22, 86.88],
  [18.75, 87.34],
  [18.36, 86.62],
];

const leafletIcons = {
  safe: L.divIcon({ className: 'orca-leaflet-icon', html: '<span class="orca-marker orca-marker-safe"></span>', iconSize: [18, 18], iconAnchor: [9, 9], popupAnchor: [0, -10] }),
  medium: L.divIcon({ className: 'orca-leaflet-icon', html: '<span class="orca-marker orca-marker-medium"></span>', iconSize: [18, 18], iconAnchor: [9, 9], popupAnchor: [0, -10] }),
  alert: L.divIcon({ className: 'orca-leaflet-icon', html: '<span class="orca-marker orca-marker-alert"></span>', iconSize: [20, 20], iconAnchor: [10, 10], popupAnchor: [0, -11] }),
  vessel: L.divIcon({ className: 'orca-leaflet-icon', html: '<span class="orca-vessel-marker"><span></span></span>', iconSize: [24, 24], iconAnchor: [12, 12], popupAnchor: [0, -12] }),
};

function cn(...values: Array<string | false | undefined>) { return values.filter(Boolean).join(' '); }
function Badge({ children, tone = 'blue' }: { children: ReactNode; tone?: 'high' | 'medium' | 'low' | 'blue' }) { return <span className={`badge badge-${tone}`}>{children}</span>; }
function PageHead({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: ReactNode }) {
  return <div className="page-head"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p className="subhead">{description}</p></div>{action}</div>;
}
function Card({ children, className = '', pad = true }: { children: ReactNode; className?: string; pad?: boolean }) { return <section className={cn('card', pad && 'card-pad', className)}>{children}</section>; }
function SectionTitle({ title, meta }: { title: string; meta?: string }) { return <div className="section-title"><h2>{title}</h2>{meta && <span>{meta}</span>}</div>; }

function MarineMap({ full = false, routeMode = false }: { full?: boolean; routeMode?: boolean }) {
  const [selected, setSelected] = useState<string | null>(null);
  const [layers, setLayers] = useState({ risk: true, alerts: true, route: true, geofence: true, pfz: true });
  const toggle = (key: keyof typeof layers) => setLayers((old) => ({ ...old, [key]: !old[key] }));
  return <Card className="map-card" pad={false}>
    <div className="map-head">
      <div><SectionTitle title={full ? 'Marine operating picture' : 'India coastal operating picture'} meta="DEMO SNAPSHOT" /><div className="map-legend">
        <span className="legend-item"><i className="legend-dot legend-safe" />Safe</span>
        <span className="legend-item"><i className="legend-dot legend-medium" />Medium Risk</span>
        <span className="legend-item"><i className="legend-dot legend-high" />High Risk</span>
        <span className="legend-item"><i className="legend-dot legend-alert" />Alert</span>
        <span className="legend-item"><i className="legend-dot legend-pfz" />PFZ / Advisory</span>
        <span className="legend-item"><i className="legend-line" />Demo Route</span>
      </div></div>
      <div className="map-toggle-row">
        {([['risk', 'Risk zones'], ['alerts', 'Alerts'], ['route', 'Demo route'], ['geofence', 'Geofencing'], ['pfz', 'PFZ / Advisory']] as Array<[keyof typeof layers, string]>).map(([key, label]) => <button key={key} className={cn('toggle', layers[key] && 'on')} onClick={() => toggle(key)} data-testid={`button-toggle-${key}`}><span />{label}</button>)}
      </div>
    </div>
    <div className="map-surface">
      <MapContainer center={[15.5, 82.2]} zoom={5} minZoom={4.4} maxZoom={10} scrollWheelZoom className="leaflet-map" aria-label="Interactive OpenStreetMap view of India's coast">
        <LayersControl position="topright" collapsed>
          <LayersControl.BaseLayer checked name="OpenStreetMap">
            <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="OpenStreetMap Humanitarian">
            <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png" />
          </LayersControl.BaseLayer>
          <LayersControl.Overlay checked name="Medium Risk Zones">
            <LayerGroup>
              {layers.risk && <><Polygon positions={paradipRiskZone} pathOptions={{ color: '#c55a4d', weight: 1.5, fillColor: '#df7b63', fillOpacity: 0.24 }}><Popup><strong>Medium-risk demonstration zone</strong><br />Bay of Bengal, east of Paradip.</Popup></Polygon><Polygon positions={visakhapatnamRiskZone} pathOptions={{ color: '#c55a4d', weight: 1.5, fillColor: '#df7b63', fillOpacity: 0.24 }}><Popup><strong>Medium-risk demonstration zone</strong><br />Near Visakhapatnam coastal approach.</Popup></Polygon></>}
            </LayerGroup>
          </LayersControl.Overlay>
          <LayersControl.Overlay checked name="PFZ / Advisory">
            <LayerGroup>
              {layers.pfz && <><Polygon positions={pfzAdvisoryZone} pathOptions={{ color: '#4d9b83', weight: 1.5, dashArray: '5 5', fillColor: '#83c9b3', fillOpacity: 0.28 }}><Popup><strong>PFZ / Advisory zone</strong><br />Demonstration fishing potential and advisory context.</Popup></Polygon><Circle center={[19.05, 86.7]} radius={24000} pathOptions={{ color: '#4d9b83', weight: 1, dashArray: '3 5', fillColor: '#83c9b3', fillOpacity: 0.08 }} /></>}
            </LayerGroup>
          </LayersControl.Overlay>
          <LayersControl.Overlay checked name="Geofencing">
            <LayerGroup>
              {layers.geofence && <Polygon positions={geofenceZone} pathOptions={{ color: '#c58d23', weight: 1.5, dashArray: '6 4', fillColor: '#e6be58', fillOpacity: 0.2 }}><Popup><strong>Advisory geofence</strong><br />Additional caution required in this demonstration boundary.</Popup></Polygon>}
            </LayerGroup>
          </LayersControl.Overlay>
          <LayersControl.Overlay checked name="Demo Route">
            <LayerGroup>
              {layers.route && <><Polyline positions={demoRoute} pathOptions={{ color: '#0b7180', weight: 4, opacity: 0.95 }}><Popup><strong>Paradip → Visakhapatnam</strong><br />Original route · MEDIUM RISK</Popup></Polyline>{routeMode && <Polyline positions={alternativeRoute} pathOptions={{ color: '#2e9072', weight: 3, dashArray: '7 7', opacity: 0.95 }}><Popup><strong>Alternative route</strong><br />LOWER RISK demonstration corridor.</Popup></Polyline>}<Marker position={demoRoute[0]} icon={leafletIcons.vessel}><Popup><strong>Demo fishing vessel</strong><br />Route origin: Paradip</Popup></Marker></>}
            </LayerGroup>
          </LayersControl.Overlay>
          <LayersControl.Overlay checked name="Alerts">
            <LayerGroup>
              {layers.alerts && <><Marker position={[20.48, 87.48]} icon={leafletIcons.alert} data-testid="button-map-alert"><Popup><strong>HIGH · High Wind Alert</strong><br />Bay of Bengal demonstration alert.</Popup></Marker><Marker position={[17.92, 83.65]} icon={leafletIcons.alert}><Popup><strong>MEDIUM · Wave Condition Alert</strong><br />Visakhapatnam demonstration alert.</Popup></Marker><CircleMarker center={[19.8135, 85.8312]} radius={8} pathOptions={{ color: '#b0801e', fillColor: '#dda82d', fillOpacity: 0.9 }}><Popup><strong>MEDIUM · Coastal Risk Alert</strong><br />Puri demonstration alert.</Popup></CircleMarker></>}
            </LayerGroup>
          </LayersControl.Overlay>
        </LayersControl>
        {mapPlaces.map((place) => <Marker key={place.name} position={place.coords} icon={leafletIcons[place.tone]} eventHandlers={{ click: () => setSelected(place.name) }} data-testid={`button-location-${place.name.toLowerCase()}`}><Popup><div className="orca-popup"><strong>{place.name}</strong><span>{place.description}</span><small>DEMO DATA · {place.coords[0].toFixed(4)}°, {place.coords[1].toFixed(4)}°</small></div></Popup></Marker>)}
        {selected && <div className="map-note"><strong>{selected}</strong><br />Open the marker popup for demo context.</div>}
      </MapContainer>
    </div>
  </Card>;
}

function MetricCard({ icon: Icon, label, value, meta, color, tint }: { icon: IconType; label: string; value: string; meta: string; color: string; tint: string }) {
  return <div className="card metric" style={{ '--color': color, '--tint': tint } as CSSProperties}><div className="metric-top"><span>{label}</span><span className="metric-icon"><Icon size={16} /></span></div><div className="metric-value">{value}</div><div className="metric-meta">{meta}</div></div>;
}

function Dashboard() {
  return <><PageHead eyebrow="Command center / 09:42 IST" title="Good morning, operator." description="A clear view of today's demonstration marine operating picture." action={<Link className="btn btn-primary" href="/ask" data-testid="link-open-orca"><Sparkles size={15} />Ask ORCA</Link>} />
    <div className="grid summary-grid">
      <MetricCard icon={CloudSun} label="Weather" value="28–32 °C" meta="Partly cloudy · 12–18 kt" color="#1681a3" tint="#e8f4f6" />
      <MetricCard icon={Waves} label="Ocean" value="1.5–2.5 m" meta="Moderate sea state" color="#258e91" tint="#e6f5f2" />
      <MetricCard icon={ShieldAlert} label="Marine risk" value="MEDIUM" meta="Proceed with caution" color="#b0801e" tint="#fff4d9" />
      <MetricCard icon={Bell} label="Active alerts" value="03" meta="1 high · 2 medium" color="#c75a48" tint="#fcede9" />
      <MetricCard icon={Database} label="Data sources" value="5 / 5" meta="Connected · demo data" color="#568b79" tint="#e7f5ed" />
    </div>
    <div className="grid two-col">
      <MarineMap />
      <div className="grid" style={{ alignContent: 'start' }}>
        <Card><SectionTitle title="Risk posture" meta="NOW" /><div className="stat-inline"><strong>MEDIUM</strong><Badge tone="medium">57 / 100</Badge></div><div className="risk-meter"><div className="risk-meter-fill" /></div><div style={{ display: 'flex', justifyContent: 'space-between', color: 'hsl(var(--muted-foreground))', fontSize: 10 }}><span>LOW</span><span>MEDIUM</span><span>HIGH</span></div><p className="subhead">Conditions are operationally workable with additional watchkeeping and an updated advisory check before departure.</p></Card>
        <Card><SectionTitle title="Priority alerts" meta="3 ACTIVE" /><div className="list">{alerts.map((a, i) => <div className="list-row" key={a.title}><div><div className="list-title">{a.title}</div><div className="list-meta">{a.area}</div></div><Badge tone={i === 0 ? 'high' : 'medium'}>{a.level}</Badge></div>)}</div><Link href="/alerts" className="btn btn-outline" style={{ width: '100%', marginTop: 13 }} data-testid="link-view-alerts">View all alerts <ChevronRight size={14} /></Link></Card>
      </div>
    </div>
    <div className="grid two-col" style={{ marginTop: 17 }}>
      <Card><SectionTitle title="Demo route watch" meta="PARADIP → VISAKHAPATNAM" /><div className="agent-card"><div className="agent-icon"><Navigation size={17} /></div><div><h3>Fishing boat · east coast corridor</h3><p>Route intersects a medium-risk demonstration zone. Alternative route is available with lower modeled risk.</p></div><Badge tone="medium">CAUTION</Badge></div></Card>
      <Card><SectionTitle title="Agent activity" meta="LAST RUN 09:38" /><div className="list"><div className="list-row"><span className="list-title">Evidence fusion</span><Badge tone="low">5 CORRELATED</Badge></div><div className="list-row"><span className="list-title">Safety validation</span><Badge tone="low">PASSED</Badge></div></div></Card>
    </div>
  </>;
}

function AskOrca() {
  const [query, setQuery] = useState('Is it safe for a fishing boat to travel from Paradip to Visakhapatnam today?');
  const [running, setRunning] = useState(false);
  const [step, setStep] = useState(-1);
  const run = () => { if (running) return; setRunning(true); setStep(0); workflow.forEach((_, i) => setTimeout(() => setStep(i), i * 550)); setTimeout(() => { setRunning(false); setStep(workflow.length); }, workflow.length * 550 + 350); };
  const completed = step >= workflow.length;
  return <><PageHead eyebrow="Collaborative reasoning" title="Ask ORCA" description="Ask a marine-safety question and watch the specialist agents assemble a decision." />
    <div className="grid two-col">
      <div className="grid" style={{ alignContent: 'start' }}>
        <Card className="query-card"><div className="eyebrow" style={{ color: '#8be0d2' }}>Decision request</div><h2 style={{ color: '#fff', marginBottom: 14 }}>What would you like to know?</h2><textarea value={query} onChange={(e) => setQuery(e.target.value)} className="query-input" aria-label="Ask ORCA query" data-testid="input-orca-query" /><div style={{ display: 'flex', gap: 9, marginTop: 13 }}><button className="btn btn-teal" onClick={run} disabled={running || !query.trim()} data-testid="button-analyze"><Sparkles size={14} />Analyze</button><button className="btn btn-outline" onClick={() => { setQuery('Is it safe for a fishing boat to travel from Paradip to Visakhapatnam today?'); run(); }} disabled={running} data-testid="button-run-sih-demo"><Zap size={14} />Run SIH Demo</button></div></Card>
        <Card><SectionTitle title="How ORCA reasons" /><div className="list"><div className="list-row"><div><div className="list-title">Specialists, not a single guess</div><div className="list-meta">Weather, ocean, GIS and risk agents work on the same query.</div></div><Bot size={17} color="#258e91" /></div><div className="list-row"><div><div className="list-title">Evidence before recommendation</div><div className="list-meta">Five deterministic sources are correlated before validation.</div></div><Database size={17} color="#258e91" /></div></div></Card>
      </div>
      <Card><SectionTitle title="Reasoning workflow" meta={running ? 'PROCESSING' : completed ? 'COMPLETE' : 'READY'} /><div className="workflow">{workflow.map((name, i) => <div className={cn('workflow-step', step === i && 'active', step > i && 'done')} key={name}><div className="step-dot">{step > i ? <Check size={11} /> : i + 1}</div><div className="step-name">{name}</div><div className="step-status">{step > i ? 'Completed' : step === i ? 'Processing' : 'Waiting'}</div></div>)}</div>{completed ? <div className="result-box"><div className="eyebrow" style={{ color: '#237a6c' }}>Final recommendation</div><div className="recommendation">PROCEED WITH CAUTION</div><p style={{ fontSize: 12, color: '#4a626a', marginBottom: 12 }}>Safety validation: <strong>PASSED WITH WARNINGS</strong></p><div className="grid two-col" style={{ gap: 20 }}><div><h3 style={{ marginBottom: 9 }}>Reasons</h3><ul className="bullet-list"><li>Moderate wave conditions</li><li>Elevated coastal wind conditions</li><li>Route intersects a medium-risk zone</li><li>No critical geofence violation detected</li></ul></div><div><h3 style={{ marginBottom: 9 }}>Safety actions</h3><ul className="bullet-list"><li>Monitor updated weather</li><li>Check latest official marine advisory</li><li>Avoid identified risk zones</li><li>Maintain communication</li><li>Re-run analysis before departure</li></ul></div></div></div> : <div className="callout">Run the SIH demo to animate all nine stages and reveal a deterministic recommendation for the Paradip to Visakhapatnam route.</div>}</Card>
    </div>
    {completed && <div className="grid three-col" style={{ marginTop: 16 }}><Card><Badge tone="blue">WEATHER AGENT</Badge><h3 style={{ marginTop: 12 }}>Wind 12–18 kt</h3><p className="subhead">Partly Cloudy · Risk: Medium</p></Card><Card><Badge tone="blue">OCEAN AGENT</Badge><h3 style={{ marginTop: 12 }}>Wave Height 1.5–2.5 m</h3><p className="subhead">Sea State: Moderate · Risk: Medium</p></Card><Card><Badge tone="blue">GIS AGENT</Badge><h3 style={{ marginTop: 12 }}>Route intersects a medium-risk demonstration zone.</h3><p className="subhead">Risk Agent: Overall Risk: MEDIUM</p></Card></div>}
  </>;
}

function Analysis() {
  const trend = [{ name: '06:00', risk: 39, wave: 1.5 }, { name: '09:00', risk: 48, wave: 1.8 }, { name: '12:00', risk: 57, wave: 2.1 }, { name: '15:00', risk: 54, wave: 2.0 }, { name: '18:00', risk: 49, wave: 1.7 }];
  return <><PageHead eyebrow="Evidence synthesis" title="Marine Analysis" description="A compact readout of the specialist-agent findings behind the current risk posture." action={<Link className="btn btn-primary" href="/ask" data-testid="link-new-analysis"><Sparkles size={14} />New analysis</Link>} />
    <div className="grid two-col"><Card><SectionTitle title="Risk trend · demonstration window" meta="INDEX / 100" /><div style={{ width: '100%', height: 230 }}><ResponsiveContainer><LineChart data={trend}><CartesianGrid stroke="#e8eff0" vertical={false} /><XAxis dataKey="name" tick={{ fontSize: 10, fill: '#71878d' }} axisLine={false} tickLine={false} /><YAxis domain={[0, 80]} tick={{ fontSize: 10, fill: '#71878d' }} axisLine={false} tickLine={false} /><ChartTooltip /><Line type="monotone" dataKey="risk" stroke="#168da0" strokeWidth={3} dot={{ r: 3, fill: '#168da0' }} /></LineChart></ResponsiveContainer></div><div className="callout">Current overall marine risk is <strong>MEDIUM</strong>. The peak corresponds to the demo's 1.5–2.5 m wave window and coastal wind conditions.</div></Card><Card><SectionTitle title="Agent findings" meta="5 SIGNALS" /><div className="list">{[['Weather Agent', '12–18 kt · Partly Cloudy', 'MEDIUM'], ['Ocean Agent', '1.5–2.5 m · Moderate', 'MEDIUM'], ['GIS Agent', 'Medium-risk zone intersected', 'MEDIUM'], ['Risk Agent', 'Overall risk: MEDIUM', 'MEDIUM'], ['Safety Validation', 'Passed with warnings', 'PASSED']].map(([a, b, c]) => <div className="list-row" key={a}><div><div className="list-title">{a}</div><div className="list-meta">{b}</div></div><Badge tone={c === 'PASSED' ? 'low' : 'medium'}>{c}</Badge></div>)}</div></Card></div>
    <Card className="analysis-drivers"><SectionTitle title="Risk drivers" meta="ORDERED BY CONTRIBUTION" /><div className="grid three-col"><div className="agent-card"><Wind className="agent-icon" size={18} /><div><h3>Coastal wind</h3><p>Elevated wind conditions contribute to medium operational risk.</p></div></div><div className="agent-card"><Waves className="agent-icon" size={18} /><div><h3>Wave conditions</h3><p>Moderate sea state calls for a controlled route and watchkeeping.</p></div></div><div className="agent-card"><MapIcon className="agent-icon" size={18} /><div><h3>Zone intersection</h3><p>GIS evidence identifies a medium-risk demonstration zone.</p></div></div></div></Card>
  </>;
}

function MapPage() { return <><PageHead eyebrow="Spatial intelligence" title="Marine Map" description="Inspect demonstration risk layers, advisories, routes and coastal locations." /><MarineMap full /></>; }

function Alerts() {
  return <><PageHead eyebrow="Operational safety" title="Risk & Alerts" description="Prioritized demonstration alerts for coastal operators and fishing communities." action={<button className="btn btn-outline" onClick={() => window.scrollTo({ top: 500, behavior: 'smooth' })} data-testid="button-review-alerts"><ShieldAlert size={14} />Review alert board</button>} /><div className="grid three-col" style={{ marginBottom: 16 }}><Card><div className="eyebrow">HIGH RISK</div><div className="stat-inline"><strong style={{ color: '#bd4c40' }}>01</strong><small>active alert</small></div><p className="subhead">High Wind Alert</p></Card><Card><div className="eyebrow" style={{ color: '#9b7016' }}>MEDIUM RISK</div><div className="stat-inline"><strong style={{ color: '#b0801e' }}>02</strong><small>active alerts</small></div><p className="subhead">Wave and coastal conditions</p></Card><Card><div className="eyebrow" style={{ color: '#258b73' }}>LOWER RISK</div><div className="stat-inline"><strong style={{ color: '#258b73' }}>04</strong><small>monitored areas</small></div><p className="subhead">No active critical signal</p></Card></div><Card><SectionTitle title="Active alerts" meta="3 TOTAL · DEMO DATA" /><div className="list">{alerts.map((a, i) => <div className="list-row" key={a.title}><div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}><div className={cn('agent-icon', i === 0 && 'badge-high')}><Bell size={16} /></div><div><h3>{a.title}</h3><p className="list-meta">{a.area} · Demonstration alert</p><p className="subhead">{a.detail}</p></div></div><Badge tone={i === 0 ? 'high' : 'medium'}>{a.level}</Badge></div>)}</div></Card></>;
}

function RouteSafety() { return <><PageHead eyebrow="Route intelligence" title="Route Safety" description="Compare modeled route choices for the demonstration fishing-boat journey." action={<button className="btn btn-primary" onClick={() => document.getElementById('route-map')?.scrollIntoView({ behavior: 'smooth' })} data-testid="button-compare-routes"><RouteIcon size={14} />Compare routes</button>} /><div className="grid three-col" style={{ marginBottom: 16 }}><Card><div className="list-meta">ORIGIN</div><h2 style={{ marginTop: 7 }}>Paradip</h2><p className="subhead">Odisha · Bay of Bengal</p></Card><Card><div className="list-meta">DESTINATION</div><h2 style={{ marginTop: 7 }}>Visakhapatnam</h2><p className="subhead">Andhra Pradesh · Bay of Bengal</p></Card><Card><div className="list-meta">VESSEL</div><h2 style={{ marginTop: 7 }}>Fishing Boat</h2><p className="subhead">Small craft operating profile</p></Card></div><div className="grid two-col"><div className="grid" style={{ alignContent: 'start' }}><Card><SectionTitle title="Route comparison" /><div className="list"><div className="list-row"><div><div className="list-title">Original route</div><div className="list-meta">Shortest corridor · risk-zone intersection</div></div><Badge tone="medium">MEDIUM RISK</Badge></div><div className="list-row"><div><div className="list-title">Alternative route</div><div className="list-meta">Slightly longer · stays outside primary zone</div></div><Badge tone="low">LOWER RISK</Badge></div></div></Card><div className="callout"><strong>Recommendation:</strong> Prefer the alternative route where practical, while checking the latest official marine advisory before departure.</div></div><div id="route-map"><MarineMap full routeMode /></div></div></>; }

function Geofencing() { return <><PageHead eyebrow="Boundary awareness" title="Geofencing" description="Review demonstration operating boundaries and the route's spatial intersections." /><div className="grid two-col"><Card><SectionTitle title="Zone catalogue" meta="4 DEMO ZONES" /><div className="list">{[['Restricted Zone', 'No-entry boundary', 'high'], ['High Risk Zone', 'Avoid if possible', 'high'], ['Advisory Zone', 'Additional caution', 'medium'], ['Safe Operating Zone', 'Preferred operating area', 'low']].map(([name, detail, tone]) => <div className="list-row" key={name}><div style={{ display: 'flex', gap: 10, alignItems: 'center' }}><span className={`legend-dot`} style={{ background: tone === 'high' ? '#d6685b' : tone === 'medium' ? '#dda82d' : '#4cab8d' }} /><div><div className="list-title">{name}</div><div className="list-meta">{detail}</div></div></div><ChevronRight size={15} color="#99adb2" /></div>)}</div></Card><MarineMap full routeMode /></div><div className="callout" style={{ marginTop: 16 }}><strong>Route intersection warning:</strong> The Paradip → Visakhapatnam demonstration route intersects a medium-risk zone. No critical geofence violation detected.</div></>; }

function Evidence() {
  const rows = sources.map((source, i) => ({ source, agent: ['Weather Agent', 'Ocean Agent', 'Advisory Parser', 'GIS Agent', 'Visualization Agent'][i], finding: ['Wind 12–18 kt; partly cloudy', 'Wave height 1.5–2.5 m; moderate', 'Check latest official advisory', 'Medium-risk zone intersected', 'Coastal scene confirms zone context'][i], risk: i === 2 ? 'Context' : i === 4 ? 'Low' : 'Medium', confidence: ['91%', '88%', '76%', '94%', '81%'][i] }));
  return <><PageHead eyebrow="Traceable reasoning" title="Evidence Explorer" description="Inspect the five deterministic evidence sources correlated in the latest analysis." action={<button className="btn btn-outline" onClick={() => window.print()} data-testid="button-export-evidence"><BookOpen size={14} />Export view</button>} /><Card pad={false}><div className="table-wrap"><table><thead><tr><th>Source</th><th>Agent</th><th>Timestamp</th><th>Finding</th><th>Risk contribution</th><th>Confidence</th></tr></thead><tbody>{rows.map((row, i) => <tr key={row.source} data-testid={`row-evidence-${i}`}><td><span className="source-dot" />{row.source}</td><td>{row.agent}</td><td className="mono" style={{ color: '#70848b', fontSize: 10 }}>14 FEB 2026<br />09:{32 + i} IST</td><td>{row.finding}</td><td><Badge tone={row.risk === 'Low' ? 'low' : row.risk === 'Context' ? 'blue' : 'medium'}>{row.risk}</Badge></td><td className="mono">{row.confidence}</td></tr>)}</tbody></table></div></Card><div className="footer-disclaimer">Evidence is deterministic demonstration data prepared for the ORCA SIH 2026 prototype.</div></>; }

function History() { const [selected, setSelected] = useState(0); const runs = [{ time: 'Today · 09:38 IST', question: 'Is it safe for a fishing boat to travel from Paradip to Visakhapatnam today?', result: 'PROCEED WITH CAUTION' }, { time: 'Today · 08:12 IST', question: 'Assess wave conditions near Visakhapatnam', result: 'MEDIUM RISK' }, { time: 'Yesterday · 16:40 IST', question: 'Check coastal risk around Puri', result: 'MONITOR CONDITIONS' }]; return <><PageHead eyebrow="Traceability" title="Analysis History" description="Review recent deterministic ORCA runs and their operational outcomes." /><div className="grid two-col"><Card><SectionTitle title="Recent runs" meta={`${runs.length} SAVED`} /><div className="list">{runs.map((run, i) => <button className={cn('list-row', selected === i && 'toggle on')} style={{ textAlign: 'left', width: '100%' }} onClick={() => setSelected(i)} key={run.time} data-testid={`button-history-${i}`}><div><div className="list-title">{run.time}</div><div className="list-meta">{run.question}</div></div><ChevronRight size={15} /></button>)}</div></Card><Card><SectionTitle title="Run detail" meta="DETERMINISTIC" /><div className="eyebrow">QUERY</div><p style={{ fontSize: 15, lineHeight: 1.45, fontWeight: 600 }}>{runs[selected].question}</p><div style={{ margin: '20px 0' }}><Badge tone="low">COMPLETED</Badge></div><div className="result-box"><div className="list-meta">FINAL RECOMMENDATION</div><div className="recommendation" style={{ fontSize: 20 }}>{runs[selected].result}</div><p className="subhead">5 evidence sources · Safety validation passed with warnings.</p></div><Link href="/ask" className="btn btn-primary" style={{ marginTop: 18 }} data-testid="link-rerun-analysis"><HistoryIcon size={14} />Open in Ask ORCA</Link></Card></div></>; }

function Sources() { return <><PageHead eyebrow="System transparency" title="Data Sources" description="The deterministic inputs available to ORCA in this prototype." /><div className="grid two-col"><Card><SectionTitle title="Connected sources" meta="5 / 5 CONNECTED" /><div className="list">{[['Weather', CloudSun, 'Wind, temperature and cloud state'], ['Oceanographic', Waves, 'Wave height and sea state'], ['Marine Advisory', LifeBuoy, 'Advisory context for validation'], ['Satellite Earth Observation', Globe2, 'Coastal scene context'], ['GIS', MapIcon, 'Zones, routes and boundaries']].map(([name, Icon, detail]) => { const SourceIcon = Icon as IconType; return <div className="list-row" key={name as string}><div style={{ display: 'flex', gap: 11, alignItems: 'center' }}><div className="agent-icon"><SourceIcon size={16} /></div><div><div className="list-title">{name as string}</div><div className="list-meta">{detail as string}</div></div></div><Badge tone="low"><Check size={10} />DEMO DATA</Badge></div>; })}</div></Card><Card><SectionTitle title="Data handling" /><div className="agent-card"><Database className="agent-icon" size={18} /><div><h3>Consistent by design</h3><p>Every screen uses the same fixed facts so the SIH demonstration can be repeated reliably without live integrations.</p></div></div><div className="agent-card" style={{ marginTop: 10 }}><ShieldAlert className="agent-icon" size={18} /><div><h3>Operational boundary</h3><p>ORCA supports judgment with structured evidence. It does not replace official marine advisories or professional operational judgment.</p></div></div></Card></div></>; }

function Agents() { return <><PageHead eyebrow="Collaborative intelligence" title="Agent Network" description="Specialists contribute focused findings before a shared evidence and safety decision." /><Card><SectionTitle title="Reasoning topology" meta="DEMO EXECUTION GRAPH" /><div className="network"><div className="network-track"><div className="network-group">{['Planner', 'Weather', 'Ocean', 'GIS', 'Risk', 'Visualization'].map((n) => <div className="network-node" key={n}>{n}</div>)}</div><div className="network-arrow">→</div><div className="network-node primary">Evidence Fusion</div><div className="network-arrow">→</div><div className="network-node primary">Safety Validation</div><div className="network-arrow">→</div><div className="network-node primary">Recommendation</div></div></div></Card><div className="grid three-col" style={{ marginTop: 16 }}>{[['Planner', 'Breaks the user query into the route-safety plan.'], ['Weather', 'Reads wind, temperature and cloud conditions.'], ['Ocean', 'Interprets waves and sea state.'], ['GIS', 'Checks route intersections and zones.'], ['Risk', 'Combines signals into the marine risk score.'], ['Visualization', 'Makes the operating picture easy to inspect.']].map(([name, desc]) => <div className="agent-card" key={name}><div className="agent-icon"><Bot size={16} /></div><div><h3>{name} Agent</h3><p>{desc}</p></div></div>)}</div></>; }

function Architecture() { const nodes = ['User', 'React Frontend', 'API Layer', 'Planner', 'Specialized Agents', 'Data Sources', 'Evidence Fusion', 'Safety Validation', 'Recommendation']; return <><PageHead eyebrow="System design" title="Architecture" description="A transparent path from operator question to a validated operational recommendation." /><Card><div className="architecture">{nodes.map((node, i) => <div key={node} style={{ display: 'contents' }}><div className={cn('arch-node', i === 1 || i === 8 ? 'primary' : '')}>{node}</div>{i < nodes.length - 1 && <div className="arch-arrow">↓</div>}</div>)}</div></Card><div className="callout" style={{ marginTop: 16 }}>This frontend prototype models the API layer and agent network locally with deterministic data. No live marine service is called.</div></>; }

function About() { return <><PageHead eyebrow="Prototype brief" title="About ORCA" description="Marine Ecosystem Reasoning with Collaborative Agents, built for clear decisions under coastal uncertainty." /><div className="grid two-col"><Card><div className="eyebrow">SMART INDIA HACKATHON 2026</div><h2 style={{ fontSize: 27, marginBottom: 12 }}>Team Arise</h2><p className="subhead" style={{ fontSize: 15 }}>ORCA is a marine-intelligence command center for coastal operators and fishing communities. It turns multiple specialized agents and marine evidence into a clear operational recommendation.</p><div className="grid three-col" style={{ marginTop: 23 }}><div><div className="list-meta">PROBLEM STATEMENT</div><strong>26176</strong></div><div><div className="list-meta">THEME</div><strong>Disaster Management</strong></div><div><div className="list-meta">MODE</div><strong>Prototype</strong></div></div></Card><Card><SectionTitle title="Why ORCA" /><div className="list"><div className="list-row"><div><div className="list-title">One operational picture</div><div className="list-meta">Weather, ocean, GIS and advisory context in one place.</div></div><Compass size={18} color="#1681a3" /></div><div className="list-row"><div><div className="list-title">Collaborative by default</div><div className="list-meta">Specialist agents make reasoning inspectable.</div></div><Network size={18} color="#1681a3" /></div><div className="list-row"><div><div className="list-title">Grounded recommendations</div><div className="list-meta">Every conclusion is tied to evidence and safety checks.</div></div><ShieldAlert size={18} color="#1681a3" /></div></div></Card></div><div className="footer-disclaimer"><strong>ORCA is a prototype decision-support system using demonstration data. It does not replace official marine advisories or professional operational judgment.</strong></div></>; }

function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) { const [location] = useLocation(); return <aside className={cn('sidebar', open && 'open')}><div className="brand"><div className="brand-mark">OC</div><div><div className="brand-name">ORCA</div><div className="brand-sub">Marine Ecosystem Reasoning<br />with Collaborative Agents</div></div><button className="mobile-menu" onClick={onClose} aria-label="Close navigation"><X size={17} color="#fff" /></button></div>{navSections.map((section) => <div key={section.label || 'dashboard'}>{section.label && <div className="nav-label">{section.label}</div>}{section.items.map(({ href, label, icon: Icon }) => <Link href={href} onClick={onClose} key={href} className={cn('nav-link', location === href && 'active')} data-testid={`link-nav-${label.toLowerCase().replaceAll(' ', '-')}`}><Icon size={16} /><span>{label}</span></Link>)}</div>)}<div className="demo-chip"><span className="demo-dot" />DEMO DATA MODE</div></aside>; }

function Shell({ children }: { children: ReactNode }) { const [menuOpen, setMenuOpen] = useState(false); const [location] = useLocation(); const title = navSections.flatMap((s) => s.items).find((i) => i.href === location)?.label || 'Dashboard'; return <div className="shell"><Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} /><main className="main"><header className="topbar"><div style={{ display: 'flex', alignItems: 'center' }}><button className="mobile-menu" onClick={() => setMenuOpen(true)} aria-label="Open navigation"><Menu size={20} /></button><div className="crumb"><span>ORCA /</span><strong>{title}</strong></div></div><div className="top-actions"><select className="select" aria-label="Select language" defaultValue="English"><option>English</option><option>ଓଡ଼ିଆ · Odia</option><option>हिन्दी · Hindi</option></select><span className="badge badge-blue"><span className="demo-dot" style={{ width: 6, height: 6 }} />DEMO</span></div></header><div className="content">{children}<div className="footer-disclaimer">ORCA is a prototype decision-support system using demonstration data. It does not replace official marine advisories or professional operational judgment.</div></div></main></div>; }

function NotFound() { return <PageHead eyebrow="404" title="Signal not found" description="The requested ORCA view does not exist." action={<Link href="/" className="btn btn-primary">Return to dashboard</Link>} />; }
function Router() { return <Shell><ErrorBoundary resetKey={useLocation()[0]}><Switch><Route path="/" component={Dashboard} /><Route path="/ask" component={AskOrca} /><Route path="/analysis" component={Analysis} /><Route path="/map" component={MapPage} /><Route path="/alerts" component={Alerts} /><Route path="/route-safety" component={RouteSafety} /><Route path="/geofencing" component={Geofencing} /><Route path="/evidence" component={Evidence} /><Route path="/history" component={History} /><Route path="/sources" component={Sources} /><Route path="/agents" component={Agents} /><Route path="/architecture" component={Architecture} /><Route path="/about" component={About} /><Route component={NotFound} /></Switch></ErrorBoundary></Shell>; }
function App() { return <QueryClientProvider client={queryClient}><TooltipProvider><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><Router /></WouterRouter><Toaster /></TooltipProvider></QueryClientProvider>; }
export default App;