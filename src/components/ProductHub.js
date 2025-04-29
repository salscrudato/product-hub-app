import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import { TrashIcon, PencilIcon } from '@heroicons/react/24/solid';

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
    <div className="min-h-screen bg-dark-bg text-text-white p-6">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Product Repository</h1>
      </header>
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search Products"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full p-3 bg-code-bg text-text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-orange"
        />
      </div>
      <h2 className="text-2xl font-semibold mb-4">Products</h2>
      {filteredProducts.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full table-auto bg-code-bg rounded-lg">
            <thead>
              <tr className="bg-gray-700">
                <th className="p-3 text-left text-sm font-medium">Name</th>
                <th className="p-3 text-left text-sm font-medium">Description</th>
                <th className="p-3 text-left text-sm font-medium">Navigation</th>
                <th className="p-3 text-left text-sm font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map(product => (
                <tr key={product.id} className="border-b border-gray-600 hover:bg-gray-800">
                  <td className="p-3">{product.name}</td>
                  <td className="p-3">{product.description}</td>
                  <td className="p-3">
                    <div className="flex items-center space-x-2">
                      <Link to={`/coverage/${product.id}`} className="text-white hover:underline">Coverages</Link>
                      <span className="text-white">|</span>
                      <Link to={`/pricing/${product.id}`} className="text-white hover:underline">Pricing</Link>
                      <span className="text-white">|</span>
                      <Link to="/forms" className="text-white hover:underline">Forms</Link>
                      <span className="text-white">|</span>
                      <span className="text-gray-500 cursor-not-allowed">Rules</span>
                      <span className="text-white">|</span>
                      <Link to={`/states/${product.id}`} className="text-white hover:underline">States</Link>
                      <span className="text-white">|</span>
                      <span className="text-gray-500 cursor-not-allowed">More</span>
                    </div>
                  </td>
                  <td className="p-3 flex space-x-2">
                    <button onClick={() => handleEditProduct(product)} className="text-blue-500 hover:text-blue-700" title="Edit product">
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button onClick={() => handleDeleteProduct(product.id)} className="text-red-500 hover:text-red-700" title="Delete product">
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-center text-lg">No Products Found</p>
      )}
      <div className="mt-8 flex flex-wrap gap-4">
        <input
          type="text"
          placeholder="Product Name"
          value={name}
          onChange={e => setName(e.target.value)}
          className="flex-1 min-w-[200px] p-3 bg-code-bg text-text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-orange"
        />
        <input
          type="text"
          placeholder="Short Description"
          value={description}
          onChange={e => setDescription(e.target.value)}
          className="flex-1 min-w-[200px] p-3 bg-code-bg text-text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-orange"
        />
        <button
          onClick={editingProductId ? handleUpdateProduct : handleAddProduct}
          className="bg-white text-black px-6 py-3 rounded-lg hover:bg-gray-200 transition-colors"
        >
          {editingProductId ? 'Update Product' : 'Add Product'}
        </button>
      </div>
    </div>
  );
}
export default ProductHub;