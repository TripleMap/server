import { Component } from "@nestjs/common";
import { Layers, Users } from '../../sequelize/index';
import * as Sequelize from 'sequelize';
import { sequelize } from '../../database/database.providers';
import * as uuid from 'uuid';

import { KnexFilterQueryBuilder } from './layers.filterQuery'

interface Event {
    id: string | undefined;
    event: string;
    event_description: string;
    feature_id: string;
    user_id: string;
    created_at: number;
}

@Component()
export class LayersEventsService {
    public KnexFilterQueryBuilder: any;
    constructor() {
        this.KnexFilterQueryBuilder = new KnexFilterQueryBuilder();
    }

    async getEvents(layerId, featureId) {
        if (!layerId) throw new Error('Не задан id слоя');
        if (!featureId) throw new Error('Не задан id объекта');
        let schema: any = await Layers.findById(layerId);
        if (!schema) throw new Error('Слой не существует');
        let eventsTableName = schema.toJSON().layer_schema.eventsTable;
        if (!eventsTableName) throw new Error('У слоя нет таблицы событий');
        let eventsTable = this.generateEventsModel(schema, eventsTableName);

        return eventsTable.findAll({
            where: {
                feature_id: featureId
            },
            include: [this.defineUserIncludes()]
        });
    }


    async getEventById(layerId, eventId) {
        try {
            if (!layerId) throw new Error('Не задан id слоя');
            let schema: any = await Layers.findById(layerId);
            if (!schema) throw new Error('Слой не существует');
            let eventsTableName = schema.toJSON().layer_schema.eventsTable;
            if (!eventsTableName) throw new Error('У слоя нет таблицы событий');
            let eventsTable = this.generateEventsModel(schema, eventsTableName);
            return eventsTable.findById(eventId, { include: [this.defineUserIncludes()] });
        } catch (error) {
            throw error;
        }
    }

    async createEvent(layerId, featureId, eventInstance: Event, userId) {
        try {
            if (!layerId) throw new Error('Не задан id слоя');
            if (!featureId) throw new Error('Не задан id объекта');
            if (!userId) throw new Error('Не задан id пользователя');
            let schema: any = await Layers.findById(layerId);
            if (!schema) throw new Error('Слой не существует');
            let eventsTableName = schema.toJSON().layer_schema.eventsTable;
            if (!eventsTableName) throw new Error('У слоя нет таблицы событий');
            let eventsTable = this.generateEventsModel(schema, eventsTableName);
            let date = new Date()
            let instance: Event = {
                id: uuid.v4(),
                event: eventInstance.event,
                event_description: eventInstance.event_description,
                created_at: date.getTime(),
                user_id: userId,
                feature_id: featureId
            };

            return eventsTable.create(instance);
        } catch (error) {
            throw error;
        }
    }

    async deleteEvent(layerId, eventId) {
        try {
            if (!layerId) throw new Error('Не задан id слоя');
            if (!eventId) throw new Error('Не задан id события');
            let schema: any = await Layers.findById(layerId);
            if (!schema) throw new Error('Слой не существует');
            let eventsTableName = schema.toJSON().layer_schema.eventsTable;
            if (!eventsTableName) throw new Error('У слоя нет таблицы событий');
            let eventsTable = this.generateEventsModel(schema, eventsTableName);
            const instance: any = await eventsTable.findById(eventId);
            if (!instance) throw new Error('События с таким id не существует');
            return await instance.destroy();
        } catch (error) {
            throw error;
        }
    }

    async updateEvent(layerId, eventId, eventInstance) {
        try {
            if (!layerId) throw new Error('Не задан id слоя');
            if (!eventId) throw new Error('Не задан id события');
            let schema: any = await Layers.findById(layerId);
            if (!schema) throw new Error('Слой не существует');
            let eventsTableName = schema.toJSON().layer_schema.eventsTable;
            if (!eventsTableName) throw new Error('У слоя нет таблицы событий');
            let eventsTable = this.generateEventsModel(schema, eventsTableName);

            let event: any = await eventsTable.findById(eventId);

            let eventHeader = eventInstance.event || eventInstance.toJSON().event || null;
            let event_description = eventInstance.event_description || eventInstance.toJSON().event_description || null;

            return await event.update({ event: eventHeader, event_description });
        } catch (error) {
            throw error;
        }
    }


    generateEventsModel(schema, eventsTableName) {
        let eventsTable = sequelize.define(eventsTableName, {
            id: {
                type: this.defineColumnDataType('char', 0, 0, 100, 0, 0),
                primaryKey: true,
                allowNull: false
            },
            feature_id: {
                type: this.defineColumnDataType('char', 0, 0, 100, 0, 0),
                allowNull: false
            },
            event: {
                type: this.defineColumnDataType('char', 0, 0, 2044, 0, 0),
                allowNull: false
            },
            event_description: {
                type: this.defineColumnDataType('text', 0, 0, 2044, 0, 0),
            },
            user_id: {
                type: this.defineColumnDataType('char', 0, 0, 100, 0, 0),
            },
            created_at: {
                type: this.defineColumnDataType('char', 0, 0, 100, 0, 0),
                allowNull: false
            },
        }, { schema: `${schema.toJSON().layer_schema.schema}`, timestamps: false });

        eventsTable.hook('beforeValidate', (instance, options) => {
            if (!instance.id) {
                let date = new Date()
                instance.id = uuid.v4();
                instance.created_at = date.getTime();
            }
        });

        eventsTable.belongsTo(Users, {
            as: `_user_id`,
            foreignKey: `user_id`
        });


        return eventsTable;
    }


    defineUserIncludes = () => ({ model: Users, as: '_user_id', attributes: ['username', 'id'] })

    defineColumnDataType = (type, precision, scale, length, geometryType, srid) => {
        let _length = length || 2044;
        let _scale = scale || 255;
        let _precision = precision || 50;
        let dataType;
        switch (type) {
            case "serial":
                dataType = Sequelize.INTEGER;
                break;
            case "char":
                dataType = Sequelize.CHAR(_length);
                break;
            case "json":
                dataType = Sequelize.JSON;
                break;
            case "text":
                dataType = Sequelize.TEXT();
                break;
            case "date":
                dataType = Sequelize.DATE;
                break;
            case "dateOnly":
                dataType = Sequelize.DATEONLY;
                break;
            case "boolean":
                dataType = Sequelize.BOOLEAN;
                break;
            case "integer":
                dataType = Sequelize.INTEGER(_scale);
                break;
            case "double":
                dataType = Sequelize["DOUBLE PRECISION"];
                break;
            case "uuid":
                dataType = Sequelize.UUIDV4;
                break;
            case "geometry":
                dataType = Sequelize.GEOMETRY(geometryType, srid);
                break;
            default:
                dataType = Sequelize.CHAR(_length);
                break;
        }
        return dataType;
    }
}