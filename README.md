# לאה בודיק - אתר אדריכלות ועיצוב פנים

אתר פורטפוליו מקצועי עם פאנל ניהול מלא.

## התקנה מהירה

### דרישות מקדימות
- Node.js (גרסה 16 ומעלה)
- npm

### שלבי התקנה

1. **התקנת תלויות:**
```bash
npm install
```

2. **הגדרת משתני סביבה:**

ערוך את קובץ `.env` והגדר:
```env
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-secure-password
SESSION_SECRET=your-random-secret-key
PORT=3000
```

> **חשוב:** שנה את שם המשתמש והסיסמה לערכים מאובטחים!

3. **הפעלת השרת:**
```bash
npm start
```

4. **גישה לאתר:**
- אתר ציבורי: http://localhost:3000
- פאנל ניהול: http://localhost:3000/admin

---

## פאנל הניהול

### כניסה
1. היכנס לכתובת `/admin/login`
2. הזן שם משתמש וסיסמה (כפי שהוגדרו ב-.env)

### יכולות הניהול

#### תמונות ראשיות (Hero)
- עריכת כותרות ותיאור
- העלאת והסרת תמונות רקע

#### אודות
- עריכת טקסט אודות
- עדכון סטטיסטיקות (שנות ניסיון, פרויקטים, וכו')

#### גלריות
- יצירה, עריכה ומחיקת גלריות
- העלאת תמונות לגלריה
- בחירת תמונת כיסוי
- הגדרת גלריה כמוצגת בדף הבית

#### המלצות
- הוספה ועריכת המלצות לקוחות
- שליטה בהצגת ההמלצות

#### ציטוטים
- עריכת ציטוטים המופיעים באתר

#### יצירת קשר
- עדכון פרטי התקשרות (טלפון, וואטסאפ, אימייל)

#### פוטר
- עריכת תוכן הפוטר

---

## מבנה הקבצים

```
├── admin/
│   ├── login.html      # דף התחברות
│   ├── dashboard.html  # פאנל הניהול
│   ├── admin.css       # סגנונות פאנל הניהול
│   └── admin.js        # לוגיקת פאנל הניהול
├── data/
│   ├── content.json    # תוכן האתר
│   └── galleries.json  # נתוני הגלריות
├── public/
│   ├── css/
│   │   └── style.css   # סגנונות האתר
│   ├── js/
│   │   ├── script.js   # סקריפט ראשי
│   │   └── gallery.js  # לוגיקת גלריות
│   └── images/         # תמונות
├── index.html          # דף הבית
├── project*-gallery.html # דפי גלריות
├── server.js           # שרת Node.js
├── package.json        # תלויות הפרויקט
└── .env               # הגדרות סביבה
```

---

## API Endpoints

### אימות
- `POST /api/auth/login` - התחברות
- `POST /api/auth/logout` - התנתקות
- `GET /api/auth/check` - בדיקת סטטוס התחברות

### תוכן
- `GET /api/content` - קבלת כל התוכן
- `PUT /api/content` - עדכון כל התוכן
- `PUT /api/content/:section` - עדכון סקציה ספציפית

### גלריות
- `GET /api/galleries` - רשימת גלריות
- `GET /api/galleries/:id` - גלריה בודדת
- `POST /api/galleries` - יצירת גלריה
- `PUT /api/galleries/:id` - עדכון גלריה
- `DELETE /api/galleries/:id` - מחיקת גלריה

### תמונות
- `POST /api/galleries/:id/images` - העלאת תמונות
- `DELETE /api/galleries/:galleryId/images/:imageId` - מחיקת תמונה
- `PUT /api/galleries/:id/images-order` - שינוי סדר תמונות

### המלצות
- `GET /api/testimonials` - רשימת המלצות
- `POST /api/testimonials` - הוספת המלצה
- `PUT /api/testimonials/:id` - עדכון המלצה
- `DELETE /api/testimonials/:id` - מחיקת המלצה

---

## הפעלה בפרודקשן

### עם PM2
```bash
npm install -g pm2
pm2 start server.js --name "leah-budik"
pm2 save
```

### עם HTTPS (מומלץ)
השתמש ב-reverse proxy כמו Nginx עם תעודת SSL.

### הגדרות אבטחה
1. שנה `SESSION_SECRET` לערך אקראי ארוך
2. שנה סיסמת מנהל לסיסמה חזקה
3. הפעל HTTPS
4. הגדר `secure: true` ב-cookies (ב-server.js)

---

## תמיכה

לשאלות ותמיכה: ישראל בודיק - 053-480-7140

---

© 2024 לאה בודיק - כל הזכויות שמורות
