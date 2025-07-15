import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Edit, Trash2, ShoppingCart, Package, User, Calendar, X, FileText, Filter, BarChart3, AlertTriangle, DollarSign, TrendingUp } from 'lucide-react';
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
    address?: string; // Added address to customer interface
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
  products: any[];
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

// تعريف نوع جديد للمنتج في الطلب
interface OrderProductForm {
  product: string;
  quantity: string;
  sku: string;
  unitPrice: number;
}

// عرّف نوع العميل للفلتر
interface ClientOption { _id: string; name: string; }

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
  const [customers, setCustomers] = useState<ClientOption[]>([]);
  const [products, setProducts] = useState([]);
  const [editingCell, setEditingCell] = useState<{orderId: string, field: 'status' | 'payment'} | null>(null);
  const [updatingCell, setUpdatingCell] = useState(false);
  const [searchOrder, setSearchOrder] = useState('');
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [customerFilter, setCustomerFilter] = useState('');
  const areFiltersActive = !!(startDate || endDate || customerFilter);
  const fromDateRef = useRef<HTMLInputElement>(null);
  const toDateRef = useRef<HTMLInputElement>(null);
  const [showInvoice, setShowInvoice] = useState(false);
  const [invoiceOrder, setInvoiceOrder] = useState<Order | null>(null);
  const [showFilters, setShowFilters] = useState(false); // <-- حالة إظهار الفلاتر
  const [orderStats, setOrderStats] = useState<any>(null);

  useEffect(() => {
    if (user) {
      if (searchOrder.trim() !== '') {
        if (searchTimeout.current) clearTimeout(searchTimeout.current);
        searchTimeout.current = setTimeout(() => {
          fetchOrders(searchOrder.trim());
        }, 400);
      } else {
        fetchOrders();
      }
      fetchCustomers();
      fetchProducts();
      fetchOrderStats();
    }
  }, [user, page, searchOrder, startDate, endDate, customerFilter]);

  const fetchOrders = async (searchValue?: string) => {
    try {
      const params: any = { page, limit };
      if (searchValue) params.orderNumber = searchValue;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (customerFilter) params.customer = customerFilter;
      const response = await axios.get('/orders', { params });
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
      const response = await axios.get('/products');
      setProducts(response.data.products);
    } catch (error: any) {
      console.error('Error fetching products:', error);
      setProducts([]);
    }
  };

  const fetchOrderStats = async () => {
    if (!user || !user.id) return;
    try {
      const response = await axios.get(`/orders/warehouse/${user.id}/statistics`);
      setOrderStats(response.data.statistics);
    } catch (error) {
      console.error('Error fetching order statistics:', error);
      // تعيين قيم افتراضية في حالة الخطأ
      setOrderStats({
        totalOrders: 0,
        totalSales: 0,
        cancelledOrders: 0,
        avgOrderPrice: 0,
        avgOrderQuantity: 0
      });
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
      let updatedOrder = { ...order, [field]: value };
      // If status is set to 'cancelled', set payment to 'cancelled' automatically
      if (field === 'status' && value === 'cancelled') {
        updatedOrder.payment = 'cancelled';
      }
      await axios.put(`/orders/${order._id}`, updatedOrder);
      setOrders(prev => prev.map(o => o._id === order._id ? { ...o, ...updatedOrder } : o));
      setEditingCell(null);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error.message || 'حدث خطأ أثناء التحديث');
      fetchOrders();
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
    <div className="">
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
          <div className="flex items-center gap-4">
            <div className="relative">
              <input
                type="text"
                value={searchOrder}
                onChange={e => setSearchOrder(e.target.value)}
                placeholder={t('orders.searchByOrderNumber') || 'بحث برقم الطلب'}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm min-w-[180px] pr-8"
                style={{ direction: isRTL ? 'rtl' : 'ltr' }}
              />
              {searchOrder && (
                <button
                  type="button"
                  onClick={() => setSearchOrder('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 focus:outline-none"
                  tabIndex={-1}
                  aria-label={t('common.reset') || 'Reset'}
                  style={{ padding: 0 }}
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={() => setShowFilters(prev => !prev)}
              className="bg-gray-100 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-200 transition-colors duration-200 flex items-center"
              style={{ minWidth: 0 }}
            >
              <Filter className="w-5 h-5" />
              <span className="mx-2">{t('common.filters') || 'فلاتر'}</span>
            </button>
            <button
              onClick={handleAddOrder}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center space-x-2 rtl:space-x-reverse"
            >
              <Plus className="h-5 w-5" />
              <span>{t('orders.addOrder') || 'Add Order'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 my-6">
        <StatCard
          title={t('orders.totalOrders') || 'عدد الطلبات'}
          value={orderStats?.totalOrders?.toLocaleString() || '0'}
          icon={<ShoppingCart className="h-6 w-6" />}
          color="blue"
        />
        <StatCard
          title={t('orders.totalSales') || 'إجمالي المبيعات'}
          value={orderStats?.totalSales?.toLocaleString(undefined, { maximumFractionDigits: 2 }) || '0'}
          unit={t('orders.currency') || 'ر.س'}
          icon={<DollarSign className="h-6 w-6" />}
          color="green"
        />
        <StatCard
          title={t('orders.avgOrderPrice') || 'متوسط سعر الطلب'}
          value={orderStats?.avgOrderPrice?.toLocaleString(undefined, { maximumFractionDigits: 2 }) || '0'}
          unit={t('orders.currency') || 'ر.س'}
          icon={<TrendingUp className="h-6 w-6" />}
          color="indigo"
        />
        <StatCard
          title={t('orders.cancelledOrders') || 'الطلبات الملغاة'}
          value={orderStats?.cancelledOrders?.toLocaleString() || '0'}
          icon={<AlertTriangle className="h-6 w-6" />}
          color="red"
        />
      </div>

      {/* قسم الفلاتر: */}
      {showFilters && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mt-3 mb-6">
          <div className="flex items-center flex-wrap gap-2 justify-between">
            <div className="flex items-center gap-3 flex-wrap">
              <TextField
                type="date"
                label={t('orders.fromDate') || 'من تاريخ'}
                placeholder={t('orders.fromDate') || 'من تاريخ'}
                value={startDate}
                onChange={e => {
                  setStartDate(e.target.value);
                  setPage(1);
                }}
                size="small"
                InputLabelProps={{ shrink: true }}
                sx={{ minWidth: 200 }}
                inputRef={fromDateRef}
                inputProps={{ style: { direction: isRTL ? 'rtl' : 'ltr', textAlign: isRTL ? 'right' : 'left' } }}
                onClick={() => {
                  if (fromDateRef.current) {
                    fromDateRef.current.showPicker?.();
                    fromDateRef.current.focus();
                  }
                }}
              />
              <TextField
                type="date"
                label={t('orders.toDate') || 'إلى تاريخ'}
                placeholder={t('orders.toDate') || 'إلى تاريخ'}
                value={endDate}
                onChange={e => {
                  setEndDate(e.target.value);
                  setPage(1);
                }}
                size="small"
                InputLabelProps={{ shrink: true }}
                sx={{ minWidth: 200 }}
                inputProps={{ min: startDate || undefined, style: { direction: isRTL ? 'rtl' : 'ltr', textAlign: isRTL ? 'right' : 'left' } }}
                inputRef={toDateRef}
                onClick={() => {
                  if (toDateRef.current) {
                    toDateRef.current.showPicker?.();
                    toDateRef.current.focus();
                  }
                }}
              />
              <Autocomplete
                options={customers}
                getOptionLabel={(option: ClientOption) => option.name || ''}
                isOptionEqualToValue={(option: ClientOption, value: ClientOption) => option._id === value._id}
                value={customers.find((c: ClientOption) => c._id === customerFilter) || null}
                onChange={(_, value: ClientOption | null) => {
                  setCustomerFilter(value ? value._id : '');
                  setPage(1);
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    // label={t('orders.customer') || 'العميل'}
                    placeholder={t('orders.customer') || 'العميل'}
                    size="small"
                    sx={{ minWidth: 200 }}
                  />
                )}
                openOnFocus
                clearOnEscape
                filterOptions={(options, state) =>
                  options.filter(option =>
                    option.name.toLowerCase().includes(state.inputValue.toLowerCase())
                  )
                }
                autoHighlight
                onBlur={() => {
                  if (!customers.find(c => c._id === customerFilter)) {
                    setCustomerFilter('');
                  }
                }}
                freeSolo={false}
                dir={isRTL ? 'rtl' : 'ltr'}
              />
            </div>
            <div className={`${isRTL ? 'mr-auto' : 'ml-auto'}`}>
              <button
                type="button"
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                  setCustomerFilter('');
                  setPage(1);
                }}
                className="px-3 py-1 rounded bg-gray-100 border border-gray-300 text-gray-700 transition-colors text-sm disabled:opacity-50 disabled:hover:bg-gray-100 hover:bg-gray-200"
                disabled={!areFiltersActive}
              >
                {t('common.resetFilters') || 'إعادة تعيين الفلاتر'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mt-6">
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
                    {t('orders.orderNo') || 'Order #'}
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
                  {/* New Total Sum column */}
                  <th className={`px-2 py-3 ${isRTL ? 'text-right' : 'text-left'} text-xs font-medium text-gray-500 uppercase tracking-wider`}>
                    {t('orders.totalSum') || 'Total Sum'}
                  </th>
                  <th className={`px-2 py-3 ${isRTL ? 'text-right' : 'text-left'} text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[115px]`}>
                    {t('orders.status') || 'Status'}
                  </th>
                  <th className={`px-2 py-3 ${isRTL ? 'text-right' : 'text-left'} text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]`}>
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
                          {order.customer?.photo ? (
                            <img
                              src={order.customer.photo.startsWith('http') ? order.customer.photo : `http://localhost:5000${order.customer.photo}`}
                              alt={order.customer.name}
                              className="h-full w-full object-cover"
                              onError={e => { e.currentTarget.src = '/logo.png'; }}
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
                      <div className="flex flex-col gap-1">
                        {Array.isArray(order.products) && order.products.length > 0 ? (
                          order.products.map((p: any, idx: number) => (
                            <span key={idx} className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-md">
                              {p.product?.sku || p.sku || p.product?.name}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </div>
                    </td>
                    <td className={`px-2 py-4 ${isRTL ? 'text-right' : 'text-left'}`}>
                      <div className="flex flex-col gap-1">
                        {Array.isArray(order.products) && order.products.length > 0 ? (
                          order.products.map((p: any, idx: number) => (
                            <span key={idx} className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-md">
                              {p.quantity}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </div>
                    </td>
                    <td className={`px-2 py-4 ${isRTL ? 'text-right' : 'text-left'}`}>
                      <div className="flex flex-col gap-1">
                        {Array.isArray(order.products) && order.products.length > 0 ? (
                          order.products.map((p: any, idx: number) => (
                            <span key={idx} className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-md">
                              {Number(p.unitPrice).toFixed(2)}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </div>
                    </td>
                    <td className={`px-2 py-4 ${isRTL ? 'text-right' : 'text-left'}`}>
                      <div className="flex flex-col gap-1">
                        {Array.isArray(order.products) && order.products.length > 0 ? (
                          order.products.map((p: any, idx: number) => (
                            <span key={idx} className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-md">
                              {Number(p.totalPrice).toFixed(2)}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </div>
                    </td>
                    {/* New Total Sum column */}
                    <td className={`px-2 py-4 ${isRTL ? 'text-right' : 'text-left'}`}>
                      <span className="px-2 py-1 text-xs font-bold bg-blue-50 text-blue-800 rounded-md">
                        {Array.isArray(order.products) && order.products.length > 0
                          ? order.products.reduce((sum: number, p: any) => sum + Number(p.totalPrice), 0).toFixed(2)
                          : '-'}
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
                          <option value="cancelled">{t('orders.cancelled') || 'Cancelled'}</option>
                        </select>
                      ) : (
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-md${order.status !== 'confirmed' && order.status !== 'cancelled' ? ' cursor-pointer' : ''} ${getStatusColor(order.status)}`}
                          onClick={order.status !== 'confirmed' && order.status !== 'cancelled' ? () => handleCellClick(order._id, 'status') : undefined}
                          tabIndex={0}
                          style={{ outline: 'none' }}
                        >
                          {t(`orders.${order.status}`) || t('orders.pending') || 'Pending'}
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
                          {/* <option value="cancelled">{t('orders.cancelled') || 'Cancelled'}</option> */}
                        </select>
                      ) : (
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-md${order.payment !== 'paid' && order.payment !== 'cancelled' ? ' cursor-pointer' : ''} ${getPaymentColor(order.payment)}`}
                          onClick={order.payment !== 'paid' && order.payment !== 'cancelled' ? () => handleCellClick(order._id, 'payment') : undefined}
                          tabIndex={0}
                          style={{ outline: 'none' }}
                        >
                          {order.payment === 'cancelled' ? (t('orders.paymentCancelled') || 'Cancelled') : (t(`orders.${order.payment}`) || t('orders.paymentPending') || 'Pending')}
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
                          className="text-blue-600 hover:text-blue-900 transition-colors duration-200 disabled:opacity-30"
                          onClick={() => handleEditOrder(order)}
                          disabled={order.status === 'confirmed' || order.status === 'cancelled'}
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button 
                          className="text-red-600 hover:text-red-900 transition-colors duration-200" 
                          onClick={() => setConfirmDeleteId(order._id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                        {order.status === 'confirmed' && (
                          <button
                            className="text-green-600 hover:text-green-900 transition-colors duration-200"
                            title={t('invoice.showInvoice') || 'عرض الفاتورة'}
                            onClick={() => { setInvoiceOrder(order); setShowInvoice(true); }}
                          >
                            <FileText className="h-4 w-4" />
                          </button>
                        )}
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

      {/* Dialog عرض الفاتورة */}
      {showInvoice && (
        <InvoiceDialog open={showInvoice} onClose={() => setShowInvoice(false)} order={invoiceOrder} user={user} />
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
  const [formData, setFormData] = useState<{
    customer: string;
    warehouse: string;
    payment: string;
    status: string;
    notes?: string;
    shippingAddress?: any;
    expectedDeliveryDate?: string;
    products: OrderProductForm[];
  }>(
    order && Array.isArray((order as any).products)
      ? {
          customer: order.customer?._id || '',
          warehouse: order.warehouse?._id || user.id || '',
          payment: order.payment || 'pending',
          status: order.status || 'pending',
          notes: order.notes,
          shippingAddress: order.shippingAddress,
          expectedDeliveryDate: order.expectedDeliveryDate,
          products: (order as any).products.map((p: any) => ({
            product: p.product?._id || p.product,
            quantity: String(p.quantity),
            sku: p.sku || '',
            unitPrice: p.unitPrice || 0
          }))
        }
      : {
          customer: '',
          warehouse: user.id || '',
          payment: 'pending',
          status: 'pending',
          products: [{ product: '', quantity: '', sku: '', unitPrice: 0 }]
        }
  );
  const [saving, setSaving] = useState(false);
  const [quantityError, setQuantityError] = useState<string | null>(null);

  // التحقق من الكمية عند التغيير
  const handleQuantityChange = (idx: number, value: string) => {
    setFormData((prev) => {
      const updated = [...prev.products];
      updated[idx].quantity = value.replace(/[^0-9]/g, '');
      return { ...prev, products: updated };
    });
  };

  // Auto-set payment to 'cancelled' if status is set to 'cancelled'
  useEffect(() => {
    if (formData.status === 'cancelled' && formData.payment !== 'cancelled') {
      setFormData(prev => ({ ...prev, payment: 'cancelled' }));
    }
  }, [formData.status]);

  // دالة لإضافة منتج جديد
  const handleAddProduct = () => {
    setFormData((prev: any) => ({
      ...prev,
      products: [...prev.products, { product: '', quantity: '', sku: '', unitPrice: 0 }]
    }));
  };

  // دالة لحذف منتج
  const handleRemoveProduct = (idx: number) => {
    setFormData((prev: any) => ({
      ...prev,
      products: prev.products.filter((_: any, i: number) => i !== idx)
    }));
  };

  // دالة لتغيير بيانات منتج
  const handleProductChange = (idx: number, field: string, value: any) => {
    setFormData((prev: any) => {
      const updated = [...prev.products];
      updated[idx] = { ...updated[idx], [field]: value };
      // تحديث sku تلقائياً عند تغيير المنتج
      if (field === 'product') {
        const prod = products.find((p: any) => p._id === value);
        updated[idx].sku = prod ? prod.sku : '';
        // حساب السعر تلقائياً
        let price = prod?.price || 0;
        if (prod?.hasOffer && prod?.offerPrice) price = prod.offerPrice;
        const itemsPerBox = Number(prod?.items_per_box) || 0;
        const length = Number(prod?.length) || 0;
        const width = Number(prod?.width) || 0;
        updated[idx].unitPrice = (length * width / 10000) * itemsPerBox * price;
      }
      return { ...prev, products: updated };
    });
  };

  // عند الحفظ: أرسل المنتجات كمصفوفة
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const dataToSend: any = {
      ...formData,
      products: formData.products.map((p: any) => ({
        ...p,
        quantity: Number(p.quantity)
      }))
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
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between p-6 pb-4">
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

        <form onSubmit={handleSubmit} className="flex flex-col h-full px-6">
          <div className="flex-1 space-y-4 overflow-y-auto">
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
              {t('orders.products') || 'Products'}
            </label>
            {formData.products.map((item: any, idx: number) => {
              // المنتجات المختارة في بقية الصفوف
              const selectedProductIds = formData.products
                .filter((_, i: number) => i !== idx)
                .map((p: any) => p.product)
                .filter(Boolean);
              return (
                <div key={idx} className="flex gap-2 items-end mb-2">
                  <div className="flex-1">
                    <Autocomplete
                      options={products.filter((p: any) =>
                        p.status === 'active' &&
                        Number(p.quantityInBoxes) > 0 &&
                        !selectedProductIds.includes(p._id)
                      )}
                      getOptionLabel={option => (option.sku ? `${option.sku}` : '')}
                      isOptionEqualToValue={(option, value) => option._id === value._id}
                      value={products.find((p: any) => p._id === item.product) || null}
                      onChange={(_, value) => handleProductChange(idx, 'product', value ? value._id : '')}
                      renderInput={(params) => (
                        <TextField {...params} required placeholder={t('orders.selectProduct') || 'Select Product'} InputProps={{ ...params.InputProps, sx: { height: 40 } }} />
                      )}
                      openOnFocus
                      dir={isRTL ? 'rtl' : 'ltr'}
                    />
                  </div>
                  <div className="w-24">
                    <input
                      style={{ height: 40 }}
                      type="number"
                      min="1"
                      placeholder={t('orders.quantity') || 'Quantity'}
                      value={item.quantity}
                      onChange={e => handleQuantityChange(idx, e.target.value)}
                      className={`w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${quantityError ? 'border-red-500' : ''}`}
                      required
                      disabled={!item.product}
                    />
                  </div>
                  <div className="w-28">
                    <input
                      style={{ height: 40 }}
                      type="number"
                      min="0"
                      step="0.01"
                      value={Number(item.unitPrice).toFixed(2)}
                      className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      readOnly
                      disabled
                      required
                    />
                  </div>
                  <button style={{ height: 40 }} disabled={formData.products.length === 1} type="button" onClick={() => handleRemoveProduct(idx)} className="text-red-500 hover:text-red-700 disabled:opacity-50"><Trash2 size={18} /></button>
                </div>
              );
            })}
            <button style={{ height: 40 , width: '100%' , marginTop: 10 , marginBottom: 10 }} type="button" disabled={formData.products.length >= 10} onClick={handleAddProduct} className="mt-2 px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50">
              {t('orders.addProduct') || 'Add Product'}
            </button>
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
        </div>

        <div className="py-6 border-t border-gray-200">
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

// Dialog عرض الفاتورة
const InvoiceDialog: React.FC<{ open: boolean; onClose: () => void; order: Order | null; user: any; }> = ({ open, onClose, order, user }) => {
  const { t, isRTL } = useLanguage();
  if (!open || !order || !user) return null;

  // حساب الإجمالي
  const subtotal = order.products?.reduce((sum: number, p: any) => sum + Number(p.totalPrice), 0) || 0;
  // مثال: خصم أو ضريبة (يمكنك تعديلها حسب الحاجة)
  const discount = 0;
  const taxPercent = 0;
  const tax = subtotal * (taxPercent / 100);
  const total = subtotal - discount + tax;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-30" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-lg w-full max-w-4xl relative overflow-hidden" onClick={e => e.stopPropagation()}>
        <button className="absolute top-4 left-4 text-gray-400 hover:text-red-500" onClick={onClose}><X /></button>
        {/* رأس الفاتورة */}
        <div className="flex items-center justify-between bg-gray-50 px-8 py-6 border-b">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded bg-white flex items-center justify-center overflow-hidden border">
              {user.photo ? (
                <img src={user.photo.startsWith('http') ? user.photo : `http://localhost:5000${user.photo}`} alt={user.name} className="h-full w-full object-cover" />
              ) : (
                <Package className="h-8 w-8 text-blue-600" />
              )}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">{user.name}</h2>
              <div className="text-gray-600 text-sm">{user.address}</div>
              <div className="text-gray-600 text-sm"> {user.phone}</div>
              <div className="text-gray-600 text-sm">{user.email} </div>
              <div className="text-gray-600 text-sm">{user.commercialRecord && <>{t('invoice.cr')}: {user.commercialRecord}</>}</div>
              <div className="text-gray-600 text-sm">{user.taxNumber && <>{t('invoice.taxNumber')}: {user.taxNumber}</>}</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-semibold text-gray-700">{t('invoice.number')} <span className="font-bold">{'#'+order.orderNumber}</span></div>
            <div className="text-gray-500 text-sm">{t('invoice.date')}: {new Date(order.createdAt).toLocaleDateString()}</div>
          </div>
        </div>
        {/* معلومات الطرفين */}
        <div className="flex flex-wrap gap-8 px-8 py-6 border-b bg-white">
          <div className="min-w-[220px]">
            <div className="font-bold text-gray-700 mb-1">{t('invoice.to')}</div>
            <div className="text-gray-800 font-medium">{order.customer?.name}</div>
            <div className="text-gray-600 text-sm">{order.customer?.phone}</div>
            <div className="text-gray-600 text-sm">{order.customer?.email}</div>
            <div className="text-gray-600 text-sm">{order.customer?.address}</div>
          </div>

          <div className="min-w-[220px]">
            <div className="font-bold text-gray-700 mb-1">{t('invoice.shippingAddress')}</div>
            <div className="text-gray-600 text-sm">
              {order.shippingAddress?.street ? order.shippingAddress?.street : '-'}
            </div>
          </div>

          <div className="min-w-[220px]">
            <div className="font-bold text-gray-700 mb-1">{t('invoice.notes')}</div>
            <div className="text-gray-600 text-sm">
              {order.notes ? order.notes : '-'}
            </div>
          </div>
          {/* <div className="min-w-[220px] ml-auto">
            <div className="font-bold text-gray-700 mb-1">{t('invoice.billTo') || 'Bill To:'}</div>
            <div className="text-gray-600 text-sm mt-1">
              <div className="font-bold mb-1">{t('invoice.totalDue') || 'Total Due:'}</div>
              <span className="font-bold">{total.toFixed(2)}</span>
            </div>
            {user.accountNumbers && user.accountNumbers.length > 0 && (
              <div className="text-gray-600 text-sm mt-1">
                <div className="font-bold mb-1">{t('invoice.bankDetails')}</div>
                {user.accountNumbers.map((acc: string, idx: number) => (
                  <div key={idx}>{acc}</div>
                ))}
              </div>
            )}
          </div> */}
        </div>
        {/* جدول المنتجات */}
        <div className="px-8 py-6">
          <table className="min-w-full border rounded-lg overflow-hidden" dir={isRTL ? 'rtl' : 'ltr'}>
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className={`px-3 py-2 text-xs text-gray-500 font-semibold ${isRTL ? 'text-right' : 'text-left'}`}>{t('invoice.item')}</th>
                <th className={`px-3 py-2 text-xs text-gray-500 font-semibold ${isRTL ? 'text-right' : 'text-left'}`}>{t('invoice.description')}</th>
                <th className="px-3 py-2 text-xs text-gray-500 font-semibold text-center">{t('invoice.price')}</th>
                <th className="px-3 py-2 text-xs text-gray-500 font-semibold text-center">{t('invoice.qty')}</th>
                <th className="px-3 py-2 text-xs text-gray-500 font-semibold text-center">{t('invoice.total')}</th>
              </tr>
            </thead>
            <tbody>
              {order.products?.map((p: any, idx: number) => (
                <tr key={idx} className="border-b last:border-b-0 hover:bg-gray-50">
                  <td className="px-3 py-2 text-sm text-gray-900">{p.product?.name || p.sku}</td>
                  <td className={`px-3 py-2 text-sm text-gray-600 ${isRTL ? 'text-right' : 'text-left'}`}>
                    {p.product?.category ? (
                      <>
                        {t(`productTypes.${p.product.category}`) || p.product.category}
                        {p.product.length && p.product.width && (
                          <span className="text-gray-500">
                            {isRTL ? ` (${p.product.length} × ${p.product.width} سم)` : ` (${p.product.length} × ${p.product.width} cm)`}
                          </span>
                        )}
                      </>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="px-3 py-2 text-sm text-center">{Number(p.unitPrice).toFixed(2)}</td>
                  <td className="px-3 py-2 text-sm text-center">{p.quantity}</td>
                  <td className="px-3 py-2 text-sm text-center">{Number(p.totalPrice).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* ملخص الفاتورة */}
        <div className="flex flex-col items-end gap-1 px-8 pb-4">
          <div className="flex gap-8">
            {/* <div className="text-gray-700 min-w-[120px] flex justify-between"><span>{t('invoice.subtotal') || 'Subtotal:'}</span> <span className="font-bold">{subtotal.toFixed(2)}</span></div> */}
            {discount > 0 && <div className="text-gray-700 min-w-[120px] flex justify-between"><span>{t('invoice.discount') || 'Discount:'}</span> <span className="font-bold">{discount.toFixed(2)}</span></div>}
            {taxPercent > 0 && <div className="text-gray-700 min-w-[120px] flex justify-between"><span>{t('invoice.tax') || 'Tax:'}</span> <span className="font-bold">{taxPercent}%</span></div>}
            <div className="text-gray-900 font-bold min-w-[120px] flex justify-between"><span>{t('invoice.total') || 'Total:'}</span> <span>{total.toFixed(2)}</span></div>
          </div>
        </div>
        {/* ملاحظة ختامية */}
        <div className="px-8 pb-6 pt-2 text-xs text-gray-500 border-t flex justify-between items-center">
          <span>{t('invoice.note')}</span>
          <button 
            onClick={() => window.print()}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors duration-200"
          >
            {t('invoice.print')}
          </button>
        </div>
      </div>
    </div>
  );
};

// مكون StatCard لعرض الإحصائيات
const StatCard: React.FC<{
  title: string;
  value: string;
  unit?: string;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'indigo' | 'red' | 'orange';
}> = ({ title, value, unit, icon, color }) => {
  const colorBg = {
    blue: 'bg-blue-50',
    green: 'bg-green-50',
    indigo: 'bg-indigo-50',
    red: 'bg-red-50',
    orange: 'bg-orange-50',
  };
  const colorIcon = {
    blue: 'text-blue-500',
    green: 'text-green-500',
    indigo: 'text-indigo-500',
    red: 'text-red-500',
    orange: 'text-orange-500',
  };
  return (
    <div className="rounded-xl bg-white shadow-sm border border-gray-100 px-6 py-5 flex items-center justify-between min-w-[220px]">
      <div>
        <div className="text-2xl font-semibold text-gray-900 mb-1 flex items-baseline gap-1">
          {value} {unit && <span className="text-base text-gray-400 font-normal">{unit}</span>}
        </div>
        <div className="text-sm text-gray-500 font-medium">{title}</div>
      </div>
      <div className={`flex items-center justify-center w-12 h-12 rounded-full ${colorBg[color]}`}> 
        {React.cloneElement(icon as React.ReactElement, { className: `w-7 h-7 ${colorIcon[color]}` })}
      </div>
    </div>
  );
};

export default Orders;
