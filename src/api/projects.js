import client from "./client";

export const getProjects = () => client.get("/projects");
export const getProject = (id) => client.get(`/projects/${id}`);
export const createProject = (data) => client.post("/projects", data);
export const updateProject = (id, data) => client.put(`/projects/${id}`, data);
export const deleteProject = (id) => client.delete(`/projects/${id}`);
export const getProjectProgress = (id) =>
  client.get(`/projects/${id}/progress`);
export const getSubProjects = (id) => client.get(`/projects/${id}/subprojects`);
export const getRootProjects = () => client.get("/projects/roots");
