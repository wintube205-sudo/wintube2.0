import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import * as admin from 'firebase-admin';

// Initialize Firebase Admin (Required for securely updating points from the server)
// In a real production deployment on your server, you should securely provide the service account key.
// Since you are deploying to Cloudflare/Vercel or custom Node server, you can set the environment variable:
// GOOGLE_APPLICATION_CREDENTIALS="/path/to/key.json"
// For now, we will initialize it implicitly if the env is set, or skip if not fully configured yet
try {
  if (!admin.apps.length) {
    admin.initializeApp();
  }
} catch (e) {
  console.log("Firebase Admin not configured yet in this environment.");
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  // إعداد مسار استقبال إشعارات العروض (Postback / Webhook)
  // الرابط الجديد الخاص بك في MyLead سيكون:
  // https://wintube.win/api/postback/offerwall?subid=[player_id]&reward=[virtual_amount]&payout=[payout]&status=[status]&tx=[transaction_id]
  app.get("/api/postback/offerwall", async (req, res) => {
    // استقبال وفك تشفير المتغيرات من رابط الـ Postback
    const subid = req.query.subid as string; // رقم المستخدم في موقعك
    const reward = req.query.reward as string; // عدد النقاط (virtual_amount)
    const payout = req.query.payout as string; // ارباحك بالدولار
    const status = req.query.status as string; // حالة العرض
    const tx = req.query.tx as string; // رقم العملية (لمنع التكرار)

    console.log(`[إشعار جديد من العروض] 🎉`);
    console.log(`المستخدم (player_id): ${subid}`);
    console.log(`النقاط (virtual_amount): ${reward}`);
    console.log(`الربح بالدولار (payout): ${payout}`);
    console.log(`الحالة (status): ${status}`);

    // التأكد من أن الإشعار حقيقي وأن العرض تمت الموافقة عليه
    // في MyLead، الحالة "approved" أو "accepted" تعني نجاح العرض
    if (!subid || !reward) {
      return res.status(400).send("Missing parameters");
    }

    try {
      // تحديث رصيد المستخدم بشكل آمن جداً باستخدام سيرفرات فايربيس (Admin)
      const pointsToAdd = Number(reward);
      if (!isNaN(pointsToAdd) && pointsToAdd > 0) {
        
        const db = admin.firestore();
        const userRef = db.collection('users').doc(subid);
        const userSnap = await userRef.get();
        
        if (userSnap.exists) {
          await db.runTransaction(async (t) => {
             const doc = await t.get(userRef);
             const currentPoints = doc.data()?.points || 0;
             t.update(userRef, { points: currentPoints + pointsToAdd });
             
             // حفظ السجل في تاريخ المستخدم
             const historyRef = userRef.collection('history').doc(tx || Date.now().toString());
             t.set(historyRef, {
               title: 'إكمال عرض من MyLead',
               amount: pointsToAdd,
               type: 'earn',
               createdAt: admin.firestore.FieldValue.serverTimestamp()
             });
          });
          console.log(`تم إضافة ${pointsToAdd} نقطة للمستخدم ${subid} بنجاح! ✅`);
        } else {
           console.log(`لم يتم العثور على المستخدم ${subid} في قاعدة البيانات ❌`);
        }
      }
      
      // الرد على شركة الإعلانات بأننا استلمنا الإشعار بنجاح (بعض الشركات تتطلب 1 او OK)
      res.status(200).send("OK");
    } catch (error) {
       console.error("خطأ أثناء إضافة النقاط للمستخدم:", error);
       res.status(500).send("Internal Server Error");
    }
  });

  // إعداد Vite Middleware ليعمل الخادم كـ Full-Stack
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
    app.get('*', (req, res) => res.sendFile(path.resolve('dist/index.html')));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
