import { $C } from "@/utils";

export const fetchVisitorCount = async () => {
  try {
    const apiUrl = `${import.meta.env.SITE}/api/visitor-count`;
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error("Failed to fetch count");
    }
    const data = await response.json();
    return Math.max($C.MIN_PARTICLES, Math.min($C.MAX_PARTICLES, data.count));
  } catch (error) {
    console.error("Error:", error);
    return $C.MIN_PARTICLES;
  }
};