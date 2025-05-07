// DataManager.js

import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import { db } from '../firebase';
import {
  getDocs,
  collection,
  collectionGroup,
  writeBatch,
  doc
} from 'firebase/firestore';

export async function exportAllData() {
  // 1) fetch all collections
  const [prodSnap, covSnap, formSnap] = await Promise.all([
    getDocs(collection(db, 'products')),
    getDocs(collectionGroup(db, 'coverages')),
    getDocs(collectionGroup(db, 'forms')),
    // … you can add getDocs(collectionGroup(db, 'rules')), etc.
  ]);

  // 2) build sheets
  const wsProducts  = XLSX.utils.json_to_sheet(prodSnap.docs.map(d => ({ id: d.id, ...d.data() })));
  const wsCoverages = XLSX.utils.json_to_sheet(covSnap.docs.map(d => ({ id: d.id, ...d.data() })));
  const wsForms     = XLSX.utils.json_to_sheet(formSnap.docs.map(d => ({ id: d.id, ...d.data() })));

  // 3) create workbook
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, wsProducts,  'Products');
  XLSX.utils.book_append_sheet(wb, wsCoverages, 'Coverages');
  XLSX.utils.book_append_sheet(wb, wsForms,     'Forms');

  // 4) export
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  saveAs(new Blob([wbout], { type: 'application/octet-stream' }), 'firestore-export.xlsx');
}

export async function importAllData(evt) {
  const file = evt.target.files[0];
  if (!file) return;
  const data = await file.arrayBuffer();
  const wb   = XLSX.read(data, { type: 'array' });
  const batch = writeBatch(db);

  // Products
  const ps = XLSX.utils.sheet_to_json(wb.Sheets['Products']);
  ps.forEach(row => {
    const ref = row.id
      ? doc(db, 'products', row.id)
      : doc(collection(db, 'products'));
    const { id, ...fields } = row;
    batch.set(ref, fields);
  });

  // Coverages
  const cs = XLSX.utils.sheet_to_json(wb.Sheets['Coverages']);
  cs.forEach(row => {
    const ref = row.id
      ? doc(db, `products/${row.productId}/coverages`, row.id)
      : doc(collection(db, `products/${row.productId}/coverages`));
    const { id, productId, ...fields } = row;
    batch.set(ref, fields);
  });

  // Forms
  const fs = XLSX.utils.sheet_to_json(wb.Sheets['Forms']);
  fs.forEach(row => {
    const ref = row.id
      ? doc(db, 'forms', row.id)
      : doc(collection(db, 'forms'));
    const { id, ...fields } = row;
    batch.set(ref, fields);
  });

  // …repeat for Rules, Steps, etc.

  await batch.commit();
  alert('Import complete!');
  evt.target.value = null;
}