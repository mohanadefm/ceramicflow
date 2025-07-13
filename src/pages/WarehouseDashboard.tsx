import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import {
  Package,
  Plus,
  Edit,
  Trash2,
  AlertTriangle,
  BarChart3,
  Image,
  Upload,
  X,
  Warehouse,
  Percent
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import Drawer from '@mui/material/Drawer';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import Button from '@mui/material/Button';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import { Controller } from 'react-hook-form';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import { useTheme } from '../contexts/ThemeContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';

interface Material {
  _id: string;
  name: string;
  class: string;
  code: string;
  color: string;
  length?: string;
  width?: string;
  thickness?: string;
  dimension: string;
  depth: string;
  quantity_m2: number;
  items_per_box: number;
  quantity_box: number;
  box_area: number;
  price: number;
  factory: string;
  type: string;
  image?: string;
  isLowStock: boolean;
  lowStock: boolean;
  createdAt: string;
  updatedAt: string;
  category?: string;
  finishType?: string;
  country?: string;
  sku?: string;
  quantityInMeters?: number;
  quantityInBoxes?: number;
}

interface Statistics {
  totalQuantityM2: number;
  totalQuantityBoxes: number;
  totalItems: number;
  lowStockItems: number;
}

const WarehouseDashboard: React.FC = () => {
  const { t, isRTL } = useLanguage();
  const { user } = useAuth();
  const { theme } = useTheme();
  const [statistics, setStatistics] = useState<Statistics>({
    totalQuantityM2: 0,
    totalQuantityBoxes: 0,
    totalItems: 0,
    lowStockItems: 0
  });
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [materialToDelete, setMaterialToDelete] = useState<Material | null>(null);
  const limit = 10;
  const [orderStats, setOrderStats] = useState<any>(null);
  const [offerStats, setOfferStats] = useState<any>(null);
  const [clientStats, setClientStats] = useState<any>(null);

  useEffect(() => {
    if (user && user.id) {
      fetchStatistics();
    }
  }, [user]);

  useEffect(() => {
    const fetchOrderStats = async () => {
      if (!user || !user.id) return;
      try {
        const response = await axios.get(`/orders/warehouse/${user.id}/statistics`);
        setOrderStats(response.data.statistics);
      } catch (error) {
        // يمكن إضافة توست أو لوج هنا
      }
    };
    fetchOrderStats();
    const fetchOfferStats = async () => {
      if (!user || !user.id) return;
      try {
        const response = await axios.get(`/offers/warehouse/${user.id}/statistics`);
        setOfferStats(response.data.statistics);
      } catch (error) {
        // يمكن إضافة توست أو لوج هنا
      }
    };
    fetchOfferStats();
    // Fetch client statistics
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

  const fetchStatistics = async () => {
    if (!user || !user.id) return;
    try {
      const response = await axios.get(`/products/warehouse/${user.id}/statistics`);
      setStatistics(response.data.statistics);
    } catch (error: any) {
      console.error('Error fetching statistics:', error);
      toast.error(t('messages.networkError'));
    } finally {
      setLoading(false);
    }
  };

  const handleAddMaterial = () => {
    setEditingMaterial(null);
    setShowModal(true);
  };

  const handleEditMaterial = (material: Material) => {
    setEditingMaterial(material);
    setShowModal(true);
  };

  const handleDeleteClick = (material: Material) => {
    setMaterialToDelete(material);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (materialToDelete) {
      await handleDeleteMaterial(materialToDelete._id);
      setDeleteDialogOpen(false);
      setMaterialToDelete(null);
    }
  };

  const handleDeleteMaterial = async (materialId: string) => {
    try {
      await axios.delete(`/materials/${materialId}`);
      toast.success(t('messages.materialDeleted'));
      fetchStatistics();
    } catch (error: any) {
      console.error('Delete error:', error);
      toast.error(t('messages.serverError'));
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditingMaterial(null);
  };

  const handleMaterialSaved = () => {
    fetchStatistics();
    handleModalClose();
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
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 rtl:space-x-reverse">
            <div className="bg-blue-100 p-3 rounded-lg">
              <BarChart3 className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {t('dashboard.dashboard')}
              </h1>
              <p className="text-gray-600">
                {t('dashboard.welcome')}, {user?.name}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="space-y-12">
        {/* Product Statistics */}
        <section>
          <h2 className="text-xl font-bold text-gray-800 mb-4">{t('dashboard.productStatistics') || 'Product Statistics'}</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <StatCard
              title={t('warehouse.totalQuantityM2') || 'كمية المنتجات (متر مربع)'}
              value={statistics.totalQuantityM2.toLocaleString()}
              unit={t('warehouse.m2')}
              icon={<BarChart3 className="h-6 w-6" />}
              color="blue"
            />
            <StatCard
              title={t('warehouse.totalQuantityBoxes') || 'كمية المنتجات (صندوق)'}
              value={statistics.totalQuantityBoxes.toLocaleString()}
              unit={t('warehouse.boxes') || 'صندوق'}
              icon={<Package className="h-6 w-6" />}
              color="blue"
            />
            <StatCard
              title={t('warehouse.totalItems') || 'عدد المنتجات'}
              value={statistics.totalItems.toLocaleString()}
              icon={<Package className="h-6 w-6" />}
              color="indigo"
            />
            <StatCard
              title={t('warehouse.lowStockItems') || 'منتجات منخفضة المخزون'}
              value={statistics.lowStockItems.toLocaleString()}
              icon={<AlertTriangle className="h-6 w-6" />}
              color="red"
            />
          </div>
          {/* مكان رسم بياني للمنتجات */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 min-h-[320px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart
                data={[
                  { name: t('warehouse.totalQuantityM2') || 'كمية المنتجات (متر مربع)', value: statistics.totalQuantityM2, color: '#2563eb' },
                  { name: t('warehouse.totalQuantityBoxes') || 'كمية المنتجات (صندوق)', value: statistics.totalQuantityBoxes, color: '#0ea5e9' },
                  { name: t('warehouse.totalItems') || 'عدد المنتجات', value: statistics.totalItems, color: '#6366f1' },
                  { name: t('warehouse.lowStockItems') || 'منتجات منخفضة المخزون', value: statistics.lowStockItems, color: '#ef4444' },
                ]}
                margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 13 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 13 }} />
                <Tooltip formatter={(value: any) => value.toLocaleString()} />
                <Bar dataKey="value">
                  {
                    [
                      '#2563eb', // متر مربع
                      '#0ea5e9', // صندوق
                      '#6366f1', // عدد المنتجات
                      '#ef4444', // منخفض المخزون
                    ].map((color, idx) => (
                      <Cell key={color} fill={color} />
                    ))
                  }
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Order Statistics */}
        <section>
          <h2 className="text-xl font-bold text-gray-800 mb-4">{t('dashboard.orderStatistics') || 'Order Statistics'}</h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-6">
            <StatCard
              title={t('orders.totalOrders') || 'عدد الطلبات'}
              value={orderStats?.totalOrders?.toLocaleString() || '0'}
              icon={<BarChart3 className="h-6 w-6" />}
              color="blue"
            />
            <StatCard
              title={t('orders.totalSales') || 'إجمالي المبيعات'}
              value={orderStats?.totalSales?.toLocaleString(undefined, { maximumFractionDigits: 2 }) || '0'}
              unit={t('orders.currency') || 'ر.س'}
              icon={<BarChart3 className="h-6 w-6" />}
              color="green"
            />
            <StatCard
              title={t('orders.cancelledOrders') || 'الملغاة'}
              value={orderStats?.cancelledOrders?.toLocaleString() || '0'}
              icon={<AlertTriangle className="h-6 w-6" />}
              color="red"
            />
            <StatCard
              title={t('orders.avgOrderPrice') || 'متوسط سعر الطلب'}
              value={orderStats?.avgOrderPrice?.toLocaleString(undefined, { maximumFractionDigits: 2 }) || '0'}
              unit={t('orders.currency') || 'ر.س'}
              icon={<BarChart3 className="h-6 w-6" />}
              color="indigo"
            />
            <StatCard
              title={t('orders.avgOrderQuantity') || 'متوسط كمية الطلب'}
              value={orderStats?.avgOrderQuantity?.toLocaleString(undefined, { maximumFractionDigits: 2 }) || '0'}
              icon={<BarChart3 className="h-6 w-6" />}
              color="blue"
            />
          </div>
          {/* رسم بياني لأكثر الأنواع/الدول/الألوان/العملاء طلبًا */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* أكثر الأنواع طلبًا */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 min-h-[220px]">
              <h3 className="text-lg font-semibold mb-4">{t('orders.mostOrderedType') || 'أكثر الأنواع طلبًا'}</h3>
              <div className="text-2xl font-bold text-blue-700">{orderStats?.mostOrderedType?t(`material.categories.${orderStats?.mostOrderedType}`) || '-':'-'}</div>
            </div>
            {/* أكثر 3 دول طلبًا */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 min-h-[220px]">
              <h3 className="text-lg font-semibold mb-4">{t('orders.topCountries') || 'أكثر 3 دول طلبًا'}</h3>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={orderStats?.topCountries || []} layout="vertical" margin={{ left: 20 }}>
                  <XAxis type="number" allowDecimals={false} />
                  <YAxis dataKey="country" type="category" width={80} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#2563eb" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            {/* أكثر 3 ألوان طلبًا */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 min-h-[220px]">
              <h3 className="text-lg font-semibold mb-4">{t('orders.topColors') || 'أكثر 3 ألوان طلبًا'}</h3>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={orderStats?.topColors || []} layout="vertical" margin={{ left: 20 }}>
                  <XAxis type="number" allowDecimals={false} />
                  <YAxis dataKey="color" type="category" width={80} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#0ea5e9" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            {/* أكثر العملاء طلبًا */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 min-h-[220px]">
              <h3 className="text-lg font-semibold mb-4">{t('orders.topCustomers') || 'أكثر العملاء طلبًا'}</h3>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={orderStats?.topCustomers?.slice(0, 5) || []} layout="vertical" margin={{ left: 20 }}>
                  <XAxis type="number" allowDecimals={false} />
                  <YAxis dataKey="name" type="category" width={100} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#6366f1" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        {/* Offer Statistics */}
        <section>
          <h2 className="text-xl font-bold text-gray-800 mb-4">{t('dashboard.offerStatistics') || 'Offer Statistics'}</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <StatCard
              title={t('offers.totalOffers') || 'عدد العروض'}
              value={offerStats?.totalOffers?.toLocaleString() || '0'}
              icon={<BarChart3 className="h-6 w-6" />}
              color="blue"
            />
            <StatCard
              title={t('offers.totalQuantityMeters') || 'إجمالي الكمية (متر مربع)'}
              value={offerStats?.totalQuantityMeters?.toLocaleString() || '0'}
              unit="m²"
              icon={<Package className="h-6 w-6" />}
              color="blue"
            />
            <StatCard
              title={t('offers.totalQuantityBoxes') || 'إجمالي الكمية (صندوق)'}
              value={offerStats?.totalQuantityBoxes?.toLocaleString() || '0'}
              unit={t('warehouse.boxes') || 'صندوق'}
              icon={<Package className="h-6 w-6" />}
              color="indigo"
            />
            <StatCard
              title={t('offers.largestDiscountedQuantity') || 'أكبر كمية مخصومة'}
              value={offerStats?.largestDiscountedOffer ? `${t(`material.categories.${offerStats.largestDiscountedOffer.category}`) || offerStats.largestDiscountedOffer.category} - ${offerStats.largestDiscountedOffer.sku}` : '-'}
              icon={<Percent className="h-6 w-6" />}
              color="green"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col items-center justify-center min-h-[100px]">
              <div className="text-gray-600 text-sm mb-2">{t('offers.mostFrequentFactory') || 'أكثر مصنع ظهورًا'}</div>
              <div className="text-2xl font-bold text-blue-700">{offerStats?.mostFrequentFactory || '-'}</div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col items-center justify-center min-h-[100px]">
              <div className="text-gray-600 text-sm mb-2">{t('offers.mostFrequentColor') || 'أكثر لون ظهورًا'}</div>
              <div className="text-2xl font-bold text-blue-700">{offerStats?.mostFrequentColor?t(`material.colors.${offerStats?.mostFrequentColor}`) || '-':'-'}</div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col items-center justify-center min-h-[100px]">
              <div className="text-gray-600 text-sm mb-2">{t('offers.mostFrequentCountry') || 'أكثر بلد منشأ ظهورًا'}</div>
              <div className="text-2xl font-bold text-blue-700">{offerStats?.mostFrequentCountry?t(`material.countries.${offerStats?.mostFrequentCountry}`) || '-':'-'}</div>
            </div>
          </div>
        </section>

        {/* Client Statistics */}
        <section>
          <h2 className="text-xl font-bold text-gray-800 mb-4">{t('dashboard.clientStatistics') || 'Client Statistics'}</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <StatCard
              title={t('clients.totalClients') || 'عدد العملاء'}
              value={clientStats?.totalClients?.toLocaleString() || '0'}
              icon={<Warehouse className="h-6 w-6" />}
              color="indigo"
            />
            <StatCard
              title={t('clients.totalOrdersByClients') || 'إجمالي الطلبات من العملاء'}
              value={clientStats?.totalOrdersByClients?.toLocaleString() || '0'}
              icon={<BarChart3 className="h-6 w-6" />}
              color="blue"
            />
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 min-h-[220px]">
            <h3 className="text-lg font-semibold mb-4">{t('clients.topClientsByOrders') || 'أكثر العملاء طلباً'}</h3>
            {clientStats?.topClientsByOrders?.length > 0 ? (
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={clientStats.topClientsByOrders} layout="vertical" margin={{ left: 20 }}>
                  <XAxis type="number" allowDecimals={false} />
                  <YAxis dataKey="client.name" type="category" width={100} />
                  <Tooltip formatter={(value: any) => value.toLocaleString()} />
                  <Bar dataKey="orderCount" fill="#6366f1" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-2xl font-bold text-blue-700">-</div>
              
            )}
          </div>
        </section>
      </div>

      {/* Material Modal as Side Drawer */}
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
        <MaterialModal
          material={editingMaterial}
          onClose={handleModalClose}
          onSave={handleMaterialSaved}
        />
      </Drawer>

      {/* Dialog تأكيد الحذف */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>{t('dialog.deletetitle')}</DialogTitle>
        <DialogContent>
          {t('dialog.deletemessage')}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>{t('dialog.cancel')}</Button>
          <Button color="error" onClick={handleDeleteConfirm}>{t('dialog.delete')}</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

const StatCard: React.FC<{
  title: string;
  value: string;
  unit?: string;
  icon: React.ReactNode;
  color: string;
}> = ({ title, value, unit, icon, color }) => {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    indigo: 'bg-indigo-100 text-indigo-600',
    red: 'bg-red-100 text-red-600',
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">
            {value} {unit && <span className="text-sm text-gray-500">{unit}</span>}
          </p>
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color as keyof typeof colorClasses]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

const MaterialModal: React.FC<{
  material: Material | null;
  onClose: () => void;
  onSave: () => void;
}> = ({ material, onClose, onSave }) => {
  const { t, isRTL } = useLanguage();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(
    material?.image
      ? (material.image.startsWith('http')
        ? material.image
        : `http://localhost:5000${material.image}`)
      : null
  );
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [calculatedBox, setCalculatedBox] = useState('');

  // Placeholders for numeric fields
  const placeholderCode = isRTL ? 'أدخل رمز المنتج (SKU)' : 'Enter SKU';
  const placeholderPrice = isRTL ? 'أدخل السعر' : 'Enter price';
  const placeholderLength = isRTL ? 'أدخل الطول' : 'Enter length';
  const placeholderWidth = isRTL ? 'أدخل العرض' : 'Enter width';
  const placeholderThickness = isRTL ? 'أدخل السماكة' : 'Enter thickness';
  const placeholderQtyM2 = isRTL ? 'أدخل الكمية بالمتر المربع' : 'quantity (m²)';
  const placeholderQtyBox = isRTL ? 'أدخل الكمية بالصندوق' : 'quantity (Box)';
  const placeholderFactory = isRTL ? 'أدخل اسم المصنع' : 'Enter factory name';

  // Prepare default values for form
  const getDefaultValues = () => {
    if (!material) return {};
    return {
      ...material,
      code: material.sku ?? '',
      quantity_m2: material.quantityInMeters ?? '',
      quantity_box: material.quantityInBoxes ?? '',
      items_per_box: material.items_per_box ?? '',
      length: material.length ?? '',
      width: material.width ?? '',
      thickness: material.thickness ?? '',
    };
  };

  const { register, handleSubmit, formState: { errors }, reset, control, watch } = useForm<Material & { length?: string; width?: string; thickness?: string; category?: string; finishType?: string; country?: string }>({
    defaultValues: getDefaultValues()
  });

  useEffect(() => {
    reset(getDefaultValues());
    setImagePreview(
      material?.image
        ? (material.image.startsWith('http')
          ? material.image
          : `http://localhost:5000${material.image}`)
        : null
    );
  }, [material, reset]);

  const length = Number(watch('length'));
  const width = Number(watch('width'));
  const itemsPerBox = Number(watch('items_per_box'));
  const qtyM2 = Number(watch('quantity_m2'));

  useEffect(() => {
    if (length > 0 && width > 0 && itemsPerBox > 0) {
      const areaPerBox = (length * width / 10000) * itemsPerBox;
      if (areaPerBox > 0) {
        setCalculatedBox((qtyM2 / areaPerBox).toFixed(2));
      } else {
        setCalculatedBox('');
      }
    } else {
      setCalculatedBox('');
    }
  }, [length, width, itemsPerBox, qtyM2]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setImagePreview(
        material?.image
          ? (material.image.startsWith('http')
            ? material.image
            : `http://localhost:5000${material.image}`)
          : null
      );
    }
  };

  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      // اربط القيمة المحسوبة بالحقل المرسل
      data.quantity_box = calculatedBox;

      const formData = new FormData();
      // جهز نسخة معدلة من البيانات لتطابق backend
      const dataToSend = {
        ...data,
        category: data.category ? data.category.toLowerCase() : undefined,
        finishType: data.finishType ? data.finishType.toLowerCase().replace(/ /g, '-') : undefined,
        sku: data.code,
        quantityInMeters: data.quantity_m2,
        quantityInBoxes: data.quantity_box, // الآن سترسل القيمة المحسوبة
        items_per_box: data.items_per_box,
        status: material ? data.status : 'active',
        length: data.length,
        width: data.width,
        thickness: data.thickness,
      };
      const fields = [
        'name', 'category', 'finishType', 'sku', 'price', 'color', 'dimension',
        'quantityInMeters', 'quantityInBoxes', 'factory', 'items_per_box', 'box_area', 'country', 'status', 'length', 'width', 'thickness'
      ];
      fields.forEach((key) => {
        if (dataToSend[key] !== undefined && dataToSend[key] !== '') {
          if ([
            'price', 'quantityInMeters', 'quantityInBoxes', 'items_per_box', 'box_area'
          ].includes(key)) {
            formData.append(key, String(Number(dataToSend[key])));
          } else {
            formData.append(key, dataToSend[key]);
          }
        } else {
          if ([ 'items_per_box', 'box_area' ].includes(key)) {
            formData.append(key, '');
          }
        }
      });
      // أضف الصورة من ref إذا تم اختيارها
      if (fileInputRef.current && fileInputRef.current.files && fileInputRef.current.files[0]) {
        formData.append('image', fileInputRef.current.files[0]);
      }
      if (material) {
        await axios.put(`/products/${material._id}`, formData);
        toast.success(t('messages.materialUpdated'));
      } else {
        await axios.post('/products', formData);
        toast.success(t('messages.materialAdded'));
      }
      onSave();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error.message || 'حدث خطأ أثناء الحفظ');
      console.error('Save error:', error);
    } finally {
      setLoading(false);
    }
  };

  // قائمة ألوان سيراميك معروفة
  const colorOptions = [
    { value: 'white', label: t('material.colors.white') },
    { value: 'black', label: t('material.colors.black') },
    { value: 'gray', label: t('material.colors.gray') },
    { value: 'beige', label: t('material.colors.beige') },
    { value: 'blue', label: t('material.colors.blue') },
    { value: 'red', label: t('material.colors.red') },
    { value: 'green', label: t('material.colors.green') },
    { value: 'yellow', label: t('material.colors.yellow') },
    { value: 'brown', label: t('material.colors.brown') },
    { value: 'ivory', label: t('material.colors.ivory') },
    { value: 'cream', label: t('material.colors.cream') },
    { value: 'pink', label: t('material.colors.pink') },
    { value: 'orange', label: t('material.colors.orange') },
    { value: 'purple', label: t('material.colors.purple') },
    { value: 'gold', label: t('material.colors.gold') },
    { value: 'silver', label: t('material.colors.silver') },
    { value: 'offWhite', label: t('material.colors.offWhite') },
    { value: 'lightGray', label: t('material.colors.lightGray') },
    { value: 'darkGray', label: t('material.colors.darkGray') },
    { value: 'sand', label: t('material.colors.sand') },
    { value: 'taupe', label: t('material.colors.taupe') },
    { value: 'terracotta', label: t('material.colors.terracotta') },
    { value: 'olive', label: t('material.colors.olive') },
    { value: 'mint', label: t('material.colors.mint') },
    { value: 'skyBlue', label: t('material.colors.skyBlue') },
    { value: 'navy', label: t('material.colors.navy') },
    { value: 'charcoal', label: t('material.colors.charcoal') },
    { value: 'maroon', label: t('material.colors.maroon') },
    { value: 'teal', label: t('material.colors.teal') },
    { value: 'aqua', label: t('material.colors.aqua') },
    { value: 'peach', label: t('material.colors.peach') },
    { value: 'coral', label: t('material.colors.coral') },
    { value: 'bronze', label: t('material.colors.bronze') },
    { value: 'copper', label: t('material.colors.copper') },
    { value: 'slate', label: t('material.colors.slate') },
    { value: 'stone', label: t('material.colors.stone') },
    { value: 'almond', label: t('material.colors.almond') },
    { value: 'mocha', label: t('material.colors.mocha') },
    { value: 'espresso', label: t('material.colors.espresso') },
    { value: 'graphite', label: t('material.colors.graphite') },
    { value: 'pearl', label: t('material.colors.pearl') },
    { value: 'smoke', label: t('material.colors.smoke') },
    { value: 'ash', label: t('material.colors.ash') },
    { value: 'cloud', label: t('material.colors.cloud') },
    { value: 'linen', label: t('material.colors.linen') },
    { value: 'biscuit', label: t('material.colors.biscuit') },
    { value: 'bone', label: t('material.colors.bone') },
    { value: 'fawn', label: t('material.colors.fawn') },
    { value: 'wheat', label: t('material.colors.wheat') },
    { value: 'sable', label: t('material.colors.sable') },
    { value: 'steel', label: t('material.colors.steel') },
    { value: 'platinum', label: t('material.colors.platinum') },
    { value: 'rust', label: t('material.colors.rust') },
    { value: 'jade', label: t('material.colors.jade') },
    { value: 'emerald', label: t('material.colors.emerald') },
    { value: 'sapphire', label: t('material.colors.sapphire') },
    { value: 'ruby', label: t('material.colors.ruby') },
    { value: 'onyx', label: t('material.colors.onyx') },
    { value: 'quartz', label: t('material.colors.quartz') },
    { value: 'topaz', label: t('material.colors.topaz') },
    { value: 'amber', label: t('material.colors.amber') },
    { value: 'mahogany', label: t('material.colors.mahogany') },
    { value: 'maple', label: t('material.colors.maple') },
    { value: 'walnut', label: t('material.colors.walnut') },
    { value: 'cherry', label: t('material.colors.cherry') },
    { value: 'pine', label: t('material.colors.pine') },
    { value: 'oak', label: t('material.colors.oak') },
    { value: 'ashwood', label: t('material.colors.ashwood') },
    { value: 'driftwood', label: t('material.colors.driftwood') },
    { value: 'concrete', label: t('material.colors.concrete') },
    { value: 'cement', label: t('material.colors.cement') },
    { value: 'cementGray', label: t('material.colors.cementGray') },
    { value: 'snow', label: t('material.colors.snow') },
    { value: 'frost', label: t('material.colors.frost') },
    { value: 'glacier', label: t('material.colors.glacier') },
    { value: 'arctic', label: t('material.colors.arctic') },
    { value: 'sandstone', label: t('material.colors.sandstone') },
    { value: 'desert', label: t('material.colors.desert') },
    { value: 'clay', label: t('material.colors.clay') },
    { value: 'moss', label: t('material.colors.moss') },
  ];

  // قائمة الجنسيات العالمية الشائعة
  const nationalitiesOptions = [
    { value: 'saudi', label: t('material.countries.saudi') },
    { value: 'italian', label: t('material.countries.italian') },
    { value: 'chinese', label: t('material.countries.chinese') },
    { value: 'indian', label: t('material.countries.indian') },
    { value: 'emirati', label: t('material.countries.emirati') },
    { value: 'omani', label: t('material.countries.omani') },
    { value: 'turkish', label: t('material.countries.turkish') },
    { value: 'spanish', label: t('material.countries.spanish') },
    { value: 'egyptian', label: t('material.countries.egyptian') },
    { value: 'brazilian', label: t('material.countries.brazilian') },
    { value: 'greek', label: t('material.countries.greek') },
    { value: 'mexican', label: t('material.countries.mexican') },
    { value: 'portuguese', label: t('material.countries.portuguese') },
    { value: 'german', label: t('material.countries.german') },
    { value: 'tunisian', label: t('material.countries.tunisian') },
    { value: 'french', label: t('material.countries.french') },
    { value: 'algerian', label: t('material.countries.algerian') },
    { value: 'iranian', label: t('material.countries.iranian') },
    { value: 'argentine', label: t('material.countries.argentine') },
    { value: 'indonesian', label: t('material.countries.indonesian') },
  ];

  const categoryOptions = [
    { value: 'ceramic', label: t('material.ceramic') },
    { value: 'porcelain', label: t('material.porcelain') },
    { value: 'marble', label: t('material.marble') },
    { value: 'stone', label: t('material.stone') },
  ];
  const finishTypeOptions = [
    { value: 'glossy', label: t('material.glossy') },
    { value: 'matte', label: t('material.matte') },
    { value: 'semi-gloss', label: t('material.semi-gloss') },
    { value: 'polished', label: t('material.polished') },
  ];

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-6 pb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          {material ? t('warehouse.editMaterial') : t('warehouse.addMaterial')}
        </h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
        >
          <X className="h-6 w-6" />
        </button>
      </div>

      <form onSubmit={handleSubmit((data) => {
        // Combine dimensions
        data.dimension = `${data.length || ''}x${data.width || ''}x${data.thickness || ''}`;
        onSubmit(data);
      })} className="flex flex-col h-full px-6">
        <div className="flex-1 space-y-6 overflow-y-auto">
        {/* Image Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">{t('material.image')}</label>
          <div className="flex items-center space-x-4 rtl:space-x-reverse">
            <div className="h-20 w-20 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
              {imagePreview ? (
                <img src={imagePreview} alt="Preview" className="h-full w-full object-cover" />
              ) : (
                <Image className="h-8 w-8 text-gray-400" />
              )}
            </div>
            <div>
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleImageChange}
                className="hidden"
                id="photo-upload"
                name="image"
              />
              <label
                htmlFor="photo-upload"
                className="cursor-pointer bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors duration-200 flex items-center space-x-2 rtl:space-x-reverse"
              >
                <Upload className="h-4 w-4" />
                <span>{t('material.uploadImage')}</span>
              </label>
            </div>
          </div>
        </div>
        {/* Category & Finish Type in one row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Category Autocomplete */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('material.category')} <span className="text-red-500">*</span>
            </label>
            <Controller
              name="category"
              control={control}
              rules={{ required: true }}
              render={({ field }) => (
                <Autocomplete
                  options={categoryOptions}
                  getOptionLabel={option => option.label}
                  isOptionEqualToValue={(option, value) => option.value === value.value}
                  value={categoryOptions.find(opt => opt.value === field.value) || null}
                  onChange={(_, value) => field.onChange(value ? value.value : '')}
                  openOnFocus
                  dir={isRTL ? 'rtl' : 'ltr'}
                  slotProps={{
                    paper: {
                      sx: {
                        backgroundColor: (theme) => theme.palette.mode === 'dark' ? '#23272f' : '#fff',
                        color: (theme) => theme.palette.mode === 'dark' ? '#fff' : '#111',
                      },
                    },
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      required
                      error={!!errors.category}
                      helperText={errors.category ? t('form.required') : ''}
                      placeholder={isRTL ? 'اختر الفئة' : 'Select category'}
                      InputProps={{
                        ...params.InputProps,
                        sx: {
                          height: 40,
                          backgroundColor: (theme) => theme.palette.mode === 'dark' ? '#1f2937' : '#fff',
                          color: (theme) => theme.palette.mode === 'dark' ? '#fff' : '#111',
                          direction: isRTL ? 'rtl' : 'ltr',
                          textAlign: isRTL ? 'right' : 'left',
                          '& .MuiAutocomplete-endAdornment': {
                            right: isRTL ? 'unset' : 0,
                            left: isRTL ? 0 : 'unset',
                            flexDirection: isRTL ? 'row-reverse' : 'row',
                          },
                        },
                      }}
                      inputProps={{
                        ...params.inputProps,
                        style: {
                          paddingLeft: isRTL ? 0 : undefined,
                          paddingRight: isRTL ? undefined : 0,
                          textAlign: isRTL ? 'right' : 'left',
                        }
                      }}
                    />
                  )}
                />
              )}
            />
          </div>
          {/* Finish Type Autocomplete */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('material.finishType')} <span className="text-red-500">*</span>
            </label>
            <Controller
              name="finishType"
              control={control}
              rules={{ required: true }}
              render={({ field }) => (
                <Autocomplete
                  options={finishTypeOptions}
                  getOptionLabel={option => option.label}
                  isOptionEqualToValue={(option, value) => option.value === value.value}
                  value={finishTypeOptions.find(opt => opt.value === field.value) || null}
                  onChange={(_, value) => field.onChange(value ? value.value : '')}
                  openOnFocus
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      required
                      error={!!errors.finishType}
                      helperText={errors.finishType ? t('form.required') : ''}
                      placeholder={isRTL ? 'اختر نوع التشطيب' : 'Select finish type'}
                      InputProps={{
                        ...params.InputProps,
                        sx: {
                          height: 40,
                          backgroundColor: (theme) => theme.palette.mode === 'dark' ? '#23272f' : '#fff',
                          color: (theme) => theme.palette.mode === 'dark' ? '#fff' : '#111',
                        },
                      }}
                    />
                  )}
                />
              )}
            />
          </div>
        </div>
        {/* Code & Price in one row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            label={t('material.code')}
            name="code"
            type="number"
            register={register}
            required
            errors={errors}
            validate={(v: any) => (!isNaN(Number(v)) && Number(v) >= 0 && Number.isInteger(Number(v))) || 'يجب إدخال رقم موجب فقط'}
            placeholder={placeholderCode}
          />
          <FormField
            label={t('material.price')}
            name="price"
            type="number"
            step="0.5"
            register={register}
            required
            errors={errors}
            validate={(v: any) => (!isNaN(Number(v)) && Number(v) >= 0) || 'يجب إدخال رقم موجب فقط'}
            placeholder={placeholderPrice}
          />
        </div>
        {/* Color & Country in one row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Color Autocomplete */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('material.color')} <span className="text-red-500">*</span>
            </label>
            <Controller
              name="color"
              control={control}
              rules={{ required: true }}
              render={({ field }) => (
                <Autocomplete
                  options={colorOptions}
                  getOptionLabel={option => option.label}
                  isOptionEqualToValue={(option, value) => option.value === value.value}
                  value={colorOptions.find(opt => opt.value === field.value) || null}
                  onChange={(_, value) => field.onChange(value ? value.value : '')}
                  openOnFocus
                  popupIcon={<ArrowDropDownIcon />}
                  slotProps={{
                    paper: {
                      sx: {
                        backgroundColor: (theme) => theme.palette.mode === 'dark' ? '#23272f' : '#fff',
                        color: (theme) => theme.palette.mode === 'dark' ? '#fff' : '#111',
                      },
                    },
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      required
                      error={!!errors.color}
                      helperText={errors.color ? t('form.required') : ''}
                      placeholder={isRTL ? 'اختر اللون' : 'Select color'}
                      InputProps={{
                        ...params.InputProps,
                        sx: {
                          height: 40,
                          backgroundColor: (theme) => theme.palette.mode === 'dark' ? '#1f2937' : '#fff',
                          color: (theme) => theme.palette.mode === 'dark' ? '#fff' : '#111',
                        },
                      }}
                    />
                  )}
                />
              )}
            />
          </div>
          {/* Country Autocomplete */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('material.country')} <span className="text-red-500">*</span>
            </label>
            <Controller
              name="country"
              control={control}
              rules={{ required: true }}
              render={({ field }) => (
                <Autocomplete
                  options={nationalitiesOptions}
                  getOptionLabel={option => option.label}
                  isOptionEqualToValue={(option, value) => option.value === value.value}
                  value={nationalitiesOptions.find(opt => opt.value === field.value) || null}
                  onChange={(_, value) => field.onChange(value ? value.value : '')}
                  openOnFocus
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      required
                      error={!!errors.country}
                      helperText={errors.country ? t('form.required') : ''}
                      placeholder={isRTL ? 'اختر الدولة' : 'Select country'}
                      InputProps={{
                        ...params.InputProps,
                        sx: {
                          height: 40,
                          backgroundColor: (theme) => theme.palette.mode === 'dark' ? '#23272f' : '#fff',
                          color: (theme) => theme.palette.mode === 'dark' ? '#fff' : '#111',
                        },
                      }}
                    />
                  )}
                />
              )}
            />
          </div>
        </div>
        {/* Dimensions: Length, Width, Thickness */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            label={t('material.length')}
            name="length"
            type="number"
            register={register}
            required
            errors={errors}
            validate={(v: any) => (!isNaN(Number(v)) && Number(v) >= 0) || 'يجب إدخال رقم موجب فقط'}
            placeholder={placeholderLength}
          />
          <FormField
            label={t('material.width')}
            name="width"
            type="number"
            register={register}
            required
            errors={errors}
            validate={(v: any) => (!isNaN(Number(v)) && Number(v) >= 0) || 'يجب إدخال رقم موجب فقط'}
            placeholder={placeholderWidth}
          />
          <FormField
            label={t('material.thickness')}
            name="thickness"
            type="number"
            register={register}
            required
            errors={errors}
            validate={(v: any) => (!isNaN(Number(v)) && Number(v) >= 0) || 'يجب إدخال رقم موجب فقط'}
            placeholder={placeholderThickness}
          />
        </div>
        {/* Quantity m2, Items per box, and Quantity box in one row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            label={t('material.quantitym2')}
            name="quantity_m2"
            type="number"
            register={register}
            required
            errors={errors}
            validate={(v: any) => (!isNaN(Number(v)) && Number(v) >= 0) || 'يجب إدخال رقم موجب فقط'}
            placeholder={placeholderQtyM2}
          />
          <FormField
            label={t('material.itemsPerBox')}
            name="items_per_box"
            type="number"
            register={register}
            required
            errors={errors}
            validate={(v: any) => (!isNaN(Number(v)) && Number(v) > 0 && Number.isInteger(Number(v))) || 'يجب إدخال رقم صحيح أكبر من الصفر'}
            placeholder={isRTL ? 'أدخل عدد القطع في الصندوق' : 'Items per box'}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('material.quantitybox')} <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={calculatedBox}
              disabled
              className={`block w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 ${isRTL ? 'text-right' : ''}`}
              placeholder={placeholderQtyBox}
            />
          </div>
        </div>
        {/* Factory */}
        <FormField
          label={t('material.factory')}
          name="factory"
          register={register}
          errors={errors}
          placeholder={placeholderFactory}
        />
        </div>
        {/* Actions */}
        <div className="py-6 border-t border-gray-200">
          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            {loading ? t('common.loading') : t('common.save')}
          </button>
        </div>
      </form>
    </div>
  );
};

const FormField: React.FC<{
  label: string;
  name: keyof (Material & { length?: string; width?: string; thickness?: string });
  type?: string;
  step?: string;
  register: any;
  required?: boolean;
  errors: Partial<Record<string, { message?: string }>>;
  validate?: (v: any) => boolean | string;
  placeholder?: string;
}> = ({ label, name, type = 'text', step, register, required, errors, validate, placeholder }) => {
  const { isRTL } = useLanguage();

  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        step={step}
        placeholder={placeholder || label}
        {...register(name, {
          required: required ? 'هذا الحقل مطلوب' : false,
          valueAsNumber: type === 'number',
          validate: validate
        })}
        onKeyDown={(e) => {
          // الحقول الرقمية التي يجب تقييدها
          const numericFields = [
            'code', 'price', 'length', 'width', 'thickness', 'quantity_m2', 'quantity_box'
          ];
          if (type === 'number' && numericFields.includes(name as string)) {
            // السماح بالأرقام فقط وبعض الأزرار المساعدة
            if (
              (e.key >= '0' && e.key <= '9') ||
              ['Backspace', 'Tab', 'Delete', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key) ||
              // السماح بالنقطة فقط للحقول التي تقبل الكسور
              (step && e.key === '.' && name !== 'code' && name !== 'quantity_box')
            ) {
              return;
            } else {
              e.preventDefault();
            }
          }
        }}
        className={`block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 ${isRTL ? 'text-right' : ''} dark:bg-gray-800 dark:text-white bg-white text-gray-900`}
      />
      {errors?.[name]?.message && (
        <span className="text-red-500 text-xs">{errors[name]?.message}</span>
      )}
    </div>
  );
};

export default WarehouseDashboard;
export { MaterialModal };