import dotenv from 'dotenv';
import { Command, Option } from 'commander';
import path from 'path';
import { fileURLToPath } from 'url';

// Determina __filename y __dirname usando import.meta.url
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define las rutas a los archivos .env
const devPath = path.join(__dirname, '../.env.dev');
const prodPath = path.join(__dirname, '../.env.prod');

console.log("Development Path:", devPath);
console.log("Production Path:", prodPath);

// Configura el comando para aceptar una opción de modo
let programa = new Command();
programa.addOption(new Option("-m, --mode <modo>", "Modo de ejecución del script").choices(["dev", "prod"]).default("dev"));
programa.parse();

const argumentos = programa.opts();
const mode = argumentos.mode;

console.log("Running in mode:", mode);

// Carga las variables de entorno del archivo adecuado
dotenv.config({
    path: mode === "prod" ? prodPath : devPath,
    override: true
});

// Imprime las variables de entorno cargadas
// console.log("PORT:", process.env.PORT);
// console.log("MONGO_URL:", process.env.MONGO_URL);
// console.log("DB_NAME:", process.env.DB_NAME);
// console.log("SECRET:", process.env.SECRET);
// console.log("CLIENT_ID_GITHUB:", process.env.CLIENT_ID_GITHUB);
// console.log("CLIENT_SECRET_GITHUB:", process.env.CLIENT_SECRET_GITHUB);

// Exporta la configuración para ser utilizada en otros módulos
export const config = {
    PORT: process.env.PORT || 3000,
    MONGO_URL: process.env.MONGO_URL,
    DB_NAME: process.env.DB_NAME,
    SECRET: process.env.SECRET,
    CLIENT_ID_GITHUB: process.env.CLIENT_ID_GITHUB,
    CLIENT_SECRET_GITHUB: process.env.CLIENT_SECRET_GITHUB
};
