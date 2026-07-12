import { Router } from 'express';
import { asyncHandler } from '../../util/asyncHandler.util.js';
import { handleIncoming } from '../../services/whatsapp/whatsapp.service.js';
import { getWhatsappStatus } from '../../controler/v2/whatsapp.controller.js';

const router = Router();

router.post('/webhook', asyncHandler(handleIncoming));
router.get('/status', asyncHandler(getWhatsappStatus));

export default router;
