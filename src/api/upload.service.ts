import httpClient from './httpClient';

export async function uploadImagem(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  const res = await httpClient.post<{ url: string }>('/upload_imagem', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data.url;
}

export async function uploadMultiplasImagens(files: File[]): Promise<string[]> {
  return Promise.all(files.map((f) => uploadImagem(f)));
}
