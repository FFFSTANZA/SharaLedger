export async function sendAPIRequest(
  endpoint: string,
  options: RequestInit | undefined
) {
  return await window.ipc?.sendAPIRequest(endpoint, options);
}
