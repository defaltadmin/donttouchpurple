import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();

function dateString(d: Date): string {
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}

export const updateStreak = functions.https.onCall(async (data, context) => {
  const deviceId: string | undefined = data?.deviceId;
  if (!deviceId) throw new functions.https.HttpsError("invalid-argument", "deviceId required");

  const streakRef = admin.firestore().collection("streaks").doc(deviceId);
  const now = admin.firestore.Timestamp.now();
  const streakDoc = await streakRef.get();

  if (!streakDoc.exists) {
    await streakRef.set({ count: 1, lastLogin: now });
    return { streak: 1 };
  }

  const { count, lastLogin } = streakDoc.data()!;
  const lastDate = new Date(lastLogin.seconds * 1000);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const lastDay = dateString(lastDate);
  const todayStr = dateString(today);
  const yesterdayStr = dateString(yesterday);

  if (lastDay === todayStr) return { streak: count };
  if (lastDay === yesterdayStr) {
    const newCount = count + 1;
    await streakRef.update({ count: newCount, lastLogin: now });
    return { streak: newCount };
  }

  await streakRef.set({ count: 1, lastLogin: now });
  return { streak: 1 };
});
