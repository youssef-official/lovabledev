# تشخيص مشكلة الاتصال بقاعدة البيانات Supabase

## المشكلة المبلغ عنها
عند محاولة الوصول إلى الموقع `youssef.ymoo.site`، يظهر خطأ:
```
getaddrinfo ENOTFOUND
db.cqrdffcvmoxwzjrsymvm.supabase.co
```

## التحليل

### 1. ملف .env
تم العثور على ملف `.env` في المشروع يحتوي على:
```
DATABASE_URL=postgresql://postgres:[2411]@db.cqrdffcvmoxwzjrsymvm.supabase.co:5432/postgres
```

**المشكلة المحتملة:** 
- كلمة المرور `[2411]` تبدو غير صحيحة أو غير مكتملة
- قد تكون كلمة المرور غير مفعلة في Supabase
- قد تكون هناك مشكلة في إعدادات DNS أو الاتصال بالخادم

### 2. ملف database.ts
الكود يستخدم `pg.Pool` للاتصال بقاعدة البيانات:
```typescript
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

**المشكلة المحتملة:**
- `connectionTimeoutMillis: 2000` (2 ثانية) قد تكون قصيرة جدًا
- قد تكون هناك مشكلة في إعدادات SSL
- قد يكون عنوان الخادم غير صحيح

### 3. إعدادات Supabase
الرابط المحدد في DATABASE_URL:
```
db.cqrdffcvmoxwzjrsymvm.supabase.co
```

**المشكلة المحتملة:**
- قد تكون قاعدة البيانات في حالة `Stopped` في لوحة تحكم Supabase
- قد تكون هناك مشكلة في إعدادات الشبكة أو firewall
- قد يكون اسم النطاق (domain) غير صحيح

## الحلول المقترحة

### الحل 1: التحقق من إعدادات Supabase
1. تسجيل الدخول إلى لوحة تحكم Supabase
2. التأكد من أن قاعدة البيانات `cqrdffcvmoxwzjrsymvm` نشطة
3. التحقق من كلمة المرور الصحيحة
4. التأكد من أن عنوان IP للخادم يسمح بالاتصال

### الحل 2: تحديث ملف .env
1. الحصول على معلومات الاتصال الصحيحة من Supabase
2. تحديث `DATABASE_URL` ببيانات صحيحة
3. إعادة نشر التطبيق

### الحل 3: زيادة وقت الاتصال
تعديل `connectionTimeoutMillis` من 2000 إلى 5000 أو 10000

### الحل 4: إضافة معالجة الأخطاء
إضافة logging أفضل لتحديد سبب الخطأ بالضبط

## الخطوات التالية
1. التحقق من حالة قاعدة البيانات في Supabase
2. تحديث إعدادات الاتصال
3. رفع التعديلات إلى الريبو
4. إعادة نشر التطبيق
