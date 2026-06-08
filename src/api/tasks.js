import client from "./client";

export const getTasks = (params) => client.get("/tasks", { params });
export const getTask = (id) => client.get(`/tasks/${id}`);
export const createTask = (data) => client.post("/tasks", data);
export const updateTask = (id, data) => client.put(`/tasks/${id}`, data);
export const deleteTask = (id) => client.delete(`/tasks/${id}`);
export const addComment = (id, data) =>
  client.post(`/tasks/${id}/comments`, data);
export const deleteComment = (id, commentId) =>
  client.delete(`/tasks/${id}/comments/${commentId}`);
export const addTimeLog = (id, data) =>
  client.post(`/tasks/${id}/timelogs`, data);
export const deleteTimeLog = (id, timeLogId) =>
  client.delete(`/tasks/${id}/timelogs/${timeLogId}`);
