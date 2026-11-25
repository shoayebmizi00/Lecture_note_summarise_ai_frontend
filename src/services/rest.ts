import { api } from "./api";
import type { User, UserSettings } from "../types";

interface AuthResponse {
  user: User;
  access_token?: string | null;
}

export const authService = {
  async register(payload: { username: string; email: string; password: string }): Promise<User> {
    const { data } = await api.post<AuthResponse>("/auth/register", payload);
    return data.user;
  },

  async login(payload: { identifier: string; password: string }): Promise<User> {
    const { data } = await api.post<AuthResponse>("/auth/login", payload);
    return data.user;
  },

  async logout(): Promise<void> {
    await api.post("/auth/logout");
  },

  async me(): Promise<User> {
    const { data } = await api.get<User>("/auth/me");
    return data;
  },

  async updateSettings(settings: Partial<UserSettings>): Promise<User> {
    const { data } = await api.patch<User>("/auth/settings", settings);
    return data;
  },

  async deleteAccount(): Promise<void> {
    await api.delete("/auth/account");
  },
};

export const lectureService = {
  async upload(
    file: File,
    useOcr: boolean,
    onProgress?: (percent: number) => void,
  ) {
    const form = new FormData();
    form.append("file", file);
    form.append("use_ocr", String(useOcr));
    const { data } = await api.post("/upload", form, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (event) => {
        if (onProgress && event.total) {
          onProgress(Math.round((event.loaded / event.total) * 100));
        }
      },
      timeout: 300_000,
    });
    return data as {
      lecture: import("../types").Lecture;
      warnings: string[];
      text_preview: string;
    };
  },

  async list(params: { limit?: number; skip?: number; q?: string } = {}) {
    const { data } = await api.get("/lectures", { params });
    return data as { items: import("../types").Lecture[]; total: number; limit: number; skip: number };
  },

  async get(id: string) {
    const { data } = await api.get(`/lectures/${id}`);
    return data as import("../types").LectureDetail;
  },

  async remove(id: string) {
    const { data } = await api.delete(`/lectures/${id}`);
    return data as { message: string };
  },

  async stats() {
    const { data } = await api.get("/stats");
    return data as import("../types").Stats;
  },

  async keywords(id: string) {
    const { data } = await api.get(`/lectures/${id}/keywords`);
    return data as { keywords: import("../types").Keyword[]; count: number };
  },

  async quiz(id: string) {
    const { data } = await api.get(`/lectures/${id}/quiz`);
    return data as { questions: import("../types").QuizQuestion[]; count: number };
  },
};

export const summaryService = {
  async list(params: { lecture_id?: string; method?: string; limit?: number; skip?: number } = {}) {
    const { data } = await api.get("/summaries", { params });
    return data as { items: import("../types").Summary[]; total: number };
  },

  async get(id: string) {
    const { data } = await api.get(`/summaries/${id}`);
    return data as import("../types").SummaryDetail;
  },

  async remove(id: string) {
    const { data } = await api.delete(`/summaries/${id}`);
    return data as { message: string };
  },
};

export const systemService = {
  async health() {
    const { data } = await api.get("/health");
    return data as import("../types").Health;
  },
};
