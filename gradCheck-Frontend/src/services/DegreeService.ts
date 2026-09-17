import { API_ENDPOINTS } from "../config/ApiConfig";
import type { Degree } from "../models/Degree";
import { httpClient } from "./HttpClient";

class DegreeService {
  getDegrees(): Promise<Degree[]> {
    return httpClient.request<Degree[]>(API_ENDPOINTS.degrees.list, {}, false);
  }
}

export const degreeService = new DegreeService();
