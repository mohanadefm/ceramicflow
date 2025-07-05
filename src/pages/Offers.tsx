import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Edit, Trash2, Image, Package, Warehouse, Tag } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import OfferModal from '../components/OfferModal';
import Drawer from '@mui/material/Drawer';
import { createPortal } from 'react-dom';
import { useTheme } from '../contexts/ThemeContext';

interface ProductOption {
  _id: string;
  sku: string;
  category: string;
  price: number;
  quantityInMeters?: number;
  quantityInBoxes?: number;
  finishType?: string;
  color?: string;
  country?: string;
  length?: number;
  width?: number;
  thickness?: number;
  factory?: string;
  image?: string;
}

interface Offer {
  _id: string;
  product: ProductOption | null;
  sku: string;
  image?: string;
  category: string;
  color?: string;
  finishType?: string;
  country: string;
  length?: number;
  width?: number;
  thickness?: number;
  price: number;
  priceAfterDiscount: number;
  quantityInMeters: number;
  quantityInBoxes: number;
  factory: string;
  description?: string;
  status?: string;
  createdAt: string;
  updatedAt: string;
}

const Offers: React.FC = () => {
  const { t, isRTL } = useLanguage();
  const { user } = useAuth();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;
  const [showModal, setShowModal] = useState(false);
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { theme } = useTheme();

  useEffect(() => {
    if (user) fetchOffers();
  }, [user, page]);

  const fetchOffers = async () => {
    try {
      const response = await axios.get('/offers', { params: { page, limit } });
      setOffers(response.data.offers);
      setTotalPages(Math.ceil((response.data.count || 1) / limit));
    } catch (error: any) {
      toast.error(t('messages.networkError'));
    } finally {
      setLoading(false);
    }
  };

  const handleAddOffer = () => {
    setEditingOffer(null);
    setShowModal(true);
  };

  const handleEditOffer = (offer: Offer) => {
    setEditingOffer(offer);
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditingOffer(null);
  };

  const handleOfferSaved = () => {
    fetchOffers();
    handleModalClose();
  };

  const handleDeleteOffer = async (id: string) => {
    setDeleting(true);
    try {
      await axios.delete(`/offers/${id}`);
      toast.success(t('messages.materialDeleted') || 'Offer deleted');
      fetchOffers();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error.message || 'حدث خطأ أثناء الحذف');
    } finally {
      setDeleting(false);
      setConfirmDeleteId(null);
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
      <div className={`rounded-xl shadow-sm border p-6 transition-colors duration-200 ${theme === 'dark' ? 'bg-[#23232a] border-gray-800' : 'bg-white border-gray-200'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 rtl:space-x-reverse">
            <div className="bg-blue-100 p-3 rounded-lg">
              <Tag className="h-8 w-8 text-blue-700" />
            </div>
            <div>
              <h1 className={`text-2xl font-bold transition-colors duration-200 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                {t('offers.title') || 'Offers'}
              </h1>
            </div>
          </div>
          <button
            onClick={handleAddOffer}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center space-x-2 rtl:space-x-reverse"
          >
            <Plus className="h-5 w-5" />
            <span>{t('offers.addOffer') || 'Add Offer'}</span>
          </button>
        </div>
      </div>
      <div className={`rounded-xl shadow-sm border overflow-hidden transition-colors duration-200 ${theme === 'dark' ? 'bg-[#23232a] border-gray-800' : 'bg-white border-gray-200'}`}>
        <div className="overflow-x-auto">
          {offers.length === 0 ? (
            <div className="text-center py-12">
              <Tag className={`h-12 w-12 mx-auto mb-4 ${theme === 'dark' ? 'text-gray-600' : 'text-gray-400'}`} />
              <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{t('offers.noOffers') || 'No offers found.'}</p>
            </div>
          ) : (
            <table className={`min-w-full divide-y border-b transition-colors duration-200 ${theme === 'dark' ? 'divide-gray-800 border-gray-800' : 'divide-gray-200 border-gray-200'}`} dir={isRTL ? 'rtl' : 'ltr'}>
              <thead className={theme === 'dark' ? 'bg-[#23232a]' : 'bg-gray-50'}>
                <tr>
                  <th className={`px-2 py-3 ${isRTL ? 'text-right' : 'text-left'} text-xs font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-gray-200' : 'text-gray-500'}`}>{t('material.sku')}</th>
                  <th className={`px-2 py-3 ${isRTL ? 'text-right' : 'text-left'} text-xs font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-gray-200' : 'text-gray-500'}`}>{t('material.image')}</th>
                  <th className={`px-2 py-3 ${isRTL ? 'text-right' : 'text-left'} text-xs font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-gray-200' : 'text-gray-500'}`}>{t('material.product')}</th>
                  <th className={`px-2 py-3 ${isRTL ? 'text-right' : 'text-left'} text-xs font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-gray-200' : 'text-gray-500'}`}>Size</th>
                  <th className={`px-2 py-3 ${isRTL ? 'text-right' : 'text-left'} text-xs font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-gray-200' : 'text-gray-500'}`}>{t('material.price')}</th>
                  <th className={`px-2 py-3 ${isRTL ? 'text-right' : 'text-left'} text-xs font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-gray-200' : 'text-gray-500'}`}>{t('offers.priceAfterDiscount')}</th>
                  <th className={`px-2 py-3 ${isRTL ? 'text-right' : 'text-left'} text-xs font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-gray-200' : 'text-gray-500'}`}>{t('material.quantityInMeters')}</th>
                  <th className={`px-2 py-3 ${isRTL ? 'text-right' : 'text-left'} text-xs font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-gray-200' : 'text-gray-500'}`}>{t('material.quantityInBoxes')}</th>
                  <th className={`px-2 py-3 ${isRTL ? 'text-right' : 'text-left'} text-xs font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-gray-200' : 'text-gray-500'}`}>{t('material.factory')}</th>
                  <th className={`px-2 py-3 ${isRTL ? 'text-right' : 'text-left'} text-xs font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-gray-200' : 'text-gray-500'}`}>{t('offers.description')}</th>
                  <th className="px-2 py-3 text-center text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-200">{t('warehouse.actions')}</th>
                </tr>
              </thead>
              <tbody className={`${theme === 'dark' ? 'bg-[#23232a] divide-gray-800' : 'bg-white divide-gray-200'}`}>
                {offers.map((offer) => (
                  <tr key={offer._id} className={`transition-colors duration-200 ${theme === 'dark' ? 'hover:bg-gray-800' : 'hover:bg-gray-50'}`}>
                    <td className={`px-2 py-4 whitespace-nowrap ${isRTL ? 'text-right' : 'text-left'}`}>
                      <span className="px-2 py-1 text-xs font-bold bg-blue-100 text-blue-700 rounded-md">
                        {offer.sku}
                      </span>
                    </td>
                    <td className={`px-2 py-4 whitespace-nowrap ${isRTL ? 'text-right' : 'text-left'}`}> 
                      <div className="h-12 w-12 rounded-lg bg-gray-100 overflow-hidden">
                        {offer.image ? (
                          <img
                            src={offer.image.startsWith('http') ? offer.image : `http://localhost:5000${offer.image}`}
                            alt={offer.sku}
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
                    <td className={`px-2 py-4 ${isRTL ? 'text-right' : 'text-left'} ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>
                      {[
                        offer.category ? (t(`material.${offer.category}`) || t(`categories.${offer.category}`) || offer.category) : null,
                        offer.color ? (t(`material.colors.${offer.color}`) || offer.color) : null,
                        offer.product && typeof offer.product === 'object' && 'finishType' in offer.product
                          ? (t(`material.${offer.product.finishType}`) || t(`material.finishType.${offer.product.finishType}`) || offer.product.finishType)
                          : (offer.finishType ? (t(`material.${offer.finishType}`) || t(`material.finishType.${offer.finishType}`) || offer.finishType) : null),
                        offer.country ? (t(`material.countries.${offer.country}`) || t(`material.country.${offer.country}`) || t(`material.${offer.country}`) || offer.country) : null
                      ].filter(Boolean).join(' ')}
                    </td>
                    <td className={`px-2 py-4 ${isRTL ? 'text-right' : 'text-left'} ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>
                      {offer.length && offer.width && offer.thickness ? `(${offer.length}×${offer.width}) ×${offer.thickness}` : '-'}
                    </td>
                    <td className={`px-2 py-4 ${isRTL ? 'text-right' : 'text-left'} ${theme === 'dark' ? 'text-gray-400' : 'text-gray-400'}`}>
                      <span className="line-through">{offer.price}</span>
                    </td>
                    <td className={`px-2 py-4 ${isRTL ? 'text-right' : 'text-left'}`}>
                      <span style={{ color: theme === 'dark' ? '#f87171' : '#dc2626', fontWeight: 'bold' }}>{offer.priceAfterDiscount}</span>
                    </td>
                    <td className={`px-2 py-4 ${isRTL ? 'text-right' : 'text-left'} ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>
                      {offer.product && typeof offer.product === 'object' && 'quantityInMeters' in offer.product
                        ? offer.product.quantityInMeters
                        : offer.quantityInMeters}
                    </td>
                    <td className={`px-2 py-4 ${isRTL ? 'text-right' : 'text-left'} ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>
                      {offer.product && typeof offer.product === 'object' && 'quantityInBoxes' in offer.product
                        ? offer.product.quantityInBoxes
                        : offer.quantityInBoxes}
                    </td>
                    <td className={`px-2 py-4 ${isRTL ? 'text-right' : 'text-left'} ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>{offer.factory}</td>
                    <td className={`px-2 py-4 ${isRTL ? 'text-right' : 'text-left'} ${theme === 'dark' ? 'text-gray-300' : 'text-gray-900'}`}>{offer.description}</td>
                    <td className="px-2 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center space-x-2 rtl:space-x-reverse">
                        <button className="text-blue-600 hover:text-blue-400 transition-colors duration-200" onClick={() => handleEditOffer(offer)}>
                          <Edit className="h-4 w-4" />
                        </button>
                        <button className="text-red-600 hover:text-red-400 transition-colors duration-200" onClick={() => setConfirmDeleteId(offer._id)}>
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {totalPages > 1 && (
            <div className={`w-full flex items-center py-4 gap-2 px-2 ${isRTL ? 'justify-end' : 'justify-end'}`}>
              <button
                onClick={() => setPage(1)}
                disabled={page === 1}
                className={`w-10 h-10 rounded-lg border flex items-center justify-center disabled:opacity-50 transition-colors duration-200 ${theme === 'dark' ? 'border-gray-800 bg-gray-900 text-gray-600' : 'border-gray-200 bg-gray-100 text-gray-400'}`}
                title={t('common.first') || 'First'}
              >
                ≪
              </button>
              <button
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                disabled={page === 1}
                className={`w-10 h-10 rounded-lg border flex items-center justify-center disabled:opacity-50 transition-colors duration-200 ${theme === 'dark' ? 'border-gray-800 bg-gray-900 text-gray-600' : 'border-gray-200 bg-gray-100 text-gray-400'}`}
                title={t('common.previous')}
              >
                <span className="text-lg">{isRTL ? '›' : '‹'}</span>
              </button>
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i + 1}
                  onClick={() => setPage(i + 1)}
                  className={`w-10 h-10 rounded-lg border font-medium transition-colors duration-150 ${page === i + 1 ? 'bg-blue-600 text-white font-bold' : theme === 'dark' ? 'bg-gray-900 text-gray-200 border-gray-800' : 'bg-gray-100 text-gray-700 border-gray-200'}`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={page === totalPages}
                className={`w-10 h-10 rounded-lg border flex items-center justify-center disabled:opacity-50 transition-colors duration-200 ${theme === 'dark' ? 'border-gray-800 bg-gray-900 text-gray-600' : 'border-gray-200 bg-gray-100 text-gray-400'}`}
                title={t('common.next')}
              >
                <span className="text-lg">{isRTL ? '‹' : '›'}</span>
              </button>
              <button
                onClick={() => setPage(totalPages)}
                disabled={page === totalPages}
                className={`w-10 h-10 rounded-lg border flex items-center justify-center disabled:opacity-50 transition-colors duration-200 ${theme === 'dark' ? 'border-gray-800 bg-gray-900 text-gray-600' : 'border-gray-200 bg-gray-100 text-gray-400'}`}
                title={t('common.last') || 'Last'}
              >
                ≫
              </button>
            </div>
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
        <OfferModal
          offer={editingOffer}
          onClose={handleModalClose}
          onSave={handleOfferSaved}
          offers={offers}
        />
      </Drawer>
      {confirmDeleteId && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-30">
          <div className={`rounded-lg shadow-lg p-8 w-full max-w-lg transition-colors duration-200 ${theme === 'dark' ? 'bg-[#23232a]' : 'bg-white'}`}>
            <h2 className={`text-lg font-bold mb-4 text-center ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{t('offers.confirmDeleteTitle') || 'تأكيد الحذف'}</h2>
            <p className={`mb-6 text-center ${theme === 'dark' ? 'text-gray-300' : ''}`}>{t('offers.confirmDeleteMsg') || 'هل أنت متأكد أنك تريد حذف هذا العرض؟'}</p>
            <div className="flex justify-between gap-2">
              <button
                className={`flex-1 py-2 rounded transition-colors duration-200 ${theme === 'dark' ? 'bg-gray-800 text-gray-200 hover:bg-gray-700' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                onClick={() => setConfirmDeleteId(null)}
                disabled={deleting}
              >
                {t('common.cancel') || 'إلغاء'}
              </button>
              <button
                className={`flex-1 py-2 rounded transition-colors duration-200 ${theme === 'dark' ? 'bg-red-700 text-white hover:bg-red-800' : 'bg-red-600 text-white hover:bg-red-700'}`}
                onClick={() => handleDeleteOffer(confirmDeleteId)}
                disabled={deleting}
              >
                {deleting ? t('common.loading') : t('common.delete') || 'حذف'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default Offers; 