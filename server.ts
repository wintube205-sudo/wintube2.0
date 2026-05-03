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
  const PORT = parseInt(process.env.PORT || '3000', 10);
  app.use(express.json());

  // --- Internal Platform API (For mobile apps, third-party sites, B2B sales) ---
  const authenticateApi = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const apiKey = req.headers['x-api-key'] || req.query.api_key;
    if (!apiKey) return res.status(401).json({ error: "Missing API Key" });
    
    try {
      const db = admin.firestore();
      const keyDoc = await db.collection('api_keys').doc(apiKey as string).get();
      if (!keyDoc.exists || !keyDoc.data()?.active) {
         return res.status(403).json({ error: "Invalid or inactive API Key" });
      }
      // Attach integration details to request
      (req as any).integration = keyDoc.data();
      next();
    } catch(e) {
      console.error(e);
      res.status(500).json({ error: "API auth failed" });
    }
  };

  // --- External Offers Proxy to avoid CORS ---
  app.get("/api/proxy/cpagrip", async (req, res) => {
    try {
      const url = new URL('https://www.cpagrip.com/common/offer_feed_json.php');
      Object.keys(req.query).forEach(key => url.searchParams.append(key, req.query[key] as string));
      const response = await fetch(url.toString());
      const data = await response.json();
      res.json(data);
    } catch(e) {
      res.status(500).json({ error: "Failed to fetch offers" });
    }
  });

  app.get("/api/proxy/mylead", async (req, res) => {
    try {
      const token = req.query.token;
      if (!token) return res.status(400).json({ error: "No token provided" });
      const response = await fetch('https://api.mylead.eu/api/external/v1/campaigns', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      const data = await response.json();
      res.json(data);
    } catch(e) {
      res.status(500).json({ error: "Failed to fetch offers" });
    }
  });

  // Get User Profile
  app.get("/api/v1/users/:id", authenticateApi, async (req, res) => {
    try {
      const db = admin.firestore();
      const userDoc = await db.collection('users').doc(req.params.id).get();
      if (!userDoc.exists) return res.status(404).json({ error: "User not found" });
      const data = userDoc.data();
      res.json({
        id: userDoc.id,
        name: data?.name,
        email: data?.email,
        points: data?.points,
        level: data?.level,
        isVIP: data?.isVIP,
      });
    } catch(e) {
      res.status(500).json({ error: "Server error" });
    }
  });

  // Mutate User Points
  app.post("/api/v1/users/:id/points", authenticateApi, async (req, res) => {
    try {
      const db = admin.firestore();
      const { amount, reason, type } = req.body;
      if (!amount || typeof amount !== 'number') return res.status(400).json({ error: "Invalid amount" });
      
      const userRef = db.collection('users').doc(req.params.id);
      
      await db.runTransaction(async (t) => {
         const doc = await t.get(userRef);
         if (!doc.exists) throw new Error("User not found");
         const currentPoints = doc.data()?.points || 0;
         t.update(userRef, { points: currentPoints + amount });
         
         const historyRef = userRef.collection('history').doc(Date.now().toString());
         t.set(historyRef, {
           title: reason || ((req as any).integration?.name + ' API Transaction'),
           amount: amount,
           type: type || (amount > 0 ? 'earn' : 'spend'),
           integrationId: (req as any).integration?.name,
           createdAt: admin.firestore.FieldValue.serverTimestamp()
         });
      });
      res.json({ success: true, message: "Points updated successfully" });
    } catch(e: any) {
      res.status(500).json({ error: e.message || "Server error" });
    }
  });

  // Fetch Public Content (Videos / Games)
  app.get("/api/v1/content", authenticateApi, async (req, res) => {
     try {
        const db = admin.firestore();
        const type = req.query.type as string; // 'game' or 'video'
        
        let contentQuery = db.collection('user_content').limit(20);
        if (type) {
           contentQuery = db.collection('user_content').where('type', '==', type).limit(20);
        }
        
        const snap = await contentQuery.get();
        const content = snap.docs.map(d => ({id: d.id, ...d.data()}));
        res.json({ success: true, data: content });
     } catch(e) {
        res.status(500).json({ error: "Server error" });
     }
  });
  // -----------------------------------------------------------------------------

  // إعداد مسار استقبال إشعارات العروض (Postback / Webhook)
  // الرابط الجديد الخاص بك في MyLead سيكون:
  // https://wintube.win/api/postback/mylead?subid=[ml_sub1]&payout=[payout]&status=[status]&tx=[lead_id]
  app.get("/api/postback/mylead", async (req, res) => {
    const subid = req.query.subid as string;
    const payout = req.query.payout as string; 
    const status = req.query.status as string; 
    const tx = req.query.tx as string;

    console.log(`[إشعار جديد من MyLead] 🎉`);
    console.log(`المستخدم: ${subid}, الربح: ${payout}, الحالة: ${status}`);

    if (!subid || !payout) {
      return res.status(400).send("Missing parameters");
    }

    try {
      // كل 1 دولار = 1000 نقطة (يمكنك تعديلها)
      const exchangeRate = 1000;
      const pointsToAdd = Math.floor(Number(payout) * exchangeRate);

      if (!isNaN(pointsToAdd) && pointsToAdd > 0) {
        const db = admin.firestore();
        const userRef = db.collection('users').doc(subid);
        const userSnap = await userRef.get();
        
        if (userSnap.exists) {
          await db.runTransaction(async (t) => {
             const doc = await t.get(userRef);
             const currentPoints = doc.data()?.points || 0;
             t.update(userRef, { points: currentPoints + pointsToAdd });
             
             const historyRef = userRef.collection('history').doc(tx || Date.now().toString());
             t.set(historyRef, {
               title: 'إكمال عرض من MyLead',
               amount: pointsToAdd,
               type: 'earn',
               createdAt: admin.firestore.FieldValue.serverTimestamp()
             });
          });
          console.log(`تم إضافة ${pointsToAdd} نقطة للمستخدم ${subid} بنجاح! ✅`);
        }
      }
      res.status(200).send("OK");
    } catch (error) {
       console.error("خطأ:", error);
       res.status(500).send("Error");
    }
  });

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

    if (!subid || !reward) {
      return res.status(400).send("Missing parameters");
    }

    try {
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
             
             const historyRef = userRef.collection('history').doc(tx || Date.now().toString());
             t.set(historyRef, {
               title: 'إكمال عرض (Offerwall)',
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
      
      res.status(200).send("OK");
    } catch (error) {
       console.error("خطأ أثناء إضافة النقاط للمستخدم:", error);
       res.status(500).send("Internal Server Error");
    }
  });

  // https://wintube.win/api/postback/bitcotasks?subid=[uid]&reward=[amount]&payout=[payout]&status=[status]&tx=[tx]
  app.get("/api/postback/bitcotasks", async (req, res) => {
    const subid = req.query.subid as string;
    const reward = req.query.reward as string;
    const payout = req.query.payout as string;
    
    // Some networks send "status=1" or "status=completed"
    // Usually bitcotasks uses numerical IDs or specific strings, we just ensure subid and reward exist
    if (!subid || !reward) {
      return res.status(400).send("0");
    }

    try {
      const pointsToAdd = Number(reward);
      if (!isNaN(pointsToAdd) && pointsToAdd > 0) {
        const db = admin.firestore();
        const userRef = db.collection('users').doc(subid);
        const userSnap = await userRef.get();
        
        if (userSnap.exists) {
          await db.runTransaction(async (t) => {
             const doc = await t.get(userRef);
             const currentPoints = Number(doc.data()?.points) || 0;
             t.update(userRef, { points: currentPoints + pointsToAdd });
             
             const txId = (req.query.tx as string) || Date.now().toString();
             const historyRef = userRef.collection('history').doc(txId);
             t.set(historyRef, {
               title: 'إكمال عرض (BitcoTasks)',
               amount: pointsToAdd,
               type: 'earn',
               createdAt: admin.firestore.FieldValue.serverTimestamp()
             });
          });
          console.log(`BitcoTasks: تم إضافة ${pointsToAdd} نقطة للمستخدم ${subid}`);
        }
      }
      res.status(200).send("1"); // Bitcotasks often expects '1' for success
    } catch (error) {
       console.error("BitcoTasks Postback Error:", error);
       res.status(500).send("0");
    }
  });

  // https://wintube.win/api/postback/cpxresearch?status={status}&trans_id={trans_id}&user_id={user_id}&amount_local={amount_local}&amount_usd={amount_usd}&hash={secure_hash}
  app.get("/api/postback/cpxresearch", async (req, res) => {
    const status = req.query.status as string; // 1 = Success, 2 = Chargeback
    const trans_id = req.query.trans_id as string;
    const user_id = req.query.user_id as string;
    const amount_local = req.query.amount_local as string;

    if (!user_id || !amount_local || !status) {
      return res.status(400).send("Missing parameters");
    }

    try {
      const points = Number(amount_local);
      if (!isNaN(points) && points > 0) {
        const db = admin.firestore();
        const userRef = db.collection('users').doc(user_id);
        const userSnap = await userRef.get();
        
        if (userSnap.exists) {
          await db.runTransaction(async (t) => {
             const doc = await t.get(userRef);
             const currentPoints = Number(doc.data()?.points) || 0;
             
             const txId = trans_id || Date.now().toString();
             const historyRef = userRef.collection('history').doc(txId + (status === '2' ? '_cb' : ''));
             
             if (status === '1') {
                 // Success - Add Points
                 t.update(userRef, { points: currentPoints + points });
                 t.set(historyRef, {
                   title: 'إكمال استبيان (CPX Research)',
                   amount: points,
                   type: 'earn',
                   createdAt: admin.firestore.FieldValue.serverTimestamp()
                 });
                 console.log(`CPX Research: تم إضافة ${points} نقطة للمستخدم ${user_id}`);
             } else if (status === '2') {
                 // Chargeback - Deduct Points
                 t.update(userRef, { points: Math.max(0, currentPoints - points) });
                 t.set(historyRef, {
                   title: 'خصم استبيان محتال/ملغى (CPX Research)',
                   amount: points,
                   type: 'spend',
                   createdAt: admin.firestore.FieldValue.serverTimestamp()
                 });
                 console.log(`CPX Research: تم خصم ${points} نقطة من المستخدم ${user_id} (احتيال/استرداد)`);
             }
          });
        }
      }
      res.status(200).send("ok");
    } catch (error) {
       console.error("CPX Research Postback Error:", error);
       res.status(500).send("error");
    }
  });

  // إعداد مسار استقبال إشعارات CPAGrip
  // الرابط الجديد الخاص بك في CPAGrip سيكون:
  // https://wintube.win/api/postback/cpagrip?tracking_id={tracking_id}&payout={payout}&offer_id={offer_id}&ip={ip}
  app.get("/api/postback/cpagrip", async (req, res) => {
    const tracking_id = req.query.tracking_id as string; // هو Id المستخدم في قاعدة بياناتنا
    const payout = req.query.payout as string; // الربح بالدولار (مثلاً 1.25)
    const offer_id = req.query.offer_id as string;

    console.log(`[إشعار جديد من CPAGrip] 🎉`);
    console.log(`المستخدم: ${tracking_id}, الربح: ${payout}, العرض: ${offer_id}`);

    if (!tracking_id || !payout) {
      return res.status(400).send("Missing tracking_id or payout");
    }

    try {
      const db = admin.firestore();
      
      // جلب إعدادات النقاط لمعرفة كم نقطة لكل دولار
      const settingsSnap = await db.collection('settings').doc('global').get();
      const pointsPerDollar = settingsSnap.exists ? (settingsSnap.data()?.pointsPerDollar || 1000) : 1000;
      
      const pointsToAdd = Math.floor(Number(payout) * pointsPerDollar);

      if (pointsToAdd > 0) {
        const userRef = db.collection('users').doc(tracking_id);
        const userSnap = await userRef.get();

        if (userSnap.exists) {
          await db.runTransaction(async (t) => {
            const doc = await t.get(userRef);
            const currentPoints = doc.data()?.points || 0;
            t.update(userRef, { points: currentPoints + pointsToAdd });

            // تسجيل التاريخ
            const historyRef = userRef.collection('history').doc(`cpagrip_${offer_id}_${Date.now()}`);
            t.set(historyRef, {
              title: 'إكمال عرض (CPAGrip)',
              amount: pointsToAdd,
              type: 'earn',
              createdAt: admin.firestore.FieldValue.serverTimestamp()
            });
          });
          console.log(`تم إضافة ${pointsToAdd} نقطة للمستخدم ${tracking_id} من CPAGrip!`);
        }
      }
      res.status(200).send("OK");
    } catch (error) {
      console.error("CPA Grip Postback Error:", error);
      res.status(500).send("Error");
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
