import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Edit, Trash2, ShoppingCart, Package, User, Calendar } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import Drawer from '@mui/material/Drawer';
import { createPortal } from 'react-dom';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import { useTheme } from '../contexts/ThemeContext';

interface Order {
  _id: string;
  orderNumber: string;
  customer: {
    _id: string;
    name: string;
    email: string;
    phone: string;
    image?: string;
    photo?: string;
  };
  product: {
    _id: string;
    name: string;
    sku: string;
    image?: string;
    category?: string;
    hasOffer?: boolean;
    offerPrice?: number;
    items_per_box?: number;
    length?: number;
    width?: number;
    price?: number;
  };
  warehouse: {
    _id: string;
    name: string;
  };
  quantity: number;
  sku: string;
  unitPrice: number;
  totalPrice: number;
  payment: string;
  status: string;
  notes?: string;
  shippingAddress?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  expectedDeliveryDate?: string;
  actualDeliveryDate?: string;
  createdAt: string;
  updatedAt: string;
}

interface OrderFormData {
  customer: string;
  product: string;
  warehouse: string;
  quantity: string;
  sku: string;
  unitPrice: number;
  payment: string;
  status: string;
  notes?: string;
  shippingAddress?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  expectedDeliveryDate?: string;
}

const Orders: React.FC = () => {
  const { t, isRTL } = useLanguage();
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;
  const [showModal, setShowModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [editingCell, setEditingCell] = useState<{orderId: string, field: 'status' | 'payment'} | null>(null);
  const [updatingCell, setUpdatingCell] = useState(false);

  useEffect(() => {
    if (user) {
      fetchOrders();
      fetchCustomers();
      fetchProducts();
    }
  }, [user, page]);

  const fetchOrders = async () => {
    try {
      const response = await axios.get('/orders', { params: { page, limit } });
      setOrders(response.data.orders);
      setTotalPages(Math.ceil((response.data.count || 1) / limit));
    } catch (error: any) {
      toast.error(t('messages.networkError'));
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await axios.get('/clients');
      setCustomers(response.data.clients);
    } catch (error: any) {
      console.error('Error fetching customers:', error);
    }
  };

  const fetchProducts = async () => {
    if (!user) return;
    try {
      const response = await axios.get(`/products/warehouse/${user.id}`);
      setProducts(response.data.products);
    } catch (error: any) {
      console.error('Error fetching products:', error);
      setProducts([]);
    }
  };

  const handleAddOrder = () => {
    setEditingOrder(null);
    setShowModal(true);
  };

  const handleEditOrder = (order: Order) => {
    setEditingOrder(order);
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditingOrder(null);
  };

  const handleOrderSaved = () => {
    fetchOrders();
    handleModalClose();
  };

  const handleDeleteOrder = async (id: string) => {
    setDeleting(true);
    try {
      await axios.delete(`/orders/${id}`);
      toast.success(t('messages.orderDeleted') || 'Order deleted');
      fetchOrders();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error.message || 'حدث خطأ أثناء الحذف');
    } finally {
      setDeleting(false);
      setConfirmDeleteId(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'shipped':
        return 'bg-purple-100 text-purple-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentColor = (payment: string) => {
    switch (payment?.toLowerCase()) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleCellClick = (orderId: string, field: 'status' | 'payment') => {
    setEditingCell({ orderId, field });
  };

  const handleCellChange = async (order: Order, field: 'status' | 'payment', value: string) => {
    // Prevent changing status from 'confirmed' to 'pending'
    if (field === 'status' && order.status === 'confirmed' && value === 'pending') {
      toast.error(t('orders.cannotRevertConfirmed') || 'Cannot change status from Confirmed back to Pending');
      setEditingCell(null);
      return;
    }
    setUpdatingCell(true);
    try {
      await axios.put(`/orders/${order._id}`, { ...order, [field]: value });
      setOrders(prev => prev.map(o => o._id === order._id ? { ...o, [field]: value } : o));
      setEditingCell(null);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error.message || 'حدث خطأ أثناء التحديث');
    } finally {
      setUpdatingCell(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 rtl:space-x-reverse">
            <div className="bg-blue-100 p-3 rounded-lg">
              <ShoppingCart className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {t('orders.title') || 'Orders'}
              </h1>
            </div>
          </div>
          <button
            onClick={handleAddOrder}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center space-x-2 rtl:space-x-reverse"
          >
            <Plus className="h-5 w-5" />
            <span>{t('orders.addOrder') || 'Add Order'}</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          {orders.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">{t('orders.noOrders') || 'No orders found.'}</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200 border-b border-gray-200" dir={isRTL ? 'rtl' : 'ltr'}>
              <thead className="bg-gray-50">
                <tr>
                  <th className={`px-2 py-3 ${isRTL ? 'text-right' : 'text-left'} text-xs font-medium text-gray-500 uppercase tracking-wider`}>
                    {t('orders.orderNumber') || 'Order #'}
                  </th>
                  <th className={`px-2 py-3 ${isRTL ? 'text-right' : 'text-left'} text-xs font-medium text-gray-500 uppercase tracking-wider`}>
                    {t('orders.customer') || 'Customer'}
                  </th>
                  <th className={`px-2 py-3 ${isRTL ? 'text-right' : 'text-left'} text-xs font-medium text-gray-500 uppercase tracking-wider`}>
                    {t('orders.product') || 'Product'}
                  </th>
                  <th className={`px-2 py-3 ${isRTL ? 'text-right' : 'text-left'} text-xs font-medium text-gray-500 uppercase tracking-wider`}>
                    {t('orders.quantity') || 'Quantity'}
                  </th>
                  <th className={`px-2 py-3 ${isRTL ? 'text-right' : 'text-left'} text-xs font-medium text-gray-500 uppercase tracking-wider`}>
                    {t('orders.unitPrice') || 'Unit Price'}
                  </th>
                  <th className={`px-2 py-3 ${isRTL ? 'text-right' : 'text-left'} text-xs font-medium text-gray-500 uppercase tracking-wider`}>
                    {t('orders.totalPrice') || 'Total Price'}
                  </th>
                  <th className={`px-2 py-3 ${isRTL ? 'text-right' : 'text-left'} text-xs font-medium text-gray-500 uppercase tracking-wider`}>
                    {t('orders.status') || 'Status'}
                  </th>
                  <th className={`px-2 py-3 ${isRTL ? 'text-right' : 'text-left'} text-xs font-medium text-gray-500 uppercase tracking-wider`}>
                    {t('orders.payment') || 'Payment'}
                  </th>
                  <th className={`px-2 py-3 ${isRTL ? 'text-right' : 'text-left'} text-xs font-medium text-gray-500 uppercase tracking-wider`}>
                    {t('orders.date') || 'Date'}
                  </th>
                  <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('warehouse.actions') || 'Actions'}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orders.map((order) => (
                  <tr key={order._id} className="transition-colors duration-200 hover:bg-gray-50">
                    <td className={`px-2 py-4 whitespace-nowrap ${isRTL ? 'text-right' : 'text-left'}`}>
                      <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-md">
                        {order.orderNumber}
                      </span>
                    </td>
                    <td className={`px-2 py-4 ${isRTL ? 'text-right' : 'text-left'}`}>
                      <div className="flex items-center space-x-3 rtl:space-x-reverse">
                        <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                          {order.customer?.image || order.customer?.photo ? (
                            <img
                              src={order.customer.image ? (order.customer.image.startsWith('http') ? order.customer.image : `http://localhost:5000${order.customer.image}`) : `http://localhost:5000${order.customer.photo}`}
                              alt={order.customer.name}
                              className="h-full w-full object-cover"
                              onError={e => { e.currentTarget.src = '/no-image.png'; }}
                            />
                          ) : (
                            <User className="h-4 w-4 text-gray-600" />
                          )}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{order.customer?.name}</div>
                          <div className="text-sm text-gray-500">{order.customer?.phone}</div>
                        </div>
                      </div>
                    </td>
                    <td className={`px-2 py-4 ${isRTL ? 'text-right' : 'text-left'}`}>
                      <div className="flex items-center space-x-3 rtl:space-x-reverse">
                        <div className="h-8 w-8 rounded-lg bg-gray-100 overflow-hidden">
                          {order.product?.image ? (
                            <img
                              src={order.product.image.startsWith('http') ? order.product.image : `http://localhost:5000${order.product.image}`}
                              alt={order.product.sku}
                              className="h-full w-full object-cover"
                              onError={e => { e.currentTarget.src = '/no-image.png'; }}
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center">
                              <Package className="h-4 w-4 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{order.product?.name}</div>
                          <div className="text-sm text-gray-500">{order.sku}</div>
                          {order.product?.category && (
                            <div className="text-xs text-gray-400 mt-0.5">{t(`material.${order.product.category}`) || order.product.category}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className={`px-2 py-4 ${isRTL ? 'text-right' : 'text-left'}`}>
                      <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-md">
                        {order.quantity}
                      </span>
                    </td>
                    <td className={`px-2 py-4 ${isRTL ? 'text-right' : 'text-left'}`}>
                      <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-md">
                        {(() => {
                          const itemsPerBox = Number(order.product?.items_per_box) || 0;
                          const length = Number(order.product?.length) || 0;
                          const width = Number(order.product?.width) || 0;
                          let price = Number(order.product?.price) || 0;
                          if (order.product?.hasOffer && order.product?.offerPrice) {
                            price = Number(order.product.offerPrice);
                          }
                          const calculatedUnitPrice = (length * width / 10000) * itemsPerBox * price;
                          return calculatedUnitPrice.toFixed(2);
                        })()}
                      </span>
                    </td>
                    <td className={`px-2 py-4 ${isRTL ? 'text-right' : 'text-left'}`}>
                      <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-md">
                        {(() => {
                          const itemsPerBox = Number(order.product?.items_per_box) || 0;
                          const length = Number(order.product?.length) || 0;
                          const width = Number(order.product?.width) || 0;
                          let price = Number(order.product?.price) || 0;
                          if (order.product?.hasOffer && order.product?.offerPrice) {
                            price = Number(order.product.offerPrice);
                          }
                          const calculatedUnitPrice = (length * width / 10000) * itemsPerBox * price;
                          return (order.quantity * calculatedUnitPrice).toFixed(2);
                        })()}
                      </span>
                    </td>
                    <td className={`px-2 py-4 ${isRTL ? 'text-right' : 'text-left'}`}>
                      {editingCell && editingCell.orderId === order._id && editingCell.field === 'status' ? (
                        <select
                          className="px-2 py-1 text-xs font-medium rounded-md border border-gray-300 focus:outline-none"
                          value={order.status}
                          disabled={updatingCell}
                          autoFocus
                          onBlur={() => setEditingCell(null)}
                          onChange={e => handleCellChange(order, 'status', e.target.value)}
                        >
                          <option value="pending" disabled={order.status === 'confirmed'}>{t('orders.pending') || 'Pending'}</option>
                          <option value="confirmed">{t('orders.confirmed') || 'Confirmed'}</option>
                        </select>
                      ) : (
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-md${order.status !== 'confirmed' ? ' cursor-pointer' : ''} ${getStatusColor(order.status)}`}
                          onClick={order.status !== 'confirmed' ? () => handleCellClick(order._id, 'status') : undefined}
                          tabIndex={0}
                          style={{ outline: 'none' }}
                        >
                          {order.status || 'Pending'}
                        </span>
                      )}
                    </td>
                    <td className={`px-2 py-4 ${isRTL ? 'text-right' : 'text-left'}`}>
                      {editingCell && editingCell.orderId === order._id && editingCell.field === 'payment' ? (
                        <select
                          className="px-2 py-1 text-xs font-medium rounded-md border border-gray-300 focus:outline-none"
                          value={order.payment}
                          disabled={updatingCell}
                          autoFocus
                          onBlur={() => setEditingCell(null)}
                          onChange={e => handleCellChange(order, 'payment', e.target.value)}
                        >
                          <option value="pending">{t('orders.paymentPending') || 'Pending'}</option>
                          <option value="paid">{t('orders.paid') || 'Paid'}</option>
                        </select>
                      ) : (
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-md${order.payment !== 'paid' ? ' cursor-pointer' : ''} ${getPaymentColor(order.payment)}`}
                          onClick={order.payment !== 'paid' ? () => handleCellClick(order._id, 'payment') : undefined}
                          tabIndex={0}
                          style={{ outline: 'none' }}
                        >
                          {order.payment || 'Pending'}
                        </span>
                      )}
                    </td>
                    <td className={`px-2 py-4 ${isRTL ? 'text-right' : 'text-left'}`}>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 text-gray-400 me-2" />
                        <div className="flex flex-col">
                          <span className="text-sm text-gray-900">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-2 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center space-x-2 rtl:space-x-reverse">
                        <button 
                          className="text-blue-600 hover:text-blue-900 transition-colors duration-200" 
                          onClick={() => handleEditOrder(order)}
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button 
                          className="text-red-600 hover:text-red-900 transition-colors duration-200" 
                          onClick={() => setConfirmDeleteId(order._id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t('common.previous') || 'Previous'}
              </button>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t('common.next') || 'Next'}
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  {t('common.showing') || 'Showing'} <span className="font-medium">{(page - 1) * limit + 1}</span> {t('common.to') || 'to'} <span className="font-medium">{Math.min(page * limit, orders.length)}</span> {t('common.of') || 'of'} <span className="font-medium">{orders.length}</span> {t('common.results') || 'results'}
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {t('common.previous') || 'Previous'}
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = Math.max(1, Math.min(totalPages - 4, page - 2)) + i;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          page === pageNum
                            ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {t('common.next') || 'Next'}
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Order Modal */}
      {showModal && createPortal(
        <OrderModal
          order={editingOrder}
          customers={customers}
          products={products}
          warehouses={[]}
          user={user}
          onClose={handleModalClose}
          onSaved={handleOrderSaved}
        />,
        document.body
      )}

      {/* Delete Confirmation Modal */}
      {confirmDeleteId && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-lg">
            <h2 className="text-lg font-bold mb-4 text-center">{t('orders.confirmDelete') || 'Confirm Delete'}</h2>
            <p className="mb-6 text-center">{t('orders.deleteMessage') || 'Are you sure you want to delete this order? This action cannot be undone.'}</p>
            <div className="flex justify-between gap-2">
              <button
                className="flex-1 bg-gray-200 text-gray-700 py-2 rounded hover:bg-gray-300"
                onClick={() => setConfirmDeleteId(null)}
                disabled={deleting}
              >
                {t('common.cancel') || 'Cancel'}
              </button>
              <button
                className="flex-1 bg-red-600 text-white py-2 rounded hover:bg-red-700"
                onClick={() => handleDeleteOrder(confirmDeleteId)}
                disabled={deleting}
              >
                {deleting ? (t('common.deleting') || 'Deleting...') : (t('common.delete') || 'Delete')}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

// Order Modal Component
interface OrderModalProps {
  order: Order | null;
  customers: any[];
  products: any[];
  warehouses: any[];
  user: any;
  onClose: () => void;
  onSaved: () => void;
}

const OrderModal: React.FC<OrderModalProps> = ({ order, customers, products, warehouses, user, onClose, onSaved }) => {
  const { t, isRTL } = useLanguage();
  const { theme } = useTheme();
  const [formData, setFormData] = useState<OrderFormData>({
    customer: order?.customer?._id || '',
    product: order?.product?._id || '',
    warehouse: order?.warehouse?._id || user.id || '',
    quantity: typeof order?.quantity === 'number' && !isNaN(order.quantity) ? String(order.quantity) : '',
    sku: order?.sku || '',
    unitPrice: typeof order?.unitPrice === 'number' && !isNaN(order.unitPrice) ? order.unitPrice : 0,
    payment: order?.payment || 'pending',
    status: order?.status || 'pending',
    notes: order?.notes,
    shippingAddress: order?.shippingAddress,
    expectedDeliveryDate: order?.expectedDeliveryDate
  });
  const [saving, setSaving] = useState(false);
  const [quantityError, setQuantityError] = useState<string | null>(null);

  // احصل على المنتج المختار
  const selectedProduct = products.find(p => p._id === formData.product);

  // حساب unitPrice حسب المعادلة المطلوبة
  React.useEffect(() => {
    if (selectedProduct) {
      let price = Number(selectedProduct.price) || 0;
      // استخدم offerPrice إذا كان عليه عرض
      if (selectedProduct.hasOffer && selectedProduct.offerPrice) {
        price = Number(selectedProduct.offerPrice);
      }
      const itemsPerBox = Number(selectedProduct.items_per_box) || 0;
      const length = Number(selectedProduct.length) || 0;
      const width = Number(selectedProduct.width) || 0;
      const calculatedUnitPrice = (length * width / 10000) * itemsPerBox * price;
      setFormData(prev => ({ ...prev, unitPrice: calculatedUnitPrice }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.product]);

  // التحقق من الكمية عند التغيير
  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    if (selectedProduct && selectedProduct.quantityInBoxes !== undefined) {
      if (Number(value) > selectedProduct.quantityInBoxes) {
        setQuantityError(
          isRTL
            ? `الحد الأقصى للكمية هو ${selectedProduct.quantityInBoxes}`
            : `Maximum available quantity is ${selectedProduct.quantityInBoxes}`
        );
      } else {
        setQuantityError(null);
      }
    } else {
      setQuantityError(null);
    }
    setFormData({ ...formData, quantity: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (quantityError) {
      toast.error(isRTL ? 'يرجى تصحيح الكمية قبل الحفظ' : 'Please correct the quantity before saving');
      return;
    }
    setSaving(true);
    const dataToSend: any = {
      ...formData,
      quantity: Number(formData.quantity),
      totalPrice: Number(formData.quantity) * Number(formData.unitPrice)
    };
    try {
      if (order) {
        await axios.put(`/orders/${order._id}`, dataToSend);
        toast.success(t('messages.orderUpdated') || 'Order updated successfully');
      } else {
        await axios.post('/orders', dataToSend);
        toast.success(t('messages.orderCreated') || 'Order created successfully');
      }
      onSaved();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error.message || 'حدث خطأ أثناء الحفظ');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Drawer
      anchor={isRTL ? 'left' : 'right'}
      open={true}
      onClose={onClose}
      className="z-50"
      PaperProps={{
        className: 'w-full max-w-2xl',
        sx: {
          backgroundColor: theme === 'dark' ? '#23232a' : '#fff',
          color: theme === 'dark' ? '#fff' : '#1a202c'
        }
      }}
    >
      <div className="p-6 h-full overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            {order ? (t('orders.editOrder') || 'Edit Order') : (t('orders.addOrder') || 'Add Order')}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('orders.customer') || 'Customer'}
            </label>
            <Autocomplete
              options={customers}
              getOptionLabel={option => option.name }
              isOptionEqualToValue={(option, value) => option._id === value._id}
              value={customers.find(c => c._id === formData.customer) || null}
              onChange={(_, value) => setFormData({ ...formData, customer: value ? value._id : '' })}
              renderInput={(params) => (
                <TextField {...params} required placeholder={t('orders.selectCustomer') || 'Select Customer'} InputProps={{ ...params.InputProps, sx: { height: 40 } }} />
              )}
              openOnFocus
              dir={isRTL ? 'rtl' : 'ltr'}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('orders.product') || 'Product'}
            </label>
            <Autocomplete
              options={products.filter(p => p.status === 'active' && Number(p.quantityInBoxes) > 0)}
              getOptionLabel={option => (option.sku ? `${option.sku}` : '')}
              isOptionEqualToValue={(option, value) => option._id === value._id}
              value={products.find(p => p._id === formData.product) || null}
              onChange={(_, value) => setFormData({
                ...formData,
                product: value ? value._id : '',
                sku: value ? value.sku : '',
                // لا تحسب السعر هنا، سيحسب تلقائياً في useEffect
                // unitPrice: value ? value.price : 0
              })}
              renderInput={(params) => (
                <TextField {...params} required placeholder={t('orders.selectProduct') || 'Select Product'} InputProps={{ ...params.InputProps, sx: { height: 40 } }} />
              )}
              openOnFocus
              dir={isRTL ? 'rtl' : 'ltr'}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('orders.quantity') || 'Quantity'}
            </label>
            <input
              type="number"
              min="1"
              placeholder={t('orders.quantity') || 'Enter quantity...'}
              value={formData.quantity}
              onChange={handleQuantityChange}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${quantityError ? 'border-red-500' : ''}`}
              required
              disabled={!formData.product}
            />
            {quantityError && (
              <div className="text-red-500 text-xs mt-1">{quantityError}</div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('orders.unitPrice') || 'Unit Price'}
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={Number(formData.unitPrice).toFixed(2)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              readOnly
              disabled
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('orders.totalPrice') || 'Total Price'}
            </label>
            <div className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-gray-900 font-medium">
              {(Number(formData.quantity) * Number(formData.unitPrice)).toFixed(2)}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('orders.shippingAddress') || 'Shipping Address'}
            </label>
            <textarea
              value={formData.shippingAddress?.street || ''}
              onChange={(e) => setFormData({ 
                ...formData, 
                shippingAddress: { 
                  ...formData.shippingAddress, 
                  street: e.target.value 
                } 
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={1}
              placeholder={t('orders.shippingAddress') || 'Enter shipping address...'}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('orders.notes') || 'Notes'}
            </label>
            <textarea
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={2}
              placeholder={t('orders.notes') || 'Add any notes here...'}
            />
          </div>

          <div className="flex justify-end space-x-3 rtl:space-x-reverse pt-4">
            {/* <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              {t('common.cancel') || 'Cancel'}
            </button> */}
            <button
              type="submit"
              disabled={saving}
              className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? (t('common.saving') || 'Saving...') : (t('common.save') || 'Save')}
            </button>
          </div>
        </form>
      </div>
    </Drawer>
  );
};

export default Orders;
