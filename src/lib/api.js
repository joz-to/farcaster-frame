export const fetchWarpcastData = async (endpoint, apiKey) => {
  const response = await fetch(`https://client.warpcast.com/${endpoint}`, {
    method: "GET",
    headers: {
      "Accept": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
  });

  if (!response.ok) {
    const errorDetails = await response.text();
    throw new Error(`Failed to fetch data: ${errorDetails}`);
  }

  return response.json();
};