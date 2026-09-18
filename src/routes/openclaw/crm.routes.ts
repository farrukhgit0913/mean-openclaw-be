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

export default router;
