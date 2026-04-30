import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();

function dateString(d: Date): string {
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}

export const updateStreak = functions.https.onCall(async (data, context) => {
  const deviceId: string | undefined = data?.deviceId;
  if (!deviceId) throw new functions.https.HttpsError("invalid-argument", "deviceId required");

  const clientDate: string | undefined = data?.clientDate;
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  const todayStr = (clientDate && dateRegex.test(clientDate))
    ? clientDate
    : dateString(new Date());

  const streakRef = admin.firestore().collection("streaks").doc(deviceId);
  const now = admin.firestore.Timestamp.now();
  const streakDoc = await streakRef.get();

  if (!streakDoc.exists) {
    await streakRef.set({ count: 1, lastLogin: now });
    return { streak: 1 };
  }

  const { count, lastLogin } = streakDoc.data()!;
  const lastDate = new Date(lastLogin.seconds * 1000);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = dateString(yesterday);

  if (dateString(lastDate) === todayStr) return { streak: count };
  if (dateString(lastDate) === yesterdayStr) {
    const newCount = count + 1;
    await streakRef.update({ count: newCount, lastLogin: now });
    return { streak: newCount };
  }

  await streakRef.set({ count: 1, lastLogin: now });
  return { streak: 1 };
});

export const syncDustWallet = functions.https.onCall(async (data, context) => {
  const deviceId: string | undefined = data?.deviceId;
  const dust: number | undefined = data?.dust;
  if (!deviceId) throw new functions.https.HttpsError("invalid-argument", "deviceId required");
  if (typeof dust !== "number" || dust < 0 || dust >= 1000000) {
    throw new functions.https.HttpsError("invalid-argument", "invalid dust value");
  }

  const docRef = admin.firestore().collection("dust_wallet").doc(deviceId);
  const now = admin.firestore.Timestamp.now();
  await docRef.set({ name: deviceId, dust, ts: now }, { merge: true });
  return { success: true };
});
