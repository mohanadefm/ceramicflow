import React, { createContext, useContext, useState, useEffect } from 'react';
import i18n from '../i18n/config';

interface LanguageContextType {
  language: string;
  isRTL: boolean;
  t: (key: string, fallback?: string) => string;
  changeLanguage: (lang: string) => void;
  translateErrorMessage: (message: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    const savedLang = localStorage.getItem('language');
    return savedLang || 'ar';
  });

  const isRTL = language === 'ar';

  useEffect(() => {
    i18n.changeLanguage(language);
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
    localStorage.setItem('language', language);
  }, [language, isRTL]);

  const t = (key: string, fallback?: string): string => {
    try {
      const translation = i18n.t(key);
      return translation !== key ? translation : (fallback || key);
    } catch (error) {
      return fallback || key;
    }
  };

  const changeLanguage = (lang: string) => {
    setLanguage(lang);
  };

  // دالة مساعدة لترجمة رسائل الأخطاء من الباك اند
  const translateErrorMessage = (message: string): string => {
    // خريطة لربط رسائل الباك اند بمفاتيح الترجمة
    const errorMessageMap: { [key: string]: string } = {
      // رسائل المصادقة
      'All fields are required': 'messages.allFieldsRequired',
      'Type must be either exhibition or warehouse': 'messages.typeMustBeExhibitionOrWarehouse',
      'User with this email already exists': 'messages.userWithEmailExists',
      'User registered successfully': 'messages.userRegisteredSuccessfully',
      'Registration failed. Please try again.': 'messages.registrationFailed',
      'Validation failed': 'messages.validationFailed',
      'Email and password are required': 'messages.emailAndPasswordRequired',
      'Invalid email or password': 'messages.invalidEmailOrPassword',
      'Login failed. Please try again.': 'messages.loginFailed',
      'Failed to get user information': 'messages.failedToGetUserInfo',
      
      // رسائل المصادقة والتفويض
      'No token provided': 'messages.noTokenProvided',
      'User not found': 'messages.userNotFound',
      'Invalid token': 'messages.invalidToken',
      'Token expired': 'messages.tokenExpired',
      'Authentication failed': 'messages.authenticationFailed',
      'Authentication required': 'messages.authenticationRequired',
      'Access denied. Insufficient permissions.': 'messages.accessDeniedInsufficientPermissions',
      
      // رسائل المستخدمين
      'Warehouse registered successfully': 'messages.warehouseRegisteredSuccessfully',
      'Email or warehouse code already exists': 'messages.emailOrWarehouseCodeExists',
      'Failed to register warehouse': 'messages.failedToRegisterWarehouse',
      'Exhibition registered successfully': 'messages.exhibitionRegisteredSuccessfully',
      'Email already exists': 'messages.emailAlreadyExists',
      'Failed to register exhibition': 'messages.failedToRegisterExhibition',
      'Failed to fetch warehouses': 'messages.failedToFetchWarehouses',
      'Failed to fetch exhibitions': 'messages.failedToFetchExhibitions',
      'Failed to fetch user': 'messages.failedToFetchUser',
      'User updated successfully': 'messages.userUpdatedSuccessfully',
      'Failed to update user': 'messages.failedToUpdateUser',
      'Old and new passwords are required': 'messages.oldAndNewPasswordsRequired',
      'Old password is incorrect': 'messages.oldPasswordIncorrect',
      'Password updated successfully': 'messages.passwordUpdatedSuccessfully',
      'Failed to update password': 'messages.failedToUpdatePassword',
      
      // رسائل العملاء
      'Client created successfully': 'messages.clientCreatedSuccessfully',
      'Failed to create client': 'messages.failedToCreateClient',
      'Failed to fetch clients': 'messages.failedToFetchClients',
      'Client not found': 'messages.clientNotFound',
      'Failed to fetch client': 'messages.failedToFetchClient',
      'Client updated successfully': 'messages.clientUpdatedSuccessfully',
      'Failed to update client': 'messages.failedToUpdateClient',
      'Client deleted successfully': 'messages.clientDeletedSuccessfully',
      'Failed to delete client': 'messages.failedToDeleteClient',
      'Failed to fetch client statistics': 'messages.failedToFetchClientStatistics',
      'Email or phone number already exists.': 'messages.duplicateClient',
      
      // رسائل المنتجات
      'Failed to fetch products': 'messages.failedToFetchProducts',
      'SKU already exists for this warehouse, please choose a unique SKU.': 'messages.skuAlreadyExistsForWarehouse',
      'Product created successfully': 'messages.productCreatedSuccessfully',
      'Failed to create product': 'messages.failedToCreateProduct',
      'Failed to update product': 'messages.failedToUpdateProduct',
      'Failed to update status': 'messages.failedToUpdateStatus',
      'Failed to delete product': 'messages.failedToDeleteProduct',
      'Failed to fetch product': 'messages.failedToFetchProduct',
      'Failed to fetch product statistics': 'messages.failedToFetchProductStatistics',
      'Failed to fetch products for warehouse': 'messages.failedToFetchProductsForWarehouse',
      
      // رسائل الطلبات
      'Products array is required': 'messages.productsArrayRequired',
      'Order created successfully': 'messages.orderCreatedSuccessfully',
      'Failed to create order': 'messages.failedToCreateOrder',
      'Failed to fetch orders': 'messages.failedToFetchOrders',
      'Order not found': 'messages.orderNotFound',
      'Failed to fetch order': 'messages.failedToFetchOrder',
      'Failed to update order': 'messages.failedToUpdateOrder',
      'Failed to delete order': 'messages.failedToDeleteOrder',
      'Failed to fetch order statistics': 'messages.failedToFetchOrderStatistics',
      
      // رسائل العروض
      'Offer for this product already exists.': 'messages.offerForProductAlreadyExists',
      'Offer created successfully': 'messages.offerCreatedSuccessfully',
      'Failed to create offer': 'messages.failedToCreateOffer',
      'Failed to fetch offers': 'messages.failedToFetchOffers',
      'Offer not found': 'messages.offerNotFound',
      'Failed to fetch offer': 'messages.failedToFetchOffer',
      'Offer updated successfully': 'messages.offerUpdatedSuccessfully',
      'Failed to update offer': 'messages.failedToUpdateOffer',
      'Offer deleted successfully': 'messages.offerDeletedSuccessfully',
      'Failed to delete offer': 'messages.failedToDeleteOffer',
      'Failed to fetch offer statistics': 'messages.failedToFetchOfferStatistics',
      
      // رسائل الرفع
      'No file uploaded': 'messages.noFileUploaded',
      
      // رسائل عامة
      'Route not found': 'messages.routeNotFound',
      'Internal server error': 'messages.internalServerError',
      
      // رسائل مشتركة
      'Product not found': 'messages.productNotFound'
    };

    // البحث عن الرسالة في الخريطة
    const translationKey = errorMessageMap[message];
    if (translationKey) {
      return t(translationKey, message);
    }

    // إذا لم يتم العثور على الترجمة، إرجاع الرسالة الأصلية
    return message;
  };

  const value: LanguageContextType = {
    language,
    isRTL,
    t,
    changeLanguage,
    translateErrorMessage
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};