import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import Button from '@mui/material/Button';
import Sidebar from './Sidebar';
import { useLocation } from 'react-router-dom';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { LogOut, Globe, User, Package, Search, Sun, Moon, Bell, Settings, Edit, X } from 'lucide-react';
import Tooltip from '@mui/material/Tooltip';
import { useTranslation } from 'react-i18next';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout, updateUser } = useAuth();
  const { language, isRTL, translateErrorMessage, changeLanguage } = useLanguage();
  const { t } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const [logoutDialogOpen, setLogoutDialogOpen] = React.useState(false);
  const [userMenuOpen, setUserMenuOpen] = React.useState(false);
  const userMenuRef = React.useRef<HTMLDivElement>(null);
  const location = useLocation();
  const [accountDialogOpen, setAccountDialogOpen] = React.useState(false);
  const [accountForm, setAccountForm] = React.useState<any>({});
  const [accountLoading, setAccountLoading] = React.useState(false);
  const [accountPhoto, setAccountPhoto] = React.useState<File | null>(null);
  const [settingsDialogOpen, setSettingsDialogOpen] = React.useState(false);
  const [settingsForm, setSettingsForm] = React.useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [settingsLoading, setSettingsLoading] = React.useState(false);
  
  // Validation states
  const [formErrors, setFormErrors] = React.useState<{[key: string]: string}>({});

  // For extended fields
  const userAny = user as any;

  // Helper to get full photo URL
  const getPhotoUrl = (photo: string | undefined) => {
    if (!photo) return '/logo.png';
    // إذا كانت الصورة من Cloudinary، استخدمها مباشرة
    if (photo.startsWith('http')) return photo;
    // إذا كانت الصورة محلية (للتوافق مع البيانات القديمة)
    if (photo.startsWith('/uploads/')) return `http://localhost:5000${photo}`;
    return photo;
  };

  // Show sidebar only on warehouse dashboard and related pages
  const showSidebar = location.pathname.startsWith('/dashboard') || location.pathname.startsWith('/products') || location.pathname.startsWith('/orders') || location.pathname.startsWith('/offers') || location.pathname.startsWith('/support');

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    if (userMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [userMenuOpen]);

  // Open dialog and fill form
  const openAccountDialog = () => {
    setAccountForm({
      name: user?.name || '',
      phone: userAny?.phone || '',
      email: user?.email || '',
      address: userAny?.address || '',
      commercialRecord: userAny?.commercialRecord || '',
      accountNumbers: userAny?.accountNumbers?.join(',') || '',
      photo: userAny?.photo || '',
      taxNumber: userAny?.taxNumber || '',
      warehouseCode: userAny?.warehouseCode || '',
    });
    setAccountPhoto(null);
    setFormErrors({}); // Clear previous errors
    setAccountDialogOpen(true);
  };

  // Validation functions
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string): boolean => {
    const phoneRegex = /^05\d{8}$/;
    return phoneRegex.test(phone);
  };

  const validateTaxNumber = (taxNumber: string): boolean => {
    const taxRegex = /^\d+$/;
    return taxRegex.test(taxNumber);
  };

  // Handle form change with validation
  const handleAccountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setAccountForm((prev: any) => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
    
    // Real-time validation
    let error = '';
    if (name === 'email' && value && !validateEmail(value)) {
      error = t('validation.invalidEmail') || 'البريد الإلكتروني غير صحيح';
    } else if (name === 'phone' && value && !validatePhone(value)) {
      error = t('validation.invalidPhone') || 'رقم الجوال يجب أن يبدأ بـ 05 ويتبعه 8 أرقام';
    } else if (name === 'taxNumber' && value && !validateTaxNumber(value)) {
      error = t('validation.invalidTaxNumber') || 'الرقم الضريبي يجب أن يحتوي على أرقام فقط';
    }
    
    if (error) {
      setFormErrors(prev => ({ ...prev, [name]: error }));
    }
  };

  // Handle photo upload
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAccountPhoto(e.target.files[0]);
    }
  };

  // Submit account update
  const handleAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all fields before submission
    const errors: {[key: string]: string} = {};
    
    if (!validateEmail(accountForm.email)) {
      errors.email = t('validation.invalidEmail') || 'البريد الإلكتروني غير صحيح';
    }
    
    if (!validatePhone(accountForm.phone)) {
      errors.phone = t('validation.invalidPhone') || 'رقم الجوال يجب أن يبدأ بـ 05 ويتبعه 8 أرقام';
    }
    
    if (accountForm.taxNumber && !validateTaxNumber(accountForm.taxNumber)) {
      errors.taxNumber = t('validation.invalidTaxNumber') || 'الرقم الضريبي يجب أن يحتوي على أرقام فقط';
    }
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toast.error(t('validation.formErrors') || 'يرجى تصحيح الأخطاء في النموذج');
      return;
    }
    
    setAccountLoading(true);
    try {
      let photoUrl = accountForm.photo;
      if (accountPhoto) {
        const formData = new FormData();
        formData.append('photo', accountPhoto);
        // رفع الصورة مباشرة إلى مسار المستخدمين
        const uploadRes = await axios.put(`/users/${user?.id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        photoUrl = uploadRes.data.user.photo;
      }
      const payload: any = {
        name: accountForm.name,
        phone: accountForm.phone,
        email: accountForm.email,
        address: accountForm.address,
        photo: photoUrl,
        taxNumber: accountForm.taxNumber,
      };
      if (userAny?.type === 'warehouse') {
        payload.commercialRecord = accountForm.commercialRecord;
        payload.accountNumbers = accountForm.accountNumbers.split(',').map((n: string) => n.trim());
      }
      const res = await axios.put(`/users/${user?.id}`, payload);
      updateUser(res.data.user);
      toast.success(t('messages.accountUpdated') || 'تم تحديث الحساب بنجاح');
      setAccountDialogOpen(false);
      setFormErrors({}); // Clear errors on success
    } catch (error: any) {
      const message = error?.response?.data?.message || error.message || 'حدث خطأ أثناء تحديث الحساب';
      toast.error(translateErrorMessage(message));
    } finally {
      setAccountLoading(false);
    }
  };

  const handleSettingsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSettingsForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settingsForm.oldPassword || !settingsForm.newPassword || !settingsForm.confirmPassword) {
      toast.error(t('form.fillAllFields') || 'يرجى تعبئة جميع الحقول');
      return;
    }
    if (settingsForm.newPassword.length < 6) {
      toast.error(t('form.passwordMin') || 'كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }
    if (settingsForm.newPassword !== settingsForm.confirmPassword) {
      toast.error(t('form.passwordsDontMatch') || 'كلمتا المرور غير متطابقتين');
      return;
    }
    setSettingsLoading(true);
    try {
      await axios.put(`/users/${user?.id}/password`, {
        oldPassword: settingsForm.oldPassword,
        newPassword: settingsForm.newPassword
      });
      toast.success(t('messages.accountUpdated') || 'تم تغيير كلمة المرور بنجاح');
      setSettingsDialogOpen(false);
      setSettingsForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error: any) {
      const message = error?.response?.data?.message || error.message || 'حدث خطأ أثناء تغيير كلمة المرور';
      toast.error(translateErrorMessage(message));
    } finally {
      setSettingsLoading(false);
    }
  };

  return (
    <div className={`min-h-screen bg-gray-50 ${isRTL ? 'font-arabic' : ''}`}>
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white shadow-sm border-b border-gray-200">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo and Title */}
            <div className="flex items-center space-x-4 rtl:space-x-reverse">
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <img src="/logo.png" alt="CeramicFlow Logo" width={40} height={40} />
                <h1 className="text-xl font-bold" style={{ color: '#0052de', fontFamily: 'Poppins, sans-serif' }}>
  CeramicFlow
</h1>

              </div>
            </div>

            {/* User Info and Actions */}
            <div className="flex items-center space-x-0 rtl:space-x-reverse">
              {/* Language Toggle */}
              <Tooltip title={language === 'ar' ? 'تغيير اللغة' : 'Change language'} arrow 
              slotProps={{
                popper: {
                  sx: {
                    '& .MuiTooltip-tooltip': {
                      backgroundColor: '#eff6ff',
                      color: '#2563eb',
                      fontWeight: 'bold',
                      fontSize: 12,
                    },
                    '& .MuiTooltip-arrow': {
                      color: '#eff6ff',
                    },
                  }
                }
              }}
              >
                <button
                  onClick={() => changeLanguage(language === 'en' ? 'ar' : 'en')}
                  className={`flex items-center justify-center px-3 py-2 rounded-md transition-colors duration-200
                    ${theme === 'dark' ? 'text-gray-200 hover:text-blue-400 hover:bg-blue-900/30' : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'}`}
                  aria-label={language === 'en' ? 'العربية' : 'English'}
                >
                  <Globe className="h-5 w-5" />
                </button>
              </Tooltip>

              {/* Theme Toggle */}
              <Tooltip title={theme === 'dark' ? (language === 'ar' ? 'الوضع النهاري' : 'Day mode') : (language === 'ar' ? 'الوضع الليلي' : 'Night mode')} arrow
              slotProps={{
                popper: {
                  sx: {
                    '& .MuiTooltip-tooltip': {
                      backgroundColor: '#eff6ff',
                      color: '#2563eb',
                      fontWeight: 'bold',
                      fontSize: 12,
                    },
                    '& .MuiTooltip-arrow': {
                      color: '#eff6ff',
                    },
                  }
                }
              }}>
                <button
                  onClick={toggleTheme}
                  className={`flex items-center justify-center px-3 py-2 rounded-md transition-colors duration-200
                    ${theme === 'dark' ? 'text-gray-200 hover:text-blue-400 hover:bg-blue-900/30' : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'}`}
                  aria-label={theme === 'dark' ? t('theme.dayMode') : t('theme.nightMode')}
                >
                  {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                </button>
              </Tooltip>

              {/* Notification Bell */}
              <Tooltip title={language === 'ar' ? 'الإشعارات' : 'Notifications'} arrow 
              slotProps={{
                popper: {
                  sx: {
                    '& .MuiTooltip-tooltip': {
                      backgroundColor: '#eff6ff',
                      color: '#2563eb',
                      fontWeight: 'bold',
                      fontSize: 12,
                    },
                    '& .MuiTooltip-arrow': {
                      color: '#eff6ff',
                    },
                  }
                }
              }}>
                <button
                  className={`relative flex items-center px-3 py-2 rounded-md transition-colors duration-200
                    ${theme === 'dark' ? 'text-gray-200 hover:text-blue-400 hover:bg-blue-900/30' : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'}`}
                  aria-label="Notifications"
                >
                  <Bell className="h-5 w-5" />
                  {/* Notification dot (optional, for unread notifications) */}
                  {/* <span className="absolute top-2 right-2 block h-2 w-2 rounded-full bg-red-500"></span> */}
                </button>
              </Tooltip>

              {/* User Menu Button */}
              <div className="relative p-3" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen((open) => !open)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors duration-200
                    ${theme === 'dark' ? 'text-gray-200 hover:text-blue-400 hover:bg-blue-900/30' : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'}`}
                  aria-label="User menu"
                >
                  <img
                    src={getPhotoUrl(userAny?.photo)}
                    alt="User"
                    className="w-8 h-8 rounded-full object-cover border border-gray-300 shadow"
                  />
                  <span className="text-base font-medium">{user?.name}</span>
                </button>
                {userMenuOpen && (
                  <div className={`absolute ${isRTL ? 'left-0' : 'right-0'} mt-2 w-64 rounded-2xl shadow-2xl z-50 border transition-colors duration-200
                    ${theme === 'dark' ? 'bg-[#23232a] border-gray-700' : 'bg-white border border-gray-200'}`}
                  >
                    {/* Top user info */}
                    <div className="flex items-center gap-3 px-5 py-4 border-b transition-colors duration-200"
                      style={{ borderColor: theme === 'dark' ? '#333646' : '#e5e7eb' }}>
                      <div className="relative">
                        <img
                          src={getPhotoUrl(userAny?.photo)}
                          alt="User"
                          className="w-12 h-12 rounded-full object-cover border-2 border-primary-500 shadow"
                        />
                        <span className="absolute bottom-0 right-0 block w-3 h-3 rounded-full border-2 border-white bg-green-500"></span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-base text-gray-900 dark:text-white whitespace-normal break-words">{user?.name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-300 capitalize">{userAny?.type === 'warehouse' ? t('auth.warehouse') : t('auth.exhibition')}</div>
                      </div>
                    </div>
                    {/* Menu options */}
                    <div className="py-2">
                      <button
                        className={`flex items-center w-full px-5 py-3 gap-3 text-sm font-medium rounded-xl transition-colors duration-200
                          ${isRTL ? 'justify-end flex-row-reverse text-right' : 'justify-start'}
                          ${theme === 'dark' ? 'hover:bg-gray-800 text-gray-200' : 'hover:bg-gray-100 text-gray-700'}`}
                        onClick={() => { setUserMenuOpen(false); openAccountDialog(); }}
                      >
                        {isRTL ? (
                          <>
                            <span className="text-base font-semibold">{t('dialog.account')}</span>
                            <User className="h-6 w-6 opacity-80" />
                          </>
                        ) : (
                          <>
                            <User className="h-6 w-6 opacity-80" />
                            <span className="text-base font-semibold">{t('dialog.account')}</span>
                          </>
                        )}
                      </button>
                      <button
                        className={`flex items-center w-full px-5 py-3 gap-3 text-sm font-medium rounded-xl transition-colors duration-200 mt-1
                          ${isRTL ? 'justify-end flex-row-reverse text-right' : 'justify-start'}
                          ${theme === 'dark' ? 'hover:bg-gray-800 text-gray-200' : 'hover:bg-gray-100 text-gray-700'}`}
                        onClick={() => { setUserMenuOpen(false); setSettingsDialogOpen(true); }}
                      >
                        {isRTL ? (
                          <>
                            <span className="text-base font-semibold">{t('dialog.settings')}</span>
                            <Settings className="h-6 w-6 opacity-80" />
                          </>
                        ) : (
                          <>
                            <Settings className="h-6 w-6 opacity-80" />
                            <span className="text-base font-semibold">{t('dialog.settings')}</span>
                          </>
                        )}
                      </button>
                    </div>
                    <div className="px-5 pb-4 pt-2">
                      <button
                        className={`flex items-center justify-center w-full gap-2 py-2 rounded-xl font-semibold text-white bg-red-500 hover:bg-red-600 transition-colors duration-200 text-base shadow ${isRTL ? 'flex-row-reverse' : ''}`}
                        onClick={() => { setUserMenuOpen(false); setLogoutDialogOpen(true); }}
                      >
                        {isRTL ? (
                          <>
                            <span>{t('dialog.logout')}</span>
                            <LogOut className="h-5 w-5" style={{ transform: 'scaleX(-1)' }} />
                          </>
                        ) : (
                          <>
                            <LogOut className="h-5 w-5" />
                            <span>{t('dialog.logout')}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content with Sidebar */}
      <div className="flex">
        <Sidebar />
        <main className={`flex-1 w-full px-4 py-8 overflow-y-auto ${isRTL ? 'mr-56' : 'ml-56'}`}>
          {children}
        </main>
      </div>

      {/* Dialog تأكيد تسجيل الخروج */}
      {logoutDialogOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-lg">
            <h2 className="text-lg font-bold mb-4 text-center">{t("dialog.logoutTitle") || "تأكيد تسجيل الخروج"}</h2>
            <p className="mb-6 text-center">{t("dialog.logoutMessage") || "هل أنت متأكد أنك تريد تسجيل الخروج؟"}</p>
            <div className="flex justify-between gap-2">
              <button
                className="flex-1 bg-gray-200 text-gray-700 py-2 rounded hover:bg-gray-300"
                onClick={() => setLogoutDialogOpen(false)}
              >
                {t('dialog.cancel') || 'إلغاء'}
              </button>
              <button
                className="flex-1 bg-red-600 text-white py-2 rounded hover:bg-red-700"
                onClick={() => { setLogoutDialogOpen(false); logout(); }}
              >
                {t('auth.logout') || 'تسجيل الخروج'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dialog تعديل الحساب */}
      <Dialog open={accountDialogOpen} onClose={() => setAccountDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle className="bg-white dark:bg-[#23232a] text-gray-900 dark:text-gray-100 flex items-center justify-between">
          <span>{t('dialog.accountEditTitle') || 'تعديل الحساب'}</span>
          <IconButton onClick={() => setAccountDialogOpen(false)}>
            <X />
          </IconButton>
        </DialogTitle>
        <DialogContent className="bg-white dark:bg-[#23232a]">
          <form onSubmit={handleAccountSubmit} className="space-y-4 mt-2">
            <div className="flex flex-col items-center gap-2 mb-6">
              <label htmlFor="photo-upload" className="cursor-pointer">
                <img
                  src={accountPhoto ? URL.createObjectURL(accountPhoto) : getPhotoUrl(accountForm.photo)}
                  alt="User Photo"
                  className="w-20 h-20 rounded-full object-cover border-2 border-primary-500 shadow"
                />
                <input id="photo-upload" type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
              </label>
              <span className="text-xs text-gray-500 dark:text-gray-300">{t('dialog.accountPhotoHint') || 'انقر لتغيير الصورة'}</span>
            </div>
            <TextField
              label={t('form.name') || 'الاسم'}
              name="name"
              disabled={true}
              value={accountForm.name}
              onChange={handleAccountChange}
              fullWidth
              required
              className="mb-4 rounded-lg"
              InputLabelProps={{
                style: { color: theme === 'dark' ? '#e5e7eb' : undefined, textAlign: isRTL ? 'right' : 'left' },
                dir: isRTL ? 'rtl' : 'ltr'
              }}
              InputProps={{ style: { color: theme === 'dark' ? '#fff' : undefined, background: theme === 'dark' ? '#23232a' : undefined, borderRadius: 12, border: theme === 'dark' ? '1px solid #333646' : undefined, paddingRight: isRTL ? 16 : 8, paddingLeft: isRTL ? 8 : 16 } }}
            />
            <TextField
              label={t('form.phone') || 'رقم الجوال'}
              name="phone"
              value={accountForm.phone}
              onChange={handleAccountChange}
              fullWidth
              required
              error={!!formErrors.phone}
              helperText={formErrors.phone}
              className="mb-4 rounded-lg"
              InputLabelProps={{
                style: { color: theme === 'dark' ? '#e5e7eb' : undefined, textAlign: isRTL ? 'right' : 'left' },
                dir: isRTL ? 'rtl' : 'ltr'
              }}
              InputProps={{ style: { color: theme === 'dark' ? '#fff' : undefined, background: theme === 'dark' ? '#23232a' : undefined, borderRadius: 12, border: theme === 'dark' ? '1px solid #333646' : undefined, paddingRight: isRTL ? 16 : 8, paddingLeft: isRTL ? 8 : 16 } }}
            />
            <TextField
              label={t('form.email') || 'البريد الإلكتروني'}
              name="email"
              value={accountForm.email}
              onChange={handleAccountChange}
              fullWidth
              required
              type="email"
              error={!!formErrors.email}
              helperText={formErrors.email}
              className="mb-4 rounded-lg"
              InputLabelProps={{
                style: { color: theme === 'dark' ? '#e5e7eb' : undefined, textAlign: isRTL ? 'right' : 'left' },
                dir: isRTL ? 'rtl' : 'ltr'
              }}
              InputProps={{ style: { color: theme === 'dark' ? '#fff' : undefined, background: theme === 'dark' ? '#23232a' : undefined, borderRadius: 12, border: theme === 'dark' ? '1px solid #333646' : undefined, paddingRight: isRTL ? 16 : 8, paddingLeft: isRTL ? 8 : 16 } }}
            />
            <TextField
              label={t('form.address') || 'العنوان'}
              name="address"
              value={accountForm.address}
              onChange={handleAccountChange}
              fullWidth
              required
              className="mb-4 rounded-lg"
              InputLabelProps={{
                style: { color: theme === 'dark' ? '#e5e7eb' : undefined, textAlign: isRTL ? 'right' : 'left' },
                dir: isRTL ? 'rtl' : 'ltr'
              }}
              InputProps={{ style: { color: theme === 'dark' ? '#fff' : undefined, background: theme === 'dark' ? '#23232a' : undefined, borderRadius: 12, border: theme === 'dark' ? '1px solid #333646' : undefined, paddingRight: isRTL ? 16 : 8, paddingLeft: isRTL ? 8 : 16 } }}
            />
            <TextField
              label={t('form.taxNumber') || 'الرقم الضريبي'}
              name="taxNumber"
              value={accountForm.taxNumber}
              onChange={handleAccountChange}
              fullWidth
              required
              error={!!formErrors.taxNumber}
              helperText={formErrors.taxNumber}
              className="mb-4 rounded-lg"
              InputLabelProps={{
                style: { color: theme === 'dark' ? '#e5e7eb' : undefined, textAlign: isRTL ? 'right' : 'left' },
                dir: isRTL ? 'rtl' : 'ltr'
              }}
              InputProps={{ style: { color: theme === 'dark' ? '#fff' : undefined, background: theme === 'dark' ? '#23232a' : undefined, borderRadius: 12, border: theme === 'dark' ? '1px solid #333646' : undefined, paddingRight: isRTL ? 16 : 8, paddingLeft: isRTL ? 8 : 16 } }}
            />
            {userAny?.type === 'warehouse' && (
              <>
                <TextField
                  label={t('form.commercialRecord') || 'السجل التجاري'}
                  name="commercialRecord"
                  value={accountForm.commercialRecord}
                  onChange={handleAccountChange}
                  fullWidth
                  required
                  className="mb-4 rounded-lg"
                  InputLabelProps={{
                    style: { color: theme === 'dark' ? '#e5e7eb' : undefined, textAlign: isRTL ? 'right' : 'left' },
                    dir: isRTL ? 'rtl' : 'ltr'
                  }}
                  InputProps={{ style: { color: theme === 'dark' ? '#fff' : undefined, background: theme === 'dark' ? '#23232a' : undefined, borderRadius: 12, border: theme === 'dark' ? '1px solid #333646' : undefined, paddingRight: isRTL ? 16 : 8, paddingLeft: isRTL ? 8 : 16 } }}
                />
                <TextField
                  label={t('form.accountNumbers') || 'أرقام الحسابات (مفصولة بفاصلة)'}
                  name="accountNumbers"
                  value={accountForm.accountNumbers}
                  onChange={handleAccountChange}
                  fullWidth
                  required
                  className="mb-4 rounded-lg"
                  InputLabelProps={{
                    style: { color: theme === 'dark' ? '#e5e7eb' : undefined, textAlign: isRTL ? 'right' : 'left' },
                    dir: isRTL ? 'rtl' : 'ltr'
                  }}
                  InputProps={{ style: { color: theme === 'dark' ? '#fff' : undefined, background: theme === 'dark' ? '#23232a' : undefined, borderRadius: 12, border: theme === 'dark' ? '1px solid #333646' : undefined, paddingRight: isRTL ? 16 : 8, paddingLeft: isRTL ? 8 : 16 } }}
                />
                <TextField
                  label={t('form.warehouseCode') || 'كود المستودع'}
                  name="warehouseCode"
                  value={accountForm.warehouseCode}
                  fullWidth
                  disabled
                  className="mb-4 rounded-lg"
                  InputLabelProps={{
                    style: { color: theme === 'dark' ? '#e5e7eb' : undefined, textAlign: isRTL ? 'right' : 'left' },
                    dir: isRTL ? 'rtl' : 'ltr'
                  }}
                  InputProps={{ style: { color: theme === 'dark' ? '#fff' : undefined, background: theme === 'dark' ? '#23232a' : undefined, borderRadius: 12, border: theme === 'dark' ? '1px solid #333646' : undefined, paddingRight: isRTL ? 16 : 8, paddingLeft: isRTL ? 8 : 16 } }}
                />
              </>
            )}
            <DialogActions>
              <div className={`flex w-full ${isRTL ? 'flex-row-reverse' : ''} gap-2`}>
                <button
                  type="button"
                  onClick={() => setAccountDialogOpen(false)}
                  className="w-full px-4 py-2 bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-transparent dark:text-gray-200 dark:border dark:border-gray-500 dark:hover:bg-gray-700 rounded-lg transition-all duration-200"
                >
                  {t('dialog.cancel') || 'إلغاء'}
                </button>
                <button
                  type="submit"
                  disabled={accountLoading}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  {accountLoading ? t('common.loading') || 'جاري الحفظ...' : t('dialog.save') || 'حفظ التعديلات'}
                </button>
              </div>
            </DialogActions>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog تغيير كلمة المرور */}
      <Dialog open={settingsDialogOpen} onClose={() => setSettingsDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle className="bg-white dark:bg-[#23232a] text-gray-900 dark:text-gray-100 flex items-center justify-between">
          <span>{t('dialog.settings') || 'الإعدادات'}</span>
          <IconButton onClick={() => setSettingsDialogOpen(false)}>
            <X />
          </IconButton>
        </DialogTitle>
        <DialogContent className="bg-white dark:bg-[#23232a]">
          <form onSubmit={handleSettingsSubmit} className="space-y-4 mt-2">
            <label className="text-md text-gray-900 dark:text-gray-100">{t('form.changePassword')}</label>
            <TextField
              label={t('form.oldPassword') || 'كلمة المرور القديمة'}
              name="oldPassword"
              type="password"
              value={settingsForm.oldPassword}
              onChange={handleSettingsChange}
              fullWidth
              required
              className="mb-4 rounded-lg"
              InputLabelProps={{
                style: { color: theme === 'dark' ? '#e5e7eb' : undefined, textAlign: isRTL ? 'right' : 'left' },
                dir: isRTL ? 'rtl' : 'ltr'
              }}
              InputProps={{ style: { color: theme === 'dark' ? '#fff' : undefined, background: theme === 'dark' ? '#23232a' : undefined, borderRadius: 12, border: theme === 'dark' ? '1px solid #333646' : undefined, paddingRight: isRTL ? 16 : 8, paddingLeft: isRTL ? 8 : 16 } }}
            />
            <TextField
              label={t('form.newPassword') || 'كلمة المرور الجديدة'}
              name="newPassword"
              type="password"
              value={settingsForm.newPassword}
              onChange={handleSettingsChange}
              fullWidth
              required
              className="mb-4 rounded-lg"
              InputLabelProps={{
                style: { color: theme === 'dark' ? '#e5e7eb' : undefined, textAlign: isRTL ? 'right' : 'left' },
                dir: isRTL ? 'rtl' : 'ltr'
              }}
              InputProps={{ style: { color: theme === 'dark' ? '#fff' : undefined, background: theme === 'dark' ? '#23232a' : undefined, borderRadius: 12, border: theme === 'dark' ? '1px solid #333646' : undefined, paddingRight: isRTL ? 16 : 8, paddingLeft: isRTL ? 8 : 16 } }}
            />
            <TextField
              label={t('form.confirmPassword') || 'تأكيد كلمة المرور'}
              name="confirmPassword"
              type="password"
              value={settingsForm.confirmPassword}
              onChange={handleSettingsChange}
              fullWidth
              required
              className="mb-4 rounded-lg"
              InputLabelProps={{
                style: { color: theme === 'dark' ? '#e5e7eb' : undefined, textAlign: isRTL ? 'right' : 'left' },
                dir: isRTL ? 'rtl' : 'ltr'
              }}
              InputProps={{ style: { color: theme === 'dark' ? '#fff' : undefined, background: theme === 'dark' ? '#23232a' : undefined, borderRadius: 12, border: theme === 'dark' ? '1px solid #333646' : undefined, paddingRight: isRTL ? 16 : 8, paddingLeft: isRTL ? 8 : 16 } }}
            />
            <DialogActions>
              <div className={`flex w-full ${isRTL ? 'flex-row-reverse' : ''} gap-2`}>
                <button
                  type="button"
                  onClick={() => setSettingsDialogOpen(false)}
                  className="w-full px-4 py-2 bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-transparent dark:text-gray-200 dark:border dark:border-gray-500 dark:hover:bg-gray-700 rounded-lg transition-all duration-200"
                >
                  {t('dialog.cancel') || 'إلغاء'}
                </button>
                <button
                  type="submit"
                  disabled={settingsLoading}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  {settingsLoading ? t('common.loading') || 'جاري الحفظ...' : t('dialog.save') || 'حفظ التعديلات'}
                </button>
              </div>
            </DialogActions>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Layout;