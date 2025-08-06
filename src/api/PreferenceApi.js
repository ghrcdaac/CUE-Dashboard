// src/api/userApi.js
export async function getUserPreferences(ngroupId, token) {
  const res = await fetch(
    `http://localhost:8000/v1/user/preferences?ngroup_id=${ngroupId}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.json();
}

export async function updateUserPreferences(ngroupId, prefs, token) {
  const res = await fetch(
    `http://localhost:8000/v1/user/preferences?ngroup_id=${ngroupId}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(prefs),
    }
  );
  return res.json();
}
