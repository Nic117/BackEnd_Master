import { fileURLToPath } from "url";
import { dirname } from "path";
import bcrypt from "bcrypt";
import { config } from "../config/config.js";

const __filename = fileURLToPath(import.meta.url);
const parentDirname = dirname(__filename);
const __dirname = dirname(parentDirname);

export default __dirname;
export const SECRET = config.SECRET;

export const generaHash = async (password) => {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
};

export const validaPassword = async (password, passwordHash) => {
    return await bcrypt.compare(password, passwordHash);
};