// src/components/RulesScreen.js
import React, { useState, useEffect } from 'react';
import { Link }              from 'react-router-dom';
import { db }                from '../firebase';
import {
  collection,
  query,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore';
import {
  PencilIcon,
  TrashIcon,
  PlusIcon,
  XMarkIcon
} from '@heroicons/react/24/solid';
import './common.css';

/*  ──────────────────────────────────────────────────────────
    Firestore “rules” documents follow the DataDictionary:

    {
      ruleId:            string   (auto-id OK, but we store a code if provided)
      name:              string   (short title / description)
      condition:         string   (IF…)
      outcome:           string   (THEN…)
      reference:         string   (e.g. “ISO CP 00 10” or internal manual)
      proprietary:       boolean
      productId:         string   (optional – FK to products.id)
      coverageId:        string   (optional – FK to coverages.id)
      createdAt:         timestamp
      updatedAt:         timestamp
    }
    ────────────────────────────────────────────────────────── */

export default function RulesScreen() {
  /* ─── local UI state ─────────────────────────────── */
  const [rules, setRules]           = useState([]);
  const [search, setSearch]         = useState('');
  const [showModal, setShowModal]   = useState(false);
  const [editing, setEditing]       = useState(null);     // rule object or null
  const [form, setForm]             = useState({
    ruleId: '',
    name: '',
    condition: '',
    outcome: '',
    reference: '',
    proprietary: 'No',              // 'Yes' / 'No'
    productId: '',
    coverageId: ''
  });

  /* ─── live Firestore listener ─────────────────────── */
  useEffect(() => {
    const q = query(collection(db, 'rules'));
    const unsub = onSnapshot(q, snap => {
      setRules(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, []);

  /* ─── helpers ─────────────────────────────────────── */
  const resetForm = () => {
    setForm({
      ruleId: '',
      name: '',
      condition: '',
      outcome: '',
      reference: '',
      proprietary: 'No',
      productId: '',
      coverageId: ''
    });
    setEditing(null);
  };

  const openForNew  = () => { resetForm(); setShowModal(true); };
  const openForEdit = r  => {
    setEditing(r);
    setForm({
      ruleId: r.ruleId || '',
      name: r.name || '',
      condition: r.condition || '',
      outcome: r.outcome || '',
      reference: r.reference || '',
      proprietary: r.proprietary ? 'Yes' : 'No',
      productId: r.productId || '',
      coverageId: r.coverageId || ''
    });
    setShowModal(true);
  };

  /* ─── CRUD submit ─────────────────────────────────── */
  const handleSubmit = async () => {
    if (!form.name || !form.condition || !form.outcome) {
      alert('Name, Condition, and Outcome are required.');
      return;
    }
    const data = {
      ruleId:    form.ruleId.trim() || null,
      name:      form.name.trim(),
      condition: form.condition.trim(),
      outcome:   form.outcome.trim(),
      reference: form.reference.trim(),
      proprietary: form.proprietary === 'Yes',
      productId: form.productId.trim() || null,
      coverageId: form.coverageId.trim() || null,
      updatedAt: serverTimestamp()
    };
    try {
      if (editing) {
        await updateDoc(doc(db, 'rules', editing.id), data);
      } else {
        await addDoc(collection(db, 'rules'), {
          ...data,
          createdAt: serverTimestamp()
        });
      }
      setShowModal(false);
      resetForm();
    } catch (err) {
      console.error(err);
      alert('Save failed.');
    }
  };

  const handleDelete = async id => {
    if (!window.confirm('Delete this rule?')) return;
    try {
      await deleteDoc(doc(db, 'rules', id));
    } catch {
      alert('Delete failed.');
    }
  };

  /* ─── filtered list ───────────────────────────────── */
  const filtered = rules.filter(r =>
    (r.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (r.ruleId || '').toLowerCase().includes(search.toLowerCase())
  );

  /*  ────────────────────────────────────────────────── */
  return (
    <div className="ph-container">
      <div className="ph-wrapper">
        <header className="ph-header">
          <h1 className="ph-title">Rules Repository</h1>
          <button className="ph-submit" onClick={openForNew}>
            <PlusIcon className="w-5 h-5 inline-block mr-1"/> Add Rule
          </button>
        </header>

        <input
          className="ph-search"
          placeholder="Search by Rule ID or Name"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />

        {filtered.length ? (
          <div className="ph-table-wrap">
            <table className="ph-table">
              <thead className="ph-thead">
                <tr className="ph-tr">
                  <th className="ph-th">Rule&nbsp;ID</th>
                  <th className="ph-th">Name / Description</th>
                  <th className="ph-th">Condition (IF)</th>
                  <th className="ph-th">Outcome (THEN)</th>
                  <th className="ph-th">Reference</th>
                  <th className="ph-th">Proprietary</th>
                  <th className="ph-th">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(r => (
                  <tr className="ph-tr" key={r.id}>
                    <td className="ph-td">{r.ruleId || '—'}</td>
                    <td className="ph-td">{r.name}</td>
                    <td className="ph-td">{r.condition}</td>
                    <td className="ph-td">{r.outcome}</td>
                    <td className="ph-td">{r.reference || '—'}</td>
                    <td className="ph-td">
                      {r.proprietary ? 'Yes' : 'No'}
                    </td>
                    <td className="ph-td">
                      <button
                        className="ph-action-btn"
                        onClick={() => openForEdit(r)}
                        title="Edit"
                      >
                        <PencilIcon/>
                      </button>
                      <button
                        className="ph-action-btn ph-danger"
                        onClick={() => handleDelete(r.id)}
                        title="Delete"
                      >
                        <TrashIcon/>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="ph-no-products">No rules found.</div>
        )}

        {/* ─── modal ────────────────────────────────── */}
        {showModal && (
          <div className="ph-modal-overlay" onClick={() => { setShowModal(false); resetForm(); }}>
            <div className="ph-modal-content" onClick={e => e.stopPropagation()}>
              <button className="ph-close-btn" onClick={() => { setShowModal(false); resetForm(); }}>
                <XMarkIcon/>
              </button>

              <h3>{editing ? 'Edit Rule' : 'Add New Rule'}</h3>
              <div className="ph-form">
                <input
                  className="ph-input"
                  placeholder="Rule ID (optional)"
                  value={form.ruleId}
                  onChange={e => setForm({ ...form, ruleId: e.target.value })}
                />
                <input
                  className="ph-input"
                  placeholder="Name / Short Description"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                />
                <textarea
                  className="ph-input"
                  placeholder="Condition (IF … )"
                  value={form.condition}
                  onChange={e => setForm({ ...form, condition: e.target.value })}
                />
                <textarea
                  className="ph-input"
                  placeholder="Outcome (THEN … )"
                  value={form.outcome}
                  onChange={e => setForm({ ...form, outcome: e.target.value })}
                />
                <input
                  className="ph-input"
                  placeholder="Reference Source (optional)"
                  value={form.reference}
                  onChange={e => setForm({ ...form, reference: e.target.value })}
                />
                <select
                  className="ph-input"
                  value={form.proprietary}
                  onChange={e => setForm({ ...form, proprietary: e.target.value })}
                >
                  <option value="No">Proprietary: No</option>
                  <option value="Yes">Proprietary: Yes</option>
                </select>

                {/* Simple FK fields – can be extended with dropdowns if you load products/coverages */}
                <input
                  className="ph-input"
                  placeholder="Product ID (optional)"
                  value={form.productId}
                  onChange={e => setForm({ ...form, productId: e.target.value })}
                />
                <input
                  className="ph-input"
                  placeholder="Coverage ID (optional)"
                  value={form.coverageId}
                  onChange={e => setForm({ ...form, coverageId: e.target.value })}
                />

                <button className="ph-submit" onClick={handleSubmit}>
                  {editing ? 'Save Changes' : 'Add Rule'}
                </button>
                <button className="ph-cancel" onClick={() => { setShowModal(false); resetForm(); }}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}