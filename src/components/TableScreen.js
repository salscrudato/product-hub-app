import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db } from '../firebase';
import { collection, getDocs, addDoc, deleteDoc, doc, getDoc, updateDoc } from 'firebase/firestore';
import { TrashIcon, PencilIcon } from '@heroicons/react/24/solid';
import styled from 'styled-components';

const TableContainer = styled.div`
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

const SectionTitle = styled.h2`
  font-size: 20px;
  font-weight: 600;
  color: #1F2937;
  margin-bottom: 10px;
`;

const TableWrapper = styled.div`
  overflow-x: auto;
  margin-bottom: 20px;
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

const FormContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 20px;
`;

const PreviewContainer = styled.div`
  overflow-x: auto;
`;

const GridContainer = styled.div`
  display: grid;
  border: 1px solid #E5E7EB;
  border-radius: 8px;
  overflow: hidden;
`;

const GridCell = styled.div`
  padding: 10px;
  border-bottom: 1px solid #E5E7EB;
  border-right: 1px solid #E5E7EB;
  background: #ffffff;
  text-align: center;
`;

const HeaderCell = styled(GridCell)`
  background: #F9FAFB;
  font-weight: 600;
  color: #1F2937;
`;

function TableScreen() {
  const { productId, stepId } = useParams();
  const [step, setStep] = useState(null);
  const [dimensions, setDimensions] = useState([]);
  const [newDimension, setNewDimension] = useState({ name: '', values: '', technicalCode: '' });
  const [editingDimensionId, setEditingDimensionId] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const stepDoc = await getDoc(doc(db, `products/${productId}/steps`, stepId));
        if (stepDoc.exists()) {
          setStep(stepDoc.data());
        } else {
          throw new Error("Step not found");
        }

        const dimensionsSnapshot = await getDocs(collection(db, `products/${productId}/steps/${stepId}/dimensions`));
        const dimensionList = dimensionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setDimensions(dimensionList);
      } catch (error) {
        console.error("Error fetching data:", error);
        alert("Failed to load table data. Please try again.");
      }
    };
    fetchData();
  }, [productId, stepId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewDimension(prev => ({ ...prev, [name]: value }));
  };

  const handleAddDimension = async () => {
    if (!newDimension.name || !newDimension.values || !newDimension.technicalCode) {
      alert('Please fill in all fields');
      return;
    }
    try {
      const docRef = await addDoc(collection(db, `products/${productId}/steps/${stepId}/dimensions`), {
        name: newDimension.name,
        values: newDimension.values,
        technicalCode: newDimension.technicalCode
      });
      setDimensions([...dimensions, { id: docRef.id, ...newDimension }]);
      setNewDimension({ name: '', values: '', technicalCode: '' });
    } catch (error) {
      console.error("Error adding dimension:", error);
      alert("Failed to add dimension. Please try again.");
    }
  };

  const handleEditDimension = (dimension) => {
    setEditingDimensionId(dimension.id);
    setNewDimension({
      name: dimension.name,
      values: dimension.values,
      technicalCode: dimension.technicalCode
    });
  };

  const handleUpdateDimension = async () => {
    if (!newDimension.name || !newDimension.values || !newDimension.technicalCode) {
      alert('Please fill in all fields');
      return;
    }
    try {
      await updateDoc(doc(db, `products/${productId}/steps/${stepId}/dimensions`, editingDimensionId), {
        name: newDimension.name,
        values: newDimension.values,
        technicalCode: newDimension.technicalCode
      });
      setDimensions(dimensions.map(dim => (dim.id === editingDimensionId ? { id: dim.id, ...newDimension } : dim)));
      setEditingDimensionId(null);
      setNewDimension({ name: '', values: '', technicalCode: '' });
    } catch (error) {
      console.error("Error updating dimension:", error);
      alert("Failed to update dimension. Please try again.");
    }
  };

  const handleDeleteDimension = async (dimensionId) => {
    if (window.confirm("Are you sure you want to delete this dimension?")) {
      try {
        await deleteDoc(doc(db, `products/${productId}/steps/${stepId}/dimensions`, dimensionId));
        setDimensions(dimensions.filter(dim => dim.id !== dimensionId));
      } catch (error) {
        console.error("Error deleting dimension:", error);
        alert("Failed to delete dimension. Please try again.");
      }
    }
  };

  // Prepare dynamic table data
  const rowDimensions = dimensions.filter(dim => dim.name.toLowerCase().includes('row'));
  const colDimensions = dimensions.filter(dim => dim.name.toLowerCase().includes('col'));

  const rowValues = rowDimensions.length > 0 ? rowDimensions[0].values.split(',').map(val => val.trim()) : [''];
  const colValues = colDimensions.length > 0 ? colDimensions[0].values.split(',').map(val => val.trim()) : [''];

  return (
    <TableContainer>
      <Header>
        <Title>Table for Step: {step?.stepName || 'Loading...'}</Title>
        <BackLink to={`/pricing/${productId}`}>Back</BackLink>
      </Header>

      {/* Dimensions Management Section */}
      <SectionTitle>Table Dimensions</SectionTitle>
      <TableWrapper>
        <Table>
          <Thead>
            <tr>
              <Th>Dimension Name</Th>
              <Th>Dimension Values</Th>
              <Th>Technical Code</Th>
              <Th>Actions</Th>
            </tr>
          </Thead>
          <tbody>
            {dimensions.map(dimension => (
              <tr key={dimension.id}>
                <Td>{dimension.name}</Td>
                <Td>{dimension.values}</Td>
                <Td>{dimension.technicalCode}</Td>
                <Td>
                  <ActionsContainer>
                    <IconButton onClick={() => handleEditDimension(dimension)} title="Edit dimension">
                      <PencilIcon />
                    </IconButton>
                    <IconButton danger onClick={() => handleDeleteDimension(dimension.id)} title="Delete dimension">
                      <TrashIcon />
                    </IconButton>
                  </ActionsContainer>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </TableWrapper>
      <FormContainer>
        <Input
          type="text"
          name="name"
          value={newDimension.name}
          onChange={handleInputChange}
          placeholder="Dimension Name (e.g., Row Category)"
        />
        <Input
          type="text"
          name="values"
          value={newDimension.values}
          onChange={handleInputChange}
          placeholder="Dimension Values (comma-separated, e.g., A,B,C)"
        />
        <Input
          type="text"
          name="technicalCode"
          value={newDimension.technicalCode}
          onChange={handleInputChange}
          placeholder="Technical Code"
        />
        <ActionButton onClick={editingDimensionId ? handleUpdateDimension : handleAddDimension}>
          {editingDimensionId ? 'Update Dimension' : 'Add Dimension'}
        </ActionButton>
      </FormContainer>

      {/* Dynamic Excel-like Table */}
      <SectionTitle>Table Preview</SectionTitle>
      <PreviewContainer>
        <GridContainer style={{ gridTemplateColumns: `auto repeat(${colValues.length}, minmax(100px, 1fr))` }}>
          {/* Header Row */}
          <HeaderCell />
          {colValues.map((col, index) => (
            <HeaderCell key={index}>{col}</HeaderCell>
          ))}
          {/* Data Rows */}
          {rowValues.map((row, rowIndex) => (
            <div key={rowIndex}>
              <HeaderCell>{row}</HeaderCell>
              {colValues.map((col, colIndex) => (
                <GridCell key={colIndex}>
                  <Input
                    type="text"
                    placeholder="Enter value"
                  />
                </GridCell>
              ))}
            </div>
          ))}
        </GridContainer>
      </PreviewContainer>
    </TableContainer>
  );
}

export default TableScreen;