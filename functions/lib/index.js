"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateStreak = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
admin.initializeApp();
function dateString(d) {
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}
exports.updateStreak = functions.https.onCall(async (data, context) => {
    if (!context.auth)
        throw new functions.https.HttpsError("unauthenticated", "Must be signed in");
    const deviceId = data?.deviceId;
    if (!deviceId)
        throw new functions.https.HttpsError("invalid-argument", "deviceId required");
    // Always use server date — never trust client-supplied dates
    const todayStr = dateString(new Date());
    const streakRef = admin.firestore().collection("streaks").doc(deviceId);
    const now = admin.firestore.Timestamp.now();
    const streakDoc = await streakRef.get();
    if (!streakDoc.exists) {
        await streakRef.set({ count: 1, lastLogin: now });
        return { streak: 1 };
    }
    const { count, lastLogin } = streakDoc.data();
    const lastDate = new Date(lastLogin.seconds * 1000);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = dateString(yesterday);
    if (dateString(lastDate) === todayStr)
        return { streak: count };
    if (dateString(lastDate) === yesterdayStr) {
        const newCount = count + 1;
        await streakRef.update({ count: newCount, lastLogin: now });
        return { streak: newCount };
    }
    await streakRef.set({ count: 1, lastLogin: now });
    return { streak: 1 };
});
