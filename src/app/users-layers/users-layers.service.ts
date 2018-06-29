import { Component, Inject } from "@nestjs/common";
import { Model } from 'sequelize-typescript';
import { Layers, Users, UsersLayers } from '../../sequelize/index';




@Component()
export class UsersLayersService {

  constructor() {

  }

  async findAll() {
    try {
      return await UsersLayers.findAll({ include: [Users] });
    } catch (err) {
      throw await new Error(err);
    }
  }

  async findById(id: string) {
    try {
      return await UsersLayers.findById(id);
    } catch (err) {
      throw await new Error(err);
    }
  }
}

