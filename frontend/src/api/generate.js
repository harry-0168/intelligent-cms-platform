import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8001";

export async function generatePage(payload) {
  const response = await axios.post(`${API_BASE}/generate`, payload);
  return response.data;
}

export async function fetchPages() {
  const response = await axios.get(`${API_BASE}/pages`);
  return response.data;
}

export async function publishPage(pageId, contentType = "page") {
  const response = await axios.post(
    `${API_BASE}/pages/${pageId}/publish?content_type=${contentType}`
  );
  return response.data;
}

export async function fetchAudit() {
  const response = await axios.get(`${API_BASE}/audit`);
  return response.data;
}

export async function fixMeta(itemId, payload) {
  const response = await axios.post(`${API_BASE}/audit/fix-meta/${itemId}`, payload);
  return response.data;
}

export async function generateCampaignBriefs(payload) {
  const response = await axios.post(`${API_BASE}/campaign/generate-briefs`, payload);
  return response.data;
}
