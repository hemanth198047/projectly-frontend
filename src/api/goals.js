import client from "./client";

export const getGoals = () => client.get("/goals");
export const getGoal = (id) => client.get(`/goals/${id}`);
export const createGoal = (data) => client.post("/goals", data);
export const updateGoal = (id, data) => client.put(`/goals/${id}`, data);
export const updateGoalProgress = (id, progress) =>
  client.patch(`/goals/${id}/progress`, { progress });
export const deleteGoal = (id) => client.delete(`/goals/${id}`);
export const addSubGoal = (id, data) =>
  client.post(`/goals/${id}/subgoals`, data);
export const updateSubGoal = (id, subGoalId, data) =>
  client.put(`/goals/${id}/subgoals/${subGoalId}`, data);
export const deleteSubGoal = (id, subGoalId) =>
  client.delete(`/goals/${id}/subgoals/${subGoalId}`);
export const addStep = (id, subGoalId, data) =>
  client.post(`/goals/${id}/subgoals/${subGoalId}/steps`, data);
export const toggleStep = (id, subGoalId, stepId) =>
  client.patch(`/goals/${id}/subgoals/${subGoalId}/steps/${stepId}/toggle`);
export const deleteStep = (id, subGoalId, stepId) =>
  client.delete(`/goals/${id}/subgoals/${subGoalId}/steps/${stepId}`);
export const getGoalsList = () => client.get("/goals");
