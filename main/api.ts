import fetch, { RequestInit } from 'node-fetch';
import { URL } from 'url';

export async function sendAPIRequest(
  endpoint: string,
  options: RequestInit | undefined
) {
  // Ensure we have a proper URL
  if (!endpoint || typeof endpoint !== 'string') {
    throw new Error('Invalid endpoint provided');
  }

  // If it's not an absolute URL, prepend a default base URL
  let url: string;
  try {
    new URL(endpoint);
    url = endpoint;
  } catch {
    // If it's a relative URL, prepend with https://
    url = `https://${endpoint}`;
  }

  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return (await response.json()) as unknown as {
      [key: string]: string | number | boolean;
    }[];
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
}
