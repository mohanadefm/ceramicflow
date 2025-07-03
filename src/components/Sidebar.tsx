import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { BarChart3, Package, ShoppingCart, Tag, HelpCircle, User } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const Sidebar: React.FC = () => {
  const { t, isRTL } = useLanguage();
  const { theme } = useTheme();
  const location = useLocation();

  const mainLinks = [
    { to: '/dashboard', icon: <BarChart3 className="h-5 w-5" />, label: t('sidebar.dashboard') || 'Dashboard' },
    { to: '/products', icon: <Package className="h-5 w-5" />, label: t('sidebar.products') || 'Products' },
    { to: '/orders', icon: <ShoppingCart className="h-5 w-5" />, label: t('sidebar.orders') || 'Orders' },
    { to: '/offers', icon: <Tag className="h-5 w-5" />, label: t('sidebar.offers') || 'Offers' },
    { to: '/clients', icon: <User className="h-5 w-5" />, label: t('sidebar.clients') || 'Clients' },
  ];
  const supportLink = { to: '/support', icon: <HelpCircle className="h-5 w-5" />, label: t('sidebar.support') || 'Support' };

  return (
    <aside className={`w-56 fixed top-16 ${isRTL ? 'right-0 border-l' : 'left-0 border-r'} h-[calc(100vh-4rem)] flex flex-col z-30 transition-colors duration-200
      ${theme === 'dark' ? 'bg-[#181A20] border-gray-800' : 'bg-white border-gray-200'}
      ${isRTL ? 'rtl' : 'ltr'}`}
      dir={isRTL ? 'rtl' : 'ltr'}>
      <nav className="flex flex-col gap-2 p-4 pt-4 h-full">
        {mainLinks.map(link => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2 rounded-lg font-medium transition-colors duration-200
              ${theme === 'dark'
                ? isActive
                  ? 'bg-blue-900/40 text-blue-400'
                  : 'text-gray-200 hover:bg-gray-800 hover:text-blue-300'
                : isActive
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-100'}
              `
            }
            end
          >
            <span className="transition-colors duration-200">
              {link.icon}
            </span>
            <span>{link.label}</span>
          </NavLink>
        ))}
        <div className="mt-auto">
          <NavLink
            key={supportLink.to}
            to={supportLink.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2 rounded-lg font-medium transition-colors duration-200
              ${theme === 'dark'
                ? isActive
                  ? 'bg-blue-900/40 text-blue-400'
                  : 'text-gray-200 hover:bg-gray-800 hover:text-blue-300'
                : isActive
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-100'}
              `
            }
            end
          >
            <span className="transition-colors duration-200">
              {supportLink.icon}
            </span>
            <span>{supportLink.label}</span>
          </NavLink>
        </div>
      </nav>
    </aside>
  );
};

export default Sidebar; 