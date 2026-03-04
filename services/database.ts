import { getSupabaseClient } from '@/template';

const supabase = getSupabaseClient();

// ============ Types ============
export interface Category {
  id: string;
  name: string;
  name_en: string | null;
  icon: string;
  image_url: string | null;
  sort_order: number;
  is_active: boolean;
}

export interface ProductImage {
  id: string;
  product_id: string;
  image_url: string;
  sort_order: number;
  is_primary: boolean;
}

export interface Product {
  id: string;
  product_number?: number;
  name: string;
  name_en: string | null;
  category_id: string | null;
  price: number;
  original_price: number | null;
  originalPrice?: number | null;
  discount: number;
  description: string | null;
  sizes: string[];
  colors: ProductColor[];
  rating: number;
  review_count: number;
  is_new: boolean;
  is_best_seller: boolean;
  in_stock: boolean;
  status: string;
  material: string | null;
  stock_quantity: number;
  created_at: string;
  updated_at: string;
  image?: string;
  images?: string[];
  category?: string;
  product_images?: ProductImage[];
}

export interface ProductColor {
  name: string;
  hex: string;
}

export interface PaymentMethod {
  id: string;
  bank_name: string;
  bank_key: string;
  account_name: string;
  account_number: string;
  is_active: boolean;
  sort_order: number;
}

export interface AppSetting {
  id: string;
  key: string;
  value: any;
}

export interface Order {
  id: string;
  order_number: string;
  user_id: string | null;
  customer_name: string;
  customer_phone: string;
  customer_address: string | null;
  delivery_method: string;
  payment_bank: string | null;
  transfer_number: string | null;
  payment_status: string;
  order_status: string;
  subtotal: number;
  discount_amount: number;
  total: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
  order_items?: OrderItemDB[];
}

export interface OrderItemDB {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  product_price: number;
  product_image: string | null;
  quantity: number;
  size: string | null;
  color: string | null;
}

export interface OrderItem {
  product_id: string | null;
  product_name: string;
  product_price: number;
  product_image: string | null;
  quantity: number;
  size: string | null;
  color: string | null;
}

export interface Offer {
  id: string;
  product_id: string | null;
  title: string;
  description: string | null;
  discount_percentage: number | null;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
  banner_image_url: string | null;
  created_at: string;
  product?: Product;
}

export interface DeliveryZone {
  id: string;
  country: string;
  governorate: string;
  area: string;
  delivery_fee: number;
  estimated_days: string;
  is_active: boolean;
  sort_order: number;
}

export interface Coupon {
  id: string;
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_order_amount: number;
  max_uses: number | null;
  used_count: number;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
}

// ============ Cache Layer ============
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  etag?: string;
}

const cache = new Map<string, CacheEntry<any>>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const SHORT_CACHE_TTL = 60 * 1000; // 1 minute for dynamic data

function getCached<T>(key: string, ttl: number = CACHE_TTL): T | null {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.timestamp < ttl) {
    return entry.data;
  }
  return null;
}

function setCache<T>(key: string, data: T): void {
  cache.set(key, { data, timestamp: Date.now() });
}

export function invalidateCache(prefix?: string): void {
  if (prefix) {
    for (const key of cache.keys()) {
      if (key.startsWith(prefix)) cache.delete(key);
    }
  } else {
    cache.clear();
  }
}

// ============ Retry Logic ============
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 2,
  delay: number = 1000
): Promise<T> {
  let lastError: any;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delay * (attempt + 1)));
      }
    }
  }
  throw lastError;
}

// ============ Product Transform ============
function transformProduct(p: any): Product {
  const images = (p.product_images || [])
    .sort((a: ProductImage, b: ProductImage) => a.sort_order - b.sort_order);
  const primaryImage = images.find((img: ProductImage) => img.is_primary) || images[0];

  let colors: ProductColor[] = [];
  try {
    colors = typeof p.colors === 'string' ? JSON.parse(p.colors) : (p.colors || []);
  } catch {
    colors = [];
  }

  return {
    ...p,
    image: primaryImage?.image_url || '',
    images: images.map((img: ProductImage) => img.image_url),
    category: p.category_id,
    colors,
    sizes: Array.isArray(p.sizes) ? p.sizes : [],
    discount: p.discount || 0,
    original_price: p.original_price || null,
    originalPrice: p.original_price || null,
    rating: Number(p.rating) || 0,
    review_count: Number(p.review_count) || 0,
    stock_quantity: Number(p.stock_quantity) || 0,
    product_number: p.product_number || undefined,
  };
}

// ============ Categories ============
export async function fetchCategories(): Promise<{ data: Category[]; error: string | null }> {
  const cached = getCached<Category[]>('categories');
  if (cached) return { data: cached, error: null };

  return withRetry(async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) return { data: [], error: error.message };
    const result = data || [];
    setCache('categories', result);
    return { data: result, error: null };
  });
}

// ============ Products ============
export async function fetchProducts(): Promise<{ data: Product[]; error: string | null }> {
  const cached = getCached<Product[]>('products');
  if (cached) return { data: cached, error: null };

  return withRetry(async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*, product_images(*)')
      .eq('status', 'available')
      .order('created_at', { ascending: false });

    if (error) return { data: [], error: error.message };
    const products = (data || []).map(transformProduct);
    setCache('products', products);
    return { data: products, error: null };
  });
}

export async function fetchProductById(id: string): Promise<{ data: Product | null; error: string | null }> {
  if (!id || typeof id !== 'string') return { data: null, error: 'معرف المنتج غير صالح' };

  // Check in product cache first
  const cachedProducts = getCached<Product[]>('products');
  if (cachedProducts) {
    const found = cachedProducts.find(p => p.id === id);
    if (found) return { data: found, error: null };
  }

  return withRetry(async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*, product_images(*)')
      .eq('id', id)
      .single();

    if (error) return { data: null, error: error.message };
    return { data: transformProduct(data), error: null };
  });
}

export async function fetchProductsByCategory(categoryId: string): Promise<{ data: Product[]; error: string | null }> {
  const cacheKey = `products_cat_${categoryId}`;
  const cached = getCached<Product[]>(cacheKey, SHORT_CACHE_TTL);
  if (cached) return { data: cached, error: null };

  return withRetry(async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*, product_images(*)')
      .eq('category_id', categoryId)
      .eq('status', 'available')
      .order('created_at', { ascending: false });

    if (error) return { data: [], error: error.message };
    const products = (data || []).map(transformProduct);
    setCache(cacheKey, products);
    return { data: products, error: null };
  });
}

export async function searchProducts(query: string): Promise<{ data: Product[]; error: string | null }> {
  if (!query || query.trim().length < 2) return { data: [], error: null };

  const sanitized = query.trim().replace(/[%_]/g, '');

  return withRetry(async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*, product_images(*)')
      .eq('status', 'available')
      .or(`name.ilike.%${sanitized}%,name_en.ilike.%${sanitized}%,description.ilike.%${sanitized}%`);

    if (error) return { data: [], error: error.message };
    return { data: (data || []).map(transformProduct), error: null };
  });
}

// ============ Payment Methods ============
export async function fetchPaymentMethods(): Promise<{ data: PaymentMethod[]; error: string | null }> {
  const cached = getCached<PaymentMethod[]>('payment_methods');
  if (cached) return { data: cached, error: null };

  return withRetry(async () => {
    const { data, error } = await supabase
      .from('payment_methods')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) return { data: [], error: error.message };
    const result = data || [];
    setCache('payment_methods', result);
    return { data: result, error: null };
  });
}

// ============ App Settings ============
export async function fetchAppSettings(): Promise<{ data: Record<string, any>; error: string | null }> {
  const cached = getCached<Record<string, any>>('app_settings');
  if (cached) return { data: cached, error: null };

  return withRetry(async () => {
    const { data, error } = await supabase
      .from('app_settings')
      .select('*');

    if (error) return { data: {}, error: error.message };

    const settings: Record<string, any> = {};
    (data || []).forEach((s: AppSetting) => {
      settings[s.key] = s.value;
    });
    setCache('app_settings', settings);
    return { data: settings, error: null };
  });
}

// ============ Offers ============
export async function fetchOffers(): Promise<{ data: Offer[]; error: string | null }> {
  const cached = getCached<Offer[]>('offers', SHORT_CACHE_TTL);
  if (cached) return { data: cached, error: null };

  return withRetry(async () => {
    const { data, error } = await supabase
      .from('offers')
      .select('*, products(*, product_images(*))')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) return { data: [], error: error.message };

    const now = new Date();
    const offers = (data || [])
      .map((o: any) => ({
        ...o,
        product: o.products ? transformProduct(o.products) : undefined,
        products: undefined,
      }))
      .filter((o: Offer) => {
        if (o.end_date && new Date(o.end_date) < now) return false;
        if (o.start_date && new Date(o.start_date) > now) return false;
        return true;
      });

    setCache('offers', offers);
    return { data: offers, error: null };
  });
}

// ============ Coupons ============
export async function validateCoupon(
  code: string,
  orderTotal: number
): Promise<{ data: Coupon | null; error: string | null; discountAmount: number }> {
  if (!code || !code.trim()) {
    return { data: null, error: 'يرجى إدخال كود الخصم', discountAmount: 0 };
  }

  const sanitizedCode = code.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');

  try {
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', sanitizedCode)
      .eq('is_active', true)
      .single();

    if (error || !data) return { data: null, error: 'كوبون غير صالح', discountAmount: 0 };

    const coupon = data as Coupon;
    const now = new Date();

    if (coupon.start_date && new Date(coupon.start_date) > now) {
      return { data: null, error: 'الكوبون لم يبدأ بعد', discountAmount: 0 };
    }
    if (coupon.end_date && new Date(coupon.end_date) < now) {
      return { data: null, error: 'الكوبون منتهي الصلاحية', discountAmount: 0 };
    }
    if (coupon.max_uses && coupon.used_count >= coupon.max_uses) {
      return { data: null, error: 'تم استخدام الكوبون الحد الأقصى من المرات', discountAmount: 0 };
    }
    if (coupon.min_order_amount && orderTotal < coupon.min_order_amount) {
      return { data: null, error: `الحد الأدنى للطلب ${formatPrice(coupon.min_order_amount)}`, discountAmount: 0 };
    }

    let discountAmount = 0;
    if (coupon.discount_type === 'percentage') {
      discountAmount = Math.round(orderTotal * (coupon.discount_value / 100));
    } else {
      discountAmount = Math.min(coupon.discount_value, orderTotal);
    }

    return { data: coupon, error: null, discountAmount };
  } catch {
    return { data: null, error: 'خطأ في التحقق من الكوبون', discountAmount: 0 };
  }
}

// ============ Orders ============
function generateOrderNumber(): string {
  const now = new Date();
  const datePart = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let randomPart = '';
  for (let i = 0; i < 4; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `MRS-${datePart}-${randomPart}`;
}

export async function createOrder(
  orderData: {
    customerName: string;
    customerPhone: string;
    customerAddress?: string;
    deliveryMethod: 'delivery' | 'pickup';
    deliveryZoneId?: string;
    deliveryFee?: number;
    paymentBank: string;
    transferNumber: string;
    subtotal: number;
    discountAmount?: number;
    total: number;
    notes?: string;
    items: OrderItem[];
  }
): Promise<{ data: Order | null; error: string | null }> {
  // Input validation
  if (!orderData.customerName?.trim()) return { data: null, error: 'الاسم مطلوب' };
  if (!orderData.customerPhone?.trim()) return { data: null, error: 'رقم الهاتف مطلوب' };
  if (!orderData.paymentBank) return { data: null, error: 'طريقة الدفع مطلوبة' };
  if (!orderData.transferNumber?.trim()) return { data: null, error: 'رقم الحوالة مطلوب' };
  if (!orderData.items || orderData.items.length === 0) return { data: null, error: 'السلة فارغة' };

  const orderNumber = generateOrderNumber();

  let userId: string | null = null;
  try {
    const { data: { user } } = await supabase.auth.getUser();
    userId = user?.id || null;
  } catch {
    // Guest checkout
  }

  try {
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        order_number: orderNumber,
        user_id: userId,
        customer_name: orderData.customerName.trim(),
        customer_phone: orderData.customerPhone.trim(),
        customer_address: orderData.deliveryMethod === 'delivery' ? (orderData.customerAddress?.trim() || null) : null,
        delivery_method: orderData.deliveryMethod,
        payment_bank: orderData.paymentBank,
        transfer_number: orderData.transferNumber.trim(),
        payment_status: 'pending',
        order_status: 'new',
        subtotal: Math.max(0, orderData.subtotal),
        discount_amount: Math.max(0, orderData.discountAmount || 0),
        total: Math.max(0, orderData.total),
        notes: orderData.notes?.trim() || null,
      })
      .select()
      .single();

    if (orderError) return { data: null, error: orderError.message };

    const orderItems = orderData.items.map(item => ({
      order_id: order.id,
      product_id: item.product_id,
      product_name: item.product_name,
      product_price: Math.max(0, item.product_price),
      product_image: item.product_image,
      quantity: Math.max(1, item.quantity),
      size: item.size,
      color: item.color,
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      console.error('Failed to insert order items:', itemsError.message);
    }

    // Invalidate products cache to reflect stock changes
    invalidateCache('products');

    return { data: order, error: null };
  } catch (err: any) {
    return { data: null, error: err?.message || 'خطأ في إنشاء الطلب' };
  }
}

export async function fetchUserOrders(): Promise<{ data: Order[]; error: string | null }> {
  const cached = getCached<Order[]>('user_orders', SHORT_CACHE_TTL);
  if (cached) return { data: cached, error: null };

  return withRetry(async () => {
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .order('created_at', { ascending: false });

    if (error) return { data: [], error: error.message };
    const result = data || [];
    setCache('user_orders', result);
    return { data: result, error: null };
  });
}

export async function fetchOrderById(id: string): Promise<{ data: Order | null; error: string | null }> {
  if (!id) return { data: null, error: 'معرف الطلب غير صالح' };

  return withRetry(async () => {
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('id', id)
      .single();

    if (error) return { data: null, error: error.message };
    return { data, error: null };
  });
}

// ============ User Profile ============
export async function fetchUserProfile(): Promise<{ data: any; error: string | null }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: 'غير مسجل الدخول' };

    const cached = getCached<any>(`profile_${user.id}`, SHORT_CACHE_TTL);
    if (cached) return { data: cached, error: null };

    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) return { data: null, error: error.message };
    setCache(`profile_${user.id}`, data);
    return { data, error: null };
  } catch {
    return { data: null, error: 'خطأ في جلب الملف الشخصي' };
  }
}

export async function updateUserProfile(updates: {
  full_name?: string;
  phone?: string;
  address?: string;
}): Promise<{ error: string | null }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'غير مسجل الدخول' };

    const cleanUpdates: Record<string, string> = {};
    if (updates.full_name !== undefined) cleanUpdates.full_name = updates.full_name.trim();
    if (updates.phone !== undefined) cleanUpdates.phone = updates.phone.trim();
    if (updates.address !== undefined) cleanUpdates.address = updates.address.trim();

    const { error } = await supabase
      .from('user_profiles')
      .update(cleanUpdates)
      .eq('id', user.id);

    if (!error) {
      invalidateCache(`profile_${user.id}`);
    }

    return { error: error?.message || null };
  } catch {
    return { error: 'خطأ في تحديث الملف الشخصي' };
  }
}

// ============ Data Version Check ============
let lastSyncTimestamp = 0;

export async function checkForUpdates(): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('updated_at')
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) return false;

    const latestUpdate = new Date(data.updated_at).getTime();
    if (latestUpdate > lastSyncTimestamp) {
      lastSyncTimestamp = latestUpdate;
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

// ============ Delivery Zones ============
export async function fetchDeliveryZones(): Promise<{ data: DeliveryZone[]; error: string | null }> {
  const cached = getCached<DeliveryZone[]>('delivery_zones');
  if (cached) return { data: cached, error: null };

  return withRetry(async () => {
    const { data, error } = await supabase
      .from('delivery_zones')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) return { data: [], error: error.message };
    const result = data || [];
    setCache('delivery_zones', result);
    return { data: result, error: null };
  });
}

// ============ Brand Identity ============
export interface BrandIdentity {
  store_name: string;
  store_name_en: string;
  tagline: string;
  store_description: string;
  primary_color: string;
  primary_light: string;
  primary_dark: string;
  background_dark: string;
  background_cream: string;
  accent_color: string;
  logo_url: string;
  icon_url: string;
}

export const DEFAULT_BRAND: BrandIdentity = {
  store_name: 'مراسيم الأمراء',
  store_name_en: 'Marasim Al-Umara',
  tagline: 'كن أنيقاً بملابسنا',
  store_description: 'متجر متخصص في الملابس الرجالية الفاخرة',
  primary_color: '#C8A96E',
  primary_light: '#D4BA85',
  primary_dark: '#B08D4F',
  background_dark: '#0A0A0A',
  background_cream: '#FAF7F2',
  accent_color: '#EF4444',
  logo_url: '',
  icon_url: '',
};

export async function fetchBrandIdentity(): Promise<{ data: BrandIdentity | null; error: string | null }> {
  const cached = getCached<BrandIdentity>('brand_identity');
  if (cached) return { data: cached, error: null };

  try {
    const { data, error } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'brand_identity')
      .single();

    if (error || !data) return { data: DEFAULT_BRAND, error: null };
    const brandData = { ...DEFAULT_BRAND, ...data.value } as BrandIdentity;
    setCache('brand_identity', brandData);
    return { data: brandData, error: null };
  } catch {
    return { data: DEFAULT_BRAND, error: 'خطأ في جلب بيانات الهوية' };
  }
}

// ============ Contact Info ============
export interface ContactInfo {
  phone: string;
  whatsapp: string;
  email: string;
  instagram: string;
  working_hours: string;
  address: string;
  latitude: number;
  longitude: number;
  map_zoom: number;
}

export async function fetchContactInfo(): Promise<{ data: ContactInfo | null; error: string | null }> {
  const cached = getCached<ContactInfo>('contact_info');
  if (cached) return { data: cached, error: null };

  try {
    const { data, error } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'contact_info')
      .single();

    if (error || !data) return { data: null, error: error?.message || 'لا توجد بيانات اتصال' };
    const contactData = data.value as ContactInfo;
    setCache('contact_info', contactData);
    return { data: contactData, error: null };
  } catch {
    return { data: null, error: 'خطأ في جلب بيانات الاتصال' };
  }
}

// ============ Brand Assets ============
export function getBrandAssetUrl(path: string): string {
  if (!path) return '';
  // If already a full URL, return as-is
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  // Build public URL from bucket path
  const { data } = supabase.storage.from('brand-assets').getPublicUrl(path);
  return data?.publicUrl || '';
}

// ============ Helpers ============
export function formatPrice(price: number): string {
  if (typeof price !== 'number' || isNaN(price)) return '0 ر.ي';
  return Math.round(price).toLocaleString('ar-YE') + ' ر.ي';
}

export function getOrderStatusLabel(status: string): { label: string; color: string; bg: string } {
  const map: Record<string, { label: string; color: string; bg: string }> = {
    new: { label: 'جديد', color: '#3B82F6', bg: '#EFF6FF' },
    processing: { label: 'قيد المعالجة', color: '#F59E0B', bg: '#FFFBEB' },
    shipping: { label: 'جاري التوصيل', color: '#8B5CF6', bg: '#F5F3FF' },
    completed: { label: 'مكتمل', color: '#10B981', bg: '#ECFDF5' },
    cancelled: { label: 'ملغي', color: '#EF4444', bg: '#FEF2F2' },
  };
  return map[status] || { label: status, color: '#6B7280', bg: '#F3F4F6' };
}

export function getPaymentStatusLabel(status: string): { label: string; color: string; bg: string } {
  const map: Record<string, { label: string; color: string; bg: string }> = {
    pending: { label: 'قيد المراجعة', color: '#F59E0B', bg: '#FFFBEB' },
    verified: { label: 'تم التأكيد', color: '#10B981', bg: '#ECFDF5' },
    failed: { label: 'فشل', color: '#EF4444', bg: '#FEF2F2' },
  };
  return map[status] || { label: status, color: '#6B7280', bg: '#F3F4F6' };
}

export function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString('ar-YE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}
