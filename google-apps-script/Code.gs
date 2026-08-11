/** Valodu Māja catalogue API — deploy as Web app (Execute as: Me; access: Anyone). */
const CONFIG = {
  spreadsheetId: '1Ij_se8ffwZWQBkB5GzZpsF606FLEdDbmAay0P2EyFW0',
  sheetName: 'Sheet1',
  coversFolderId: '1WKBVGdEHEcH-bb5Gl5pJwHCKG72cdqZ_',
  cacheSeconds: 300
};

function doGet(e) {
  try {
    const action = String((e && e.parameter.action) || 'books');
    if (action !== 'books') return json_({ok:false,error:'Unknown action'});
    const cache = CacheService.getScriptCache();
    const key = 'vm-books-v3';
    const cached = cache.get(key);
    if (cached) return ContentService.createTextOutput(cached).setMimeType(ContentService.MimeType.JSON);
    const result = JSON.stringify({ok:true,updatedAt:new Date().toISOString(),books:readBooks_()});
    cache.put(key, result, CONFIG.cacheSeconds);
    return ContentService.createTextOutput(result).setMimeType(ContentService.MimeType.JSON);
  } catch (err) { return json_({ok:false,error:String(err && err.message || err)}); }
}

function readBooks_() {
  const sheet = SpreadsheetApp.openById(CONFIG.spreadsheetId).getSheetByName(CONFIG.sheetName);
  if (!sheet) throw new Error('Sheet not found: ' + CONFIG.sheetName);
  const values = sheet.getDataRange().getDisplayValues();
  if (values.length < 2) return [];
  const headers = values.shift().map(normalize_);
  const covers = getCoverMap_();
  const aliases = {
    id:['bok-id','book-id','id','gramatas-id'], title:['tittel-pa-boka','nosaukums','title'],
    author:['navn-pa-forfatteren-etternavn-fornavn','autors','author'], year:['arstall','izdosanas-gads','year'],
    language:['sprak','valoda','language'], topic:['undertema','tema','topic'], comments:['kommentar-om-boka','piezimes','comments'],
    filename:['filnavn','faila-nosaukums','filename'], copies:['eksemplar','eksemplari','copies'], level:['limenis','level'], type:['materiala-veids','veids','type'], audience:['merkauditorija','audience']
  };
  const ix = {}; Object.keys(aliases).forEach(k => ix[k] = headers.findIndex(h => aliases[k].indexOf(h) >= 0));
  const val = (row,k) => ix[k] >= 0 ? String(row[ix[k]] || '').trim() : '';
  return values.map(row => {
    const id = val(row,'id'); const filename = val(row,'filename'); const fileId = covers[normalize_(filename)] || covers[normalize_(id)];
    return {id:id,title:val(row,'title'),author:val(row,'author'),year:Number(val(row,'year'))||val(row,'year'),language:val(row,'language'),topic:val(row,'topic'),comments:val(row,'comments'),copies:val(row,'copies'),level:val(row,'level'),type:val(row,'type'),audience:val(row,'audience'),cover:fileId?'https://drive.google.com/thumbnail?id='+encodeURIComponent(fileId)+'&sz=w500':''};
  }).filter(b => b.id && b.title);
}

function getCoverMap_() {
  const map = {}; const files = DriveApp.getFolderById(CONFIG.coversFolderId).getFiles();
  while (files.hasNext()) { const f=files.next(); const name=normalize_(f.getName()); map[name]=f.getId(); map[name.replace(/\.[^.]+$/,'')]=f.getId(); }
  return map;
}
function normalize_(s) { return String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,''); }
function json_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }

/** Run after editing data if you want changes visible immediately. */
function clearCatalogueCache() { CacheService.getScriptCache().remove('vm-books-v3'); }
