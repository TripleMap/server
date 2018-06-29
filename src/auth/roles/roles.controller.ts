import { Body, Controller, UseGuards, Query, Delete, Get, Param, Post, Put, Patch } from "@nestjs/common";
import { RolesService } from "./roles.service";
import { AccessGuard } from '../guards/access.guard';
import { Roles } from '../roles/roles.decorator';

@UseGuards(AccessGuard)
@Controller("api/accounts")
export class UsersController {
	constructor(private readonly RolesService: RolesService) { }
	@Roles('administrator')
	@Get()
	async findAll() {
		return this.RolesService.findAll();
	}

	@Roles('administrator')
	@Post()
	async createUsers(@Body() roles) {
		return (Array.isArray(roles)) ? this.RolesService.createMany(roles) : this.RolesService.createOne(roles);
	}

	@Roles('administrator')
	@Delete()
	async deleteWithWhere(@Param("where") where) {
		return this.RolesService.deleteWithWhere(where);
	}

	@Roles('administrator')
	@Patch()
	async updateWithWhere(@Param("where") where, @Body() data) {
		return this.RolesService.updateWithWhere(where, data);
	}

	@Roles('administrator')
	@Patch(":id")
	async updateById(@Param("id") id, @Body() data) {
		return this.RolesService.updateById(id, data);
	}

	@Roles('administrator')
	@Get(":id")
	async findById(@Param("id") id) {
		return this.RolesService.findById(id);
	}

	@Roles('administrator')
	@Delete(":id")
	async deleteById(@Param("id") id) {
		return this.RolesService.deleteById(id);
	}
}
