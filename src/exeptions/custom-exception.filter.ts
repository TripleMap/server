import { ExceptionFilter, Catch, HttpStatus, UnauthorizedException, HttpException, ArgumentsHost } from '@nestjs/common';
import { CustomError } from './custom.error';
import { CustomValidationError } from './custom-validation.error'

import * as Sequelize from 'sequelize';

@Catch(SyntaxError, CustomError, Error)
export class CustomExceptionFilter implements ExceptionFilter {
    catch(exception: HttpException, host: ArgumentsHost) {
        console.log(exception);
        const response = host.switchToHttp().getResponse();
        if (exception instanceof CustomValidationError) {
            response.code(HttpStatus.BAD_REQUEST).send(exception.error);
            return;
        }
        if (exception instanceof CustomError) {
            response.code(HttpStatus.BAD_REQUEST).send({
                message: exception.message
            });
            return;
        }
        if (exception instanceof UnauthorizedException) {
            response.code(HttpStatus.UNAUTHORIZED).send({
                error: exception.message
            });
            return;
        }

        if (exception instanceof SyntaxError || exception instanceof Error) {
            if (exception instanceof Sequelize.ValidationError) {
                response.code(HttpStatus.BAD_REQUEST).send(exception);
            } else {

                response.code(HttpStatus.BAD_REQUEST).send({
                    message: (exception as any).message ? (exception as any).message : String(exception)
                });
            }
            return;
        }
    }
}