export interface Category {
  id: string;
  name: string;
  icon: string;
  image: string;
  productCount: number;
}

export interface Product {
  id: string;
  name: string;
  nameEn: string;
  category: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  image: string;
  images: string[];
  description: string;
  sizes: string[];
  colors: { name: string; hex: string }[];
  rating: number;
  reviewCount: number;
  isNew?: boolean;
  isBestSeller?: boolean;
  inStock: boolean;
  material?: string;
}

export interface Banner {
  id: string;
  title: string;
  subtitle: string;
  image: any;
  discount?: string;
  bgColor: string;
}

export interface Order {
  id: string;
  date: string;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered';
  total: number;
  items: { productId: string; quantity: number; size: string; color: string }[];
}

export const categories: Category[] = [
  {
    id: 'thobes',
    name: 'أثواب',
    icon: 'checkroom',
    image: 'https://images.unsplash.com/photo-1589310243389-96a5483213a8?w=200&h=200&fit=crop',
    productCount: 4,
  },
  {
    id: 'shawls',
    name: 'شيلان',
    icon: 'dry-cleaning',
    image: 'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=200&h=200&fit=crop',
    productCount: 4,
  },
  {
    id: 'coats',
    name: 'أكوات وجواكت',
    icon: 'style',
    image: 'https://images.unsplash.com/photo-1544022613-e87ca75a784a?w=200&h=200&fit=crop',
    productCount: 4,
  },
  {
    id: 'maawiz',
    name: 'معاوز',
    icon: 'curtains',
    image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=200&h=200&fit=crop',
    productCount: 3,
  },
  {
    id: 'janbiya',
    name: 'جنابي ومستلزماتها',
    icon: 'diamond',
    image: 'https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=200&h=200&fit=crop',
    productCount: 3,
  },
  {
    id: 'underwear',
    name: 'ملابس داخلية',
    icon: 'inventory-2',
    image: 'https://images.unsplash.com/photo-1586363104862-3a5e2ab60d99?w=200&h=200&fit=crop',
    productCount: 3,
  },
];

export const products: Product[] = [
  // أثواب (Thobes)
  {
    id: 'thobe-1',
    name: 'ثوب مراسيم فاخر أبيض',
    nameEn: 'Premium White Thobe',
    category: 'thobes',
    price: 25000,
    originalPrice: 32000,
    discount: 22,
    image: 'https://images.unsplash.com/photo-1617137968427-85924c800a22?w=400&h=500&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1617137968427-85924c800a22?w=800&h=1000&fit=crop',
      'https://images.unsplash.com/photo-1593030761757-71fae45fa0e7?w=800&h=1000&fit=crop',
    ],
    description: 'ثوب فاخر من أجود أنواع القماش القطني المصري، تصميم عصري أنيق مع تطريز يدوي دقيق على الياقة والأكمام. مناسب للمناسبات الخاصة والاستخدام اليومي.',
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    colors: [
      { name: 'أبيض', hex: '#FAFAFA' },
      { name: 'بيج', hex: '#F5F1EB' },
      { name: 'سماوي', hex: '#E0F2FE' },
    ],
    rating: 4.8,
    reviewCount: 124,
    isNew: true,
    isBestSeller: true,
    inStock: true,
    material: 'قطن مصري 100%',
  },
  {
    id: 'thobe-2',
    name: 'ثوب كلاسيكي بيج',
    nameEn: 'Classic Beige Thobe',
    category: 'thobes',
    price: 18000,
    image: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=400&h=500&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800&h=1000&fit=crop',
    ],
    description: 'ثوب كلاسيكي بلون بيج أنيق، قماش ناعم ومريح للارتداء اليومي. تصميم بسيط وراقي يناسب جميع المناسبات.',
    sizes: ['M', 'L', 'XL', 'XXL'],
    colors: [
      { name: 'بيج', hex: '#D4B896' },
      { name: 'رمادي', hex: '#9CA3AF' },
    ],
    rating: 4.5,
    reviewCount: 89,
    inStock: true,
    material: 'قطن مخلوط',
  },
  {
    id: 'thobe-3',
    name: 'ثوب سعودي مميز',
    nameEn: 'Saudi Premium Thobe',
    category: 'thobes',
    price: 35000,
    originalPrice: 42000,
    discount: 17,
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=500&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=1000&fit=crop',
    ],
    description: 'ثوب سعودي فاخر بتصميم حديث وأنيق، مصنوع من أجود الأقمشة المستوردة. يتميز بقصة مثالية وتفاصيل دقيقة.',
    sizes: ['S', 'M', 'L', 'XL'],
    colors: [
      { name: 'أبيض', hex: '#FFFFFF' },
      { name: 'كريمي', hex: '#FFFDD0' },
    ],
    rating: 4.9,
    reviewCount: 203,
    isBestSeller: true,
    inStock: true,
    material: 'بوليستر فاخر',
  },
  {
    id: 'thobe-4',
    name: 'ثوب شتوي دافئ',
    nameEn: 'Winter Warm Thobe',
    category: 'thobes',
    price: 28000,
    image: 'https://images.unsplash.com/photo-1578587018452-892bacefd3f2?w=400&h=500&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1578587018452-892bacefd3f2?w=800&h=1000&fit=crop',
    ],
    description: 'ثوب شتوي بطبقة داخلية دافئة، مثالي لفصل الشتاء. قماش سميك ومريح مع تصميم أنيق.',
    sizes: ['M', 'L', 'XL', 'XXL'],
    colors: [
      { name: 'رمادي داكن', hex: '#4B5563' },
      { name: 'كحلي', hex: '#1E3A5F' },
    ],
    rating: 4.6,
    reviewCount: 67,
    isNew: true,
    inStock: true,
    material: 'صوف مخلوط',
  },

  // شيلان (Shawls)
  {
    id: 'shawl-1',
    name: 'شال صوف فاخر',
    nameEn: 'Premium Wool Shawl',
    category: 'shawls',
    price: 15000,
    originalPrice: 20000,
    discount: 25,
    image: 'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=400&h=500&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=800&h=1000&fit=crop',
    ],
    description: 'شال صوف طبيعي 100% بجودة عالية، نسيج ناعم ودافئ. مناسب للمناسبات الرسمية والاستخدام اليومي في الشتاء.',
    sizes: ['قياس موحد'],
    colors: [
      { name: 'بني', hex: '#8B6914' },
      { name: 'رمادي', hex: '#6B7280' },
      { name: 'أسود', hex: '#1F2937' },
    ],
    rating: 4.7,
    reviewCount: 156,
    isBestSeller: true,
    inStock: true,
    material: 'صوف طبيعي 100%',
  },
  {
    id: 'shawl-2',
    name: 'شال عادي متعدد الألوان',
    nameEn: 'Multi-Color Regular Shawl',
    category: 'shawls',
    price: 8000,
    image: 'https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?w=400&h=500&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?w=800&h=1000&fit=crop',
    ],
    description: 'شال عادي خفيف الوزن بألوان متعددة، مناسب لجميع الفصول. نسيج مريح وعملي للاستخدام اليومي.',
    sizes: ['قياس موحد'],
    colors: [
      { name: 'أخضر', hex: '#059669' },
      { name: 'أزرق', hex: '#2563EB' },
      { name: 'أحمر', hex: '#DC2626' },
    ],
    rating: 4.3,
    reviewCount: 92,
    inStock: true,
    material: 'قطن',
  },
  {
    id: 'shawl-3',
    name: 'شال مصوّف كشميري',
    nameEn: 'Cashmere Blend Shawl',
    category: 'shawls',
    price: 22000,
    originalPrice: 28000,
    discount: 21,
    image: 'https://images.unsplash.com/photo-1609803384069-19f3e5a70e75?w=400&h=500&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1609803384069-19f3e5a70e75?w=800&h=1000&fit=crop',
    ],
    description: 'شال مصوّف بخليط الكشمير الفاخر، ملمس حريري ودفء استثنائي. قطعة مميزة للرجل الأنيق.',
    sizes: ['قياس موحد'],
    colors: [
      { name: 'بيج', hex: '#C4A882' },
      { name: 'عنابي', hex: '#7C2D2D' },
    ],
    rating: 4.9,
    reviewCount: 78,
    isNew: true,
    inStock: true,
    material: 'كشمير مخلوط',
  },
  {
    id: 'shawl-4',
    name: 'شال صوف شتوي سميك',
    nameEn: 'Thick Winter Wool Shawl',
    category: 'shawls',
    price: 12000,
    image: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=400&h=500&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800&h=1000&fit=crop',
    ],
    description: 'شال صوف سميك للشتاء القارس، نسيج كثيف يوفر دفء ممتاز. تصميم كلاسيكي يناسب مختلف الأذواق.',
    sizes: ['قياس موحد'],
    colors: [
      { name: 'أسود', hex: '#111827' },
      { name: 'بني داكن', hex: '#5C3D1E' },
    ],
    rating: 4.4,
    reviewCount: 45,
    inStock: true,
    material: 'صوف سميك',
  },

  // أكوات وجواكت (Coats & Jackets)
  {
    id: 'coat-1',
    name: 'جاكت جلد فاخر',
    nameEn: 'Premium Leather Jacket',
    category: 'coats',
    price: 45000,
    originalPrice: 55000,
    discount: 18,
    image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&h=500&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&h=1000&fit=crop',
    ],
    description: 'جاكت جلد طبيعي فاخر بتصميم عصري. جلد ناعم ومتين مع بطانة داخلية مريحة. مثالي للإطلالات الأنيقة.',
    sizes: ['M', 'L', 'XL', 'XXL'],
    colors: [
      { name: 'أسود', hex: '#1F2937' },
      { name: 'بني', hex: '#6B4423' },
    ],
    rating: 4.8,
    reviewCount: 134,
    isBestSeller: true,
    inStock: true,
    material: 'جلد طبيعي',
  },
  {
    id: 'coat-2',
    name: 'كوت شتوي كلاسيكي',
    nameEn: 'Classic Winter Coat',
    category: 'coats',
    price: 38000,
    image: 'https://images.unsplash.com/photo-1544022613-e87ca75a784a?w=400&h=500&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1544022613-e87ca75a784a?w=800&h=1000&fit=crop',
    ],
    description: 'كوت شتوي كلاسيكي بتصميم أنيق، قماش سميك مع بطانة صوف داخلية. يوفر دفء ممتاز وإطلالة راقية.',
    sizes: ['S', 'M', 'L', 'XL'],
    colors: [
      { name: 'كحلي', hex: '#1E3A5F' },
      { name: 'رمادي', hex: '#4B5563' },
      { name: 'أسود', hex: '#111827' },
    ],
    rating: 4.6,
    reviewCount: 98,
    inStock: true,
    material: 'صوف وبوليستر',
  },
  {
    id: 'coat-3',
    name: 'جاكت رياضي أنيق',
    nameEn: 'Elegant Sport Jacket',
    category: 'coats',
    price: 22000,
    image: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400&h=500&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800&h=1000&fit=crop',
    ],
    description: 'جاكت رياضي بتصميم عصري يجمع بين الأناقة والراحة. خامة خفيفة ومناسبة لمختلف المواسم.',
    sizes: ['M', 'L', 'XL'],
    colors: [
      { name: 'زيتي', hex: '#4D5B3C' },
      { name: 'أزرق', hex: '#2563EB' },
    ],
    rating: 4.4,
    reviewCount: 56,
    isNew: true,
    inStock: true,
    material: 'نايلون وبوليستر',
  },
  {
    id: 'coat-4',
    name: 'بليزر رسمي',
    nameEn: 'Formal Blazer',
    category: 'coats',
    price: 52000,
    originalPrice: 60000,
    discount: 13,
    image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=400&h=500&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800&h=1000&fit=crop',
    ],
    description: 'بليزر رسمي فاخر بقصة إيطالية مثالية. مناسب للمناسبات الرسمية وحفلات الأعمال.',
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    colors: [
      { name: 'أسود', hex: '#0F172A' },
      { name: 'كحلي', hex: '#1E3A5F' },
    ],
    rating: 4.7,
    reviewCount: 167,
    isBestSeller: true,
    inStock: true,
    material: 'صوف إيطالي',
  },

  // معاوز (Maawiz)
  {
    id: 'maawiz-1',
    name: 'معوز يمني تقليدي',
    nameEn: 'Traditional Yemeni Maawiz',
    category: 'maawiz',
    price: 10000,
    originalPrice: 13000,
    discount: 23,
    image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=400&h=500&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800&h=1000&fit=crop',
    ],
    description: 'معوز يمني تقليدي بنقوش أصيلة وألوان زاهية. مصنوع من قماش قطني ناعم ومريح.',
    sizes: ['قياس موحد'],
    colors: [
      { name: 'مخطط ملون', hex: '#C8A96E' },
      { name: 'أزرق وأبيض', hex: '#3B82F6' },
    ],
    rating: 4.5,
    reviewCount: 87,
    isBestSeller: true,
    inStock: true,
    material: 'قطن يمني',
  },
  {
    id: 'maawiz-2',
    name: 'معوز حضرمي فاخر',
    nameEn: 'Premium Hadrami Maawiz',
    category: 'maawiz',
    price: 14000,
    image: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=400&h=500&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=800&h=1000&fit=crop',
    ],
    description: 'معوز حضرمي فاخر بتطريز يدوي دقيق. قطعة مميزة تعكس الأصالة والتراث اليمني.',
    sizes: ['قياس موحد'],
    colors: [
      { name: 'تقليدي', hex: '#8B6914' },
    ],
    rating: 4.8,
    reviewCount: 45,
    isNew: true,
    inStock: true,
    material: 'قطن مطرز',
  },
  {
    id: 'maawiz-3',
    name: 'معوز عصري مميز',
    nameEn: 'Modern Style Maawiz',
    category: 'maawiz',
    price: 8000,
    image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400&h=500&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&h=1000&fit=crop',
    ],
    description: 'معوز بتصميم عصري يجمع بين الأصالة والحداثة. خامة خفيفة ومريحة للاستخدام اليومي.',
    sizes: ['قياس موحد'],
    colors: [
      { name: 'متعدد', hex: '#059669' },
      { name: 'كلاسيكي', hex: '#6B4423' },
    ],
    rating: 4.2,
    reviewCount: 34,
    inStock: true,
    material: 'قطن خفيف',
  },

  // جنابي ومستلزماتها (Janbiya & Accessories)
  {
    id: 'janbiya-1',
    name: 'جنبية يمنية أصيلة',
    nameEn: 'Authentic Yemeni Janbiya',
    category: 'janbiya',
    price: 85000,
    originalPrice: 100000,
    discount: 15,
    image: 'https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=400&h=500&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=800&h=1000&fit=crop',
    ],
    description: 'جنبية يمنية أصيلة بتصميم تقليدي فاخر. مقبض مزخرف يدوياً وغمد مطرز بخيوط ذهبية. قطعة فنية تعكس التراث اليمني.',
    sizes: ['قياس موحد'],
    colors: [
      { name: 'ذهبي وفضي', hex: '#C8A96E' },
    ],
    rating: 4.9,
    reviewCount: 234,
    isBestSeller: true,
    inStock: true,
    material: 'فولاذ وفضة',
  },
  {
    id: 'janbiya-2',
    name: 'حزام جنبية مطرز',
    nameEn: 'Embroidered Janbiya Belt',
    category: 'janbiya',
    price: 25000,
    image: 'https://images.unsplash.com/photo-1622560480654-d96214fddae9?w=400&h=500&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1622560480654-d96214fddae9?w=800&h=1000&fit=crop',
    ],
    description: 'حزام جنبية مطرز بخيوط ذهبية وفضية. تصميم تقليدي أنيق يكمل إطلالة الجنبية.',
    sizes: ['S', 'M', 'L'],
    colors: [
      { name: 'ذهبي', hex: '#C8A96E' },
      { name: 'فضي', hex: '#C0C0C0' },
    ],
    rating: 4.6,
    reviewCount: 78,
    inStock: true,
    material: 'جلد مطرز',
  },
  {
    id: 'janbiya-3',
    name: 'طقم جنبية كامل',
    nameEn: 'Complete Janbiya Set',
    category: 'janbiya',
    price: 150000,
    originalPrice: 180000,
    discount: 17,
    image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400&h=500&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&h=1000&fit=crop',
    ],
    description: 'طقم جنبية كامل يشمل الجنبية والحزام والغمد. تصنيع يدوي فاخر بأجود المواد. هدية مثالية.',
    sizes: ['قياس موحد'],
    colors: [
      { name: 'تقليدي فاخر', hex: '#C8A96E' },
    ],
    rating: 4.9,
    reviewCount: 156,
    isNew: true,
    isBestSeller: true,
    inStock: true,
    material: 'فولاذ وجلد وفضة',
  },

  // ملابس داخلية (Underwear)
  {
    id: 'under-1',
    name: 'طقم فنايل قطنية (3 قطع)',
    nameEn: 'Cotton Undershirts Set (3pcs)',
    category: 'underwear',
    price: 5000,
    originalPrice: 7000,
    discount: 29,
    image: 'https://images.unsplash.com/photo-1586363104862-3a5e2ab60d99?w=400&h=500&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1586363104862-3a5e2ab60d99?w=800&h=1000&fit=crop',
    ],
    description: 'طقم فنايل قطنية من 3 قطع بجودة عالية. قطن ناعم ومريح، مناسب للاستخدام اليومي تحت الثوب.',
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    colors: [
      { name: 'أبيض', hex: '#FFFFFF' },
    ],
    rating: 4.3,
    reviewCount: 312,
    isBestSeller: true,
    inStock: true,
    material: 'قطن 100%',
  },
  {
    id: 'under-2',
    name: 'بوكسر قطني مريح (عبوة 3)',
    nameEn: 'Comfortable Cotton Boxers (3-pack)',
    category: 'underwear',
    price: 4500,
    image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=400&h=500&fit=crop&crop=center',
    images: [
      'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800&h=1000&fit=crop',
    ],
    description: 'بوكسر قطني مريح بعبوة من 3 قطع. تصميم مريح يوفر حرية حركة كاملة مع خامة قطنية ناعمة.',
    sizes: ['S', 'M', 'L', 'XL'],
    colors: [
      { name: 'أسود', hex: '#1F2937' },
      { name: 'رمادي', hex: '#6B7280' },
      { name: 'كحلي', hex: '#1E3A5F' },
    ],
    rating: 4.4,
    reviewCount: 198,
    inStock: true,
    material: 'قطن مخلوط',
  },
  {
    id: 'under-3',
    name: 'فانلة حرارية شتوية',
    nameEn: 'Thermal Winter Undershirt',
    category: 'underwear',
    price: 6000,
    image: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=400&h=500&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=800&h=1000&fit=crop',
    ],
    description: 'فانلة حرارية للشتاء بطبقة عازلة تحافظ على دفء الجسم. مثالية للارتداء تحت الثوب في الأيام الباردة.',
    sizes: ['M', 'L', 'XL', 'XXL'],
    colors: [
      { name: 'أبيض', hex: '#FAFAFA' },
      { name: 'رمادي', hex: '#9CA3AF' },
    ],
    rating: 4.5,
    reviewCount: 76,
    isNew: true,
    inStock: true,
    material: 'قطن حراري',
  },
];

export const banners: Banner[] = [
  {
    id: 'banner-1',
    title: 'عروض نهاية الموسم',
    subtitle: 'خصومات تصل إلى 30%',
    image: { uri: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&h=400&fit=crop&q=80' },
    discount: '30%',
    bgColor: '#0A0A0A',
  },
  {
    id: 'banner-2',
    title: 'تشكيلة الشتاء الجديدة',
    subtitle: 'أحدث الموديلات العصرية',
    image: { uri: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=800&h=400&fit=crop&q=80' },
    bgColor: '#1A1A1A',
  },
];

export const getProductsByCategory = (categoryId: string): Product[] => {
  return products.filter(p => p.category === categoryId);
};

export const getProductById = (id: string): Product | undefined => {
  return products.find(p => p.id === id);
};

export const getBestSellers = (): Product[] => {
  return products.filter(p => p.isBestSeller);
};

export const getNewArrivals = (): Product[] => {
  return products.filter(p => p.isNew);
};

export const getDiscountedProducts = (): Product[] => {
  return products.filter(p => p.discount && p.discount > 0);
};

export const searchProducts = (query: string): Product[] => {
  const lower = query.toLowerCase();
  return products.filter(
    p => p.name.includes(query) || p.nameEn.toLowerCase().includes(lower) || p.description.includes(query)
  );
};

export const formatPrice = (price: number): string => {
  return price.toLocaleString('ar-YE') + ' ر.ي';
};
