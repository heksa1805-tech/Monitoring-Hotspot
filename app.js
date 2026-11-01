const map=L.map('map').setView([-1.5,117.2],5);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'© OpenStreetMap'}).addTo(map);
const layer=L.layerGroup().addTo(map); let features=[];
const fmt=v=>v===null||v===undefined||v===''?'—':v;
function color(c){c=String(c||'').toLowerCase();return c==='h'||c==='high'?'#d7191c':c==='n'||c==='nominal'?'#f08c00':'#e8c547'}
function render(){
 const s=document.getElementById('sensor').value, c=document.getElementById('confidence').value;
 const f=features.filter(x=>{const p=x.properties||{};const sensor=String(p.instrument||p.sensor||'').toUpperCase();const conf=String(p.confidence||'').toLowerCase();return (s==='all'||sensor.includes(s))&&(c==='all'||(c==='high'&&(conf==='h'||conf==='high'))||(c==='nominal'&&['h','n','high','nominal'].includes(conf))||(c==='low'&&(conf==='l'||conf==='low')))});
 layer.clearLayers(); f.forEach(x=>{const p=x.properties||{},ll=x.geometry.coordinates;L.circleMarker([ll[1],ll[0]],{radius:6,color:color(p.confidence),fillOpacity:.8,weight:1}).bindPopup(`<b>${p.satellite||p.sensor||'NASA FIRMS'}</b><br>Tanggal: ${fmt(p.acq_date)}<br>Waktu UTC: ${fmt(p.acq_time)}<br>Confidence: ${fmt(p.confidence)}<br>FRP: ${fmt(p.frp)} MW`).addTo(layer)});
 document.getElementById('total').textContent=f.length.toLocaleString('id-ID');
 const cutoff=new Date(Date.now()-24*3600*1000);const recent=f.filter(x=>{const p=x.properties||{};return new Date(`${p.acq_date}T${String(p.acq_time||'0000').padStart(4,'0').slice(0,2)}:${String(p.acq_time||'0000').padStart(4,'0').slice(2,4)}:00Z`)>cutoff});
 document.getElementById('last24').textContent=recent.length.toLocaleString('id-ID');
 document.getElementById('conf').textContent=f.filter(x=>['h','n','high','nominal'].includes(String(x.properties?.confidence||'').toLowerCase())).length.toLocaleString('id-ID');
 document.getElementById('frp').textContent=f.reduce((a,x)=>a+(Number(x.properties?.frp)||0),0).toFixed(1);
 document.getElementById('rows').innerHTML=f.slice().sort((a,b)=>String(b.properties?.acq_date||'').localeCompare(String(a.properties?.acq_date||''))).slice(0,100).map(x=>{const p=x.properties||{},q=x.geometry.coordinates;return `<tr><td>${fmt(p.acq_date)}</td><td>${fmt(p.acq_time)}</td><td>${fmt(p.satellite||p.instrument)}</td><td>${q[1].toFixed(5)}</td><td>${q[0].toFixed(5)}</td><td>${fmt(p.confidence)}</td><td>${fmt(p.frp)}</td></tr>`}).join('')||'<tr><td colspan="7">Tidak ada deteksi sesuai filter.</td></tr>';
}
document.querySelectorAll('select').forEach(e=>e.addEventListener('change',render));
Promise.all([fetch('data/hotspots_latest.geojson').then(r=>{if(!r.ok)throw Error('GeoJSON belum tersedia');return r.json()}),fetch('data/metadata.json').then(r=>r.ok?r.json():{})]).then(([g,m])=>{features=g.features||[];render();document.getElementById('status').textContent='Data diperbarui: '+(m.updated_at||'metadata tidak tersedia')}).catch(e=>{document.getElementById('status').textContent='Data belum tersedia';document.getElementById('rows').innerHTML=`<tr><td colspan="7">${e.message}. Periksa batas PBPH dan workflow GitHub Actions.</td></tr>`});
