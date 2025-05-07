// CoverageScreen.js – v3.3  (Add Coverage modal deferred open)

import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { db, storage } from '../firebase';
import {
  collection, getDocs, addDoc, deleteDoc, doc,
  getDoc, updateDoc
} from 'firebase/firestore';
import { ref, getDownloadURL } from 'firebase/storage';
import {
  TrashIcon, PencilIcon, XMarkIcon, PlusIcon
} from '@heroicons/react/24/solid';
import styled from 'styled-components';

/* ───────────────────────── styled components ───────────────────────── */
const CoverageContainer = styled.div`
  min-height:100vh;
  background:#f5f5f5;
  color:#1F2937;
  padding:24px;
  font-family:'Inter',sans-serif;
`;
const ContentWrapper = styled.div`max-width:1200px; margin:0 auto;`;
const Header = styled.div`display:flex; justify-content:space-between; align-items:center; margin-bottom:32px;`;
const PageTitle = styled.h1`
  font-size:30px;
  font-weight:400;
  background:linear-gradient(45deg, rgb(0,116,225), rgb(96,65,159));
  -webkit-background-clip:text;
  background-clip:text;
  color:transparent;
`;
const BackLink = styled(Link)`
  color:#1D4ED8;
  font-size:18px;
  text-decoration:none;
  &:hover{ text-decoration:underline; }
`;
const SearchInput = styled.input`
  width:100%;
  padding:12px;
  font-size:16px;
  background:#fff;
  border:1px solid #E5E7EB;
  border-radius:8px;
  margin-bottom:24px;
  outline:none;
  &::placeholder{ color:#6B7280; }
  &:focus{ border-color:#1D4ED8; box-shadow:0 0 0 2px rgba(29,78,216,.1); }
`;
const ActionButton = styled.button`
  padding:8px 16px;
  background:linear-gradient(90deg,#A100FF,#4400FF);
  color:#fff;
  border:none;
  border-radius:8px;
  cursor:pointer;
  font-weight:450;
  margin-bottom:24px;
  display:inline-flex;
  align-items:center;
  &:hover{ background:#3730A3; }
`;
const TableContainer = styled.div`overflow-x:auto;`;
const Table = styled.table`
  width:100%;
  background:#fff;
  border-radius:8px;
  border-collapse:collapse;
  box-shadow:0 2px 8px rgba(0,0,0,.05);
`;
const TableHead = styled.thead`background:#F9FAFB;`;
const TableRow = styled.tr`border-bottom:1px solid #E5E7EB; &:hover{ background:#F9FAFB; }`;
const TableHeader = styled.th`padding:12px; text-align:left; font-size:14px; font-weight:500; color:#6B7280;`;
const TableCell = styled.td`padding:12px; font-size:14px; color:#1F2937;`;
const IconButton = styled.button`
  background:none;
  border:none;
  cursor:pointer;
  color:${p=>p.danger?'#DC2626':'#1D4ED8'};
  &:hover{ color:${p=>p.danger?'#B91C1C':'#1E40AF'}; }
  svg{ width:20px; height:20px; }
`;
const ActionsContainer = styled.div`display:flex; gap:10px;`;
const NoCoveragesText = styled.p`text-align:center; font-size:18px; color:#6B7280;`;

/* Modal scaffolding */
const Backdrop = styled.div`
  position:fixed;
  top:0; left:0;
  width:100%; height:100%;
  background:rgba(0,0,0,.5);
  display:flex;
  justify-content:center;
  align-items:center;
  z-index:1000;
`;
const ModalBox = styled.div`
  background:#fff;
  border-radius:8px;
  padding:24px;
  width:600px;
  max-height:80vh;
  overflow-y:auto;
  position:relative;
`;
const CloseButton = styled.button`
  position:absolute;
  top:12px;
  right:12px;
  background:none;
  border:none;
  cursor:pointer;
  svg{ width:24px; height:24px; color:#6B7280; }
`;
const FormGroup = styled.div`margin-bottom:16px; label{ display:block; margin-bottom:8px; font-weight:500; color:#1F2937; }`;
const FormInput = styled.input`
  width:100%;
  padding:12px;
  font-size:16px;
  background:#fff;
  border:1px solid #E5E7EB;
  border-radius:8px;
  outline:none;
  &:focus{ border-color:#1D4ED8; box-shadow:0 0 0 2px rgba(29,78,216,.1); }
`;
const FormSelect = styled.select`
  width:100%;
  padding:12px;
  font-size:16px;
  background:#fff;
  border:1px solid #E5E7EB;
  border-radius:8px;
  outline:none;
  &:focus{ border-color:#1D4ED8; box-shadow:0 0 0 2px rgba(29,78,216,.1); }
`;
const SubmitButton = styled.button`
  padding:8px 16px;
  background:linear-gradient(90deg,#A100FF,#4400FF);
  color:#fff;
  border:none;
  border-radius:8px;
  cursor:pointer;
  font-weight:450;
  margin-bottom:24px;
  &:hover{ background:#3730A3; }
`;
const SmallBtn = styled.button`
  padding:4px 8px;
  font-size:12px;
  border-radius:6px;
  background:#E0E7FF;
  border:none;
  cursor:pointer;
  color:#1E40AF;
  margin-left:6px;
  &:hover{ background:#C7D2FE; }
`;

/* ───────────────────────── Limits / Deductibles Modal ───────────────────────── */
function LimitModal({ rows = [], onSave, onClose }) {
  const [data, setData] = useState(rows.length ? rows : [{ value: '' }]);

  const fmt = v => {
    const digits = v.replace(/[^0-9]/g, '');
    return digits ? '$' + parseInt(digits, 10).toLocaleString() : '';
  };

  const update = (i, val) => {
    const clone = [...data];
    clone[i].value = val;
    setData(clone);
  };
  const delRow = idx => setData(data.filter((_, i) => i !== idx));
  const addRow = () => setData([...data, { value: '' }]);

  return (
    <Backdrop onClick={onClose}>
      <ModalBox onClick={e => e.stopPropagation()} style={{ width: '420px' }}>
        <CloseButton onClick={onClose}><XMarkIcon /></CloseButton>

        <label style={{ fontWeight: 500, display: 'block', marginBottom: 8 }}>Limit Values</label>
        {data.map((row, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
            <FormInput
              value={row.value}
              placeholder="$100,000"
              onChange={e => update(i, fmt(e.target.value))}
            />
            <IconButton danger style={{ marginLeft: 8 }} onClick={() => delRow(i)}>
              <TrashIcon />
            </IconButton>
          </div>
        ))}

        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <IconButton
            onClick={e => { e.stopPropagation(); addRow(); }}
            style={{ background: 'linear-gradient(90deg,#A100FF,#4400FF)', borderRadius: 8, padding: 6 }}
          >
            <PlusIcon className="w-5 h-5" style={{ color: '#fff' }} />
          </IconButton>
          <ActionButton onClick={() => { onSave(data); onClose(); }}>
            Save
          </ActionButton>
        </div>
      </ModalBox>
    </Backdrop>
  );
}

/* ───────────────────────── Coverage modal (add/edit) ───────────────────────── */
function CoverageModal({ onClose, onSubmit, coverage, isEditing, forms, productId, navigate }) {
  const [name, setName] = useState(coverage?.name || '');
  const [desc, setDesc] = useState(coverage?.description || '');
  const [formNumber, setFN] = useState(coverage?.formNumber || '');
  const [edition, setEdition] = useState(coverage?.formEditionDate || '');

  const handle = async () => {
    if (!name || !formNumber) {
      alert('Name and Form # required');
      return;
    }
    try {
      const data = {
        name,
        description: desc,
        formNumber: formNumber.trim(),
        formEditionDate: edition.trim()
      };
      await onSubmit(data);
      onClose();
    } catch (error) {
      console.error('Error submitting coverage:', error);
      alert('Failed to submit coverage. Please try again.');
    }
  };

  return (
    <Backdrop onClick={onClose}>
      <ModalBox onClick={e => e.stopPropagation()}>
        <CloseButton onClick={onClose}><XMarkIcon /></CloseButton>

        <h3 style={{ marginBottom: 24 }}>
          {isEditing ? 'Edit Coverage' : 'Add Coverage'}
        </h3>

        <FormGroup>
          <label>Name</label>
          <FormInput value={name} onChange={e => setName(e.target.value)} />
        </FormGroup>
        <FormGroup>
          <label>Description</label>
          <FormInput value={desc} onChange={e => setDesc(e.target.value)} />
        </FormGroup>
        <FormGroup>
          <label>Select Existing Form</label>
          <FormSelect
            value={forms.find(f => f.formNumber === formNumber && f.formEditionDate === edition)?.id || ''}
            onChange={e => {
              const formId = e.target.value;
              if (formId) {
                const form = forms.find(f => f.id === formId);
                if (form) {
                  setFN(form.formNumber);
                  setEdition(form.formEditionDate || '');
                }
              } else {
                setFN('');
                setEdition('');
              }
            }}
          >
            <option value="">-- Select Form --</option>
            {forms.map(f => (
              <option key={f.id} value={f.id}>
                {f.formNumber} {f.formEditionDate ? `(${f.formEditionDate})` : ''}
              </option>
            ))}
          </FormSelect>
        </FormGroup>
        <FormGroup>
          <label>Form Number</label>
          <FormInput value={formNumber} onChange={e => setFN(e.target.value)} />
        </FormGroup>
        <FormGroup>
          <label>Form Edition Date (MMYY, opt)</label>
          <FormInput value={edition} onChange={e => setEdition(e.target.value)} />
        </FormGroup>

        <SubmitButton onClick={handle}>
          {isEditing ? 'Update' : 'Add'} Coverage
        </SubmitButton>
      </ModalBox>
    </Backdrop>
  );
}

/* ───────────────────────── main component ───────────────────────── */
export default function CoverageScreen() {
  const { productId } = useParams();
  const navigate = useNavigate();

  const [productName, setProductName] = useState('');
  const [coverages, setCoverages] = useState([]);
  const [forms, setForms] = useState([]);
  const [search, setSearch] = useState('');
  const [covModal, setCovModal] = useState(null); // { editing, coverage? }
  const [ldModal, setLdModal] = useState(null);  // { covId, field, rows }

  /* initial load */
  useEffect(() => { (async () => {
    const prodDoc = await getDoc(doc(db, 'products', productId));
    setProductName(prodDoc.data().name);

    const covSnap = await getDocs(collection(db, `products/${productId}/coverages`));
    setCoverages(covSnap.docs.map(d => ({ id: d.id, ...d.data() })));

    const formSnap = await getDocs(collection(db, 'forms'));
    const flist = await Promise.all(formSnap.docs.map(async d => {
      const data = d.data(); let url = null;
      if (data.filePath) {
        try { url = await getDownloadURL(ref(storage, data.filePath)); } catch {};
      }
      return { ...data, id: d.id, downloadUrl: url };
    }));
    setForms(flist);
  })(); }, [productId]);

  /* helpers */
  const matchForm = cov => forms.find(f => f.formNumber === cov.formNumber && (
    !cov.formEditionDate || f.formEditionDate === cov.formEditionDate
  ));

  const refreshCoverages = async () => {
    const snap = await getDocs(collection(db, `products/${productId}/coverages`));
    setCoverages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  /* CRUD */
  const addCov = async data => { 
    const docRef = await addDoc(collection(db, `products/${productId}/coverages`), data);
    await refreshCoverages();
    return docRef.id; // Return the new coverage ID
  };
  
  const updCov = async (id, data) => { 
    await updateDoc(doc(db, `products/${productId}/coverages`, id), data); 
    await refreshCoverages(); 
  };
  
  const delCov = async id => {
    if (window.confirm('Delete?')) {
      await deleteDoc(doc(db, `products/${productId}/coverages`, id));
      setCoverages(c => c.filter(x => x.id !== id));
    }
  };

  /* limits / deductibles save */
  const saveRows = async (covId, field, rows) => {
    await updateDoc(doc(db, `products/${productId}/coverages`, covId), { [field]: rows });
    setCoverages(c => c.map(x => x.id === covId ? { ...x, [field]: rows } : x));
  };

  const filtered = coverages.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <CoverageContainer>
      <ContentWrapper>
        <Header>
          <PageTitle>Coverages for {productName}</PageTitle>
          <BackLink to="/">Back</BackLink>
        </Header>

        <SearchInput
          placeholder="Search…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />

        <ActionButton onClick={e => { e.stopPropagation(); setTimeout(() => setCovModal({ editing: false }), 0); }}>
          <PlusIcon className="w-4 h-4 mr-1" />Add Coverage
        </ActionButton>

        {filtered.length ? (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>Name</TableHeader>
                  <TableHeader>Form</TableHeader>
                  <TableHeader>Limits</TableHeader>
                  <TableHeader>Deductibles</TableHeader>
                  <TableHeader>IT Code</TableHeader>
                  <TableHeader>Stat Code</TableHeader>
                  <TableHeader>Actions</TableHeader>
                </TableRow>
              </TableHead>
              <tbody>
                {filtered.map(cov => {
                  const form = matchForm(cov);
                  return (
                    <TableRow key={cov.id}>
                      <TableCell>{cov.name}</TableCell>

                      <TableCell>
                        {form ? (
                          form.downloadUrl ? (
                            <Link to={form.downloadUrl} target="_blank" rel="noopener noreferrer">
                              {form.formName || cov.formNumber} {form.formEditionDate ? `(${form.formEditionDate})` : ''}
                            </Link>
                          ) : (
                            <span style={{ color: '#4B5563' }}>
                              {form.formName || cov.formNumber} {form.formEditionDate ? `(${form.formEditionDate})` : ''}
                            </span>
                          )
                        ) : (
                          <Link 
                            to="/forms" 
                            state={{ coverageId: cov.id, productId }}
                            style={{ color: '#1D4ED8' }}
                          >
                            Add Form
                          </Link>
                        )}
                      </TableCell>

                      <TableCell>
                        <SmallBtn onClick={e => { e.stopPropagation(); setLdModal({ covId:cov.id, field:'limits', rows:cov.limits||[] }); }}>
                          Edit
                        </SmallBtn>
                      </TableCell>

                      <TableCell>
                        <SmallBtn onClick={e => { e.stopPropagation(); setLdModal({ covId:cov.id, field:'deductibles', rows:cov.deductibles||[] }); }}>
                          Edit
                        </SmallBtn>
                      </TableCell>

                      <TableCell>{cov.itCode || '—'}</TableCell>
                      <TableCell>{cov.statCode || '—'}</TableCell>

                      <TableCell>
                        <ActionsContainer>
                          <IconButton onClick={e => { e.stopPropagation(); setCovModal({ editing:true, coverage:cov }); }}>
                            <PencilIcon />
                          </IconButton>
                          <IconButton danger onClick={() => delCov(cov.id)}>
                            <TrashIcon />
                          </IconButton>
                        </ActionsContainer>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </tbody>
            </Table>
          </TableContainer>
        ) : (
          <NoCoveragesText>No Coverages Found</NoCoveragesText>
        )}
      </ContentWrapper>

      {/* Add / edit coverage modal */}
      {covModal && (
        <CoverageModal
          forms={forms}
          onClose={() => setCovModal(null)}
          onSubmit={covModal.editing
            ? data => updCov(covModal.coverage.id, data)
            : addCov}
          coverage={covModal.coverage}
          isEditing={covModal.editing}
          productId={productId}
          navigate={navigate}
        />
      )}

      {/* Limits / deductibles modal */}
      {ldModal && (
        <LimitModal
          rows={ldModal.rows}
          onSave={rows => saveRows(ldModal.covId, ldModal.field, rows)}
          onClose={() => setLdModal(null)}
        />
      )}
    </CoverageContainer>
  );
}