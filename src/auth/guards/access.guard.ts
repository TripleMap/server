import { CanActivate, ExecutionContext, Guard, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { plainToClass } from 'class-transformer';
import { IncomingMessage } from 'http';
import { Groups } from '../../sequelize/groups.sequlize'

// import { User } from '../entities/user.entity';
// import { GroupsService } from '../services/groups.service';
import { TokenService } from '../tokens/token.service';
import { Roles } from '../../sequelize/index';

@Guard()
export class AccessGuard implements CanActivate {
    private tokenService: TokenService;
    constructor(private readonly reflector: Reflector) {
        this.tokenService = new TokenService()
    }

    canActivate(context: ExecutionContext): Promise<boolean> {
        const req = context.switchToHttp().getRequest();
        const authorizationHeader = req.headers['authorization'] ? String(req.headers['authorization']) : null;
        const roles = this.reflector.get<string[]>('roles', context.getHandler());
        return new Promise((resolve, reject) => {
            (async () => {
                if (roles && roles.length > 0 && authorizationHeader && authorizationHeader.indexOf(process.env.JWT_AUTH_HEADER_PREFIX) === 0) {
                    let token = process.env.JWT_AUTH_HEADER_PREFIX ? authorizationHeader.split(process.env.JWT_AUTH_HEADER_PREFIX)[1] : authorizationHeader;
                    token = token.trim();
                    try {
                        if (token && this.tokenService.verify(token)) req['userData'] = this.tokenService.decode(token);
                        let group = await Groups.findById(req['userData']['group_id']);
                        group = group.toJSON();
                        if (!group.access) {
                            reject(new UnauthorizedException('Группа пользователей не обслуживается'));
                        }
                    } catch (error) {
                        if (error.message === 'jwt expired') {
                            reject(new UnauthorizedException('Срок действия токена истек'));
                        } else {
                            reject(error);
                        }
                    }
                }

                const userInAvaliableRoles = roles ? roles.filter(roleName => req['userData'] && req['userData']['role'] === roleName).length > 0 : null;
                resolve(userInAvaliableRoles === true || userInAvaliableRoles === null);
            })()
        })
    }
}