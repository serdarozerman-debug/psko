/**
 * Platform-admin API (FR-12).
 *
 * Wraps the ltijs `Database` registration API. Backed by ltijs-sequelize on
 * the Supabase `lti` schema.
 *
 * All routes require ADMIN_SECRET (see middleware/adminAuth).
 */
import { Router, type RequestHandler } from 'express';
import { adminAuth } from '../middleware/adminAuth';

export interface PlatformProvider {
  getAllPlatforms(): Promise<
    Array<{
      name: string;
      url: string; // issuer
      clientId: string;
      authenticationEndpoint: string;
      accesstokenEndpoint: string;
      authConfig: { method: string; key: string };
    }>
  >;
  registerPlatform(payload: {
    name: string;
    url: string;
    clientId: string;
    authenticationEndpoint: string;
    accesstokenEndpoint: string;
    authConfig: { method: string; key: string };
  }): Promise<void>;
  deletePlatform(clientId: string, issuer: string): Promise<void>;
}

export function createAdminRouter(adminSecret: string, provider: PlatformProvider): Router {
  const router = Router();
  router.use(adminAuth(adminSecret));

  const list: RequestHandler = async (_req, res) => {
    const platforms = await provider.getAllPlatforms();
    res.json({ platforms });
  };

  const create: RequestHandler = async (req, res) => {
    const b = req.body ?? {};
    const required = [
      'name',
      'url',
      'clientId',
      'authenticationEndpoint',
      'accesstokenEndpoint',
      'jwksUrl',
    ];
    for (const k of required) {
      if (typeof b[k] !== 'string' || !b[k]) {
        res.status(400).json({ error: `missing field: ${k}` });
        return;
      }
    }
    await provider.registerPlatform({
      name: b.name,
      url: b.url,
      clientId: b.clientId,
      authenticationEndpoint: b.authenticationEndpoint,
      accesstokenEndpoint: b.accesstokenEndpoint,
      authConfig: { method: 'JWK_SET', key: b.jwksUrl },
    });
    res.status(201).json({ ok: true });
  };

  const remove: RequestHandler = async (req, res) => {
    const clientId = req.params.id;
    const issuer = (req.query.issuer as string | undefined) ?? '';
    if (!issuer) {
      res.status(400).json({ error: 'issuer query param required' });
      return;
    }
    await provider.deletePlatform(clientId, issuer);
    res.json({ ok: true });
  };

  router.get('/platforms', list);
  router.post('/platforms', create);
  router.delete('/platforms/:id', remove);

  // Tiny HTML admin UI (FR-12) — secret entered in a header by the operator.
  router.get('/', (_req, res) => {
    res.type('html').send(ADMIN_HTML);
  });

  return router;
}

const ADMIN_HTML = `<!doctype html>
<html><head><meta charset="utf-8"><title>PSKO LTI Admin</title>
<style>body{font-family:system-ui;padding:24px;max-width:720px;margin:auto}
input,button{font:inherit;padding:6px;margin:4px 0;width:100%;box-sizing:border-box}
table{border-collapse:collapse;width:100%}td,th{border:1px solid #ddd;padding:6px;text-align:left}
</style></head><body>
<h1>LTI Platforms</h1>
<p>Bearer token: <input id="tok" placeholder="ADMIN_SECRET" /></p>
<button onclick="load()">Reload</button>
<table id="tbl"><thead><tr><th>Name</th><th>Issuer</th><th>Client ID</th><th></th></tr></thead><tbody></tbody></table>
<h2>Register new platform</h2>
<form onsubmit="create(event)">
  <input name="name" placeholder="Display name" required />
  <input name="url" placeholder="Issuer (https://canvas.example.com)" required />
  <input name="clientId" placeholder="Client ID" required />
  <input name="authenticationEndpoint" placeholder="Auth endpoint" required />
  <input name="accesstokenEndpoint" placeholder="Token endpoint" required />
  <input name="jwksUrl" placeholder="JWKS URL" required />
  <button type="submit">Register</button>
</form>
<script>
const tok=()=>document.getElementById('tok').value;
async function load(){
  const r=await fetch('./platforms',{headers:{authorization:'Bearer '+tok()}});
  if(!r.ok){alert('Auth failed');return}
  const {platforms}=await r.json();
  const body=document.querySelector('#tbl tbody');body.innerHTML='';
  for(const p of platforms){
    const tr=document.createElement('tr');
    tr.innerHTML='<td></td><td></td><td></td><td><button>Delete</button></td>';
    tr.children[0].textContent=p.name;tr.children[1].textContent=p.url;tr.children[2].textContent=p.clientId;
    tr.querySelector('button').onclick=async()=>{
      if(!confirm('Delete '+p.name+'?'))return;
      await fetch('./platforms/'+encodeURIComponent(p.clientId)+'?issuer='+encodeURIComponent(p.url),
        {method:'DELETE',headers:{authorization:'Bearer '+tok()}});
      load();
    };
    body.appendChild(tr);
  }
}
async function create(e){
  e.preventDefault();
  const f=Object.fromEntries(new FormData(e.target));
  const r=await fetch('./platforms',{method:'POST',headers:{'content-type':'application/json',authorization:'Bearer '+tok()},body:JSON.stringify(f)});
  if(!r.ok){alert('Failed');return}
  e.target.reset();load();
}
</script></body></html>`;
