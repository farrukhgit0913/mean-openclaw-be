import { Router } from 'express';
import { Customer } from '../../models/customer.model.js';

const router = Router();

router.get('/customers/count', async (_req, res) => {
  try {
    const count = await Customer.countDocuments();

    return res.json({
      success: true,
      count
    });
  } catch (error) {
    console.error('CRM customer count error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to get customer count.'
    });
  }
});

router.get('/customers/search', async (req, res) => {
  try {
    const query = String(req.query.q ?? '').trim();

    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required.'
      });
    }

    const customers = await Customer.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { phone: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } },
        { 'vehicle.make': { $regex: query, $options: 'i' } },
        { 'vehicle.model': { $regex: query, $options: 'i' } }
      ]
    })
      .limit(20)
      .lean();

    return res.json({
      success: true,
      count: customers.length,
      customers
    });
  } catch (error) {
    console.error('CRM customer search error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to search customers.'
    });
  }
});

router.get('/customers/:customerId', async (req, res) => {
  try {
    const customer = await Customer.findById(
      req.params.customerId
    ).lean();

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found.'
      });
    }

    return res.json({
      success: true,
      customer
    });
  } catch (error) {
    console.error('CRM get customer error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to get customer.'
    });
  }
});

export default router;