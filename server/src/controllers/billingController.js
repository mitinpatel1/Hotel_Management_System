import { dbGet, dbRun, dbAll } from '../config/database.js';

export const getInvoiceByBookingId = async (req, res) => {
  const { bookingId } = req.params;

  try {
    const invoice = await dbGet('SELECT * FROM invoices WHERE booking_id = ?', [bookingId]);
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found for this booking.' });
    }

    const items = await dbAll('SELECT * FROM invoice_items WHERE invoice_id = ?', [invoice.id]);
    res.json({ ...invoice, items });
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving invoice details.' });
  }
};

export const addInvoiceItem = async (req, res) => {
  const { bookingId } = req.params;
  const { description, quantity = 1, unit_price } = req.body;

  if (!description || !unit_price) {
    return res.status(400).json({ message: 'Description and unit price are required.' });
  }

  try {
    const invoice = await dbGet('SELECT * FROM invoices WHERE booking_id = ?', [bookingId]);
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found.' });
    }

    const amount = parseFloat(unit_price) * parseInt(quantity);
    
    // Add item
    await dbRun(
      'INSERT INTO invoice_items (invoice_id, description, quantity, unit_price, amount) VALUES (?, ?, ?, ?, ?)',
      [invoice.id, description, quantity, unit_price, amount]
    );

    // Re-calculate totals
    const allItems = await dbAll('SELECT amount FROM invoice_items WHERE invoice_id = ?', [invoice.id]);
    const subtotal = allItems.reduce((sum, item) => sum + item.amount, 0);
    const tax = parseFloat((subtotal * 0.10).toFixed(2)); // 10% tax
    const total = subtotal + tax; // subtotal - discount can be added if needed, let's keep it simple

    await dbRun(
      'UPDATE invoices SET subtotal = ?, tax = ?, total = ? WHERE id = ?',
      [subtotal, tax, total, invoice.id]
    );

    res.json({
      message: 'Item added and invoice totals updated.',
      subtotal,
      tax,
      total
    });
  } catch (error) {
    res.status(500).json({ message: 'Error adding charge to invoice.' });
  }
};

export const processPayment = async (req, res) => {
  const { bookingId } = req.params;
  const { payment_method, amount_paid } = req.body; // In this version, we can pay in full

  if (!payment_method) {
    return res.status(400).json({ message: 'Payment method is required.' });
  }

  try {
    const invoice = await dbGet('SELECT * FROM invoices WHERE booking_id = ?', [bookingId]);
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found.' });
    }

    await dbRun(
      "UPDATE invoices SET payment_status = 'Paid', payment_method = ? WHERE id = ?",
      [payment_method, invoice.id]
    );

    res.json({ message: 'Payment completed successfully. Invoice marked as Paid.' });
  } catch (error) {
    res.status(500).json({ message: 'Error processing invoice payment.' });
  }
};
