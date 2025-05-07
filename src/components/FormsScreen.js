import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { db, storage } from '../firebase';
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { TrashIcon, DocumentIcon, PlusIcon } from '@heroicons/react/24/solid';
import { Link } from 'react-router-dom';
import styled from 'styled-components';

const Container = styled.div`
  min-height: 100vh;
  background-color: #f5f5f5;
  color: #1F2937;
  padding: 24px;
  font-family: 'Inter', sans-serif;
`;
const ContentWrapper = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
`;
const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
`;
const Title = styled.h1`
  font-size: 30px;
  font-weight: 400;
  background: linear-gradient(45deg,rgb(0, 116, 225),rgb(96, 65, 159));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
`;
const BackLink = styled(Link)`
  color: #4F46E5;
  text-decoration: none;
  font-size: 18px;
  &:hover { text-decoration: underline; }
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 12px;
  font-size: 16px;
  border: 1px solid #E5E7EB;
  border-radius: 8px;
  margin-bottom: 24px;
  &:focus {
    border-color: #4F46E5;
    box-shadow: 0 0 0 2px rgba(79,70,229,0.2);
  }
  &::placeholder { color: #9CA3AF; }
`;

const TableContainer = styled.div` overflow-x: auto; margin-bottom: 32px; `;
const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  overflow: hidden;
`;
const TableHead = styled.thead` background: #F9FAFB; `;
const TableRow = styled.tr`
  border-bottom: 1px solid #E5E7EB;
  &:hover { background: #F3F4F6; }
`;
const TableHeader = styled.th`
  padding: 12px;
  text-align: left;
  font-size: 14px;
  color: #6B7280;
`;
const TableCell = styled.td`
  padding: 12px;
  font-size: 14px;
  color: #1F2937;
`;
const DeleteButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: #DC2626;
  transition: color 0.2s;
  &:hover { color: #B91C1C; }
  svg { width: 20px; height: 20px; }
`;
const SelectButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: #10B981;
  transition: color 0.2s, transform 0.2s;
  position: relative;
  &:hover { 
    color: #059669; 
    transform: scale(1.2);
  }
  &:hover::after {
    content: 'Add to Coverage';
    position: absolute;
    top: -30px;
    left: 50%;
    transform: translateX(-50%);
    background: #333;
    color: #fff;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    white-space: nowrap;
    z-index: 10;
  }
  svg { 
    width: 24px; 
    height: 24px; 
  }
`;
const NoFormsText = styled.p`
  text-align: center;
  font-size: 18px;
  color: #9CA3AF;
`;

const AddFormButton = styled.button`
  padding: 8px 16px;
  background:linear-gradient(90deg, #A100FF, #4400FF);
  color: #fff;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 450;
  margin-bottom: 24px;
  &:hover { background: #3730A3; }
`;

/* — Modal Styles — */
const ModalOverlay = styled.div`
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.4);
  display: flex; justify-content: center; align-items: center;
  z-index: 1000;
`;
const ModalContent = styled.div`
  background: #fff;
  border-radius: 12px;
  padding: 32px;
  width: 90%;
  max-width: 600px;
  position: relative;
  box-shadow: 0 8px 24px rgba(0,0,0,0.1);
`;
const CloseButton = styled.button`
  position: absolute;
  top: 16px; right: 16px;
  background: none; border: none;
  font-size: 24px; cursor: pointer;
  color: #6B7280;
  &:hover { color: #374151; }
`;
const FieldRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 16px;
`;
const FormInput = styled.input`
  flex: 1;
  min-width: 140px;
  padding: 12px;
  border: 1px solid #E5E7EB;
  border-radius: 8px;
  &:focus {
    border-color: #4F46E5;
    box-shadow: 0 0 0 2px rgba(79,70,229,0.2);
  }
  &::placeholder { color: #9CA3AF; }
`;
const Select = styled.select`
  flex: 1;
  min-width: 140px;
  padding: 12px;
  border: 1px solid #E5E7EB;
  border-radius: 8px;
  &:focus {
    border-color: #4F46E5;
    box-shadow: 0 0 0 2px rgba(79,70,229,0.2);
  }
`;
const FileInput = styled.input` display: none; `;
const FileLabel = styled.label`
  flex: 1;
  min-width: 140px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  border: 1px dashed #D1D5DB;
  border-radius: 8px;
  cursor: pointer;
  color: #6B7280;
  &:hover { border-color: #4F46E5; color: #4F46E5; }
  svg { width: 20px; height: 20px; }
`;
const SubmitButton = styled.button`
  padding: 12px 24px;
  background: #4F46E5;
  color: #fff;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  &:hover { background: #3730A3; }
`;

export default function FormsScreen() {
  const location = useLocation();
  const navigate = useNavigate();
  const { coverageId, productId } = location.state || {};

  const [forms, setForms] = useState([]);
  const [products, setProducts] = useState([]);
  const [coverages, setCoverages] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal & form state
  const [showModal, setShowModal] = useState(false);
  const [formName, setFormName] = useState('');
  const [formNumber, setFormNumber] = useState('');
  const [effectiveDate, setEffectiveDate] = useState('');
  const [type, setType] = useState('ISO');
  const [category, setCategory] = useState('Base Coverage Form');
  const [selectedProduct, setSelectedProduct] = useState(productId || '');
  const [selectedCoverage, setSelectedCoverage] = useState('');
  const [file, setFile] = useState(null);

  useEffect(() => {
    async function fetchAll() {
      try {
        const [pSnap, cSnap, fSnap] = await Promise.all([
          getDocs(collection(db, 'products')),
          getDocs(collection(db, 'coverages')),
          getDocs(collection(db, 'forms'))
        ]);
        setProducts(pSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        setCoverages(cSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        const formList = await Promise.all(fSnap.docs.map(async d => {
          const data = d.data();
          let url = null;
          if (data.filePath) {
            try { url = await getDownloadURL(ref(storage, data.filePath)); } catch {}
          }
          return { ...data, id: d.id, downloadUrl: url };
        }));
        setForms(formList);
      } catch (err) {
        console.error(err);
        alert('Failed to load data.');
      }
    }
    fetchAll();
  }, []);

  const productMap = Object.fromEntries(products.map(p => [p.id, p.name]));
  const coverageMap = Object.fromEntries(coverages.map(c => [c.id, c.name]));

  const filteredForms = forms.filter(f =>
    (f.formName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.formNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddForm = async () => {
    if (!formNumber || !effectiveDate || !selectedProduct || !file) {
      alert('Please fill in Form Number, Effective Date, Product & upload a file.');
      return;
    }
    try {
      // Upload the file
      const storageRef = ref(storage, `forms/${file.name}`);
      await uploadBytes(storageRef, file);
      const downloadUrl = await getDownloadURL(storageRef);
      const payload = {
        formName: formName || null,
        formNumber,
        formEditionDate: effectiveDate,
        effectiveDate,
        type,
        category,
        productId: selectedProduct,
        coverageId: selectedCoverage || null,
        filePath: storageRef.fullPath,
        downloadUrl
      };
      const docRef = await addDoc(collection(db, 'forms'), payload);

      // If adding from CoverageScreen, update the coverage
      if (coverageId) {
        await updateDoc(doc(db, `products/${productId}/coverages`, coverageId), {
          formNumber: formNumber,
          formEditionDate: effectiveDate
        });
        navigate(`/coverage/${productId}`);
      } else {
        // Refresh forms list
        const snap = await getDocs(collection(db, 'forms'));
        const formList = await Promise.all(snap.docs.map(async d => {
          const data = d.data();
          let url = null;
          if (data.filePath) {
            try { url = await getDownloadURL(ref(storage, data.filePath)); } catch {}
          }
          return { ...data, id: d.id, downloadUrl: url };
        }));
        setForms(formList);
      }

      // Reset & close
      setFormName('');
      setFormNumber('');
      setEffectiveDate('');
      setType('ISO');
      setCategory('Base Coverage Form');
      setSelectedProduct(productId || '');
      setSelectedCoverage('');
      setFile(null);
      setShowModal(false);
    } catch (err) {
      console.error(err);
      alert('Failed to add form.');
    }
  };

  const handleSelectForm = async (form) => {
    if (!coverageId || !productId) return;
    try {
      await updateDoc(doc(db, `products/${productId}/coverages`, coverageId), {
        formNumber: form.formNumber,
        formEditionDate: form.effectiveDate
      });
      navigate(`/coverage/${productId}`);
    } catch (err) {
      console.error(err);
      alert('Failed to link form to coverage.');
    }
  };

  const handleDeleteForm = async id => {
    if (!window.confirm('Delete this form?')) return;
    try {
      await deleteDoc(doc(db, 'forms', id));
      setForms(forms.filter(f => f.id !== id));
    } catch (err) {
      console.error(err);
      alert('Failed to delete form.');
    }
  };

  return (
    <Container>
      <ContentWrapper>
        <Header>
          <Title>Forms</Title>
          <BackLink to={coverageId ? `/coverage/${productId}` : "/"}>Back</BackLink>
        </Header>

        <SearchInput
          placeholder="Search Forms"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />

        <AddFormButton onClick={() => setShowModal(true)}>
          + Add New Form
        </AddFormButton>

        {filteredForms.length > 0 ? (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>Name</TableHeader>
                  <TableHeader>Number</TableHeader>
                  <TableHeader>Effective</TableHeader>
                  <TableHeader>Type</TableHeader>
                  <TableHeader>Category</TableHeader>
                  <TableHeader>Product</TableHeader>
                  <TableHeader>Coverage</TableHeader>
                  {coverageId && <TableHeader>Action</TableHeader>}
                  <TableHeader>Delete</TableHeader>
                </TableRow>
              </TableHead>
              <tbody>
                {filteredForms.map(f => (
                  <TableRow key={f.id}>
                    <TableCell>
                      {f.downloadUrl ? (
                        <Link to={f.downloadUrl} target="_blank" rel="noopener noreferrer">
                          {f.formName || '—'}
                        </Link>
                      ) : f.formName || '—'}
                    </TableCell>
                    <TableCell>{f.formNumber}</TableCell>
                    <TableCell>{f.effectiveDate}</TableCell>
                    <TableCell>{f.type}</TableCell>
                    <TableCell>{f.category}</TableCell>
                    <TableCell>{productMap[f.productId]}</TableCell>
                    <TableCell>{coverageMap[f.coverageId] || '—'}</TableCell>
                    {coverageId && (
                      <TableCell>
                        <SelectButton onClick={() => handleSelectForm(f)} title="Add this form to coverage">
                          <PlusIcon />
                        </SelectButton>
                      </TableCell>
                    )}
                    <TableCell>
                      <DeleteButton onClick={() => handleDeleteForm(f.id)} title="Delete form">
                        <TrashIcon />
                      </DeleteButton>
                    </TableCell>
                  </TableRow>
                ))}
              </tbody>
            </Table>
          </TableContainer>
        ) : (
          <NoFormsText>No forms found</NoFormsText>
        )}
      </ContentWrapper>

      {showModal && (
        <ModalOverlay>
          <ModalContent>
            <CloseButton onClick={() => setShowModal(false)}>×</CloseButton>
            <h2 style={{ marginBottom: 24 }}>Add New Form</h2>
            <FieldRow>
              <Select
                value={selectedProduct}
                onChange={e => setSelectedProduct(e.target.value)}
                disabled={!!productId}
              >
                <option value="">Select Product*</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </Select>
              <Select
                value={selectedCoverage}
                onChange={e => setSelectedCoverage(e.target.value)}
              >
                <option value="">Link Coverage (optional)</option>
                {coverages.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </Select>
            </FieldRow>

            <FieldRow>
              <FormInput
                placeholder="Form Name (optional)"
                value={formName}
                onChange={e => setFormName(e.target.value)}
              />
              <FormInput
                placeholder="Form Number*"
                value={formNumber}
                onChange={e => setFormNumber(e.target.value)}
              />
            </FieldRow>

            <FieldRow>
              <FormInput
                placeholder="Effective Date (MM/YY)*"
                value={effectiveDate}
                onChange={e => setEffectiveDate(e.target.value)}
              />
              <Select value={type} onChange={e => setType(e.target.value)}>
                <option value="ISO">ISO</option>
                <option value="Proprietary">Proprietary</option>
                <option value="NAICS">NAICS</option>
                <option value="Other">Other</option>
              </Select>
              <Select value={category} onChange={e => setCategory(e.target.value)}>
                <option value="Base Coverage Form">Base Coverage Form</option>
                <option value="Endorsement">Endorsement</option>
                <option value="Exclusion">Exclusion</option>
                <option value="Dec/Quote Letter">Dec/Quote Letter</option>
                <option value="Notice">Notice</option>
                <option value="Other">Other</option>
              </Select>
            </FieldRow>

            <FieldRow>
              <FileInput
                id="file-upload"
                type="file"
                accept=".pdf"
                onChange={e => setFile(e.target.files[0])}
              />
              <FileLabel htmlFor="file-upload">
                <DocumentIcon />
                {file ? file.name : 'Upload PDF*'}
              </FileLabel>
            </FieldRow>

            <SubmitButton onClick={handleAddForm}>
              Save Form
            </SubmitButton>
          </ModalContent>
        </ModalOverlay>
      )}
    </Container>
  );
}