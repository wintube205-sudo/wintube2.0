import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // إعداد مسار استقبال إشعارات العروض (Postback / Webhook)
  // هذا الرابط هو الذي ستقوم بوضعه في شركة الإعلانات (مثل CPALead)
  app.get("/api/postback/offerwall", async (req, res) => {
    // شركات العروض ترسل عادة بعض المتغيرات مثل:
    // subid: معرف المستخدم الخاص بك
    // reward: عدد النقاط
    // signature: كود للتحقق من أن الطلب آمن
    const { subid, reward, signature, payout } = req.query;

    console.log(`[إشعار جديد من العروض] 🎉`);
    console.log(`المستخدم: ${subid}`);
    console.log(`النقاط: ${reward}`);
    console.log(`الربح بالدولار: ${payout}`);

    // هنا في التطبيق الحقيقي سنقوم بالاتصال بقاعدة بيانات Firebase (باستخدام Firebase Admin SDK)
    // لتزويد نقاط المستخدم بشكل آمن لا يمكن اختراقه.
    // admin.firestore().collection('users').doc(subid).update({
    //    points: admin.firestore.FieldValue.increment(Number(reward))
    // });

    // الرد على شركة الإعلانات بأننا استلمنا الإشعار بنجاح (بعض الشركات تتطلب 1 او OK)
    res.status(200).send("1");
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
