'use client';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

export default function MigrateR2Page() {
  const [status, setStatus]     = useState(null);
  const [loading, setLoading]   = useState(false);
  const [running, setRunning]   = useState(false);
  const [progress, setProgress] = useState('');
  const [totals,   setTotals]   = useState({
    filesCopied:      0,
    fileErrors:       0,
    productsUpdated:  0,
    bannersUpdated:   0,
    brandsUpdated:    0,
  });

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

  // ✅ CHUNKED FILE COPY
  const copyFiles = async () => {
    if (!confirm('Copy files in chunks? This may take several minutes.')) return;

    setRunning(true);
    let totalCopied = 0;
    let totalErrors = 0;
    let continuationToken = null;
    let chunkNum = 0;

    try {
      while (true) {
        chunkNum++;
        setProgress(`📁 Copying chunk ${chunkNum}... (${totalCopied} files done so far)`);

        const res = await fetch('/api/migrate-r2', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({
            action: 'copy-chunk',
            continuationToken,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        totalCopied += data.copied;
        totalErrors += data.errors;

        setTotals(prev => ({
          ...prev,
          filesCopied: totalCopied,
          fileErrors:  totalErrors,
        }));

        if (!data.hasMore) break;
        continuationToken = data.nextToken;

        // Small delay to prevent overwhelming
        await new Promise(r => setTimeout(r, 500));
      }

      setProgress(`✅ File copy complete! ${totalCopied} files copied, ${totalErrors} errors.`);
      toast.success(`✅ Copied ${totalCopied} files!`);
    } catch (err) {
      setProgress(`❌ Error: ${err.message}`);
      toast.error(err.message);
    } finally {
      setRunning(false);
      await fetchStatus();
    }
  };

  // ✅ CHUNKED DB UPDATE
  const updateDatabase = async () => {
    if (!confirm('Update all database URLs? This is safe.')) return;

    setRunning(true);
    let productsUpdated = 0;
    let bannersUpdated  = 0;
    let brandsUpdated   = 0;
    let dbSkip = 0;
    let chunkNum = 0;

    try {
      // Update products in chunks
      while (true) {
        chunkNum++;
        setProgress(`📦 Updating products chunk ${chunkNum}... (${productsUpdated} updated)`);

        const res = await fetch('/api/migrate-r2', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({
            action: 'update-products-chunk',
            dbSkip,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        productsUpdated += data.updated;
        setTotals(prev => ({ ...prev, productsUpdated }));

        if (!data.hasMore) break;
        dbSkip = data.nextSkip;

        await new Promise(r => setTimeout(r, 300));
      }

      // Update banners (one shot)
      setProgress(`🖼️ Updating banners...`);
      const banRes = await fetch('/api/migrate-r2', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ action: 'update-banners' }),
      });
      const banData = await banRes.json();
      if (banRes.ok) {
        bannersUpdated = banData.updated;
        setTotals(prev => ({ ...prev, bannersUpdated }));
      }

      // Update brands (one shot)
      setProgress(`🏷️ Updating brands...`);
      const brRes = await fetch('/api/migrate-r2', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ action: 'update-brands' }),
      });
      const brData = await brRes.json();
      if (brRes.ok) {
        brandsUpdated = brData.updated;
        setTotals(prev => ({ ...prev, brandsUpdated }));
      }

      setProgress(`✅ DB update complete! Products: ${productsUpdated}, Banners: ${bannersUpdated}, Brands: ${brandsUpdated}`);
      toast.success('✅ Database updated!');
    } catch (err) {
      setProgress(`❌ Error: ${err.message}`);
      toast.error(err.message);
    } finally {
      setRunning(false);
      await fetchStatus();
    }
  };

  // ✅ FULL MIGRATION
  const runFullMigration = async () => {
    if (!confirm('Run FULL migration?\n\n1. Copy all files\n2. Update all DB URLs\n\nThis may take 10-15 minutes.')) return;
    await copyFiles();
    await new Promise(r => setTimeout(r, 1000));
    await updateDatabase();
  };

  return (
    <div style={{
      padding: '20px',
      fontFamily: 'Nunito, sans-serif',
      maxWidth: '900px',
      margin: '0 auto',
    }}>
      <h1 style={{ fontSize: '1.8rem', fontWeight: '900', color: '#2D1A4A', marginBottom: '8px' }}>
        🚀 R2 Migration
      </h1>
      <p style={{ color: '#6B7280', fontSize: '14px', marginBottom: '24px' }}>
        {status?.config?.oldPrefix} → {status?.config?.newPrefix}
      </p>

      {/* Warning */}
      <div style={{
        background: '#FEF3C7',
        border: '2px solid #FDE68A',
        borderRadius: '12px',
        padding: '14px 18px',
        marginBottom: '20px',
      }}>
        <p style={{ margin: 0, fontSize: '13px', color: '#92400E', fontWeight: '700', lineHeight: 1.6 }}>
          ⚠️ <strong>NOTES:</strong><br />
          • Migration runs in CHUNKS (200 files per request)<br />
          • DON'T close the browser tab while running<br />
          • Original files stay intact (safe)<br />
          • Refresh count may show "1000+" (means more than 1000)
        </p>
      </div>

      {/* Progress Bar */}
      {running && (
        <div style={{
          background: 'linear-gradient(135deg, #EFF6FF, #DBEAFE)',
          border: '2px solid #3B82F6',
          borderRadius: '12px',
          padding: '16px 20px',
          marginBottom: '20px',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '10px',
          }}>
            <div style={{
              width: '24px',
              height: '24px',
              border: '3px solid #3B82F6',
              borderTopColor: 'transparent',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
            }} />
            <p style={{ margin: 0, fontSize: '14px', fontWeight: '800', color: '#1E40AF' }}>
              Migration in progress...
            </p>
          </div>
          <p style={{ margin: 0, fontSize: '13px', color: '#1E3A8A', fontWeight: '600' }}>
            {progress}
          </p>
          <style>{`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      )}

      {/* Progress Totals */}
      {(totals.filesCopied > 0 || totals.productsUpdated > 0) && (
        <div style={{
          background: '#F0FDF4',
          border: '2px solid #86EFAC',
          borderRadius: '12px',
          padding: '14px 18px',
          marginBottom: '20px',
        }}>
          <p style={{ margin: '0 0 8px', fontSize: '13px', fontWeight: '800', color: '#166534' }}>
            ✅ Migration Progress
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', fontSize: '12px', color: '#166534' }}>
            <div>📁 Files copied: <strong>{totals.filesCopied}</strong></div>
            <div>⚠️ File errors: <strong>{totals.fileErrors}</strong></div>
            <div>📦 Products updated: <strong>{totals.productsUpdated}</strong></div>
            <div>🖼️ Banners updated: <strong>{totals.bannersUpdated}</strong></div>
            <div>🏷️ Brands updated: <strong>{totals.brandsUpdated}</strong></div>
          </div>
        </div>
      )}

      {/* Status */}
      {loading && !status ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{ fontSize: '2rem' }}>⏳</div>
          <p>Loading...</p>
        </div>
      ) : status ? (
        <>
          <div style={{
            background: 'white',
            border: '2px solid #EDD9FF',
            borderRadius: '14px',
            padding: '20px',
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
                <p style={{ margin: '0 0 8px', fontSize: '12px', fontWeight: '800', color: '#DC2626' }}>
                  📁 R2 FILES
                </p>
                <div style={{ fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div>{status.config.oldPrefix}/: <strong style={{ color: '#DC2626' }}>{status.r2.oldFolderFiles}</strong></div>
                  <div>{status.config.newPrefix}/: <strong style={{ color: '#059669' }}>{status.r2.newFolderFiles}</strong></div>
                </div>
              </div>

              <div style={{
                padding: '14px',
                background: '#F0FDF4',
                border: '1.5px solid #86EFAC',
                borderRadius: '10px',
              }}>
                <p style={{ margin: '0 0 8px', fontSize: '12px', fontWeight: '800', color: '#166534' }}>
                  💾 DATABASE
                </p>
                <div style={{ fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div>Products: <strong>{status.database.totalProducts}</strong></div>
                  <div>Banners: <strong>{status.database.totalBanners}</strong></div>
                  <div>Brands: <strong>{status.database.totalBrands}</strong></div>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div style={{
            background: 'white',
            border: '2px solid #EDD9FF',
            borderRadius: '14px',
            padding: '20px',
          }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '1rem', color: '#2D1A4A', fontWeight: '800' }}>
              ⚡ Actions
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                onClick={copyFiles}
                disabled={running}
                style={{
                  padding: '12px 20px',
                  background: running ? '#ccc' : 'linear-gradient(135deg,#F59E0B,#D97706)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  fontWeight: '800',
                  fontSize: '13px',
                  cursor: running ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                📁 Step 1: Copy R2 Files (Chunked)
              </button>

              <button
                onClick={updateDatabase}
                disabled={running}
                style={{
                  padding: '12px 20px',
                  background: running ? '#ccc' : 'linear-gradient(135deg,#3B82F6,#1E40AF)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  fontWeight: '800',
                  fontSize: '13px',
                  cursor: running ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                💾 Step 2: Update Database URLs
              </button>

              <button
                onClick={runFullMigration}
                disabled={running}
                style={{
                  padding: '14px 20px',
                  background: running ? '#ccc' : 'linear-gradient(135deg,#10B981,#059669)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  fontWeight: '900',
                  fontSize: '14px',
                  cursor: running ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit',
                  boxShadow: running ? 'none' : '0 6px 20px rgba(16,185,129,0.35)',
                }}
              >
                🚀 Run Full Migration
              </button>
            </div>

            <button
              onClick={fetchStatus}
              disabled={running}
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
                cursor: running ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit',
              }}
            >
              🔄 Refresh Status
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
}