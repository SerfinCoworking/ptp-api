import express from 'express';
import morgan from 'morgan';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import { errorHandler } from "./middlewares/error.middleware";
import { notFoundHandler } from "./middlewares/notFound.middleware";
import { job } from "./utils/crons/employeeStatus";
import * as db from './database/dbconfig';
// config
import { env } from './config/config';
import routes from './routes/routes';
import { ServerSocket } from './sockets/serverSocket';

class Server {

    protected app: express.Application;

    constructor() {
        this.app = express();
        this.config();
        this.start();
    }

    config() {
        this.app.set('port', process.env.PORT || 4000);
        // logger
        this.app.use(morgan('dev'));
        // security
        this.app.use(helmet());
        // request compression
        this.app.use(compression());
        this.app.use(cors());
        // middleware
        this.app.use(express.json());
        this.app.use(express.urlencoded({extended: false}));
        // routes
        this.routes();
        this.app.use(errorHandler);
        this.app.use(notFoundHandler);
    }

    routes() {
        this.app.use(`${(process.env.API_URI_PRFIX || env.API_URI_PREFIX)}`, routes);
    }

    async start() {

        const serve = this.app.listen(this.app.get('port'), async () => {
            await db.initializeMongo();
            job.start();
            console.log(`Server on port ${this.app.get('port')}`);
        });
        // Socket.IO connection
        const socket = new ServerSocket(serve);
        socket.connect();
    }
}

new Server();
