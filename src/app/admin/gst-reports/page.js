'use client';
import { useState } from 'react';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function GSTReportsPage() {
  const [startDate, setStartDate] = useState('');
  const [endDate,   setEndDate]   = useState('');
  const [report,    setReport]    = useState(null);
  const [summary,   setSummary]   = useState(null);
  const [loading,   setLoading]   = useState(false);
  const [downloading, setDownloading] = useState(false);

  const fmt = (n) => Math.round(n || 0).toLocaleString('en-IN');

  // ✅ Quick presets
  const setPreset = (type) => {
    const now = new Date();
    let s, e;

    switch (type) {
      case 'thisMonth':
        s = new Date(now.getFullYear(), now.getMonth(), 1);
        e = now;
        break;
      case 'lastMonth':
        s = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        e = new Date(now.getFullYear(), now.getMonth(), 0);
        break;
      case 'thisQuarter': {
        const qm = Math.floor(now.getMonth() / 3) * 3;
        s = new Date(now.getFullYear(), qm, 1);
        e = now;
        break;
      }
      case 'lastQuarter': {
        const qm = Math.floor(now.getMonth() / 3) * 3;
        s = new Date(now.getFullYear(), qm - 3, 1);
        e = new Date(now.getFullYear(), qm, 0);
        break;
      }
      case 'thisYear':
        s = now.getMonth() >= 3
          ? new Date(now.getFullYear(), 3, 1)
          : new Date(now.getFullYear() - 1, 3, 1);
        e = now;
        break;
      case 'lastYear': {
        const fy = now.getMonth() >= 3 ? now.getFullYear() - 1 : now.getFullYear() - 2;
        s = new Date(fy, 3, 1);
        e = new Date(fy + 1, 2, 31);
        break;
      }
      default: return;
    }

    setStartDate(s.toISOString().split('T')[0]);
    setEndDate(e.toISOString().split('T')[0]);
  };

  // ✅ Fetch report
  const fetchReport = async () => {
    if (!startDate || !endDate) {
      toast.error('Select start and end date');
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      toast.error('Start date must be before end date');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/admin/gst-report?startDate=${startDate}&endDate=${endDate}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setReport(data.report || []);
      setSummary(data.summary || null);
      toast.success(`📊 Found ${data.report?.length || 0} orders`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Download XLSX
  const downloadXLSX = async () => {
    if (!report || report.length === 0) {
      toast.error('No data to export');
      return;
    }

    setDownloading(true);
    try {
      const XLSX = (await import('xlsx')).default || await import('xlsx');

      const wb = XLSX.utils.book_new();

      // ═══ Sheet 1: Sales Register ═══
      const salesData = report.map((r, i) => ({
        'S.No':           i + 1,
        'Invoice No':     r.invoiceNo,
        'Date':           r.date,
        'Customer Name':  r.customerName,
        'Phone':          r.customerPhone,
        'City':           r.customerCity,
        'State':          r.customerState,
        'Payment':        r.paymentMethod,
        'Items':          r.items,
        'Items Price (₹)': r.itemsPrice,
        'Shipping (₹)':   r.shipping,
        'Discount (₹)':   r.discount,
        'Taxable (₹)':    r.taxableValue,
        'GST Rate (%)':   r.gstRate,
        'CGST (₹)':       r.cgst,
        'SGST (₹)':       r.sgst,
        'IGST (₹)':       r.igst,
        'Total (₹)':      r.totalAmount,
        'Transaction ID': r.transactionId,
        'Paid On':        r.paidAt,
        'Type':           r.isIntraState ? 'Intra-State' : 'Inter-State',
      }));

      // Add totals row
      salesData.push({
        'S.No':           '',
        'Invoice No':     'TOTAL',
        'Date':           '',
        'Customer Name':  `${report.length} orders`,
        'Phone':          '',
        'City':           '',
        'State':          '',
        'Payment':        '',
        'Items':          '',
        'Items Price (₹)': '',
        'Shipping (₹)':   '',
        'Discount (₹)':   '',
        'Taxable (₹)':    summary?.totalTaxable || 0,
        'GST Rate (%)':   '',
        'CGST (₹)':       summary?.totalCGST || 0,
        'SGST (₹)':       summary?.totalSGST || 0,
        'IGST (₹)':       summary?.totalIGST || 0,
        'Total (₹)':      summary?.totalAmount || 0,
        'Transaction ID': '',
        'Paid On':        '',
        'Type':           '',
      });

      const ws1 = XLSX.utils.json_to_sheet(salesData);

      // Set column widths
      ws1['!cols'] = [
        { wch: 5 }, { wch: 14 }, { wch: 12 }, { wch: 20 }, { wch: 14 },
        { wch: 12 }, { wch: 16 }, { wch: 10 }, { wch: 6 }, { wch: 12 },
        { wch: 10 }, { wch: 10 }, { wch: 12 }, { wch: 8 }, { wch: 10 },
        { wch: 10 }, { wch: 10 }, { wch: 12 }, { wch: 22 }, { wch: 12 },
        { wch: 12 },
      ];

      XLSX.utils.book_append_sheet(wb, ws1, 'Sales Register');

      // ═══ Sheet 2: Monthly Summary ═══
      const monthlyMap = {};
      report.forEach(r => {
        const key = r.date.slice(3); // MM/YYYY
        if (!monthlyMap[key]) {
          monthlyMap[key] = { month: key, orders: 0, taxable: 0, cgst: 0, sgst: 0, igst: 0, total: 0 };
        }
        monthlyMap[key].orders++;
        monthlyMap[key].taxable += r.taxableValue;
        monthlyMap[key].cgst    += r.cgst;
        monthlyMap[key].sgst    += r.sgst;
        monthlyMap[key].igst    += r.igst;
        monthlyMap[key].total   += r.totalAmount;
      });

      const monthlyData = Object.values(monthlyMap).map(m => ({
        'Month':        m.month,
        'Orders':       m.orders,
        'Taxable (₹)':  m.taxable,
        'CGST (₹)':     m.cgst,
        'SGST (₹)':     m.sgst,
        'IGST (₹)':     m.igst,
        'Total (₹)':    m.total,
      }));

      const ws2 = XLSX.utils.json_to_sheet(monthlyData);
      ws2['!cols'] = [
        { wch: 12 }, { wch: 8 }, { wch: 14 }, { wch: 12 },
        { wch: 12 }, { wch: 12 }, { wch: 14 },
      ];
      XLSX.utils.book_append_sheet(wb, ws2, 'Monthly Summary');

      // ═══ Sheet 3: State-wise Summary ═══
      const stateMap = {};
      report.forEach(r => {
        const state = r.customerState || 'Unknown';
        if (!stateMap[state]) {
          stateMap[state] = { state, orders: 0, taxable: 0, cgst: 0, sgst: 0, igst: 0, total: 0 };
        }
        stateMap[state].orders++;
        stateMap[state].taxable += r.taxableValue;
        stateMap[state].cgst    += r.cgst;
        stateMap[state].sgst    += r.sgst;
        stateMap[state].igst    += r.igst;
        stateMap[state].total   += r.totalAmount;
      });

      const stateData = Object.values(stateMap)
        .sort((a, b) => b.total - a.total)
        .map(s => ({
          'State':        s.state,
          'Orders':       s.orders,
          'Taxable (₹)':  s.taxable,
          'CGST (₹)':     s.cgst,
          'SGST (₹)':     s.sgst,
          'IGST (₹)':     s.igst,
          'Total (₹)':    s.total,
          'Type':         s.cgst > 0 ? 'Intra-State' : 'Inter-State',
        }));

      const ws3 = XLSX.utils.json_to_sheet(stateData);
      ws3['!cols'] = [
        { wch: 20 }, { wch: 8 }, { wch: 14 }, { wch: 12 },
        { wch: 12 }, { wch: 12 }, { wch: 14 }, { wch: 12 },
      ];
      XLSX.utils.book_append_sheet(wb, ws3, 'State-wise');

      // ═══ Sheet 4: Company Info ═══
      const infoData = [
        { Field: 'Company', Value: summary?.companyName || '' },
        { Field: 'GSTIN', Value: summary?.companyGSTIN || '' },
        { Field: 'State', Value: summary?.companyState || '' },
        { Field: 'Period', Value: `${startDate} to ${endDate}` },
        { Field: 'Total Orders', Value: summary?.totalOrders || 0 },
        { Field: 'GST Rate', Value: `${summary?.gstRate || 5}%` },
        { Field: 'Total Taxable', Value: summary?.totalTaxable || 0 },
        { Field: 'Total CGST', Value: summary?.totalCGST || 0 },
        { Field: 'Total SGST', Value: summary?.totalSGST || 0 },
        { Field: 'Total IGST', Value: summary?.totalIGST || 0 },
        { Field: 'Total GST', Value: summary?.totalGST || 0 },
        { Field: 'Grand Total', Value: summary?.totalAmount || 0 },
        { Field: 'Generated On', Value: new Date().toLocaleString('en-IN') },
      ];

      const ws4 = XLSX.utils.json_to_sheet(infoData);
      ws4['!cols'] = [{ wch: 16 }, { wch: 30 }];
      XLSX.utils.book_append_sheet(wb, ws4, 'Report Info');

      // ═══ Download ═══
      const fileName = `GST_Report_${startDate}_to_${endDate}.xlsx`;
      XLSX.writeFile(wb, fileName);

      toast.success(`📥 ${fileName} downloaded!`);
    } catch (err) {
      console.error('XLSX error:', err);
      toast.error('Failed to generate XLSX');
    } finally {
      setDownloading(false);
    }
  };

  const presets = [
    { label: 'This Month',    key: 'thisMonth' },
    { label: 'Last Month',    key: 'lastMonth' },
    { label: 'This Quarter',  key: 'thisQuarter' },
    { label: 'Last Quarter',  key: 'lastQuarter' },
    { label: 'This FY',       key: 'thisYear' },
    { label: 'Last FY',       key: 'lastYear' },
  ];

  return (
    <div style={{ padding: '20px', fontFamily: 'Nunito, sans-serif', maxWidth: '1200px' }}>

      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: '24px', flexWrap: 'wrap', gap: '12px',
      }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: '900', color: '#2D1A4A', margin: '0 0 4px' }}>
            📊 GST Reports
          </h1>
          <p style={{ color: '#9585B0', margin: 0, fontSize: '0.88rem' }}>
            Generate GST-compliant sales reports for filing
          </p>
        </div>
      </div>

      {/* Date Selection */}
      <div style={{
        background: 'white', borderRadius: '16px', padding: '24px',
        border: '2px solid #EDD9FF', marginBottom: '20px',
      }}>
        <h3 style={{ margin: '0 0 16px', fontSize: '1rem', fontWeight: '800', color: '#2D1A4A' }}>
          📅 Select Period
        </h3>

        {/* Quick Presets */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
          {presets.map(p => (
            <button
              key={p.key}
              onClick={() => setPreset(p.key)}
              style={{
                padding: '8px 16px',
                background: 'linear-gradient(135deg, #F0F9FF, #E0F2FE)',
                border: '1.5px solid #BAE6FD',
                borderRadius: '8px',
                fontSize: '0.82rem',
                fontWeight: '700',
                color: '#0369A1',
                cursor: 'pointer',
                fontFamily: 'inherit',
                transition: 'all 0.2s',
              }}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Date Inputs */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '12px', alignItems: 'end' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '800', color: '#6B7280', marginBottom: '6px', textTransform: 'uppercase' }}>
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              style={{
                width: '100%', padding: '10px 12px',
                border: '2px solid #EDD9FF', borderRadius: '10px',
                fontSize: '0.88rem', fontFamily: 'inherit',
                fontWeight: '700', color: '#2D1A4A', outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '800', color: '#6B7280', marginBottom: '6px', textTransform: 'uppercase' }}>
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              style={{
                width: '100%', padding: '10px 12px',
                border: '2px solid #EDD9FF', borderRadius: '10px',
                fontSize: '0.88rem', fontFamily: 'inherit',
                fontWeight: '700', color: '#2D1A4A', outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>
          <button
            onClick={fetchReport}
            disabled={loading}
            style={{
              padding: '10px 24px',
              background: loading ? '#ccc' : 'linear-gradient(135deg, #FF6B35, #7B2FBE)',
              color: 'white', border: 'none', borderRadius: '10px',
              fontSize: '0.88rem', fontWeight: '800',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit',
              whiteSpace: 'nowrap',
            }}
          >
            {loading ? '⏳ Loading...' : '📊 Generate Report'}
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '12px', marginBottom: '20px',
        }}>
          {[
            { label: 'Total Orders', value: summary.totalOrders, icon: '🛍️', color: '#7B2FBE' },
            { label: 'Taxable Value', value: `₹${fmt(summary.totalTaxable)}`, icon: '📋', color: '#0369A1' },
            { label: 'CGST', value: `₹${fmt(summary.totalCGST)}`, icon: '🏛️', color: '#10B981' },
            { label: 'SGST', value: `₹${fmt(summary.totalSGST)}`, icon: '🏛️', color: '#F59E0B' },
            { label: 'IGST', value: `₹${fmt(summary.totalIGST)}`, icon: '🌐', color: '#EF4444' },
            { label: 'Total Amount', value: `₹${fmt(summary.totalAmount)}`, icon: '💰', color: '#FF6B35' },
          ].map((card, i) => (
            <div key={i} style={{
              background: 'white', borderRadius: '14px', padding: '16px',
              border: '2px solid #EDD9FF', textAlign: 'center',
            }}>
              <div style={{ fontSize: '1.4rem', marginBottom: '6px' }}>{card.icon}</div>
              <div style={{ fontSize: '0.70rem', fontWeight: '800', color: '#6B7280', textTransform: 'uppercase', marginBottom: '4px' }}>
                {card.label}
              </div>
              <div style={{ fontSize: '1.2rem', fontWeight: '900', color: card.color }}>
                {card.value}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Download Button */}
      {report && report.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <button
            onClick={downloadXLSX}
            disabled={downloading}
            style={{
              padding: '14px 32px',
              background: downloading ? '#ccc' : 'linear-gradient(135deg, #10B981, #059669)',
              color: 'white', border: 'none', borderRadius: '12px',
              fontSize: '0.95rem', fontWeight: '900',
              cursor: downloading ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit',
              boxShadow: downloading ? 'none' : '0 6px 18px rgba(16,185,129,0.30)',
              display: 'inline-flex', alignItems: 'center', gap: '8px',
            }}
          >
            {downloading ? '⏳ Generating...' : '📥 Download XLSX Report'}
          </button>
        </div>
      )}

      {/* Preview Table */}
      {report && report.length > 0 && (
        <div style={{
          background: 'white', borderRadius: '16px',
          border: '2px solid #EDD9FF', overflow: 'hidden',
        }}>
          <div style={{
            padding: '14px 20px', background: 'linear-gradient(135deg, #FFF5EE, #F5EDFF)',
            borderBottom: '2px solid #EDD9FF',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '800', color: '#2D1A4A' }}>
              📋 Sales Register Preview ({report.length} orders)
            </h3>
            <span style={{ fontSize: '0.76rem', color: '#6B7280', fontWeight: '700' }}>
              {startDate} to {endDate}
            </span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{
              width: '100%', borderCollapse: 'collapse',
              fontSize: '0.80rem', fontFamily: 'Nunito, sans-serif',
            }}>
              <thead>
                <tr style={{ background: '#F8F4FF' }}>
                  {['#', 'Invoice', 'Date', 'Customer', 'State', 'Taxable', 'CGST', 'SGST', 'IGST', 'Total', 'Payment'].map(h => (
                    <th key={h} style={{
                      padding: '10px 12px', textAlign: 'left',
                      fontWeight: '800', color: '#6B4E8A',
                      borderBottom: '2px solid #EDD9FF',
                      whiteSpace: 'nowrap',
                      fontSize: '0.72rem', textTransform: 'uppercase',
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {report.slice(0, 50).map((r, i) => (
                  <tr key={i} style={{
                    borderBottom: '1px solid #F3E8FF',
                    background: i % 2 === 0 ? 'white' : '#FDFBFF',
                  }}>
                    <td style={{ padding: '8px 12px', color: '#6B7280' }}>{i + 1}</td>
                    <td style={{ padding: '8px 12px', fontWeight: '700', fontFamily: 'monospace', color: '#7B2FBE' }}>{r.invoiceNo}</td>
                    <td style={{ padding: '8px 12px', whiteSpace: 'nowrap' }}>{r.date}</td>
                    <td style={{ padding: '8px 12px', fontWeight: '700' }}>{r.customerName}</td>
                    <td style={{ padding: '8px 12px', fontSize: '0.74rem' }}>{r.customerState}</td>
                    <td style={{ padding: '8px 12px', fontWeight: '700' }}>₹{fmt(r.taxableValue)}</td>
                    <td style={{ padding: '8px 12px', color: '#10B981', fontWeight: '700' }}>₹{fmt(r.cgst)}</td>
                    <td style={{ padding: '8px 12px', color: '#F59E0B', fontWeight: '700' }}>₹{fmt(r.sgst)}</td>
                    <td style={{ padding: '8px 12px', color: '#EF4444', fontWeight: '700' }}>₹{fmt(r.igst)}</td>
                    <td style={{ padding: '8px 12px', fontWeight: '800', color: '#FF6B35' }}>₹{fmt(r.totalAmount)}</td>
                    <td style={{ padding: '8px 12px', fontSize: '0.74rem' }}>{r.paymentMethod}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ background: '#F0FDF4', fontWeight: '800' }}>
                  <td colSpan={5} style={{ padding: '10px 12px', color: '#065F46' }}>TOTAL ({report.length} orders)</td>
                  <td style={{ padding: '10px 12px', color: '#065F46' }}>₹{fmt(summary?.totalTaxable)}</td>
                  <td style={{ padding: '10px 12px', color: '#10B981' }}>₹{fmt(summary?.totalCGST)}</td>
                  <td style={{ padding: '10px 12px', color: '#F59E0B' }}>₹{fmt(summary?.totalSGST)}</td>
                  <td style={{ padding: '10px 12px', color: '#EF4444' }}>₹{fmt(summary?.totalIGST)}</td>
                  <td style={{ padding: '10px 12px', color: '#FF6B35' }}>₹{fmt(summary?.totalAmount)}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>

          {report.length > 50 && (
            <div style={{
              padding: '12px 20px', textAlign: 'center',
              color: '#6B7280', fontSize: '0.82rem', fontWeight: '700',
              borderTop: '1px solid #EDD9FF',
            }}>
              Showing 50 of {report.length} orders. Download XLSX for full report.
            </div>
          )}
        </div>
      )}

      {/* No data */}
      {report && report.length === 0 && (
        <div style={{
          textAlign: 'center', padding: '60px 20px',
          background: 'white', borderRadius: '16px',
          border: '2px solid #EDD9FF',
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '12px' }}>📭</div>
          <h3 style={{ margin: '0 0 8px', color: '#2D1A4A', fontWeight: '800' }}>No orders found</h3>
          <p style={{ color: '#6B7280', margin: 0 }}>
            No paid orders in the selected date range
          </p>
        </div>
      )}
    </div>
  );
}