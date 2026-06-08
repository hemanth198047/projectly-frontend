import client from "./client";
export const getNotificationCounts = () => client.get("/dashboard/summary");
