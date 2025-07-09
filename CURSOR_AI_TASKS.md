# قائمة المهام المفصلة لـ Cursor AI

## 🚨 المهام عالية الأولوية (يجب تنفيذها فوراً)

### Task 1: إصلاح مشاكل الأمان الحرجة
```typescript
// 1.1 إنشاء ملف .env.example وإزالة القيم الحساسة
// إنشاء ملف .env.example مع القيم التالية:
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
CLIENT_URL=http://localhost:5173
NODE_ENV=development
CLOUD_NAME=your_cloudinary_cloud_name
API_KEY=your_cloudinary_api_key
API_SECRET=your_cloudinary_api_secret

// 1.2 تحديث AuthContext.tsx لاستخدام متغيرات البيئة بشكل آمن
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

// 1.3 إضافة validation لمتغيرات البيئة في server.js
const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET', 'CLOUD_NAME', 'API_KEY', 'API_SECRET'];
requiredEnvVars.forEach(envVar => {
  if (!process.env[envVar]) {
    console.error(`Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
});
```

### Task 2: تحسين نظام المصادقة
```typescript
// 2.1 إضافة rate limiting للـ login في auth.js
import rateLimit from 'express-rate-limit';

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: 'Too many login attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/login', loginLimiter, async (req, res) => {
  // existing login logic
});

// 2.2 إضافة password strength validation
const validatePassword = (password) => {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasNonalphas = /\W/.test(password);
  
  return password.length >= minLength && hasUpperCase && hasLowerCase && hasNumbers && hasNonalphas;
};

// 2.3 إضافة account lockout mechanism
const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_TIME = 2 * 60 * 60 * 1000; // 2 hours

// إضافة حقول جديدة لـ User schema
loginAttempts: { type: Number, default: 0 },
lockUntil: Date,
```

### Task 3: تحسين استعلامات قاعدة البيانات
```javascript
// 3.1 إضافة indexes مناسبة في جميع الـ models

// في Product.js
productSchema.index({ warehouse: 1, status: 1 });
productSchema.index({ sku: 1, warehouse: 1 });
productSchema.index({ category: 1, status: 1 });
productSchema.index({ quantityInMeters: 1 });
productSchema.index({ quantityInBoxes: 1 });
productSchema.index({ hasOffer: 1, status: 1 });
productSchema.index({ createdAt: -1 });

// في Order.js
orderSchema.index({ warehouse: 1, status: 1, createdAt: -1 });
orderSchema.index({ customer: 1, createdAt: -1 });
orderSchema.index({ orderNumber: 1 }, { unique: true });
orderSchema.index({ status: 1, payment: 1 });

// في Client.js
clientSchema.index({ user: 1, name: 1 });
clientSchema.index({ email: 1 }, { unique: true, sparse: true });
clientSchema.index({ phone: 1 }, { unique: true, sparse: true });

// 3.2 تحسين aggregation pipelines في routes
// في orders.js - تحسين إحصائيات الطلبات
const getOrderStatistics = async (warehouseId) => {
  return await Order.aggregate([
    { $match: { warehouse: ObjectId(warehouseId), status: { $in: ['confirmed', 'delivered', 'shipped'] } } },
    {
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        totalSales: { $sum: '$totalPrice' },
        avgOrderValue: { $avg: '$totalPrice' }
      }
    }
  ]);
};
```

### Task 4: إضافة Error Boundaries شاملة
```typescript
// 4.1 إنشاء ErrorBoundary component
// إنشاء ملف src/components/ErrorBoundary.tsx
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    // يمكن إضافة error reporting service هنا
  }

  public render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Something went wrong</h1>
            <p className="text-gray-600 mb-4">We're sorry, but something unexpected happened.</p>
            <button 
              onClick={() => window.location.reload()}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

// 4.2 تطبيق ErrorBoundary في App.tsx
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <LanguageProvider>
          <AuthProvider>
            {/* existing app content */}
          </AuthProvider>
        </LanguageProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
```

### Task 5: توحيد Loading States
```typescript
// 5.1 إنشاء Loading component موحد
// إنشاء ملف src/components/Loading.tsx
import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  fullScreen?: boolean;
  overlay?: boolean;
}

const Loading: React.FC<LoadingProps> = ({ 
  size = 'md', 
  text, 
  fullScreen = false,
  overlay = false 
}) => {
  const { t } = useLanguage();
  const { theme } = useTheme();
  
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  const content = (
    <div className="flex flex-col items-center justify-center space-y-4">
      <div className={`animate-spin rounded-full border-2 border-blue-500 border-t-transparent ${sizeClasses[size]}`} />
      {text && (
        <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
          {text}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className={`fixed inset-0 flex items-center justify-center ${overlay ? 'bg-black bg-opacity-50 z-50' : ''} ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
        {content}
      </div>
    );
  }

  return content;
};

export default Loading;

// 5.2 إنشاء Skeleton components
// إنشاء ملف src/components/Skeleton.tsx
export const TableSkeleton: React.FC<{ rows?: number; cols?: number }> = ({ rows = 5, cols = 6 }) => (
  <div className="animate-pulse">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex space-x-4 py-4 border-b border-gray-200">
        {Array.from({ length: cols }).map((_, j) => (
          <div key={j} className="flex-1 h-4 bg-gray-300 rounded"></div>
        ))}
      </div>
    ))}
  </div>
);

export const CardSkeleton: React.FC = () => (
  <div className="animate-pulse bg-white rounded-lg shadow p-6">
    <div className="h-4 bg-gray-300 rounded w-3/4 mb-4"></div>
    <div className="h-4 bg-gray-300 rounded w-1/2 mb-2"></div>
    <div className="h-4 bg-gray-300 rounded w-5/6"></div>
  </div>
);
```

## 🔶 المهام متوسطة الأولوية

### Task 6: تحسين Mobile Responsiveness
```typescript
// 6.1 تحديث جميع الجداول لتكون mobile-friendly
// في Products.tsx, Orders.tsx, Clients.tsx, Offers.tsx
// إضافة mobile card view للجداول

const MobileCard: React.FC<{ item: any; type: 'product' | 'order' | 'client' | 'offer' }> = ({ item, type }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4 md:hidden">
      {/* محتوى البطاقة حسب النوع */}
    </div>
  );
};

// 6.2 تحسين Navigation للجوال
// تحديث Sidebar.tsx لدعم mobile menu
const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

// 6.3 تحسين Forms للجوال
// تحديث جميع النماذج لتكون touch-friendly
// زيادة حجم الأزرار وتحسين spacing
```

### Task 7: إضافة Redis Caching
```javascript
// 7.1 تنصيب وإعداد Redis
npm install redis ioredis

// 7.2 إنشاء cache service
// إنشاء ملف server/services/cacheService.js
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

export const cacheService = {
  async get(key) {
    try {
      const value = await redis.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  },

  async set(key, value, ttl = 3600) {
    try {
      await redis.setex(key, ttl, JSON.stringify(value));
    } catch (error) {
      console.error('Cache set error:', error);
    }
  },

  async del(key) {
    try {
      await redis.del(key);
    } catch (error) {
      console.error('Cache delete error:', error);
    }
  }
};

// 7.3 تطبيق caching في routes
// في products.js
router.get('/', authenticate, async (req, res) => {
  const cacheKey = `products:${req.user._id}:${JSON.stringify(req.query)}`;
  
  // محاولة الحصول على البيانات من cache
  const cachedData = await cacheService.get(cacheKey);
  if (cachedData) {
    return res.json(cachedData);
  }

  // إذا لم توجد في cache، جلب من قاعدة البيانات
  const products = await Product.find(/* query */);
  
  // حفظ في cache لمدة 10 دقائق
  await cacheService.set(cacheKey, { products }, 600);
  
  res.json({ products });
});
```

### Task 8: إضافة نظام التقارير
```typescript
// 8.1 إنشاء Report models
// إنشاء ملف server/models/Report.js
const reportSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ['sales', 'inventory', 'customers'], required: true },
  filters: { type: Object, default: {} },
  generatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  generatedAt: { type: Date, default: Date.now },
  data: { type: Object },
  format: { type: String, enum: ['pdf', 'excel', 'csv'], default: 'pdf' }
});

// 8.2 إنشاء Report service
// إنشاء ملف server/services/reportService.js
import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';

export const reportService = {
  async generateSalesReport(filters, format = 'pdf') {
    const orders = await Order.find(filters)
      .populate('customer', 'name email')
      .populate('products.product', 'sku category');
    
    if (format === 'pdf') {
      return this.generatePDFReport(orders, 'Sales Report');
    } else if (format === 'excel') {
      return this.generateExcelReport(orders, 'Sales Report');
    }
  },

  async generatePDFReport(data, title) {
    const doc = new PDFDocument();
    doc.fontSize(20).text(title, 100, 100);
    // إضافة البيانات للـ PDF
    return doc;
  },

  async generateExcelReport(data, title) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(title);
    // إضافة البيانات للـ Excel
    return workbook;
  }
};

// 8.3 إنشاء Reports page
// إنشاء ملف src/pages/Reports.tsx
const Reports: React.FC = () => {
  const [reportType, setReportType] = useState('sales');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [generating, setGenerating] = useState(false);

  const generateReport = async () => {
    setGenerating(true);
    try {
      const response = await axios.post('/reports/generate', {
        type: reportType,
        filters: { dateRange },
        format: 'pdf'
      });
      
      // تحميل التقرير
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${reportType}-report.pdf`;
      a.click();
    } catch (error) {
      toast.error('Failed to generate report');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Report generation UI */}
    </div>
  );
};
```

### Task 9: إضافة نظام الإشعارات
```typescript
// 9.1 إنشاء Notification model
// إنشاء ملف server/models/Notification.js
const notificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, enum: ['info', 'warning', 'error', 'success'], default: 'info' },
  category: { type: String, enum: ['low_stock', 'new_order', 'payment', 'system'], required: true },
  read: { type: Boolean, default: false },
  data: { type: Object, default: {} },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date }
});

// 9.2 إنشاء Notification service
// إنشاء ملف server/services/notificationService.js
export const notificationService = {
  async create(notificationData) {
    const notification = new Notification(notificationData);
    await notification.save();
    
    // إرسال real-time notification
    io.to(notificationData.recipient.toString()).emit('notification', notification);
    
    return notification;
  },

  async checkLowStock() {
    const lowStockProducts = await Product.find({
      $or: [
        { quantityInMeters: { $lt: 50 } },
        { quantityInBoxes: { $lt: 10 } }
      ]
    }).populate('warehouse', 'name');

    for (const product of lowStockProducts) {
      await this.create({
        recipient: product.warehouse._id,
        title: 'Low Stock Alert',
        message: `Product ${product.sku} is running low on stock`,
        category: 'low_stock',
        type: 'warning',
        data: { productId: product._id, sku: product.sku }
      });
    }
  }
};

// 9.3 إنشاء Notification component
// إنشاء ملف src/components/NotificationCenter.tsx
const NotificationCenter: React.FC = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // جلب الإشعارات
    fetchNotifications();
    
    // الاستماع للإشعارات الجديدة
    socket.on('notification', (notification) => {
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
    });

    return () => socket.off('notification');
  }, []);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900"
      >
        <Bell className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          {/* قائمة الإشعارات */}
        </div>
      )}
    </div>
  );
};
```

## 🔷 المهام منخفضة الأولوية

### Task 10: إضافة Testing Suite
```typescript
// 10.1 تنصيب testing dependencies
npm install --save-dev jest @testing-library/react @testing-library/jest-dom @testing-library/user-event

// 10.2 إنشاء test utilities
// إنشاء ملف src/test-utils.tsx
import React from 'react';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { ThemeProvider } from './contexts/ThemeContext';

const AllTheProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <LanguageProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </LanguageProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
};

const customRender = (ui: React.ReactElement, options = {}) =>
  render(ui, { wrapper: AllTheProviders, ...options });

export * from '@testing-library/react';
export { customRender as render };

// 10.3 إنشاء component tests
// إنشاء ملف src/components/__tests__/Loading.test.tsx
import { render, screen } from '../../test-utils';
import Loading from '../Loading';

describe('Loading Component', () => {
  test('renders loading spinner', () => {
    render(<Loading />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  test('renders with custom text', () => {
    render(<Loading text="Loading products..." />);
    expect(screen.getByText('Loading products...')).toBeInTheDocument();
  });
});
```

### Task 11: إضافة PWA Support
```typescript
// 11.1 إنشاء manifest.json
// إنشاء ملف public/manifest.json
{
  "name": "CeramicFlow",
  "short_name": "CeramicFlow",
  "description": "نظام إدارة قطاع السيراميك",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#2563eb",
  "orientation": "portrait-primary",
  "icons": [
    {
      "src": "/logo-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/logo-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ]
}

// 11.2 إنشاء Service Worker
// إنشاء ملف public/sw.js
const CACHE_NAME = 'ceramicflow-v1';
const urlsToCache = [
  '/',
  '/static/css/main.css',
  '/static/js/main.js',
  '/logo.png',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});

// 11.3 تسجيل Service Worker
// في src/main.tsx
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration);
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}
```

### Task 12: إضافة CI/CD Pipeline
```yaml
# 12.1 إنشاء GitHub Actions workflow
# إنشاء ملف .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run tests
      run: npm test
    
    - name: Run linting
      run: npm run lint
    
    - name: Build application
      run: npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Deploy to production
      run: |
        # deployment commands
```

## 📊 جدول أولويات التنفيذ

| المهمة | الأولوية | الوقت المقدر | التأثير | الصعوبة |
|--------|----------|--------------|---------|----------|
| Task 1-3 | 🚨 عالية | 2-3 أيام | عالي | متوسط |
| Task 4-5 | 🚨 عالية | 1-2 يوم | عالي | سهل |
| Task 6-7 | 🔶 متوسطة | 3-4 أيام | متوسط | متوسط |
| Task 8-9 | 🔶 متوسطة | 5-7 أيام | عالي | صعب |
| Task 10-12 | 🔷 منخفضة | 7-10 أيام | متوسط | متوسط |

## ✅ Checklist للتنفيذ

### قبل البدء
- [ ] إنشاء backup كامل للنظام
- [ ] إعداد بيئة تطوير منفصلة
- [ ] مراجعة جميع dependencies

### أثناء التنفيذ
- [ ] تنفيذ المهام حسب الأولوية
- [ ] اختبار كل مهمة قبل الانتقال للتالية
- [ ] توثيق جميع التغييرات
- [ ] مراقبة الأداء بعد كل تحسين

### بعد الانتهاء
- [ ] اختبار شامل للنظام
- [ ] مراجعة الأمان
- [ ] تحديث الوثائق
- [ ] نشر النظام للإنتاج

هذه القائمة ستضمن تحسين النظام بشكل منهجي ومنظم!