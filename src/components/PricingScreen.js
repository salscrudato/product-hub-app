import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db } from '../firebase';
import { collection, getDocs, addDoc, deleteDoc, doc, getDoc } from 'firebase/firestore';
import { TrashIcon } from '@heroicons/react/24/solid';
import Select from 'react-select';
import styled from 'styled-components';

// Styled Components
const PricingContainer = styled.div`
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

const Title = styled.h1`
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

const FilterContainer = styled.div`
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
`;

const FilterItem = styled.div`
  flex: 1;
`;

const FilterLabel = styled.label`
  font-size: 14px;
  font-weight: 500;
  color: #1F2937;
  margin-bottom: 5px;
  display: block;
`;

const TableContainer = styled.div`
  overflow-x: auto;
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

const SelectStyled = styled.select`
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

const ViewLink = styled(Link)`
  background: #1D4ED8;
  color: #ffffff;
  padding: 5px 10px;
  border-radius: 8px;
  text-decoration: none;
  transition: background-color 0.2s ease;
  &:hover {
    background: #1E40AF;
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

const FormContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 30px;
`;

function PricingScreen() {
  const { productId } = useParams();
  const [productName, setProductName] = useState('');
  const [coverages, setCoverages] = useState([]);
  const [steps, setSteps] = useState([]);
  const [selectedCoveragesFilter, setSelectedCoveragesFilter] = useState([]);
  const [selectedStatesFilter, setSelectedStatesFilter] = useState([]);
  const [newStep, setNewStep] = useState({
    stepType: 'factor',
    coverage: 'Base Coverage',
    parenBefore: '',
    stepName: '',
    parenAfter: '',
    type: 'User Input',
    table: '',
    rounding: 'none',
    rules: '',
    states: [],
    upstreamId: '',
    operand: ''
  });

  const allStates = ['AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'];
  const stateOptions = allStates.map(s => ({ value: s, label: s }));
  const coverageOptions = coverages.map(c => ({ value: c.name, label: c.name }));

  useEffect(() => {
    const fetchData = async () => {
      try {
        const productDoc = await getDoc(doc(db, 'products', productId));
        if (productDoc.exists()) {
          setProductName(productDoc.data().name);
        } else {
          throw new Error("Product not found");
        }

        const coveragesSnapshot = await getDocs(collection(db, `products/${productId}/coverages`));
        const coverageList = coveragesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setCoverages(coverageList);

        const stepsSnapshot = await getDocs(collection(db, `products/${productId}/steps`));
        const stepList = stepsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setSteps(stepList);
      } catch (error) {
        console.error("Error fetching data:", error);
        alert("Failed to load data. Please try again.");
      }
    };
    fetchData();
  }, [productId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewStep(prev => ({ ...prev, [name]: value }));
  };

  const handleAddStep = async () => {
    try {
      let stepData;
      if (newStep.stepType === 'factor') {
        if (!newStep.stepName || !newStep.coverage) {
          alert('Please fill in required fields');
          return;
        }
        stepData = {
          stepType: 'factor',
          coverage: newStep.coverage,
          stepName: newStep.stepName,
          type: newStep.type,
          table: newStep.table,
          rounding: newStep.rounding,
          rules: newStep.rules,
          states: newStep.states,
          upstreamId: newStep.upstreamId,
          order: steps.length
        };
      } else {
        if (!newStep.operand) {
          alert('Please select an operand');
          return;
        }
        stepData = {
          stepType: 'operand',
          operand: newStep.operand,
          order: steps.length
        };
      }
      const docRef = await addDoc(collection(db, `products/${productId}/steps`), stepData);
      setSteps([...steps, { ...stepData, id: docRef.id }]);
      setNewStep({
        stepType: 'factor',
        coverage: 'Base Coverage',
        stepName: '',
        type: 'User Input',
        table: '',
        rounding: 'none',
        rules: '',
        states: [],
        upstreamId: '',
        operand: ''
      });
    } catch (error) {
      console.error("Error adding step:", error);
      alert("Failed to add step. Please try again.");
    }
  };

  const handleDeleteStep = async (stepId) => {
    if (window.confirm("Are you sure you want to delete this step?")) {
      try {
        await deleteDoc(doc(db, `products/${productId}/steps`, stepId));
        setSteps(steps.filter(step => step.id !== stepId));
      } catch (error) {
        console.error("Error deleting step:", error);
        alert("Failed to delete step. Please try again.");
      }
    }
  };

  const isStepMatchingFilters = (step) => {
    if (step.stepType === 'operand') return true;
    const coverageMatch = selectedCoveragesFilter.length === 0 || selectedCoveragesFilter.some(c => c.value === step.coverage);
    const statesMatch = selectedStatesFilter.length === 0 || (step.states && selectedStatesFilter.some(s => step.states.includes(s.value)));
    return coverageMatch && statesMatch;
  };

  return (
    <PricingContainer>
      <Header>
        <Title>Pricing for {productName}</Title>
        <BackLink to="/">Back</BackLink>
      </Header>
      <FilterContainer>
        <FilterItem>
          <FilterLabel>Filter by Coverages</FilterLabel>
          <Select
            isMulti
            options={coverageOptions}
            value={selectedCoveragesFilter}
            onChange={setSelectedCoveragesFilter}
            styles={{
              control: (base) => ({
                ...base,
                background: '#ffffff',
                borderColor: '#E5E7EB',
                borderRadius: '8px',
                fontFamily: 'Inter, sans-serif',
                fontSize: '16px',
                color: '#1F2937',
                ':hover': { borderColor: '#D1D5DB' },
                ':focus': { borderColor: '#1D4ED8', boxShadow: '0 0 0 2px rgba(29, 78, 216, 0.1)' }
              }),
              menu: (base) => ({ ...base, background: '#ffffff', borderRadius: '8px' }),
              multiValue: (base) => ({ ...base, background: '#E5E7EB' }),
              multiValueLabel: (base) => ({ ...base, color: '#1F2937' }),
              multiValueRemove: (base) => ({
                ...base,
                color: '#6B7280',
                ':hover': { background: '#D1D5DB', color: '#1F2937' }
              }),
              option: (base, state) => ({
                ...base,
                background: state.isFocused ? '#F9FAFB' : '#ffffff',
                color: '#1F2937',
                ':hover': { background: '#F9FAFB' }
              }),
              placeholder: (base) => ({ ...base, color: '#6B7280' }),
              singleValue: (base) => ({ ...base, color: '#1F2937' })
            }}
          />
        </FilterItem>
        <FilterItem>
          <FilterLabel>Filter by States</FilterLabel>
          <Select
            isMulti
            options={stateOptions}
            value={selectedStatesFilter}
            onChange={setSelectedStatesFilter}
            styles={{
              control: (base) => ({
                ...base,
                background: '#ffffff',
                borderColor: '#E5E7EB',
                borderRadius: '8px',
                fontFamily: 'Inter, sans-serif',
                fontSize: '16px',
                color: '#1F2937',
                ':hover': { borderColor: '#D1D5DB' },
                ':focus': { borderColor: '#1D4ED8', boxShadow: '0 0 0 2px rgba(29, 78, 216, 0.1)' }
              }),
              menu: (base) => ({ ...base, background: '#ffffff', borderRadius: '8px' }),
              multiValue: (base) => ({ ...base, background: '#E5E7EB' }),
              multiValueLabel: (base) => ({ ...base, color: '#1F2937' }),
              multiValueRemove: (base) => ({
                ...base,
                color: '#6B7280',
                ':hover': { background: '#D1D5DB', color: '#1F2937' }
              }),
              option: (base, state) => ({
                ...base,
                background: state.isFocused ? '#F9FAFB' : '#ffffff',
                color: '#1F2937',
                ':hover': { background: '#F9FAFB' }
              }),
              placeholder: (base) => ({ ...base, color: '#6B7280' }),
              singleValue: (base) => ({ ...base, color: '#1F2937' })
            }}
          />
        </FilterItem>
      </FilterContainer>
      <TableContainer>
        <Table>
          <Thead>
            <tr>
              <Th>Coverages</Th>
              <Th>Step</Th>
              <Th>Type</Th>
              <Th>Table</Th>
              <Th>Rounding</Th>
              <Th>Rules</Th>
              <Th>States</Th>
              <Th>Upstream ID</Th>
              <Th>Delete</Th>
            </tr>
          </Thead>
          <tbody>
            {steps.map((step) => {
              const isMatching = isStepMatchingFilters(step);
              return (
                <tr key={step.id} style={{ opacity: isMatching ? 1 : 0.5 }}>
                  <Td>{step.stepType === 'factor' ? step.coverage : ''}</Td>
                  <Td>{step.stepType === 'factor' ? step.stepName : step.operand}</Td>
                  <Td>{step.stepType === 'factor' ? step.type : ''}</Td>
                  <Td>
                    {step.stepType === 'factor' && step.table ? (
                      <ViewLink to={`/table/${productId}/${step.id}`}>View</ViewLink>
                    ) : step.stepType === 'factor' ? 'N/A' : ''}
                  </Td>
                  <Td>{step.stepType === 'factor' ? step.rounding : ''}</Td>
                  <Td>{step.stepType === 'factor' ? <DisabledButton disabled>Rules</DisabledButton> : ''}</Td>
                  <Td>{step.stepType === 'factor' ? (step.states ? step.states.join(', ') : '') : ''}</Td>
                  <Td>{step.stepType === 'factor' ? step.upstreamId : ''}</Td>
                  <Td>
                    <DeleteButton onClick={() => handleDeleteStep(step.id)} title="Delete step">
                      <TrashIcon />
                    </DeleteButton>
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      </TableContainer>
      <FormContainer>
        <SelectStyled name="stepType" value={newStep.stepType} onChange={handleInputChange}>
          <option value="factor">Factor</option>
          <option value="operand">Operand</option>
        </SelectStyled>
        {newStep.stepType === 'factor' ? (
          <>
            <SelectStyled name="coverage" value={newStep.coverage} onChange={handleInputChange}>
              {coverages.map(c => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </SelectStyled>
            <Input name="stepName" value={newStep.stepName} onChange={handleInputChange} placeholder="Step Name" />
            <SelectStyled name="type" value={newStep.type} onChange={handleInputChange}>
              <option value="User Input">User Input</option>
              <option value="Table">Table</option>
              <option value="Other">Other</option>
            </SelectStyled>
            <Input name="table" value={newStep.table} onChange={handleInputChange} placeholder="Table Name (Optional)" />
            <SelectStyled name="rounding" value={newStep.rounding} onChange={handleInputChange}>
              <option value="none">None</option>
              <option value="Whole Number">Whole Number</option>
              <option value="1 Decimal">1 Decimal</option>
              <option value="2 Decimals">2 Decimals</option>
              <option value="Other">Other</option>
            </SelectStyled>
            <Select
              isMulti
              name="states"
              options={stateOptions}
              value={newStep.states.map(s => ({ value: s, label: s }))}
              onChange={(selected) => setNewStep(prev => ({ ...prev, states: selected ? selected.map(s => s.value) : [] }))}
              styles={{
                control: (base) => ({
                  ...base,
                  background: '#ffffff',
                  borderColor: '#E5E7EB',
                  borderRadius: '8px',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '16px',
                  color: '#1F2937',
                  ':hover': { borderColor: '#D1D5DB' },
                  ':focus': { borderColor: '#1D4ED8', boxShadow: '0 0 0 2px rgba(29, 78, 216, 0.1)' }
                }),
                menu: (base) => ({ ...base, background: '#ffffff', borderRadius: '8px' }),
                multiValue: (base) => ({ ...base, background: '#E5E7EB' }),
                multiValueLabel: (base) => ({ ...base, color: '#1F2937' }),
                multiValueRemove: (base) => ({
                  ...base,
                  color: '#6B7280',
                  ':hover': { background: '#D1D5DB', color: '#1F2937' }
                }),
                option: (base, state) => ({
                  ...base,
                  background: state.isFocused ? '#F9FAFB' : '#ffffff',
                  color: '#1F2937',
                  ':hover': { background: '#F9FAFB' }
                }),
                placeholder: (base) => ({ ...base, color: '#6B7280' }),
                singleValue: (base) => ({ ...base, color: '#1F2937' })
              }}
            />
            <Input name="upstreamId" value={newStep.upstreamId} onChange={handleInputChange} placeholder="Upstream ID" />
          </>
        ) : (
          <SelectStyled name="operand" value={newStep.operand} onChange={handleInputChange}>
            <option value="">Select Operand</option>
            <option value="+">+</option>
            <option value="-">-</option>
            <option value="*">*</option>
            <option value="/">/</option>
            <option value="=">=</option>
          </SelectStyled>
        )}
        <ActionButton onClick={handleAddStep}>Add Step</ActionButton>
      </FormContainer>
    </PricingContainer>
  );
}

export default PricingScreen;