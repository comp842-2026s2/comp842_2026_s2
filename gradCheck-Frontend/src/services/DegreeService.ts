import type { Degree } from "../models/Degree";

class DegreeService {
  private readonly baseUrl = "http://localhost:8000";

  async getDegrees(): Promise<Degree[]> {
    const response = await fetch(`${this.baseUrl}/degrees`);

    if (!response.ok) {
      throw new Error("Failed to load degrees");
    }

    return await response.json() as Degree[];
  }
}

export const degreeService = new DegreeService();