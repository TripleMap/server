import { decode, sign, verify } from 'jsonwebtoken';
import { Component } from '@nestjs/common';

@Component()
export class TokenService {
    sign(user: any) {
        return sign(
            { id: user.id, role: user.role.name, group_id: user.group.id },
            this.getSecretKey({ id: user.id, role: user.role.name, group_id: user.group.id }),
            { expiresIn: process.env.JWT_EXPIRATION_DELTA }
        );
    }
    verify(token: string) {
        const data: any = decode(token);
        return verify(token, this.getSecretKey(data));
    }
    decode(token: string) {
        return decode(token)
    }
    getSecretKey(data: any) {
        return process.env.SECRET_KEY + (data ? (`$${data.id}$${data.role}$${data.group_id}`) : '');
    }
}