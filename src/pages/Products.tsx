import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { 
  Package, 
  Plus, 
  Edit, 
  Trash2, 
  // AlertTriangle, 
  // BarChart3,
  Image,
  // Upload,
  X,
  // Warehouse
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
// import { useForm } from 'react-hook-form';
import Drawer from '@mui/material/Drawer';
import { createPortal } from 'react-dom';
// import WarehouseDashboard from './WarehouseDashboard';
import { MaterialModal } from './WarehouseDashboard';
import { useTheme } from '../contexts/ThemeContext';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';

interface Material {
  _id: string;
  name: string;
  class: string;
  code: string;
  sku?: string;
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
  photo?: string;
  isLowStock: boolean;
  lowStock: boolean;
  createdAt: string;
  updatedAt: string;
  description?: string;
  status?: string;
  finishType?: string;
  category: string;
  country: string;
  quantityInMeters?: number;
  quantityInBoxes?: number;
  image?: string;
  hasOffer: boolean;
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

const Products: React.FC = () => {
  const { t, isRTL } = useLanguage();
  const { user } = useAuth();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [materialToDelete, setMaterialToDelete] = useState<Material | null>(null);
  // const limit = 10;
  const { theme } = useTheme();
  const [searchCode, setSearchCode] = useState('');
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [colorFilter, setColorFilter] = useState<string>('');
  const [countryFilter, setCountryFilter] = useState<string>('');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [offersOnly, setOffersOnly] = useState(false);
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [dialogImageUrl, setDialogImageUrl] = useState<string | null>(null);
  const categoryOptions = [
    { value: 'ceramic', label: t('material.Ceramic') || 'Ceramic' },
    { value: 'porcelain', label: t('material.Porcelain') || 'Porcelain' },
    { value: 'marble', label: t('material.Marble') || 'Marble' },
    { value: 'stone', label: t('material.Stone') || 'Stone' },
  ];
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

  // متغير لتحديد إذا كانت هناك فلاتر مفعلة
  const areFiltersActive = !!(categoryFilter || colorFilter || countryFilter || lowStockOnly || offersOnly);

  useEffect(() => {
    if (user) {
      if (searchCode.trim() !== '') {
        // Debounced search
        if (searchTimeout.current) clearTimeout(searchTimeout.current);
        searchTimeout.current = setTimeout(() => {
          fetchMaterials(searchCode.trim());
        }, 400);
      } else {
        fetchMaterials();
      }
    }
    // eslint-disable-next-line
  }, [user, sortBy, sortOrder, page, searchCode, categoryFilter, colorFilter, countryFilter, lowStockOnly, offersOnly]);

  const fetchMaterials = async (searchValue?: string) => {
    if (!user) return;
    try {
      const params: any = { sortBy, sortOrder, page, limit: 10 };
      if (searchValue) params.code = searchValue;
      if (categoryFilter) params.category = categoryFilter;
      if (colorFilter) params.color = colorFilter;
      if (countryFilter) params.country = countryFilter;
      if (lowStockOnly) params.lowStock = true;
      if (offersOnly) params.hasOffer = true;
      const response = await axios.get('/products', {
        params
      });
      setMaterials(response.data.products);
      setTotalPages(response.data.pagination.total);
    } catch (error: any) {
      console.error('Error fetching products:', error);
      toast.error(t('messages.networkError'));
    } finally {
      setLoading(false);
    }
  };

  // const handleSort = (field: string) => {
  //   if (sortBy === field) {
  //     setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  //   } else {
  //     setSortBy(field);
  //     setSortOrder('asc');
  //   }
  // };

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
      await axios.delete(`/products/${materialId}`);
      toast.success(t('messages.materialDeleted'));
      fetchMaterials();
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
    fetchMaterials();
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
    <div className="">
{/* space-y-8 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 rtl:space-x-reverse">
            <div className="bg-blue-100 p-3 rounded-lg">
              <Package className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {t('warehouse.products')}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <input
                type="text"
                value={searchCode}
                onChange={e => setSearchCode(e.target.value)}
                placeholder={t('material.searchByCode') || 'بحث برقم المادة'}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm min-w-[180px] pr-8"
                style={{ direction: isRTL ? 'rtl' : 'ltr' }}
              />
              {searchCode && (
                <button
                  type="button"
                  onClick={() => setSearchCode('')}
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
              onClick={handleAddMaterial}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center space-x-2 rtl:space-x-reverse"
            >
              <Plus className="h-5 w-5" />
              <span>{t('warehouse.addMaterial')}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mt-3 mb-6">
        <div className="flex items-center flex-wrap gap-2 justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            <Autocomplete
              options={categoryOptions}
              getOptionLabel={option => option.label}
              isOptionEqualToValue={(option, value) => option.value === value.value}
              value={categoryOptions.find(opt => opt.value === categoryFilter) || null}
              onChange={(_, value) => {
                setCategoryFilter(value ? value.value : '');
                setPage(1);
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  // label={t('material.category')}
                  placeholder={t('material.selectCategory') || 'Select category'}
                  size="small"
                  sx={{ minWidth: 220 }}
                />
              )}
              openOnFocus
              clearOnEscape
            />
            <Autocomplete
              options={colorOptions}
              getOptionLabel={option => option.label}
              isOptionEqualToValue={(option, value) => option.value === value.value}
              value={colorOptions.find(opt => opt.value === colorFilter) || null}
              onChange={(_, value) => {
                setColorFilter(value ? value.value : '');
                setPage(1);
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  // label={t('material.color') || 'Color'}
                  placeholder={t('material.colors.selectColor') || 'Select color'}
                  size="small"
                  sx={{ minWidth: 220, }}
                />
              )}
              openOnFocus
              clearOnEscape
            />
            <Autocomplete
              options={nationalitiesOptions}
              getOptionLabel={option => option.label}
              isOptionEqualToValue={(option, value) => option.value === value.value}
              value={nationalitiesOptions.find(opt => opt.value === countryFilter) || null}
              onChange={(_, value) => {
                setCountryFilter(value ? value.value : '');
                setPage(1);
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  // label={t('material.country') || 'Country'}
                  placeholder={t('material.countries.selectCountry') || 'Select country'}
                  size="small"
                  sx={{ minWidth: 220 }}
                />
              )}
              openOnFocus
              clearOnEscape
            />
            <input
              type="checkbox"
              id="lowStockOnly"
              checked={lowStockOnly}
              onChange={e => {
                setLowStockOnly(e.target.checked);
                setPage(1);
              }}
              className="form-checkbox h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="lowStockOnly" className="text-sm text-gray-700 cursor-pointer select-none">
              {t('material.lowStockOnly') || 'Low Stock Only'}
            </label>
            <input
              type="checkbox"
              id="offersOnly"
              checked={offersOnly}
              onChange={e => {
                setOffersOnly(e.target.checked);
                setPage(1);
              }}
              className="form-checkbox h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="offersOnly" className="text-sm text-gray-700 cursor-pointer select-none">
              {t('material.offersOnly') || 'Offers Only'}
            </label>
          </div>
          <div className={`${isRTL ? 'mr-auto' : 'ml-auto'}`}>
            <button
              type="button"
              onClick={() => {
                setCategoryFilter('');
                setColorFilter('');
                setCountryFilter('');
                setLowStockOnly(false);
                setOffersOnly(false);
                setPage(1);
              }}
              className="px-3 py-1 rounded bg-gray-100 border border-gray-300 text-gray-700 transition-colors text-sm disabled:opacity-50 disabled:hover:bg-gray-100 hover:bg-gray-200"
              disabled={!areFiltersActive}
            >
              {t('common.resetFilters') || 'Reset Filters'}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto border-b border-gray-200">
        <div className="overflow-x-auto">
          {materials.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">{t('warehouse.nomaterials')}</p>
            </div>
          ) : (
            <React.Fragment>
              <table className="min-w-full divide-y divide-gray-200" dir={isRTL ? 'rtl' : 'ltr'}>
                <thead className="bg-gray-50">
                  <tr>
                    <th className={`px-2 py-3 ${isRTL ? 'text-right' : 'text-left'} text-xs font-medium text-gray-500 uppercase tracking-wider`}>{t('material.sku')}</th>
                    <th className={`px-2 py-3 ${isRTL ? 'text-right' : 'text-left'} text-xs font-medium text-gray-500 uppercase tracking-wider`}>{t('material.image')}</th>
                    <th className={`px-2 py-3 ${isRTL ? 'text-right' : 'text-left'} text-xs font-medium text-gray-500 uppercase tracking-wider`}>{t('material.product')}</th>
                    <th className={`px-2 py-3 ${isRTL ? 'text-right' : 'text-left'} text-xs font-medium text-gray-500 uppercase tracking-wider`}>{t('material.dimension')}</th>
                    <th className={`px-2 py-3 ${isRTL ? 'text-right' : 'text-left'} text-xs font-medium text-gray-500 uppercase tracking-wider`}>{t('material.price')}</th>
                    <th className={`px-2 py-3 ${isRTL ? 'text-right' : 'text-left'} text-xs font-medium text-gray-500 uppercase tracking-wider`}>{t('material.quantityInMeters')}</th>
                    <th className={`px-2 py-3 ${isRTL ? 'text-right' : 'text-left'} text-xs font-medium text-gray-500 uppercase tracking-wider`}>{t('material.quantityInBoxes')}</th>
                    <th className={`px-2 py-3 ${isRTL ? 'text-right' : 'text-left'} text-xs font-medium text-gray-500 uppercase tracking-wider`}>{t('material.itemsPerBox')}</th>
                    <th className={`px-2 py-3 ${isRTL ? 'text-right' : 'text-left'} text-xs font-medium text-gray-500 uppercase tracking-wider`}>{t('material.factory')}</th>
                    <th className={`px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider`}>{t('warehouse.actions')}</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {materials.map((material, index) => (
                    <tr
                      key={material._id}
                      className={`transition-colors duration-200 ${material.status !== 'active' ? 'bg-gray-100' : material.isLowStock ? 'dark:bg-red-800 bg-red-50 dark:border-red-900 border-red-200' : 'hover:bg-gray-50'}${index === materials.length - 1 ? ' !border-b border-gray-200' : ''}`}
                    >
                      <td className={`px-2 py-4 whitespace-nowrap ${isRTL ? 'text-right' : 'text-left'}`}>
                        <span className={"px-2 py-1 text-xs font-bold bg-blue-100 text-blue-700 rounded-md"}>
                          {material.sku || material.code}
                        </span>
                      </td>
                      <td className={`px-2 py-4 whitespace-nowrap ${isRTL ? 'text-right' : 'text-left'} relative justify-items-center`}> 
                        {material.hasOffer && (
                          <div className="absolute top-1 right-0 z-10">
                            <img
                              src="https://img.icons8.com/color/96/discount--v1.png"
                              alt="عرض خاص"
                              title="عرض خاص"
                              className="w-7 h-7"
                            />
                          </div>
                        )}
                        <div className="h-12 w-12 rounded-lg bg-gray-100 overflow-hidden cursor-pointer group" onClick={() => {
                          if (material.image) {
                            setDialogImageUrl(material.image.startsWith('http') ? material.image : `http://localhost:5000${material.image}`);
                            setShowImageDialog(true);
                          }
                        }}>
                          {material.image ? (
                            <img
                              src={material.image.startsWith('http') ? material.image : `http://localhost:5000${material.image}`}
                              alt={material.name}
                              style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 8, border: '2px solid rgb(229, 231, 235)' }}
                              onError={e => { e.currentTarget.src = '/logo.png'; }}
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center">
                              <Image className="h-6 w-6 text-gray-400" />
                            </div>
                          )}
                        </div>
                      </td>
                      <td className={`px-2 py-4 ${isRTL ? 'text-right' : 'text-left'} ${material.status !== 'active' ? 'text-gray-400' : 'text-gray-900'}`}>
                        {[
                          t(`material.${material.category}`),
                          t(`material.colors.${material.color}`),
                          t(`material.${material.finishType}`),
                          t(`material.countries.${material.country}`)
                        ].filter(Boolean).join(' ')}
                      </td>
                      <td className={`px-2 py-4 whitespace-nowrap text-sm ${material.status !== 'active' ? 'text-gray-400' : 'text-gray-900'} ${isRTL ? 'text-right' : 'text-left'}`}>{material.length && material.width && material.thickness ? `(${material.length}×${material.width}) ×${material.thickness}` : '-'}</td>
                      <td className={`px-2 py-4 whitespace-nowrap text-sm ${material.status !== 'active' ? 'text-gray-400' : 'text-gray-900'} ${isRTL ? 'text-right' : 'text-left'}`}>{material.price !== undefined ? material.price.toLocaleString() : '-'}</td>
                      <td className={`px-2 py-4 whitespace-nowrap text-sm ${material.status !== 'active' ? 'text-gray-400' : 'text-gray-900'} ${isRTL ? 'text-right' : 'text-left'}`}>{material.quantityInMeters !== undefined ? material.quantityInMeters.toFixed(1) : material.quantity_m2.toFixed(1)}</td>
                      <td className={`px-2 py-4 whitespace-nowrap text-sm ${material.status !== 'active' ? 'text-gray-400' : 'text-gray-900'} ${isRTL ? 'text-right' : 'text-left'}`}>
                        {material.quantityInBoxes !== undefined ? material.quantityInBoxes : (material.quantity_box !== undefined ? material.quantity_box : '-')}
                      </td>
                      <td className={`px-2 py-4 whitespace-nowrap text-sm ${material.status !== 'active' ? 'text-gray-400' : 'text-gray-900'} ${isRTL ? 'text-right' : 'text-left'}`}>{material.items_per_box !== undefined ? material.items_per_box : '-'}</td>
                      <td className={`px-2 py-4 whitespace-nowrap text-sm ${material.status !== 'active' ? 'text-gray-400' : 'text-gray-900'} ${isRTL ? 'text-right' : 'text-left'}`}>{material.factory || '-'}</td>
                      <td className="px-2 py-4 whitespace-nowrap text-center">
                        <Switch
                          checked={material.status === 'active'}
                          onChange={async (checked) => {
                            try {
                              await axios.put(`/products/${material._id}/status`, { status: checked ? 'active' : 'inactive' });
                              setMaterials((prev) => prev.map((m) => m._id === material._id ? { ...m, status: checked ? 'active' : 'inactive' } : m));
                            } catch (error) {
                              toast.error(t('messages.serverError'));
                            }
                          }}
                          isRTL={isRTL}
                        />
                        <div className="flex items-center justify-center space-x-2 rtl:space-x-reverse mt-2">
                          <button
                            onClick={() => handleEditMaterial(material)}
                            className="text-blue-600 hover:text-blue-900 transition-colors duration-200"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(material)}
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
                    title={t('common.first') || 'First'}
                  >
                    ≪
                  </button>
                  <button
                    onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                    disabled={page === 1}
                    className="w-10 h-10 rounded-lg border border-gray-200 bg-gray-100 text-gray-400 flex items-center justify-center disabled:opacity-50"
                    title={t('common.previous')}
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
                    title={t('common.next')}
                  >
                    <span className="text-lg">{isRTL ? '‹' : '›'}</span>
                  </button>
                  <button
                    onClick={() => setPage(totalPages)}
                    disabled={page === totalPages}
                    className="w-10 h-10 rounded-lg border border-gray-200 bg-gray-100 text-gray-400 flex items-center justify-center disabled:opacity-50"
                    title={t('common.last') || 'Last'}
                  >
                    ≫
                  </button>
                </div>
              )}
              {/* Image Dialog Modal */}
              {showImageDialog && dialogImageUrl && (
                <div
                  className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60"
                  onClick={() => setShowImageDialog(false)}
                >
                  <div
                    className="bg-white rounded-lg shadow-lg p-4 max-w-full max-h-full flex flex-col items-center relative"
                    onClick={e => e.stopPropagation()}
                  >
                    <button
                      className="absolute top-2 right-2 text-gray-600 hover:text-red-500 text-2xl font-bold focus:outline-none"
                      onClick={() => setShowImageDialog(false)}
                      aria-label="Close"
                    >
                      ×
                    </button>
                    <img
                      src={dialogImageUrl}
                      alt="Product Preview"
                      className="max-w-[90vw] max-h-[80vh] rounded-lg border border-gray-200 shadow"
                      style={{ objectFit: 'contain' }}
                    />
                  </div>
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
        <MaterialModal
          material={editingMaterial}
          onClose={handleModalClose}
          onSave={handleMaterialSaved}
        />
      </Drawer>
      {deleteDialogOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-lg">
            <h2 className="text-lg font-bold mb-4 text-center">{t('dialog.deletetitle') || 'تأكيد الحذف'}</h2>
            <p className="mb-6 text-center">{t('dialog.deletemessage') || 'هل أنت متأكد أنك تريد حذف هذه المادة؟'}</p>
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
    </div>
  );
};

export default Products; 