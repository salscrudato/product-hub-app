import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db } from '../firebase';
import { collection, getDocs, addDoc, deleteDoc, doc, getDoc, updateDoc } from 'firebase/firestore';
import { TrashIcon, PencilIcon, XMarkIcon } from '@heroicons/react/24/solid';
import Select from 'react-select';
import styled from 'styled-components';

// Styled Components for a modern, Musk-inspired UI
const PricingContainer = styled.div`
  min-height: 100vh;
  background-color: #f5f5f5;
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
  font-weight: 400;
  background: linear-gradient(45deg, rgb(0, 116, 225), rgb(96, 65, 159));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
`;

const BackLink = styled(Link)`
  color: #1D4ED8;
  text-decoration: none;
  font-size: 18px;
  &:hover {
    text-decoration: underline;
  }
`;

const CalculationPreview = styled.div`
  margin-bottom: 24px;
  padding: 16px;
  background: #F9FAFB;
  border-radius: 8px;
  font-size: 18px;
  font-weight: 500;
  color: #1F2937;
  text-align: center;
`;

const StepLabel = styled.span`
  font-weight: 600;
  color: #1F2937;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  background-color: #f5f5f5;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  margin-bottom: 16px;
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

const OperandRow = styled.tr`
  background: transparent;
  border-bottom: 1px solid #E5E7EB;
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

const OperandCell = styled.td`
  padding: 0px 50px;
  font-size: 24px;
  font-weight: 500;
  text-align: center;
  margin: 0 auto;
  border-radius: 50%;
`;

const TableLink = styled(Link)`
  color: #1D4ED8;
  text-decoration: none;
  &:hover {
    text-decoration: underline;
  }
`;

const GradientButton = styled.button`
  padding: 6px 12px;
  background: linear-gradient(90deg, #A100FF, #4400FF);
  color: #ffffff;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-family: 'Inter', sans-serif;
  font-weight: 400;
  font-size: 14px;
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
    width: 15px;
    height: 15px;
  }
`;

const ActionsContainer = styled.div`
  display: flex;
  gap: 10px;
  justify-content: center;
`;

const Backdrop = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalBox = styled.div`
  background: #fff;
  border-radius: 8px;
  padding: 24px;
  width: 600px;
  max-height: 80vh;
  overflow-y: auto;
  position: relative;
  font-family: 'Inter', sans-serif;
`;

const CloseButton = styled.button`
  position: absolute;
  top: 12px;
  right: 12px;
  background: none;
  border: none;
  cursor: pointer;
  svg {
    width: 24px;
    height: 24px;
    color: #6B7280;
  }
`;

const FormGroup = styled.div`
  margin-bottom: 16px;
  label {
    display: block;
    margin-bottom: 8px;
    font-weight: 500;
    color: #1F2937;
  }
`;

const FormInput = styled.input`
  width: 100%;
  padding: 12px;
  font-size: 16px;
  font-family: 'Inter', sans-serif;
  color: #1F2937;
  background-color: #f5f5f5;
  border: 1px solid #A2C0FB;
  border-radius: 8px;
  outline: none;
  &:focus {
    border-color: #1D4ED8;
    box-shadow: 0 0 0 4px rgba(29, 78, 216, 0.1);
  }
  &::placeholder {
    color: #6B7280;
  }
`;

const SelectStyled = styled.select`
  width: 100%;
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

// StepModal Component for adding/editing steps
function StepModal({ onClose, onSubmit, editingStep, steps, coverages }) {
  const defaultStep = {
    stepType: 'factor',
    coverage: '',
    stepName: '',
    type: 'User Input',
    table: '',
    rounding: 'none',
    rules: '',
    states: [],
    upstreamId: '',
    operand: '',
    value: 0
  };

  const [stepData, setStepData] = useState(editingStep ? { ...editingStep } : { ...defaultStep });

  useEffect(() => {
    setStepData(editingStep ? { ...editingStep } : { ...defaultStep });
  }, [editingStep]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setStepData(prev => ({ ...prev, [name]: name === 'value' ? parseFloat(value) || 0 : value }));
  };

  const handleStatesChange = (selected) => {
    setStepData(prev => ({ ...prev, states: selected ? selected.map(s => s.value) : [] }));
  };

  const handleUpstreamChange = (selected) => {
    setStepData(prev => ({ ...prev, upstreamId: selected ? selected.value : '' }));
  };

  const handleSubmit = () => {
    if (stepData.stepType === 'factor') {
      if (!stepData.stepName || !stepData.coverage) {
        alert('Please fill in required fields');
        return;
      }
    } else {
      if (!stepData.operand) {
        alert('Please select an operand');
        return;
      }
    }
    onSubmit(stepData);
  };

  const allStates = ['AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'];
  const stateOptions = allStates.map(s => ({ value: s, label: s }));

  const upstreamOptions = [
    { value: '', label: 'None' },
    ...steps.filter(s => s.id !== editingStep?.id).map(s => ({
      value: s.id,
      label: s.stepType === 'factor' ? s.stepName : s.operand
    }))
  ];

  const customStyles = {
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
  };

  return (
    <Backdrop onClick={onClose}>
      <ModalBox onClick={e => e.stopPropagation()}>
        <CloseButton onClick={onClose}><XMarkIcon /></CloseButton>
        <h2 style={{ marginBottom: '24px', fontSize: '24px', fontWeight: '600' }}>
          {editingStep ? 'Edit Step' : 'Add Step'}
        </h2>
        <FormGroup>
          <label>Step Type</label>
          <SelectStyled name="stepType" value={stepData.stepType} onChange={handleChange}>
            <option value="factor">Factor</option>
            <option value="operand">Operand</option>
          </SelectStyled>
        </FormGroup>
        {stepData.stepType === 'factor' ? (
          <>
            <FormGroup>
              <label>Coverage</label>
              <SelectStyled name="coverage" value={stepData.coverage} onChange={handleChange}>
                <option value="">Select Coverage</option>
                <option value="Base Coverage">Base Coverage</option>
                {coverages.map(c => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </SelectStyled>
            </FormGroup>
            <FormGroup>
              <label>Step Name</label>
              <FormInput name="stepName" value={stepData.stepName} onChange={handleChange} />
            </FormGroup>
            <FormGroup>
              <label>Value</label>
              <FormInput type="number" name="value" value={stepData.value} onChange={handleChange} placeholder="Enter factor value" />
            </FormGroup>
            <FormGroup>
              <label>Type</label>
              <SelectStyled name="type" value={stepData.type} onChange={handleChange}>
                <option value="User Input">User Input</option>
                <option value="Table">Table</option>
                <option value="Other">Other</option>
              </SelectStyled>
            </FormGroup>
            <FormGroup>
              <label>Table Name (Optional)</label>
              <FormInput name="table" value={stepData.table} onChange={handleChange} />
            </FormGroup>
            <FormGroup>
              <label>Rounding</label>
              <SelectStyled name="rounding" value={stepData.rounding} onChange={handleChange}>
                <option value="none">None</option>
                <option value="Whole Number">Whole Number</option>
                <option value="1 Decimal">1 Decimal</option>
                <option value="2 Decimals">2 Decimals</option>
                <option value="Other">Other</option>
              </SelectStyled>
            </FormGroup>
            <FormGroup>
              <label>States</label>
              <Select
                isMulti
                options={stateOptions}
                value={stateOptions.filter(s => stepData.states.includes(s.value))}
                onChange={handleStatesChange}
                styles={customStyles}
              />
            </FormGroup>
            <FormGroup>
              <label>Upstream ID</label>
              <Select
                options={upstreamOptions}
                value={upstreamOptions.find(o => o.value === stepData.upstreamId)}
                onChange={handleUpstreamChange}
                styles={customStyles}
              />
            </FormGroup>
          </>
        ) : (
          <FormGroup>
            <label>Operand</label>
            <SelectStyled name="operand" value={stepData.operand} onChange={handleChange}>
              <option value="">Select Operand</option>
              <option value="+">+</option>
              <option value="-">-</option>
              <option value="*">*</option>
              <option value="/">/</option>
              <option value="=">=</option>
            </SelectStyled>
          </FormGroup>
        )}
        <GradientButton onClick={handleSubmit}>
          {editingStep ? 'Update Step' : 'Add Step'}
        </GradientButton>
      </ModalBox>
    </Backdrop>
  );
}

// Main PricingScreen Component
function PricingScreen() {
  const { productId } = useParams();
  const [productName, setProductName] = useState('');
  const [coverages, setCoverages] = useState([]);
  const [steps, setSteps] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStep, setEditingStep] = useState(null);

  // Fetch product, coverages, and steps from Firestore
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
        stepList.sort((a, b) => a.order - b.order);
        setSteps(stepList);
      } catch (error) {
        console.error("Error fetching data:", error);
        alert("Failed to load data. Please try again.");
      }
    };
    fetchData();
  }, [productId]);

  // Calculate the pricing based on steps
  const calculatePricing = () => {
    let result = null;
    let currentOperand = null;

    steps.forEach((step, index) => {
      if (step.stepType === 'factor') {
        const value = step.value || 0;
        if (result === null) {
          result = value;
        } else if (currentOperand) {
          if (currentOperand === '+') result += value;
          else if (currentOperand === '-') result -= value;
          else if (currentOperand === '*') result *= value;
          else if (currentOperand === '/') result = value !== 0 ? result / value : result;
        }
      } else if (step.stepType === 'operand') {
        currentOperand = step.operand;
      }
    });

    return result !== null ? result.toFixed(2) : 'N/A';
  };

  // Handle adding or updating a step
  const handleModalSubmit = async (stepData) => {
    if (editingStep) {
      try {
        await updateDoc(doc(db, `products/${productId}/steps`, editingStep.id), stepData);
        const updatedSteps = steps.map(s => s.id === editingStep.id ? { ...s, ...stepData } : s);
        updatedSteps.sort((a, b) => a.order - b.order);
        setSteps(updatedSteps);
      } catch (error) {
        console.error("Error updating step:", error);
        alert("Failed to update step. Please try again.");
      }
    } else {
      try {
        const docRef = await addDoc(collection(db, `products/${productId}/steps`), { ...stepData, order: steps.length });
        const updatedSteps = [...steps, { ...stepData, id: docRef.id, order: steps.length }];
        updatedSteps.sort((a, b) => a.order - b.order);
        setSteps(updatedSteps);
      } catch (error) {
        console.error("Error adding step:", error);
        alert("Failed to add step. Please try again.");
      }
    }
    setModalOpen(false);
  };

  // Handle deleting a step
  const handleDeleteStep = async (stepId) => {
    if (window.confirm("Are you sure you want to delete this step?")) {
      try {
        await deleteDoc(doc(db, `products/${productId}/steps`, stepId));
        const updatedSteps = steps.filter(step => step.id !== stepId);
        updatedSteps.sort((a, b) => a.order - b.order);
        setSteps(updatedSteps);
      } catch (error) {
        console.error("Error deleting step:", error);
        alert("Failed to delete step. Please try again.");
      }
    }
  };

  // Open modals for adding or editing steps
  const openAddModal = () => {
    setEditingStep(null);
    setModalOpen(true);
  };

  const openEditModal = (step) => {
    setEditingStep(step);
    setModalOpen(true);
  };

  // Render the calculation preview as a table
  const renderCalculationPreview = () => {
    return (
      <Table>
        <TableHead>
          <TableRow>
            <TableHeader>Step Name</TableHeader>
            <TableHeader>Type</TableHeader>
            <TableHeader>Table</TableHeader>
            <TableHeader>Rounding</TableHeader>
            <TableHeader>States</TableHeader>
            <TableHeader>Upstream ID</TableHeader>
            <TableHeader>Value</TableHeader>
            <TableHeader>Coverage</TableHeader>
            <TableHeader>Actions</TableHeader>
          </TableRow>
        </TableHead>
        <tbody>
          {steps.map((step, index) => (
            step.stepType === 'factor' ? (
              <TableRow key={step.id}>
                <TableCell>{step.stepName}</TableCell>
                <TableCell>{step.type}</TableCell>
                <TableCell>{step.table ? <TableLink to={`/table/${productId}/${step.id}`}>{step.table}</TableLink> : '-'}</TableCell>
                <TableCell>{step.rounding}</TableCell>
                <TableCell>{step.states && step.states.length > 0 ? step.states.join(', ') : 'All'}</TableCell>
                <TableCell>{step.upstreamId || '-'}</TableCell>
                <TableCell>{step.value || 0}</TableCell>
                <TableCell>{step.coverage}</TableCell>
                <TableCell>
                  <ActionsContainer>
                    <IconButton onClick={() => openEditModal(step)} title="Edit step">
                      <PencilIcon />
                    </IconButton>
                    <IconButton danger onClick={() => handleDeleteStep(step.id)} title="Delete step">
                      <TrashIcon />
                    </IconButton>
                  </ActionsContainer>
                </TableCell>
              </TableRow>
            ) : (
              <OperandRow key={step.id}>
                <TableCell colSpan="8">
                  <OperandCell>{step.operand}</OperandCell>
                </TableCell>
                <TableCell>
                  <ActionsContainer>
                    <IconButton onClick={() => openEditModal(step)} title="Edit step">
                      <PencilIcon />
                    </IconButton>
                    <IconButton danger onClick={() => handleDeleteStep(step.id)} title="Delete step">
                      <TrashIcon />
                    </IconButton>
                  </ActionsContainer>
                </TableCell>
              </OperandRow>
            )
          ))}
        </tbody>
      </Table>
    );
  };

  return (
    <PricingContainer>
      <ContentWrapper>
        <Header>
          <Title>Pricing for {productName}</Title>
          <BackLink to="/">Back</BackLink>
        </Header>
        <CalculationPreview>
          {steps.length > 0 ? (
            <>
              {renderCalculationPreview()}
              <StepLabel style={{ margin: '16px 0 0 0' }}>= ${calculatePricing()}</StepLabel>
            </>
          ) : (
            <p>No steps added yet</p>
          )}
        </CalculationPreview>
        <GradientButton onClick={openAddModal}>Add Step</GradientButton>
      </ContentWrapper>
      {modalOpen && (
        <StepModal
          onClose={() => setModalOpen(false)}
          onSubmit={handleModalSubmit}
          editingStep={editingStep}
          steps={steps}
          coverages={coverages}
        />
      )}
    </PricingContainer>
  );
}

export default PricingScreen;