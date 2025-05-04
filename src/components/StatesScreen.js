import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import USAmap from 'react-usa-map';
import { TrashIcon } from '@heroicons/react/24/solid';
import styled from 'styled-components';

const allStates = ['AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'];

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

const MainContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  @media (min-width: 768px) {
    flex-direction: row;
  }
`;

const MapSection = styled.div`
  width: 100%;
  @media (min-width: 768px) {
    width: 50%;
  }
`;

const StatesSection = styled.div`
  width: 100%;
  @media (min-width: 768px) {
    width: 50%;
  }
`;

const Subtitle = styled.h2`
  font-size: 24px;
  font-weight: 600;
  color: #1F2937;
  margin-bottom: 16px;
`;

const ControlsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
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

const ActionButton = styled.button`
  padding: 8px 16px;
  background: ${props => (props.primary ? '#1D4ED8' : props.success ? '#10B981' : '#6B7280')};
  color: #ffffff;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-family: 'Inter', sans-serif;
  font-weight: 600;
  font-size: 14px;
  transition: background-color 0.2s ease;
  &:hover {
    background: ${props => (props.primary ? '#1E40AF' : props.success ? '#059669' : '#4B5563')};
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
  margin-bottom: 16px;
  &:focus {
    border-color: #1D4ED8;
    box-shadow: 0 0 0 2px rgba(29, 78, 216, 0.1);
  }
  &::placeholder {
    color: #6B7280;
  }
`;

const TableContainer = styled.div`
  max-height: 24rem;
  overflow-y: auto;
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

const NoStatesText = styled.p`
  text-align: center;
  font-size: 18px;
  color: #6B7280;
`;

function StatesScreen() {
  const { productId } = useParams();
  const [productName, setProductName] = useState('');
  const [selectedStates, setSelectedStates] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [newState, setNewState] = useState('');

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const productDoc = await getDoc(doc(db, 'products', productId));
        if (productDoc.exists()) {
          const data = productDoc.data();
          setProductName(data.name);
          setSelectedStates(data.availableStates || []);
        } else {
          throw new Error("Product not found");
        }
      } catch (error) {
        console.error("Error fetching product:", error);
        alert("Failed to load product data. Please try again.");
      }
    };
    fetchProduct();
  }, [productId]);

  const mapHandler = (event) => {
    const stateCode = event.target.dataset.name;
    if (selectedStates.includes(stateCode)) {
      setSelectedStates(selectedStates.filter(state => state !== stateCode));
    } else {
      setSelectedStates([...selectedStates, stateCode]);
    }
  };

  const configMap = () => {
    const config = {};
    allStates.forEach(state => {
      config[state] = {
        fill: selectedStates.includes(state) ? '#1D4ED8' : '#D1D5DB' // Updated to use blue for selected states
      };
    });
    return config;
  };

  const handleAddState = () => {
    if (newState && !selectedStates.includes(newState)) {
      setSelectedStates([...selectedStates, newState]);
      setNewState('');
    }
  };

  const handleRemoveState = (state) => {
    setSelectedStates(selectedStates.filter(s => s !== state));
  };

  const handleSelectAll = () => {
    setSelectedStates([...allStates]);
  };

  const handleClearAll = () => {
    setSelectedStates([]);
  };

  const handleSave = async () => {
    try {
      await updateDoc(doc(db, 'products', productId), {
        availableStates: selectedStates
      });
      alert("State availability saved successfully!");
    } catch (error) {
      console.error("Error saving states:", error);
      alert("Failed to save state availability. Please try again.");
    }
  };

  const filteredStates = selectedStates.filter(state =>
    state.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Container>
      <Header>
        <Title>State Availability for {productName}</Title>
        <BackLink to="/">Back</BackLink>
      </Header>
      <MainContent>
        <MapSection>
          <Subtitle>US Map</Subtitle>
          <USAmap customize={configMap()} onClick={mapHandler} />
        </MapSection>
        <StatesSection>
          <Subtitle>Applicable States</Subtitle>
          <ControlsContainer>
            <Select
              value={newState}
              onChange={e => setNewState(e.target.value)}
            >
              <option value="">Select State</option>
              {allStates.map(state => (
                <option key={state} value={state}>{state}</option>
              ))}
            </Select>
            <ActionButton primary onClick={handleAddState}>Add State</ActionButton>
            <ActionButton onClick={handleSelectAll}>Select All</ActionButton>
            <ActionButton onClick={handleClearAll}>Clear All</ActionButton>
            <ActionButton success onClick={handleSave}>Save</ActionButton>
          </ControlsContainer>
          <SearchInput
            type="text"
            placeholder="Search States"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          {filteredStates.length > 0 ? (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeader>State</TableHeader>
                    <TableHeader>Action</TableHeader>
                  </TableRow>
                </TableHead>
                <tbody>
                  {filteredStates.map(state => (
                    <TableRow key={state}>
                      <TableCell>{state}</TableCell>
                      <TableCell>
                        <DeleteButton onClick={() => handleRemoveState(state)} title="Remove state">
                          <TrashIcon />
                        </DeleteButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </tbody>
              </Table>
            </TableContainer>
          ) : (
            <NoStatesText>No States Selected</NoStatesText>
          )}
        </StatesSection>
      </MainContent>
    </Container>
  );
}

export default StatesScreen;