import { fileURLToPath } from "url";
import { dirname } from "path";
import bcrypt from "bcrypt"
import { config } from "../config/config.js";

const __filename = fileURLToPath(import.meta.url);
const parentDirname = dirname(__filename);
const __dirname = dirname(parentDirname);

export default __dirname;
export const SECRET = config.SECRET

export const generaHash = password => bcrypt.hashSync(password, bcrypt.genSaltSync(10))

export const validaPassword = (password, passwordHash) => bcrypt.compareSync(password, passwordHash)