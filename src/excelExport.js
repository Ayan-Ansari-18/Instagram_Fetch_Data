import * as XLSX from 'xlsx';

const DB_NAME = 'universalskill_export';
const STORE = 'rows';

const openDB = () =>
  new Promise((resolve, reject) => {
    const req = window.indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = (e) => e.target.result.createObjectStore(STORE, { autoIncrement: true });
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror = () => reject(req.error);
  });

const getSavedRows = async () => {
  const db = await openDB();
  return new Promise((resolve) => {
    const rows = [];
    db.transaction(STORE).objectStore(STORE).openCursor().onsuccess = (e) => {
      const cursor = e.target.result;
      if (cursor) { rows.push(cursor.value); cursor.continue(); }
      else resolve(rows);
    };
  });
};

const saveRows = async (rows) => {
  const db = await openDB();
  const tx = db.transaction(STORE, 'readwrite');
  const store = tx.objectStore(STORE);
  rows.forEach(r => store.add(r));
  return new Promise((resolve) => { tx.oncomplete = resolve; });
};

const formatDate = (d) => {
  const dt = d ? new Date(d) : new Date();
  return `${dt.getDate().toString().padStart(2,'0')}/${(dt.getMonth()+1).toString().padStart(2,'0')}/${dt.getFullYear()} ${dt.getHours().toString().padStart(2,'0')}:${dt.getMinutes().toString().padStart(2,'0')}`;
};

export const exportToExcel = async (results, { city, profession, followers }) => {
  const newRows = results.map(p => ({
    'Search Date & Time': formatDate(),
    'Search City': city,
    'Search Profession': profession,
    'Username': `@${p.username}`,
    'Full Name': p.name,
    'Bio / Profession': p.bio,
    'City (Profile)': p.city,
    'Followers': p.followers,
    'Following': p.following,
    'Total Posts': p.posts,
    'Engagement Rate': `${p.engagementRate}%`,
    'Account Type': p.accountType,
    'Last Post Date': p.lastPost ? formatDate(p.lastPost) : '',
    'Profile URL': p.profileUrl,
    'Follower Range Searched': followers || '',
  }));

  await saveRows(newRows);
  const allRows = await getSavedRows();

  const ws = XLSX.utils.json_to_sheet(allRows);
  const range = XLSX.utils.decode_range(ws['!ref']);
  for (let c = range.s.c; c <= range.e.c; c++) {
    const cell = ws[XLSX.utils.encode_cell({ r: 0, c })];
    if (cell) cell.s = { font: { bold: true }, fill: { fgColor: { rgb: '1E88E5' } } };
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Search Results');

  const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 16);
  const fileName = `instagram_search_${city}_${profession}_${ts}.xlsx`.replace(/\s+/g, '_');
  XLSX.writeFile(wb, fileName);

  return newRows.length;
};
