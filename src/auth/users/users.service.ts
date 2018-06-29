import { Component, UnauthorizedException, BadRequestException } from "@nestjs/common";
import { Layers, Users, Roles, Groups } from '../../sequelize/index';
import { TokenService } from '../tokens/token.service';
import * as bcrypt from 'bcrypt';

@Component()
export class UsersService {

  constructor(private readonly tokenService: TokenService) { }
  // GET
  async findAll() {
    try {
      let users: any = await Users.findAll({ include: [Roles] });
      return users.map(user => {
        let jsonInstance = user.toJSON();
        delete jsonInstance.password;
        return jsonInstance;
      });
    } catch (error) {
      throw error;
    }
  }

  async findById(id: string) {
    try {
      let user: any = await Users.findById(id);
      let jsonInstance = user.toJSON();
      delete jsonInstance.password;
      return jsonInstance;
    } catch (error) {
      throw error;
    }
  }

  async findWithWhere(whereObj) {
    try {
      let users: any = await Users.find(whereObj);
      return users.map(user => {
        let jsonInstance = user.toJSON();
        delete jsonInstance.password;
        return jsonInstance;
      });
    } catch (error) {
      throw error;
    }
  }

  // POST 
  async createOne(instance) {
    try {
      let user: any = await Users.create(instance);
      let jsonInstance = user.toJSON();
      delete jsonInstance.password;
      return jsonInstance;
    } catch (error) {
      throw error;
    }
  }

  async createMany(instances) {
    try {
      let createResult: any = await Users.bulkCreate(instances);
      return createResult.map(user => {
        let jsonInstance = user.toJSON();
        delete jsonInstance.password;
        return jsonInstance;
      });
    } catch (error) {
      throw error;
    }
  }


  // PUT
  async updateById(id: string, data) {
    try {
      const instance: any = await Users.findById(id);
      const updateResult: any = await instance.update(data);
      let jsonInstance = updateResult.toJSON();
      delete jsonInstance.password;
      return jsonInstance;
    } catch (error) {
      throw error;
    }
  }

  async updateWithWhere(whereObj, data) {
    try {
      const instance: any = await Users.findOne({ where: whereObj });
      const updateResult: any = await instance.update(data);
      let jsonInstance = updateResult.toJSON();
      delete jsonInstance.password;
      return jsonInstance;
    } catch (error) {
      throw error;
    }
  }

  // DELETE

  async deleteById(id) {
    try {
      const instance: any = await Users.findById(id);
      return await instance.destroy();
    } catch (error) {
      throw error;
    }
  }

  async deleteWithWhere(whereObj) {
    try {
      const instance: any = await Users.findOne({ where: whereObj })
      return await instance.destroy();
    } catch (error) {
      throw error;
    }
  }


  async findUserLayersByUserId(id: string) {
    try {
      let user: any = await Users.findOne({
        where: { id },
        include: [Layers]
      });
      return user.layers.map(user => {
        let jsonInstance = user.toJSON();
        delete jsonInstance.password;
        return jsonInstance;
      });
    } catch (err) {
      throw await new Error(err);
    }
  }

  verifyPassword(password: string, instansePassword: string) {
    return bcrypt.compare(password, instansePassword);
  }

  async login(creditals) {
    try {
      let user: any = await Users.findOne({
        where: { email: creditals.email },
        include: [Roles, Groups]
      });
      if (!user) throw new UnauthorizedException('Пользователя с таким email не существует');
      let verifyPasswordResult = await this.verifyPassword(creditals.password, user.password);
      if (!verifyPasswordResult) throw new UnauthorizedException('Не верный пароль');
      let jsonInstance = user.toJSON();
      delete jsonInstance.password;
      return { user: jsonInstance, token: this.tokenService.sign(user) };
    } catch (error) {
      throw error;
    }
  }

  async userInfo(authorizationHeader) {
    try {
      let token = process.env.JWT_AUTH_HEADER_PREFIX ? authorizationHeader.split(process.env.JWT_AUTH_HEADER_PREFIX)[1] : authorizationHeader;
      token = token.trim();
      const userData: any = this.tokenService.decode(token);
      let user: any = await Users.findById(userData.id, {
        include: [Roles, Groups]
      });
      if (!user) throw new UnauthorizedException('Пользователя не существует');
      let jsonInstance = user.toJSON();
      delete jsonInstance.password;
      return { user: jsonInstance };
    } catch (error) {
      throw error;
    }
  }

  async refreshToken(authorizationHeader) {
    try {
      let token = process.env.JWT_AUTH_HEADER_PREFIX ? authorizationHeader.split(process.env.JWT_AUTH_HEADER_PREFIX)[1] : authorizationHeader;
      token = token.trim();
      const userData: any = this.tokenService.decode(token);
      let user: any = await Users.findById(userData.id, {
        include: [Roles, Groups]
      });
      if (!user) throw new UnauthorizedException('Пользователя не существует');
      if (!user.group.access) throw new UnauthorizedException('Группа пользователей не обслуживается');
      return { token: this.tokenService.sign(user) };
    } catch (error) {
      throw error;
    }
  }

  async registration(creditals) {
    try {
      let userCheck: any = await Users.findOne({
        where: {
          email: creditals.email
        }
      });
      if (userCheck) throw new BadRequestException('Пользователь с таким email уже существует');
      if (!creditals.role_id) creditals.role_id = 'ced206c7-c67c-4afd-8ba3-ff275a429c32'; //trainee
      if (!creditals.group_id) creditals.group_id = '1a98a3bb-da99-423c-bf2d-d4c2ee89a725'; // TEMPGROUP без доступа

      let newUser: any = await Users.create(creditals);
      let user: any = await Users.findOne({
        where: { email: creditals.email },
        include: [Roles, Groups]
      });
      let jsonInstance = user.toJSON();

      delete jsonInstance.password;
      return { user: jsonInstance, token: this.tokenService.sign(user) };
    } catch (error) {
      console.log(error)
      throw error;
    }
  }
}

