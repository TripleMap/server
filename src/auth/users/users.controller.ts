import { Body, Controller, UseGuards, Query, Delete, Get, Param, Post, Put, Patch, Options, Headers } from "@nestjs/common";
import { UsersService } from "./users.service";
import { AccessGuard } from '../guards/access.guard';
import { Roles } from '../roles/roles.decorator';

@UseGuards(AccessGuard)
@Controller("api/Accounts")
export class UsersController {
	constructor(private readonly UsersService: UsersService) { }

	@Roles('administrator', 'staff')
	@Get()
	async findAll() {
		return this.UsersService.findAll();
	}
	@Roles('administrator')
	@Post()
	async createUsers(@Body() user) {
		return (Array.isArray(user)) ? this.UsersService.createMany(user) : this.UsersService.createOne(user);
	}

	@Roles('administrator')
	@Delete()
	async deleteWithWhere(@Param("where") where) {
		return this.UsersService.deleteWithWhere(where);
	}

	@Roles('administrator', 'staff')
	@Patch()
	async updateWithWhere(@Param("where") where, @Body() data) {
		return this.UsersService.updateWithWhere(where, data);
	}

	@Post('login')
	async login(@Body() cregitals) {
		console.log(cregitals);
		return this.UsersService.login(cregitals);
	}

	@Post('registration')
	async registration(@Body() cregitals) {
		console.log(cregitals);
		return this.UsersService.registration(cregitals);
	}

	@Get('refreshToken')
	async refreshToken(@Headers('authorization') authorizationHeader) {
		return this.UsersService.refreshToken(authorizationHeader);
	}
	@Roles('administrator', 'staff', 'trainee')
	@Get('GetMyInfo')
	async userInfo(@Headers('authorization') authorizationHeader) {
		console.log(authorizationHeader);
		return this.UsersService.userInfo(authorizationHeader);
	}

	@Roles('administrator', 'staff', 'trainee')
	@Get("userlayers")
	async findUserLayersByUserId(@Query("id") id) {
		return this.UsersService.findUserLayersByUserId(id);
	}

	@Roles('administrator', 'staff')
	@Patch(":id")
	async updateById(@Param("id") id, @Body() data) {
		return this.UsersService.updateById(id, data);
	}

	@Roles('administrator', 'staff')
	@Get(":id")
	async findById(@Param("id") id) {
		return this.UsersService.findById(id);
	}

	@Roles('administrator')
	@Delete(":id")
	async deleteById(@Param("id") id) {
		return this.UsersService.deleteById(id);
	}


}
