import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { UsersLayersController } from './users-layers/users-layers.controller';
import { UsersLayersService } from './users-layers/users-layers.service';

import { LayersController } from './layers/layers.controller';
import { LayersService } from './layers/layers.service';
import { LayersEventsService } from './layers/layers.events.service';
import { LayersAdditionalCharsService } from './layers/layer.additionalChars.service';
import { LayersLabelsService } from './layers/layer.lablels.service';
import { LayersStylesService } from './layers/layer.styles.service';

@Module({
    imports: [
        AuthModule
    ],
    controllers: [UsersLayersController, LayersController],
    components: [UsersLayersService, LayersService, LayersEventsService, LayersAdditionalCharsService, LayersLabelsService, LayersStylesService],
})
export class AppModule { }
