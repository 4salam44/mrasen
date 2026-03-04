# إرشادات الأمان / Security Guidelines

## المتغيرات البيئية / Environment Variables

يستخدم هذا المشروع متغيرات بيئية لتخزين البيانات الحساسة مثل مفاتيح API وروابط الخدمات.

### الإعداد / Setup

1. انسخ ملف `.env.example` إلى `.env`:
   ```bash
   cp .env.example .env
   ```

2. املأ القيم الفعلية في ملف `.env`:
   ```env
   EXPO_PUBLIC_SUPABASE_URL=your_actual_supabase_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_actual_anon_key
   ```

### قواعد مهمة / Important Rules

⚠️ **لا تقم أبداً بما يلي:**
- رفع ملف `.env` إلى Git
- مشاركة محتويات ملف `.env` مع أي شخص
- كتابة المفاتيح أو الأسرار مباشرة في الكود
- نشر لقطات شاشة تحتوي على المفاتيح

✅ **يجب عليك دائماً:**
- استخدام `process.env` للوصول إلى المتغيرات البيئية
- التأكد من أن `.env` مدرج في `.gitignore`
- استخدام `.env.example` كنموذج للمطورين الآخرين
- تحديث `.env.example` عند إضافة متغيرات جديدة

### المتغيرات المستخدمة حالياً / Current Variables

| المتغير / Variable | الوصف / Description | مطلوب / Required |
|-------------------|---------------------|------------------|
| `EXPO_PUBLIC_SUPABASE_URL` | رابط مشروع Supabase / Supabase project URL | نعم / Yes |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | المفتاح العام لـ Supabase / Supabase anonymous key | نعم / Yes |

### ملاحظات أمنية إضافية / Additional Security Notes

- المفاتيح التي تبدأ بـ `EXPO_PUBLIC_` يمكن الوصول إليها من جانب العميل
- لا تضع أسرار حساسة في متغيرات `EXPO_PUBLIC_*`
- استخدم Supabase Row Level Security (RLS) لحماية البيانات
- قم بتدوير المفاتيح بشكل دوري

### في حالة تسريب المفاتيح / If Keys Are Compromised

إذا تم تسريب المفاتيح عن طريق الخطأ:

1. قم بتغيير المفاتيح فوراً من لوحة تحكم Supabase
2. قم بتحديث ملف `.env` المحلي
3. أبلغ فريق التطوير
4. راجع سجلات الوصول للتحقق من أي نشاط مشبوه

## الإبلاغ عن مشاكل أمنية / Reporting Security Issues

إذا اكتشفت ثغرة أمنية، يرجى عدم فتح issue عام. بدلاً من ذلك، تواصل مع فريق التطوير مباشرة.
