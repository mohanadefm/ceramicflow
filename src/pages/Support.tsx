import React from 'react';
import { FaWhatsapp, FaPhoneAlt, FaEnvelope } from 'react-icons/fa';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';

const supportOptions = (t: (key: string) => string) => [
  {
    title: t('support.whatsappTitle'),
    description: t('support.whatsappDesc'),
    icon: <FaWhatsapp className="text-green-500 text-3xl" />,
    action: () => window.open('https://wa.me/201234567890', '_blank'),
    button: t('support.whatsappBtn'),
  },
  {
    title: t('support.phoneTitle'),
    description: t('support.phoneDesc'),
    icon: <FaPhoneAlt className="text-blue-500 text-3xl" />,
    action: () => window.open('tel:+201234567890'),
    button: t('support.phoneBtn'),
  },
  {
    title: t('support.emailTitle'),
    description: t('support.emailDesc'),
    icon: <FaEnvelope className="text-yellow-500 text-3xl" />,
    action: () => window.open('mailto:support@example.com'),
    button: t('support.emailBtn'),
  },
];

const Support: React.FC = () => {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const options = supportOptions(t);

  return (
    <div className={`flex flex-col items-center justify-center min-h-[80vh] py-8 px-4 transition-colors duration-200
      ${theme === 'dark' ? 'bg-[#181A20]' : 'bg-gray-50'}`}
    >
      <div className="max-w-xl w-full text-center mb-8">
        <h1 className={`text-3xl font-bold mb-2 transition-colors duration-200
          ${theme === 'dark' ? 'text-white' : 'text-primary'}`}>{t('support.title')}</h1>
        <p className={`transition-colors duration-200 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{t('support.welcome')}</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-3xl">
        {options.map((option, idx) => (
          <div
            key={idx}
            className={`rounded-xl shadow-md p-6 flex flex-col items-center hover:shadow-lg transition cursor-pointer border
              transition-colors duration-200
              ${theme === 'dark' ? 'bg-[#23232a] border-gray-800 hover:bg-[#23232a]/90' : 'bg-white border-gray-200 hover:bg-gray-50'}`}
            onClick={option.action}
          >
            <div className="mb-4">{option.icon}</div>
            <h2 className={`text-xl font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{option.title}</h2>
            <p className={`mb-4 text-center ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>{option.description}</p>
            <button className={`px-4 py-2 rounded-lg font-medium transition
              ${theme === 'dark' ? 'bg-primary-600 hover:bg-primary-700 text-white' : 'bg-primary text-white hover:bg-primary/90'}`}
            >
              {option.button}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Support; 