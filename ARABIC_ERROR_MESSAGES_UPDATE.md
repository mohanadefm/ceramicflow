# تحديث ترجمة رسائل الأخطاء إلى اللغة العربية

## ملخص التحديثات

تم فحص النظام بالكامل وترجمة جميع رسائل التوست (الأخطاء التي تأتي من الباك اند) إلى اللغة العربية.

## الملفات المحدثة

### 1. ملفات الترجمة
- `src/i18n/locales/ar.json` - تم إضافة جميع رسائل الأخطاء باللغة العربية
- `src/i18n/locales/en.json` - تم إضافة جميع رسائل الأخطاء باللغة الإنجليزية

### 2. ملفات السياق (Context)
- `src/contexts/LanguageContext.tsx` - تم إضافة دالة `translateErrorMessage` لترجمة رسائل الأخطاء
- `src/contexts/AuthContext.tsx` - تم تطبيق الترجمة على رسائل الأخطاء

### 3. ملفات المكونات
- `src/pages/Clients.tsx` - تم تطبيق الترجمة على رسائل الأخطاء
- `src/components/Layout.tsx` - تم تطبيق الترجمة على رسائل الأخطاء

## رسائل الأخطاء المضافة

### رسائل المصادقة
- `allFieldsRequired` - "جميع الحقول مطلوبة"
- `typeMustBeExhibitionOrWarehouse` - "النوع يجب أن يكون إما معرض أو مستودع"
- `userWithEmailExists` - "المستخدم بهذا البريد الإلكتروني موجود بالفعل"
- `userRegisteredSuccessfully` - "تم تسجيل المستخدم بنجاح"
- `registrationFailed` - "فشل التسجيل. يرجى المحاولة مرة أخرى."
- `validationFailed` - "فشل التحقق من صحة البيانات"
- `emailAndPasswordRequired` - "البريد الإلكتروني وكلمة المرور مطلوبان"
- `invalidEmailOrPassword` - "البريد الإلكتروني أو كلمة المرور غير صحيحة"
- `loginFailed` - "فشل تسجيل الدخول. يرجى المحاولة مرة أخرى."
- `failedToGetUserInfo` - "فشل في الحصول على معلومات المستخدم"

### رسائل المصادقة والتفويض
- `noTokenProvided` - "لم يتم توفير رمز المصادقة"
- `userNotFound` - "المستخدم غير موجود"
- `invalidToken` - "رمز المصادقة غير صحيح"
- `tokenExpired` - "انتهت صلاحية رمز المصادقة"
- `authenticationFailed` - "فشل المصادقة"
- `authenticationRequired` - "المصادقة مطلوبة"
- `accessDeniedInsufficientPermissions` - "تم رفض الوصول. صلاحيات غير كافية."

### رسائل المستخدمين
- `warehouseRegisteredSuccessfully` - "تم تسجيل المستودع بنجاح"
- `emailOrWarehouseCodeExists` - "البريد الإلكتروني أو كود المستودع موجود بالفعل"
- `failedToRegisterWarehouse` - "فشل في تسجيل المستودع"
- `exhibitionRegisteredSuccessfully` - "تم تسجيل المعرض بنجاح"
- `emailAlreadyExists` - "البريد الإلكتروني موجود بالفعل"
- `failedToRegisterExhibition` - "فشل في تسجيل المعرض"
- `failedToFetchWarehouses` - "فشل في جلب المستودعات"
- `failedToFetchExhibitions` - "فشل في جلب المعارض"
- `failedToFetchUser` - "فشل في جلب المستخدم"
- `userUpdatedSuccessfully` - "تم تحديث المستخدم بنجاح"
- `failedToUpdateUser` - "فشل في تحديث المستخدم"
- `oldAndNewPasswordsRequired` - "كلمة المرور القديمة والجديدة مطلوبتان"
- `oldPasswordIncorrect` - "كلمة المرور القديمة غير صحيحة"
- `passwordUpdatedSuccessfully` - "تم تحديث كلمة المرور بنجاح"
- `failedToUpdatePassword` - "فشل في تحديث كلمة المرور"

### رسائل العملاء
- `clientCreatedSuccessfully` - "تم إنشاء العميل بنجاح"
- `failedToCreateClient` - "فشل في إنشاء العميل"
- `failedToFetchClients` - "فشل في جلب العملاء"
- `clientNotFound` - "العميل غير موجود"
- `failedToFetchClient` - "فشل في جلب العميل"
- `clientUpdatedSuccessfully` - "تم تحديث العميل بنجاح"
- `failedToUpdateClient` - "فشل في تحديث العميل"
- `clientDeletedSuccessfully` - "تم حذف العميل بنجاح"
- `failedToDeleteClient` - "فشل في حذف العميل"
- `failedToFetchClientStatistics` - "فشل في جلب إحصائيات العملاء"

### رسائل المنتجات
- `failedToFetchProducts` - "فشل في جلب المنتجات"
- `skuAlreadyExistsForWarehouse` - "رمز المنتج موجود بالفعل لهذا المستودع، يرجى اختيار رمز فريد."
- `productCreatedSuccessfully` - "تم إنشاء المنتج بنجاح"
- `failedToCreateProduct` - "فشل في إنشاء المنتج"
- `productNotFound` - "المنتج غير موجود"
- `failedToUpdateProduct` - "فشل في تحديث المنتج"
- `failedToUpdateStatus` - "فشل في تحديث الحالة"
- `failedToDeleteProduct` - "فشل في حذف المنتج"
- `failedToFetchProduct` - "فشل في جلب المنتج"
- `failedToFetchProductStatistics` - "فشل في جلب إحصائيات المنتجات"
- `failedToFetchProductsForWarehouse` - "فشل في جلب المنتجات للمستودع"

### رسائل الطلبات
- `productsArrayRequired` - "مصفوفة المنتجات مطلوبة"
- `orderCreatedSuccessfully` - "تم إنشاء الطلب بنجاح"
- `failedToCreateOrder` - "فشل في إنشاء الطلب"
- `failedToFetchOrders` - "فشل في جلب الطلبات"
- `orderNotFound` - "الطلب غير موجود"
- `failedToFetchOrder` - "فشل في جلب الطلب"
- `failedToUpdateOrder` - "فشل في تحديث الطلب"
- `failedToDeleteOrder` - "فشل في حذف الطلب"
- `failedToFetchOrderStatistics` - "فشل في جلب إحصائيات الطلبات"

### رسائل العروض
- `offerForProductAlreadyExists` - "العرض لهذا المنتج موجود بالفعل."
- `offerCreatedSuccessfully` - "تم إنشاء العرض بنجاح"
- `failedToCreateOffer` - "فشل في إنشاء العرض"
- `failedToFetchOffers` - "فشل في جلب العروض"
- `offerNotFound` - "العرض غير موجود"
- `failedToFetchOffer` - "فشل في جلب العرض"
- `offerUpdatedSuccessfully` - "تم تحديث العرض بنجاح"
- `failedToUpdateOffer` - "فشل في تحديث العرض"
- `offerDeletedSuccessfully` - "تم حذف العرض بنجاح"
- `failedToDeleteOffer` - "فشل في حذف العرض"
- `failedToFetchOfferStatistics` - "فشل في جلب إحصائيات العروض"

### رسائل الرفع
- `noFileUploaded` - "لم يتم رفع أي ملف"

### رسائل عامة
- `routeNotFound` - "المسار غير موجود"
- `internalServerError` - "خطأ داخلي في الخادم"

## كيفية الاستخدام

### في المكونات
```typescript
import { useLanguage } from '../contexts/LanguageContext';

const MyComponent = () => {
  const { translateErrorMessage } = useLanguage();
  
  const handleError = (error: any) => {
    const message = error?.response?.data?.message || 'Server error';
    toast.error(translateErrorMessage(message));
  };
};
```

### في السياقات
```typescript
import { useLanguage } from './LanguageContext';

export const MyProvider = ({ children }) => {
  const { translateErrorMessage } = useLanguage();
  
  const handleApiError = (error: any) => {
    const message = error?.response?.data?.message || 'Server error';
    toast.error(translateErrorMessage(message));
  };
};
```

## آلية الترجمة

تم إنشاء دالة `translateErrorMessage` في `LanguageContext` التي تحتوي على خريطة تربط رسائل الباك اند الإنجليزية بمفاتيح الترجمة العربية. الدالة تبحث عن الرسالة في الخريطة وإذا وجدتها ترجع الترجمة العربية، وإلا ترجع الرسالة الأصلية.

## ملاحظات مهمة

1. جميع رسائل الأخطاء من الباك اند تم ترجمتها إلى العربية
2. تم الحفاظ على الرسائل الإنجليزية كنسخة احتياطية
3. الدالة الجديدة تدعم الترجمة التلقائية لجميع رسائل الأخطاء
4. تم تطبيق الترجمة على الملفات الرئيسية في النظام

## التحديثات المستقبلية

لإضافة رسائل أخطاء جديدة:
1. أضف الرسالة الإنجليزية إلى خريطة `errorMessageMap` في `LanguageContext`
2. أضف الترجمة العربية إلى ملف `ar.json`
3. أضف الترجمة الإنجليزية إلى ملف `en.json` 