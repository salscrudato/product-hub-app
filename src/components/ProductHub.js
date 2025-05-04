import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import { TrashIcon, PencilIcon } from '@heroicons/react/24/solid';
import styled from 'styled-components';

const Container = styled.div`
  min-height: 100vh;
  background-color: #ffffff;
  color: #1F2937;
  padding: 24px;
  font-family: 'Inter', sans-serif;
`;

const Header = styled.header`
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

const NavigationLinks = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const NavLink = styled(Link)`
  color: #1D4ED8;
  text-decoration: none;
  &:hover {
    text-decoration: underline;
  }
`;

const NavText = styled.span`
  color: ${props => (props.disabled ? '#6B7280' : '#1F2937')};
  cursor: ${props => (props.disabled ? 'not-allowed' : 'default')};
`;

const Separator = styled.span`
  color: #1F2937;
`;

const ActionButton = styled.button`
  color: ${props => (props.danger ? '#DC2626' : '#1D4ED8')};
  background: none;
  border: none;
  cursor: pointer;
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
  gap: 8px;
`;

const NoProductsText = styled.p`
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

function ProductHub() {
  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [editingProductId, setEditingProductId] = useState(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'products'));
        const productList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setProducts(productList);
      } catch (error) {
        console.error("Error fetching products:", error);
        alert("Failed to load products. Please try again.");
      }
    };
    fetchProducts();
  }, []);

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddProduct = async () => {
    if (!name || !description) {
      alert('Please fill in both fields');
      return;
    }
    try {
      await addDoc(collection(db, 'products'), { name, description, availableStates: [] });
      setName('');
      setDescription('');
      const querySnapshot = await getDocs(collection(db, 'products'));
      const productList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProducts(productList);
    } catch (error) {
      console.error("Error adding product:", error);
      alert("Failed to add product. Please try again.");
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (window.confirm("Are you sure you want to delete this product and its coverages?")) {
      try {
        const coveragesQuery = collection(db, `products/${productId}/coverages`);
        const coveragesSnapshot = await getDocs(coveragesQuery);
        const deletePromises = coveragesSnapshot.docs.map(doc => deleteDoc(doc.ref));
        await Promise.all(deletePromises);
        await deleteDoc(doc(db, 'products', productId));
        setProducts(products.filter(product => product.id !== productId));
      } catch (error) {
        console.error("Error deleting product:", error);
        alert("Failed to delete product. Please try again.");
      }
    }
  };

  const handleEditProduct = (product) => {
    setEditingProductId(product.id);
    setName(product.name);
    setDescription(product.description);
  };

  const handleUpdateProduct = async () => {
    if (!name || !description) {
      alert('Please fill in both fields');
      return;
    }
    try {
      await updateDoc(doc(db, 'products', editingProductId), { name, description });
      setEditingProductId(null);
      setName('');
      setDescription('');
      const querySnapshot = await getDocs(collection(db, 'products'));
      const productList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProducts(productList);
    } catch (error) {
      console.error("Error updating product:", error);
      alert("Failed to update product. Please try again.");
    }
  };

  return (
    <Container>
      <Header>
        <Title>Product Repository</Title>
      </Header>
      <SearchInput
        type="text"
        placeholder="Search Products"
        value={searchQuery}
        onChange={e => setSearchQuery(e.target.value)}
      />
      <Subtitle>Products</Subtitle>
      {filteredProducts.length > 0 ? (
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>Name</TableHeader>
                <TableHeader>Description</TableHeader>
                <TableHeader>Navigation</TableHeader>
                <TableHeader>Actions</TableHeader>
              </TableRow>
            </TableHead>
            <tbody>
              {filteredProducts.map(product => (
                <TableRow key={product.id}>
                  <TableCell>{product.name}</TableCell>
                  <TableCell>{product.description}</TableCell>
                  <TableCell>
                    <NavigationLinks>
                      <NavLink to={`/coverage/${product.id}`}>Coverages</NavLink>
                      <Separator>|</Separator>
                      <NavLink to={`/pricing/${product.id}`}>Pricing</NavLink>
                      <Separator>|</Separator>
                      <NavLink to="/forms">Forms</NavLink>
                      <Separator>|</Separator>
                      <NavText disabled>Rules</NavText>
                      <Separator>|</Separator>
                      <NavLink to={`/states/${product.id}`}>States</NavLink>
                      <Separator>|</Separator>
                      <NavText disabled>More</NavText>
                    </NavigationLinks>
                  </TableCell>
                  <TableCell>
                    <ActionsContainer>
                      <ActionButton onClick={() => handleEditProduct(product)} title="Edit product">
                        <PencilIcon />
                      </ActionButton>
                      <ActionButton danger onClick={() => handleDeleteProduct(product.id)} title="Delete product">
                        <TrashIcon />
                      </ActionButton>
                    </ActionsContainer>
                  </TableCell>
                </TableRow>
              ))}
            </tbody>
          </Table>
        </TableContainer>
      ) : (
        <NoProductsText>No Products Found</NoProductsText>
      )}
      <FormContainer>
        <FormInput
          type="text"
          placeholder="Product Name"
          value={name}
          onChange={e => setName(e.target.value)}
        />
        <FormInput
          type="text"
          placeholder="Short Description"
          value={description}
          onChange={e => setDescription(e.target.value)}
        />
        <SubmitButton onClick={editingProductId ? handleUpdateProduct : handleAddProduct}>
          {editingProductId ? 'Update Product' : 'Add Product'}
        </SubmitButton>
      </FormContainer>
    </Container>
  );
}

export default ProductHub;