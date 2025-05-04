import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db } from '../firebase';
import { collection, getDocs, addDoc, deleteDoc, doc, getDoc, updateDoc } from 'firebase/firestore';
import { TrashIcon, PencilIcon } from '@heroicons/react/24/solid';
import styled from 'styled-components';

const CoverageContainer = styled.div`
  max-width: 900px;
  margin: 0 auto;
  padding: 24px;
  font-family: 'Inter', sans-serif;
  background-color: #ffffff;
  color: #1F2937;
  min-height: 100vh;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const PageTitle = styled.h1`
  font-size: 24px;
  font-weight: 700;
  color: #1F2937;
`;

const BackLink = styled(Link)`
  color: #1D4ED8;
  text-decoration: none;
  font-size: 16px;
  &:hover {
    text-decoration: underline;
  }
`;

const SearchInput = styled.input`
  padding: 12px;
  font-size: 16px;
  font-family: 'Inter', sans-serif;
  color: #1F2937;
  background: #ffffff;
  border: 1px solid #E5E7EB;
  border-radius: 8px;
  outline: none;
  width: 100%;
  box-sizing: border-box;
  margin-bottom: 20px;
  &:focus {
    border-color: #1D4ED8;
    box-shadow: 0 0 0 2px rgba(29, 78, 216, 0.1);
  }
  &::placeholder {
    color: #6B7280;
  }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  background: #ffffff;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
`;

const Thead = styled.thead`
  background: #F9FAFB;
`;

const Th = styled.th`
  padding: 12px;
  text-align: left;
  font-weight: 500;
  color: #6B7280;
  border-bottom: 1px solid #E5E7EB;
`;

const Td = styled.td`
  padding: 12px;
  border-bottom: 1px solid #E5E7EB;
  color: #1F2937;
`;

const Input = styled.input`
  padding: 12px;
  font-size: 16px;
  font-family: 'Inter', sans-serif;
  color: #1F2937;
  background: #ffffff;
  border: 1px solid #E5E7EB;
  border-radius: 8px;
  outline: none;
  width: 100%;
  box-sizing: border-box;
  margin-bottom: 10px;
  &:focus {
    border-color: #1D4ED8;
    box-shadow: 0 0 0 2px rgba(29, 78, 216, 0.1);
  }
  &::placeholder {
    color: #6B7280;
  }
`;

const Select = styled.select`
  padding: 12px;
  font-size: 16px;
  font-family: 'Inter', sans-serif;
  color: #1F2937;
  background: #ffffff;
  border: 1px solid #E5E7EB;
  border-radius: 8px;
  outline: none;
  width: 100%;
  box-sizing: border-box;
  margin-bottom: 10px;
  &:focus {
    border-color: #1D4ED8;
    box-shadow: 0 0 0 2px rgba(29, 78, 216, 0.1);
  }
`;

const ActionButton = styled.button`
  padding: 10px 20px;
  background: #1D4ED8;
  color: #ffffff;
  border: none;
  border-radius: 8px;
  font-family: 'Inter', sans-serif;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s ease;
  &:hover {
    background: #1E40AF;
  }
`;

const IconButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: ${props => (props.danger ? '#DC2626' : '#1D4ED8')};
  transition: color 0.2s ease;
  &:hover {
    color: ${props => (props.danger ? '#B91C1C' : '#1E40AF')};
  }
  svg {
    width: 20px;
    height: 20px;
  }
`;

const ActionsContainer = styled.div`
  display: flex;
  gap: 10px;
`;

const NoCoveragesText = styled.p`
  text-align: center;
  font-size: 16px;
  color: #6B7280;
`;

const FormContainer = styled.div`
  margin-top: 30px;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

function CoverageScreen() {
  const { productId } = useParams();
  const [coverages, setCoverages] = useState([]);
  const [productName, setProductName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('Base coverage');
  const [formNumber, setFormNumber] = useState('');
  const [itCode, setItCode] = useState('');
  const [statCode, setStatCode] = useState('');
  const [editingCoverageId, setEditingCoverageId] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const productDoc = await getDoc(doc(db, 'products', productId));
        setProductName(productDoc.data().name);

        const querySnapshot = await getDocs(collection(db, `products/${productId}/coverages`));
        const coverageList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setCoverages(coverageList);
      } catch (error) {
        console.error("Error fetching coverages:", error);
        alert("Failed to load coverages. Please try again.");
      }
    };
    fetchData();
  }, [productId]);

  const filteredCoverages = coverages.filter(coverage =>
    coverage.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    coverage.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddCoverage = async () => {
    if (!name || !description || !formNumber) {
      alert('Please fill in all required fields');
      return;
    }
    try {
      await addDoc(collection(db, `products/${productId}/coverages`), {
        name,
        description,
        type,
        formNumber,
        itCode,
        statCode
      });
      setName('');
      setDescription('');
      setType('Base coverage');
      setFormNumber('');
      setItCode('');
      setStatCode('');
      const querySnapshot = await getDocs(collection(db, `products/${productId}/coverages`));
      const coverageList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCoverages(coverageList);
    } catch (error) {
      console.error("Error adding coverage:", error);
      alert("Failed to add coverage. Please try again.");
    }
  };

  const handleDeleteCoverage = async (coverageId) => {
    if (window.confirm("Are you sure you want to delete this coverage?")) {
      try {
        await deleteDoc(doc(db, `products/${productId}/coverages`, coverageId));
        setCoverages(coverages.filter(coverage => coverage.id !== coverageId));
      } catch (error) {
        console.error("Error deleting coverage:", error);
        alert("Failed to delete coverage. Please try again.");
      }
    }
  };

  const handleEditCoverage = (coverage) => {
    setEditingCoverageId(coverage.id);
    setName(coverage.name);
    setDescription(coverage.description);
    setType(coverage.type);
    setFormNumber(coverage.formNumber);
    setItCode(coverage.itCode || '');
    setStatCode(coverage.statCode || '');
  };

  const handleUpdateCoverage = async () => {
    if (!name || !description || !formNumber) {
      alert('Please fill in all required fields');
      return;
    }
    try {
      await updateDoc(doc(db, `products/${productId}/coverages`, editingCoverageId), {
        name,
        description,
        type,
        formNumber,
        itCode,
        statCode
      });
      setEditingCoverageId(null);
      setName('');
      setDescription('');
      setType('Base coverage');
      setFormNumber('');
      setItCode('');
      setStatCode('');
      const querySnapshot = await getDocs(collection(db, `products/${productId}/coverages`));
      const coverageList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCoverages(coverageList);
    } catch (error) {
      console.error("Error updating coverage:", error);
      alert("Failed to update coverage. Please try again.");
    }
  };

  return (
    <CoverageContainer>
      <Header>
        <PageTitle>Coverages for {productName}</PageTitle>
        <BackLink to="/">Back</BackLink>
      </Header>
      <SearchInput
        type="text"
        placeholder="Search Coverages"
        value={searchQuery}
        onChange={e => setSearchQuery(e.target.value)}
      />
      {filteredCoverages.length > 0 ? (
        <Table>
          <Thead>
            <tr>
              <Th>Name</Th>
              <Th>Type</Th>
              <Th>Form Number</Th>
              <Th>IT Code</Th>
              <Th>Stat Code</Th>
              <Th>Actions</Th>
            </tr>
          </Thead>
          <tbody>
            {filteredCoverages.map(coverage => (
              <tr key={coverage.id}>
                <Td>{coverage.name}</Td>
                <Td>{coverage.type}</Td>
                <Td>{coverage.formNumber}</Td>
                <Td>{coverage.itCode || '-'}</Td>
                <Td>{coverage.statCode || '-'}</Td>
                <Td>
                  <ActionsContainer>
                    <IconButton onClick={() => handleEditCoverage(coverage)} title="Edit coverage">
                      <PencilIcon />
                    </IconButton>
                    <IconButton danger onClick={() => handleDeleteCoverage(coverage.id)} title="Delete coverage">
                      <TrashIcon />
                    </IconButton>
                  </ActionsContainer>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      ) : (
        <NoCoveragesText>No Coverages Found</NoCoveragesText>
      )}
      <FormContainer>
        <Input
          type="text"
          placeholder="Coverage Name"
          value={name}
          onChange={e => setName(e.target.value)}
        />
        <Input
          type="text"
          placeholder="Short Description"
          value={description}
          onChange={e => setDescription(e.target.value)}
        />
        <Select
          value={type}
          onChange={e => setType(e.target.value)}
        >
          <option value="Base coverage">Base coverage</option>
          <option value="Endorsement">Endorsement</option>
        </Select>
        <Input
          type="text"
          placeholder="Form Number"
          value={formNumber}
          onChange={e => setFormNumber(e.target.value)}
        />
        <Input
          type="text"
          placeholder="IT Code (Optional)"
          value={itCode}
          onChange={e => setItCode(e.target.value)}
        />
        <Input
          type="text"
          placeholder="Stat Code (Optional)"
          value={statCode}
          onChange={e => setStatCode(e.target.value)}
        />
        <ActionButton onClick={editingCoverageId ? handleUpdateCoverage : handleAddCoverage}>
          {editingCoverageId ? 'Update Coverage' : 'Add Coverage'}
        </ActionButton>
      </FormContainer>
    </CoverageContainer>
  );
}

export default CoverageScreen;