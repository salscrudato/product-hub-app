import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db } from '../firebase';
import { collection, getDocs, addDoc, deleteDoc, doc, getDoc, updateDoc } from 'firebase/firestore';
import { TrashIcon, PencilIcon, XMarkIcon } from '@heroicons/react/24/solid';
import styled from 'styled-components';

const TableContainer = styled.div`
  min-height: 100vh;
  background-color: #ffffff;
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

const SectionTitle = styled.h2`
  font-size: 24px;
  font-weight: 600;
  color: #1F2937;
  margin-bottom: 16px;
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

const FormInput = styled.input`
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

const GradientButton = styled.button`
  padding: 12px 24px;
  background: linear-gradient(90deg, #A100FF, #4400FF);
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
  const [newDimension, setNewDimension] = useState({ name: '', values: '', technicalCode: '', type: 'Row' });
  const [editingDimensionId, setEditingDimensionId] = useState(null);
  const [tableData, setTableData] = useState({});

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

        // Initialize table data
        const initialData = {};
        const rowDim = dimensionList.find(dim => dim.type === 'Row');
        const colDim = dimensionList.find(dim => dim.type === 'Column');
        const rowValues = rowDim ? rowDim.values.split(',').map(val => val.trim()) : [''];
        const colValues = colDim ? colDim.values.split(',').map(val => val.trim()) : [''];

        rowValues.forEach(row => {
          colValues.forEach(col => {
            initialData[`${row}-${col}`] = '';
          });
        });
        setTableData(initialData);
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

  const handleTableDataChange = (key, value) => {
    setTableData(prev => ({ ...prev, [key]: value }));
  };

  const handleAddDimension = async () => {
    if (!newDimension.name || !newDimension.values || !newDimension.technicalCode) {
      alert('Please fill in all fields');
      return;
    }
    if (dimensions.length >= 2) {
      alert('You can only add up to 2 dimensions (Row and Column).');
      return;
    }
    try {
      const docRef = await addDoc(collection(db, `products/${productId}/steps/${stepId}/dimensions`), {
        name: newDimension.name,
        values: newDimension.values,
        technicalCode: newDimension.technicalCode,
        type: newDimension.type
      });
      const updatedDimensions = [...dimensions, { id: docRef.id, ...newDimension }];
      setDimensions(updatedDimensions);
      setNewDimension({ name: '', values: '', technicalCode: '', type: 'Row' });

      // Update table data
      const rowDim = updatedDimensions.find(dim => dim.type === 'Row');
      const colDim = updatedDimensions.find(dim => dim.type === 'Column');
      const rowValues = rowDim ? rowDim.values.split(',').map(val => val.trim()) : [''];
      const colValues = colDim ? colDim.values.split(',').map(val => val.trim()) : [''];
      const newTableData = {};
      rowValues.forEach(row => {
        colValues.forEach(col => {
          newTableData[`${row}-${col}`] = tableData[`${row}-${col}`] || '';
        });
      });
      setTableData(newTableData);
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
      technicalCode: dimension.technicalCode,
      type: dimension.type
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
        technicalCode: newDimension.technicalCode,
        type: newDimension.type
      });
      const updatedDimensions = dimensions.map(dim => (dim.id === editingDimensionId ? { id: dim.id, ...newDimension } : dim));
      setDimensions(updatedDimensions);
      setEditingDimensionId(null);
      setNewDimension({ name: '', values: '', technicalCode: '', type: 'Row' });

      // Update table data
      const rowDim = updatedDimensions.find(dim => dim.type === 'Row');
      const colDim = updatedDimensions.find(dim => dim.type === 'Column');
      const rowValues = rowDim ? rowDim.values.split(',').map(val => val.trim()) : [''];
      const colValues = colDim ? colDim.values.split(',').map(val => val.trim()) : [''];
      const newTableData = {};
      rowValues.forEach(row => {
        colValues.forEach(col => {
          newTableData[`${row}-${col}`] = tableData[`${row}-${col}`] || '';
        });
      });
      setTableData(newTableData);
    } catch (error) {
      console.error("Error updating dimension:", error);
      alert("Failed to update dimension. Please try again.");
    }
  };

  const handleDeleteDimension = async (dimensionId) => {
    if (window.confirm("Are you sure you want to delete this dimension?")) {
      try {
        await deleteDoc(doc(db, `products/${productId}/steps/${stepId}/dimensions`, dimensionId));
        const updatedDimensions = dimensions.filter(dim => dim.id !== dimensionId);
        setDimensions(updatedDimensions);

        // Update table data
        const rowDim = updatedDimensions.find(dim => dim.type === 'Row');
        const colDim = updatedDimensions.find(dim => dim.type === 'Column');
        const rowValues = rowDim ? rowDim.values.split(',').map(val => val.trim()) : [''];
        const colValues = colDim ? colDim.values.split(',').map(val => val.trim()) : [''];
        const newTableData = {};
        rowValues.forEach(row => {
          colValues.forEach(col => {
            newTableData[`${row}-${col}`] = tableData[`${row}-${col}`] || '';
          });
        });
        setTableData(newTableData);
      } catch (error) {
        console.error("Error deleting dimension:", error);
        alert("Failed to delete dimension. Please try again.");
      }
    }
  };

  // Prepare dynamic table data
  const rowDimension = dimensions.find(dim => dim.type === 'Row');
  const colDimension = dimensions.find(dim => dim.type === 'Column');
  const rowValues = rowDimension ? rowDimension.values.split(',').map(val => val.trim()) : [''];
  const colValues = colDimension ? colDimension.values.split(',').map(val => val.trim()) : [''];

  return (
    <TableContainer>
      <ContentWrapper>
        <Header>
          <Title>Table for Step: {step?.stepName || 'Loading...'}</Title>
          <BackLink to={`/pricing/${productId}`}>Back</BackLink>
        </Header>

        {/* Dimensions Management Section */}
        <SectionTitle>Table Dimensions</SectionTitle>
        <TableWrapper>
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>Type</TableHeader>
                <TableHeader>Dimension Name</TableHeader>
                <TableHeader>Dimension Values</TableHeader>
                <TableHeader>Technical Code</TableHeader>
                <TableHeader>Actions</TableHeader>
              </TableRow>
            </TableHead>
            <tbody>
              {dimensions.map(dimension => (
                <TableRow key={dimension.id}>
                  <TableCell>{dimension.type}</TableCell>
                  <TableCell>{dimension.name}</TableCell>
                  <TableCell>{dimension.values}</TableCell>
                  <TableCell>{dimension.technicalCode}</TableCell>
                  <TableCell>
                    <ActionsContainer>
                      <IconButton onClick={() => handleEditDimension(dimension)} title="Edit dimension">
                        <PencilIcon />
                      </IconButton>
                      <IconButton danger onClick={() => handleDeleteDimension(dimension.id)} title="Delete dimension">
                        <TrashIcon />
                      </IconButton>
                    </ActionsContainer>
                  </TableCell>
                </TableRow>
              ))}
            </tbody>
          </Table>
        </TableWrapper>
        <FormContainer>
          <SelectStyled name="type" value={newDimension.type} onChange={handleInputChange}>
            <option value="Row">Row</option>
            <option value="Column">Column</option>
          </SelectStyled>
          <FormInput
            type="text"
            name="name"
            value={newDimension.name}
            onChange={handleInputChange}
            placeholder="Dimension Name (e.g., Row Category)"
          />
          <FormInput
            type="text"
            name="values"
            value={newDimension.values}
            onChange={handleInputChange}
            placeholder="Dimension Values (comma-separated, e.g., A,B,C)"
          />
          <FormInput
            type="text"
            name="technicalCode"
            value={newDimension.technicalCode}
            onChange={handleInputChange}
            placeholder="Technical Code"
          />
          <GradientButton onClick={editingDimensionId ? handleUpdateDimension : handleAddDimension}>
            {editingDimensionId ? 'Update Dimension' : 'Add Dimension'}
          </GradientButton>
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
              <React.Fragment key={rowIndex}>
                <HeaderCell>{row}</HeaderCell>
                {colValues.map((col, colIndex) => (
                  <GridCell key={colIndex}>
                    <FormInput
                      type="text"
                      value={tableData[`${row}-${col}`] || ''}
                      onChange={(e) => handleTableDataChange(`${row}-${col}`, e.target.value)}
                      placeholder="Enter value"
                    />
                  </GridCell>
                ))}
              </React.Fragment>
            ))}
          </GridContainer>
        </PreviewContainer>
      </ContentWrapper>
    </TableContainer>
  );
}

export default TableScreen;