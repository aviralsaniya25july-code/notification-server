const express = require("express");
const admin = require("firebase-admin");

const app = express();
app.use(express.json());

admin.initializeApp({
  credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)),
});

app.post("/sendNotification", async (req, res) => {
  try {
    const { targetUserId, title, body } = req.body;
    const userDoc = await admin.firestore()
      .collection("users")
      .doc(targetUserId)
      .get();

    if (!userDoc.exists) {
      return res.status(404).send({ error: "User not found" });
    }

    const token = userDoc.data().fcm_token;
    if (!token) {
      return res.status(400).send({ error: "No FCM token found" });
    }

    const message = {
      notification: {
        title: title || "New Message",
        body: body || "You have a new notification",
      },
      token: token,
    };

    await admin.messaging().send(message);
    return res.status(200).send({ success: true });
  } catch (error) {
    console.error(error);
    return res.status(500).send({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
