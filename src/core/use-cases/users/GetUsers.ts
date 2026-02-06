import { User } from "../../entities/User";
import { IUserRepository } from "../../repositories/IUserRepository";

export class GetUsers {
  constructor(private userRepository: IUserRepository) {}

  async execute(tenantId: string, filters?: { query?: string; role?: string }): Promise<{
    success: boolean;
    data?: User[];
    message?: string;
  }> {
    const response = await this.userRepository.findAll(tenantId, filters);
    return {
      success: true,
      data: response,
      message: "Users retrieved successfully",
    }
  }
}
