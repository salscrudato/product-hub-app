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
  background-color: #f9fafb;
  color: #1F2937;
  padding: 24px;
  font-family: 'Inter', sans-serif;
`;

const ContentWrapper = styled.div`
  max-width: 1200px;
  margin: 0 auto;
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
  background: linear-gradient(45deg, rgb(0, 116, 225), rgb(96, 65, 159));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
`;

const BackLink = styled(Link)`
  color: #1D4ED8;
  text-decoration: none;
  font-size: 18px;
  transition: color 0.2s ease;
  &:hover {
    color: #1E40AF;
    text-decoration: underline;
  }
`;

const MainContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  @media (min-width: 1024px) {
    flex-direction: row;
  }
`;

const MapSection = styled.div`
  width: 100%;
  background: #ffffff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  @media (min-width: 1024px) {
    width: 50%;
  }
`;

const StatesSection = styled.div`
  width: 100%;
  background: #ffffff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  @media (min-width: 1024px) {
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
  gap: 12px;
  margin-bottom: 16px;
`;

const Select = styled.select`
  flex: 1;
  min-width: 200px;
  padding: 12px;
  font-size: 16px;
  font-family: 'Inter', sans-serif;
  color: #1F2937;
  background: #f9fafb;
  border: 1px solid #E5E7EB;
  border-radius: 8px;
  outline: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  &:focus {
    border-color: #3B82F6;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
  }
`;

const ActionButton = styled.button`
  padding: 12px 24px;
  background: ${props => (props.primary ? 'linear-gradient(90deg, #A100FF, #4400FF)' : props.success ? '#10B981' : '#6B7280')};
  color: #ffffff;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-family: 'Inter', sans-serif;
  font-weight: 600;
  font-size: 14px;
  transition: background-color 0.2s ease, transform 0.1s ease;
  &:hover {
    background: ${props => (props.primary ? '#1E40AF' : props.success ? '#059669' : '#4B5563')};
    transform: translateY(-1px);
  }
  &:active {
    transform: translateY(0);
  }
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 12px;
  font-size: 16px;
  font-family: 'Inter', sans-serif;
  color: #1F2937;
  background: #f9fafb;
  border: 1px solid #E5E7EB;
  border-radius: 8px;
  outline: none;
  margin-bottom: 16px;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  &:focus {
    border-color: #3B82F6;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
  }
  &::placeholder {
    color: #6B7280;
  }
`;

const TableContainer = styled.div`
  max-height: 24rem;
  overflow-y: auto;
  border-radius: 8px;
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
  position: sticky;
  top: 0;
  z-index: 1;
`;

const TableRow = styled.tr`
  border-bottom: 1px solid #E5E7EB;
  transition: background-color 0.2s ease;
  &:hover {
    background: #F9FAFB;
  }
`;

const TableHeader = styled.th`
  padding: 12px;
  text-align: center;
  font-size: 14px;
  font-weight: 500;
  color: #6B7280;
`;

const TableCell = styled.td`
  padding: 12px;
  font-size: 14px;
  color: #1F2937;
  text-align: center;
`;

const DeleteButton = styled.button`
  background: none;
  border: none;
  color: #DC2626;
  cursor: pointer;
  transition: color 0.2s ease, transform 0.1s ease;
  &:hover {
    color: #B91C1C;
    transform: scale(1.1);
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
        fill: selectedStates.includes(state) ? '#3B82F6' : '#E5E7EB',
        stroke: '#FFFFFF',
        strokeWidth: 1,
        hoverFill: selectedStates.includes(state) ? '#2563EB' : '#D1D5DB', // Added hover effect
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
      <ContentWrapper>
        <Header>
          <Title>State Availability for {productName}</Title>
          <BackLink to="/">Back</BackLink>
        </Header>
        <MainContent>
          <MapSection>
            <Subtitle>US Map</Subtitle>
            <USAmap
              customize={configMap()}
              onClick={mapHandler}
              width={500}
              height={350}
              title="Select States"
            />
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
              <ActionButton primary onClick={handleAddState} title="Add selected state">
                Add State
              </ActionButton>
              <ActionButton onClick={handleSelectAll} title="Select all states">
                Select All
              </ActionButton>
              <ActionButton onClick={handleClearAll} title="Clear all states">
                Clear All
              </ActionButton>
              <ActionButton success onClick={handleSave} title="Save state selections">
                Save
              </ActionButton>
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
      </ContentWrapper>
    </Container>
  );
}

export default StatesScreen;