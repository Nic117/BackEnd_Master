import dotenv from "dotenv";
import { Command, Option } from "commander";
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define las rutas para los archivos .env
const devPath = path.join(__dirname, '../.env.dev');
const prodPath = path.join(__dirname, '../.env.prod');

// Configura el comando para elegir el modo
const programa = new Command();
programa.addOption(new Option("-m, --mode <modo>", "Modo de ejecución del script").choices(["dev", "prod"]).default("dev"));
programa.parse();

const { mode } = programa.opts();

// Carga el archivo .env basado en el modo seleccionado
dotenv.config({
    path: mode === "prod" ? prodPath : devPath,
    override: true
});

// Exporta la configuración de variables de entorno
export const config = {
    PORT: process.env.PORT || 3000,
    MONGO_URL: process.env.MONGO_URL,
    DB_NAME: process.env.DB_NAME,
    SECRET: process.env.SECRET,
    CLIENT_ID_GITHUB: process.env.CLIENT_ID_GITHUB,
    CLIENT_SECRET_GITHUB: process.env.CLIENT_SECRET_GITHUB
};
