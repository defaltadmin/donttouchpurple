import { lazy } from 'react';

export const LazyShopPanel = lazy(() => import("./Shop/ShopPanel").then(m => ({ default: m.ShopPanel })));
export const LazyLeaderboardPanel = lazy(() => import("./Leaderboard/LeaderboardPanel").then(m => ({ default: m.LeaderboardPanel })));
export const LazySettingsDrawer = lazy(() => import("./Settings/SettingsDrawer").then(m => ({ default: m.SettingsDrawer })));
