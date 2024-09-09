import dotenv from "dotenv";
import { Command, Option } from "commander";
import path from "path";
import { fileURLToPath } from 'url';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const envPaths = {
    dev: path.join(__dirname, '../.env.dev'),
    prod: path.join(__dirname, '../.env.prod')
};


const programa = new Command();
programa
    .addOption(new Option("-m, --mode <modo>", "Modo de ejecución del script")
    .choices(["dev", "prod"])
    .default("dev"));

programa.parse();
const { mode } = programa.opts();


dotenv.config({
    path: envPaths[mode] || envPaths.dev, 
    override: true
});


export const config = {
    PORT: process.env.PORT || 3000,
    MONGO_URL: process.env.MONGO_URL,
    MONGO_TEST_URL: process.env.MONGO_TEST_URL,
    DB_NAME_TEST: process.env.DB_NAME_TEST,
    DB_NAME: process.env.DB_NAME,
    SECRET: process.env.SECRET,
    CLIENT_ID_GITHUB: process.env.CLIENT_ID_GITHUB,
    CLIENT_SECRET_GITHUB: process.env.CLIENT_SECRET_GITHUB,
    MODE: mode 
};
