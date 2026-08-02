'use client';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

export default function MigrateR2Page() {
  const [status, setStatus]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [action, setAction]   = useState('');
  const [results, setResults] = useState(null);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/migrate-r2');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setStatus(data);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStatus(); }, []);

  const runMigration = async (actionType) => {
    const messages = {
      'copy-files': `Copy ${status?.r2?.oldFolderFiles || 0} files from ${status?.config?.oldPrefix}/ to ${status?.config?.newPrefix}/?`,
      'update-db':  `Update ${status?.database?.productsWithOldUrls || 0} products + banners + brands DB URLs?`,
      'full':       `Run FULL migration: Copy files + Update DB?\n\nThis is safe — original files won't be deleted.`,
    };

    if (!confirm(messages[actionType])) return;

    setLoading(true);
    setAction(actionType);
    setResults(null);

    try {
      const res = await fetch('/api/migrate-r2', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ action: actionType }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setResults(data.results);
      toast.success('✅ Migration completed!');
      await fetchStatus();
    } catch (err) {
      toast.error('❌ ' + err.message);
    } finally {
      setLoading(false);
      setAction('');
    }
  };

  return (
    <div style={{
      padding:      '20px',
      fontFamily:   'Nunito, sans-serif',
      maxWidth:     '900px',
      margin:       '0 auto',
    }}>
      <h1 style={{
        fontSize: '1.8rem',
        fontWeight: '900',
        color: '#2D1A4A',
        marginBottom: '8px',
      }}>
        🚀 R2 Migration
      </h1>
      <p style={{ color: '#6B7280', fontSize: '14px', marginBottom: '24px' }}>
        {status?.config?.oldPrefix} → {status?.config?.newPrefix}
      </p>

      <div style={{
        background:    '#FEF3C7',
        border:        '2px solid #FDE68A',
        borderRadius:  '12px',
        padding:       '14px 18px',
        marginBottom:  '20px',
      }}>
        <p style={{ margin: 0, fontSize: '13px', color: '#92400E', fontWeight: '700', lineHeight: 1.6 }}>
          ⚠️ <strong>IMPORTANT:</strong><br />
          1. This migration is <strong>SAFE</strong> — original files stay intact<br />
          2. Files are COPIED (not moved)<br />
          3. Database URLs are UPDATED<br />
          4. Old URLs still work if anything breaks<br />
          5. After 1 week of testing, you can manually delete old folder
        </p>
      </div>

      {loading && !status ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{ fontSize: '2rem' }}>⏳</div>
          <p>Loading status...</p>
        </div>
      ) : status ? (
        <>
          <div style={{
            background:   'white',
            border:       '2px solid #EDD9FF',
            borderRadius: '14px',
            padding:      '20px',
            marginBottom: '20px',
          }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '1rem', color: '#2D1A4A', fontWeight: '800' }}>
              📊 Current Status
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={{
                padding: '14px',
                background: '#FFF5F7',
                border: '1.5px solid #FCA5A5',
                borderRadius: '10px',
              }}>
                <p style={{ margin: '0 0 8px', fontSize: '12px', fontWeight: '800', color: '#DC2626', textTransform: 'uppercase' }}>
                  📁 R2 Bucket Files
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                    <span>{status.config.oldPrefix}/ files:</span>
                    <strong style={{ color: '#DC2626' }}>{status.r2.oldFolderFiles}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                    <span>{status.config.newPrefix}/ files:</span>
                    <strong style={{ color: '#059669' }}>{status.r2.newFolderFiles}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', borderTop: '1px dashed #DDD', paddingTop: '6px' }}>
                    <span>Total:</span>
                    <strong>{status.r2.totalFiles}</strong>
                  </div>
                </div>
              </div>

              <div style={{
                padding: '14px',
                background: '#F0FDF4',
                border: '1.5px solid #86EFAC',
                borderRadius: '10px',
              }}>
                <p style={{ margin: '0 0 8px', fontSize: '12px', fontWeight: '800', color: '#166534', textTransform: 'uppercase' }}>
                  💾 Database URLs
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                    <span>Products with old URLs:</span>
                    <strong style={{ color: '#DC2626' }}>{status.database.productsWithOldUrls}/{status.database.totalProducts}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                    <span>Banners with old URLs:</span>
                    <strong style={{ color: '#DC2626' }}>{status.database.bannersWithOldUrls}/{status.database.totalBanners}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                    <span>Brands with old URLs:</span>
                    <strong style={{ color: '#DC2626' }}>{status.database.brandsWithOldUrls}/{status.database.totalBrands}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div style={{
            background:   'white',
            border:       '2px solid #EDD9FF',
            borderRadius: '14px',
            padding:      '20px',
            marginBottom: '20px',
          }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '1rem', color: '#2D1A4A', fontWeight: '800' }}>
              ⚡ Migration Actions
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{
                padding: '14px 18px',
                background: '#FFFBEB',
                border: '1.5px solid #FDE68A',
                borderRadius: '10px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '12px',
              }}>
                <div>
                  <p style={{ margin: 0, fontSize: '13px', fontWeight: '800', color: '#92400E' }}>
                    Step 1: Copy files (R2)
                  </p>
                  <p style={{ margin: '3px 0 0', fontSize: '11px', color: '#78350F' }}>
                    Copies {status.r2.oldFolderFiles} files
                  </p>
                </div>
                <button
                  onClick={() => runMigration('copy-files')}
                  disabled={loading || status.r2.oldFolderFiles === 0}
                  style={{
                    padding: '10px 20px',
                    background: loading && action === 'copy-files' ? '#ccc' : 'linear-gradient(135deg,#F59E0B,#D97706)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: '800',
                    fontSize: '13px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontFamily: 'inherit',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {loading && action === 'copy-files' ? '⏳ Copying...' : '📁 Copy Files'}
                </button>
              </div>

              <div style={{
                padding: '14px 18px',
                background: '#EFF6FF',
                border: '1.5px solid #BFDBFE',
                borderRadius: '10px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '12px',
              }}>
                <div>
                  <p style={{ margin: 0, fontSize: '13px', fontWeight: '800', color: '#1E40AF' }}>
                    Step 2: Update Database URLs
                  </p>
                  <p style={{ margin: '3px 0 0', fontSize: '11px', color: '#1E3A8A' }}>
                    Updates Products, Banners, Brands
                  </p>
                </div>
                <button
                  onClick={() => runMigration('update-db')}
                  disabled={loading}
                  style={{
                    padding: '10px 20px',
                    background: loading && action === 'update-db' ? '#ccc' : 'linear-gradient(135deg,#3B82F6,#1E40AF)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: '800',
                    fontSize: '13px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontFamily: 'inherit',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {loading && action === 'update-db' ? '⏳ Updating...' : '💾 Update DB'}
                </button>
              </div>

              <div style={{
                padding: '14px 18px',
                background: 'linear-gradient(135deg,#F0FDF4,#DCFCE7)',
                border: '2px solid #86EFAC',
                borderRadius: '10px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '12px',
              }}>
                <div>
                  <p style={{ margin: 0, fontSize: '13px', fontWeight: '800', color: '#166534' }}>
                    🚀 FULL MIGRATION (Recommended)
                  </p>
                  <p style={{ margin: '3px 0 0', fontSize: '11px', color: '#15803D' }}>
                    Runs Step 1 + Step 2 together
                  </p>
                </div>
                <button
                  onClick={() => runMigration('full')}
                  disabled={loading}
                  style={{
                    padding: '12px 26px',
                    background: loading && action === 'full' ? '#ccc' : 'linear-gradient(135deg,#10B981,#059669)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: '900',
                    fontSize: '14px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontFamily: 'inherit',
                    whiteSpace: 'nowrap',
                    boxShadow: '0 6px 20px rgba(16,185,129,0.35)',
                  }}
                >
                  {loading && action === 'full' ? '⏳ Migrating...' : '🚀 Run Full Migration'}
                </button>
              </div>
            </div>

            <button
              onClick={fetchStatus}
              disabled={loading}
              style={{
                marginTop: '14px',
                width: '100%',
                padding: '8px',
                background: '#F3F4F6',
                border: '1.5px solid #D1D5DB',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: '700',
                color: '#374151',
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              🔄 Refresh Status
            </button>
          </div>

          {results && (
            <div style={{
              background:   '#F0FDF4',
              border:       '2px solid #86EFAC',
              borderRadius: '14px',
              padding:      '20px',
            }}>
              <h3 style={{ margin: '0 0 12px', fontSize: '1rem', color: '#166534', fontWeight: '800' }}>
                ✅ Migration Results
              </h3>

              {results.copyResults && (
                <div style={{
                  padding: '12px',
                  background: 'white',
                  borderRadius: '8px',
                  marginBottom: '10px',
                }}>
                  <p style={{ margin: '0 0 8px', fontWeight: '800', fontSize: '13px', color: '#1F2937' }}>
                    📁 File Copy Results
                  </p>
                  <div style={{ fontSize: '12px', color: '#4B5563', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div>✅ Copied: <strong style={{ color: '#059669' }}>{results.copyResults.copied}</strong></div>
                    <div>⚠️ Errors: <strong style={{ color: '#DC2626' }}>{results.copyResults.errors}</strong></div>
                  </div>
                  {results.copyResults.errorList?.length > 0 && (
                    <details style={{ marginTop: '8px' }}>
                      <summary style={{ cursor: 'pointer', fontSize: '11px', color: '#DC2626', fontWeight: '700' }}>
                        Show error details ({results.copyResults.errorList.length})
                      </summary>
                      <pre style={{ fontSize: '10px', background: '#FEE2E2', padding: '8px', borderRadius: '6px', marginTop: '6px', maxHeight: '200px', overflow: 'auto' }}>
                        {JSON.stringify(results.copyResults.errorList, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              )}

              {results.dbResults && (
                <div style={{
                  padding: '12px',
                  background: 'white',
                  borderRadius: '8px',
                }}>
                  <p style={{ margin: '0 0 8px', fontWeight: '800', fontSize: '13px', color: '#1F2937' }}>
                    💾 Database Update Results
                  </p>
                  <div style={{ fontSize: '12px', color: '#4B5563', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div>📦 Products updated: <strong style={{ color: '#059669' }}>{results.dbResults.productsUpdated}</strong></div>
                    <div>🖼️ Banners updated: <strong style={{ color: '#059669' }}>{results.dbResults.bannersUpdated}</strong></div>
                    <div>🏷️ Brands updated: <strong style={{ color: '#059669' }}>{results.dbResults.brandsUpdated}</strong></div>
                    <div>⚠️ Errors: <strong style={{ color: '#DC2626' }}>{results.dbResults.errors?.length || 0}</strong></div>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}