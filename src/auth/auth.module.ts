import { Module } from '@nestjs/common';
import { DataBaseModule } from '../database/database.module';

import { UsersController } from './users/users.controller';
import { UsersService } from './users/users.service';

import { TokenService } from './tokens/token.service'
@Module({
    modules: [DataBaseModule],
    controllers: [UsersController],
    components: [UsersService, TokenService],
})
export class AuthModule { }