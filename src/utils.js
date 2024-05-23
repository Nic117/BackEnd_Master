import { fileURLToPath } from 'url';
import { dirname } from 'path';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default __dirname;

const SECRET = 'codercoder123';

export const generaHash = password => crypto.createHmac('sha256', SECRET).update(password).digest('hex');

export const auth = (req, res, next) => {
    if (!req.session.user) {
        res.setHeader('Content-Type', 'application/json');
        return res.status(401).json({ error: `No existen usuarios autenticados` })
    }
    next()
}