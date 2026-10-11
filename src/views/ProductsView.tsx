import React, { useState, useMemo } from 'react';
import {
  Package,
  Plus,
  Search,
  Filter,
  AlertTriangle,
  Edit2,
  Trash2,
  ArrowUpDown,
  History,
  TrendingUp,
  DollarSign,
  CheckCircle,
  X,
  SlidersHorizontal,
  Upload
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useBusiness } from '../context/BusinessContext';
import { Product, StockMovement } from '../types';
import { uploadFileToStorage } from '../lib/firebase';

export const ProductsView: React.FC = () => {
  const { currentBusiness, permissions } = useAuth();
  const { products, addProduct, updateProduct, deleteProduct, adjustStock, stockMovements } = useBusiness();
  const currency = currentBusiness?.currency || '৳';

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [stockFilter, setStockFilter] = useState<'ALL' | 'LOW' | 'OUT'>('ALL');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);
  const [movementProduct, setMovementProduct] = useState<Product | null>(null);

  // Form states for Add/Edit
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [barcode, setBarcode] = useState('');
  const [category, setCategory] = useState('General');
  const [unit, setUnit] = useState('pcs');
  const [purchasePrice, setPurchasePrice] = useState<number>(0);
  const [sellingPrice, setSellingPrice] = useState<number>(0);
  const [currentStock, setCurrentStock] = useState<number>(0);
  const [minStockAlert, setMinStockAlert] = useState<number>(5);
  const [imageUrl, setImageUrl] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  const handleProductImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentBusiness) return;
    setUploadingImage(true);
    try {
      const ext = file.name.split('.').pop() || 'png';
      const path = `businesses/${currentBusiness.id}/products/prod_${Date.now()}.${ext}`;
      const downloadUrl = await uploadFileToStorage(file, path);
      setImageUrl(downloadUrl);
    } catch (err: any) {
      console.error('Error uploading product image:', err);
      alert('Failed to upload product image: ' + (err.message || 'Please try again'));
    } finally {
      setUploadingImage(false);
    }
  };

  // Form states for Stock Adjustment
  const [adjustQty, setAdjustQty] = useState<number>(1);
  const [adjustType, setAdjustType] = useState<StockMovement['type']>('adjustment_in');
  const [adjustNotes, setAdjustNotes] = useState('');

  // Extract distinct categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [products]);

  // Filtered products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.sku.toLowerCase().includes(search.toLowerCase()) ||
        (p.barcode && p.barcode.toLowerCase().includes(search.toLowerCase()));

      const matchCat = selectedCategory === 'ALL' || p.category === selectedCategory;

      let matchStock = true;
      if (stockFilter === 'LOW') {
        matchStock = p.currentStock > 0 && p.currentStock <= p.minStockAlert;
      } else if (stockFilter === 'OUT') {
        matchStock = p.currentStock <= 0;
      }

      return matchSearch && matchCat && matchStock;
    });
  }, [products, search, selectedCategory, stockFilter]);

  const openAddModal = () => {
    setName('');
    setSku('SKU-' + Math.floor(1000 + Math.random() * 9000));
    setBarcode('');
    setCategory('General');
    setUnit('pcs');
    setPurchasePrice(0);
    setSellingPrice(0);
    setCurrentStock(0);
    setMinStockAlert(5);
    setImageUrl('');
    setEditingProduct(null);
    setIsAddModalOpen(true);
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setName(p.name);
    setSku(p.sku);
    setBarcode(p.barcode || '');
    setCategory(p.category);
    setUnit(p.unit);
    setPurchasePrice(p.purchasePrice);
    setSellingPrice(p.sellingPrice);
    setCurrentStock(p.currentStock);
    setMinStockAlert(p.minStockAlert);
    setImageUrl(p.imageUrl || '');
    setIsAddModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingProduct) {
      await updateProduct(editingProduct.id, {
        name: name.trim(),
        sku: sku.trim(),
        barcode: barcode.trim() || undefined,
        category: category.trim(),
        unit: unit.trim(),
        purchasePrice: Number(purchasePrice),
        sellingPrice: Number(sellingPrice),
        minStockAlert: Number(minStockAlert),
        imageUrl: imageUrl.trim() || undefined,
      });
    } else {
      await addProduct({
        name: name.trim(),
        sku: sku.trim(),
        barcode: barcode.trim() || undefined,
        category: category.trim(),
        unit: unit.trim(),
        purchasePrice: Number(purchasePrice),
        sellingPrice: Number(sellingPrice),
        currentStock: Number(currentStock),
        openingStock: Number(currentStock),
        minStockAlert: Number(minStockAlert),
        imageUrl: imageUrl.trim() || undefined,
      });
    }
    setIsAddModalOpen(false);
  };

  const handleStockAdjustmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingProduct || adjustQty <= 0) return;
    await adjustStock(adjustingProduct.id, adjustQty, adjustType, adjustNotes.trim());
    setAdjustingProduct(null);
    setAdjustQty(1);
    setAdjustNotes('');
  };

  const handleDeleteProduct = async (p: Product) => {
    if (confirm(`Are you sure you want to permanently delete "${p.name}"?`)) {
      await deleteProduct(p.id);
    }
  };

  // Stock summary totals
  const totalStockQty = products.reduce((sum, p) => sum + p.currentStock, 0);
  const totalValuation = products.reduce((sum, p) => sum + p.currentStock * p.purchasePrice, 0);
  const potentialRevenue = products.reduce((sum, p) => sum + p.currentStock * p.sellingPrice, 0);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Products & Inventory</h1>
          <p className="text-xs text-slate-400">
            Manage your store items, barcode scans, purchase/selling margins, and stock movements.
          </p>
        </div>

        {permissions.canManageInventory && (
          <button
            onClick={openAddModal}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center space-x-2 shadow-lg shadow-emerald-950/40 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Product</span>
          </button>
        )}
      </div>

      {/* Inventory Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 font-medium">Total Items in Stock</div>
            <div className="text-2xl font-black text-white mt-0.5 font-mono">
              {totalStockQty.toLocaleString()} units
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
            <Package className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 font-medium">Stock Valuation (Cost)</div>
            <div className="text-2xl font-black text-emerald-400 mt-0.5 font-mono">
              {currency}{totalValuation.toLocaleString()}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 font-medium">Potential Sales Value</div>
            <div className="text-2xl font-black text-teal-400 mt-0.5 font-mono">
              {currency}{potentialRevenue.toLocaleString()}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products by name, SKU, or barcode..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="ALL">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          {/* Stock Filter Pills */}
          <div className="flex bg-slate-950 border border-slate-800 rounded-xl p-1 text-xs">
            <button
              onClick={() => setStockFilter('ALL')}
              className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                stockFilter === 'ALL' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setStockFilter('LOW')}
              className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                stockFilter === 'LOW' ? 'bg-amber-500/20 text-amber-300' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Low Stock
            </button>
            <button
              onClick={() => setStockFilter('OUT')}
              className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                stockFilter === 'OUT' ? 'bg-rose-500/20 text-rose-300' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Out of Stock
            </button>
          </div>
        </div>
      </div>

      {/* Product Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-16 text-slate-500 text-xs">
            <Package className="w-12 h-12 mx-auto mb-3 text-slate-600" />
            <p className="text-sm font-semibold text-slate-400">No products found</p>
            <p className="mt-1">Add items or change your search filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/50 text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4">Item & SKU</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3 text-right">Cost Price</th>
                  <th className="py-3 px-3 text-right">Selling Price</th>
                  <th className="py-3 px-3 text-right">Margin</th>
                  <th className="py-3 px-3 text-center">Stock Level</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredProducts.map((p) => {
                  const margin = p.sellingPrice > 0 ? (((p.sellingPrice - p.purchasePrice) / p.sellingPrice) * 100).toFixed(0) : 0;
                  const isLow = p.currentStock > 0 && p.currentStock <= p.minStockAlert;
                  const isOut = p.currentStock <= 0;

                  return (
                    <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-3">
                          {p.imageUrl ? (
                            <img
                              src={p.imageUrl}
                              alt={p.name}
                              className="w-9 h-9 object-cover rounded-lg border border-slate-800 shrink-0"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-lg bg-slate-800 text-slate-400 flex items-center justify-center font-bold text-xs shrink-0">
                              {p.name.substring(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div className="font-bold text-white text-sm">{p.name}</div>
                            <div className="text-[11px] text-slate-400 font-mono">
                              SKU: {p.sku} {p.barcode ? `• Barcode: ${p.barcode}` : ''}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-3">
                        <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md font-medium text-[11px]">
                          {p.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono font-medium text-slate-300">
                        {currency}{p.purchasePrice.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono font-bold text-emerald-400">
                        {currency}{p.sellingPrice.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-3 text-right">
                        <span className="text-[11px] text-teal-400 font-mono font-semibold">
                          +{margin}%
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        {isOut ? (
                          <span className="inline-flex items-center space-x-1 text-[11px] bg-rose-500/20 text-rose-400 font-bold px-2.5 py-0.5 rounded-full">
                            <span>0 {p.unit} (Out)</span>
                          </span>
                        ) : isLow ? (
                          <span className="inline-flex items-center space-x-1 text-[11px] bg-amber-500/20 text-amber-400 font-bold px-2.5 py-0.5 rounded-full">
                            <AlertTriangle className="w-3 h-3" />
                            <span>{p.currentStock} {p.unit} (Low)</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 text-[11px] bg-emerald-500/20 text-emerald-400 font-bold px-2.5 py-0.5 rounded-full">
                            <span>{p.currentStock} {p.unit}</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          {/* Stock Adjustment button */}
                          <button
                            onClick={() => {
                              setAdjustingProduct(p);
                              setAdjustQty(1);
                              setAdjustNotes('');
                            }}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors"
                            title="Adjust Stock (Damage / Correction)"
                          >
                            <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-400" />
                          </button>

                          {/* Movement history */}
                          <button
                            onClick={() => setMovementProduct(p)}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors"
                            title="Stock Movement History"
                          >
                            <History className="w-3.5 h-3.5 text-indigo-400" />
                          </button>

                          {/* Edit button */}
                          {permissions.canManageInventory && (
                            <button
                              onClick={() => openEditModal(p)}
                              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors"
                              title="Edit Product"
                            >
                              <Edit2 className="w-3.5 h-3.5 text-amber-400" />
                            </button>
                          )}

                          {/* Delete button */}
                          {permissions.canDeleteRecords && (
                            <button
                              onClick={() => handleDeleteProduct(p)}
                              className="p-1.5 bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 rounded-lg transition-colors"
                              title="Delete Product"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Product Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative my-8">
            <div className="flex justify-between items-center pb-4 border-b border-slate-800 mb-5">
              <h3 className="font-bold text-lg text-white">
                {editingProduct ? 'Edit Product Item' : 'Add New Product'}
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Miniket Rice 25kg Bag"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    SKU Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Barcode (Optional)
                  </label>
                  <input
                    type="text"
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    placeholder="89012345678"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="e.g. Groceries"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Unit
                  </label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="pcs">Pieces (pcs)</option>
                    <option value="kg">Kilograms (kg)</option>
                    <option value="box">Box</option>
                    <option value="carton">Carton</option>
                    <option value="bag">Bag</option>
                    <option value="ltr">Litre (ltr)</option>
                    <option value="doz">Dozen</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Purchase / Cost Price ({currency}) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    required
                    value={purchasePrice}
                    onChange={(e) => setPurchasePrice(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Selling Price ({currency}) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    required
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {!editingProduct && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Opening Stock (Initial Qty)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={currentStock}
                      onChange={(e) => setCurrentStock(parseInt(e.target.value) || 0)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Min Alert Threshold
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={minStockAlert}
                      onChange={(e) => setMinStockAlert(parseInt(e.target.value) || 0)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Product Image (Storage Upload & URL)
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://... or upload image"
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                  <label className="cursor-pointer bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors border border-slate-700 shrink-0">
                    <Upload className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{uploadingImage ? 'Uploading...' : 'Upload'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleProductImageFileChange}
                      className="hidden"
                      disabled={uploadingImage}
                    />
                  </label>
                </div>
                {imageUrl && (
                  <div className="mt-2 flex items-center space-x-2">
                    <img
                      src={imageUrl}
                      alt="Product preview"
                      className="w-10 h-10 rounded-lg object-cover bg-slate-950 border border-slate-800"
                    />
                    <span className="text-[11px] text-emerald-400 truncate max-w-xs">
                      Product image ready
                    </span>
                  </div>
                )}
              </div>

              <div className="pt-4 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-5 py-2 rounded-xl text-xs shadow-md"
                >
                  {editingProduct ? 'Save Changes' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock Adjustment Modal */}
      {adjustingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="font-bold text-base text-white mb-1">Adjust Inventory Stock</h3>
            <p className="text-xs text-slate-400 mb-4">
              Item: <strong className="text-white">{adjustingProduct.name}</strong> • Current Stock: {adjustingProduct.currentStock} {adjustingProduct.unit}
            </p>

            <form onSubmit={handleStockAdjustmentSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Adjustment Type
                </label>
                <select
                  value={adjustType}
                  onChange={(e) => setAdjustType(e.target.value as StockMovement['type'])}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="adjustment_in">Correction In (+) Add extra items</option>
                  <option value="adjustment_out">Correction Out (-) Reduce items</option>
                  <option value="damaged">Damaged Goods (-)</option>
                  <option value="lost">Lost / Missing Goods (-)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Quantity
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(parseInt(e.target.value) || 1)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Reason / Notes
                </label>
                <input
                  type="text"
                  required
                  value={adjustNotes}
                  onChange={(e) => setAdjustNotes(e.target.value)}
                  placeholder="e.g. Water damage during transport, physical count discrepancy"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setAdjustingProduct(null)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-5 py-2 rounded-xl text-xs shadow-md"
                >
                  Confirm Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock Movement History Modal */}
      {movementProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800 mb-4">
              <div>
                <h3 className="font-bold text-base text-white">Stock Movement Audit Trail</h3>
                <p className="text-xs text-slate-400">{movementProduct.name} (SKU: {movementProduct.sku})</p>
              </div>
              <button
                onClick={() => setMovementProduct(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto flex-1">
              {stockMovements.filter((m) => m.productId === movementProduct.id).length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-xs">
                  No stock movement history recorded for this item yet.
                </div>
              ) : (
                <div className="space-y-2">
                  {stockMovements
                    .filter((m) => m.productId === movementProduct.id)
                    .map((m) => (
                      <div
                        key={m.id}
                        className="p-3 bg-slate-950 border border-slate-800/80 rounded-xl flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="font-semibold text-slate-200 capitalize">
                            {m.type.replace('_', ' ')}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {m.notes || 'N/A'} • by {m.createdBy}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            {new Date(m.createdAt).toLocaleString()}
                          </div>
                        </div>
                        <div className="text-right font-mono font-bold">
                          {m.type === 'sale' || m.type === 'adjustment_out' || m.type === 'damaged' || m.type === 'lost' || m.type === 'purchase_return' ? (
                            <span className="text-rose-400">-{m.quantity} {movementProduct.unit}</span>
                          ) : (
                            <span className="text-emerald-400">+{m.quantity} {movementProduct.unit}</span>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-800 text-right">
              <button
                onClick={() => setMovementProduct(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
