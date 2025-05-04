import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { TrashIcon } from '@heroicons/react/24/solid';
import { useParams, Link } from 'react-router-dom';
import styled from 'styled-components';

const Container = styled.div`
  min-height: 100vh;
  background-color: #ffffff;
  color: #1F2937;
  padding: 24px;
  font-family: 'Inter', sans-serif;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
`;

const Title = styled.h1`
  font-size: 30px;
  font-weight: 700;
  color: #1F2937;
`;

const BackLink = styled(Link)`
  color: #1D4ED8;
  text-decoration: none;
  font-size: 18px;
  &:hover {
    text-decoration: underline;
  }
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 12px;
  font-size: 16px;
  font-family: 'Inter', sans-serif;
  color: #1F2937;
  background: #ffffff;
  border: 1px solid #E5E7EB;
  border-radius: 8px;
  outline: none;
  margin-bottom: 24px;
  &:focus {
    border-color: #1D4ED8;
    box-shadow: 0 0 0 2px rgba(29, 78, 216, 0.1);
  }
  &::placeholder {
    color: #6B7280;
  }
`;

const Subtitle = styled.h2`
  font-size: 24px;
  font-weight: 600;
  color: #1F2937;
  margin-bottom: 16px;
`;

const TableContainer = styled.div`
  overflow-x: auto;
`;

const Table = styled.table`
  width: 100%;
  background: #ffffff;
  border-radius: 8px;
  border-collapse: collapse;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
`;

const TableHead = styled.thead`
  background: #F9FAFB;
`;

const TableRow = styled.tr`
  border-bottom: 1px solid #E5E7EB;
  &:hover {
    background: #F9FAFB;
  }
`;

const TableHeader = styled.th`
  padding: 12px;
  text-align: left;
  font-size: 14px;
  font-weight: 500;
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
  color: #DC2626;
  cursor: pointer;
  transition: color 0.2s ease;
  &:hover {
    color: #B91C1C;
  }
  svg {
    width: 20px;
    height: 20px;
  }
`;

const DisabledButton = styled.button`
  background: #E5E7EB;
  color: #6B7280;
  padding: 5px 10px;
  border-radius: 8px;
  border: none;
  cursor: not-allowed;
`;

const NoFormsText = styled.p`
  text-align: center;
  font-size: 18px;
  color: #6B7280;
`;

const FormContainer = styled.div`
  margin-top: 32px;
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
`;

const FormInput = styled.input`
  flex: 1;
  min-width: 200px;
  padding: 12px;
  font-size: 16px;
  font-family: 'Inter', sans-serif;
  color: #1F2937;
  background: #ffffff;
  border: 1px solid #E5E7EB;
  border-radius: 8px;
  outline: none;
  &:focus {
    border-color: #1D4ED8;
    box-shadow: 0 0 0 2px rgba(29, 78, 216, 0.1);
  }
  &::placeholder {
    color: #6B7280;
  }
`;

const Select = styled.select`
  flex: 1;
  min-width: 200px;
  padding: 12px;
  font-size: 16px;
  font-family: 'Inter', sans-serif;
  color: #1F2937;
  background: #ffffff;
  border: 1px solid #E5E7EB;
  border-radius: 8px;
  outline: none;
  &:focus {
    border-color: #1D4ED8;
    box-shadow: 0 0 0 2px rgba(29, 78, 216, 0.1);
  }
`;

const SubmitButton = styled.button`
  padding: 12px 24px;
  background: #1D4ED8;
  color: #ffffff;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-family: 'Inter', sans-serif;
  font-weight: 600;
  font-size: 14px;
  transition: background-color 0.2s ease;
  &:hover {
    background: #1E40AF;
  }
`;

function FormsScreen() {
  const [forms, setForms] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [formName, setFormName] = useState('');
  const [formNumber, setFormNumber] = useState('');
  const [effectiveDate, setEffectiveDate] = useState('');
  const [type, setType] = useState('Proprietary');
  const [category, setCategory] = useState('Base Coverage Form');

  useEffect(() => {
    const fetchForms = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'forms'));
        const formList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setForms(formList);
      } catch (error) {
        console.error("Error fetching forms:", error);
        alert("Failed to load forms. Please try again.");
      }
    };
    fetchForms();
  }, []);

  const filteredForms = forms.filter(form =>
    form.formName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    form.formNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddForm = async () => {
    if (!formName || !formNumber || !effectiveDate) {
      alert('Please fill in all required fields');
      return;
    }
    try {
      await addDoc(collection(db, 'forms'), {
        formName,
        formNumber,
        effectiveDate,
        type,
        category
      });
      setFormName('');
      setFormNumber('');
      setEffectiveDate('');
      setType('Proprietary');
      setCategory('Base Coverage Form');
      const querySnapshot = await getDocs(collection(db, 'forms'));
      const formList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setForms(formList);
    } catch (error) {
      console.error("Error adding form:", error);
      alert("Failed to add form. Please try again.");
    }
  };

  const handleDeleteForm = async (formId) => {
    if (window.confirm("Are you sure you want to delete this form?")) {
      try {
        await deleteDoc(doc(db, 'forms', formId));
        setForms(forms.filter(form => form.id !== formId));
      } catch (error) {
        console.error("Error deleting form:", error);
        alert("Failed to delete form. Please try again.");
      }
    }
  };

  return (
    <Container>
      <Header>
        <Title>Forms</Title>
        <BackLink to="/">Back</BackLink>
      </Header>
      <SearchInput
        type="text"
        placeholder="Search Forms"
        value={searchQuery}
        onChange={e => setSearchQuery(e.target.value)}
      />
      <Subtitle>Forms</Subtitle>
      {filteredForms.length > 0 ? (
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>Form Name</TableHeader>
                <TableHeader>Form Number</TableHeader>
                <TableHeader>Effective Date</TableHeader>
                <TableHeader>Type</TableHeader>
                <TableHeader>Category</TableHeader>
                <TableHeader>Applicability</TableHeader>
                <TableHeader>Delete</TableHeader>
              </TableRow>
            </TableHead>
            <tbody>
              {filteredForms.map(form => (
                <TableRow key={form.id}>
                  <TableCell>{form.formName}</TableCell>
                  <TableCell>{form.formNumber}</TableCell>
                  <TableCell>{form.effectiveDate}</TableCell>
                  <TableCell>{form.type}</TableCell>
                  <TableCell>{form.category}</TableCell>
                  <TableCell>
                    <DisabledButton disabled>Applicability</DisabledButton>
                  </TableCell>
                  <TableCell>
                    <DeleteButton onClick={() => handleDeleteForm(form.id)} title="Delete form">
                      <TrashIcon />
                    </DeleteButton>
                  </TableCell>
                </TableRow>
              ))}
            </tbody>
          </Table>
        </TableContainer>
      ) : (
        <NoFormsText>No Forms Found</NoFormsText>
      )}
      <FormContainer>
        <FormInput
          type="text"
          placeholder="Form Name"
          value={formName}
          onChange={e => setFormName(e.target.value)}
        />
        <FormInput
          type="text"
          placeholder="Form Number"
          value={formNumber}
          onChange={e => setFormNumber(e.target.value)}
        />
        <FormInput
          type="text"
          placeholder="Effective Date (MM/YY)"
          value={effectiveDate}
          onChange={e => setEffectiveDate(e.target.value)}
        />
        <Select
          value={type}
          onChange={e => setType(e.target.value)}
        >
          <option value="Proprietary">Proprietary</option>
          <option value="ISO">ISO</option>
          <option value="NAICS">NAICS</option>
          <option value="Other">Other</option>
        </Select>
        <Select
          value={category}
          onChange={e => setCategory(e.target.value)}
        >
          <option value="Base Coverage Form">Base Coverage Form</option>
          <option value="Endorsement">Endorsement</option>
          <option value="Exclusion">Exclusion</option>
          <option value="Dec/Quote Letter">Dec/Quote Letter</option>
          <option value="Notice">Notice</option>
          <option value="Other">Other</option>
        </Select>
        <SubmitButton onClick={handleAddForm}>Add Form</SubmitButton>
      </FormContainer>
    </Container>
  );
}

export default FormsScreen;