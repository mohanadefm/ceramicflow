import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  Phone,
  Calendar,
  DollarSign,
  ShoppingCart,
  User,
  X,
  Upload,
  Eye,
  BarChart3,
  Warehouse,
  Crown
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import Drawer from '@mui/material/Drawer';
import { createPortal } from 'react-dom';
import { useTheme } from '../contexts/ThemeContext';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import IconButton from '@mui/material/IconButton';

interface Client {
  _id: string;
  name: string;
  phone?: string;
  photo?: string;
  email?: string;
  ordersCount: number;
  totalOrders: number;
  lastOrderDate?: string;
  user?: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
  address?: string;
  notes?: string;
}

// Switch component
const Switch = ({ checked, onChange, isRTL = false }: { checked: boolean; onChange: (v: boolean) => void; isRTL?: boolean }) => (
  <button
    type="button"
    onClick={() => onChange(!checked)}
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none ${checked ? 'bg-blue-500' : 'bg-gray-300'}`}
    aria-pressed={checked}
  >
    <span
      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200
        ${isRTL
          ? checked
            ? '-translate-x-6'
            : '-translate-x-1'
          : checked
          ? 'translate-x-6'
          : 'translate-x-1'
        }
      `}
    />
  </button>
);

// Client Modal Component
const ClientModal: React.FC<{
  client?: Client | null;
  onClose: () => void;
  onSave: () => void;
}> = ({ client, onClose, onSave }) => {
  const { t, isRTL } = useLanguage();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(client?.photo || null);
  const { theme } = useTheme();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<{ name: string; phone: string; email: string; address: string; notes: string }>({
    defaultValues: {
      name: client?.name || '',
      phone: client?.phone || '',
      email: client?.email || '',
      address: client?.address || '',
      notes: client?.notes || '',
    }
  });

  useEffect(() => {
    if (client) {
      reset({
        name: client.name,
        phone: client.phone || '',
        email: client.email || '',
        address: client.address || '',
        notes: client.notes || '',
      });
      setImagePreview(client.photo || null);
    }
  }, [client, reset]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data: any) => {
    if (!user) return;
    
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('name', data.name);
      formData.append('phone', data.phone);
      formData.append('email', data.email);
      formData.append('user', user.id);
      formData.append('address', data.address);
      formData.append('notes', data.notes);
      
      if (imageFile) {
        formData.append('photo', imageFile);
      }

      if (client) {
        await axios.put(`/clients/${client._id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success(t('messages.clientUpdated') || 'تم تحديث العميل بنجاح');
      } else {
        await axios.post('/clients', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success(t('messages.clientCreated') || 'تم إنشاء العميل بنجاح');
      }
      
      onSave();
    } catch (error: any) {
      console.error('Error saving client:', error);
      if (error.response && error.response.data && error.response.data.message === 'Email or phone number already exists.') {
        toast.error(t('messages.duplicateClient') || 'البريد الإلكتروني أو رقم الجوال مستخدم بالفعل.');
      } else {
        toast.error(t('messages.serverError') || 'خطأ في الخادم');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 w-full max-w-2xl flex flex-col h-full" style={{ minHeight: 400 }}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">
          {client ? (t('clients.editClient') || 'تعديل العميل') : (t('clients.addClient') || 'إضافة عميل جديد')}
        </h2>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
        >
          <X className="h-6 w-6" />
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col h-full">
        <div className="flex-1 space-y-6 overflow-y-auto pb-24 px-2">
          {/* Image Upload */}
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <div className="h-24 w-24 rounded-full bg-gray-100 overflow-hidden border-2 border-gray-200">
                {imagePreview ? (
                  <img
                    src={imageFile ? imagePreview : (imagePreview.startsWith('http') ? imagePreview : `http://localhost:5000${imagePreview}`)}
                    alt="Client"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center">
                    <User className="h-12 w-12 text-gray-400" />
                  </div>
                )}
              </div>
              <label className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700 transition-colors duration-200">
                <Upload className="h-4 w-4" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Name Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('clients.name') || 'الاسم'}
            </label>
            <input
              type="text"
              {...register('name', { required: t('validation.required') || 'هذا الحقل مطلوب' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={t('clients.namePlaceholder') || 'أدخل اسم العميل'}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          {/* Email Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('clients.email') || 'البريد الإلكتروني'}
            </label>
            <input
              type="email"
              {...register('email', { required: t('validation.required') || 'هذا الحقل مطلوب' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={t('clients.emailPlaceholder') || 'أدخل البريد الإلكتروني'}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>

          {/* Phone Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('clients.phone') || 'رقم الهاتف'}
            </label>
            <input
              type="tel"
              {...register('phone', {
                required: t('validation.required') || 'هذا الحقل مطلوب',
                pattern: {
                  value: /^05\d{8}$/,
                  message: t('validation.phoneFormat') || 'رقم الجوال يجب أن يبدأ بـ 05 ويتبعه 8 أرقام'
                }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={t('clients.phonePlaceholder') || 'أدخل رقم الهاتف'}
            />
            {errors.phone && (
              <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
            )}
          </div>

          {/* Address Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('clients.address') || 'العنوان'}
            </label>
            <input
              type="text"
              {...register('address')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={t('clients.addressPlaceholder') || 'أدخل عنوان العميل'}
            />
          </div>

          {/* Notes Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('clients.notes') || 'ملاحظات'}
            </label>
            <textarea
              {...register('notes')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={t('clients.notesPlaceholder') || 'أدخل ملاحظات عن العميل'}
              rows={3}
            />
          </div>
        </div>
        {/* زر الحفظ في الأسفل */}
        <div className="sticky bottom-0 left-0 w-full bg-white pt-4 pb-6 z-10">
          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50"
          >
            {loading ? (t('common.saving') || 'جاري الحفظ...') : (t('common.save') || 'حفظ')}
          </button>
        </div>
      </form>
    </div>
  );
};

// Client Details Dialog Component
const ClientDetailsDialog: React.FC<{
  client: Client | null;
  open: boolean;
  onClose: () => void;
}> = ({ client, open, onClose }) => {
  const { t, isRTL } = useLanguage();
  const { theme } = useTheme();
  if (!client) return null;
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle className="bg-white dark:bg-[#23232a] text-gray-900 dark:text-gray-100 flex items-center justify-between">
        <span>{t('clients.detailsTitle') || 'تفاصيل العميل'}</span>
        <IconButton onClick={onClose}><X /></IconButton>
      </DialogTitle>
      <DialogContent className="bg-white dark:bg-[#23232a]">
        <div className="flex flex-col items-center gap-4 py-4">
          <div className="h-24 w-24 rounded-full bg-gray-100 overflow-hidden border-2 border-gray-200">
                            {client.photo ? (
                  <img
                    src={client.photo.startsWith('http') ? client.photo : `http://localhost:5000${client.photo}`}
                    alt={client.name}
                    className="h-full w-full object-cover"
                    onError={e => { e.currentTarget.src = '/logo.png'; }}
                  />
                ) : (
              <div className="h-full w-full flex items-center justify-center">
                <User className="h-12 w-12 text-gray-400" />
              </div>
            )}
          </div>
          <div className="w-full space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-bold">{t('clients.name') || 'الاسم'}:</span>
              <span>{client.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold">{t('clients.email') || 'البريد الإلكتروني'}:</span>
              <span>{client.email || '-'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold">{t('clients.phone') || 'الهاتف'}:</span>
              <span>{client.phone || '-'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold">{t('clients.address') || 'العنوان'}:</span>
              <span>{client.address || '-'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold">{t('clients.notes') || 'ملاحظات'}:</span>
              <span>{client.notes || '-'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold">{t('clients.ordersCount') || 'عدد الطلبات'}:</span>
              <span>{client.ordersCount}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold">{t('clients.totalOrders') || 'إجمالي الطلبات'}:</span>
              <span>{client.totalOrders?.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold">{t('clients.lastOrderDate') || 'آخر طلب'}:</span>
              <span>{client.lastOrderDate ? new Date(client.lastOrderDate).toLocaleString() : '-'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold">{t('clients.createdAt') || 'تاريخ الإنشاء'}:</span>
              <span>{new Date(client.createdAt).toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold">{t('clients.updatedAt') || 'آخر تحديث'}:</span>
              <span>{new Date(client.updatedAt).toLocaleString()}</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const Clients: React.FC = () => {
  const { t, isRTL } = useLanguage();
  const { user } = useAuth();
  const { theme } = useTheme();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [searchValue, setSearchValue] = useState('');
  const limit = 10;
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [clientDetails, setClientDetails] = useState<Client | null>(null);
  const [clientStats, setClientStats] = useState<any>(null);

  useEffect(() => {
    if (user) {
      fetchClients();
    }
  }, [user, sortBy, sortOrder, page, searchValue]);

  useEffect(() => {
    const fetchClientStats = async () => {
      if (!user || !user.id) return;
      try {
        const response = await axios.get(`/clients/warehouse/${user.id}/statistics`);
        setClientStats(response.data.statistics);
      } catch (error) {
        // يمكن إضافة توست أو لوج هنا
      }
    };
    fetchClientStats();
  }, [user]);

  const fetchClients = async () => {
    if (!user) return;
    try {
      const response = await axios.get('/clients', {
        params: { sortBy, sortOrder, page, limit, search: searchValue }
      });
      setClients(response.data.clients);
      setTotalPages(Math.ceil(response.data.count / limit));
    } catch (error: any) {
      console.error('Error fetching clients:', error);
      toast.error(t('messages.networkError') || 'خطأ في الشبكة');
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const handleAddClient = () => {
    setEditingClient(null);
    setShowModal(true);
  };

  const handleEditClient = (client: Client) => {
    setEditingClient(client);
    setShowModal(true);
  };

  const handleDeleteClick = (client: Client) => {
    setClientToDelete(client);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (clientToDelete) {
      await handleDeleteClient(clientToDelete._id);
      setDeleteDialogOpen(false);
      setClientToDelete(null);
    }
  };

  const handleDeleteClient = async (clientId: string) => {
    try {
      await axios.delete(`/clients/${clientId}`);
      toast.success(t('messages.clientDeleted') || 'تم حذف العميل بنجاح');
      fetchClients();
    } catch (error: any) {
      console.error('Delete error:', error);
      toast.error(t('messages.serverError') || 'خطأ في الخادم');
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditingClient(null);
  };

  const handleClientSaved = () => {
    fetchClients();
    handleModalClose();
  };

  const handleViewDetails = (client: Client) => {
    setClientDetails(client);
    setDetailsDialogOpen(true);
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
              <Users className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {t('sidebar.clients') || 'العملاء'}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <input
                type="text"
                value={searchValue}
                onChange={e => setSearchValue(e.target.value)}
                placeholder={t('clients.searchByNamePhoneEmail') || 'بحث بالاسم أو الجوال أو الإيميل'}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm min-w-[250px] pr-8"
                style={{ direction: isRTL ? 'rtl' : 'ltr' }}
              />
              {searchValue && (
                <button
                  type="button"
                  onClick={() => setSearchValue('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 focus:outline-none"
                  tabIndex={-1}
                  aria-label={t('common.reset') || 'إعادة تعيين'}
                  style={{ padding: 0 }}
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <button
              onClick={handleAddClient}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center space-x-2 rtl:space-x-reverse"
            >
              <Plus className="h-5 w-5" />
              <span>{t('clients.addClient') || 'إضافة عميل'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Client Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 my-6">
        <StatCard
          title={t('clients.totalClients') || 'عدد العملاء'}
          value={clientStats?.totalClients?.toLocaleString() || '0'}
          icon={<Users className="h-6 w-6" />}
          color="indigo"
        />
        <StatCard
          title={t('clients.totalOrdersByClients') || 'إجمالي الطلبات من العملاء'}
          value={clientStats?.totalOrdersByClients?.toLocaleString() || '0'}
          icon={<ShoppingCart className="h-6 w-6" />}
          color="blue"
        />
        <StatCard
          title={t('clients.totalOrdersValue') || 'إجمالي قيمة الطلبات'}
          value={clientStats?.totalOrdersValue?.toLocaleString() || '0'}
          unit={t('orders.currency') || 'ر.س'}
          icon={<DollarSign className="h-6 w-6" />}
          color="green"
        />
        <StatCard
          title={t('clients.topClient') || 'أكثر عميل طلباً'}
          value={clientStats?.topClientsByOrders?.[0]?.client?.name || '-'}
          // subtitle={clientStats?.topClientsByOrders?.[0] ? `${clientStats.topClientsByOrders[0].orderCount} ${t('clients.orders') || 'طلب'}` : ''}
          icon={<Crown className="h-6 w-6" />}
          color="yellow"
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
        <div className="overflow-x-auto">
          {clients.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">{t('clients.noClients') || 'لا توجد عملاء'}</p>
            </div>
          ) : (
            <React.Fragment>
              <table className="min-w-full divide-y divide-gray-200" dir={isRTL ? 'rtl' : 'ltr'}>
                <thead className="bg-gray-50">
                  <tr>
                    <th className={`px-2 py-3 ${isRTL ? 'text-right' : 'text-left'} text-xs font-medium text-gray-500 uppercase tracking-wider`}>
                      {t('clients.photo') || 'الصورة'}
                    </th>
                    <th className={`px-2 py-3 ${isRTL ? 'text-right' : 'text-left'} text-xs font-medium text-gray-500 uppercase tracking-wider`}>
                      {t('clients.name') || 'الاسم'}
                    </th>
                    <th className={`px-2 py-3 ${isRTL ? 'text-right' : 'text-left'} text-xs font-medium text-gray-500 uppercase tracking-wider`}>
                      {t('clients.phone') || 'الهاتف'}
                    </th>
                    <th className={`px-2 py-3 ${isRTL ? 'text-right' : 'text-left'} text-xs font-medium text-gray-500 uppercase tracking-wider`}>
                      {t('clients.ordersCount') || 'عدد الطلبات'}
                    </th>
                    <th className={`px-2 py-3 ${isRTL ? 'text-right' : 'text-left'} text-xs font-medium text-gray-500 uppercase tracking-wider`}>
                      {t('clients.totalOrders') || 'إجمالي الطلبات'}
                    </th>
                    <th className={`px-2 py-3 ${isRTL ? 'text-right' : 'text-left'} text-xs font-medium text-gray-500 uppercase tracking-wider`}>
                      {t('clients.lastOrderDate') || 'آخر طلب'}
                    </th>
                    <th className={`px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider`}>
                      {t('common.actions') || 'الإجراءات'}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {clients.map((client, index) => (
                    <tr
                      key={client._id}
                      className={`transition-colors duration-200 hover:bg-gray-50 ${index === clients.length - 1 ? ' !border-b border-gray-200' : ''}`}
                    >
                      <td className={`px-2 py-4 whitespace-nowrap ${isRTL ? 'text-right' : 'text-left'}`}>
                        <div className="h-12 w-12 rounded-full bg-gray-100 overflow-hidden">
                                      {client.photo ? (
              <img
                src={client.photo.startsWith('http') ? client.photo : `http://localhost:5000${client.photo}`}
                alt={client.name}
                className="h-full w-full object-cover"
                onError={e => { e.currentTarget.src = '/logo.png'; }}
              />
            ) : (
                            <div className="h-full w-full flex items-center justify-center">
                              <User className="h-6 w-6 text-gray-400" />
                            </div>
                          )}
                        </div>
                      </td>
                      <td className={`px-2 py-4 ${isRTL ? 'text-right' : 'text-left'}`}>
                        <div className="text-sm font-medium text-gray-900">{client.name}</div>
                        <div className="text-sm text-gray-500">{client.email || '-'}</div>
                      </td>
                      <td className={`px-2 py-4 whitespace-nowrap text-sm text-gray-900 ${isRTL ? 'text-right' : 'text-left'}`}>
                        {client.phone ? (
                          <div className="flex items-center space-x-1 rtl:space-x-reverse">
                            <Phone className="h-4 w-4 text-gray-400" />
                            <span>{client.phone}</span>
                          </div>
                        ) : '-'}
                      </td>
                      <td className={`px-2 py-4 whitespace-nowrap text-sm text-gray-900 ${isRTL ? 'text-right' : 'text-left'}`}>
                        <div className="flex items-center space-x-1 rtl:space-x-reverse">
                          <ShoppingCart className="h-4 w-4 text-gray-400" />
                          <span>{client.ordersCount}</span>
                        </div>
                      </td>
                      <td className={`px-2 py-4 whitespace-nowrap text-sm text-gray-900 ${isRTL ? 'text-right' : 'text-left'}`}>
                        <div className="flex items-center space-x-1 rtl:space-x-reverse">
                          <span className="font-bold text-gray-400">﷼</span>
                          <span>{client.totalOrders?.toLocaleString()}</span>
                        </div>
                      </td>
                      <td className={`px-2 py-4 whitespace-nowrap text-sm text-gray-900 ${isRTL ? 'text-right' : 'text-left'}`}>
                        {client.lastOrderDate ? (
                          <div className={`flex items-center space-x-1 rtl:space-x-reverse`}>
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <div className="flex flex-col">
                              <span>{new Date(client.lastOrderDate).toLocaleDateString()}</span>
                              <span className="text-xs text-gray-500">{new Date(client.lastOrderDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                          </div>
                        ) : '-'}
                      </td>
                      <td className="px-2 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center space-x-2 rtl:space-x-reverse">
                          <button
                            onClick={() => handleViewDetails(client)}
                            className="text-green-600 hover:text-green-900 transition-colors duration-200"
                            title={t('clients.viewDetails') || 'عرض التفاصيل'}
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleEditClient(client)}
                            className="text-blue-600 hover:text-blue-900 transition-colors duration-200"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(client)}
                            className="text-red-600 hover:text-red-900 transition-colors duration-200"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {totalPages > 1 && (
                <div className={`flex items-center py-4 px-4 gap-2 ${isRTL ? 'justify-end' : 'justify-end'}`}>
                  <button
                    onClick={() => setPage(1)}
                    disabled={page === 1}
                    className="w-10 h-10 rounded-lg border border-gray-200 bg-gray-100 text-gray-400 flex items-center justify-center disabled:opacity-50"
                    title={t('common.first') || 'الأول'}
                  >
                    ≪
                  </button>
                  <button
                    onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                    disabled={page === 1}
                    className="w-10 h-10 rounded-lg border border-gray-200 bg-gray-100 text-gray-400 flex items-center justify-center disabled:opacity-50"
                    title={t('common.previous') || 'السابق'}
                  >
                    <span className="text-lg">{isRTL ? '›' : '‹'}</span>
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => setPage(i + 1)}
                      className={`w-10 h-10 rounded-lg border ${page === i + 1 ? 'bg-blue-600 text-white font-bold' : 'bg-gray-100 text-gray-700'} font-medium transition-colors duration-150`}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button
                    onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={page === totalPages}
                    className="w-10 h-10 rounded-lg border border-gray-200 bg-gray-100 text-gray-400 flex items-center justify-center disabled:opacity-50"
                    title={t('common.next') || 'التالي'}
                  >
                    <span className="text-lg">{isRTL ? '‹' : '›'}</span>
                  </button>
                  <button
                    onClick={() => setPage(totalPages)}
                    disabled={page === totalPages}
                    className="w-10 h-10 rounded-lg border border-gray-200 bg-gray-100 text-gray-400 flex items-center justify-center disabled:opacity-50"
                    title={t('common.last') || 'الأخير'}
                  >
                    ≫
                  </button>
                </div>
              )}
            </React.Fragment>
          )}
        </div>
      </div>

      <Drawer
        anchor={isRTL ? 'left' : 'right'}
        open={showModal}
        onClose={handleModalClose}
        PaperProps={{
          className: 'w-full max-w-2xl',
          sx: {
            backgroundColor: theme === 'dark' ? '#23232a' : '#fff',
            color: theme === 'dark' ? '#fff' : '#1a202c'
          }
        }}
      >
        <ClientModal
          client={editingClient}
          onClose={handleModalClose}
          onSave={handleClientSaved}
        />
      </Drawer>

      {deleteDialogOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-lg">
            <h2 className="text-lg font-bold mb-4 text-center">{t('dialog.deletetitle') || 'تأكيد الحذف'}</h2>
            <p className="mb-6 text-center">{t('dialog.deleteClientMessage') || 'هل أنت متأكد أنك تريد حذف هذا العميل؟'}</p>
            <div className="flex justify-between gap-2">
              <button
                className="flex-1 bg-gray-200 text-gray-700 py-2 rounded hover:bg-gray-300"
                onClick={() => setDeleteDialogOpen(false)}
              >
                {t('dialog.cancel') || 'إلغاء'}
              </button>
              <button
                className="flex-1 bg-red-600 text-white py-2 rounded hover:bg-red-700"
                onClick={handleDeleteConfirm}
              >
                {t('dialog.delete') || 'حذف'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      <ClientDetailsDialog client={clientDetails} open={detailsDialogOpen} onClose={() => setDetailsDialogOpen(false)} />
    </div>
  );
};

const StatCard: React.FC<{
  title: string;
  value: string;
  unit?: string;
  subtitle?: string;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'indigo' | 'red' | 'orange' | 'yellow';
}> = ({ title, value, unit, subtitle, icon, color }) => {
  const colorBg = {
    blue: 'bg-blue-50',
    green: 'bg-green-50',
    indigo: 'bg-indigo-50',
    red: 'bg-red-50',
    orange: 'bg-orange-50',
    yellow: 'bg-yellow-50',
  };
  const colorIcon = {
    blue: 'text-blue-500',
    green: 'text-green-500',
    indigo: 'text-indigo-500',
    red: 'text-red-500',
    orange: 'text-orange-500',
    yellow: 'text-yellow-500',
  };
  return (
    <div className="rounded-xl bg-white shadow-sm border border-gray-100 px-6 py-5 flex items-center justify-between min-w-[220px]">
      <div>
        <div className="text-2xl font-semibold text-gray-900 mb-1 flex items-baseline gap-1">
          {value} {unit && <span className="text-base text-gray-400 font-normal">{unit}</span>}
        </div>
        <div className="text-sm text-gray-500 font-medium">{title}</div>
        {subtitle && (
          <div className="text-xs text-gray-400 mt-1">{subtitle}</div>
        )}
      </div>
      <div className={`flex items-center justify-center w-12 h-12 rounded-full ${colorBg[color]}`}> 
        {React.cloneElement(icon as React.ReactElement, { className: `w-7 h-7 ${colorIcon[color]}` })}
      </div>
    </div>
  );
};

export default Clients; 