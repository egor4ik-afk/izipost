import { getBucketFiles } from '../lib/s3';
import Image from 'next/image';

export const dynamic = 'force-dynamic'; // Чтобы не кэшировал список навечно

export default async function Home() {
  const files = await getBucketFiles();

  return (
    <main style={{ padding: '20px' }}>
      <h1>Файлы в бакете: {files.length}</h1>
      
      {files.length === 0 ? (
        <p>Бакет пуст или нет доступа.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
          {files.map((file) => (
            <div key={file.key} style={{ border: '1px solid #ccc', padding: '10px', borderRadius: '8px' }}>
              <div style={{ position: 'relative', width: '100%', height: '150px' }}>
                {/* Используем next/image для оптимизации */}
                <Image 
                  src={file.url}
                  alt={file.key || ''} 
                  fill
                  style={{ objectFit: 'cover' }}
                />
              </div>
              <p style={{ fontSize: '12px', marginTop: '10px', wordBreak: 'break-all' }}>
                {file.key}
              </p>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
