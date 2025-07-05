import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { Search, Building, Package, AlertCircle, Image } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

interface Warehouse {
  _id: string;
  name: string;
  email: string;
}

interface Material {
  _id: string;
  name: string;
  class: string;
  code: string;
  color: string;
  dimension: string;
  depth: string;
  quantity_m2: number;
  items_per_box: number;
  quantity_box: number;
  box_area: number;
  type: string;
  photo?: string;
  warehouseId: {
    name: string;
  };
}

const ExhibitionDashboard: React.FC = () => {
  const { t, isRTL } = useLanguage();
  const { user } = useAuth();
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('');
  const [searchCode, setSearchCode] = useState('');
  const [searchResult, setSearchResult] = useState<Material | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchPerformed, setSearchPerformed] = useState(false);

  useEffect(() => {
    fetchWarehouses();
  }, []);

  const fetchWarehouses = async () => {
    try {
      const response = await axios.get('/users/warehouses');
      setWarehouses(response.data.warehouses);
    } catch (error: any) {
      console.error('Error fetching warehouses:', error);
      toast.error(t('messages.networkError'));
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWarehouse || !searchCode.trim()) {
      toast.error(t('form.fillAllFields'));
      return;
    }

    setLoading(true);
    setSearchResult(null);
    setSearchPerformed(true);

    try {
      const response = await axios.get(`/materials/search/${selectedWarehouse}/${searchCode.trim()}`);
      setSearchResult(response.data.material);
    } catch (error: any) {
      if (error.response?.status === 404) {
        setSearchResult(null);
      } else {
        console.error('Search error:', error);
        toast.error(t('messages.networkError'));
      }
    } finally {
      setLoading(false);
    }
  };

  const resetSearch = () => {
    setSearchCode('');
    setSearchResult(null);
    setSearchPerformed(false);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-4 rtl:space-x-reverse">
          <div className="bg-blue-100 p-3 rounded-lg">
            <Building className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {t('dashboard.exhibitionDashboard')}
            </h1>
            <p className="text-gray-600">
              {t('dashboard.welcome')}, {user?.name}
            </p>
          </div>
        </div>
      </div>

      {/* Search Form */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center space-x-2 rtl:space-x-reverse">
          <Search className="h-5 w-5 text-gray-600" />
          <span>{t('warehouse.searchByCode')}</span>
        </h2>

        <form onSubmit={handleSearch} className="space-y-6">
          {/* Warehouse Selection */}
          <div>
            <label htmlFor="warehouse" className="block text-sm font-medium text-gray-700 mb-2">
              {t('warehouse.selectWarehouse')}
            </label>
            <div className="relative">
              <Building className={`absolute top-3 ${isRTL ? 'right-3' : 'left-3'} h-5 w-5 text-gray-400`} />
              <select
                id="warehouse"
                value={selectedWarehouse}
                onChange={(e) => {
                  setSelectedWarehouse(e.target.value);
                  resetSearch();
                }}
                className={`block w-full ${isRTL ? 'pr-10 text-right' : 'pl-10'} py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200`}
                required
              >
                <option value="">{t('warehouse.selectWarehouse')}</option>
                {warehouses.map((warehouse) => (
                  <option key={warehouse._id} value={warehouse._id}>
                    {warehouse.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Code Input */}
          <div>
            <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
              {t('material.code')}
            </label>
            <div className="relative">
              <Package className={`absolute top-3 ${isRTL ? 'right-3' : 'left-3'} h-5 w-5 text-gray-400`} />
              <input
                id="code"
                type="text"
                value={searchCode}
                onChange={(e) => setSearchCode(e.target.value)}
                className={`block w-full ${isRTL ? 'pr-10 text-right' : 'pl-10'} py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200`}
                placeholder={t('warehouse.enterCode')}
                required
              />
            </div>
          </div>

          {/* Search Button */}
          <div className="flex space-x-4 rtl:space-x-reverse">
            <button
              type="submit"
              disabled={loading || !selectedWarehouse || !searchCode.trim()}
              className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium"
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2 rtl:space-x-reverse">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>{t('common.loading')}</span>
                </div>
              ) : (
                t('warehouse.searchTile')
              )}
            </button>
            
            {searchPerformed && (
              <button
                type="button"
                onClick={resetSearch}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200"
              >
                {t('common.cancel')}
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Search Results */}
      {searchPerformed && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {t('common.search')} {t('common.result')}
          </h3>
          
          {searchResult ? (
            <MaterialCard material={searchResult} />
          ) : (
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">
                {t('warehouse.notFound')}
              </h4>
              <p className="text-gray-600">
                Code: <span className="font-mono font-medium">{searchCode}</span>
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const MaterialCard: React.FC<{ material: Material }> = ({ material }) => {
  const { t, isRTL } = useLanguage();

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <div className="grid md:grid-cols-3 gap-6 p-6">
        {/* Image */}
        <div className="md:col-span-1">
          <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
            {material.photo ? (
              <img
                src={material.photo.startsWith('http') ? material.photo : `http://localhost:5000${material.photo}`}
                alt={material.name}
                className="w-full h-full object-cover"
                onError={e => { e.currentTarget.src = '/logo.png'; }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Image className="h-12 w-12 text-gray-400" />
              </div>
            )}
          </div>
        </div>

        {/* Details */}
        <div className="md:col-span-2 space-y-4">
          <div>
            <h4 className="text-xl font-bold text-gray-900 mb-2">{material.name}</h4>
            <p className="text-gray-600">{t('warehouse.warehouse')}: {material.warehouseId.name}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-3">
              <DetailItem label={t('material.class')} value={material.class} />
              <DetailItem label={t('material.code')} value={material.code} />
              <DetailItem label={t('material.color')} value={material.color} />
              <DetailItem label={t('material.dimension')} value={material.dimension} />
              <DetailItem label={t('material.depth')} value={material.depth} />
            </div>
            
            <div className="space-y-3">
              <DetailItem label={t('material.quantityM2')} value={`${material.quantity_m2} m²`} />
              <DetailItem label={t('material.itemsPerBox')} value={material.items_per_box.toString()} />
              <DetailItem label={t('material.quantityBox')} value={material.quantity_box.toString()} />
              <DetailItem label={t('material.boxArea')} value={`${material.box_area} m²`} />
              <DetailItem label={t('material.type')} value={material.type} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const DetailItem: React.FC<{ label: string; value: string }> = ({ label, value }) => {
  return (
    <div>
      <dt className="text-sm font-medium text-gray-500">{label}</dt>
      <dd className="text-sm text-gray-900 font-medium">{value}</dd>
    </div>
  );
};

export default ExhibitionDashboard;