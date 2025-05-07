import React, { useState, useEffect } from 'react';
import { db, storage } from '../firebase';
import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  updateDoc
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Link } from 'react-router-dom';
import { TrashIcon, PencilIcon, XMarkIcon, DocumentIcon } from '@heroicons/react/24/solid';
import * as pdfjsLib from 'pdfjs-dist';
import './common.css';
import GlobalSearch from '../components/GlobalSearch';


// Set PDF.js worker source to local file
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

const SYSTEM_INSTRUCTIONS = `
You are an expert in P&C insurance. Your task is to analyze the provided insurance document text and extract key information into a structured JSON format.

First, determine the category of the document. It could be a Form, Endorsement, Exclusion, Policy, or Other. This will help contextualize the rest of the analysis.

Then, identify all coverages mentioned in the document. For each coverage, extract the following details:
- coverageName: The name or title of the coverage.
- perilsCovered: An array of perils or risks that are covered under this coverage.
- scopeOfCoverage: A description of what is covered, including any specific items or scenarios.
- limits: Any monetary or other limits applied to the coverage.
- conditions: An array of conditions that must be met for the coverage to apply.
- exclusions: An array of specific exclusions where the coverage does not apply.

Additionally, if there are general conditions or exclusions that apply to the entire document or policy, include them in the "generalConditions" and "generalExclusions" fields, respectively.

If any fields are not applicable or not found, use an empty array for lists or an empty string for text fields.

Important guidelines:
- Use your knowledge of insurance to interpret the text conceptually. Do not rely solely on exact wording, as phrasing can vary across insurers.
- Read the entire document, ignoring any irrelevant formatting or sections that do not pertain to coverages or general conditions/exclusions.
- Be thorough and ensure all coverages are captured, including any sub-coverages or endorsements.
- If a coverage name is not explicitly stated, infer it based on the context.
- Do not include any information not supported by the document.

Output only the JSON object with the specified structure. Do not add any extra commentary or explanations. Do not wrap the JSON in code fences or any other markup.

The JSON should have the following format:
{
  "category": "document_type",
  "coverages": [
    {
      "coverageName": "name",
      "perilsCovered": ["peril1", "peril2", ...],
      "scopeOfCoverage": "description",
      "limits": "limits_description",
      "conditions": ["condition1", "condition2", ...],
      "exclusions": ["exclusion1", "exclusion2", ...]
    },
    // additional coverages...
  ],
  "generalConditions": ["general_condition1", "general_condition2", ...],
  "generalExclusions": ["general_exclusion1", "general_exclusion2", ...]
}

Replace "document_type" with the appropriate category, fill in the coverages array, and include generalConditions and generalExclusions if applicable.
`;

export default function ProductHub() {
  // Products list + form state
  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [name, setName] = useState('');
  const [formNumber, setFormNumber] = useState('');
  const [formFile, setFormFile] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [addModalOpen, setAddModalOpen] = useState(false);

  // Summary modal state
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [summaryError, setSummaryError] = useState('');
  const [summaryModalOpen, setSummaryModalOpen] = useState(false);
  const [modalData, setModalData] = useState(null);

  // Load products once
  useEffect(() => {
    (async () => {
      try {
        const snap = await getDocs(collection(db, 'products'));
        setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch {
        alert('Failed to load products.');
      }
    })();
  }, []);

  // Helper to refresh list
  const refreshProducts = async () => {
    const snap = await getDocs(collection(db, 'products'));
    setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  // Add new product
  const handleAdd = async () => {
    if (!name || !formNumber || !formFile) {
      alert('Name, form number & file are required.');
      return;
    }
    try {
      const sref = ref(storage, `forms/${formFile.name}`);
      await uploadBytes(sref, formFile);
      const url = await getDownloadURL(sref);

      await addDoc(collection(db, 'products'), {
        name,
        formNumber,
        formDownloadUrl: url
      });
      await refreshProducts();
      setName(''); setFormNumber(''); setFormFile(null);
      setAddModalOpen(false);
    } catch {
      alert('Failed to add product.');
    }
  };

  // Update existing product
  const handleUpdate = async () => {
    if (!name || !formNumber) {
      alert('Name & form number are required.');
      return;
    }
    try {
      const refDoc = doc(db, 'products', editingId);
      let url = products.find(p => p.id === editingId).formDownloadUrl;
      if (formFile) {
        const sref = ref(storage, `forms/${formFile.name}`);
        await uploadBytes(sref, formFile);
        url = await getDownloadURL(sref);
      }
      await updateDoc(refDoc, { name, formNumber, formDownloadUrl: url });
      await refreshProducts();
      setEditingId(null); setName(''); setFormNumber(''); setFormFile(null);
      setAddModalOpen(false);
    } catch {
      alert('Failed to update product.');
    }
  };

  // Delete product
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    try {
      await deleteDoc(doc(db, 'products', id));
      setProducts(ps => ps.filter(p => p.id !== id));
    } catch {
      alert('Failed to delete.');
    }
  };

  // Generate AI summary & open modal
  const handleSummary = async (id, url) => {
    if (!url) {
      alert('No form uploaded.');
      return;
    }
    setLoadingSummary(true);
    setSummaryError('');
    setModalData(null);

    try {
      // Extract text from PDF using pdf.js
      const loadingTask = pdfjsLib.getDocument(url);
      const pdf = await loadingTask.promise;
      let text = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const strings = content.items.map(item => item.str);
        text += strings.join(' ') + '\n';
      }
      const snippet = text.split(/\s+/).slice(0, 100000).join(' ');
      console.log('Extracted Text:', snippet);

      // Call OpenAI chat completion
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ***REMOVED***`
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            { role: 'system', content: SYSTEM_INSTRUCTIONS.trim() },
            { role: 'user', content: snippet }
          ]
        })
      });
      if (!res.ok) throw new Error(await res.text());
      const { choices } = await res.json();
      console.log('AI Response:', choices[0].message.content);
      const summaryJson = JSON.parse(choices[0].message.content);

      setModalData(summaryJson);
      setSummaryModalOpen(true);
    } catch (err) {
      console.error(err);
      setSummaryError(err.message || 'Summary failed.');
    } finally {
      setLoadingSummary(false);
    }
  };

  // Filter products
  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="ph-container">
      
      <div className="ph-wrapper">
        <header className="ph-header">
          <h1 className="ph-title">Product Repository</h1>
          <button
            className="ph-submit"
            onClick={() => setAddModalOpen(true)}
          >
            <DocumentIcon className="w-5 h-5 inline-block mr-2" />
            Add Product
          </button>
        </header>

        <GlobalSearch />

        <h2 className="ph-subtitle">Products</h2>

        {filtered.length ? (
          <div className="ph-table-wrap">
            <table className="ph-table">
              <thead className="ph-thead">
                <tr className="ph-tr">
                  <th className="ph-th">Name</th>
                  <th className="ph-th">Form #</th>
                  <th className="ph-th">Navigation</th>
                  <th className="ph-th">AI Summary</th>
                  <th className="ph-th">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => (
                  <tr className="ph-tr" key={p.id}>
                    <td className="ph-td">{p.name}</td>
                    <td className="ph-td">
                      {p.formNumber && p.formDownloadUrl ? (
                        <Link to={p.formDownloadUrl} target="_blank" className="ph-form-link">
                          {p.formNumber}
                        </Link>
                      ) : p.formNumber || '-'}
                    </td>
                    <td className="ph-td">
                      <div className="ph-nav-links">
                        <Link to={`/coverage/${p.id}`}>Coverages</Link>
                        <span className="ph-sep">|</span>
                        <Link to={`/pricing/${p.id}`}>Pricing</Link>
                        <span className="ph-sep">|</span>
                        <Link to="/forms">Forms</Link>
                        <span className="ph-sep">|</span>
                        <Link to={`/rules/`}>Rules</Link>
                        <span className="ph-sep">|</span>
                        <Link to={`/states/${p.id}`}>States</Link>
                      </div>
                    </td>
                    <td className="ph-td">
                      <button
                        className="ph-summary-btn"
                        onClick={() => handleSummary(p.id, p.formDownloadUrl)}
                        disabled={loadingSummary}
                      >
                        {loadingSummary ? (
                          <>
                            <span className="ph-loading">
                              <span className="ph-loading-core" />
                            </span>
                            Generating
                          </>
                        ) : (
                          'Generate'
                        )}
                      </button>
                      {summaryError && (
                        <div className="ph-error">{summaryError}</div>
                      )}
                    </td>
                    <td className="ph-td">
                      <button
                        className="ph-action-btn"
                        onClick={() => {
                          setEditingId(p.id);
                          setName(p.name);
                          setFormNumber(p.formNumber);
                          setAddModalOpen(true);
                        }}
                      >
                        <PencilIcon />
                      </button>
                      <button
                        className="ph-action-btn ph-danger"
                        onClick={() => handleDelete(p.id)}
                      >
                        <TrashIcon />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="ph-no-products">No products found.</div>
        )}

        {/* Add/Edit Product Modal */}
        <div
          className="ph-modal-overlay"
          style={{ display: addModalOpen ? 'flex' : 'none' }}
          onClick={() => setAddModalOpen(false)}
        >
          <div
            className="ph-modal-content"
            onClick={e => e.stopPropagation()}
          >
            <button
              className="ph-close-btn"
              onClick={() => {
                setAddModalOpen(false);
                setEditingId(null);
                setName('');
                setFormNumber('');
                setFormFile(null);
              }}
            >
              <XMarkIcon />
            </button>
            <h3>{editingId ? 'Edit Product' : 'Add New Product'}</h3>
            <div className="ph-form">
              <input
                type="text"
                className="ph-input"
                placeholder="Product Name"
                value={name}
                onChange={e => setName(e.target.value)}
              />
              <input
                type="text"
                className="ph-input"
                placeholder="Form Number"
                value={formNumber}
                onChange={e => setFormNumber(e.target.value)}
              />
              <input
                type="file"
                className="ph-input"
                onChange={e => setFormFile(e.target.files[0])}
              />
              <button
                className="ph-submit"
                onClick={editingId ? handleUpdate : handleAdd}
              >
                {editingId ? 'Update' : 'Add Product'}
              </button>
              <button
                className="ph-cancel"
                onClick={() => {
                  setAddModalOpen(false);
                  setEditingId(null);
                  setName('');
                  setFormNumber('');
                  setFormFile(null);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>

        {/* Summary Modal */}
        <div
          className="ph-modal-overlay"
          style={{ display: summaryModalOpen ? 'flex' : 'none' }}
          onClick={() => setSummaryModalOpen(false)}
        >
          <div
            className="ph-modal-content"
            onClick={e => e.stopPropagation()}
          >
            <button
              className="ph-close-btn"
              onClick={() => setSummaryModalOpen(false)}
            >
              <XMarkIcon />
            </button>

            {modalData ? (
              <>
                <h3>Category: {modalData.category}</h3>
                {modalData.coverages?.length > 0 && (
                  <>
                    <h4>Coverages</h4>
                    {modalData.coverages.map((c, i) => (
                      <div key={i} className="ph-coverage-block">
                        <strong>{c.coverageName}</strong>: {c.scopeOfCoverage}
                        <br />
                        <em>Limits:</em> {c.limits || '-'}
                        <br />
                        <em>Conditions:</em> {c.conditions?.join(', ') || '-'}
                        <br />
                        <em>Exclusions:</em> {c.exclusions?.join(', ') || '-'}
                      </div>
                    ))}
                  </>
                )}
                {modalData.generalConditions?.length > 0 && (
                  <>
                    <h4>General Conditions</h4>
                    <ul>
                      {modalData.generalConditions.map((cond, idx) => (
                        <li key={idx}>{cond}</li>
                      ))}
                    </ul>
                  </>
                )}
                {modalData.generalExclusions?.length > 0 && (
                  <>
                    <h4>General Exclusions</h4>
                    <ul>
                      {modalData.generalExclusions.map((excl, idx) => (
                        <li key={idx}>{excl}</li>
                      ))}
                    </ul>
                  </>
                )}
              </>
            ) : (
              <p>Loading summary…</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}