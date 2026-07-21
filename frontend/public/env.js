// Runtime environment injection for frontend without rebuilding.
// Railway: you can set this file's contents via your deploy or keep it templated here.
window.__ENV__ = window.__ENV__ || {
  VITE_API_BASE_URL: ''
};
