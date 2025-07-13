import React, { useState, useRef, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useLanguage } from '../contexts/LanguageContext';
import { X, Upload, Image } from 'lucide-react';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

interface Offer {
  _id?: string;
  product: ProductOption | null;
  priceAfterDiscount: number;
  description?: string;
}

interface ProductOption {
  _id: string;
  sku: string;
  category: string;
  price: number;
}

interface OfferModalProps {
  offer: Offer | null;
  onClose: () => void;
  onSave: () => void;
  offers: Offer[];
}

const OfferModal: React.FC<OfferModalProps> = ({ offer, onClose, onSave, offers }) => {
  const { t, isRTL } = useLanguage();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [productLoading, setProductLoading] = useState(false);
  const [priceError, setPriceError] = useState<string | null>(null);

  const categoryOptions = [
    t("material.ceramic"),
    t("material.porcelain"),
    t("material.marble"),
    t("material.stone")
  ];
  const countryOptions = [
    t("material.countries.saudi"),
    t("material.countries.italian"),
    t("material.countries.chinese"),
    t("material.countries.indian"),
    t("material.countries.emirati"),
    t("material.countries.omani"),
    t("material.countries.turkish"),
    t("material.countries.spanish"),
    t("material.countries.egyptian"),
    t("material.countries.brazilian"),
    t("material.countries.greek"),
    t("material.countries.mexican"),
    t("material.countries.portuguese"),
    t("material.countries.german"),
    t("material.countries.tunisian"),
    t("material.countries.french"),
    t("material.countries.algerian"),
    t("material.countries.iranian"),
    t("material.countries.argentine"),
    t("material.countries.indonesian")
  ];
  const colorOptions = [
    t("material.colors.white"),
    t("material.colors.black"),
    t("material.colors.gray"),
    t("material.colors.beige"),
    t("material.colors.blue"),
    t("material.colors.red"),
    t("material.colors.green"),
    t("material.colors.yellow"),
    t("material.colors.brown"),
    t("material.colors.ivory"),
    t("material.colors.cream"),
    t("material.colors.pink"),
    t("material.colors.orange"),
    t("material.colors.purple"),
    t("material.colors.gold"),
    t("material.colors.silver"),
    t("material.colors.offWhite"),
    t("material.colors.lightGray"),
    t("material.colors.darkGray"),
    t("material.colors.sand"),
    t("material.colors.taupe"),
    t("material.colors.terracotta"),
    t("material.colors.olive"),
    t("material.colors.mint"),
    t("material.colors.skyBlue"),
    t("material.colors.navy"),
    t("material.colors.charcoal"),
    t("material.colors.maroon"),
    t("material.colors.teal"),
    t("material.colors.aqua"),
    t("material.colors.peach"),
    t("material.colors.coral"),
    t("material.colors.bronze"),
    t("material.colors.copper"),
    t("material.colors.slate"),
    t("material.colors.stone"),
    t("material.colors.almond"),
    t("material.colors.mocha"),
    t("material.colors.espresso"),
    t("material.colors.graphite"),
    t("material.colors.pearl"),
    t("material.colors.smoke"),
    t("material.colors.ash"),
    t("material.colors.cloud"),
    t("material.colors.linen"),
    t("material.colors.biscuit"),
    t("material.colors.bone"),
    t("material.colors.fawn"),
    t("material.colors.wheat"),
    t("material.colors.sable"),
    t("material.colors.steel"),
    t("material.colors.platinum"),
    t("material.colors.rust"),
    t("material.colors.jade"),
    t("material.colors.emerald"),
    t("material.colors.sapphire"),
    t("material.colors.ruby"),
    t("material.colors.onyx"),
    t("material.colors.quartz"),
    t("material.colors.topaz"),
    t("material.colors.amber"),
    t("material.colors.mahogany"),
    t("material.colors.maple"),
    t("material.colors.walnut"),
    t("material.colors.cherry"),
    t("material.colors.pine"),
    t("material.colors.oak"),
    t("material.colors.ashwood"),
    t("material.colors.driftwood"),
    t("material.colors.concrete"),
    t("material.colors.cement"),
    t("material.colors.cementGray"),
    t("material.colors.snow"),
    t("material.colors.frost"),
    t("material.colors.glacier"),
    t("material.colors.arctic"),
    t("material.colors.sandstone"),
    t("material.colors.desert"),
    t("material.colors.clay"),
    t("material.colors.moss")
  ];
  const finishTypeOptions = [
    t("material.glossy"),
    t("material.matte"),
    t("material.semiGloss"),
    t("material.polished")
  ];

  useEffect(() => {
    const fetchProducts = async () => {
      if (!user) return;
      setProductLoading(true);
      try {
        const res = await axios.get(`/products/warehouse/${user.id}?forOffers=true`);
        setProducts((res.data.products || []).map((p: any) => ({ ...p, price: p.price })));
        console.log('Products fetched for offers:', res.data.products);
      } catch (e) {
        setProducts([]);
      } finally {
        setProductLoading(false);
      }
    };
    fetchProducts();
  }, [user]);

  const getDefaultValues = () => {
    if (!offer) return { product: undefined };
    let selectedProduct = undefined;
    if (offer.product != null && products.length > 0) {
      if (typeof offer.product === 'object' && offer.product !== null && '_id' in offer.product) {
        selectedProduct = products.find(p => p._id === (offer.product as any)._id) || offer.product;
      }
    }
    return {
      ...offer,
      product: selectedProduct,
    };
  };

  const { register, handleSubmit, formState: { errors }, reset, control, setValue, getValues } = useForm<Offer>({
    defaultValues: getDefaultValues()
  });

  useEffect(() => {
    reset(getDefaultValues());
  }, [offer, products, reset]);

  const onSubmit = async (formDataRaw: any) => {
    setLoading(true);
    try {
      const data = formDataRaw as Offer & { product: ProductOption | null };
      const selectedProduct = data.product as ProductOption | null;
      if (!selectedProduct || typeof selectedProduct !== 'object' || !selectedProduct._id) {
        toast.error('يرجى اختيار منتج صحيح');
        setLoading(false);
        return;
      }
      const payload = {
        product: selectedProduct._id,
        priceAfterDiscount: Number(data.priceAfterDiscount),
        description: data.description || ''
      };
      if (offer && offer._id) {
        await axios.put(`/offers/${offer._id}`, payload);
        toast.success(t('messages.materialUpdated'));
      } else {
        await axios.post('/offers', payload);
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

  // فلترة المنتجات بحيث لا تظهر المنتجات التي لديها عرض بالفعل
  const offerProductIds = offers
    .map(o => (o.product && typeof o.product === 'object' && '_id' in o.product ? o.product._id : null))
    .filter((id): id is string => Boolean(id));

  const availableProducts: ProductOption[] = products.filter((p: ProductOption) => !offerProductIds.includes(p._id));

  // Validation for priceAfterDiscount
  const validatePrice = (value: any, selectedProduct: ProductOption | null) => {
    if (!selectedProduct) return true;
    if (Number(value) >= Number(selectedProduct.price)) {
      return `${t('offers.priceLowerThanOriginal')} (${t('material.originalPrice')}: ${selectedProduct.price} ${t('common.currency')})`;
    }
    return true;
  };

  return (
    <div className="p-6 flex flex-col h-full" style={{ minHeight: '60vh' }}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          {offer ? t('offers.editOffer') || 'Edit Offer' : t('offers.addOffer') || 'Add Offer'}
        </h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
        >
          <X className="h-6 w-6" />
        </button>
      </div>
      <form onSubmit={handleSubmit((data) => {
        onSubmit(data);
      })} className="flex flex-col flex-1 overflow-y-auto px-3 pt-6 space-y-6">
        {/* Product Autocomplete */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">{t('material.product')} <span className="text-red-500">*</span></label>
          <Controller
            name="product"
            control={control}
            rules={{ required: true }}
            render={({ field }) => (
              <Autocomplete
                options={availableProducts as ProductOption[]}
                loading={productLoading}
                getOptionLabel={(option: ProductOption) => option.sku + (option.category ? ` (${t(`material.categoryLabels.${option.category.toLowerCase()}`) || option.category})` : '')}
                isOptionEqualToValue={(option: ProductOption, value: ProductOption) => option._id === value._id}
                value={field.value as ProductOption || null}
                onChange={(_, value) => {
                  field.onChange(value as ProductOption | null);
                  setValue('product', value as ProductOption | null);
                  setValue('priceAfterDiscount', value?.price || 0);
                  setPriceError(null); // Reset price error on product change
                }}
                noOptionsText={t('material.noProducts')}
                renderInput={(params) => (
                  <TextField {...params} variant="outlined" size="small" required error={!!errors.product} helperText={errors.product ? t('form.required') : ''} />
                )}
                fullWidth
              />
            )}
          />
        </div>
        {/* Price After Discount */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">{t('offers.priceAfterDiscount') || 'Price After Discount'} <span className="text-red-500">*</span></label>
          <Controller
            // disabled={!getValues('product')}
            name="priceAfterDiscount"
            control={control}
            rules={{
              required: true,
              validate: (value) => validatePrice(value, getValues('product'))
            }}
            render={({ field }) => (
              <>
                <input
                  type="number"
                  step="0.25"
                  {...field}
                  onChange={e => {
                    field.onChange(e);
                    const selectedProduct = getValues('product');
                    const errorMsg = validatePrice(e.target.value, selectedProduct);
                    setPriceError(errorMsg === true ? null : errorMsg as string);
                  }}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {(errors.priceAfterDiscount || priceError) && (
                  <span className="text-red-500 text-xs">
                    {errors.priceAfterDiscount?.message || priceError || t('form.required')}
                  </span>
                )}
              </>
            )}
          />
        </div>
        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">{t('material.description') || 'Description'}</label>
          <textarea
            {...register('description')}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={4}
          />
        </div>
        {/* Spacer to push button down */}
        <div className="flex-1" />
        {/* Submit Button */}
        <div className="mt-auto flex justify-center pt-6 border-t border-gray-200">
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50"
          >
            {loading ? t('common.loading') : t('common.save')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default OfferModal; 