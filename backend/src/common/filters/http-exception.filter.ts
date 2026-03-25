import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
    Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * Filtre global pour gérer toutes les exceptions.
 * Ne jamais exposer les erreurs internes au client.
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(GlobalExceptionFilter.name);

    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        let status = HttpStatus.INTERNAL_SERVER_ERROR;
        let message = 'Une erreur interne est survenue. Veuillez réessayer plus tard.';
        let error = 'Internal Server Error';

        if (exception instanceof HttpException) {
            status = exception.getStatus();
            const exceptionResponse = exception.getResponse();

            if (typeof exceptionResponse === 'string') {
                message = exceptionResponse;
            } else if (typeof exceptionResponse === 'object') {
                const responseObj = exceptionResponse as any;
                message = responseObj.message || message;
                error = responseObj.error || exception.name;
            }
        } else if (exception instanceof Error) {
            this.logger.error(
                `Unhandled exception: ${exception.message}`,
                exception.stack,
            );
            message = 'Une erreur inattendue est survenue.';
            error = exception.name;
        }

        // Log pour le debugging (côté serveur)
        this.logger.warn(
            `${request.method} ${request.url} - ${status} - ${message}`,
        );

        response.status(status).json({
            statusCode: status,
            error,
            message,
            timestamp: new Date().toISOString(),
            path: request.url,
        });
    }
}
