import Invoice from '../models/Invoice.js';

export const getInvoiceByBookingId = async (req, res) => {
  try {
    const invoice = await Invoice.findOne({ booking_id: req.params.bookingId });
    if (!invoice) return res.status(404).json({ message: 'Invoice not found for this booking.' });

    res.json(invoice);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving invoice details.' });
  }
};

export const addInvoiceItem = async (req, res) => {
  const { description, quantity = 1, unit_price } = req.body;

  if (!description || !unit_price) {
    return res.status(400).json({ message: 'Description and unit price are required.' });
  }

  try {
    const invoice = await Invoice.findOne({ booking_id: req.params.bookingId });
    if (!invoice) return res.status(404).json({ message: 'Invoice not found.' });

    const amount = parseFloat(unit_price) * parseInt(quantity);
    invoice.items.push({ description, quantity, unit_price: parseFloat(unit_price), amount });

    const subtotal = invoice.items.reduce((sum, item) => sum + item.amount, 0);
    const tax = parseFloat((subtotal * 0.10).toFixed(2));
    const total = subtotal + tax;

    invoice.subtotal = subtotal;
    invoice.tax = tax;
    invoice.total = total;
    await invoice.save();

    res.json({ message: 'Item added and invoice totals updated.', subtotal, tax, total });
  } catch (error) {
    res.status(500).json({ message: 'Error adding charge to invoice.' });
  }
};

export const processPayment = async (req, res) => {
  const { payment_method } = req.body;

  if (!payment_method) {
    return res.status(400).json({ message: 'Payment method is required.' });
  }

  try {
    const invoice = await Invoice.findOne({ booking_id: req.params.bookingId });
    if (!invoice) return res.status(404).json({ message: 'Invoice not found.' });

    invoice.payment_status = 'Paid';
    invoice.payment_method = payment_method;
    await invoice.save();

    res.json({ message: 'Payment completed successfully. Invoice marked as Paid.' });
  } catch (error) {
    res.status(500).json({ message: 'Error processing invoice payment.' });
  }
};
