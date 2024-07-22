import { loggerController } from '../controller/loggerController.js';
import { middLogger } from '../utils/Logger.js';
import { Router } from 'express';
export const router = Router()

router.get('/', middLogger, loggerController);