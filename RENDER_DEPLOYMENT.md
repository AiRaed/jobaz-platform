# Render Deployment Commands

## خطوات النشر على Render

### 1. إعداد المشروع على Render

1. اذهب إلى [render.com](https://render.com)
2. أنشئ حساب جديد أو سجل الدخول
3. اضغط على "New +" ثم اختر "Web Service"
4. اربط مستودع GitHub الخاص بك

### 2. إعدادات البيئة (Environment Variables)

في قسم "Environment Variables" في Render، أضف المتغيرات التالية:

```
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-app-name.onrender.com
```

### 3. إعدادات البناء (Build Settings)

**Build Command:**
```bash
npm install && npm run build
```

**Start Command:**
```bash
npm start
```

### 4. أوامر النشر السريع

#### للتحقق من أن كل شيء يعمل محلياً قبل النشر:

```bash
# تثبيت الحزم
npm install

# بناء المشروع
npm run build

# تشغيل محلي للاختبار
npm start
```

#### أوامر Git للنشر:

```bash
# إضافة التغييرات
git add .

# عمل commit
git commit -m "Fix paywall flicker - show only after question 15"

# رفع التغييرات
git push origin main
```

بعد الرفع، Render سيقوم تلقائياً بـ:
1. اكتشاف التغييرات
2. بناء المشروع
3. نشر التحديثات

### 5. التحقق من النشر

بعد اكتمال النشر، تحقق من:
- ✅ الموقع يعمل: `https://your-app-name.onrender.com`
- ✅ صفحة Practice: `https://your-app-name.onrender.com/practice`
- ✅ بطاقة الدفع تظهر فقط بعد السؤال 15
- ✅ لا توجد وميض بين الأسئلة

### 6. مراقبة الأخطاء

في لوحة تحكم Render:
- **Logs**: للتحقق من أي أخطاء أثناء البناء أو التشغيل
- **Metrics**: لمراقبة الأداء
- **Events**: لمتابعة أحداث النشر

### 7. إعادة النشر (Redeploy)

إذا احتجت إعادة النشر:
```bash
# في Render Dashboard
# اضغط على "Manual Deploy" > "Deploy latest commit"
```

أو:
```bash
# من Git
git commit --allow-empty -m "Trigger redeploy"
git push origin main
```

## ملاحظات مهمة

⚠️ **تأكد من:**
- جميع المتغيرات البيئية محددة في Render
- قاعدة البيانات (إن وجدت) متصلة بشكل صحيح
- المفاتيح السرية (API keys) محددة في Environment Variables

✅ **بعد النشر:**
- اختبر صفحة Practice
- تأكد أن بطاقة الدفع لا تظهر خلال الأسئلة 1-15
- تأكد أن بطاقة الدفع تظهر بعد السؤال 15

