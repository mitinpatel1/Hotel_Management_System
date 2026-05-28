import React, { useState, useEffect } from 'react';
import api from '../utils/api.js';
import { useApp } from '../contexts/AppContext.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { Printer, Plus, CreditCard, Receipt, AlertCircle, ShoppingCart } from 'lucide-react';

const Billing = ({ selectedBooking, setSelectedBooking }) => {
  const { showNotification } = useApp();
  const { user } = useAuth();

  const [activeBookings, setActiveBookings] = useState([]);
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(false);

  // Form states for adding items
  const [description, setDescription] = useState('');
  const [unitPrice, setUnitPrice] = useState('');
  const [quantity, setQuantity] = useState('1');

  // Payment states
  const [paymentMethod, setPaymentMethod] = useState('Cash');

  useEffect(() => {
    fetchActiveBookings();
  }, []);

  useEffect(() => {
    if (selectedBooking) {
      fetchInvoice(selectedBooking.id);
    } else {
      setInvoice(null);
    }
  }, [selectedBooking]);

  const fetchActiveBookings = async () => {
    try {
      const data = await api('/bookings');
      // Show bookings that are checked in or checked out, excluding cancelled
      const active = data.filter(b => b.status !== 'Cancelled');
      setActiveBookings(active);
    } catch (err) {
      console.error('Error fetching bookings:', err);
    }
  };

  const fetchInvoice = async (bookingId) => {
    try {
      setLoading(true);
      const data = await api(`/billing/booking/${bookingId}`);
      setInvoice(data);
    } catch (err) {
      console.error('Error fetching invoice:', err);
      setInvoice(null);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!description || !unitPrice || !selectedBooking) return;

    try {
      const res = await api(`/billing/booking/${selectedBooking.id}/items`, {
        method: 'POST',
        body: JSON.stringify({
          description,
          quantity: parseInt(quantity),
          unit_price: parseFloat(unitPrice)
        })
      });
      showNotification('Service charge added to invoice.');
      setDescription('');
      setUnitPrice('');
      setQuantity('1');
      fetchInvoice(selectedBooking.id);
    } catch (err) {
      showNotification(err.message || 'Failed to add charge.', 'error');
    }
  };

  const handlePayInvoice = async () => {
    if (!selectedBooking) return;
    if (!window.confirm(`Process full payment of $${invoice.total.toFixed(2)} via ${paymentMethod}?`)) return;

    try {
      await api(`/billing/booking/${selectedBooking.id}/pay`, {
        method: 'POST',
        body: JSON.stringify({ payment_method: paymentMethod })
      });
      showNotification('Invoice payment processed and settled.');
      fetchInvoice(selectedBooking.id);
    } catch (err) {
      showNotification(err.message || 'Payment processing failed.', 'error');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div>
      {/* Selection bar if no booking selected */}
      <div className="filter-bar" style={{ marginBottom: '2rem' }}>
        <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>Select Invoice for Stay:</span>
        <select
          className="filter-select"
          value={selectedBooking?.id || ''}
          onChange={(e) => {
            const id = e.target.value;
            if (!id) {
              setSelectedBooking(null);
            } else {
              const booking = activeBookings.find(b => b.id.toString() === id);
              setSelectedBooking(booking);
            }
          }}
          style={{ minWidth: '300px' }}
        >
          <option value="">-- Choose Booking --</option>
          {activeBookings.map(b => (
            <option key={b.id} value={b.id}>
              {b.guest_name} &mdash; Room {b.room_number} ({b.status})
            </option>
          ))}
        </select>

        {selectedBooking && (
          <button className="btn btn-secondary" onClick={handlePrint} style={{ marginLeft: 'auto' }}>
            <Printer size={16} /> Print Invoice
          </button>
        )}
      </div>

      {!selectedBooking ? (
        <div style={{ textAlign: 'center', padding: '5rem', background: 'var(--bg-secondary)', border: '1px dashed var(--border-color)', borderRadius: 'var(--border-radius)', color: 'var(--text-secondary)' }}>
          <Receipt size={48} style={{ color: 'var(--text-muted)', marginBottom: '1.25rem' }} />
          <h3>No Booking Selected</h3>
          <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>Select a reservation from the dropdown above to view, append, or print billing invoices.</p>
        </div>
      ) : loading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>Loading invoice data...</div>
      ) : !invoice ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#ef4444' }}>
          <AlertCircle size={32} style={{ marginBottom: '1rem' }} />
          <h3>Error Loading Invoice</h3>
          <p>This reservation might not have an invoice generated. Please contact support.</p>
        </div>
      ) : (
        <div className="billing-container">
          {/* Printable Invoice Sheet */}
          <div className="invoice-sheet">
            <div className="invoice-header">
              <div className="invoice-brand">
                <h2>Grand Horizon</h2>
                <p>100 Seaside Promenade, Horizon View</p>
                <p>Tel: +1 (555) 019-9000 | billing@grandhorizon.com</p>
              </div>
              <div className="invoice-meta">
                <h3>INVOICE</h3>
                <p><strong>Invoice No:</strong> #GH-{invoice.id + 1000}</p>
                <p><strong>Date:</strong> {new Date(invoice.created_at).toLocaleDateString()}</p>
                <p>
                  <strong>Status: </strong> 
                  <span style={{ 
                    fontWeight: 'bold', 
                    color: invoice.payment_status === 'Paid' ? 'var(--status-available)' : 'var(--status-dirty)'
                  }}>
                    {invoice.payment_status}
                  </span>
                </p>
              </div>
            </div>

            <div className="invoice-details-grid">
              <div className="details-block">
                <h4>Bill To:</h4>
                <p><strong>{selectedBooking.guest_name}</strong></p>
                <p>Phone: {selectedBooking.guest_phone}</p>
                {selectedBooking.guest_email && <p>Email: {selectedBooking.guest_email}</p>}
              </div>
              <div className="details-block">
                <h4>Reservation Details:</h4>
                <p><strong>Room {selectedBooking.room_number}</strong> ({selectedBooking.room_type})</p>
                <p>Check-in: {selectedBooking.check_in_date}</p>
                <p>Check-out: {selectedBooking.check_out_date}</p>
                <p>Room Rate: ${selectedBooking.room_rate}/night</p>
              </div>
            </div>

            <table className="invoice-table">
              <thead>
                <tr>
                  <th style={{ width: '60%' }}>Description</th>
                  <th style={{ textAlign: 'center', width: '10%' }}>Qty</th>
                  <th style={{ textAlign: 'right', width: '15%' }}>Unit Price</th>
                  <th style={{ textAlign: 'right', width: '15%' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items?.map(item => (
                  <tr key={item.id}>
                    <td>{item.description}</td>
                    <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                    <td style={{ textAlign: 'right' }}>${item.unit_price.toFixed(2)}</td>
                    <td style={{ textAlign: 'right' }}>${item.amount.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="invoice-summary">
              <div className="invoice-totals">
                <div className="total-line">
                  <span>Subtotal:</span>
                  <span>${invoice.subtotal.toFixed(2)}</span>
                </div>
                <div className="total-line">
                  <span>Tax (10%):</span>
                  <span>${invoice.tax.toFixed(2)}</span>
                </div>
                {selectedBooking.deposit > 0 && (
                  <div className="total-line" style={{ color: 'var(--status-available)' }}>
                    <span>Deposit Paid:</span>
                    <span>-${selectedBooking.deposit.toFixed(2)}</span>
                  </div>
                )}
                <div className="total-line grand">
                  <span>Total Due:</span>
                  <span>${(invoice.total - (selectedBooking.deposit || 0)).toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="invoice-footer">
              <p>Thank you for staying at Grand Horizon Resort & Spa!</p>
              <p>We look forward to welcoming you back soon.</p>
            </div>
          </div>

          {/* Action sidebar cards */}
          <div className="billing-actions-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* Payment form if Unpaid */}
            {invoice.payment_status !== 'Paid' && user.role !== 'housekeeper' && (
              <div className="dashboard-card" style={{ padding: '1.5rem' }}>
                <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                  <CreditCard size={18} color="var(--accent-gold)" /> Process Payment
                </h3>
                
                <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                  <label>Select Payment Method</label>
                  <select
                    className="form-control"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  >
                    <option value="Cash">Cash</option>
                    <option value="Credit Card">Credit Card</option>
                    <option value="Debit Card">Debit Card</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                  </select>
                </div>

                <div style={{ padding: '1rem', background: 'var(--bg-primary)', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    <span>Subtotal:</span>
                    <span>${invoice.subtotal.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                    <span>Tax:</span>
                    <span>${invoice.tax.toFixed(2)}</span>
                  </div>
                  {selectedBooking.deposit > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--status-available)', marginTop: '0.25rem' }}>
                      <span>Deposit:</span>
                      <span>-${selectedBooking.deposit.toFixed(2)}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1rem', marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border-color)' }}>
                    <span>Total Due:</span>
                    <span>${(invoice.total - (selectedBooking.deposit || 0)).toFixed(2)}</span>
                  </div>
                </div>

                <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={handlePayInvoice}>
                  <CreditCard size={16} /> Process & Settle
                </button>
              </div>
            )}

            {invoice.payment_status === 'Paid' && (
              <div className="dashboard-card" style={{ padding: '1.5rem', border: '1px solid var(--status-available-bg)' }}>
                <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--status-available)', marginBottom: '0.5rem' }}>
                  Setted Invoice
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  This invoice is fully settled using <strong>{invoice.payment_method}</strong>. No further balances are outstanding on this stay.
                </p>
              </div>
            )}

            {/* POS Extra Charges Add Form */}
            {invoice.payment_status !== 'Paid' && user.role !== 'housekeeper' && (
              <div className="dashboard-card" style={{ padding: '1.5rem' }}>
                <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                  <ShoppingCart size={18} color="var(--accent-gold)" /> Post Room Charge (POS)
                </h3>
                
                <form onSubmit={handleAddItem}>
                  <div className="form-group">
                    <label>Charge Description</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Minibar - Sparkling Water"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Price ($)</label>
                      <input
                        type="number"
                        className="form-control"
                        placeholder="0.00"
                        value={unitPrice}
                        onChange={(e) => setUnitPrice(e.target.value)}
                        step="0.01"
                        min="0.01"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Quantity</label>
                      <input
                        type="number"
                        className="form-control"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        min="1"
                        required
                      />
                    </div>
                  </div>

                  <button type="submit" className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem' }}>
                    <Plus size={14} /> Add Extra Charge
                  </button>
                </form>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
};

export default Billing;
